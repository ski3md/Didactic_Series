const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const ROOT = process.cwd();
const GU_PATH = path.join(ROOT, 'src', 'content', 'gu', 'gu_signout_sims.json');
const SIM_DIR = path.join(ROOT, 'src', 'content', 'signout_sims');
const OUT_REPORT = path.join(ROOT, 'src', 'content', 'signout_sims', 'local_image_import_report.json');

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.tif', '.tiff']);
const PDF_EXTENSION = '.pdf';
const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'biopsy',
  'case',
  'cell',
  'cells',
  'for',
  'file',
  'gross',
  'he',
  'high',
  'ihc',
  'image',
  'in',
  'low',
  'mag',
  'of',
  'or',
  'pap',
  'pathology',
  'jpg',
  'jpeg',
  'png',
  'webp',
  'gif',
  'svg',
  'tif',
  'tiff',
  'resection',
  'signout',
  'sign',
  'stain',
  'sims',
  'simulation',
  'simulations',
  'the',
  'with',
]);
const GENERIC_MATCH_WORDS = new Set([
  ...STOP_WORDS,
  'adenocarcinoma',
  'benign',
  'carcinoma',
  'excision',
  'invasive',
  'malignant',
  'neoplasm',
  'tumor',
  'tumour',
]);

const args = process.argv.slice(2);
const getArg = (name) => {
  const prefixed = args.find((arg) => arg.startsWith(`${name}=`));
  if (prefixed) return prefixed.slice(name.length + 1);
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};

const dryRun = args.includes('--dry-run');
const replaceExisting = args.includes('--replace');
const includePdf = !args.includes('--no-pdf');
const maxDepth = Number(getArg('--max-depth') || process.env.SIGNOUT_LOCAL_IMAGE_MAX_DEPTH || 8);
const minScore = Number(getArg('--min-score') || process.env.SIGNOUT_LOCAL_IMAGE_MIN_SCORE || 4);
const rootInput = getArg('--roots') || process.env.SIGNOUT_LOCAL_IMAGE_ROOTS || '';
const manifestPath = getArg('--manifest') || process.env.SIGNOUT_LOCAL_IMAGE_MANIFEST || '';

const splitPaths = (value) =>
  value
    .split(path.delimiter)
    .flatMap((entry) => entry.split(','))
    .map((entry) => entry.trim())
    .filter(Boolean);

const sourceRoots = splitPaths(rootInput).map((entry) => path.resolve(entry));
const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));

const normalize = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/%[0-9a-f]{2}/gi, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const tokensFor = (...values) =>
  [...new Set(values.flatMap((value) => normalize(value).split(/\s+/)).filter((token) => token.length > 2 && !STOP_WORDS.has(token)))];

const matchTokensFor = (...values) =>
  [...new Set(values.flatMap((value) => normalize(value).split(/\s+/)).filter((token) => token.length > 2 && !GENERIC_MATCH_WORDS.has(token)))];

const outputExists = (image) => {
  const output = path.join(ROOT, 'public', image.src || '');
  return fs.existsSync(output) && fs.statSync(output).size > 0;
};

const curriculumFiles = [
  GU_PATH,
  ...(fs.existsSync(SIM_DIR)
    ? fs
        .readdirSync(SIM_DIR)
        .filter((file) => file.endsWith('_signout_sims.json'))
        .map((file) => path.join(SIM_DIR, file))
    : []),
];

const targets = [];
for (const filePath of curriculumFiles) {
  const data = readJson(filePath);
  for (const item of data.cases || []) {
    if (!item.image?.src) continue;
    if (!replaceExisting && outputExists(item.image)) continue;
    const sourceBasename = decodeURIComponent(path.basename(item.image.sourceUrl || ''));
    const targetBasename = path.basename(item.image.src);
    const targetStem = targetBasename.replace(path.extname(targetBasename), '');
    targets.push({
      caseId: item.id,
      title: item.title,
      specialty: data.specialty || data.title || path.basename(filePath),
      file: path.relative(ROOT, filePath),
      localPath: item.image.src,
      outputPath: path.join(ROOT, 'public', item.image.src),
      sourceUrl: item.image.sourceUrl || '',
      targetBasename,
      targetStem,
      tokens: tokensFor(item.id, item.title, targetStem, sourceBasename),
      matchTokens: matchTokensFor(item.id, targetStem, sourceBasename),
      specialtyTokens: matchTokensFor(data.specialty || data.title || path.basename(filePath)),
    });
  }
}

const explicitManifest = [];
if (manifestPath) {
  const manifest = readJson(path.resolve(manifestPath));
  const entries = Array.isArray(manifest) ? manifest : manifest.images || manifest.assets || [];
  for (const entry of entries) {
    explicitManifest.push({
      caseId: entry.caseId || entry.id,
      sourcePath: entry.sourcePath || entry.path || entry.file,
      note: entry.note || entry.caption || '',
    });
  }
}

const scanFiles = [];
const scanDirectory = (directory, depth = 0) => {
  if (depth > maxDepth) return;
  let entries = [];
  try {
    entries = fs.readdirSync(directory, { withFileTypes: true });
  } catch (error) {
    return;
  }
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist') continue;
      scanDirectory(fullPath, depth + 1);
      continue;
    }
    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name).toLowerCase();
    if (IMAGE_EXTENSIONS.has(ext) || (includePdf && ext === PDF_EXTENSION)) {
      let stat = null;
      try {
        stat = fs.statSync(fullPath);
      } catch (error) {
        continue;
      }
      scanFiles.push({
        path: fullPath,
        ext,
        size: stat.size,
        normalizedPath: normalize(fullPath),
        normalizedName: normalize(path.basename(fullPath)),
        tokens: new Set(normalize(fullPath).split(/\s+/)),
      });
    }
  }
};

for (const root of sourceRoots) {
  if (fs.existsSync(root)) {
    const stat = fs.statSync(root);
    if (stat.isDirectory()) scanDirectory(root, 0);
    if (stat.isFile()) {
      const ext = path.extname(root).toLowerCase();
      if (IMAGE_EXTENSIONS.has(ext) || (includePdf && ext === PDF_EXTENSION)) {
        scanFiles.push({
          path: root,
          ext,
        size: stat.size,
        normalizedPath: normalize(root),
        normalizedName: normalize(path.basename(root)),
        tokens: new Set(normalize(root).split(/\s+/)),
      });
      }
    }
  }
}

const scoreCandidate = (target, candidate) => {
  const targetStem = normalize(target.targetStem);
  const caseId = normalize(target.caseId);
  const sourceName = normalize(path.basename(target.sourceUrl || '')).replace(/\s+(jpg|jpeg|png|webp|gif|svg|tif|tiff)$/i, '');
  if (candidate.normalizedName === targetStem) return 100;
  if (candidate.normalizedName.includes(targetStem) || targetStem.includes(candidate.normalizedName)) return 80;
  if (candidate.normalizedPath.includes(caseId)) return 70;
  if (sourceName && sourceName.length > 8 && candidate.normalizedName.includes(sourceName)) return 65;

  const matched = target.matchTokens.filter((token) => candidate.normalizedPath.includes(token));
  const matchedWholeTokens = target.matchTokens.filter((token) => candidate.tokens?.has(token));
  const specialtyContext = target.specialtyTokens.some((token) => candidate.tokens?.has(token));
  const targetTokenCount = target.matchTokens.length;
  const enoughTargetEvidence = matchedWholeTokens.length >= Math.min(3, Math.max(2, targetTokenCount));
  const rareTokenEvidence = matchedWholeTokens.some((token) => token.length >= 8);
  if (!specialtyContext || !enoughTargetEvidence || !rareTokenEvidence) return 0;

  return 10 + matchedWholeTokens.reduce((score, token) => score + (token.length > 5 ? 2 : 1), 0);
};

const findManifestSource = (target) => {
  const entry = explicitManifest.find((item) => item.caseId === target.caseId);
  if (!entry?.sourcePath) return null;
  const resolved = path.resolve(entry.sourcePath);
  if (!fs.existsSync(resolved)) return null;
  const stat = fs.statSync(resolved);
  return {
    path: resolved,
    ext: path.extname(resolved).toLowerCase(),
    size: stat.size,
    normalizedPath: normalize(resolved),
    normalizedName: normalize(path.basename(resolved)),
    manifestNote: entry.note,
    score: 1000,
  };
};

const extractLargestPdfImage = (pdfPath) => {
  const pdfimages = spawnSync('command', ['-v', 'pdfimages'], { shell: true, encoding: 'utf8' });
  if (pdfimages.status !== 0) return null;
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'signout-pdf-images-'));
  const prefix = path.join(tempDir, 'image');
  const result = spawnSync('pdfimages', ['-all', pdfPath, prefix], { encoding: 'utf8' });
  if (result.status !== 0) return null;
  const extracted = fs
    .readdirSync(tempDir)
    .map((file) => path.join(tempDir, file))
    .filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return IMAGE_EXTENSIONS.has(ext) && fs.statSync(file).size > 0;
    })
    .sort((a, b) => fs.statSync(b).size - fs.statSync(a).size);
  return extracted[0] || null;
};

const copyOrConvert = (source, target) => {
  fs.mkdirSync(path.dirname(target.outputPath), { recursive: true });
  const targetExt = path.extname(target.outputPath).toLowerCase();
  let sourcePath = source.path;
  if (source.ext === PDF_EXTENSION) {
    sourcePath = extractLargestPdfImage(source.path);
    if (!sourcePath) throw new Error('No extractable image found in PDF.');
  }
  const sourceExt = path.extname(sourcePath).toLowerCase();
  const targetIsJpeg = ['.jpg', '.jpeg'].includes(targetExt);
  const needsSips = ['.tif', '.tiff'].includes(sourceExt) || (targetIsJpeg && !['.jpg', '.jpeg'].includes(sourceExt));
  if (needsSips) {
    const result = spawnSync('sips', ['-s', 'format', targetIsJpeg ? 'jpeg' : targetExt.slice(1), sourcePath, '--out', target.outputPath], {
      encoding: 'utf8',
    });
    if (result.status !== 0) throw new Error(result.stderr || result.stdout || 'sips conversion failed.');
  } else {
    fs.copyFileSync(sourcePath, target.outputPath);
  }
};

const imports = [];
const unresolved = [];
const ambiguous = [];

for (const target of targets) {
  const explicit = findManifestSource(target);
  const ranked = explicit
    ? [explicit]
    : scanFiles
        .map((candidate) => ({ ...candidate, score: scoreCandidate(target, candidate) }))
        .filter((candidate) => candidate.score >= minScore)
        .sort((a, b) => b.score - a.score || b.size - a.size);

  const best = ranked[0];
  if (!best) {
    unresolved.push({
      caseId: target.caseId,
      title: target.title,
      expectedLocalPath: target.localPath,
      tokens: target.tokens,
    });
    continue;
  }
  if (!explicit && ranked[1] && ranked[1].score === best.score) {
    ambiguous.push({
      caseId: target.caseId,
      title: target.title,
      expectedLocalPath: target.localPath,
      candidates: ranked.slice(0, 5).map((candidate) => ({
        sourcePath: candidate.path,
        score: candidate.score,
        size: candidate.size,
      })),
    });
    continue;
  }

  const record = {
    caseId: target.caseId,
    title: target.title,
    expectedLocalPath: target.localPath,
    outputPath: path.relative(ROOT, target.outputPath),
    sourcePath: best.path,
    sourceType: best.ext === PDF_EXTENSION ? 'pdf-extracted-image' : 'local-image',
    score: best.score,
    dryRun,
  };
  try {
    if (!dryRun) copyOrConvert(best, target);
    imports.push(record);
  } catch (error) {
    unresolved.push({
      ...record,
      error: error.message,
    });
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  roots: sourceRoots,
  includePdf,
  dryRun,
  replaceExisting,
  scannedFiles: scanFiles.length,
  targets: targets.length,
  imported: imports.length,
  ambiguous: ambiguous.length,
  unresolved: unresolved.length,
  imports,
  ambiguous,
  unresolved,
};

fs.mkdirSync(path.dirname(OUT_REPORT), { recursive: true });
fs.writeFileSync(OUT_REPORT, `${JSON.stringify(report, null, 2)}\n`);

console.log(
  JSON.stringify(
    {
      output: path.relative(ROOT, OUT_REPORT),
      roots: sourceRoots.length,
      scannedFiles: scanFiles.length,
      targets: targets.length,
      imported: imports.length,
      ambiguous: ambiguous.length,
      unresolved: unresolved.length,
      dryRun,
    },
    null,
    2
  )
);

for (const item of imports) {
  console.error(`${dryRun ? 'WOULD_IMPORT' : 'IMPORTED'} ${item.caseId}: ${item.sourcePath}`);
}
for (const item of ambiguous) {
  console.error(`AMBIGUOUS ${item.caseId}: ${item.candidates.map((candidate) => candidate.sourcePath).join(' | ')}`);
}
for (const item of unresolved) {
  console.error(`UNRESOLVED ${item.caseId}: ${item.error || item.expectedLocalPath}`);
}

if (ambiguous.length > 0 || unresolved.length > 0) process.exitCode = 1;
