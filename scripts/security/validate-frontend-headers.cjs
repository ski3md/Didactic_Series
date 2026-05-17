#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT_DIR = process.cwd();
const INDEX_PATH = path.join(ROOT_DIR, 'index.html');
const HEADERS_PATH = path.join(ROOT_DIR, 'public', '_headers');
const REPORT_DIR = path.join(ROOT_DIR, 'reports', 'security');
const REPORT_PATH = path.join(REPORT_DIR, 'frontend_header_audit.md');

const REQUIRED_INDEX_HEADERS = [
  'Content-Security-Policy',
  'Referrer-Policy',
  'X-Content-Type-Options',
  'X-Frame-Options',
  'Permissions-Policy',
];

const REQUIRED_HEADERS_FILE_RULES = [
  { name: 'Content-Security-Policy', requiredAny: ['default-src', 'script-src', 'img-src', 'connect-src'] },
  { name: 'Strict-Transport-Security', requiredAny: ['max-age='] },
  { name: 'Referrer-Policy', requiredAny: ['strict-origin-when-cross-origin'] },
];

const readFileSafe = (filePath, fallback = '') => {
  if (!fs.existsSync(filePath)) return fallback;
  return fs.readFileSync(filePath, 'utf8');
};

const hasMetaHeader = (html, headerName) => {
  const tag = new RegExp(`<meta\\s+http-equiv=["']${headerName}["'][^>]*content=(["'])([\\s\\S]*?)\\1`, 'i');
  return Boolean(html.match(tag));
};

const extractMetaContent = (html, headerName) => {
  const tag = new RegExp(`<meta\\s+http-equiv=["']${headerName}["'][^>]*content=(["'])([\\s\\S]*?)\\1`, 'i');
  const match = html.match(tag);
  return match?.[2] || '';
};

const validateHeadersFile = (content) => {
  const required = [
    'Content-Security-Policy',
    'Referrer-Policy',
    'X-Content-Type-Options',
    'X-Frame-Options',
    'Cross-Origin-Opener-Policy',
    'Permissions-Policy',
    'Strict-Transport-Security',
  ];

  const failures = [];
  for (const headerName of required) {
    if (!new RegExp(`^\\s*${headerName}\\s*:`, 'im').test(content)) {
      failures.push(headerName);
    }
  }

  return failures;
}

const validateRequiredPolicies = (content, rules) => {
  const failures = [];
  for (const rule of rules) {
    const line = content
      .split('\n')
      .map((line) => line.trim())
      .find((line) => line.toLowerCase().startsWith(`${rule.name.toLowerCase()}:`));
    if (!line) {
      failures.push(`${rule.name}:missing`);
      continue;
    }
    for (const token of rule.requiredAny) {
      if (!line.includes(token)) {
        failures.push(`${rule.name}:missing_${token.replace(/[^a-z0-9-_=]/gi, '_')}`);
      }
    }
  }
  return failures;
};

const main = () => {
  const indexHtml = readFileSafe(INDEX_PATH);
  const headersTxt = readFileSafe(HEADERS_PATH);
  const failures = [];
  const warnings = [];

  for (const headerName of REQUIRED_INDEX_HEADERS) {
    if (!hasMetaHeader(indexHtml, headerName)) {
      failures.push(`index.html missing meta header: ${headerName}`);
    }
  }

  const csp = extractMetaContent(indexHtml, 'Content-Security-Policy');
  if (!csp.includes('default-src') || !csp.includes('script-src')) {
    failures.push('index.html CSP missing required source controls (default-src / script-src)');
  }
  if (csp.includes("'unsafe-inline'")) {
    warnings.push('index.html CSP allows unsafe-inline scripts');
  }
  if (csp.includes('connect-src') === false) {
    failures.push('index.html CSP missing connect-src');
  }

  const headersFailures = validateHeadersFile(headersTxt);
  if (headersFailures.length) {
    failures.push(...headersFailures.map((h) => `public/_headers missing required header: ${h}`));
  }

  const policyFailures = validateRequiredPolicies(headersTxt, REQUIRED_HEADERS_FILE_RULES, 'public/_headers');
  if (policyFailures.length) {
    failures.push(...policyFailures.map((item) => `public/_headers policy issue: ${item}`));
  }

  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const lines = [];
  lines.push('# Frontend Header Audit');
  lines.push('');
  lines.push(`Ran at: ${new Date().toISOString()}`);
  lines.push('');
  lines.push(`Index CSP: ${csp || 'not found'}`);
  lines.push(`Header file status: ${headersTxt ? 'present' : 'missing'}`);
  lines.push('');
  lines.push('## Failures');
  if (!failures.length) {
    lines.push('- None');
  } else {
    for (const item of failures) lines.push(`- ${item}`);
  }
  lines.push('');
  lines.push('## Warnings');
  if (!warnings.length) {
    lines.push('- None');
  } else {
    for (const item of warnings) lines.push(`- ${item}`);
  }
  fs.writeFileSync(REPORT_PATH, `${lines.join('\n')}\n`, 'utf8');

  if (warnings.length) {
    console.log('[SECURITY] Header audit completed with warnings.');
  }

  if (failures.length) {
    console.error('[SECURITY] Header audit failed');
    for (const item of failures) {
      console.error(` - ${item}`);
    }
    process.exit(1);
  }

  console.log('[SECURITY] Header audit passed');
  process.exit(0);
};

main();
