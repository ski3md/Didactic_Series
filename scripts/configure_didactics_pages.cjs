const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const distRoot = path.join(repoRoot, 'dist');
const didacticsDir = path.join(distRoot, 'didactics');
const domain = process.env.PTHFNDR_DOMAIN || 'pthfndr.online';
const didacticsPath = '/didactics/';
const didacticsAdminPath = '/didactics/admin/';
const didacticsFaviconIco = path.join(didacticsDir, 'favicon.ico');
const didacticsFaviconSvg = path.join(didacticsDir, 'favicon.svg');
const rootFaviconIco = path.join(distRoot, 'favicon.ico');
const rootFaviconSvg = path.join(distRoot, 'favicon.svg');

const copyIfExists = (src, dest) => {
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
  }
};

if (!fs.existsSync(path.join(didacticsDir, 'index.html'))) {
  throw new Error(`Expected didactics build at ${path.join(didacticsDir, 'index.html')}`);
}

const didacticsIndexHtml = fs.readFileSync(path.join(didacticsDir, 'index.html'), 'utf8');
const adminDir = path.join(didacticsDir, 'admin');

const redirectHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>P@thfndr Didactics</title>
    <meta http-equiv="refresh" content="0; url=${didacticsPath}">
    <link rel="canonical" href="https://${domain}${didacticsPath}">
  </head>
  <body>
    <main>
      <p>P@thfndr didactics moved to <a href="${didacticsPath}">${didacticsPath}</a>.</p>
    </main>
    <script>window.location.replace('${didacticsPath}');</script>
  </body>
</html>
`;

fs.mkdirSync(distRoot, { recursive: true });
fs.writeFileSync(path.join(distRoot, 'index.html'), redirectHtml);
fs.writeFileSync(path.join(distRoot, '404.html'), redirectHtml);
fs.writeFileSync(path.join(distRoot, 'CNAME'), `${domain}\n`);
fs.writeFileSync(path.join(distRoot, '.nojekyll'), '');
fs.mkdirSync(adminDir, { recursive: true });
fs.writeFileSync(path.join(adminDir, 'index.html'), didacticsIndexHtml);
copyIfExists(didacticsFaviconIco, rootFaviconIco);
copyIfExists(didacticsFaviconSvg, rootFaviconSvg);

console.log(`Configured GitHub Pages artifact for https://${domain}${didacticsPath} and ${didacticsAdminPath}`);
