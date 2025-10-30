import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import crypto from 'crypto';

export async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

export function safeHash(input) {
  return crypto.createHash('sha1').update(input).digest('hex').slice(0, 12);
}

// Write JSON safely: write to tmp then rename
export async function safeWriteJSON(targetPath, obj, tmpSuffix = '.tmp') {
  const dir = path.dirname(targetPath);
  await ensureDir(dir);
  const tmpPath = `${targetPath}${tmpSuffix}`;
  const data = JSON.stringify(obj, null, 2);
  await fs.writeFile(tmpPath, data, 'utf8');
  await fs.rename(tmpPath, targetPath);
}

// Read JSON but handle empty/malformed gracefully
export async function readJSONSafe(filePath) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    if (!raw || raw.trim() === '') return null;
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

export function listFilesRecursive(baseDir, exts = ['.jpg', '.jpeg', '.png', '.tif', '.tiff', '.svs']) {
  // synchronous walk for speed and predictability
  const files = [];
  function walk(dir) {
    const entries = fsSync.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else {
        const low = path.extname(e.name).toLowerCase();
        if (exts.includes(low)) files.push(full);
      }
    }
  }
  if (fsSync.existsSync(baseDir)) walk(baseDir);
  return files;
}
