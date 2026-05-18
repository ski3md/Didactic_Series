#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const tutorialSources = [
  {
    dataset: 'board-prep',
    file: path.join(root, 'src/content/tutorials/tutorials.normalized.json'),
  },
  {
    dataset: 'clinical-path-interactive',
    file: path.join(root, 'src/content/tutorials/clinicalPathInteractiveTutorials.json'),
  },
  {
    dataset: 'downloads-imports',
    file: path.join(root, 'src/content/downloads_imports/normalized/tutorials.normalized.json'),
  },
];
const jsonReportPath = path.join(root, 'reports/tutorial_label_validation.json');
const mdReportPath = path.join(root, 'reports/tutorial_label_validation.md');
const csvReportPath = path.join(root, 'reports/tutorial_label_validation.csv');

const laneLabels = {
  'board-prep': 'Board Prep Tutorials',
  'lab-studio': 'Clinical Lab Studios',
  'core-patterns': 'Core Pattern Tutorials',
  granuloma: 'Granuloma Tutorials',
  mixed: 'Tutorial Library',
};

const trackLabels = {
  'surgical-path': 'Surgical Pathology',
  'clinical-path': 'Clinical Pathology',
  'cross-cutting': 'Cross-Cutting',
};

const promotionLabels = {
  canonical: 'Canonical',
  staged: 'Available',
};

const clinicalKeywords = [
  'abnormal coagulation',
  'analytical technique',
  'antibody screen',
  'antimicrobial',
  'apheresis',
  'bacteriology',
  'blood bank',
  'blood banking',
  'blood donor',
  'blood donors',
  'blood gas',
  'blood gases',
  'blood group',
  'blood product',
  'blood products',
  'carbohydrate blood groups',
  'chemical pathology',
  'transfusion',
  'clinical chemistry',
  'chemistry',
  'clia',
  'microbiology',
  'coagulation',
  'coagulopathy',
  'compatibility testing',
  'component processing',
  'cryopreservation',
  'cytapheresis',
  'dat',
  'delta check',
  'donor eligibility',
  'drugs of abuse',
  'electrochemistry',
  'electrolytes',
  'electrophoresis',
  'ffp',
  'gram negative',
  'gram positive',
  'hla',
  'immunoassay',
  'laboratory management',
  'laboratory medicine',
  'laboratory safety',
  'mass spectrometry',
  'medical microbiology',
  'mycobacteria',
  'mycology',
  'parasitology',
  'platelet',
  'plasma components',
  'quality assurance',
  'quality control',
  'reference intervals',
  'rhig',
  'serum protein electrophoresis',
  'laboratory',
  'clinical pathology',
  'serology',
  'spectrophotometry',
  'therapeutic drug monitoring',
  'toxicology',
  'trali',
  'taco',
  'virology',
];

const crossCuttingKeywords = [
  'acute leukemia',
  'acute leukemias',
  'benign hematology',
  'hematopathology',
  'hematopoietic',
  'hemoglobinopathy',
  'histiocytic',
  'lymphoma',
  'leukemia',
  'myelodysplastic',
  'myeloproliferative',
  'bone marrow',
  'plasma cell neoplasm',
  'plasma cell neoplasms',
  'sickle cell',
];

const surgicalKeywords = [
  'ap:',
  'adenocarcinoma',
  'adipocytic',
  'adrenal',
  'breast',
  'cardiovascular',
  'carcinoma',
  'cervix',
  'cholangiocarcinoma',
  'cytopathology',
  'dermatopathology',
  'endocrine',
  'esophagus',
  'forensic',
  'glial',
  'glioblastoma',
  'glioma',
  'gyn',
  'gynecologic',
  'renal',
  'testicular',
  'lung',
  'gi',
  'gastrointestinal',
  'bladder',
  'pancreas',
  'thyroid',
  'soft tissue',
  'bone',
  'histology',
  'neuropathology',
  'ovary',
  'placenta',
  'prostate',
  'salivary',
  'sarcoidosis',
  'granuloma',
];

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const ensureDir = (file) => fs.mkdirSync(path.dirname(file), { recursive: true });
const unique = (values) => Array.from(new Set(values.filter(Boolean)));
const csvCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

const inferLane = (record) => {
  if (record.lane) return record.lane;
  if (record.sourceRepo === 'board_prep') return 'board-prep';
  if (record.sourceRepo === 'ioc-next-app') return 'core-patterns';
  if ((record.category || '').toLowerCase().includes('granulomatous')) return 'granuloma';
  return 'mixed';
};

const inferPromotion = (record) => (record.sourceRepo === 'board_prep' ? 'canonical' : 'staged');

const inferSourceLabel = (sourceRepo) => {
  if (!sourceRepo) return 'Unknown source';
  if (sourceRepo === 'board_prep') return 'Board Prep Library';
  if (sourceRepo === 'pthfndr_cp_interactive') return 'P@thfndr Interactive CP';
  if (sourceRepo === 'ioc-next-app') return 'Pattern Tutorial Imports';
  if (sourceRepo.includes('cp-content-specification')) return 'CP Content Specifications';
  if (sourceRepo.includes('granulomatous')) return 'Granulomatous Module Imports';
  if (sourceRepo.includes('abpath-advanced-board-prep-platform')) return 'ABPath Board Prep Imports';
  return sourceRepo;
};

const matchKeywords = (text, keywords) => keywords.filter((keyword) => text.includes(keyword));

const inferTrack = (record) => {
  if (record.track) {
    return {
      track: record.track,
      evidence: unique([`declared-track:${record.track}`, ...(record.tags || []).slice(0, 4)]),
      confidence: 'high',
    };
  }
  const sourceRepo = (record.sourceRepo || '').toLowerCase();
  const id = (record.id || '').toLowerCase();
  const text = [record.title, record.summary, String(record.body || '').slice(0, 2200), record.category, ...(record.tags || [])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const clinicalHits = matchKeywords(text, clinicalKeywords);
  const crossHits = matchKeywords(text, crossCuttingKeywords);
  const surgicalHits = matchKeywords(text, surgicalKeywords);

  if (sourceRepo.includes('cp-content-specification')) {
    const track = /^topic-hp\b/.test(id) ? 'cross-cutting' : 'clinical-path';
    return {
      track,
      evidence: unique([`source:${record.sourceRepo}`, /^topic-hp\b/.test(id) ? 'id:topic-hp' : 'cp-source']),
      confidence: 'high',
    };
  }

  const clinicalScore = clinicalHits.length + (/^topic-(bb|cp|mb)\b/.test(id) ? 3 : 0);
  const crossScore = crossHits.length + (/^topic-hp\b/.test(id) ? 3 : 0);
  const surgicalScore = surgicalHits.length + (/^topic-ap\b/.test(id) ? 3 : 0) + (sourceRepo.includes('granulomatous') ? 2 : 0);

  if (clinicalScore > 0 && clinicalScore >= crossScore && clinicalScore >= surgicalScore) {
    return { track: 'clinical-path', evidence: unique(clinicalHits.slice(0, 8)), confidence: clinicalScore >= 2 ? 'high' : 'medium' };
  }
  if (crossScore > 0 && crossScore >= surgicalScore) {
    return { track: 'cross-cutting', evidence: unique(crossHits.slice(0, 8)), confidence: crossScore >= 2 ? 'high' : 'medium' };
  }
  if (surgicalScore > 0) {
    return {
      track: 'surgical-path',
      evidence: unique([sourceRepo.includes('granulomatous') ? 'source:granulomatous' : null, ...surgicalHits.slice(0, 8)]),
      confidence: surgicalScore >= 2 ? 'high' : 'medium',
    };
  }

  return { track: 'surgical-path', evidence: [], confidence: 'low' };
};

const records = tutorialSources.flatMap((source) =>
  readJson(source.file).map((record) => ({
    ...record,
    dataset: source.dataset,
    file: path.relative(root, source.file),
  }))
);

const validations = records.map((record) => {
  const lane = inferLane(record);
  const promotion = inferPromotion(record);
  const trackResult = inferTrack(record);
  const sourceLabel = inferSourceLabel(record.sourceRepo || 'unknown');
  const topicChips = unique([
    trackLabels[trackResult.track],
    laneLabels[lane].replace(' Tutorials', ''),
    promotionLabels[promotion],
    record.category || '',
    ...(record.tags || []).slice(0, 4),
  ]).slice(0, 6);

  const issues = [];
  if (trackResult.confidence === 'low') issues.push('track label uses fallback surgical-path with no content evidence');
  if (!record.title) issues.push('missing title');
  if (!record.body) issues.push('missing body');
  if (sourceLabel === 'Unknown source') issues.push('unknown source label');
  if (!topicChips.includes(trackLabels[trackResult.track])) issues.push('topic chips missing track label');
  if (!topicChips.includes(laneLabels[lane].replace(' Tutorials', ''))) issues.push('topic chips missing lane label');

  return {
    id: record.id,
    title: record.title,
    dataset: record.dataset,
    file: record.file,
    sourceRepo: record.sourceRepo || 'unknown',
    sourceLabel,
    lane,
    laneLabel: laneLabels[lane],
    track: trackResult.track,
    trackLabel: trackLabels[trackResult.track],
    promotion,
    promotionLabel: promotionLabels[promotion],
    category: record.category || '',
    tags: record.tags || [],
    topicChips,
    evidenceTerms: trackResult.evidence,
    confidence: trackResult.confidence,
    status: issues.length ? 'review' : 'pass',
    issues,
  };
});

const issueRows = validations.filter((row) => row.status !== 'pass');
const counts = {
  totalTutorials: validations.length,
  passed: validations.length - issueRows.length,
  reviewRequired: issueRows.length,
  byTrack: validations.reduce((acc, row) => {
    acc[row.trackLabel] = (acc[row.trackLabel] || 0) + 1;
    return acc;
  }, {}),
  byLane: validations.reduce((acc, row) => {
    acc[row.laneLabel] = (acc[row.laneLabel] || 0) + 1;
    return acc;
  }, {}),
  byConfidence: validations.reduce((acc, row) => {
    acc[row.confidence] = (acc[row.confidence] || 0) + 1;
    return acc;
  }, {}),
};

const report = {
  version: 'tutorial-label-validation.v1',
  generatedAt: new Date().toISOString(),
  rule: 'Every visible tutorial label must be supported by source, title, body, tag, category, or id evidence; blind fallback labels require review.',
  counts,
  validations,
};

ensureDir(jsonReportPath);
fs.writeFileSync(jsonReportPath, `${JSON.stringify(report, null, 2)}\n`);

const csvRows = [
  ['status', 'confidence', 'id', 'title', 'sourceRepo', 'sourceLabel', 'laneLabel', 'trackLabel', 'promotionLabel', 'evidenceTerms', 'issues'],
  ...validations.map((row) => [
    row.status,
    row.confidence,
    row.id,
    row.title,
    row.sourceRepo,
    row.sourceLabel,
    row.laneLabel,
    row.trackLabel,
    row.promotionLabel,
    row.evidenceTerms.join('; '),
    row.issues.join('; '),
  ]),
];
fs.writeFileSync(csvReportPath, `${csvRows.map((row) => row.map(csvCell).join(',')).join('\n')}\n`);

const lines = [
  '# Tutorial Label Validation',
  '',
  report.rule,
  '',
  `- Total tutorials: ${counts.totalTutorials}`,
  `- Passed: ${counts.passed}`,
  `- Review required: ${counts.reviewRequired}`,
  `- Confidence: ${Object.entries(counts.byConfidence).map(([key, value]) => `${key} ${value}`).join(', ')}`,
  '',
  '## Track Distribution',
  '',
  '| Track | Count |',
  '| --- | ---: |',
  ...Object.entries(counts.byTrack).sort((a, b) => a[0].localeCompare(b[0])).map(([track, count]) => `| ${track} | ${count} |`),
  '',
  '## Lane Distribution',
  '',
  '| Lane | Count |',
  '| --- | ---: |',
  ...Object.entries(counts.byLane).sort((a, b) => a[0].localeCompare(b[0])).map(([lane, count]) => `| ${lane} | ${count} |`),
  '',
  '## Review Queue',
  '',
];

if (issueRows.length) {
  lines.push('| ID | Title | Proposed label | Issues |');
  lines.push('| --- | --- | --- | --- |');
  issueRows.slice(0, 100).forEach((row) => {
    lines.push(`| ${row.id} | ${row.title} | ${row.trackLabel} | ${row.issues.join('; ')} |`);
  });
} else {
  lines.push('No label issues found.');
}

fs.writeFileSync(mdReportPath, `${lines.join('\n')}\n`);

if (issueRows.length) {
  console.error(`Tutorial label validation found ${issueRows.length} record(s) requiring review.`);
  console.error(`See ${path.relative(root, mdReportPath)} and ${path.relative(root, csvReportPath)}.`);
  process.exit(1);
}

console.log(`Tutorial label validation passed: ${counts.totalTutorials} tutorials checked.`);
console.log(`Wrote ${path.relative(root, mdReportPath)}`);
