const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const ROOT = process.cwd();
const DEFAULT_MANIFEST = path.join(ROOT, 'src', 'content', 'ap_signout', 'templates', 'ap_signout_asset_source.template.json');
const DEFAULT_OUT_DIR = path.join(ROOT, 'public', 'reference-library', 'ap-signout');
const DEFAULT_REPORT = path.join(ROOT, 'src', 'content', 'ap_signout', 'ap_signout_acquired_assets.json');

const parseArgs = () => {
  const parsed = { manifest: DEFAULT_MANIFEST, outDir: DEFAULT_OUT_DIR, report: DEFAULT_REPORT, selfTest: false };
  const args = process.argv.slice(2);
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === '--self-test') parsed.selfTest = true;
    if (args[index] === '--manifest') parsed.manifest = path.resolve(args[++index]);
    if (args[index] === '--out') parsed.outDir = path.resolve(args[++index]);
    if (args[index] === '--report') parsed.report = path.resolve(args[++index]);
  }
  return parsed;
};

const ensureDir = (dirPath) => fs.mkdirSync(dirPath, { recursive: true });
const sha1 = (value) => crypto.createHash('sha1').update(value).digest('hex');
const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const safeId = (value) =>
  String(value || 'asset').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 90) || 'asset';

const extensionFromMime = (mime) => {
  if (/png/i.test(mime)) return 'png';
  if (/svg/i.test(mime)) return 'svg';
  if (/webp/i.test(mime)) return 'webp';
  if (/gif/i.test(mime)) return 'gif';
  return 'jpg';
};

const extensionFromPath = (value, fallback = 'jpg') => {
  const match = String(value || '').match(/\.([a-z0-9]+)(?:$|\?)/i);
  return match ? (match[1].toLowerCase() === 'jpeg' ? 'jpg' : match[1].toLowerCase()) : fallback;
};

const decodeDataUrl = (value) => {
  const match = value.match(/^data:([^;,]+)?(;base64)?,(.*)$/);
  if (!match) throw new Error('Invalid data URL.');
  return {
    mime: match[1] || 'application/octet-stream',
    buffer: match[2] ? Buffer.from(match[3] || '', 'base64') : Buffer.from(decodeURIComponent(match[3] || ''), 'utf8'),
  };
};

const fetchBuffer = async (url, accept) => {
  const attempts = Number(process.env.AP_ASSET_ATTEMPTS || 3);
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: accept,
          'User-Agent': 'Didactic-Series-AP-Signout-Asset-Acquisition/1.0',
        },
      });
      if (response.ok) {
        return {
          buffer: Buffer.from(await response.arrayBuffer()),
          contentType: response.headers.get('content-type') || 'application/octet-stream',
        };
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

const normalizeSources = (manifest) => {
  if (Array.isArray(manifest.sources)) return manifest.sources;
  if (Array.isArray(manifest)) return manifest;
  if (manifest.id && manifest.kind) return [manifest];
  return [];
};

const makeMinimalPdf = (targetPath) => {
  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n',
    '4 0 obj\n<< /Length 99 >>\nstream\nBT\n/F1 24 Tf\n72 700 Td\n(AP sign-out PDF page capture self-test) Tj\nET\nendstream\nendobj\n',
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
  ];
  let body = '%PDF-1.4\n';
  const offsets = [0];
  for (const object of objects) {
    offsets.push(Buffer.byteLength(body, 'utf8'));
    body += object;
  }
  const xrefStart = Buffer.byteLength(body, 'utf8');
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let index = 1; index <= objects.length; index += 1) body += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`;
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  fs.writeFileSync(targetPath, body);
};

const selfTestManifest = (tempDir) => {
  const pdfPath = path.join(tempDir, 'ap-signout-self-test.pdf');
  makeMinimalPdf(pdfPath);
  return {
    sources: [
      {
        id: 'ap-self-test-url-svg',
        subspecialtyId: 'self-test',
        caseId: 'ap-self-test-01',
        entityId: 'Self-test URL image',
        kind: 'image_url',
        url: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MDAiIGhlaWdodD0iNTAwIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjUwMCIgZmlsbD0iI2Y4ZjVmMiIvPjxjaXJjbGUgY3g9IjMwMCIgY3k9IjIzMCIgcj0iMTQwIiBmaWxsPSIjZmZkZmZmIiBzdHJva2U9IiM3YzNhNTMiIHN0cm9rZS13aWR0aD0iMjQiLz48dGV4dCB4PSI1MCIgeT0iNDU1IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjgiIGZpbGw9IiMzNzQxNTEiPkFQIHNpZ24tb3V0IFVSTCBpbWFnZSBzZWxmLXRlc3Q8L3RleHQ+PC9zdmc+',
        role: 'diagnostic-histology',
        stain: 'H&E',
        caption: 'AP sign-out image URL self-test.',
      },
      {
        id: 'ap-self-test-pdf-page',
        subspecialtyId: 'self-test',
        caseId: 'ap-self-test-02',
        entityId: 'Self-test PDF page',
        kind: 'pdf_page',
        pdfPath,
        page: 1,
        role: 'pdf-page-capture',
        caption: 'AP sign-out PDF page self-test.',
      },
    ],
  };
};

const sourceBuffer = async (source, tempDir) => {
  if (source.kind === 'local_image') {
    const filePath = path.resolve(ROOT, source.path);
    return { buffer: fs.readFileSync(filePath), extension: extensionFromPath(filePath), sourceUrl: source.sourceUrl || filePath };
  }
  if (source.kind === 'image_url') {
    if (source.url.startsWith('data:')) {
      const decoded = decodeDataUrl(source.url);
      return { buffer: decoded.buffer, extension: extensionFromMime(decoded.mime), sourceUrl: source.sourceUrl || 'data-url' };
    }
    const fetched = await fetchBuffer(source.url, 'image/avif,image/webp,image/png,image/jpeg,image/gif,image/svg+xml,*/*;q=0.8');
    return { buffer: fetched.buffer, extension: extensionFromMime(fetched.contentType), sourceUrl: source.sourceUrl || source.url };
  }
  if (source.kind === 'pdf_page') {
    const pdfPath = source.pdfUrl
      ? path.join(tempDir, `${safeId(source.id)}.pdf`)
      : path.resolve(ROOT, source.pdfPath);
    if (source.pdfUrl) fs.writeFileSync(pdfPath, (await fetchBuffer(source.pdfUrl, 'application/pdf,*/*;q=0.8')).buffer);
    const outputPath = path.join(tempDir, `${safeId(source.id)}.png`);
    const sips = spawnSync('/usr/bin/sips', ['-s', 'format', 'png', pdfPath, '--out', outputPath], { encoding: 'utf8' });
    if (sips.status !== 0 || !fs.existsSync(outputPath) || fs.statSync(outputPath).size === 0) {
      const { chromium } = await import('playwright');
      const browser = await chromium.launch({ headless: true });
      try {
        const page = await browser.newPage({ viewport: { width: 1400, height: 1800 } });
        await page.goto(`file://${pdfPath}#page=${source.page || 1}&zoom=page-width`, { waitUntil: 'networkidle', timeout: 30000 });
        await page.screenshot({ path: outputPath, fullPage: true });
      } finally {
        await browser.close();
      }
    }
    return { buffer: fs.readFileSync(outputPath), extension: 'png', sourceUrl: source.sourceUrl || source.pdfUrl || source.pdfPath };
  }
  throw new Error(`Unsupported source kind: ${source.kind}`);
};

const acquire = async () => {
  const options = parseArgs();
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ap-signout-assets-'));
  const manifest = options.selfTest ? selfTestManifest(tempDir) : readJson(options.manifest);
  const sources = normalizeSources(manifest);
  const outDir = options.selfTest ? path.join(tempDir, 'out') : options.outDir;
  const reportPath = options.selfTest ? path.join(tempDir, 'ap_signout_acquired_assets.selftest.json') : options.report;
  ensureDir(outDir);
  ensureDir(path.dirname(reportPath));

  const assets = [];
  const failures = [];
  for (const source of sources) {
    try {
      const item = await sourceBuffer(source, tempDir);
      const hash = sha1(item.buffer);
      const relativeDir = path.join('reference-library', 'ap-signout', safeId(source.subspecialtyId || 'unassigned'));
      const absoluteDir = path.join(ROOT, 'public', relativeDir);
      ensureDir(options.selfTest ? outDir : absoluteDir);
      const filename = `${safeId(source.id)}-${hash.slice(0, 10)}.${item.extension}`;
      const absolutePath = options.selfTest ? path.join(outDir, filename) : path.join(absoluteDir, filename);
      fs.writeFileSync(absolutePath, item.buffer);
      assets.push({
        id: `ap_${safeId(source.id)}_${hash.slice(0, 10)}`,
        sourceId: source.id,
        subspecialtyId: source.subspecialtyId,
        caseId: source.caseId,
        entityId: source.entityId,
        role: source.role,
        stain: source.stain,
        markerOrStudy: source.markerOrStudy,
        magnification: source.magnification,
        caption: source.caption,
        localPath: options.selfTest ? path.relative(outDir, absolutePath) : `${relativeDir}/${filename}`,
        sourceUrl: item.sourceUrl,
        license: source.license,
        hash,
        acquiredAt: new Date().toISOString(),
      });
    } catch (error) {
      failures.push({ sourceId: source.id, error: error instanceof Error ? error.message : String(error) });
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    selfTest: options.selfTest,
    sourceCount: sources.length,
    acquiredCount: assets.length,
    failureCount: failures.length,
    assets,
    failures,
  };
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({
    selfTest: options.selfTest,
    report: path.relative(ROOT, reportPath),
    sourceCount: report.sourceCount,
    acquiredCount: report.acquiredCount,
    failureCount: report.failureCount,
  }, null, 2));
  if (failures.length > 0) process.exitCode = 1;
};

acquire().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exit(1);
});
