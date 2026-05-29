#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

const publicLabelSurfaces = [
  'src/content/curriculum/activeCurriculum.ts',
  'src/content/curriculum/surgicalPathCurriculum.ts',
  'src/content/gu/gu_signout_sims.json',
  'src/content/signout_sims/signout_image_reference_index.json',
  'src/utils/lectureLibraryCatalog.ts',
];

const allowedByFile = new Map([
  [
    'src/utils/lectureLibraryCatalog.ts',
    [
      "if (category === 'GU Pathology') {",
      "sourceLabel: lecture.sourceRepo === 'didactic_series' ? 'P@thfndr Local' : 'Curated GU Imports',",
    ],
  ],
]);

const violations = [];

for (const relativePath of publicLabelSurfaces) {
  const absolutePath = path.join(root, relativePath);
  const lines = fs.readFileSync(absolutePath, 'utf8').split(/\r?\n/);
  const allowedLines = new Set(allowedByFile.get(relativePath) ?? []);

  lines.forEach((line, index) => {
    if (!/\bGU\b/.test(line)) {
      return;
    }
    if (allowedLines.has(line.trim())) {
      return;
    }
    violations.push({
      file: relativePath,
      line: index + 1,
      text: line.trim(),
    });
  });
}

if (violations.length > 0) {
  console.error('[GENITOURINARY-LABELS] Public GU shorthand found:');
  for (const violation of violations) {
    console.error(`- ${violation.file}:${violation.line} ${violation.text}`);
  }
  process.exit(1);
}

console.log(`[GENITOURINARY-LABELS] Validation passed across ${publicLabelSurfaces.length} public label surfaces.`);
