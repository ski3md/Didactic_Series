#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT_DIR = process.cwd();
const REPORT_DIR = path.join(ROOT_DIR, 'reports', 'security');
const REPORT_JSON_PATH = path.join(REPORT_DIR, 'third_party_script_scan.json');
const REPORT_MD_PATH = path.join(REPORT_DIR, 'third_party_script_scan.md');
const ALLOWLIST_PATH = path.join(ROOT_DIR, 'scripts', 'security', 'third_party_script_allowlist.json');

const ALLOWLIST_DEFAULT = {
  allowedDomains: [
    'images.ctfassets.net',
    'storage.googleapis.com',
    'upload.wikimedia.org',
    'www.ncbi.nlm.nih.gov',
    'pathology.or.jp',
    'webpath.med.utah.edu',
    'openseadragon.github.io',
    'openslide.cs.cmu.edu',
  ],
  allowedSubstrings: [
    '/openseadragon/images/',
  ],
};

const SCAN_EXTENSIONS = new Set(['.html', '.js', '.jsx', '.ts', '.tsx', '.mjs']);
const SCAN_EXCLUDES = new Set(['node_modules', '.vite', 'dist', 'coverage', '.git', '.idea', '.vscode']);

const normalizeUrl = (value = '') => value.trim();

const parseUrl = (value) => {
  try {
    const parsed = new URL(value, 'https://local.dev');
    return { host: parsed.hostname.toLowerCase(), isRemote: Boolean(parsed.protocol && parsed.protocol.startsWith('http')) };
  } catch {
    return { host: '', isRemote: false };
  }
};

const isLocalUrl = (src = '') => {
  const value = normalizeUrl(src);
  if (!value) return true;
  if (value.startsWith('//')) return false;
  if (/^https?:\/\//i.test(value)) return false;
  return value.startsWith('/') || value.startsWith('./') || value.startsWith('../') || value.startsWith('mailto:') || value.startsWith('tel:') || value.startsWith('#');
};

const getAllowedDomains = (allowlist) => new Set([...(allowlist.allowedDomains || []), ...ALLOWLIST_DEFAULT.allowedDomains]);
const getAllowedSubstrings = (allowlist) => new Set([...(allowlist.allowedSubstrings || []), ...ALLOWLIST_DEFAULT.allowedSubstrings]);

const readAllowlist = () => {
  if (!fs.existsSync(ALLOWLIST_PATH)) {
    return ALLOWLIST_DEFAULT;
  }

  try {
    const raw = fs.readFileSync(ALLOWLIST_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      allowedDomains: Array.isArray(parsed.allowedDomains) ? parsed.allowedDomains : ALLOWLIST_DEFAULT.allowedDomains,
      allowedSubstrings: Array.isArray(parsed.allowedSubstrings) ? parsed.allowedSubstrings : ALLOWLIST_DEFAULT.allowedSubstrings,
    };
  } catch (error) {
    console.warn(`[SECURITY] Failed to parse allowlist at ${ALLOWLIST_PATH}. Using defaults.`, error.message);
    return ALLOWLIST_DEFAULT;
  }
};

const scanInlineScripts = (content, filePath, findings) => {
  const inlineScriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = inlineScriptRegex.exec(content))) {
    const full = match[0];
    const body = String(match[1] || '').trim();
    if (/src\s*=/.test(full) || !body) {
      continue;
    }
    if (body.length > 0) {
      findings.inline.push({
        file: filePath,
        snippet: body.slice(0, 250).replace(/\s+/g, ' '),
      });
    }
  }
};

const scanFile = (filePath, findings, allowlistDomains, allowlistSubstrings) => {
  findings.summary.totalFiles += 1;
  const content = fs.readFileSync(filePath, 'utf8');

  const scriptSrcRegex = /<script\b[^>]*\bsrc=(["'])(.*?)\1[^>]*>/gi;
  let match;

  while ((match = scriptSrcRegex.exec(content))) {
    const src = normalizeUrl(match[2] || '');
    if (isLocalUrl(src)) {
      continue;
    }
    const { host, isRemote } = parseUrl(src);
    if (!isRemote) {
      findings.warnings.push({
        file: filePath,
        rule: 'non-http script reference',
        src,
      });
      continue;
    }

    const exactAllowed = allowlistDomains.has(host);
    const suffixAllowed = [...allowlistDomains].some((domain) => host === domain || host.endsWith(`.${domain}`));
    const substringAllowed = [...allowlistSubstrings].some((snippet) => src.includes(snippet));

    if (!exactAllowed && !suffixAllowed && !substringAllowed) {
      findings.alerts.push({
        file: filePath,
        src,
        host,
      });
    } else {
      findings.allowed.push({
        file: filePath,
        src,
      });
    }
  }

  scanInlineScripts(content, filePath, findings);
};

const walk = (dir, findings, allowlistDomains, allowlistSubstrings) => {
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    return;
  }
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (SCAN_EXCLUDES.has(entry.name)) {
      continue;
    }
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(target, findings, allowlistDomains, allowlistSubstrings);
      continue;
    }
    if (!SCAN_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      continue;
    }
    scanFile(target, findings, allowlistDomains, allowlistSubstrings);
  }
};

const writeReport = (data) => {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.writeFileSync(REPORT_JSON_PATH, JSON.stringify(data, null, 2), 'utf8');

  const lines = [];
  lines.push('# Third-Party Script Scan');
  lines.push('');
  lines.push(`Scanned at: ${new Date().toISOString()}`);
  lines.push(`Files scanned: ${data.summary.totalFiles}`);
  lines.push('');
  lines.push(`## Findings`);
  lines.push('');
  lines.push(`- Unknown external script sources: ${data.alerts.length}`);
  lines.push(`- Inline script blocks: ${data.inline.length}`);
  lines.push(`- Allowed external script sources: ${data.allowed.length}`);
  lines.push(`- Non-HTTP script references: ${data.warnings.length}`);
  lines.push('');

  if (data.alerts.length) {
    lines.push('### Unknown External Scripts');
    for (const alert of data.alerts.slice(0, 50)) {
      lines.push(`- ${alert.file}: ${alert.src}`);
    }
    if (data.alerts.length > 50) {
      lines.push(`- ... and ${data.alerts.length - 50} more`);
    }
    lines.push('');
  }

  if (data.inline.length) {
    lines.push('### Inline Scripts');
    for (const item of data.inline.slice(0, 50)) {
      lines.push(`- ${item.file}: ${item.snippet}`);
    }
    if (data.inline.length > 50) {
      lines.push(`- ... and ${data.inline.length - 50} more`);
    }
    lines.push('');
  }

  if (data.warnings.length) {
    lines.push('### Non-HTTP Script References');
    for (const item of data.warnings.slice(0, 50)) {
      lines.push(`- ${item.file}: ${item.src}`);
    }
    if (data.warnings.length > 50) {
      lines.push(`- ... and ${data.warnings.length - 50} more`);
    }
    lines.push('');
  }

  fs.writeFileSync(REPORT_MD_PATH, `${lines.join('\n')}\n`, 'utf8');
};

const main = () => {
  const allowlist = readAllowlist();
  const allowDomains = getAllowedDomains(allowlist);
  const allowSubstrings = getAllowedSubstrings(allowlist);

  const findings = {
    scannedAt: new Date().toISOString(),
    summary: {
      allowedDomains: [...allowDomains].sort(),
      allowedSubstrings: [...allowSubstrings].sort(),
      totalFiles: 0,
    },
    allowed: [],
    alerts: [],
    inline: [],
    warnings: [],
  };

  const targetRoots = [
    path.join(ROOT_DIR, 'index.html'),
    path.join(ROOT_DIR, 'src'),
    path.join(ROOT_DIR, 'components'),
    path.join(ROOT_DIR, 'public'),
    path.join(ROOT_DIR, 'scripts'),
  ];

  for (const target of targetRoots) {
    if (!fs.existsSync(target)) {
      continue;
    }
    if (fs.statSync(target).isFile()) {
      scanFile(target, findings, allowDomains, allowSubstrings);
      continue;
    }
    walk(target, findings, allowDomains, allowSubstrings);
  }
  writeReport(findings);

  console.log('[SECURITY] Script scan complete');
  console.log(`[SECURITY] Unknown external scripts: ${findings.alerts.length}`);
  console.log(`[SECURITY] Inline scripts: ${findings.inline.length}`);
  console.log(`[SECURITY] Allowed external scripts: ${findings.allowed.length}`);
  console.log(`[SECURITY] Non-HTTP references: ${findings.warnings.length}`);

  if (findings.alerts.length > 0) {
    console.error('[SECURITY] Unknown external script sources detected.');
    process.exit(1);
  }

  if (findings.inline.length > 0) {
    console.error('[SECURITY] Inline scripts detected. They can bypass some CSP defenses.');
    process.exit(1);
  }

  console.log('[SECURITY] No unexpected third-party scripts detected.');
  process.exit(0);
};

main();
