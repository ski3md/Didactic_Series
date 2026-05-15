const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const queuePath = path.join(repoRoot, 'src/content/competency/apGapClosureQueue.ts');
const contentDir = path.join(repoRoot, 'src/content/competency');
const outPath = path.join(contentDir, 'apP0BreastCardBatch.ts');
const reportsDir = path.join(repoRoot, 'reports');
const packetPath = path.join(reportsDir, 'ap_p0_breast_card_batch_faculty_packet.md');
const packetCsvPath = path.join(reportsDir, 'ap_p0_breast_card_batch_faculty_packet.csv');

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

const readExportedObject = (filePath, exportName) => (
  JSON.parse(extractExportedObject(fs.readFileSync(filePath, 'utf8'), exportName))
);

const queue = readExportedObject(queuePath, 'apGapClosureQueue');

const existingSourceQueueIds = new Set();
for (const fileName of fs.readdirSync(contentDir)) {
  if (!/^apP0.*CardBatch\d*\.ts$/.test(fileName) || fileName === 'apP0BreastCardBatch.ts') continue;

  const filePath = path.join(contentDir, fileName);
  const source = fs.readFileSync(filePath, 'utf8');
  const exportMatch = source.match(/export const (apP0[A-Za-z0-9]+CardBatch) = /);
  if (!exportMatch) continue;

  const batch = JSON.parse(extractExportedObject(source, exportMatch[1]));
  for (const card of batch.cards || []) {
    if (card.sourceQueueId) existingSourceQueueIds.add(card.sourceQueueId);
  }
}

const breastRows = (queue.p0Rows || [])
  .filter((row) => row.categoryId === 'ap_breast' && String(row.priority || '').startsWith('P0'))
  .sort((a, b) => {
    if ((a.sourceLine || 0) !== (b.sourceLine || 0)) return (a.sourceLine || 0) - (b.sourceLine || 0);
    return String(a.path).localeCompare(String(b.path));
  });

const selectedRows = breastRows
  .filter((row) => !existingSourceQueueIds.has(row.id))
  .slice(0, 24);

if (selectedRows.length === 0) {
  throw new Error('No unassigned P0 Breast rows found in apGapClosureQueue.');
}

const breastContextFor = (row) => {
  const combined = `${row.path || ''} ${row.title || ''}`.toLowerCase();

  if (combined.includes('normal anatomy') || combined.includes('histology')) {
    return {
      learningFrame: 'normal-to-abnormal breast foundation',
      specimenContext: 'core biopsy, excision, or reduction mammoplasty specimen with terminal duct lobular unit orientation and radiology correlation when applicable',
      normalComparator: 'normal terminal duct lobular unit, duct, lobule, stroma, and myoepithelial layer before lesion-level interpretation',
      visualAnchor: 'normal breast lobule/duct comparator plus lesion-specific low-power architecture and high-power epithelial/stromal cue',
      ancillaryPrompt: 'state whether myoepithelial markers, ER/PR/HER2, or no ancillary testing is appropriate for this teaching target',
      reportingConsequence: 'safe benign report wording, radiology-pathology concordance, or escalation trigger when morphology is discordant',
      mimicPrompt: 'benign proliferative change, fibroepithelial lesion, vascular lesion, therapy effect, or invasive carcinoma mimic as appropriate',
    };
  }

  if (combined.includes('therapy')) {
    return {
      learningFrame: 'therapy-effect and treatment-history integration',
      specimenContext: 'post-neoadjuvant breast excision or mastectomy with pretreatment diagnosis, treatment history, tumor bed sampling, and nodal context',
      normalComparator: 'untreated breast parenchyma and baseline tumor morphology when available',
      visualAnchor: 'tumor bed fibrosis/necrosis/treatment-effect field paired with residual carcinoma or no-residual-disease comparator',
      ancillaryPrompt: 'connect morphology to residual cancer burden, receptor reassessment when indicated, and synoptic treatment-effect elements',
      reportingConsequence: 'residual disease, tumor bed dimensions, nodal treatment effect, and management-relevant synoptic language',
      mimicPrompt: 'scar, biopsy site change, fat necrosis, prior procedure effect, and residual invasive or in situ carcinoma',
    };
  }

  return {
    learningFrame: 'breast lesion scaffold',
    specimenContext: 'breast core biopsy, excision, mastectomy, or axillary specimen with imaging target, laterality, size, and clinical history captured before diagnosis',
    normalComparator: 'normal terminal duct lobular unit and myoepithelial layer before abnormal architecture or cytology',
    visualAnchor: 'low-power breast architecture plus high-power diagnostic feature and normal/reactive comparator',
    ancillaryPrompt: 'state the IHC, biomarker, myoepithelial, or molecular test that would be appropriate if any',
    reportingConsequence: 'diagnostic category, radiology-pathology concordance, excision need, biomarker implication, or synoptic consequence',
    mimicPrompt: 'usual ductal hyperplasia, atypia, DCIS, invasive carcinoma, fibroepithelial lesion, vascular lesion, or therapy/procedure effect as appropriate',
  };
};

const gateStatusesFor = (row, context) => [
  {
    id: 'taxonomy-qa',
    label: 'Taxonomy QA',
    status: 'ready-for-review',
    evidence: `Generated from Breast AP specification path at source line ${row.sourceLine}; faculty must confirm whether this is an entity, normal structure, treatment effect, or parser artifact.`,
  },
  {
    id: 'content-authoring',
    label: 'Entity card content',
    status: 'missing',
    evidence: 'Needs source-backed definition, normal comparator, morphology, mimic discriminator, ancillary/reporting consequence, and safety pitfall.',
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
    evidence: 'Breast prompt set exists; faculty-reviewed answer key and reveal text are not yet attached.',
  },
  {
    id: 'faculty-review',
    label: 'Faculty review',
    status: 'missing',
    evidence: 'Breast faculty reviewer, source citation, image/license status, biomarker/synoptic check when relevant, and last-reviewed date are not yet attached.',
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
  const context = breastContextFor(row);
  const gateStatuses = gateStatusesFor(row, context);

  return {
    id: `p0-breast-card-${String(index + 1).padStart(2, '0')}-${row.topicId}`,
    sourceQueueId: row.id,
    editorialStatus: 'draft-scaffold',
    priority: row.priority,
    title: row.title,
    category: row.category,
    rotation: row.rotation,
    apSpecPath: row.path,
    learnerLevel: row.learnerLevel,
    difficulty: row.difficulty,
    sourceLine: row.sourceLine,
    learningFrame: context.learningFrame,
    specimenContext: context.specimenContext,
    normalComparatorPrompt: context.normalComparator,
    visualAnchorPlan: context.visualAnchor,
    mimicDiscriminatorPrompt: context.mimicPrompt,
    ancillaryDecisionPrompt: context.ancillaryPrompt,
    reportingConsequencePrompt: context.reportingConsequence,
    entityCardSections: [
      'Breast taxonomy QA and specimen/radiology context',
      'Definition and scope in one learner-safe sentence',
      'Normal terminal duct lobular unit or myoepithelial comparator before abnormal pattern',
      'Low-power architecture and high-power cytologic or stromal cue',
      'Top mimic and single best discriminator',
      'Ancillary, biomarker, concordance, or synoptic/reporting consequence',
      'Pitfall that could create a clinically meaningful breast-pathology miss',
    ],
    retrievalPrompts: [
      `Before reveal: identify the breast entity, normal structure, or treatment-related process represented by ${row.title}.`,
      'State the normal comparator and one feature that must be present before making this call.',
      'Name the closest mimic and the discriminator that separates them.',
      'State the ancillary test, biomarker/synoptic element, or radiology-pathology concordance step that would matter if any.',
      'Write the concise report/comment phrase that would be safe for a junior resident.',
    ],
    spacingSchedule: ['same session', '1 day', '3 days', '7 days', '21 days'],
    facultyReviewChecklist: [
      'Taxonomy QA confirms this queue row is a valid breast teaching target or documents correction.',
      'Definition, normal comparator, morphology, mimic, discriminator, consequence, and pitfall are source-backed.',
      'Visual anchor is local/licensed or has an explicit no-image rationale.',
      'Retrieval answer key is faculty-reviewed before learner reveal.',
      'Radiology-pathology concordance, biomarker, myoepithelial, or synoptic implication is handled when relevant.',
    ],
    completionGate: 'Not complete until taxonomy QA, source-backed breast content, visual anchor, retrieval answer key, and breast faculty review metadata are all satisfied.',
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

batchReadiness.percentComplete = Math.round((batchReadiness.completedGates / batchReadiness.totalGates) * 100);
batchReadiness.percentReviewReady = Math.round(((batchReadiness.completedGates + batchReadiness.reviewReadyGates) / batchReadiness.totalGates) * 100);

const readinessLegend = {
  complete: 'Evidence is present and reviewed.',
  'ready-for-review': 'Structured scaffold exists and needs breast pathology faculty confirmation.',
  missing: 'Required breast content, asset, source, answer key, or reviewer evidence is not yet attached.',
};

const output = {
  generatedAt: new Date().toISOString(),
  sourcePlan: 'reports/ap_gap_closure_plan.json',
  sourceQueue: 'src/content/competency/apGapClosureQueue.ts',
  excludedExistingSourceQueueIds: existingSourceQueueIds.size,
  facultyPacketPath: 'reports/ap_p0_breast_card_batch_faculty_packet.md',
  facultyPacketCsvPath: 'reports/ap_p0_breast_card_batch_faculty_packet.csv',
  batchName: 'P0 breast entity card batch',
  batchStrategy: 'All available unassigned P0 Breast rows, capped at 24, converted into normal-comparator and concordance-aware draft scaffolds with five readiness gates.',
  status: 'draft breast scaffolds awaiting taxonomy QA, source-backed content, visual anchors, retrieval answer keys, and faculty review metadata',
  categoryCoverage: {
    categoryId: 'ap_breast',
    category: 'Breast',
    queueP0Rows: breastRows.length,
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
  .map((gate) => `- [ ] ${gate.label}: ${gate.status} - ${gate.evidence}`)
  .join('\n');

const packetRows = cards.map((card) => ({
  cardId: card.id,
  sourceQueueId: card.sourceQueueId,
  title: card.title,
  category: card.category,
  learnerLevel: card.learnerLevel,
  difficulty: card.difficulty,
  apSpecPath: card.apSpecPath,
  sourceLine: card.sourceLine,
  learningFrame: card.learningFrame,
  specimenContext: card.specimenContext,
  normalComparatorPrompt: card.normalComparatorPrompt,
  visualAnchorPlan: card.visualAnchorPlan,
  mimicDiscriminatorPrompt: card.mimicDiscriminatorPrompt,
  ancillaryDecisionPrompt: card.ancillaryDecisionPrompt,
  reportingConsequencePrompt: card.reportingConsequencePrompt,
  taxonomyQa: '',
  definition: '',
  normalComparator: '',
  lowPowerArchitecture: '',
  highPowerFeature: '',
  topMimic: '',
  discriminator: '',
  ancillaryOrConcordanceDecision: '',
  reportLanguage: '',
  safetyPitfall: '',
  visualAssetPathOrRationale: '',
  sourceCitation: '',
  retrievalAnswerKey: '',
  reviewer: '',
  reviewDate: '',
  decision: 'draft',
  ...gateColumnsFor(card),
}));

const packetMd = `# P0 Breast Entity Card Batch Faculty Authoring Packet

Generated: ${output.generatedAt}

Status: ${output.status}

Batch strategy: ${output.batchStrategy}

Source P0 breast rows: ${breastRows.length}

Selected cards: ${cards.length}

## Faculty Completion Rule

Do not mark a breast card complete until all five gates are satisfied:

1. Taxonomy QA confirms this is a valid breast entity, normal structure, treatment effect, or intentional teaching target.
2. Source-backed content is authored: definition, normal comparator, architecture/cytology/stroma, mimic/discriminator, consequence, and pitfall.
3. Visual anchor is attached or a no-image rationale is explicitly documented.
4. Retrieval prompts have a faculty-reviewed answer key.
5. Reviewer, review date, source citation, image/license status, concordance/biomarker/synoptic check when relevant, and editorial decision are documented.

## Batch Readiness

- Cards: ${cards.length}
- Complete gates: ${output.batchReadiness.completedGates}
- Review-ready gates: ${output.batchReadiness.reviewReadyGates}
- Missing gates: ${output.batchReadiness.missingGates}
- Percent review-ready: ${output.batchReadiness.percentReviewReady}%

${cards.map((card, index) => `## ${index + 1}. ${card.title}

- Card ID: \`${card.id}\`
- Source queue ID: \`${card.sourceQueueId}\`
- Learner level: ${card.learnerLevel}
- Difficulty: ${card.difficulty}
- AP spec path: ${card.apSpecPath}
- Learning frame: ${card.learningFrame}
- Specimen context: ${card.specimenContext}
- Normal comparator prompt: ${card.normalComparatorPrompt}
- Visual anchor plan: ${card.visualAnchorPlan}
- Mimic discriminator prompt: ${card.mimicDiscriminatorPrompt}
- Ancillary/concordance prompt: ${card.ancillaryDecisionPrompt}
- Reporting consequence prompt: ${card.reportingConsequencePrompt}

### Reviewer Workflow

1. Confirm the AP-spec path is a valid breast teaching target and note any taxonomy correction.
2. Author content with source-backed, learner-safe language anchored to normal breast comparison.
3. Attach the low-power/high-power image pair, gross/radiology correlate when appropriate, diagram, or no-image rationale and document source/license evidence.
4. Add the retrieval answer key, reviewer/date, concordance/biomarker/synoptic check when relevant, and final editorial decision before marking gates complete.

### Gate Checklist

${gateChecklistFor(card)}

### Authoring Fields

- Taxonomy QA:
- Definition and scope:
- Normal breast comparator:
- Low-power architecture:
- High-power diagnostic feature:
- Top mimic:
- Best discriminator:
- Ancillary, biomarker, concordance, or synoptic decision:
- Report language:
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

fs.writeFileSync(outPath, `// Generated by scripts/generate_ap_p0_breast_cards.cjs. Do not edit by hand.

export const apP0BreastCardBatch = ${JSON.stringify(output, null, 2)} as const;

export type ApP0BreastCard = typeof apP0BreastCardBatch.cards[number];
`);
fs.writeFileSync(packetPath, packetMd);
fs.writeFileSync(packetCsvPath, packetCsv);

console.log(JSON.stringify({
  sourceP0BreastRows: breastRows.length,
  selectedCards: cards.length,
  excludedExistingSourceQueueIds: existingSourceQueueIds.size,
  gatesPerCard: Math.min(...cards.map((card) => card.gateStatuses.length)),
  totalGates: batchReadiness.totalGates,
  reviewReadyGates: batchReadiness.reviewReadyGates,
  missingGates: batchReadiness.missingGates,
  duplicateCardIds: cards.length - new Set(cards.map((card) => card.id)).size,
  duplicateSourceQueueIds: cards.length - new Set(cards.map((card) => card.sourceQueueId)).size,
  outputs: [
    'scripts/generate_ap_p0_breast_cards.cjs',
    'src/content/competency/apP0BreastCardBatch.ts',
    'reports/ap_p0_breast_card_batch_faculty_packet.md',
    'reports/ap_p0_breast_card_batch_faculty_packet.csv',
  ],
}, null, 2));
