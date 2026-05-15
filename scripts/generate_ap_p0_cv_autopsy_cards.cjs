const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const queuePath = path.join(repoRoot, 'src/content/competency/apGapClosureQueue.ts');
const outPath = path.join(repoRoot, 'src/content/competency/apP0CvAutopsyCardBatch.ts');
const reportsDir = path.join(repoRoot, 'reports');
const packetPath = path.join(reportsDir, 'ap_p0_cv_autopsy_card_batch_faculty_packet.md');
const packetCsvPath = path.join(reportsDir, 'ap_p0_cv_autopsy_card_batch_faculty_packet.csv');

if (!fs.existsSync(queuePath)) {
  throw new Error(`Missing queue input: ${queuePath}. Run npm run ap:gaps:plan first.`);
}

const readExportedObject = (filePath, exportName) => {
  const source = fs.readFileSync(filePath, 'utf8');
  const marker = `export const ${exportName} = `;
  const start = source.indexOf(marker);
  if (start === -1) throw new Error(`Could not find ${exportName} export in ${filePath}`);

  const objectStart = source.indexOf('{', start + marker.length);
  if (objectStart === -1) throw new Error(`Could not find object literal for ${exportName}`);

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = objectStart; index < source.length; index += 1) {
    const char = source[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
    } else if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return JSON.parse(source.slice(objectStart, index + 1));
      }
    }
  }

  throw new Error(`Could not parse object literal for ${exportName}`);
};

const queue = readExportedObject(queuePath, 'apGapClosureQueue');
const p0CvRows = (queue.p0Rows || [])
  .filter((row) => row.categoryId === 'ap_cv' && String(row.priority || '').startsWith('P0'));

const seenPaths = new Set();
const selectedRows = p0CvRows
  .sort((a, b) => {
    const lineA = Number(a.sourceLine || 0);
    const lineB = Number(b.sourceLine || 0);
    if (lineA !== lineB) return lineA - lineB;
    return String(a.path).localeCompare(String(b.path));
  })
  .filter((row) => {
    const key = String(row.path || row.title).toLowerCase();
    if (seenPaths.has(key)) return false;
    seenPaths.add(key);
    return true;
  })
  .slice(0, 24);

const contextFor = (row) => {
  const pathText = String(row.path || '').toLowerCase();
  const titleText = String(row.title || '').toLowerCase();
  const combined = `${pathText} ${titleText}`;

  if (combined.includes('myocard') || combined.includes('cardiomyopath')) {
    return {
      domain: 'Myocardium / cardiomyopathy',
      specimenContext: 'autopsy heart with chamber measurements, myocardial sections, and clinical heart-failure or sudden-death context',
      visualAnchor: 'gross heart weight/chamber morphology plus H&E myocardial injury or fibrosis field',
      reportingConsequence: 'clinicopathologic mechanism, competing cause-of-death reasoning, and inherited/acquired cardiomyopathy implication',
      mimicFrame: 'ischemic myocardial injury, hypertensive heart disease, myocarditis, or sampling artifact',
    };
  }

  if (combined.includes('aortic') || combined.includes('aneurysm') || combined.includes('dissection') || combined.includes('ehlers')) {
    return {
      domain: 'Aorta / large vessels',
      specimenContext: 'autopsy or surgical aorta/vessel specimen with rupture/dissection plane, branch-vessel context, and connective-tissue history',
      visualAnchor: 'gross aortic wall/tear or aneurysm image plus elastic stain or H&E media comparator',
      reportingConsequence: 'rupture/dissection mechanism, syndrome-associated risk, and cause-of-death or operative-pathology correlation',
      mimicFrame: 'atherosclerotic aneurysm, cystic medial degeneration, vasculitis, or postmortem artifact',
    };
  }

  if (combined.includes('valv')) {
    return {
      domain: 'Valves',
      specimenContext: 'native or prosthetic valve specimen, autopsy valve, or cardiac surgery specimen with clinical stenosis/regurgitation context',
      visualAnchor: 'gross valve leaflet/commissure image plus calcification, inflammation, vegetation, or degeneration field',
      reportingConsequence: 'etiology of valve dysfunction, infection/embolism risk, and clinicopathologic correlation',
      mimicFrame: 'degenerative calcification, rheumatic change, infective endocarditis, or healed injury',
    };
  }

  if (combined.includes('vasculitis') || combined.includes('buerger') || combined.includes('atherosclerosis') || combined.includes('calcification')) {
    return {
      domain: 'Arteries / vascular injury',
      specimenContext: 'autopsy vessel, surgical vascular specimen, amputation vessel, or cardiac/aortic section with ischemic clinical context',
      visualAnchor: 'gross vessel narrowing/thrombus or calcification plus H&E vessel-wall pattern',
      reportingConsequence: 'ischemic mechanism, thrombotic/embolic risk, and how the vascular lesion contributes to morbidity or death',
      mimicFrame: 'atherosclerosis, medial calcification, vasculitis, thromboembolus, or procedure-related change',
    };
  }

  if (combined.includes('steatosis') || combined.includes('cirrhosis') || combined.includes('alcohol')) {
    return {
      domain: 'Autopsy systemic comorbidity',
      specimenContext: 'autopsy organ block with cardiovascular risk context and systemic alcohol-related disease correlation',
      visualAnchor: 'gross organ change plus H&E field tying systemic disease to cardiovascular/autopsy interpretation',
      reportingConsequence: 'contributory cause reasoning, comorbidity documentation, and death-certificate language discipline',
      mimicFrame: 'metabolic liver disease, congestion, postmortem change, or nonspecific autolysis',
    };
  }

  return {
    domain: 'Cardiovascular / autopsy mechanism',
    specimenContext: 'autopsy heart/vessel specimen or cardiovascular surgical pathology specimen with clinical and gross correlation',
    visualAnchor: 'gross-micro correlation image, vessel/valve/myocardium diagram, or H&E anchor',
    reportingConsequence: 'mechanism-of-disease or mechanism-of-death reasoning and clinicopathologic correlation',
    mimicFrame: 'common cardiovascular mimic, postmortem artifact, or nonspecific degenerative change',
  };
};

const gateStatusesFor = (context) => [
  {
    id: 'taxonomy-qa',
    label: 'Taxonomy QA',
    status: 'ready-for-review',
    evidence: 'Generated from normalized AP cardiovascular/autopsy specification path; faculty must confirm entity/process classification and autopsy relevance.',
  },
  {
    id: 'content-authoring',
    label: 'Entity card content',
    status: 'missing',
    evidence: 'Definition, gross-micro morphology, mechanism-of-death logic, mimic discriminator, and report/death-certificate language still require source-backed authoring.',
  },
  {
    id: 'visual-anchor',
    label: 'Visual anchor',
    status: 'missing',
    evidence: context.visualAnchor,
  },
  {
    id: 'retrieval-key',
    label: 'Retrieval answer key',
    status: 'missing',
    evidence: 'Prompts exist; faculty-reviewed diagnosis, mechanism, mimic, and reporting answer key is not yet attached.',
  },
  {
    id: 'faculty-review',
    label: 'Faculty review',
    status: 'missing',
    evidence: 'Reviewer, source citation, image/license status, and last-reviewed date are not yet attached.',
  },
];

const cards = selectedRows.map((row, index) => {
  const context = contextFor(row);
  const gateStatuses = gateStatusesFor(context);

  return {
    id: `p0-cv-autopsy-card-${String(index + 1).padStart(2, '0')}-${row.topicId}`,
    sourceQueueId: row.id,
    editorialStatus: 'draft-scaffold',
    priority: row.priority,
    title: row.title,
    category: row.category,
    domain: context.domain,
    rotation: row.rotation,
    apSpecPath: row.path,
    learnerLevel: row.learnerLevel,
    difficulty: row.difficulty,
    sourceLine: row.sourceLine,
    specimenContext: context.specimenContext,
    visualAnchorPlan: context.visualAnchor,
    reportingConsequencePrompt: context.reportingConsequence,
    mimicFrame: context.mimicFrame,
    entityCardSections: [
      'Definition and scope in one learner-safe sentence',
      'Normal gross or histologic comparator before abnormal pattern',
      'Gross-micro morphology anchor with one low-power or gross cue and one confirmatory microscopic cue',
      'Mechanism-of-disease or mechanism-of-death statement',
      'Top mimic and the single best discriminator',
      'Report, autopsy summary, or death-certificate consequence',
      'Pitfall that could cause a safety-critical or cause-of-death miss',
    ],
    retrievalPrompts: [
      `Before reveal: identify the cardiovascular/autopsy entity or process represented by ${row.title}.`,
      'State the gross or microscopic feature that must be present before calling it.',
      'Name the closest mimic and the discriminator that separates them.',
      'Explain how this lesion could, or could not, contribute to morbidity or death.',
      'Write the report, autopsy-summary, or death-certificate phrase that would matter clinically.',
    ],
    spacingSchedule: ['same session', '1 day', '3 days', '7 days', '21 days'],
    facultyReviewChecklist: [
      'Taxonomy QA confirms this is a true cardiovascular/autopsy entity, process, or mechanism task.',
      'Source citation and review date are attached.',
      'Gross, histology, diagram, or explicit no-image rationale is documented with license/status.',
      'Answer key is faculty-reviewed before learner reveal.',
      'One near-miss mimic or postmortem artifact is included for contrastive learning.',
      'Mechanism-of-death or clinicopathologic relevance is stated without overstating causality.',
    ],
    completionGate: 'Not complete until entity card, visual anchor, retrieval answer key, faculty QA metadata, and mechanism-of-death/clinicopathologic reasoning are all present.',
    gateStatuses,
    readiness: {
      completedGates: gateStatuses.filter((gate) => gate.status === 'complete').length,
      reviewReadyGates: gateStatuses.filter((gate) => gate.status === 'ready-for-review').length,
      missingGates: gateStatuses.filter((gate) => gate.status === 'missing').length,
      totalGates: gateStatuses.length,
      percentComplete: Math.round((gateStatuses.filter((gate) => gate.status === 'complete').length / gateStatuses.length) * 100),
      percentReviewReady: Math.round((gateStatuses.filter((gate) => gate.status !== 'missing').length / gateStatuses.length) * 100),
    },
  };
});

const batchReadiness = cards.reduce(
  (acc, card) => {
    acc.completedGates += card.readiness.completedGates;
    acc.reviewReadyGates += card.readiness.reviewReadyGates;
    acc.missingGates += card.readiness.missingGates;
    acc.totalGates += card.readiness.totalGates;
    return acc;
  },
  { completedGates: 0, reviewReadyGates: 0, missingGates: 0, totalGates: 0 },
);

batchReadiness.percentComplete = batchReadiness.totalGates === 0
  ? 0
  : Math.round((batchReadiness.completedGates / batchReadiness.totalGates) * 100);
batchReadiness.percentReviewReady = batchReadiness.totalGates === 0
  ? 0
  : Math.round(((batchReadiness.completedGates + batchReadiness.reviewReadyGates) / batchReadiness.totalGates) * 100);

const gateColumnPrefix = {
  'taxonomy-qa': 'taxonomyQaGate',
  'content-authoring': 'contentAuthoringGate',
  'visual-anchor': 'visualAnchorGate',
  'retrieval-key': 'retrievalKeyGate',
  'faculty-review': 'facultyReviewGate',
};

const gateColumnsFor = (card) => Object.fromEntries(
  card.gateStatuses.flatMap((gate) => {
    const prefix = gateColumnPrefix[gate.id] || gate.id.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    return [
      [`${prefix}Status`, gate.status],
      [`${prefix}Evidence`, gate.evidence],
    ];
  }),
);

const gateChecklistFor = (card) => card.gateStatuses
  .map((gate) => {
    const checkbox = gate.status === 'complete' ? '[x]' : '[ ]';
    return `- ${checkbox} ${gate.label}: ${gate.status} - ${gate.evidence}`;
  })
  .join('\n');

const output = {
  generatedAt: new Date().toISOString(),
  sourcePlan: 'reports/ap_gap_closure_plan.json',
  sourceQueue: 'src/content/competency/apGapClosureQueue.ts',
  facultyPacketPath: 'reports/ap_p0_cv_autopsy_card_batch_faculty_packet.md',
  facultyPacketCsvPath: 'reports/ap_p0_cv_autopsy_card_batch_faculty_packet.csv',
  batchName: 'P0 cardiovascular/autopsy entity card batch',
  batchStrategy: 'First 24 de-duplicated P0 Cardiovascular / Autopsy-adjacent queue rows, preserving source-line order and emphasizing gross-micro mechanism-of-death reasoning.',
  status: 'draft cardiovascular/autopsy scaffolds awaiting faculty-reviewed medical content and visual assets',
  sourcePool: {
    categoryId: 'ap_cv',
    sourceP0Rows: p0CvRows.length,
    selectedRows: selectedRows.length,
    deduplicatedByPath: p0CvRows.length - seenPaths.size,
  },
  batchReadiness,
  readinessLegend: {
    complete: 'Evidence is present and reviewed.',
    'ready-for-review': 'Structured scaffold exists and needs faculty confirmation.',
    missing: 'Required content, asset, source, answer key, or reviewer evidence is not yet attached.',
  },
  cards,
};

const packetRows = cards.map((card) => ({
  cardId: card.id,
  sourceQueueId: card.sourceQueueId,
  title: card.title,
  category: card.category,
  domain: card.domain,
  learnerLevel: card.learnerLevel,
  apSpecPath: card.apSpecPath,
  specimenContext: card.specimenContext,
  visualAnchorPlan: card.visualAnchorPlan,
  reportingConsequencePrompt: card.reportingConsequencePrompt,
  mimicFrame: card.mimicFrame,
  taxonomyQa: '',
  definition: '',
  normalComparator: '',
  grossMorphologyAnchor: '',
  microscopicMorphologyAnchor: '',
  mechanismOfDiseaseOrDeath: '',
  topMimic: '',
  discriminator: '',
  reportOrAutopsyConsequence: '',
  safetyPitfall: '',
  visualAssetPathOrRationale: '',
  sourceCitation: '',
  retrievalAnswerKey: '',
  reviewer: '',
  reviewDate: '',
  decision: 'draft',
  ...gateColumnsFor(card),
}));

const packetMd = `# P0 Cardiovascular / Autopsy Entity Card Batch Faculty Authoring Packet

Generated: ${output.generatedAt}

Status: ${output.status}

Batch strategy: ${output.batchStrategy}

## Faculty Completion Rule

Do not mark a card complete until all five gates are satisfied:

1. Taxonomy QA confirms this is a true cardiovascular/autopsy entity, process, or mechanism task.
2. Source-backed medical content is authored: definition, normal comparator, gross-micro morphology, mimic/discriminator, consequence, and pitfall.
3. Visual anchor is attached or a no-image rationale is explicitly documented.
4. Retrieval prompts have a faculty-reviewed answer key.
5. Reviewer, review date, source citation, image/license status, editorial decision, and mechanism-of-death/clinicopathologic relevance are documented.

## Batch Readiness

- Cards: ${cards.length}
- Source P0 cardiovascular/autopsy rows: ${p0CvRows.length}
- Complete gates: ${output.batchReadiness.completedGates}
- Review-ready gates: ${output.batchReadiness.reviewReadyGates}
- Missing gates: ${output.batchReadiness.missingGates}
- Percent review-ready: ${output.batchReadiness.percentReviewReady}%

${cards.map((card, index) => `## ${index + 1}. ${card.title}

- Card ID: \`${card.id}\`
- Source queue ID: \`${card.sourceQueueId}\`
- Category: ${card.category}
- Domain: ${card.domain}
- Learner level: ${card.learnerLevel}
- AP spec path: ${card.apSpecPath}
- Specimen context: ${card.specimenContext}
- Visual anchor plan: ${card.visualAnchorPlan}
- Reporting consequence prompt: ${card.reportingConsequencePrompt}
- Mimic / artifact frame: ${card.mimicFrame}

### Reviewer Workflow

1. Confirm the AP-spec path is a valid cardiovascular/autopsy teachable entity/process and note any taxonomy correction.
2. Fill the authoring fields with source-backed, learner-safe content.
3. Attach the gross image, histology image, diagram, or no-image rationale and document source/license evidence.
4. Add the retrieval answer key, reviewer/date, and final editorial decision before marking gates complete.
5. Check that mechanism-of-death or clinicopathologic relevance is explicit but does not overstate causality.

### Gate Checklist

${gateChecklistFor(card)}

### Authoring Fields

- Taxonomy QA:
- Definition and scope:
- Normal gross/histologic comparator:
- Gross morphology anchor:
- Microscopic morphology anchor:
- Mechanism of disease or death:
- Top mimic or artifact:
- Best discriminator:
- Report/autopsy/death-certificate consequence:
- Safety-critical pitfall:
- Visual asset path or no-image rationale:
- Source citation:
- Retrieval answer key:
- Reviewer:
- Review date:
- Editorial decision: draft / reviewed / canonical
`).join('\n')}
`;

const csvHeader = Object.keys(packetRows[0] || {});
const csvEscape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
const packetCsv = [
  csvHeader.join(','),
  ...packetRows.map((row) => csvHeader.map((key) => csvEscape(row[key])).join(',')),
].join('\n');

fs.writeFileSync(packetPath, packetMd);
fs.writeFileSync(packetCsvPath, packetCsv);

const ts = `// Generated by scripts/generate_ap_p0_cv_autopsy_cards.cjs. Do not edit by hand.

export const apP0CvAutopsyCardBatch = ${JSON.stringify(output, null, 2)} as const;

export type ApP0CvAutopsyCard = typeof apP0CvAutopsyCardBatch.cards[number];
`;

fs.writeFileSync(outPath, ts);

const validation = {
  cards: cards.length,
  sourceP0Rows: p0CvRows.length,
  gateStatuses: cards.flatMap((card) => card.gateStatuses).length,
  readyForReviewGates: batchReadiness.reviewReadyGates,
  missingGates: batchReadiness.missingGates,
  cardsWithFiveGates: cards.filter((card) => card.gateStatuses.length === 5).length,
  duplicateCardIds: cards.length - new Set(cards.map((card) => card.id)).size,
  duplicateSourceQueueIds: cards.length - new Set(cards.map((card) => card.sourceQueueId)).size,
  outputs: [
    'src/content/competency/apP0CvAutopsyCardBatch.ts',
    'reports/ap_p0_cv_autopsy_card_batch_faculty_packet.md',
    'reports/ap_p0_cv_autopsy_card_batch_faculty_packet.csv',
  ],
};

console.log(JSON.stringify(validation, null, 2));
