const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const GU_PATH = path.join(ROOT, 'src', 'content', 'gu', 'gu_signout_sims.json');
const SIM_DIR = path.join(ROOT, 'src', 'content', 'signout_sims');
const OUT_PATH = path.join(ROOT, 'src', 'content', 'signout_sims', 'signout_image_reference_index.json');

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));

const files = [
  GU_PATH,
  ...(fs.existsSync(SIM_DIR)
    ? fs
        .readdirSync(SIM_DIR)
        .filter((file) => file.endsWith('_signout_sims.json'))
        .map((file) => path.join(SIM_DIR, file))
    : []),
];

const images = [];
const missing = [];

for (const filePath of files) {
  const curriculum = readJson(filePath);
  for (const item of curriculum.cases || []) {
    if (!item.image?.src) continue;
    const absolutePath = path.join(ROOT, 'public', item.image.src);
    const exists = fs.existsSync(absolutePath);
    const stat = exists ? fs.statSync(absolutePath) : null;
    const record = {
      caseId: item.id,
      title: item.title,
      specialty: curriculum.specialty || curriculum.title || path.basename(filePath),
      workflow: item.workflow,
      localPath: item.image.src,
      publicPath: `${item.image.src}`,
      absolutePath,
      exists,
      bytes: stat?.size || 0,
      caption: item.image.caption,
      stain: item.image.stain,
      sourceUrl: item.image.sourceUrl,
      curriculumFile: path.relative(ROOT, filePath),
    };
    images.push(record);
    if (!exists) missing.push(record);
  }
}

const index = {
  generatedAt: new Date().toISOString(),
  totalImages: images.length,
  presentImages: images.filter((item) => item.exists).length,
  missingImages: missing.length,
  images,
  missing,
};

fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
fs.writeFileSync(OUT_PATH, `${JSON.stringify(index, null, 2)}\n`);

console.log(
  JSON.stringify(
    {
      output: path.relative(ROOT, OUT_PATH),
      totalImages: index.totalImages,
      presentImages: index.presentImages,
      missingImages: index.missingImages,
    },
    null,
    2
  )
);

if (missing.length > 0) process.exitCode = 1;
