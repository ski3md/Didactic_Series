const fs = require('node:fs');
const path = require('node:path');

const getArg = (name) => {
  const args = process.argv.slice(2);
  const argEq = args.find((item) => item.startsWith(`${name}=`));
  if (argEq) {
    return argEq.slice(name.length + 1);
  }
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};

const parseBytes = (value, fallback) => {
  const raw = Number(value);
  return Number.isFinite(raw) && raw > 0 ? Math.trunc(raw) : fallback;
};

const parseIntArg = (name, fallback) => parseBytes(getArg(name), fallback);

const root = getArg('--dist') || getArg('--path') || 'dist/didactics';
const maxFileBytes = parseIntArg('--max-bytes', 100 * 1024 * 1024);
const reportOnly = process.argv.includes('--report-only');
const verbose = process.argv.includes('--verbose');
const dropSourceArticles = process.argv.includes('--drop-source-articles');

const targetRoot = path.resolve(process.cwd(), root);

const walkDirectories = (directory, callback) => {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.name === '.git' || entry.name === 'node_modules') {
      continue;
    }
    if (entry.name === 'source-articles' && path.basename(directory) === 'reference-library') {
      callback(fullPath);
      continue;
    }
    walkDirectories(fullPath, callback);
  }
};

const walkFiles = (directory, results = []) => {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, results);
      continue;
    }
    if (!entry.isFile()) continue;
    results.push(fullPath);
  }
  return results;
};

const formatBytes = (bytes) => {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = Math.max(bytes || 0, 0);
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size.toFixed(2)} ${units[unit]}`;
};

const sourceArticleRoots = [];
walkDirectories(targetRoot, (candidate) => sourceArticleRoots.push(candidate));

if (sourceArticleRoots.length === 0) {
  console.log(`[didactics-deploy-sanitize] No source-articles cache in ${path.relative(process.cwd(), targetRoot)}; nothing to prune.`);
  process.exit(0);
}

let removed = 0;
let skipped = 0;
let candidatesCount = 0;
let bytesRemoved = 0;

for (const sourceArticlesDir of sourceArticleRoots) {
  const candidateRoot = path.relative(process.cwd(), sourceArticlesDir);
  const files = walkFiles(sourceArticlesDir);
  const candidates = files.filter((filePath) => filePath.endsWith('.tar.gz') || filePath.endsWith('.tgz') || filePath.endsWith('.zip'));
  candidatesCount += candidates.length;

  if (dropSourceArticles) {
    for (const filePath of files) {
      const stats = fs.statSync(filePath);
      if (!reportOnly) {
        bytesRemoved += stats.size;
      }
    }
    if (!reportOnly) {
      const totalFiles = files.length;
      removed += totalFiles;
      fs.rmSync(sourceArticlesDir, { recursive: true, force: true });
      if (verbose) {
        console.log(`[didactics-deploy-sanitize] removed entire source-articles root ${candidateRoot} (${totalFiles} file(s))`);
      }
    }
    continue;
  }

  for (const candidate of candidates) {
    const stats = fs.statSync(candidate);
    if (stats.size > maxFileBytes) {
      if (!reportOnly) {
        fs.unlinkSync(candidate);
        removed += 1;
        bytesRemoved += stats.size;
        if (verbose) {
          console.log(`[didactics-deploy-sanitize] removed ${candidate} (${formatBytes(stats.size)})`);
        }
      } else {
        skipped += 1;
      }
    }
  }

  if (!reportOnly && candidates.length > 0) {
    try {
      const remainingFiles = walkFiles(sourceArticlesDir);
      if (remainingFiles.length === 0) {
        fs.rmSync(sourceArticlesDir, { recursive: true, force: true });
        if (verbose) {
          console.log(`[didactics-deploy-sanitize] removed empty directory ${candidateRoot}`);
        }
      }
      const parentDir = path.dirname(sourceArticlesDir);
      if (fs.existsSync(parentDir)) {
        const parentEntries = fs.readdirSync(parentDir);
        if (parentEntries.length === 0) {
          fs.rmSync(parentDir, { recursive: true, force: true });
          if (verbose) {
            console.log(`[didactics-deploy-sanitize] removed empty parent directory ${path.relative(process.cwd(), parentDir)}`);
          }
        }
      }
    } catch (error) {
      // Ignore cleanup races; this is a best-effort cleanup.
    }
  }
}

const saved = bytesRemoved > 0 ? `${formatBytes(bytesRemoved)}` : '0 B';
const scannedRoots = sourceArticleRoots.map((rootPath) => path.relative(process.cwd(), rootPath)).join(', ');

console.log(
  `[didactics-deploy-sanitize] scanned ${scannedRoots}: ` +
    `${candidatesCount} archive file(s), removed ${reportOnly ? skipped : removed} over ${formatBytes(maxFileBytes)}.`
);
console.log(`[didactics-deploy-sanitize] estimated artifact bytes reduced: ${saved}`);
