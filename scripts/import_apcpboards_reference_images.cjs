const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');
const { spawnSync } = require('child_process');

const ROOT = process.cwd();
const DEFAULT_SOURCE_ROOT = '/Volumes/APCPBoards';
const OUT_DIR = path.join(ROOT, 'public', 'reference-library', 'local-teaching');
const OUT_INDEX = path.join(ROOT, 'src', 'content', 'images', 'apcpboards_reference_images.json');
const OUT_PUBLIC_INDEX = path.join(ROOT, 'public', 'reference-images', 'apcpboards_reference_images.json');

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.tif', '.tiff']);
const PDF_EXTENSION = '.pdf';
const SKIP_SEGMENTS = new Set([
  '#recycle',
  '$RECYCLE.BIN',
  '.cache',
  '.git',
  '.pytest_cache',
  '.venv',
  '__pycache__',
  'build',
  'coverage',
  'dist',
  'google-cloud-sdk',
  'node_modules',
  'venv',
]);
const SKIP_EXACT_FILENAMES = new Set(['.DS_Store', 'Thumbs.db']);
const SKIP_NAME_PATTERNS = [/screenshot/i, /mnemonic/i, /diagram/i, /table/i, /score/i, /headshot/i, /logo/i, /icon/i];
const DEFAULT_MAX_FILES = 300;

const args = process.argv.slice(2);
const getArg = (name) => {
  const prefixed = args.find((arg) => arg.startsWith(`${name}=`));
  if (prefixed) return prefixed.slice(name.length + 1);
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};

const splitPaths = (value) =>
  value
    .split(path.delimiter)
    .flatMap((entry) => entry.split(','))
    .map((entry) => entry.trim())
    .filter(Boolean);

const rootsInput = getArg('--roots') || getArg('--root') || process.env.APCPBOARDS_IMAGE_ROOTS || process.env.APCPBOARDS_IMAGE_ROOT || DEFAULT_SOURCE_ROOT;
const sourceRoots = splitPaths(rootsInput).map((entry) => path.resolve(entry));
const maxDepth = Number(getArg('--max-depth') || process.env.APCPBOARDS_IMAGE_MAX_DEPTH || 5);
const maxFilesInput = getArg('--max-files') || process.env.APCPBOARDS_IMAGE_MAX_FILES || String(DEFAULT_MAX_FILES);
const maxFiles = /^(all|unlimited|none|0)$/i.test(maxFilesInput) ? Infinity : Number(maxFilesInput);
const dryRun = args.includes('--dry-run');
const includeRecycle = args.includes('--include-recycle');
const includeScreenshots = args.includes('--include-screenshots');
const includeAllImages = args.includes('--include-all-images') || args.includes('--all-images');
const serveFromSource = args.includes('--serve-from-source');
const includeBroadPathologyMatches = !args.includes('--strict-histology-root');
const includePdf = !args.includes('--no-pdf');
const maxImagesPerPdf = Number(getArg('--max-images-per-pdf') || process.env.APCPBOARDS_MAX_IMAGES_PER_PDF || 3);

const normalize = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const specialtyFromText = (text) => {
  const value = normalize(text);
  const rules = [
    ['breast', ['breast', 'radial scar', 'metaplastic', 'myoepithelioma', 'pseudoangiomatous']],
    ['gynecologic', ['vulva', 'vavin', 'dvin', 'vin', 'endometr', 'ovary', 'ovarian', 'mole', 'hydatidiform', 'mesonephric']],
    ['genitourinary', ['urothelial', 'bladder', 'renal', 'kidney', 'rcc', 'nephrogenic', 'epididymis', 'prostate']],
    ['thoracic', ['lung', 'pleura', 'mesothelioma', 'small cell', 'nsclc', 'uip', 'asbestos', 'carcinoid', 'bronchus']],
    ['hematopathology', ['leukemia', 'lymphoma', 'marrow', 'heme', 'myeloid', 't cell']],
    ['neuropathology', ['brain', 'cns', 'neuro', 'glioma']],
    ['head-neck', ['thyroid', 'salivary', 'sinonasal', 'oral', 'oropharyngeal', 'warty carcinoma']],
    ['hepatobiliary-pancreas', ['liver', 'hepatic', 'biliary', 'gallbladder', 'cholangiocarcinoma', 'pancreas', 'pancreatic']],
    ['gastrointestinal', ['appendix', 'colon', 'colorectal', 'esophagus', 'gastric', 'gastrointestinal', 'stomach', 'small intestine', 'duodenum']],
    ['bone-soft-tissue', ['bone', 'cartilage', 'sarcoma', 'soft tissue', 'liposarcoma', 'myxoid', 'osteosarcoma', 'chondrosarcoma']],
    ['dermatopathology', ['skin', 'melanocytic', 'melanoma', 'dermatopathology', 'basal cell', 'squamous cell']],
    ['cytopathology', ['cytology', 'pap', 'fna', 'smear', 'cell block']],
    ['infectious', ['fungal', 'histoplasmosis', 'cryptococcus', 'ascaris', 'plasmodium', 'microfilariae', 'parasite']],
  ];
  return rules.find(([, terms]) => terms.some((term) => value.includes(term)))?.[0] || 'general';
};

const titleFromFilename = (filePath) =>
  path
    .basename(filePath, path.extname(filePath))
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const sourceDocumentFromPath = (filePath) => {
  const base = path.basename(filePath, path.extname(filePath));
  const match = base.match(/^(.+?)(?:_page\d+|_img\d+|_p\d+|$)/i);
  return (match?.[1] || base)
    .replace(/\.(pdf|pptx?)$/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const pageNumberFromPath = (filePath) => {
  const match = path.basename(filePath).match(/(?:^|[_-])page(\d+)(?:[_-]|$)/i);
  return match ? Number(match[1]) : undefined;
};

const captionFromSource = ({ specialty, sourcePath }) => {
  const documentTitle = sourceDocumentFromPath(sourcePath);
  const pageNumber = pageNumberFromPath(sourcePath);
  const specialtyLabel = specialty === 'general' ? 'Anatomic pathology' : specialty.replace('-', ' ');
  const pageText = pageNumber ? `, page ${pageNumber}` : '';
  return `${specialtyLabel.charAt(0).toUpperCase()}${specialtyLabel.slice(1)} teaching image from ${documentTitle}${pageText}. Review morphology and ancillary-study context with the source material.`;
};

const isHistologyRoot = (filePath) => /(?:^|[/\\])histo(?:logy)?(?:[/\\]|$)/i.test(filePath);

const clinicallyRelevantPath = (filePath) => {
  const value = normalize(filePath);
  const terms = [
    'adenoma',
    'adenocarcinoma',
    'biopsy',
    'carcinoma',
    'case image',
    'cell block',
    'cytology',
    'diagnostic',
    'dysplasia',
    'fna',
    'gross',
    'histology',
    'histologic',
    'histo',
    'ihc',
    'immunohistochemistry',
    'microscopy',
    'microscopic',
    'neoplasm',
    'pathology',
    'resection',
    'sarcoma',
    'slide',
    'smear',
    'stain',
    'tumor',
    'tumour',
  ];
  const organTerms = [
    'adrenal',
    'appendix',
    'biliary',
    'bladder',
    'bone',
    'breast',
    'cervix',
    'colon',
    'endometrium',
    'esophagus',
    'gallbladder',
    'gi',
    'gyn',
    'kidney',
    'larynx',
    'liver',
    'lung',
    'lymphoma',
    'marrow',
    'mediastinum',
    'neuro',
    'oral',
    'ovary',
    'pancreas',
    'prostate',
    'renal',
    'salivary',
    'skin',
    'soft tissue',
    'stomach',
    'testes',
    'testis',
    'thoracic',
    'thyroid',
    'uterus',
    'vagina',
    'vulva',
  ];
  return terms.some((term) => value.includes(term)) || organTerms.some((term) => value.includes(term));
};

const shouldSkip = (filePath) => {
  const segments = filePath.split(path.sep);
  const baseName = path.basename(filePath);
  if (!includeRecycle && segments.some((segment) => SKIP_SEGMENTS.has(segment))) return true;
  if (SKIP_EXACT_FILENAMES.has(baseName) || baseName.startsWith('._')) return true;
  if (!includeScreenshots && SKIP_NAME_PATTERNS.some((pattern) => pattern.test(path.basename(filePath)))) return true;
  return false;
};

const shouldIncludeImage = (filePath) => {
  if (includeAllImages) return true;
  if (isHistologyRoot(filePath)) return true;
  if (!includeBroadPathologyMatches) return false;
  return clinicallyRelevantPath(filePath);
};

const walk = (directory, depth = 0, output = []) => {
  if (depth > maxDepth || output.length >= maxFiles) return output;
  let entries = [];
  try {
    entries = fs.readdirSync(directory, { withFileTypes: true });
  } catch (error) {
    return output;
  }
  for (const entry of entries) {
    if (output.length >= maxFiles) break;
    const fullPath = path.join(directory, entry.name);
    if (shouldSkip(fullPath)) continue;
    if (entry.isDirectory()) {
      walk(fullPath, depth + 1, output);
      continue;
    }
    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name).toLowerCase();
    if ((IMAGE_EXTENSIONS.has(ext) || (includePdf && ext === PDF_EXTENSION)) && shouldIncludeImage(fullPath)) output.push(fullPath);
  }
  return output;
};

const hashFile = (filePath) => {
  const hash = crypto.createHash('sha1');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
};

const hashText = (value) => crypto.createHash('sha1').update(value).digest('hex');

const browserSafeExtension = (filePath) => {
  const ext = path.extname(filePath).toLowerCase().replace('.jpeg', '.jpg');
  return ['.tif', '.tiff'].includes(ext) ? '.jpg' : ext;
};

const copyBrowserSafeImage = (sourcePath, outputPath) => {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const sourceExt = path.extname(sourcePath).toLowerCase();
  if (['.tif', '.tiff'].includes(sourceExt)) {
    const result = spawnSync('sips', ['-s', 'format', 'jpeg', sourcePath, '--out', outputPath], {
      encoding: 'utf8',
    });
    if (result.status !== 0) throw new Error(result.stderr || result.stdout || 'sips TIFF conversion failed.');
    return;
  }
  fs.copyFileSync(sourcePath, outputPath);
};

const sourceRelativePath = (sourceRoot, sourcePath) => path.relative(sourceRoot, sourcePath).split(path.sep).join('/');

const sourceUrlForPath = (sourcePath) =>
  `/@fs${sourcePath
    .split(path.sep)
    .map((segment) => encodeURIComponent(segment))
    .join('/')}`;

const pdfImagesAvailable = () => {
  const result = spawnSync('command', ['-v', 'pdfimages'], { shell: true, encoding: 'utf8' });
  return result.status === 0;
};

const extractPdfImages = (pdfPath) => {
  if (!includePdf || !pdfImagesAvailable()) return [];
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pathfndr-local-pdf-images-'));
  const prefix = path.join(tempDir, 'image');
  const result = spawnSync('pdfimages', ['-all', pdfPath, prefix], { encoding: 'utf8' });
  if (result.status !== 0) return [];
  return fs
    .readdirSync(tempDir)
    .map((file) => path.join(tempDir, file))
    .filter((file) => {
      const ext = path.extname(file).toLowerCase();
      if (!IMAGE_EXTENSIONS.has(ext)) return false;
      try {
        return fs.statSync(file).size > 20 * 1024;
      } catch (error) {
        return false;
      }
    })
    .sort((a, b) => fs.statSync(b).size - fs.statSync(a).size)
    .slice(0, maxImagesPerPdf);
};

const images = [];
const seenDigests = new Set();
const missingRoots = [];
const sourceFilesByRoot = [];

for (const sourceRoot of sourceRoots) {
  if (!fs.existsSync(sourceRoot)) {
    missingRoots.push(sourceRoot);
    sourceFilesByRoot.push({ sourceRoot, files: [] });
    continue;
  }
  sourceFilesByRoot.push({ sourceRoot, files: walk(sourceRoot, 0, []) });
}

fs.mkdirSync(OUT_DIR, { recursive: true });

for (const { sourceRoot, files } of sourceFilesByRoot) {
  for (const sourcePath of files) {
    const sourceExt = path.extname(sourcePath).toLowerCase();
    const importSources =
      sourceExt === PDF_EXTENSION
        ? extractPdfImages(sourcePath).map((imagePath, index) => ({
            importPath: imagePath,
            sourcePath,
            titleSuffix: ` figure ${index + 1}`,
            sourceType: 'pdf-extracted-image',
          }))
        : [{ importPath: sourcePath, sourcePath, titleSuffix: '', sourceType: 'local-image' }];
    for (const importSource of importSources) {
    let stat = null;
    try {
      stat = fs.statSync(importSource.importPath);
    } catch (error) {
      continue;
    }
    if (!stat.size) continue;
    const title = `${titleFromFilename(importSource.sourcePath)}${importSource.titleSuffix}`;
    const specialty = specialtyFromText(`${sourcePath} ${title}`);
    const ext = browserSafeExtension(importSource.importPath);
    const digest = serveFromSource
      ? hashText(`${importSource.importPath}|${stat.size}|${Math.round(stat.mtimeMs)}`)
      : hashFile(importSource.importPath);
    if (seenDigests.has(digest)) continue;
    seenDigests.add(digest);
    const safeTitle = normalize(title).replace(/\s+/g, '-').slice(0, 64) || 'local-teaching-image';
    const fileName = `${safeTitle}-${digest.slice(0, 10)}${ext}`;
    const localRelativePath = path.posix.join('reference-library', 'local-teaching', specialty, fileName);
    const outputPath = path.join(ROOT, 'public', localRelativePath);
    if (!dryRun && !serveFromSource) {
      if (!fs.existsSync(outputPath)) copyBrowserSafeImage(importSource.importPath, outputPath);
    }
    images.push({
      id: `local-teaching-${digest.slice(0, 16)}`,
      title,
      specialty,
      localPath: serveFromSource ? '' : localRelativePath,
      imageUrl: serveFromSource ? sourceUrlForPath(importSource.importPath) : undefined,
      sourcePath,
      sourceRelativePath: sourceRelativePath(sourceRoot, sourcePath),
      sourceDocument: sourceDocumentFromPath(sourcePath),
      pageNumber: pageNumberFromPath(sourcePath),
      caption: captionFromSource({ specialty, sourcePath }),
      sourceRoot,
      sourceCollection: path.basename(sourceRoot),
      sourceType: importSource.sourceType,
      bytes: stat.size,
      extension: ext.slice(1),
      sha1: digest,
      importedAt: new Date().toISOString(),
      dryRun,
    });
    }
  }
}

const index = {
  generatedAt: new Date().toISOString(),
  sourceRoots,
  missingRoots,
  dryRun,
  includeAllImages,
  serveFromSource,
  includePdf,
  maxImagesPerPdf,
  maxDepth,
  maxFiles: Number.isFinite(maxFiles) ? maxFiles : 'all',
  imageCount: images.length,
  sourceFileCounts: sourceFilesByRoot.reduce((acc, item) => {
    acc[item.sourceRoot] = item.files.length;
    return acc;
  }, {}),
  rootCounts: images.reduce((acc, image) => {
    acc[image.sourceRoot] = (acc[image.sourceRoot] || 0) + 1;
    return acc;
  }, {}),
  specialtyCounts: images.reduce((acc, image) => {
    acc[image.specialty] = (acc[image.specialty] || 0) + 1;
    return acc;
  }, {}),
  images,
};

fs.mkdirSync(path.dirname(OUT_INDEX), { recursive: true });
fs.writeFileSync(OUT_INDEX, `${JSON.stringify(index, null, 2)}\n`);
fs.mkdirSync(path.dirname(OUT_PUBLIC_INDEX), { recursive: true });
fs.writeFileSync(OUT_PUBLIC_INDEX, `${JSON.stringify(index, null, 2)}\n`);

console.log(
  JSON.stringify(
    {
      output: path.relative(ROOT, OUT_INDEX),
      sourceRoots,
      missingRoots,
      dryRun,
      imageCount: images.length,
      sourceFileCounts: index.sourceFileCounts,
      rootCounts: index.rootCounts,
      specialtyCounts: index.specialtyCounts,
    },
    null,
    2
  )
);

if (missingRoots.length > 0) process.exitCode = 1;
