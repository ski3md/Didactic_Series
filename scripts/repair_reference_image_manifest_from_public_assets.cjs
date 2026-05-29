const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = process.cwd();
const PUBLIC_ROOT = path.join(ROOT, 'public', 'reference-library', 'local-teaching');
const SRC_INDEX = path.join(ROOT, 'src', 'content', 'images', 'apcpboards_reference_images.json');
const PUBLIC_INDEX = path.join(ROOT, 'public', 'reference-images', 'apcpboards_reference_images.json');
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

const titleCase = (value) =>
  value
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/\bPdf\b/g, 'PDF')
    .replace(/\bH&e\b/g, 'H&E');

const titleFromFilename = (filePath) => {
  const base = path.basename(filePath, path.extname(filePath));
  return titleCase(
    base
      .replace(/-[a-f0-9]{10,40}$/i, '')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  );
};

const sha1 = (value) => crypto.createHash('sha1').update(value).digest('hex');

const walkImages = (directory, output = []) => {
  if (!fs.existsSync(directory)) return output;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walkImages(fullPath, output);
      continue;
    }
    if (entry.isFile() && IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      output.push(fullPath);
    }
  }
  return output;
};

const readExistingImages = () => {
  if (!fs.existsSync(SRC_INDEX)) return [];
  const parsed = JSON.parse(fs.readFileSync(SRC_INDEX, 'utf8'));
  return Array.isArray(parsed.images) ? parsed.images : [];
};

const localPathFromFile = (filePath) =>
  path.relative(path.join(ROOT, 'public'), filePath).split(path.sep).join('/');

const specialtyLabel = (specialty) => (specialty === 'general' ? 'Anatomic pathology' : specialty.replace(/-/g, ' '));

const existingImages = readExistingImages();
const existingByLocalPath = new Map(
  existingImages
    .filter((image) => typeof image.localPath === 'string' && image.localPath)
    .map((image) => [image.localPath, image])
);

const publicImageFiles = walkImages(PUBLIC_ROOT).sort();
const generatedAt = new Date(
  publicImageFiles.reduce((latest, filePath) => Math.max(latest, fs.statSync(filePath).mtimeMs), 0)
).toISOString();

const repairedImages = publicImageFiles.map((filePath) => {
    const localPath = localPathFromFile(filePath);
    const existing = existingByLocalPath.get(localPath);
    if (existing) {
      return {
        ...existing,
        imageUrl: undefined,
        exists: true,
      };
    }

    const specialty = path.basename(path.dirname(filePath));
    const title = titleFromFilename(filePath);
    const stat = fs.statSync(filePath);
    const digest = sha1(localPath);
    const label = specialtyLabel(specialty);
    return {
      id: `local-teaching-${digest.slice(0, 16)}`,
      title,
      specialty,
      localPath,
      sourcePath: localPath,
      sourceRelativePath: localPath,
      sourceDocument: title,
      caption: `${label.charAt(0).toUpperCase()}${label.slice(1)} teaching image from ${title}. Review morphology and ancillary-study context with the source material.`,
      sourceRoot: 'public/reference-library/local-teaching',
      sourceCollection: 'public-local-teaching',
      sourceType: 'public-asset-repair',
      bytes: stat.size,
      extension: path.extname(filePath).slice(1).toLowerCase().replace('jpeg', 'jpg'),
      sha1: digest,
      importedAt: new Date(stat.mtimeMs).toISOString(),
      dryRun: false,
      exists: true,
    };
  });

const specialtyCounts = repairedImages.reduce((counts, image) => {
  counts[image.specialty] = (counts[image.specialty] || 0) + 1;
  return counts;
}, {});

const manifest = {
  generatedAt,
  repairMode: 'public-assets-only',
  note: 'Rebuilt from browser-addressable files under public/reference-library/local-teaching. Dev-only /@fs source paths are intentionally excluded.',
  sourceRoots: ['public/reference-library/local-teaching'],
  missingRoots: [],
  dryRun: false,
  appendExistingIndex: false,
  includeAllImages: false,
  serveFromSource: false,
  imageCount: repairedImages.length,
  specialtyCounts,
  images: repairedImages,
};

fs.mkdirSync(path.dirname(SRC_INDEX), { recursive: true });
fs.writeFileSync(SRC_INDEX, `${JSON.stringify(manifest, null, 2)}\n`);
fs.mkdirSync(path.dirname(PUBLIC_INDEX), { recursive: true });
fs.writeFileSync(PUBLIC_INDEX, `${JSON.stringify(manifest, null, 2)}\n`);

const badAtFs = repairedImages.filter((image) => String(image.imageUrl || '').startsWith('/@fs/')).length;
console.log(
  `[reference-image-repair] wrote ${repairedImages.length} browser-addressable images; dev-only /@fs entries: ${badAtFs}`
);
