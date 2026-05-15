const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const queuePath = path.join(repoRoot, 'src/content/competency/apGapClosureQueue.ts');
const batchDir = path.join(repoRoot, 'src/content/competency');
const outPath = path.join(batchDir, 'apP0CvAutopsyCardBatch3.ts');
const reportsDir = path.join(repoRoot, 'reports');
const packetPath = path.join(reportsDir, 'ap_p0_cv_autopsy_card_batch_3_faculty_packet.md');
const packetCsvPath = path.join(reportsDir, 'ap_p0_cv_autopsy_card_batch_3_faculty_packet.csv');

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
  if (!/^apP0.*CardBatch\d*\.ts$/.test(fileName) || fileName === 'apP0CvAutopsyCardBatch3.ts') continue;
  const source = fs.readFileSync(path.join(batchDir, fileName), 'utf8');
  for (const match of source.matchAll(/"sourceQueueId":\s*"([^"]+)"/g)) {
    existingSourceQueueIds.add(match[1]);
  }
}

const cvRows = (queue.p0Rows || [])
  .filter((row) => row.categoryId === 'ap_cv' && String(row.priority || '').startsWith('P0'))
  .sort((a, b) => {
    const sourceLineDelta = (Number(a.sourceLine) || 0) - (Number(b.sourceLine) || 0);
    if (sourceLineDelta !== 0) return sourceLineDelta;
    return String(a.path).localeCompare(String(b.path));
  });

const rowsAfterBatchTwoOffset = cvRows.slice(48);
const selectedRows = rowsAfterBatchTwoOffset
  .filter((row) => !existingSourceQueueIds.has(row.id))
  .slice(0, 24);

if (selectedRows.length === 0) {
  throw new Error('No unused P0 Cardiovascular / Autopsy rows found after the first 48 ap_cv rows.');
}

const cvContextFor = (row) => {
  const text = `${row.path || ''} ${row.title || ''}`.toLowerCase();

  if (text.includes('myocard') || text.includes('cardiomyopath') || text.includes('infarct') || text.includes('ischemi')) {
    return {
      domain: 'Myocardium / ischemic and nonischemic injury',
      specimenContext: 'autopsy heart or surgical myocardial specimen with clinical timeline, coronary anatomy, chamber weights, and section map available before microscopic review',
      normalComparator: 'normal myocardial fiber architecture, expected interstitium, and baseline coronary-myocardial correlation',
      visualAnchor: 'gross myocardial section or coronary distribution map plus H&E injury/fibrosis/inflammation field with time-course comparator',
      mimicFrame: 'postmortem autolysis, contraction band injury, myocarditis, hypertensive heart disease, sampling artifact, or old scar',
      reportingConsequence: 'mechanism of death or morbidity, infarct age/timing limits, clinicopathologic correlation, and inherited/acquired cardiomyopathy implication when relevant',
    };
  }

  if (text.includes('aort') || text.includes('aneurysm') || text.includes('dissection') || text.includes('arteritis')) {
    return {
      domain: 'Aorta / large vessel disease',
      specimenContext: 'autopsy or operative aorta/large-vessel specimen with rupture/dissection plane, branch-vessel involvement, connective-tissue history, and gross orientation',
      normalComparator: 'normal aortic wall layers, expected elastic lamellae, and age-related medial change before abnormal classification',
      visualAnchor: 'gross tear/aneurysm/rupture image plus elastic stain or H&E media comparator',
      mimicFrame: 'atherosclerotic aneurysm, cystic medial degeneration, vasculitis, procedure-related tear, or postmortem artifact',
      reportingConsequence: 'rupture or dissection mechanism, syndrome-associated risk language, operative-pathology correlation, and cause-of-death discipline',
    };
  }

  if (text.includes('valv') || text.includes('endocard') || text.includes('vegetation')) {
    return {
      domain: 'Valves / endocardial disease',
      specimenContext: 'native valve, prosthetic valve, or autopsy cardiac specimen with clinical stenosis/regurgitation, infection risk, cultures, and embolic context',
      normalComparator: 'normal valve leaflet architecture and expected degenerative change before inflammatory, infectious, or calcific interpretation',
      visualAnchor: 'gross valve leaflet/vegetation/calcification image plus H&E inflammation, organism, degeneration, or thrombus field',
      mimicFrame: 'degenerative calcification, rheumatic change, infective endocarditis, nonbacterial thrombotic endocarditis, or healed injury',
      reportingConsequence: 'etiology of valve dysfunction, infection or embolic risk, culture/ancillary correlation, and operative or autopsy summary wording',
    };
  }

  if (text.includes('thromb') || text.includes('embol') || text.includes('atheroscl') || text.includes('calcification') || text.includes('vascul')) {
    return {
      domain: 'Arteries / thrombosis and vascular injury',
      specimenContext: 'autopsy vessel, vascular surgery specimen, amputation vessel, or cardiac section with ischemic distribution, intervention history, and thromboembolic context',
      normalComparator: 'normal vessel wall layers and expected age-related intimal change before thrombosis, calcification, or vasculitis classification',
      visualAnchor: 'gross vessel narrowing/thrombus/calcification plus H&E vessel-wall pattern and luminal consequence',
      mimicFrame: 'atherosclerosis, medial calcification, vasculitis, thromboembolus, organizing thrombus, or procedure-related change',
      reportingConsequence: 'ischemic mechanism, thrombotic or embolic risk, contribution to morbidity/death, and limits around lesion age or causality',
    };
  }

  return {
    domain: 'Cardiovascular / autopsy mechanism',
    specimenContext: 'autopsy heart or vessel specimen, cardiovascular surgical specimen, or systemic autopsy finding requiring clinical, gross, and microscopic correlation',
    normalComparator: 'normal cardiovascular structure, gross orientation, and expected age-related change before abnormal pattern recognition',
    visualAnchor: 'gross-micro correlation image, heart/vessel diagram, or H&E anchor with a normal comparator',
    mimicFrame: 'common cardiovascular mimic, postmortem artifact, procedure-related change, or nonspecific degenerative finding',
    reportingConsequence: 'mechanism-of-disease or mechanism-of-death reasoning, clinicopathologic correlation, and safe report/autopsy-summary wording',
  };
};

const gateStatusesFor = (row, context) => [
  {
    id: 'taxonomy-qa',
    label: 'Taxonomy QA',
    status: 'ready-for-review',
    evidence: `Generated from Cardiovascular / Autopsy AP specification path at source line ${row.sourceLine}; faculty must confirm this batch-3 target is valid and not already represented.`,
  },
  {
    id: 'content-authoring',
    label: 'Entity card content',
    status: 'missing',
    evidence: 'Needs source-backed definition, normal comparator, gross-micro morphology, mechanism, mimic/discriminator, report/autopsy consequence, and pitfall.',
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
    evidence: 'Card prompts exist; faculty-reviewed diagnosis, mechanism, mimic, consequence, and safety-caveat answer key is not yet attached.',
  },
  {
    id: 'faculty-review',
    label: 'Faculty review',
    status: 'missing',
    evidence: 'Cardiovascular/autopsy faculty reviewer, source citation, image/license status, editorial decision, and last-reviewed date are not yet attached.',
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
  const context = cvContextFor(row);
  const gateStatuses = gateStatusesFor(row, context);

  return {
    id: `p0-cv-autopsy-batch-3-card-${String(index + 1).padStart(2, '0')}-${row.topicId}`,
    sourceQueueId: row.id,
    editorialStatus: 'draft-scaffold',
    priority: row.priority,
    title: row.title,
    category: row.category,
    rotation: row.rotation,
    domain: context.domain,
    apSpecPath: row.path,
    learnerLevel: row.learnerLevel,
    difficulty: row.difficulty,
    sourceLine: row.sourceLine,
    specimenContext: context.specimenContext,
    normalComparatorPrompt: context.normalComparator,
    visualAnchorPlan: context.visualAnchor,
    mimicDiscriminatorPrompt: context.mimicFrame,
    reportingConsequencePrompt: context.reportingConsequence,
    entityCardSections: [
      'Cardiovascular/autopsy taxonomy QA and batch-3 duplication check',
      'Definition and scope in one learner-safe sentence',
      'Normal gross or histologic comparator before abnormal pattern',
      'Gross, diagrammatic, or low-power orientation anchor',
      'High-power microscopic discriminator and one negative feature that prevents overcall',
      'Mechanism-of-disease or mechanism-of-death statement with causality limits',
      'Top mimic, postmortem artifact, or procedure-related change and the best discriminator',
      'Report, autopsy-summary, death-certificate, or clinicopathologic consequence',
      'Safety-critical pitfall for senior resident and attending calibration',
    ],
    retrievalPrompts: [
      `Before reveal: classify the cardiovascular/autopsy entity or process represented by ${row.title}.`,
      'State the normal comparator and the one gross or microscopic feature that must be present before calling it abnormal.',
      'Name the closest mimic, artifact, or procedure-related change and the discriminator that separates them.',
      'Explain the mechanism by which this lesion could contribute to morbidity or death, including limits of causal attribution.',
      'Write the short report, autopsy-summary, or death-certificate phrase that would be safe for supervised sign-out.',
    ],
    spacingSchedule: ['same session', '1 day', '3 days', '7 days', '21 days'],
    facultyReviewChecklist: [
      'Taxonomy QA confirms this is an unused cardiovascular/autopsy teaching target after the first 48 ap_cv rows.',
      'Definition, normal comparator, morphology, mechanism, mimic, discriminator, consequence, and pitfall are source-backed.',
      'Visual anchor is local/licensed or has an explicit no-image rationale.',
      'Retrieval answer key is faculty-reviewed before learner reveal.',
      'One contrastive near-miss or postmortem artifact is included for durable discrimination.',
      'Mechanism-of-death or clinicopathologic relevance is stated without overstating causality.',
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

const readinessLegend = {
  complete: 'Evidence is present and reviewed.',
  'ready-for-review': 'Structured scaffold exists and needs cardiovascular/autopsy faculty confirmation.',
  missing: 'Required content, asset, source, answer key, or reviewer evidence is not yet attached.',
};

const output = {
  generatedAt: new Date().toISOString(),
  sourcePlan: 'reports/ap_gap_closure_plan.json',
  sourceQueue: 'src/content/competency/apGapClosureQueue.ts',
  facultyPacketPath: 'reports/ap_p0_cv_autopsy_card_batch_3_faculty_packet.md',
  facultyPacketCsvPath: 'reports/ap_p0_cv_autopsy_card_batch_3_faculty_packet.csv',
  batchName: 'P0 cardiovascular/autopsy entity card batch 3',
  batchStrategy: 'Up to 24 unused P0 Cardiovascular / Autopsy rows after the first 48 ap_cv rows in source-line order, excluding every sourceQueueId already present in existing apP0 card batches.',
  status: 'draft cardiovascular/autopsy batch-3 scaffolds awaiting faculty-reviewed medical content, visual anchors, answer keys, and review metadata',
  categoryCoverage: {
    categoryId: 'ap_cv',
    category: 'Cardiovascular / Autopsy',
    sourceP0Rows: cvRows.length,
    skippedInitialSourceOrderRows: 48,
    candidateRowsAfterOffset: rowsAfterBatchTwoOffset.length,
    alreadyAssignedSourceQueueIdsAfterOffset: rowsAfterBatchTwoOffset.filter((row) => existingSourceQueueIds.has(row.id)).length,
    selectedCards: cards.length,
  },
  batchReadiness,
  readinessLegend,
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
    const prefix = gateColumnPrefix[gate.id];
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
  difficulty: card.difficulty,
  apSpecPath: card.apSpecPath,
  sourceLine: card.sourceLine,
  specimenContext: card.specimenContext,
  normalComparatorPrompt: card.normalComparatorPrompt,
  visualAnchorPlan: card.visualAnchorPlan,
  mimicDiscriminatorPrompt: card.mimicDiscriminatorPrompt,
  reportingConsequencePrompt: card.reportingConsequencePrompt,
  taxonomyQa: '',
  definition: '',
  normalComparator: '',
  grossDiagramOrLowPowerAnchor: '',
  highPowerMicroscopicDiscriminator: '',
  mechanismOfDiseaseOrDeath: '',
  topMimicOrArtifact: '',
  discriminator: '',
  reportAutopsyOrDeathCertificateLanguage: '',
  safetyPitfall: '',
  visualAssetPathOrRationale: '',
  sourceCitation: '',
  retrievalAnswerKey: '',
  reviewer: '',
  reviewDate: '',
  decision: 'draft',
  ...gateColumnsFor(card),
}));

const packetMd = `# P0 Cardiovascular / Autopsy Entity Card Batch 3 Faculty Authoring Packet

Generated: ${output.generatedAt}

Status: ${output.status}

Batch strategy: ${output.batchStrategy}

Source P0 cardiovascular/autopsy rows: ${output.categoryCoverage.sourceP0Rows}

Skipped initial source-order rows: ${output.categoryCoverage.skippedInitialSourceOrderRows}

Candidate rows after offset: ${output.categoryCoverage.candidateRowsAfterOffset}

Already assigned sourceQueueIds after offset excluded: ${output.categoryCoverage.alreadyAssignedSourceQueueIdsAfterOffset}

Selected cards: ${output.categoryCoverage.selectedCards}

## Faculty Completion Rule

Do not mark a cardiovascular/autopsy card complete until all five gates are satisfied:

1. Taxonomy QA confirms this is an unused cardiovascular/autopsy entity, pattern, mechanism, artifact, or intentional teaching target.
2. Source-backed content is authored: definition, normal comparator, gross/diagram/low-power anchor, high-power discriminator, mechanism, mimic, consequence, and pitfall.
3. Visual anchor is attached or a no-image rationale is explicitly documented.
4. Retrieval prompts have a faculty-reviewed answer key.
5. Reviewer, review date, source citation, image/license status, and editorial decision are documented.

## Batch Readiness

- Cards: ${cards.length}
- Complete gates: ${output.batchReadiness.completedGates}
- Review-ready gates: ${output.batchReadiness.reviewReadyGates}
- Missing gates: ${output.batchReadiness.missingGates}
- Percent review-ready: ${output.batchReadiness.percentReviewReady}%

${cards.map((card, index) => `## ${index + 1}. ${card.title}

- Card ID: \`${card.id}\`
- Source queue ID: \`${card.sourceQueueId}\`
- Domain: ${card.domain}
- Learner level: ${card.learnerLevel}
- Difficulty: ${card.difficulty}
- AP spec path: ${card.apSpecPath}
- Specimen context: ${card.specimenContext}
- Normal comparator prompt: ${card.normalComparatorPrompt}
- Visual anchor plan: ${card.visualAnchorPlan}
- Mimic discriminator prompt: ${card.mimicDiscriminatorPrompt}
- Reporting consequence prompt: ${card.reportingConsequencePrompt}

### Reviewer Workflow

1. Confirm the AP-spec path is a valid unused cardiovascular/autopsy teaching target after the first 48 ap_cv rows and note any taxonomy correction.
2. Author the content fields with source-backed, learner-safe language.
3. Attach the gross/diagram/low-power/high-power image set or no-image rationale and document source/license evidence.
4. Add the retrieval answer key, reviewer/date, and final editorial decision before marking gates complete.
5. Check that mechanism-of-death or clinicopathologic relevance is explicit but does not overstate causal certainty.

### Gate Checklist

${gateChecklistFor(card)}

### Authoring Fields

- Taxonomy QA:
- Cardiovascular/autopsy entity, pattern, or mechanism type:
- Definition and scope:
- Normal comparator:
- Gross/diagram/low-power anchor:
- High-power microscopic discriminator:
- Mechanism of disease or death:
- Top mimic or artifact:
- Best discriminator:
- Report/autopsy/death-certificate language:
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

fs.writeFileSync(outPath, `// Generated by scripts/generate_ap_p0_cv_autopsy_cards_3.cjs. Do not edit by hand.

export const apP0CvAutopsyCardBatch3 = ${JSON.stringify(output, null, 2)} as const;

export type ApP0CvAutopsyCardBatch3Card = typeof apP0CvAutopsyCardBatch3.cards[number];
`);
fs.writeFileSync(packetPath, packetMd);
fs.writeFileSync(packetCsvPath, packetCsv);

const validation = {
  sourceP0CvRows: cvRows.length,
  skippedInitialSourceOrderRows: output.categoryCoverage.skippedInitialSourceOrderRows,
  candidateRowsAfterOffset: output.categoryCoverage.candidateRowsAfterOffset,
  excludedExistingSourceQueueIdsAfterOffset: output.categoryCoverage.alreadyAssignedSourceQueueIdsAfterOffset,
  cards: cards.length,
  gatesPerCard: cards.length ? Math.min(...cards.map((card) => card.gateStatuses.length)) : 0,
  totalGates: batchReadiness.totalGates,
  reviewReadyGates: batchReadiness.reviewReadyGates,
  missingGates: batchReadiness.missingGates,
  duplicateCardIds: cards.length - new Set(cards.map((card) => card.id)).size,
  duplicateSourceQueueIds: cards.length - new Set(cards.map((card) => card.sourceQueueId)).size,
  crossBatchSourceQueueIdCollisions: cards.filter((card) => existingSourceQueueIds.has(card.sourceQueueId)).length,
  cardsWithoutFiveGates: cards.filter((card) => card.gateStatuses.length !== 5).length,
  cardsMissingRequiredSections: cards.filter((card) => (
    !Array.isArray(card.entityCardSections) || card.entityCardSections.length === 0 ||
    !Array.isArray(card.retrievalPrompts) || card.retrievalPrompts.length === 0 ||
    !Array.isArray(card.spacingSchedule) || card.spacingSchedule.length === 0 ||
    !Array.isArray(card.facultyReviewChecklist) || card.facultyReviewChecklist.length === 0 ||
    !card.readiness
  )).length,
  outputs: [
    'scripts/generate_ap_p0_cv_autopsy_cards_3.cjs',
    'src/content/competency/apP0CvAutopsyCardBatch3.ts',
    'reports/ap_p0_cv_autopsy_card_batch_3_faculty_packet.md',
    'reports/ap_p0_cv_autopsy_card_batch_3_faculty_packet.csv',
  ],
};

console.log(JSON.stringify(validation, null, 2));
