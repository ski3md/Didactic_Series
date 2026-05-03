#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const outputDir = path.join(repoRoot, 'src', 'assets', 'data');
const manifestPath = path.join(outputDir, 'image_manifest.json');
const rulesOutPath = path.join(outputDir, 'metadata_rules.json');
const statsPath = path.join(outputDir, 'manifest_stats.json');

const rootRulesPath = path.join(repoRoot, 'metadata_rules.json');
const curatedPath = path.join(
  repoRoot,
  'src',
  'content',
  'derived',
  'stainbrain_printable',
  'histology_images.from_service.json'
);
const promotedPath = path.join(
  repoRoot,
  'src',
  'content',
  'downloads_imports',
  'normalized',
  'images.normalized.json'
);
const bladderSupplementPath = path.join(
  repoRoot,
  'src',
  'content',
  'images',
  'bladderAtlasSupplement.json'
);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

const ENTITY_ALIASES = {
  'granulomatosis_with_polyangiitis': 'gpa',
  'foreign_body_granuloma': 'foreign_body',
  'foreign_body': 'foreign_body',
};

function normalizeEntityName(value) {
  const slug = slugify(value);
  return ENTITY_ALIASES[slug] || slug;
}

function toTitleCase(value) {
  return String(value || '')
    .split(/[_\-\s]+/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function basenameFromSrc(src) {
  try {
    return path.basename(new URL(src).pathname);
  } catch {
    return path.basename(String(src || 'image'));
  }
}

function buildCuratedRecord(image, rules) {
  const entityKey = normalizeEntityName(image.entity || image.family || image.title);
  const entityRule = rules.entities[entityKey];
  const category = image.category || entityRule?.category || 'curated-import';
  const stain = image.stain || 'Unspecified';
  const title = image.title || toTitleCase(entityKey);

  return {
    id: `curated_${image.id}`,
    entity: entityKey,
    category,
    pattern: image.family || title,
    cells: image.cells || entityRule?.cells || [],
    stain,
    stainRole: rules.stainRoles?.[stain] || 'reference image',
    organ: image.organ || 'mixed',
    system: image.system || 'pathology',
    difficulty: image.difficulty || entityRule?.difficulty || 'intermediate',
    path: image.fullUrl || image.thumbUrl,
    tags: [
      ...new Set([...(entityRule?.tags || []), ...(image.tags || []), slugify(image.family), slugify(title)].filter(Boolean)),
    ],
    teachingPoint: image.teachingPoint || entityRule?.teachingPoint || image.description || `Curated histology atlas image for ${title}.`,
    source: image.sourcePageUrl || 'migrated-curated-atlas',
    filename: basenameFromSrc(image.fullUrl || image.thumbUrl),
    aiEnhanced: false,
  };
}

function buildPromotedRecord(image, rules) {
  const entityKey = normalizeEntityName(image.entity || image.title);
  const entityRule = rules.entities[entityKey];
  const category = entityRule?.category || 'promoted-granulomatous';
  const stain = image.stain || 'H&E';

  return {
    id: `promoted_${image.id}`,
    entity: entityKey,
    category,
    pattern: image.title || toTitleCase(entityKey),
    cells: image.provenance?.cells || entityRule?.cells || [],
    stain,
    stainRole: rules.stainRoles?.[stain] || 'reference image',
    organ: 'lung',
    system: 'thoracic',
    difficulty: image.difficulty || entityRule?.difficulty || 'intermediate',
    path: image.src,
    tags: [...new Set([...(entityRule?.tags || []), slugify(image.entity), 'granulomatous'].filter(Boolean))],
    teachingPoint: entityRule?.teachingPoint || image.description || `${toTitleCase(entityKey)} histology image.`,
    source: image.provenance?.sourceRepo || 'promoted-downloads-atlas',
    filename: basenameFromSrc(image.src),
    aiEnhanced: false,
  };
}

function pushManifestRecord(manifest, record) {
  const categoryBucket = (manifest.categories[record.category] ||= {});
  const entityBucket = (categoryBucket[record.entity] ||= {});
  const stainBucket = (entityBucket[record.stain] ||= []);
  stainBucket.push(record);
}

function main() {
  ensureDir(outputDir);

  const rules = fs.existsSync(rootRulesPath)
    ? readJson(rootRulesPath)
    : {
        version: '1.0.0',
        schema: 'who-2022-thoracic',
        entities: {},
        stainRoles: {},
        difficultyLevels: {},
      };

  const curatedImages = fs.existsSync(curatedPath) ? readJson(curatedPath) : [];
  const promotedImages = fs.existsSync(promotedPath) ? readJson(promotedPath) : [];
  const bladderSupplementImages = fs.existsSync(bladderSupplementPath) ? readJson(bladderSupplementPath) : [];

  const manifest = {
    generated: new Date().toISOString(),
    ai_enhanced: false,
    version: '1.0.0-compat',
    schema: rules.schema || 'who-2022-thoracic',
    categories: {},
  };

  [...curatedImages, ...bladderSupplementImages]
    .map((image) => buildCuratedRecord(image, rules))
    .forEach((record) => pushManifestRecord(manifest, record));
  promotedImages.map((image) => buildPromotedRecord(image, rules)).forEach((record) => pushManifestRecord(manifest, record));

  const allRecords = Object.values(manifest.categories)
    .flatMap((entityMap) => Object.values(entityMap))
    .flatMap((stainMap) => Object.values(stainMap))
    .flat();

  const stats = {
    generated: manifest.generated,
    categories: Object.keys(manifest.categories).length,
    entities: allRecords.reduce((acc, record) => acc.add(record.entity), new Set()).size,
    images: allRecords.length,
    curatedImages: allRecords.filter((record) => String(record.id).startsWith('curated_')).length,
    promotedImages: allRecords.filter((record) => String(record.id).startsWith('promoted_')).length,
    stains: allRecords.reduce((acc, record) => acc.add(record.stain), new Set()).size,
  };

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  fs.writeFileSync(rulesOutPath, JSON.stringify(rules, null, 2) + '\n');
  fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2) + '\n');

  console.log(`Wrote ${manifestPath}`);
  console.log(`Wrote ${rulesOutPath}`);
  console.log(`Wrote ${statsPath}`);
  console.log(`Images: ${stats.images} (${stats.curatedImages} curated, ${stats.promotedImages} promoted)`);
}

main();
