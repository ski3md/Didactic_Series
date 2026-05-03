const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = process.cwd();
const GU_PATH = path.join(ROOT, 'src', 'content', 'gu', 'gu_signout_sims.json');
const SIM_DIR = path.join(ROOT, 'src', 'content', 'signout_sims');
const OUT_PATH = path.join(ROOT, 'src', 'content', 'signout_sims', 'image_acquisition_plan.json');

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));

const sourceToDirectUrl = (image) => {
  if (image.imageUrl) return image.imageUrl;
  const sourceUrl = image.sourceUrl || '';
  const commonsMatch = sourceUrl.match(/commons\.wikimedia\.org\/wiki\/File:(.+)$/);
  if (commonsMatch) {
    const filename = decodeURIComponent(commonsMatch[1]);
    const hash = crypto.createHash('md5').update(filename).digest('hex');
    return `https://upload.wikimedia.org/wikipedia/commons/${hash[0]}/${hash.slice(0, 2)}/${encodeURIComponent(filename)}`;
  }
  if (/\.(jpe?g|png|webp|gif|svg)(\?|$)/i.test(sourceUrl)) return sourceUrl;
  return null;
};

const files = [
  GU_PATH,
  ...(fs.existsSync(SIM_DIR)
    ? fs
        .readdirSync(SIM_DIR)
        .filter((file) => file.endsWith('_signout_sims.json'))
        .map((file) => path.join(SIM_DIR, file))
    : []),
];

const acquisitions = [];
const unresolved = [];

for (const filePath of files) {
  const data = readJson(filePath);
  for (const item of data.cases || []) {
    const localPath = item.image?.src ? path.join(ROOT, 'public', item.image.src) : '';
    if (!localPath || fs.existsSync(localPath)) continue;
    const directUrl = sourceToDirectUrl(item.image || {});
    const record = {
      caseId: item.id,
      title: item.title,
      file: path.relative(ROOT, filePath),
      localPath: item.image?.src || '',
      absolutePath: localPath,
      sourceUrl: item.image?.sourceUrl || '',
      directUrl,
    };
    if (directUrl) acquisitions.push(record);
    else unresolved.push(record);
  }
}

const plan = {
  generatedAt: new Date().toISOString(),
  acquisitions,
  unresolved,
};

fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
fs.writeFileSync(OUT_PATH, `${JSON.stringify(plan, null, 2)}\n`);

console.log(
  JSON.stringify(
    {
      output: path.relative(ROOT, OUT_PATH),
      acquisitions: acquisitions.length,
      unresolved: unresolved.length,
    },
    null,
    2
  )
);

for (const item of unresolved) {
  console.error(`UNRESOLVED ${item.caseId}: ${item.sourceUrl || 'no sourceUrl'}`);
}
if (unresolved.length > 0) process.exitCode = 1;
