#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const seedsPath = path.join(root, 'src/content/lectures/lectureAbpathSpecSeeds.ts');
const contractPath = path.join(root, 'src/content/lectures/lectureAbpathContracts.json');
const reportPath = path.join(root, 'reports/lecture_abpath_contract_parameters.md');
const csvPath = path.join(root, 'reports/lecture_abpath_contract_parameters.csv');

const lectureSources = [
  {
    track: 'curated',
    sourceLabel: 'P@thfndr Local',
    file: 'src/content/lectures/lectures.normalized.json',
  },
  {
    track: 'curated',
    sourceLabel: 'Curated GU Imports',
    file: 'src/content/lectures/gu_who_complete_lectures.normalized.json',
  },
  {
    track: 'core-principles',
    sourceLabel: 'Core Principles Series',
    file: 'src/content/downloads_imports/normalized/lectures.normalized.json',
    filter: (lecture) => lecture.sourceRepo === 'ioc-next-app',
  },
];

const customLectures = [
  {
    id: 'bladder_path_core_principles',
    title: 'Bladder Pathology: Core Principles',
    category: 'Genitourinary Pathology',
    summary:
      'Boards-first lecture for bladder biopsy/TURBT orientation, papillary grading, CIS, invasion, variants, and high-yield mimics.',
    sourceRepo: 'didactic_series',
    sourcePath: 'src/content/lectures/customLectures.ts',
    sourceLabel: 'P@thfndr Local',
    lectureTrack: 'curated',
  },
];

const contentAreaOverrides = {
  renal_mass_eval: {
    contentArea: 'Genitourinary: kidney/renal pathology evaluation',
    displayCategories: ['ap_gu: kidney'],
    scopeBoundary:
      'Kidney/renal pathology and renal specimen handling only; bladder topics may support urothelial differential context but must not become the main lecture.',
    warning:
      'The normalized AP seed currently has stronger medical-kidney/process anchors than renal neoplasm anchors; renal tumor-specific anchors should be added when the source specification is expanded.',
  },
  testicular_mass_eval: {
    contentArea: 'Genitourinary: testis and paratesticular masses',
    displayCategories: ['ap_male_repro: testis/paratestis'],
    scopeBoundary: 'Testis and paratesticular mass evaluation only; prostate and penile topics are out of scope unless used as brief contrast.',
  },
  bladder_path_core_principles: {
    contentArea: 'Genitourinary: bladder and urothelial tract',
    displayCategories: ['ap_gu: urothelial tract/bladder'],
    scopeBoundary: 'Bladder biopsy/TURBT/cystectomy logic only; renal, prostate, testis, and penile content are out of scope unless used as mimics.',
  },
  penile_who_complete_pathology: {
    contentArea: 'Genitourinary: penis',
    displayCategories: ['ap_male_repro: penis'],
    scopeBoundary: 'Penile precursor, invasive, HPV-related, margin, and mimic logic only.',
  },
  testicular_who_complete_pathology: {
    contentArea: 'Genitourinary: testis/paratestis WHO classification',
    displayCategories: ['ap_male_repro: testis/paratestis'],
    scopeBoundary: 'Testicular, paratesticular, rete, epididymal, germ-cell, sex-cord stromal, lymphoma, and metastatic patterns only.',
  },
  'ioc-overview-breast-surgery': {
    contentArea: 'Breast surgical pathology',
    displayCategories: ['ap_breast'],
    scopeBoundary: 'Breast specimen orientation, benign/proliferative lesions, carcinoma, margins, and sentinel lymph node workflow only.',
  },
  'ioc-overview-endocrine-surgery': {
    contentArea: 'Endocrine: thyroid',
    displayCategories: ['ap_endo: thyroid'],
    scopeBoundary: 'Thyroid-focused endocrine pathology only; pituitary, adrenal, and non-thyroid endocrine topics are out of scope.',
  },
  'ioc-overview-gynecologic-oncology': {
    contentArea: 'Gynecologic surgical pathology',
    displayCategories: ['ap_cyto/ap_male_repro normalized source: gynecologic path-context filtered'],
    scopeBoundary: 'Gynecologic tract and gynecologic oncology logic only; male reproductive topics are out of scope even if source categories overlap.',
    warning:
      'The normalized AP source does not currently expose a clean ap_gyn category; this contract is governed by gynecologic path-context filtering and the scope boundary.',
  },
  'ioc-overview-head-neck-surgery': {
    contentArea: 'Head and neck pathology',
    displayCategories: ['ap_hn'],
    scopeBoundary: 'Upper aerodigestive tract, salivary, sinonasal, oral cavity, jaw, and neck lesion workflow only.',
  },
  'ioc-overview-hepatobiliary-surgery': {
    contentArea: 'Hepatobiliary pathology',
    displayCategories: ['ap_gi: hepatobiliary'],
    scopeBoundary: 'Liver, gallbladder, and biliary pathology only; pancreas is out of scope except periampullary contrast.',
  },
  'ioc-overview-neuropathology': {
    contentArea: 'Neuropathology',
    displayCategories: ['ap_neuro'],
    scopeBoundary: 'CNS, meninges, nerve sheath, metastasis, and neurosurgical pathology workflow only.',
  },
  'ioc-overview-pancreatic-surgery': {
    contentArea: 'Pancreatic pathology',
    displayCategories: ['ap_gi: pancreas'],
    scopeBoundary: 'Pancreas, ampulla, pancreatic cystic/neuroendocrine/ductal lesions only; liver/biliary content is out of scope except staging contrast.',
  },
  'ioc-overview-thoracic-surgery': {
    contentArea: 'Thoracic/lung pathology',
    displayCategories: ['ap_resp'],
    scopeBoundary: 'Lung, pleura, mediastinum, thoracic biopsy/resection, and lung cancer workflow only.',
  },
  'ioc-overview-urologic-oncology': {
    contentArea: 'Genitourinary: renal/urologic oncology overview',
    displayCategories: ['ap_gu: renal/urologic overview'],
    scopeBoundary: 'Renal and urologic oncology orientation only; medical kidney disease is supporting context, not the main endpoint.',
    warning:
      'The normalized AP seed blends kidney and urothelial/bladder anchors; the lecture contract keeps renal/urologic oncology as the teaching endpoint.',
  },
};

const parseSeeds = () => {
  const source = fs.readFileSync(seedsPath, 'utf8');
  const match = source.match(/export const lectureAbpathSpecSeeds[^=]*= ([\s\S]*) as const;\s*$/);
  if (!match) {
    throw new Error(`Could not parse lecture seeds from ${path.relative(root, seedsPath)}`);
  }
  return JSON.parse(match[1]);
};

const loadLectures = () => {
  const lectures = [];
  for (const source of lectureSources) {
    const records = JSON.parse(fs.readFileSync(path.join(root, source.file), 'utf8'));
    for (const lecture of source.filter ? records.filter(source.filter) : records) {
      lectures.push({
        id: lecture.id,
        title: lecture.title,
        category: lecture.category,
        summary: lecture.summary,
        sourceRepo: lecture.sourceRepo,
        sourcePath: lecture.sourcePath,
        sourceLabel: source.sourceLabel,
        lectureTrack: source.track,
      });
    }
  }
  lectures.splice(2, 0, ...customLectures);
  return lectures;
};

const unique = (values) => Array.from(new Set(values.filter(Boolean)));

const firstPathSegments = (pathValue, count = 2) => pathValue.split(' > ').slice(0, count).join(' > ');

const expectedLevel = (topics) => {
  const designations = unique(topics.map((topic) => topic.designation));
  if (designations.includes('AR')) return 'mixed C/AR';
  if (designations.includes('F')) return 'fellowship';
  return designations[0] || 'AP';
};

const makeParameter = (lecture, topics) => {
  const override = contentAreaOverrides[lecture.id] ?? {
    contentArea: lecture.category ?? lecture.title,
    scopeBoundary: `Keep the lecture scoped to ${lecture.category ?? lecture.title}; use other AP systems only as brief differential contrasts.`,
  };
  const categories = unique(topics.map((topic) => topic.category));
  const allowedPathPrefixes = unique(topics.map((topic) => firstPathSegments(topic.path)));
  const topicTitles = topics.map((topic) => topic.title);
  const primaryTopic = topicTitles[0] ?? lecture.title;
  const differentialTopics = topicTitles.slice(1, 4);

  return {
    lectureId: lecture.id,
    title: lecture.title,
    track: lecture.lectureTrack,
    sourceLabel: lecture.sourceLabel,
    contentArea: override.contentArea,
    apCategories: override.displayCategories ?? categories,
    normalizedSourceCategories: categories,
    expectedLevel: expectedLevel(topics),
    scopeBoundary: override.scopeBoundary,
    contractWarnings: override.warning ? [override.warning] : [],
    allowedPathPrefixes,
    abpathAnchors: topics,
    contractParameters: {
      overview: {
        required: [
          `State that ${override.contentArea} is the scoped content area.`,
          `List at least five ABPath-derived objectives using ${primaryTopic} and related anchors.`,
          'Show a faculty run sheet that starts with the ABPath content-specification frame.',
        ],
        acceptance: 'Learner can say what ABPath domain is being taught and what report-level task the session prepares them to perform.',
      },
      diagnosticApproach: {
        required: [
          'Start from specimen type, clinical question, site, and adequacy.',
          'Commit to low-power architecture before high-power details.',
          `Use ${primaryTopic}${differentialTopics.length ? ` versus ${differentialTopics.join(', ')}` : ''} as the core differential frame.`,
          'Select ancillary studies only when they change classification, staging, margin, adequacy, or management language.',
        ],
        acceptance: 'Algorithm endpoint produces a defensible diagnosis/report consequence rather than a memorized entity label.',
      },
      microscopy: {
        required: [
          'Begin with normal histology or expected tissue compartment for the content area.',
          'Require low-power pattern recognition, high-power discriminator, closest mimic, and report consequence.',
          'Use image assets only when source/provenance and faculty review are available; otherwise show the checklist scaffold.',
        ],
        acceptance: 'Microscopy tab teaches an inspection sequence even before final licensed images are attached.',
      },
      diagnosticCriteria: {
        required: [
          'Provide entity cards for the highest-yield ABPath anchors in this content area.',
          'For each entity, include key morphology, targeted ancillary logic, critical differential, and management/reporting implication.',
          'Keep criteria tied to the scoped content area; do not promote unrelated organ-system material.',
        ],
        acceptance: 'Diagnostic criteria are actionable at sign-out and mapped to the lecture ABPath anchors.',
      },
      questions: {
        required: [
          'Include oral recall/retrieval prompts before answer reveal.',
          'Include at least two MCQs that test workflow and reporting consequence.',
          'Include flashcards for spaced recall of content-area anchors and diagnostic sequence.',
        ],
        acceptance: 'Assessment checks recognition, differential logic, ancillary appropriateness, and report consequence.',
      },
      fullText: {
        required: [
          'Preserve the source lecture transcript/body as provenance.',
          'Do not silently replace source content with generated contract text.',
          'Use the generated ABPath parameters as scaffolding around the transcript.',
        ],
        acceptance: 'Transcript remains available as source material while tabs provide structured ABPath learning tasks.',
      },
    },
    minimums: {
      objectives: 5,
      abpathAnchors: Math.min(5, topics.length),
      algorithmNodes: 4,
      microscopyChecklistSteps: 5,
      entityCards: Math.min(6, topics.length),
      quickChecks: 2,
      mcqs: 2,
      flashcards: 3,
    },
    exclusionRule:
      'A lecture may reference adjacent content only as a brief mimic, staging, or specimen-handling contrast; it should not add objectives, MCQs, or entity cards outside its content-area scope.',
    promotionGate:
      'Promote only when all six top tabs render, the content-area boundary is explicit, ABPath anchors are visible, and learner assessment ties back to report-level consequence.',
  };
};

const escapeCell = (value) => String(value ?? '').replace(/\|/g, '\\|').replace(/\n/g, '<br>');
const csvCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

const writeReport = (contract) => {
  const lines = [
    '# Lecture ABPath Contract Parameters',
    '',
    'This contract scopes every promoted lecture to its own content area while using ABPath AP content-specification anchors as the acceptance backbone.',
    '',
    '## Global Parameters',
    '',
    `- Required tabs: ${contract.globalParameters.requiredTabs.join(', ')}`,
    `- Minimum objectives per lecture: ${contract.globalParameters.minimums.objectives}`,
    `- Minimum ABPath anchors per lecture: ${contract.globalParameters.minimums.abpathAnchors}`,
    '- Adjacent organ-system content is allowed only as a mimic, staging, or specimen-handling contrast.',
    '- Image-dependent microscopy content must show provenance-reviewed assets or an explicit pending-image checklist scaffold.',
    '',
    '## Lecture Contracts',
    '',
    '| Lecture | Content area | ABPath categories | Level | Scoped anchors | Contract gate |',
    '| --- | --- | --- | --- | --- | --- |',
  ];

  for (const item of contract.lectures) {
    lines.push(
      `| ${escapeCell(item.title)} | ${escapeCell(item.contentArea)} | ${escapeCell(item.apCategories.join(', '))} | ${escapeCell(
        item.expectedLevel,
      )} | ${escapeCell(item.abpathAnchors.map((topic) => `${topic.title} (${topic.designation})`).join('; '))} | ${escapeCell(
        item.promotionGate,
      )} |`,
    );
  }

  lines.push('', '## Per-Tab Acceptance Contract', '');
  for (const item of contract.lectures) {
    lines.push(`### ${item.title}`, '');
    lines.push(`- Content area: ${item.contentArea}`);
    lines.push(`- Scope boundary: ${item.scopeBoundary}`);
    lines.push(`- Allowed path prefixes: ${item.allowedPathPrefixes.join('; ')}`);
    lines.push(`- Exclusion rule: ${item.exclusionRule}`);
    lines.push('');
    for (const [tab, spec] of Object.entries(item.contractParameters)) {
      lines.push(`#### ${tab}`);
      spec.required.forEach((requirement) => lines.push(`- ${requirement}`));
      lines.push(`- Acceptance: ${spec.acceptance}`);
      lines.push('');
    }
  }

  fs.writeFileSync(reportPath, `${lines.join('\n')}\n`);

  const csvRows = [
    ['lectureId', 'title', 'contentArea', 'apCategories', 'expectedLevel', 'abpathAnchors', 'scopeBoundary', 'promotionGate'],
    ...contract.lectures.map((item) => [
      item.lectureId,
      item.title,
      item.contentArea,
      item.apCategories.join('; '),
      item.expectedLevel,
      item.abpathAnchors.map((topic) => `${topic.title} (${topic.designation})`).join('; '),
      item.scopeBoundary,
      item.promotionGate,
    ]),
  ];
  fs.writeFileSync(csvPath, `${csvRows.map((row) => row.map(csvCell).join(',')).join('\n')}\n`);
};

const main = () => {
  const seeds = parseSeeds();
  const lectures = loadLectures();
  const missingSeeds = lectures.filter((lecture) => !seeds[lecture.id]).map((lecture) => lecture.id);
  if (missingSeeds.length) {
    throw new Error(`Missing ABPath seed contracts for lectures: ${missingSeeds.join(', ')}`);
  }

  const lecturesWithContracts = lectures.map((lecture) => makeParameter(lecture, seeds[lecture.id]));
  const contract = {
    version: 'lecture-abpath-contract.v1',
    generatedFrom: [
      'src/content/lectures/lectureAbpathSpecSeeds.ts',
      'src/content/syllabus/syllabus.normalized.json',
      'promoted lecture library',
    ],
    purpose:
      'Contract-based parameters for filling each promoted lecture top tab from ABPath AP content-specification anchors while preserving content-area scope.',
    globalParameters: {
      requiredTabs: ['overview', 'diagnosticApproach', 'microscopy', 'diagnosticCriteria', 'questions', 'fullText'],
      minimums: {
        objectives: 5,
        abpathAnchors: 5,
        algorithmNodes: 4,
        microscopyChecklistSteps: 5,
        entityCards: 5,
        quickChecks: 2,
        mcqs: 2,
        flashcards: 3,
      },
      conformanceTarget: 'L4: topic mapped, level declared, and cross-links to lecture tab outputs present',
      scopeRule:
        'Each lecture is governed by its content area. ABPath topics outside the scoped content area may be used only for mimic, staging, specimen-handling, or quality/safety contrast.',
    },
    lectures: lecturesWithContracts,
  };

  fs.writeFileSync(contractPath, `${JSON.stringify(contract, null, 2)}\n`);
  writeReport(contract);

  console.log(`Wrote ${path.relative(root, contractPath)}`);
  console.log(`Wrote ${path.relative(root, reportPath)}`);
  console.log(`Wrote ${path.relative(root, csvPath)}`);
};

main();
