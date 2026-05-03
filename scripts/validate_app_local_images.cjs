const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const CONTENT_ROOTS = [
  path.join(ROOT, 'src', 'content'),
  path.join(ROOT, 'src', 'assets', 'data'),
];
const OUT_PATH = path.join(ROOT, 'src', 'content', 'images', 'app_local_image_audit.json');

const IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|gif|svg|tif|tiff)$/i;
const LOCAL_PREFIXES = [
  'reference-library/',
  '/reference-library/',
  'assets/',
  '/assets/',
  'images/',
  '/images/',
];
const IMAGE_KEYS = new Set([
  'src',
  'localPath',
  'publicPath',
  'thumbUrl',
  'fullUrl',
  'imagePath',
]);
const NON_APP_PATH_KEYS = new Set([
  'absolutePath',
  'sourcePath',
  'sourceRoot',
  'gcsPath',
  'pdfPath',
  'packageUrl',
  'outputPath',
]);
const EXCLUDED_FILE_PATTERNS = [
  /app_local_image_audit\.json$/,
  /pubmed_oa_image_acquisition_report\.json$/,
  /local_image_import_report\.json$/,
  /image_acquisition_plan\.json$/,
];

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));

const walkFiles = (directory, output = []) => {
  if (!fs.existsSync(directory)) return output;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, output);
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.json') && !EXCLUDED_FILE_PATTERNS.some((pattern) => pattern.test(fullPath))) output.push(fullPath);
  }
  return output;
};

const isLocalPublicPath = (value) => {
  if (typeof value !== 'string' || !value) return false;
  if (/^(https?:|ftp:|data:|mailto:)/i.test(value)) return false;
  if (value.startsWith('/Users/') || value.startsWith('/Volumes/') || value.startsWith('/private/')) return false;
  return LOCAL_PREFIXES.some((prefix) => value.startsWith(prefix));
};

const normalizePublicPath = (value) =>
  value
    .replace(/^\/+/, '')
    .replace(/^Didactic_Series\//, '')
    .replace(/^public\//, '')
    .split(/[?#]/)[0];

const shouldAudit = (key, value) => {
  if (NON_APP_PATH_KEYS.has(key)) return false;
  if (!isLocalPublicPath(value)) return false;
  if (IMAGE_KEYS.has(key)) return true;
  return IMAGE_EXTENSIONS.test(value);
};

const references = [];

const scanNode = (node, context) => {
  if (Array.isArray(node)) {
    node.forEach((item, index) => scanNode(item, `${context}[${index}]`));
    return;
  }
  if (!node || typeof node !== 'object') return;
  for (const [key, value] of Object.entries(node)) {
    const nextContext = context ? `${context}.${key}` : key;
    if (typeof value === 'string' && shouldAudit(key, value)) {
      const publicPath = normalizePublicPath(value);
      references.push({
        sourceFile: context.split('::')[0],
        jsonPath: nextContext.split('::')[1] || nextContext,
        key,
        value,
        publicPath,
        absolutePath: path.join(ROOT, 'public', publicPath),
      });
    } else {
      scanNode(value, nextContext);
    }
  }
};

for (const root of CONTENT_ROOTS) {
  for (const filePath of walkFiles(root)) {
    let data;
    try {
      data = readJson(filePath);
    } catch (error) {
      continue;
    }
    scanNode(data, `${path.relative(ROOT, filePath)}::`);
  }
}

const evaluated = references.map((reference) => {
  const exists = fs.existsSync(reference.absolutePath);
  const stat = exists ? fs.statSync(reference.absolutePath) : null;
  return {
    ...reference,
    exists,
    bytes: stat?.size || 0,
  };
});

const missing = evaluated.filter((item) => !item.exists);
const zeroByte = evaluated.filter((item) => item.exists && item.bytes === 0);

const audit = {
  generatedAt: new Date().toISOString(),
  scannedRoots: CONTENT_ROOTS.map((root) => path.relative(ROOT, root)),
  references: evaluated.length,
  present: evaluated.filter((item) => item.exists && item.bytes > 0).length,
  missing: missing.length,
  zeroByte: zeroByte.length,
  missingReferences: missing,
  zeroByteReferences: zeroByte,
  referencesByPrefix: evaluated.reduce((acc, item) => {
    const prefix = item.publicPath.split('/').slice(0, 2).join('/');
    acc[prefix] = (acc[prefix] || 0) + 1;
    return acc;
  }, {}),
};

fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
fs.writeFileSync(OUT_PATH, `${JSON.stringify(audit, null, 2)}\n`);

console.log(
  JSON.stringify(
    {
      output: path.relative(ROOT, OUT_PATH),
      references: audit.references,
      present: audit.present,
      missing: audit.missing,
      zeroByte: audit.zeroByte,
    },
    null,
    2
  )
);

for (const item of missing.slice(0, 50)) {
  console.error(`MISSING ${item.sourceFile} ${item.jsonPath}: ${item.value}`);
}
for (const item of zeroByte.slice(0, 50)) {
  console.error(`ZERO_BYTE ${item.sourceFile} ${item.jsonPath}: ${item.value}`);
}

if (missing.length > 0 || zeroByte.length > 0) process.exitCode = 1;
