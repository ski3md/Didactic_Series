const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const queuePath = path.join(repoRoot, 'src/content/competency/apGapClosureQueue.ts');
const batchDir = path.join(repoRoot, 'src/content/competency');
const outPath = path.join(batchDir, 'apP0CvAutopsyCardBatch2.ts');
const reportsDir = path.join(repoRoot, 'reports');
const packetPath = path.join(reportsDir, 'ap_p0_cv_autopsy_card_batch_2_faculty_packet.md');
const packetCsvPath = path.join(reportsDir, 'ap_p0_cv_autopsy_card_batch_2_faculty_packet.csv');

if (!fs.existsSync(queuePath)) {
  throw new Error(`Missing queue input: ${queuePath}. Run npm run ap:gaps:plan first.`);
}

const extractExportedObject = (source, exportName) => {
  const marker = `export const ${exportName} = `;
  const start = source.indexOf(marker);
  if (start === -1) throw new Error(`Could not find export ${exportName}`);

  const objectStart = source.indexOf('{', start + marker.length);
  if (objectStart === -1) throw new Error(`Could not find object start for ${exportName}`);

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
      if (depth === 0) return source.slice(objectStart, index + 1);
    }
  }

  throw new Error(`Could not find object end for ${exportName}`);
};

const queue = JSON.parse(extractExportedObject(fs.readFileSync(queuePath, 'utf8'), 'apGapClosureQueue'));

const existingSourceQueueIds = new Set();
for (const fileName of fs.readdirSync(batchDir)) {
  if (!/^apP0.*CardBatch\d*\.ts$/.test(fileName) || fileName === 'apP0CvAutopsyCardBatch2.ts') continue;
  const source = fs.readFileSync(path.join(batchDir, fileName), 'utf8');
  for (const match of source.matchAll(/"sourceQueueId":\s*"([^"]+)"/g)) {
    existingSourceQueueIds.add(match[1]);
  }
}

const p0CvRows = (queue.p0Rows || [])
  .filter((row) => row.categoryId === 'ap_cv' && String(row.priority || '').startsWith('P0'))
  .sort((a, b) => {
    const sourceLineDelta = (Number(a.sourceLine) || 0) - (Number(b.sourceLine) || 0);
    if (sourceLineDelta !== 0) return sourceLineDelta;
    return String(a.path).localeCompare(String(b.path));
  });

const seenPaths = new Set();
const selectedRows = [];
for (const row of p0CvRows) {
  if (existingSourceQueueIds.has(row.id)) continue;
  const pathKey = String(row.path || row.title || row.id).toLowerCase();
  if (seenPaths.has(pathKey)) continue;
  seenPaths.add(pathKey);
  selectedRows.push(row);
  if (selectedRows.length === 24) break;
}

if (selectedRows.length === 0) {
  throw new Error('No unused P0 cardiovascular/autopsy rows found in apGapClosureQueue.');
}

const contextFor = (row) => {
  const text = `${row.path || ''} ${row.title || ''}`.toLowerCase();

  if (text.includes('myocard') || text.includes('cardiomyopath') || text.includes('infarct')) {
    return {
      domain: 'Myocardium / ischemic and nonischemic injury',
      specimenContext: 'autopsy heart or cardiac specimen with coronary, chamber, myocardial, clinical-timeline, and toxicologic context reconciled before diagnosis',
      normalComparator: 'normal myocardium, coronary perfusion territory, and expected postmortem change before injury pattern assignment',
      visualAnchor: 'gross heart/coronary or low-power myocardium with high-power injury, inflammation, scar, or fibrosis discriminator',
      mimicFrame: 'postmortem autolysis, contraction-band artifact, myocarditis, hypertensive heart disease, ischemic injury, or cardiomyopathy mimic',
      reportingConsequence: 'mechanism-of-death reasoning, contributory-vs-immediate cause language, and clinicopathologic limits on timing or causality',
    };
  }

  if (text.includes('aort') || text.includes('aneurysm') || text.includes('dissection') || text.includes('marfan') || text.includes('ehlers')) {
    return {
      domain: 'Aorta / great vessels',
      specimenContext: 'autopsy or surgical aortic specimen with tear location, rupture status, branch-vessel involvement, hypertension, and connective-tissue history',
      normalComparator: 'normal aortic wall architecture and elastic media before aneurysm, dissection, inflammation, or degeneration calls',
      visualAnchor: 'gross dissection/aneurysm or aortic wall section plus elastic stain or H&E media discriminator',
      mimicFrame: 'atherosclerotic aneurysm, hypertensive medial degeneration, vasculitis, inherited connective-tissue disease, or iatrogenic/postmortem artifact',
      reportingConsequence: 'rupture/dissection mechanism, inherited-risk implication, operative-pathology correlation, and defensible cause-of-death language',
    };
  }

  if (text.includes('valv') || text.includes('endocard') || text.includes('vegetation')) {
    return {
      domain: 'Valvular / endocardial disease',
      specimenContext: 'native valve, prosthetic valve, autopsy valve, or endocardial lesion with stenosis/regurgitation, cultures, embolic events, and treatment history',
      normalComparator: 'normal leaflet architecture, commissures, chordae, and expected degenerative changes before inflammatory or infectious interpretation',
      visualAnchor: 'gross leaflet/vegetation/calcification image plus high-power inflammation, organism, degeneration, or thrombus discriminator',
      mimicFrame: 'degenerative calcification, rheumatic change, nonbacterial thrombotic endocarditis, infective endocarditis, or healed injury',
      reportingConsequence: 'etiology of valve dysfunction, embolic/infectious risk, culture correlation, and clinicopathologic significance wording',
    };
  }

  if (text.includes('vasculitis') || text.includes('thrombo') || text.includes('atherosclerosis') || text.includes('calcification') || text.includes('arter')) {
    return {
      domain: 'Arterial disease / vascular injury',
      specimenContext: 'autopsy vessel, surgical vascular specimen, cardiac/aortic section, or amputation vessel with ischemic symptoms and procedure history',
      normalComparator: 'normal artery wall layers, intima-media relationship, and expected age-related change before lesion classification',
      visualAnchor: 'gross stenosis/thrombus/calcification or low-power vessel wall with high-power inflammation, plaque, thrombus, or medial change',
      mimicFrame: 'atherosclerosis, medial calcification, vasculitis, thromboembolus, procedure-related change, and sampling artifact',
      reportingConsequence: 'ischemic mechanism, thrombotic/embolic risk, contribution to death or morbidity, and report wording that avoids over-attribution',
    };
  }

  return {
    domain: 'Cardiovascular / autopsy mechanism',
    specimenContext: 'cardiovascular autopsy or surgical pathology specimen with clinical history, gross orientation, histology, and cause-of-death question integrated',
    normalComparator: 'normal cardiovascular gross or histologic comparator before abnormal pattern recognition',
    visualAnchor: 'gross-micro correlation image, diagram, H&E field, or explicit no-image rationale tied to the diagnostic discriminator',
    mimicFrame: 'common cardiovascular mimic, postmortem artifact, degenerative change, or nonspecific injury pattern selected by faculty',
    reportingConsequence: 'mechanism-of-disease, mechanism-of-death, or clinicopathologic correlation stated with appropriate certainty and caveats',
  };
};

const gateStatusesFor = (row, context) => [
  {
    id: 'taxonomy-qa',
    label: 'Taxonomy QA',
    status: 'ready-for-review',
    evidence: `Generated from unused cardiovascular/autopsy P0 AP specification path at source line ${row.sourceLine}; faculty must confirm entity/process placement and batch-2 eligibility.`,
  },
  {
    id: 'content-authoring',
    label: 'Entity card content',
    status: 'missing',
    evidence: 'Needs source-backed definition, normal comparator, gross-micro morphology, mechanism, mimic discriminator, reporting consequence, and safety pitfall.',
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
    evidence: 'Prompts exist; faculty-reviewed diagnosis, mechanism, mimic discriminator, causality limits, and reporting answer key are not yet attached.',
  },
  {
    id: 'faculty-review',
    label: 'Faculty review',
    status: 'missing',
    evidence: 'Reviewer, source citation, image/license status, editorial decision, and last-reviewed date are not yet attached.',
  },
];

const readinessFor = (gateStatuses) => {
  const completedGates = gateStatuses.filter((gate) => gate.status === 'complete').length;
  const reviewReadyGates = gateStatuses.filter((gate) => gate.status === 'ready-for-review').length;
  const missingGates = gateStatuses.filter((gate) => gate.status === 'missing').length;
  const totalGates = gateStatuses.length;

  return {
    completedGates,
    reviewReadyGates,
    missingGates,
    totalGates,
    percentComplete: Math.round((completedGates / totalGates) * 100),
    percentReviewReady: Math.round(((completedGates + reviewReadyGates) / totalGates) * 100),
  };
};

const cards = selectedRows.map((row, index) => {
  const context = contextFor(row);
  const gateStatuses = gateStatusesFor(row, context);

  return {
    id: `p0-cv-autopsy-batch-2-card-${String(index + 1).padStart(2, '0')}-${row.topicId}`,
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
    normalComparatorPrompt: context.normalComparator,
    visualAnchorPlan: context.visualAnchor,
    reportingConsequencePrompt: context.reportingConsequence,
    mimicFrame: context.mimicFrame,
    entityCardSections: [
      'Taxonomy QA and cardiovascular/autopsy scope assignment',
      'Definition and scope in one learner-safe sentence',
      'Normal gross or histologic comparator before abnormal pattern',
      'Gross, diagrammatic, or low-power anchor tied to specimen orientation',
      'High-power microscopic discriminator and one feature that prevents overcall',
      'Mechanism-of-disease or mechanism-of-death reasoning with certainty limits',
      'Top mimic, postmortem artifact, or degenerative confounder and best discriminator',
      'Report, autopsy summary, or death-certificate consequence plus safety pitfall',
    ],
    retrievalPrompts: [
      `Before reveal: classify the cardiovascular/autopsy entity or process represented by ${row.title}.`,
      'State the normal comparator and the gross or microscopic feature that must be present before calling this abnormal.',
      'Name the closest mimic or artifact and the discriminator that separates them.',
      'Explain whether this lesion is immediate, underlying, contributory, incidental, or indeterminate for death or morbidity.',
      'Write the report, autopsy-summary, or death-certificate phrase that would be safe for a junior resident.',
    ],
    spacingSchedule: ['same session', '1 day', '3 days', '7 days', '21 days'],
    facultyReviewChecklist: [
      'Taxonomy QA confirms this is an unused cardiovascular/autopsy P0 teaching target and documents any correction.',
      'Definition, normal comparator, morphology, mimic, discriminator, consequence, and pitfall are source-backed.',
      'Visual anchor is local/licensed or has an explicit no-image rationale.',
      'Retrieval answer key is faculty-reviewed before learner reveal.',
      'One contrastive near-miss or postmortem artifact is included for durable discrimination.',
      'Cause-of-death or clinicopathologic language states causality and uncertainty appropriately.',
    ],
    completionGate: 'Not complete until taxonomy QA, source-backed cardiovascular/autopsy content, visual anchor, retrieval answer key, and faculty review metadata are all satisfied.',
    gateStatuses,
    readiness: readinessFor(gateStatuses),
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

const output = {
  generatedAt: new Date().toISOString(),
  sourcePlan: 'reports/ap_gap_closure_plan.json',
  sourceQueue: 'src/content/competency/apGapClosureQueue.ts',
  facultyPacketPath: 'reports/ap_p0_cv_autopsy_card_batch_2_faculty_packet.md',
  facultyPacketCsvPath: 'reports/ap_p0_cv_autopsy_card_batch_2_faculty_packet.csv',
  batchName: 'P0 cardiovascular/autopsy entity card batch 2',
  batchStrategy: 'Next unused P0 cardiovascular/autopsy queue rows after excluding all sourceQueueIds already present in existing AP P0 card batches.',
  status: 'draft cardiovascular/autopsy batch-2 scaffolds awaiting faculty-reviewed medical content and visual assets',
  sourcePool: {
    categoryId: 'ap_cv',
    sourceP0Rows: p0CvRows.length,
    existingSourceQueueIdsExcluded: existingSourceQueueIds.size,
    selectedRows: selectedRows.length,
  },
  batchReadiness,
  readinessLegend: {
    complete: 'Evidence is present and reviewed.',
    'ready-for-review': 'Structured scaffold exists and needs faculty confirmation.',
    missing: 'Required content, asset, source, answer key, or reviewer evidence is not yet attached.',
  },
  cards,
};

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

const packetRows = cards.map((card) => ({
  cardId: card.id,
  sourceQueueId: card.sourceQueueId,
  title: card.title,
  category: card.category,
  domain: card.domain,
  learnerLevel: card.learnerLevel,
  apSpecPath: card.apSpecPath,
  specimenContext: card.specimenContext,
  normalComparatorPrompt: card.normalComparatorPrompt,
  visualAnchorPlan: card.visualAnchorPlan,
  reportingConsequencePrompt: card.reportingConsequencePrompt,
  mimicFrame: card.mimicFrame,
  taxonomyQa: '',
  definition: '',
  normalComparator: '',
  grossMorphologyAnchor: '',
  microscopicMorphologyAnchor: '',
  mechanismOfDiseaseOrDeath: '',
  topMimicOrArtifact: '',
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

const packetMd = `# P0 Cardiovascular / Autopsy Entity Card Batch 2 Faculty Authoring Packet

Generated: ${output.generatedAt}

Status: ${output.status}

Batch strategy: ${output.batchStrategy}

## Faculty Completion Rule

Do not mark a card complete until all five gates are satisfied:

1. Taxonomy QA confirms this is a true unused cardiovascular/autopsy entity, process, mechanism, or reporting task.
2. Source-backed medical content is authored: definition, normal comparator, gross-micro morphology, mimic/discriminator, mechanism, consequence, and pitfall.
3. Visual anchor is attached or a no-image rationale is explicitly documented.
4. Retrieval prompts have a faculty-reviewed answer key.
5. Reviewer, review date, source citation, image/license status, editorial decision, and mechanism-of-death/clinicopathologic relevance are documented.

## Batch Readiness

- Cards: ${cards.length}
- Source P0 cardiovascular/autopsy rows: ${p0CvRows.length}
- Existing sourceQueueIds excluded: ${existingSourceQueueIds.size}
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
- Normal comparator prompt: ${card.normalComparatorPrompt}
- Visual anchor plan: ${card.visualAnchorPlan}
- Reporting consequence prompt: ${card.reportingConsequencePrompt}
- Mimic / artifact frame: ${card.mimicFrame}

### Reviewer Workflow

1. Confirm the AP-spec path is a valid unused cardiovascular/autopsy teaching target and note any taxonomy correction.
2. Fill the authoring fields with source-backed, learner-safe content.
3. Attach the gross image, histology image, diagram, or no-image rationale and document source/license evidence.
4. Add the retrieval answer key, reviewer/date, and final editorial decision before marking gates complete.
5. Check that mechanism-of-death or clinicopathologic relevance is explicit and appropriately caveated.

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

const ts = `// Generated by scripts/generate_ap_p0_cv_autopsy_cards_2.cjs. Do not edit by hand.

export const apP0CvAutopsyCardBatch2 = ${JSON.stringify(output, null, 2)} as const;

export type ApP0CvAutopsyCardBatch2Card = typeof apP0CvAutopsyCardBatch2.cards[number];
`;

fs.writeFileSync(outPath, ts);

const validation = {
  sourceP0Rows: p0CvRows.length,
  existingSourceQueueIdsExcluded: existingSourceQueueIds.size,
  selectedCards: cards.length,
  gateStatuses: cards.flatMap((card) => card.gateStatuses).length,
  readyForReviewGates: batchReadiness.reviewReadyGates,
  missingGates: batchReadiness.missingGates,
  cardsWithFiveGates: cards.filter((card) => card.gateStatuses.length === 5).length,
  duplicateCardIds: cards.length - new Set(cards.map((card) => card.id)).size,
  duplicateSourceQueueIds: cards.length - new Set(cards.map((card) => card.sourceQueueId)).size,
  crossBatchSourceQueueIdCollisions: cards.filter((card) => existingSourceQueueIds.has(card.sourceQueueId)).length,
  cardsMissingRequiredSections: cards.filter((card) => (
    !card.entityCardSections?.length
    || !card.retrievalPrompts?.length
    || !card.spacingSchedule?.length
    || !card.facultyReviewChecklist?.length
    || !card.readiness
  )).length,
  outputs: [
    'src/content/competency/apP0CvAutopsyCardBatch2.ts',
    'reports/ap_p0_cv_autopsy_card_batch_2_faculty_packet.md',
    'reports/ap_p0_cv_autopsy_card_batch_2_faculty_packet.csv',
  ],
};

console.log(JSON.stringify(validation, null, 2));
