#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const manifestPath = path.join(repoRoot, 'src/content/gu/who_gu_entity_manifest.json');
const lecturesPath = path.join(repoRoot, 'src/content/lectures/gu_who_complete_lectures.normalized.json');

const REQUIRED_ENTITY_FIELDS = [
  'clinical_context',
  'gross_or_specimen_context',
  'morphology_anchor',
  'ancillary_anchor',
  'top_differential',
  'reporting_consequence',
];

const REQUIRED_VISUAL_AID_FIELDS = ['imageUrl', 'sourcePageUrl', 'alt', 'caption'];

const VAGUE_VISUAL_CAPTION_PATTERNS = [
  /\bvisualizes why\b/i,
  /\banchors?\b/i,
  /\breinforces?\b/i,
  /\bsupports the\b/i,
  /\bimportant diagnosis\b/i,
  /\bconcrete example\b/i,
  /\bgives a concrete\b/i,
  /\bcentral to\b/i,
  /\bwhy .+ matters\b/i,
  /\bmatters\b/i,
  /\bbranch\b/i,
  /\btrap\b/i,
];

const SITE_TO_LECTURE_ID = {
  penis: 'penile_who_complete_pathology',
  testis: 'testicular_who_complete_pathology',
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[‐‑‒–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasText(value) {
  if (Array.isArray(value)) {
    return value.length > 0 && value.every((entry) => hasText(entry));
  }
  return normalize(value).length > 0;
}

function lectureContainsEntity(lectureBody, entity) {
  const normalizedBody = normalize(lectureBody);
  const candidates = [entity.entity, ...(entity.synonyms || [])].filter(Boolean);

  return candidates.some((candidate) => normalizedBody.includes(normalize(candidate)));
}

function vagueCaptionPattern(caption) {
  return VAGUE_VISUAL_CAPTION_PATTERNS.find((pattern) => pattern.test(String(caption || '')));
}

function validateVisualSource(owner, visualAid, failures) {
  if (visualAid.imageUrl.includes('Special:FilePath') || visualAid.imageUrl.includes('Special:Redirect/file')) {
    failures.push(`${owner} uses brittle Commons resolver imageUrl instead of a resolved upload URL: ${visualAid.imageUrl}`);
  }
  if (!visualAid.imageUrl.startsWith('https://upload.wikimedia.org/')) {
    failures.push(`${owner} imageUrl must use a resolved Wikimedia upload URL: ${visualAid.imageUrl}`);
  }
  if (!visualAid.sourcePageUrl.startsWith('https://commons.wikimedia.org/wiki/File:')) {
    failures.push(`${owner} sourcePageUrl must point to the Commons file page: ${visualAid.sourcePageUrl}`);
  }
}

function main() {
  const manifest = readJson(manifestPath);
  const lectures = readJson(lecturesPath);
  const lecturesById = new Map(lectures.map((lecture) => [lecture.id, lecture]));
  const failures = [];
  const siteCounts = {};

  for (const site of manifest.coverageContract.requiredLectureSites) {
    const lectureId = SITE_TO_LECTURE_ID[site];
    if (!lecturesById.has(lectureId)) {
      failures.push(`Missing required ${site} lecture: ${lectureId}`);
    }
  }

  for (const entity of manifest.entities) {
    siteCounts[entity.site] = (siteCounts[entity.site] || 0) + 1;

    for (const field of REQUIRED_ENTITY_FIELDS) {
      if (!hasText(entity[field])) {
        failures.push(`${entity.id} is missing required manifest field: ${field}`);
      }
    }

    if (!Array.isArray(entity.visualAids) || entity.visualAids.length === 0) {
      failures.push(`${entity.id} needs at least one descriptor visualAid`);
    } else {
      for (const [index, visualAid] of entity.visualAids.entries()) {
        for (const field of REQUIRED_VISUAL_AID_FIELDS) {
          if (!hasText(visualAid[field])) {
            failures.push(`${entity.id} visualAid ${index + 1} is missing ${field}`);
          }
        }
        const pattern = vagueCaptionPattern(visualAid.caption);
        if (pattern) {
          failures.push(`${entity.id} visualAid ${index + 1} caption is vague (${pattern}): "${visualAid.caption}"`);
        }
        validateVisualSource(`${entity.id} visualAid ${index + 1}`, visualAid, failures);
      }
    }

    const lectureId = SITE_TO_LECTURE_ID[entity.site];
    const lecture = lecturesById.get(lectureId);
    if (!lecture) {
      continue;
    }

    if (!lectureContainsEntity(lecture.body, entity)) {
      failures.push(`${entity.id} (${entity.entity}) is not covered in ${lectureId}`);
    }
  }

  for (const lecture of lectures) {
    if (!Array.isArray(lecture.learningObjectives) || lecture.learningObjectives.length < 3) {
      failures.push(`${lecture.id} needs at least three learning objectives`);
    }
    if (!Array.isArray(lecture.slides) || lecture.slides.length < 6) {
      failures.push(`${lecture.id} needs at least six slide descriptors`);
    } else {
      for (const slide of lecture.slides) {
        if (!slide.visualAid?.imageUrl || !slide.visualAid?.sourcePageUrl || !slide.visualAid?.caption) {
          failures.push(`${lecture.id} slide "${slide.title}" needs a visualAid with imageUrl, sourcePageUrl, and caption`);
        } else {
          const pattern = vagueCaptionPattern(slide.visualAid.caption);
          if (pattern) {
            failures.push(`${lecture.id} slide "${slide.title}" visualAid caption is vague (${pattern}): "${slide.visualAid.caption}"`);
          }
          validateVisualSource(`${lecture.id} slide "${slide.title}" visualAid`, slide.visualAid, failures);
        }
      }
    }
    if (!Array.isArray(lecture.mcqs) || lecture.mcqs.length < 2) {
      failures.push(`${lecture.id} needs at least two resident check questions`);
    }
    if (!lecture.provenance || lecture.provenance.manifest !== 'src/content/gu/who_gu_entity_manifest.json') {
      failures.push(`${lecture.id} must point back to the GU WHO manifest`);
    }
  }

  if (failures.length > 0) {
    console.error('GU WHO coverage validation failed:');
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log('GU WHO coverage validation passed.');
  console.log(`Penile entities covered: ${siteCounts.penis || 0}`);
  console.log(`Testicular/paratesticular entities covered: ${siteCounts.testis || 0}`);
  console.log(`Lectures validated: ${lectures.map((lecture) => lecture.id).join(', ')}`);
}

main();
