#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const lectureFiles = [
  'src/content/lectures/lectures.normalized.json',
  'src/content/lectures/gu_who_complete_lectures.normalized.json',
  'src/content/lectures/customLectures.ts',
  'src/content/lectures/guPilotEnhancements.ts',
  'src/content/downloads_imports/normalized/lectures.normalized.json',
];

const bannedPatterns = [
  /\bvisualizes why\b/i,
  /\bwhy it matters\b/i,
  /\bwhy .+ matters\b/i,
  /\bcentral to\b/i,
  /\banchors? the lecture\b/i,
  /\breinforces?\b/i,
  /\bimportant diagnosis\b/i,
  /\bconcrete example\b/i,
  /\bgives a concrete\b/i,
  /\bAssume\b/,
  /\bolder-patient\b/i,
  /\bnon-GCNIS pathway\b/i,
];

const failures = [];

for (const relativePath of lectureFiles) {
  const filePath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(filePath)) {
    continue;
  }
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const pattern of bannedPatterns) {
      if (pattern.test(line)) {
        failures.push(`${relativePath}:${index + 1} has vague lecture language (${pattern}): ${line.trim()}`);
      }
    }
  });
}

if (failures.length > 0) {
  console.error('Lecture explicit-language validation failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Lecture explicit-language validation passed.');
