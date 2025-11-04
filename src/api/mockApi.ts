import {
  User, UserActivity, Case, CaseStudy, StoredUser,
  LoginHistory, StoredImage
} from '../types.ts';
import { getStoreData, setStoreData, deleteStoreData } from '../utils/db.ts';

/* -------------------------------------------------------------------------- */
/*                            Dynamic Gallery Loader                          */
/* -------------------------------------------------------------------------- */

const MANIFEST_URL = "https://storage.googleapis.com/granuloma-lecture-bucket/granulomas/manifest.json";
const IMAGES_KEY = 'pathology_images';

/**
 * Fetch manifest.json from CDN or fallback to static sample data.
 */
const fetchManifest = async (): Promise<StoredImage[]> => {
  try {
    const res = await fetch(MANIFEST_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    // Normalize manifest entries
    return data.map((entry: any, i: number) => ({
      id: entry.id || `img_${i}`,
      src: entry.src,
      gcsPath: entry.src.replace("https://storage.googleapis.com/", ""),
      title: entry.title || "Untitled Image",
      description: entry.description || "",
      uploader: entry.uploader || "system",
      timestamp: entry.timestamp || Date.now(),
      category: entry.category || "official",
      tags: entry.tags || [],
      entity: entry.entity || "",
      difficulty: entry.difficulty || "intermediate",
      cells: entry.cells || [],
    })) as StoredImage[];

  } catch (err) {
    console.warn("⚠️ Manifest load failed; falling back to static gallery:", err);
    return getStaticGalleryFallback();
  }
};

/**
 * Minimal static fallback gallery (used only if manifest load fails).
 */
const getStaticGalleryFallback = (): StoredImage[] => ([
  {
    id: "sarcoidosis_sarcoidosis_60",
    src: "https://storage.googleapis.com/cdn.didacticseries.com/granulomas/sarcoidosis/Unclassified/sarcoidosis_sarcoidosis_60.jpg",
    gcsPath: "granulomas/sarcoidosis/Unclassified/sarcoidosis_sarcoidosis_60.jpg",
    title: "Sarcoidosis",
    description: "A histology image of Sarcoidosis. Stain: Unclassified.",
    uploader: "admin",
    timestamp: 1722550186000,
    category: "official",
    tags: ["granulomas", "sarcoidosis"],
    entity: "sarcoidosis",
    difficulty: "intermediate",
    cells: ["epithelioid histiocytes", "asteroid bodies (sometimes)", "lymphocytes"]
  },
  {
    id: "hypersensitivity_pneumonitis_hypersensitivity_pneumonitis_12",
    src: "https://storage.googleapis.com/cdn.didacticseries.com/granulomas/hypersensitivity_pneumonitis/Unclassified/hypersensitivity_pneumonitis_hypersensitivity_pneumonitis_12.jpg",
    gcsPath: "granulomas/hypersensitivity_pneumonitis/Unclassified/hypersensitivity_pneumonitis_hypersensitivity_pneumonitis_12.jpg",
    title: "Hypersensitivity Pneumonitis",
    description: "A histology image of Hypersensitivity Pneumonitis. Stain: Unclassified.",
    uploader: "admin",
    timestamp: 1722550156000,
    category: "official",
    tags: ["granulomas", "hypersensitivity-pneumonitis"],
    entity: "hypersensitivity-pneumonitis",
    difficulty: "intermediate",
    cells: ["epithelioid histiocytes", "lymphocytes", "plasma cells", "giant cells"]
  }
]);

/* -------------------------------------------------------------------------- */
/*                                   Images                                   */
/* -------------------------------------------------------------------------- */

const getImagesDB = async (): Promise<StoredImage[]> => {
  let images = await getStoreData<StoredImage[]>(IMAGES_KEY);
  if (!images || images.length === 0) {
    images = await fetchManifest();
    await setStoreData(IMAGES_KEY, images);
  }
  return images;
};

export const apiGetGalleryImagesMock = async (): Promise<StoredImage[]> => {
  return await getImagesDB();
};

export const apiUpdateImageMetadataMock = async (updatedImage: StoredImage): Promise<void> => {
  let images = await getImagesDB();
  const index = images.findIndex(img => img.id === updatedImage.id);
  if (index > -1) {
    images[index] = updatedImage;
    await setStoreData(IMAGES_KEY, images);
  } else {
    throw new Error("Image not found for update.");
  }
};

export const apiDeleteImageMock = async (imageToDelete: StoredImage): Promise<void> => {
  let images = await getImagesDB();
  const filtered = images.filter(img => img.id !== imageToDelete.id);
  await setStoreData(IMAGES_KEY, filtered);
};

export const apiUploadImageMock = async (
  file: File,
  title: string,
  description: string,
  uploader: string,
  category: 'official' | 'community'
): Promise<StoredImage> => {
  const newImage: StoredImage = {
    id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    src: URL.createObjectURL(file),  // In real app: replace with signed GCS URL
    gcsPath: `mock/${category}/${file.name}`,
    title,
    description,
    uploader,
    timestamp: Date.now(),
    category,
  };
  let images = await getImagesDB();
  images.unshift(newImage);
  await setStoreData(IMAGES_KEY, images);
  return newImage;
};

/* -------------------------------------------------------------------------- */
/*                            User + Session Logic                            */
/* -------------------------------------------------------------------------- */

const USERS_KEY = 'pathology_users';
const CURRENT_USER_KEY = 'pathology_current_user';
const CURRENT_USER_SESSION_KEY = 'pathology_current_user_session';
const USER_ACTIVITY_KEY = 'pathology_user_activity';
const CASES_KEY = 'pathology_cases';
const CASE_STUDIES_KEY = 'pathology_case_studies';
const LOGIN_HISTORY_KEY = 'pathology_login_history';

/* --------------------------- Default Mocked Users -------------------------- */
const getInitialUsers = (): Record<string, StoredUser> => ({
  admin: {
    username: 'admin',
    email: 'admin@didacticseries.com',
    passwordHash: 'admin123',
    isAdmin: true,
  },
  resident1: {
    username: 'resident1',
    email: 'resident1@pathology.org',
    passwordHash: 'password',
    isAdmin: false,
  },
});

/* ----------------------------- User Management ----------------------------- */
const getUsersDB = async (): Promise<Record<string, StoredUser>> => {
  const users = await getStoreData<Record<string, StoredUser>>(USERS_KEY);
  if (!users) {
    const initialUsers = getInitialUsers();
    await setStoreData(USERS_KEY, initialUsers);
    return initialUsers;
  }
  return users;
};

export const apiLoginUser = async (username: string, password: string): Promise<User> => {
  const users = await getUsersDB();
  const user = users[username];
  if (user && user.passwordHash === password) {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
  throw new Error('Invalid username or password.');
};

export const apiChangePassword = async (username: string, oldPassword: string, newPassword: string): Promise<void> => {
  const users = await getUsersDB();
  const user = users[username];
  if (!user || user.passwordHash !== oldPassword) throw new Error("Invalid current password.");
  user.passwordHash = newPassword;
  await setStoreData(USERS_KEY, users);
};

export const apiGetAllUsers = async (): Promise<Record<string, StoredUser>> => getUsersDB();

/* --------------------------- Session Management ---------------------------- */
export const apiGetCurrentUser = async (): Promise<User | null> =>
  (await getStoreData<User>(CURRENT_USER_KEY)) || null;

export const apiSetCurrentUser = async (user: User): Promise<void> =>
  setStoreData(CURRENT_USER_KEY, user);

export const apiClearCurrentUser = async (): Promise<void> =>
  deleteStoreData(CURRENT_USER_KEY);

export const apiGetCurrentUserSession = async (): Promise<User | null> => {
  try {
    const userJson = sessionStorage.getItem(CURRENT_USER_SESSION_KEY);
    return userJson ? JSON.parse(userJson) : null;
  } catch {
    return null;
  }
};

export const apiSetCurrentUserSession = async (user: User): Promise<void> =>
  sessionStorage.setItem(CURRENT_USER_SESSION_KEY, JSON.stringify(user));

export const apiClearCurrentUserSession = async (): Promise<void> =>
  sessionStorage.removeItem(CURRENT_USER_SESSION_KEY);

/* ------------------------------ Analytics ---------------------------------- */
export const apiGetLoginHistory = async (): Promise<Record<string, LoginHistory[]>> =>
  (await getStoreData<Record<string, LoginHistory[]>>(LOGIN_HISTORY_KEY)) || {};

export const apiTrackLogin = async (username: string, ip: string, userAgent: string): Promise<void> => {
  const history = await apiGetLoginHistory();
  if (!history[username]) history[username] = [];
  history[username].unshift({ timestamp: Date.now(), ip, userAgent });
  history[username] = history[username].slice(0, 20);
  await setStoreData(LOGIN_HISTORY_KEY, history);
};

/* ----------------------------- User Progress ------------------------------- */
export const apiGetAllUserData = async (): Promise<Record<string, UserActivity>> =>
  (await getStoreData<Record<string, UserActivity>>(USER_ACTIVITY_KEY)) || {};

export const apiSaveAllUserData = async (data: Record<string, UserActivity>): Promise<void> =>
  setStoreData(USER_ACTIVITY_KEY, data);

/* ------------------------------- Case Data --------------------------------- */
export const apiGetCases = async (): Promise<{ version: string, generated: string, cases: Record<string, Case> }> =>
  (await getStoreData<any>(CASES_KEY)) || { version: "1.0", generated: new Date().toISOString(), cases: {} };

export const apiSaveCases = async (data: { version: string, generated: string, cases: Record<string, Case> }): Promise<void> =>
  setStoreData(CASES_KEY, data);

export const apiGetCaseStudies = async (): Promise<{ version: string, generated: string, caseStudies: Record<string, CaseStudy> }> =>
  (await getStoreData<any>(CASE_STUDIES_KEY)) || { version: "1.0", generated: new Date().toISOString(), caseStudies: {} };

export const apiSaveCaseStudies = async (data: { version: string, generated: string, caseStudies: Record<string, CaseStudy> }): Promise<void> =>
  setStoreData(CASE_STUDIES_KEY, data);
