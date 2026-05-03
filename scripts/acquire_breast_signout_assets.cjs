const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const ROOT = process.cwd();
const DEFAULT_MANIFEST = path.join(ROOT, 'src', 'content', 'breast', 'breast_signout_asset_sources.example.json');
const DEFAULT_OUT_DIR = path.join(ROOT, 'public', 'reference-library', 'breast-signout');
const DEFAULT_REPORT = path.join(ROOT, 'src', 'content', 'breast', 'breast_signout_acquired_assets.json');

const parseArgs = () => {
  const parsed = {
    manifest: DEFAULT_MANIFEST,
    outDir: DEFAULT_OUT_DIR,
    report: DEFAULT_REPORT,
    selfTest: false,
  };
  const args = process.argv.slice(2);
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--self-test') parsed.selfTest = true;
    if (arg === '--manifest') parsed.manifest = path.resolve(args[++index]);
    if (arg === '--out') parsed.outDir = path.resolve(args[++index]);
    if (arg === '--report') parsed.report = path.resolve(args[++index]);
  }
  return parsed;
};

const ensureDir = (dirPath) => fs.mkdirSync(dirPath, { recursive: true });
const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const sha1 = (bufferOrString) => crypto.createHash('sha1').update(bufferOrString).digest('hex');
const safeId = (value) =>
  String(value || 'asset')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'asset';

const extensionFromMime = (mime) => {
  if (/svg/i.test(mime)) return 'svg';
  if (/png/i.test(mime)) return 'png';
  if (/webp/i.test(mime)) return 'webp';
  if (/gif/i.test(mime)) return 'gif';
  return 'jpg';
};

const extensionFromUrl = (value, fallback = 'jpg') => {
  try {
    const url = new URL(value);
    const match = decodeURIComponent(url.pathname).match(/\.([a-z0-9]+)$/i);
    if (match) return match[1].toLowerCase() === 'jpeg' ? 'jpg' : match[1].toLowerCase();
  } catch {
    const match = String(value).match(/\.([a-z0-9]+)$/i);
    if (match) return match[1].toLowerCase() === 'jpeg' ? 'jpg' : match[1].toLowerCase();
  }
  return fallback;
};

const decodeDataUrl = (value) => {
  const match = value.match(/^data:([^;,]+)?(;base64)?,(.*)$/);
  if (!match) throw new Error('Invalid data URL.');
  const mime = match[1] || 'application/octet-stream';
  const isBase64 = Boolean(match[2]);
  const payload = match[3] || '';
  return {
    mime,
    buffer: isBase64 ? Buffer.from(payload, 'base64') : Buffer.from(decodeURIComponent(payload), 'utf8'),
  };
};

const fetchBuffer = async (url, accept) => {
  const attempts = Number(process.env.BREAST_ASSET_ATTEMPTS || 3);
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: accept,
          'User-Agent': 'Didactic-Series-Breast-Signout-Asset-Acquisition/1.0 (local pathology education reference library)',
        },
      });
      if (response.ok) {
        const contentType = response.headers.get('content-type') || 'application/octet-stream';
        const buffer = Buffer.from(await response.arrayBuffer());
        return { buffer, contentType };
      }

      if ((response.status === 429 || response.status >= 500) && attempt < attempts) {
        const retryAfter = Number(response.headers.get('retry-after'));
        const delayMs = Number.isFinite(retryAfter) ? Math.min(retryAfter * 1000, 30000) : attempt * 5000;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
      throw new Error(`HTTP ${response.status}`);
    } finally {
      clearTimeout(timeout);
    }
  }
  throw new Error('Download attempts exhausted.');
};

const sourceToFile = async (source, tempDir) => {
  if (source.url?.startsWith('data:')) {
    const decoded = decodeDataUrl(source.url);
    return {
      buffer: decoded.buffer,
      extension: extensionFromMime(decoded.mime),
      sourceDescription: source.sourceUrl || 'data-url',
    };
  }

  if (source.url && /^https?:\/\//i.test(source.url)) {
    const fetched = await fetchBuffer(source.url, 'image/avif,image/webp,image/png,image/jpeg,image/gif,image/svg+xml,*/*;q=0.8');
    return {
      buffer: fetched.buffer,
      extension: extensionFromMime(fetched.contentType) || extensionFromUrl(source.url),
      sourceDescription: source.sourceUrl || source.url,
    };
  }

  if (source.url && /^file:\/\//i.test(source.url)) {
    const filePath = new URL(source.url).pathname;
    return {
      buffer: fs.readFileSync(filePath),
      extension: extensionFromUrl(filePath),
      sourceDescription: source.sourceUrl || source.url,
    };
  }

  if (source.path || source.url) {
    const filePath = path.resolve(ROOT, source.path || source.url);
    return {
      buffer: fs.readFileSync(filePath),
      extension: extensionFromUrl(filePath),
      sourceDescription: source.sourceUrl || filePath,
    };
  }

  throw new Error(`${source.id} does not define url, path, or file URL.`);
};

const writeImageSource = async (source, outDir) => {
  const item = await sourceToFile(source);
  const hash = sha1(item.buffer);
  const filename = `${safeId(source.id)}-${hash.slice(0, 10)}.${item.extension}`;
  const absolutePath = path.join(outDir, filename);
  fs.writeFileSync(absolutePath, item.buffer);
  return {
    source,
    absolutePath,
    localPath: `reference-library/breast-signout/${filename}`,
    sourceDescription: item.sourceDescription,
    hash,
  };
};

const makeMinimalPdf = (targetPath) => {
  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n',
    '4 0 obj\n<< /Length 123 >>\nstream\nBT\n/F1 24 Tf\n72 700 Td\n(Breast signout PDF capture fixture) Tj\n0 -40 Td\n/F1 16 Tf\n(Page rendering self-test) Tj\nET\nendstream\nendobj\n',
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
  ];
  let body = '%PDF-1.4\n';
  const offsets = [0];
  for (const object of objects) {
    offsets.push(Buffer.byteLength(body, 'utf8'));
    body += object;
  }
  const xrefStart = Buffer.byteLength(body, 'utf8');
  body += `xref\n0 ${objects.length + 1}\n`;
  body += '0000000000 65535 f \n';
  for (let index = 1; index <= objects.length; index += 1) {
    body += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`;
  }
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  fs.writeFileSync(targetPath, body);
};

const resolvePdf = async (source, tempDir) => {
  if (source.pdfUrl && /^https?:\/\//i.test(source.pdfUrl)) {
    const fetched = await fetchBuffer(source.pdfUrl, 'application/pdf,*/*;q=0.8');
    const localPdf = path.join(tempDir, `${safeId(source.id)}.pdf`);
    fs.writeFileSync(localPdf, fetched.buffer);
    return { pdfPath: localPdf, sourceDescription: source.sourceUrl || source.pdfUrl };
  }
  if (source.pdfUrl?.startsWith('data:')) {
    const decoded = decodeDataUrl(source.pdfUrl);
    const localPdf = path.join(tempDir, `${safeId(source.id)}.pdf`);
    fs.writeFileSync(localPdf, decoded.buffer);
    return { pdfPath: localPdf, sourceDescription: source.sourceUrl || 'data-url-pdf' };
  }
  if (source.pdfPath) {
    const pdfPath = path.resolve(ROOT, source.pdfPath);
    return { pdfPath, sourceDescription: source.sourceUrl || pdfPath };
  }
  throw new Error(`${source.id} does not define pdfPath or pdfUrl.`);
};

const capturePdfWithSips = (pdfPath, outputPath, pageNumber) => {
  if (pageNumber !== 1) return false;
  const result = spawnSync('/usr/bin/sips', ['-s', 'format', 'png', pdfPath, '--out', outputPath], {
    encoding: 'utf8',
  });
  return result.status === 0 && fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0;
};

const capturePdfWithPlaywright = async (pdfPath, outputPath, pageNumber) => {
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1400, height: 1800 }, deviceScaleFactor: 1 });
    const pdfUrl = `file://${pdfPath}#page=${pageNumber || 1}&zoom=page-width`;
    await page.goto(pdfUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.screenshot({ path: outputPath, fullPage: true });
  } finally {
    await browser.close();
  }
};

const writePdfPageSource = async (source, outDir, tempDir) => {
  const { pdfPath, sourceDescription } = await resolvePdf(source, tempDir);
  if (!fs.existsSync(pdfPath)) throw new Error(`PDF does not exist: ${pdfPath}`);
  const hash = sha1(Buffer.concat([fs.readFileSync(pdfPath), Buffer.from(String(source.page || 1))]));
  const filename = `${safeId(source.id)}-page-${source.page || 1}-${hash.slice(0, 10)}.png`;
  const absolutePath = path.join(outDir, filename);

  let captured = capturePdfWithSips(pdfPath, absolutePath, source.page || 1);
  if (!captured) {
    await capturePdfWithPlaywright(pdfPath, absolutePath, source.page || 1);
    captured = fs.existsSync(absolutePath) && fs.statSync(absolutePath).size > 0;
  }
  if (!captured) throw new Error('PDF page capture did not produce an image.');

  return {
    source,
    absolutePath,
    localPath: `reference-library/breast-signout/${filename}`,
    sourceDescription,
    hash,
  };
};

const buildAssetRecord = ({ source, localPath, hash }) => ({
  id: `breast_${safeId(source.id)}_${hash.slice(0, 10)}`,
  sourceId: source.id,
  caseId: source.caseId,
  entityId: source.entityId,
  role: source.role,
  stain: source.stain,
  markerOrStudy: source.markerOrStudy,
  magnification: source.magnification,
  caption: source.caption,
  localPath,
  sourceUrl: source.sourceUrl || source.url || source.pdfUrl || source.pdfPath,
  license: source.license,
  hash,
  acquiredAt: new Date().toISOString(),
});

const findExistingFileForSource = (source, outDir) => {
  const prefix = `${safeId(source.id)}-`;
  if (!fs.existsSync(outDir)) return undefined;
  const filename = fs.readdirSync(outDir).find((item) => item.startsWith(prefix));
  if (!filename) return undefined;
  const absolutePath = path.join(outDir, filename);
  if (!fs.existsSync(absolutePath) || fs.statSync(absolutePath).size === 0) return undefined;
  return {
    absolutePath,
    localPath: `reference-library/breast-signout/${filename}`,
  };
};

const manifestForSelfTest = (tempDir) => {
  const pdfPath = path.join(tempDir, 'breast-signout-self-test.pdf');
  makeMinimalPdf(pdfPath);
  return {
    version: 'self-test',
    library: 'breast-signout',
    sources: [
      {
        id: 'self-test-url-svg',
        caseId: 'self-test',
        entityId: 'Self-test URL fixture',
        kind: 'image_url',
        url: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MDAiIGhlaWdodD0iNTAwIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjUwMCIgZmlsbD0iI2Y4ZjVmMiIvPjxjaXJjbGUgY3g9IjI2MCIgY3k9IjI1MCIgcj0iMTQwIiBmaWxsPSIjZmZkZmZmIiBzdHJva2U9IiNhNjQyNjgiIHN0cm9rZS13aWR0aD0iMjQiLz48Y2lyY2xlIGN4PSIyMzUiIGN5PSIyMjUiIHI9IjE4IiBmaWxsPSIjMzMzIi8+PGNpcmNsZSBjeD0iMzAwIiBjeT0iMjgwIiByPSIxNCIgZmlsbD0iIzMzMyIvPjx0ZXh0IHg9IjUwIiB5PSI0NTUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyOCIgZmlsbD0iIzM3NDE1MSI+VVJMIHRvIGxvY2FsIGltYWdlIHNlbGYtdGVzdDwvdGV4dD48L3N2Zz4=',
        role: 'diagnostic-histology',
        stain: 'H&E',
        caption: 'Self-test URL image capture.'
      },
      {
        id: 'self-test-pdf-page',
        caseId: 'self-test',
        entityId: 'Self-test PDF fixture',
        kind: 'pdf_page',
        pdfPath,
        page: 1,
        role: 'diagnostic-histology',
        stain: 'PDF page',
        caption: 'Self-test PDF page capture.'
      }
    ],
  };
};

const acquire = async (options) => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'breast-signout-assets-'));
  const manifest = options.selfTest ? manifestForSelfTest(tempDir) : readJson(options.manifest);
  const outDir = options.selfTest ? path.join(tempDir, 'out') : options.outDir;
  const reportPath = options.selfTest ? path.join(tempDir, 'breast_signout_acquired_assets.selftest.json') : options.report;
  const existingReport = !options.selfTest && fs.existsSync(reportPath)
    ? readJson(reportPath)
    : { assets: [] };
  const existingAssets = new Map((existingReport.assets || []).map((asset) => [asset.sourceId, asset]));

  ensureDir(outDir);
  ensureDir(path.dirname(reportPath));

  const assets = [];
  const skipped = [];
  const failures = [];

  for (const source of manifest.sources || []) {
    if (source.kind === 'pending' || source.sourceStatus === 'template_not_ready' || source.sourceStatus === 'needs_source_url_or_pdf_page') {
      skipped.push({ sourceId: source.id, reason: source.sourceStatus || 'pending' });
      continue;
    }

    try {
      const existing = existingAssets.get(source.id);
      const existingPath = existing?.localPath
        ? path.join(ROOT, 'public', existing.localPath.replace(/^\/+/, ''))
        : undefined;
      if (existingPath && fs.existsSync(existingPath) && fs.statSync(existingPath).size > 0) {
        assets.push(existing);
        continue;
      }

      const existingFile = findExistingFileForSource(source, outDir);
      if (existingFile) {
        assets.push(buildAssetRecord({
          source,
          localPath: existingFile.localPath,
          hash: sha1(fs.readFileSync(existingFile.absolutePath)),
        }));
        continue;
      }

      const written = source.kind === 'pdf_page'
        ? await writePdfPageSource(source, outDir, tempDir)
        : await writeImageSource(source, outDir, tempDir);
      assets.push(buildAssetRecord({ source, localPath: written.localPath, hash: written.hash }));
    } catch (error) {
      failures.push({
        sourceId: source.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    selfTest: options.selfTest,
    sourceCount: manifest.sources?.length || 0,
    acquiredCount: assets.length,
    skippedCount: skipped.length,
    failureCount: failures.length,
    assets,
    skipped,
    failures,
  };
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

  console.log(JSON.stringify({
    selfTest: options.selfTest,
    report: path.relative(ROOT, reportPath),
    outDir: path.relative(ROOT, outDir),
    sourceCount: report.sourceCount,
    acquiredCount: report.acquiredCount,
    skippedCount: report.skippedCount,
    failureCount: report.failureCount,
  }, null, 2));

  if (failures.length > 0) process.exitCode = 1;
};

acquire(parseArgs()).catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exit(1);
});
