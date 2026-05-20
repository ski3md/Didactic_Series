#!/usr/bin/env node

const fs = require('fs');
const http = require('http');
const path = require('path');
const crypto = require('crypto');

const PORT = Number(process.env.PORT || '4174');
const ROOT_DIR = path.resolve(
  process.env.DIDACTICS_TUNNEL_ROOT || '/Users/ski_mini/.cloudflared/pthfndr-didactics-dist',
);

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8',
};

const SECURITY_HEADERS = {
  'Cache-Control': 'public, max-age=300',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '0',
};

const CSP_CONNECT = [
  "'self'",
  'https://images.ctfassets.net',
  'https://api.allorigins.win',
].join(' ');

const CSP_IMG = [
  "'self'",
  'data:',
  'blob:',
  'https://*.googleapis.com',
  'https://storage.googleapis.com',
  'https://upload.wikimedia.org',
  'https://www.ncbi.nlm.nih.gov',
  'https://pathology.or.jp',
  'https://webpath.med.utah.edu',
  'https://openseadragon.github.io',
  'https://openslide.cs.cmu.edu',
].join(' ');

const HTML_HEADER_PATTERN = /<meta\s+http-equiv=["']Content-Security-Policy["'][^>]*>\s*/i;

function buildCspHeader(nonce) {
  return [
    "default-src 'self'",
    "base-uri 'self'",
    `connect-src ${CSP_CONNECT}`,
    `img-src ${CSP_IMG}`,
    "font-src 'self' https://fonts.gstatic.com",
    "style-src 'self' https://fonts.googleapis.com",
    `script-src 'self' 'nonce-${nonce}'`,
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "manifest-src 'self'",
    'upgrade-insecure-requests',
  ].join('; ');
}

function sendError(res, statusCode, message) {
  res.writeHead(statusCode, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(message);
}

function resolveFilePath(requestPath) {
  const [pathname] = requestPath.split('?');
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    return null;
  }

  const normalizedPath = path.posix.normalize(decodedPath);
  const relativePath = normalizedPath.replace(/^\/+/, '');
  let candidatePath = path.join(ROOT_DIR, relativePath);

  if (!candidatePath.startsWith(ROOT_DIR)) {
    return null;
  }

  if (fs.existsSync(candidatePath) && fs.statSync(candidatePath).isDirectory()) {
    candidatePath = path.join(candidatePath, 'index.html');
  } else if (!path.extname(candidatePath)) {
    const directoryIndex = path.join(candidatePath, 'index.html');
    if (fs.existsSync(directoryIndex)) {
      candidatePath = directoryIndex;
    }
  }

  if (!candidatePath.startsWith(ROOT_DIR) || !fs.existsSync(candidatePath)) {
    return null;
  }

  return candidatePath;
}

function injectNonceMeta(html, nonce) {
  const nonceMeta = `<meta property="csp-nonce" nonce="${nonce}" content="${nonce}">`;
  const strippedHtml = html.replace(HTML_HEADER_PATTERN, '');

  if (strippedHtml.includes('property="csp-nonce"')) {
    return strippedHtml;
  }

  return strippedHtml.replace(/<head>/i, `<head>\n    ${nonceMeta}`);
}

const server = http.createServer((req, res) => {
  if (!req.url) {
    sendError(res, 400, 'Bad Request');
    return;
  }

  const filePath = resolveFilePath(req.url);
  if (!filePath) {
    sendError(res, 404, 'Not Found');
    return;
  }

  const extension = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[extension] || 'application/octet-stream';

  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    res.setHeader(name, value);
  }
  res.setHeader('Content-Type', contentType);

  if (extension === '.html') {
    const nonce = crypto.randomBytes(16).toString('base64');
    const html = fs.readFileSync(filePath, 'utf8');
    const responseHtml = injectNonceMeta(html, nonce);
    res.setHeader('Content-Security-Policy', buildCspHeader(nonce));
    res.statusCode = 200;
    if (req.method === 'HEAD') {
      res.end();
      return;
    }
    res.end(responseHtml);
    return;
  }

  res.statusCode = 200;
  if (req.method === 'HEAD') {
    res.end();
    return;
  }
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, () => {
  console.log(
    JSON.stringify(
      {
        port: PORT,
        rootDir: ROOT_DIR,
        server: 'didactics-nonce-origin',
      },
      null,
      2,
    ),
  );
});
