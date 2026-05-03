const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const CASE_PATH = path.join(ROOT, 'src', 'content', 'signout_sims', 'neuropathology_signout_sims.json');
const OUT_DIR = path.join(ROOT, 'public', 'reference-library', 'signout-sims', 'neuropathology');

const usage = () => {
  console.error('Usage: node scripts/import_authorized_neuro_atlas_images.cjs --manifest /path/to/manifest.json');
  console.error('Manifest rows require: caseId, imagePath, caption, stain, sourceUrl, license.');
};

const manifestArgIndex = process.argv.indexOf('--manifest');
const manifestPath = manifestArgIndex >= 0 ? process.argv[manifestArgIndex + 1] : '';
if (!manifestPath) {
  usage();
  process.exit(1);
}

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const cases = readJson(CASE_PATH);
const manifest = readJson(path.resolve(manifestPath));
if (!Array.isArray(manifest)) {
  console.error('Manifest must be a JSON array.');
  process.exit(1);
}

const caseMap = new Map(cases.cases.map((item) => [item.id, item]));
const failures = [];
const imported = [];

const safeName = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/^-+|-+$/g, '');

for (const row of manifest) {
  const missing = ['caseId', 'imagePath', 'caption', 'stain', 'sourceUrl', 'license'].filter((key) => !row[key]);
  if (missing.length > 0) {
    failures.push(`${row.caseId || 'unknown'} missing ${missing.join(', ')}`);
    continue;
  }
  if (!caseMap.has(row.caseId)) {
    failures.push(`${row.caseId} does not match a neuropathology sign-out case.`);
    continue;
  }
  if (!/permission|licensed|cc-|public domain|institutional/i.test(row.license)) {
    failures.push(`${row.caseId} license must explicitly permit local educational reuse.`);
    continue;
  }

  const sourcePath = path.resolve(row.imagePath);
  if (!fs.existsSync(sourcePath) || fs.statSync(sourcePath).size === 0) {
    failures.push(`${row.caseId} imagePath does not exist or is empty: ${row.imagePath}`);
    continue;
  }

  const ext = path.extname(sourcePath).toLowerCase() || '.jpg';
  const outName = safeName(row.outputName || `${row.caseId}${ext}`);
  const outPath = path.join(OUT_DIR, outName);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.copyFileSync(sourcePath, outPath);

  const target = caseMap.get(row.caseId);
  target.image = {
    src: `reference-library/signout-sims/neuropathology/${outName}`,
    caption: row.caption,
    stain: row.stain,
    sourceUrl: row.sourceUrl,
  };
  target.authorizedImageLicense = row.license;
  imported.push({ caseId: row.caseId, src: target.image.src });
}

fs.writeFileSync(CASE_PATH, `${JSON.stringify(cases, null, 2)}\n`);

console.log(
  JSON.stringify(
    {
      manifest: path.resolve(manifestPath),
      imported: imported.length,
      failures: failures.length,
      outputDirectory: path.relative(ROOT, OUT_DIR),
    },
    null,
    2
  )
);
for (const item of imported) console.log(`IMPORTED ${item.caseId}: ${item.src}`);
for (const failure of failures) console.error(`FAIL ${failure}`);
if (failures.length > 0) process.exitCode = 1;
