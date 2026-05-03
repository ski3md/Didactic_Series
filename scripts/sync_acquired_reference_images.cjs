const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = process.cwd();
const PUBLIC_DIR = path.join(ROOT, 'public', 'reference-library', 'acquired');
const MANIFEST_PATH = path.join(ROOT, 'src', 'content', 'images', 'acquiredLectureImages.json');
const REPORT_PATH = path.join(ROOT, 'src', 'content', 'images', 'acquiredLectureImages.report.json');

const SOURCE_FILES = [
  'src/content/lectures/gu_who_complete_lectures.normalized.json',
  'src/content/lectures/lectures.normalized.json',
  'src/content/lectures/customLectures.ts',
  'src/content/lectures/guPilotEnhancements.ts',
  'src/content/gu/who_gu_entity_manifest.json',
  'src/content/images/bladderAtlasSupplement.json',
  'scripts/commons_image_sources.cjs',
];

const IMAGE_KEYS = new Set(['imageUrl', 'fullUrl', 'thumbUrl', 'src', 'staticImageUrl']);
const SOURCE_KEYS = ['sourcePageUrl', 'sourceUrl', 'source', 'gcsPath'];
const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp']);

const isImageUrl = (value) => {
  if (typeof value !== 'string' || !/^https?:\/\//i.test(value)) return false;
  try {
    const url = new URL(value);
    if (url.hostname === 'commons.wikimedia.org' && url.pathname.startsWith('/wiki/File:')) {
      return false;
    }
    const match = decodeURIComponent(url.pathname).match(/\.([a-z0-9]+)(?:$|\/)/i);
    return Boolean(match && IMAGE_EXTENSIONS.has(match[1].toLowerCase()));
  } catch {
    return false;
  }
};

const extensionForUrl = (value) => {
  try {
    const url = new URL(value);
    const match = decodeURIComponent(url.pathname).match(/\.([a-z0-9]+)(?:$|\/)/i);
    const ext = match?.[1]?.toLowerCase();
    return IMAGE_EXTENSIONS.has(ext) ? (ext === 'jpeg' ? 'jpg' : ext) : 'jpg';
  } catch {
    return 'jpg';
  }
};

const filenameStem = (value) => {
  try {
    const url = new URL(value);
    const decoded = decodeURIComponent(url.pathname);
    const parts = decoded.split('/').filter(Boolean);
    const withExt = parts.findLast((part) => /\.[a-z0-9]+$/i.test(part)) ?? parts.at(-1) ?? 'image';
    return withExt.replace(/\.[a-z0-9]+$/i, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  } catch {
    return 'Acquired lecture image';
  }
};

const sanitizeId = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'image';

const textArray = (value) => (Array.isArray(value) ? value.filter((item) => typeof item === 'string') : []);

const pickSourceUrl = (object) => {
  for (const key of SOURCE_KEYS) {
    if (typeof object[key] === 'string' && /^https?:\/\//i.test(object[key])) {
      return object[key];
    }
  }
  return undefined;
};

const recordFor = (url, object, sourceFile) => {
  const title = object.title || object.entity || object.alt || filenameStem(url);
  const description =
    object.caption ||
    object.description ||
    object.teachingPoint ||
    object.summary ||
    `Acquired lecture image for ${title}.`;
  const sourceUrl = pickSourceUrl(object);
  const tags = Array.from(
    new Set(
      [
        object.stain,
        object.family,
        object.organ,
        object.system,
        object.lectureId,
        object.category,
        ...(textArray(object.tags)),
        ...(textArray(object.cells)),
      ].filter(Boolean)
    )
  );

  return {
    originalUrl: url,
    sourceUrl,
    title,
    description,
    entity: object.entity || title,
    family: object.family || object.organ || object.system,
    stain: object.stain,
    magnification: object.magnification || object.viewLabel,
    tags,
    sourceFile,
  };
};

const collectFromJson = (value, sourceFile, records) => {
  if (Array.isArray(value)) {
    value.forEach((item) => collectFromJson(item, sourceFile, records));
    return;
  }

  if (!value || typeof value !== 'object') {
    return;
  }

  for (const [key, item] of Object.entries(value)) {
    if (IMAGE_KEYS.has(key) && isImageUrl(item)) {
      records.push(recordFor(item, value, sourceFile));
    }
  }

  for (const item of Object.values(value)) {
    collectFromJson(item, sourceFile, records);
  }
};

const collectFromText = (text, sourceFile, records) => {
  const quotedUrlPattern = /\b(?:imageUrl|staticImageUrl|fullUrl|thumbUrl|src):\s*['"`](https?:\/\/[^'"`]+?)['"`]/g;
  for (const match of text.matchAll(quotedUrlPattern)) {
    const originalUrl = match[1];
    if (!isImageUrl(originalUrl)) continue;

    const start = Math.max(0, match.index - 600);
    const end = Math.min(text.length, match.index + originalUrl.length + 800);
    const context = text.slice(start, end);
    const sourceMatch = context.match(/sourcePageUrl:\s*['"`](https?:\/\/[^'"`]+)['"`]/);
    const title = filenameStem(originalUrl);
    records.push({
      originalUrl,
      sourceUrl: sourceMatch?.[1],
      title,
      description: `Acquired lecture image for ${title}.`,
      entity: title,
      tags: ['lecture-acquired'],
      sourceFile,
    });
  }
};

const collectRecords = () => {
  const records = [];
  for (const relativePath of SOURCE_FILES) {
    const absolutePath = path.join(ROOT, relativePath);
    if (!fs.existsSync(absolutePath)) continue;

    const text = fs.readFileSync(absolutePath, 'utf8');
    if (relativePath.endsWith('.json')) {
      collectFromJson(JSON.parse(text), relativePath, records);
    } else {
      collectFromText(text, relativePath, records);
    }
  }

  const deduped = new Map();
  for (const record of records) {
    const existing = deduped.get(record.originalUrl);
    if (!existing) {
      deduped.set(record.originalUrl, record);
      continue;
    }

    deduped.set(record.originalUrl, {
      ...existing,
      sourceUrl: existing.sourceUrl || record.sourceUrl,
      title: existing.title || record.title,
      description: existing.description || record.description,
      entity: existing.entity || record.entity,
      family: existing.family || record.family,
      stain: existing.stain || record.stain,
      magnification: existing.magnification || record.magnification,
      tags: Array.from(new Set([...(existing.tags || []), ...(record.tags || [])])),
      sourceFile: Array.from(new Set([existing.sourceFile, record.sourceFile].flat())).filter(Boolean),
    });
  }

  return Array.from(deduped.values()).sort((left, right) => left.title.localeCompare(right.title));
};

const sha1 = (value) => crypto.createHash('sha1').update(value).digest('hex');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isProbablyImageFile = (absolutePath) => {
  if (!fs.existsSync(absolutePath)) {
    return false;
  }
  const header = fs.readFileSync(absolutePath).subarray(0, 16);
  return (
    (header[0] === 0xff && header[1] === 0xd8) ||
    header.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) ||
    header.subarray(0, 6).toString('ascii') === 'GIF87a' ||
    header.subarray(0, 6).toString('ascii') === 'GIF89a' ||
    header.subarray(0, 4).toString('ascii') === 'RIFF'
  );
};

const fetchImage = async (url) => {
  const attempts = Number(process.env.ACQUIRED_IMAGE_ATTEMPTS || 1);
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Didactic-Series-Reference-Library/1.0 (local pathology residency teaching material sync)',
        Accept: 'image/avif,image/webp,image/png,image/jpeg,image/gif,*/*;q=0.8',
      },
    });
    clearTimeout(timeout);

    if (response.ok) {
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.startsWith('image/')) {
        throw new Error(`Non-image response: ${contentType || 'unknown content-type'}`);
      }
      return response;
    }

    if ((response.status === 429 || response.status >= 500) && attempt < attempts) {
      const retryAfter = Number(response.headers.get('retry-after'));
      await sleep(Number.isFinite(retryAfter) ? Math.min(retryAfter * 1000, 10000) : attempt * 3500);
      continue;
    }

    throw new Error(`HTTP ${response.status}`);
  }

  throw new Error('Download attempts exhausted');
};

const downloadImage = async (record) => {
  const hash = sha1(record.originalUrl);
  const ext = extensionForUrl(record.originalUrl);
  const localFilename = `${hash}.${ext}`;
  const localAbsolutePath = path.join(PUBLIC_DIR, localFilename);

  if (fs.existsSync(localAbsolutePath) && !isProbablyImageFile(localAbsolutePath)) {
    fs.unlinkSync(localAbsolutePath);
  }

  if (!fs.existsSync(localAbsolutePath)) {
    const response = await fetchImage(record.originalUrl);
    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(localAbsolutePath, buffer);
  }

  return {
    ...record,
    id: `acquired_${sanitizeId(record.title)}_${hash.slice(0, 10)}`,
    src: `reference-library/acquired/${localFilename}`,
    gcsPath: record.sourceUrl || record.originalUrl,
    uploader: 'Acquired Lecture Image Pipeline',
    timestamp: 0,
    category: 'official',
    difficulty: 'intermediate',
    atlasCollection: 'acquired',
    readOnly: true,
    originalUrl: record.originalUrl,
  };
};

const main = async () => {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  fs.mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true });

  const records = collectRecords();
  const acquired = [];
  const failures = [];

  for (const record of records) {
    try {
      acquired.push(await downloadImage(record));
      await sleep(500);
    } catch (error) {
      failures.push({
        originalUrl: record.originalUrl,
        title: record.title,
        sourceFile: record.sourceFile,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(acquired, null, 2)}\n`);
  fs.writeFileSync(
    REPORT_PATH,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        sourceFileCount: SOURCE_FILES.length,
        discoveredCount: records.length,
        acquiredCount: acquired.length,
        failureCount: failures.length,
        failures,
      },
      null,
      2
    )}\n`
  );

  console.log(`Discovered ${records.length} image URLs.`);
  console.log(`Stored ${acquired.length} images in ${path.relative(ROOT, PUBLIC_DIR)}.`);
  if (failures.length > 0) {
    console.error(`Failed to store ${failures.length} images. See ${path.relative(ROOT, REPORT_PATH)}.`);
    process.exitCode = 1;
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
