// FIX: Removed circular import of 'Section' from the same file.
export enum Section {
  LECTURE = 'Lecture',
  HOME = 'Home',
  REFERENCE_LIBRARY = 'Reference Library',
  SIGN_OUT_SIMULATOR = 'Sign-Out Simulator',
  VISUAL_CHALLENGE = 'Visual Challenge',
  DIAGNOSTIC_PATHWAY = 'Diagnostic Pathway',
  ANALYSIS = 'Analysis Phase',
  DESIGN = 'Design Phase',
  DEVELOPMENT = 'Development Phase',
  EVALUATION = 'Evaluation & Assessment',
  ADMIN = 'Admin View',
}

export interface User {
  username: string;
  email: string;
  isAdmin?: boolean;
}

// User details stored in the database
export interface StoredUser extends User {
  passwordHash: string;
  resetToken?: string;
  resetTokenExpires?: number;
}

// Login analytics record
export interface LoginHistory {
  timestamp: number;
  ip: string;
  userAgent: string;
}

export interface CaseData {
  clinicalHistory: string;
  radiologicFindings: string;
  histologicDescription: string;
  diagnosis: string;
}

export interface StoredImage {
  id: string;
  src: string; // Public URL to the image, now from GCS
  gcsPath: string; // Path within GCS bucket, for backend operations
  title: string;
  description: string;
  uploader: string;
  timestamp: number;
  category: 'official' | 'community'; // To distinguish between admin-curated and user-submitted images
  tags?: string[];
  // Optional enriched data
  entity?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  cells?: string[];
}

export interface QuizAnswer {
  question: string;
  selectedAnswer: string;
  isCorrect: boolean;
  timestamp: number;
}

export interface SignOutLog {
  caseTopic: string;
  userReport: string;
  feedback: string;
  timestamp: number;
}


export interface UserActivity {
  currentSection?: Section;
  Analysis?: Record<string, QuizAnswer>;
  Evaluation?: QuizAnswer[];
  VisualChallenge?: Record<string, QuizAnswer>;
  SignOutSimulator?: SignOutLog[];
  // Keep track of visited sections for progress
  visitedSections?: Section[];
  [key: string]: any;
}

// Case Authoring Types
export interface CaseMetadataRules {
  version: string;
  schema: string;
  entities: Record<string, {
    category: string;
    patterns: Array<{ keyword: string; description: string }>;
    cells: string[];
    difficulty: string;
    tags: string[];
    teachingPoint: string;
    caseContext: string;
  }>;
  stainRoles: Record<string, string>;
  difficultyLevels: Record<string, string>;
  caseTypes: Record<string, string>;
}

export interface Case {
  caseId: string;
  title: string;
  entity: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  caseType: 'classic' | 'atypical' | 'mimic' | 'complicated';
  description: string;
  caseContext: string;
  learningObjectives: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CaseImage extends StoredImage {
  caseId: string;
  imageId: string; // A unique ID within the case
  stain: string;
}

export interface CaseStudy extends Case {
    images: Array<{
        imageId: string;
        path: string; // This is `src` from StoredImage
        stain: string;
        caption: string;
        findings: string[];
    }>;
    discussion: string;
    teachingPoints: string[];
    references: string[];
    mcqs?: MCQ[];
}


// Types for imported educational content
export interface CaseTutorial {
  title: string;
  clinicalVignette: string;
  objective: string;
  caseDiscussion: string;
  teachingPoints: string[];
  references: string[];
  histologyImage?: {
    src: string;
    alt: string;
    caption: string;
  };
  // Add a gold standard report for the simulator
  goldStandardReport: {
    finalDiagnosis: string;
    microscopicDescription: string;
    comment: string;
  };
}

export interface MCQ {
  topic: string;
  question: string;
  choices: string[];
  answer: string;
  rationale: string;
}

export interface Flashcard {
  front: string;
  back: string;
  tag: string;
}

export interface ModuleData {
  topic: string;
  case_tutorial: CaseTutorial;
  mcqs: MCQ[];
  flashcards: Flashcard[];
  status: string;
}
