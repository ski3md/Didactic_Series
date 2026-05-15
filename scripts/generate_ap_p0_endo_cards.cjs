const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const queuePath = path.join(repoRoot, 'src/content/competency/apGapClosureQueue.ts');
const outPath = path.join(repoRoot, 'src/content/competency/apP0EndocrineCardBatch.ts');
const reportsDir = path.join(repoRoot, 'reports');
const packetPath = path.join(reportsDir, 'ap_p0_endocrine_card_batch_faculty_packet.md');
const packetCsvPath = path.join(reportsDir, 'ap_p0_endocrine_card_batch_faculty_packet.csv');

if (!fs.existsSync(queuePath)) {
  throw new Error(`Missing queue input: ${queuePath}. Run the AP gap plan generator first.`);
}

const queueText = fs.readFileSync(queuePath, 'utf8');
const queueMatch = queueText.match(/export const apGapClosureQueue = (\{[\s\S]*\}) as const;/);

if (!queueMatch) {
  throw new Error(`Could not parse exported queue object from ${queuePath}`);
}

const queue = JSON.parse(queueMatch[1]);
const endocrineRows = (queue.p0Rows || [])
  .filter((row) => row.categoryId === 'ap_endo' && String(row.priority || '').startsWith('P0'))
  .sort((a, b) => {
    const sourceLineDelta = (Number(a.sourceLine) || 0) - (Number(b.sourceLine) || 0);
    if (sourceLineDelta !== 0) return sourceLineDelta;
    return String(a.path).localeCompare(String(b.path));
  });

const selectedRows = endocrineRows.slice(0, 24);

if (selectedRows.length === 0) {
  throw new Error('No P0 Endocrine rows found in src/content/competency/apGapClosureQueue.ts');
}

const endocrineContextFor = (row) => {
  const pathText = String(row.path || '');
  const normalized = pathText.toLowerCase();

  if (normalized.includes('thyroid')) {
    return {
      organFocus: 'thyroid',
      specimenContext: 'thyroid FNA correlation, thyroidectomy/lobectomy, or thyroid-adjacent neck specimen as appropriate',
      normalComparator: 'normal thyroid follicles with colloid and evenly spaced follicular epithelium',
      visualAnchor: 'low-power thyroid architecture plus high-power follicular/lymphoid/infectious feature with normal thyroid comparator',
      ancillaryPrompt: 'connect morphology to thyroiditis pattern, infection workup, malignancy mimic exclusion, or report comment as appropriate',
      mimicPrompt: 'subacute thyroiditis, chronic lymphocytic thyroiditis, granulomatous infection, reactive change, and neoplasm mimic when applicable',
    };
  }

  if (normalized.includes('adrenal')) {
    return {
      organFocus: 'adrenal gland',
      specimenContext: 'adrenalectomy, adrenal biopsy, or autopsy adrenal specimen with clinicoradiologic correlation',
      normalComparator: 'normal adrenal cortex zonation and medulla before lesion-level pattern recognition',
      visualAnchor: 'adrenal cortex/medulla orientation image plus lesion-specific gross or H&E field',
      ancillaryPrompt: 'connect morphology to functional status, cortical versus medullary lineage, malignancy risk, or required reporting element',
      mimicPrompt: 'adrenal cortical adenoma/carcinoma, pheochromocytoma/paraganglioma, metastasis, infection, hemorrhage, and hyperplasia as appropriate',
    };
  }

  return {
    organFocus: 'taxonomy-review endocrine row',
    specimenContext: 'endocrine or endocrine-adjacent specimen only after taxonomy QA confirms this AP-spec path belongs in endocrine',
    normalComparator: 'faculty-selected normal endocrine comparator or taxonomy-correction note if this row belongs outside endocrine',
    visualAnchor: 'taxonomy QA image plan: attach endocrine normal-to-abnormal anchor or document reassignment/no-image rationale',
    ancillaryPrompt: 'confirm endocrine relevance before adding ancillary, molecular, functional, or reporting consequence language',
    mimicPrompt: 'faculty must identify the closest endocrine mimic or reassign the row to the correct AP domain before content authoring',
  };
};

const gateStatusesFor = (context) => [
  {
    id: 'taxonomy-qa',
    label: 'Taxonomy QA',
    status: 'ready-for-review',
    evidence: `Generated from ap_endo P0 queue; confirm endocrine placement, organ focus (${context.organFocus}), and entity/process status before authoring.`,
  },
  {
    id: 'content-authoring',
    label: 'Entity card content',
    status: 'missing',
    evidence: 'Definition, endocrine normal comparator, morphology, mimic discriminator, pitfall, and report language require source-backed authoring.',
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
    evidence: 'Retrieval prompts are scaffolded; faculty-reviewed answers and spaced-repeat reveal text are not yet attached.',
  },
  {
    id: 'faculty-review',
    label: 'Faculty review',
    status: 'missing',
    evidence: 'Endocrine faculty reviewer, source citation, image/license status, editorial decision, and review date are not yet attached.',
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
  const context = endocrineContextFor(row);
  const gateStatuses = gateStatusesFor(context);

  return {
    id: `p0-endo-card-${String(index + 1).padStart(2, '0')}-${row.topicId}`,
    sourceQueueId: row.id,
    editorialStatus: 'draft-scaffold',
    priority: row.priority,
    title: row.title,
    category: row.category,
    rotation: row.rotation,
    apSpecPath: row.path,
    learnerLevel: row.learnerLevel,
    sourceLine: row.sourceLine,
    endocrineOrganFocus: context.organFocus,
    specimenContext: context.specimenContext,
    normalComparatorPrompt: context.normalComparator,
    visualAnchorPlan: context.visualAnchor,
    mimicDiscriminatorPrompt: context.mimicPrompt,
    reportingConsequencePrompt: context.ancillaryPrompt,
    entityCardSections: [
      'Endocrine taxonomy QA and organ/site assignment',
      'Definition and scope in one learner-safe sentence',
      'Normal endocrine comparator before abnormal pattern',
      'Key low-power architecture and high-power cytologic cue',
      'Top mimic and single best discriminator',
      'Ancillary, functional, staging, or reporting consequence',
      'Pitfall that could create a clinically meaningful miss',
    ],
    retrievalPrompts: [
      `Before reveal: identify the endocrine entity/process represented by ${row.title}.`,
      'State the normal comparator and one feature that must be present before calling this abnormal.',
      'Name the closest mimic and the discriminator that separates them.',
      'Write the report/comment/ancillary next step that would matter clinically.',
    ],
    spacingSchedule: ['same session', '1 day', '3 days', '7 days', '21 days'],
    facultyReviewChecklist: [
      'Taxonomy QA confirms this row belongs in endocrine or documents reassignment.',
      'Source citation and review date are attached.',
      'Image, gross photo, diagram, or no-image rationale is licensed/local and documented.',
      'Retrieval answer key is reviewed before learner reveal.',
      'One endocrine near-miss or mimic is included for contrastive learning.',
    ],
    completionGate: 'Not complete until taxonomy QA, source-backed endocrine content, visual anchor, retrieval answer key, and faculty QA metadata are all present.',
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
  'ready-for-review': 'Structured scaffold exists and needs faculty confirmation.',
  missing: 'Required endocrine content, visual asset, source, answer key, or reviewer evidence is not yet attached.',
};

const output = {
  generatedAt: new Date().toISOString(),
  sourcePlan: 'reports/ap_gap_closure_plan.json',
  sourceQueue: 'src/content/competency/apGapClosureQueue.ts',
  facultyPacketPath: 'reports/ap_p0_endocrine_card_batch_faculty_packet.md',
  facultyPacketCsvPath: 'reports/ap_p0_endocrine_card_batch_faculty_packet.csv',
  batchName: 'P0 endocrine entity card batch',
  batchStrategy: 'First up to 24 P0 Endocrine rows from the AP gap closure queue, preserving source order and requiring taxonomy QA before medical authoring.',
  sourceCategory: 'ap_endo',
  sourceP0Rows: endocrineRows.length,
  selectedRows: cards.length,
  status: 'draft endocrine scaffolds awaiting taxonomy QA, source-backed content, visual anchors, retrieval answer keys, and faculty review',
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

const reviewerWorkflow = [
  'Confirm the AP-spec path belongs in endocrine; document taxonomy correction if it does not.',
  'Fill definition, normal comparator, morphology, mimic/discriminator, consequence, and pitfall with source-backed content.',
  'Attach the image, gross photo, diagram, or no-image rationale and document source/license evidence.',
  'Add retrieval answer key, reviewer/date, source citation, and final editorial decision before marking gates complete.',
];

const packetRows = cards.map((card) => ({
  cardId: card.id,
  sourceQueueId: card.sourceQueueId,
  title: card.title,
  category: card.category,
  endocrineOrganFocus: card.endocrineOrganFocus,
  learnerLevel: card.learnerLevel,
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
  morphologyAnchor: '',
  topMimic: '',
  discriminator: '',
  ancillaryOrReportingConsequence: '',
  safetyPitfall: '',
  visualAssetPathOrRationale: '',
  sourceCitation: '',
  retrievalAnswerKey: '',
  reviewer: '',
  reviewDate: '',
  decision: 'draft',
  ...gateColumnsFor(card),
}));

const packetMd = `# P0 Endocrine Entity Card Batch Faculty Authoring Packet

Generated: ${output.generatedAt}

Status: ${output.status}

Batch strategy: ${output.batchStrategy}

Source P0 endocrine rows: ${output.sourceP0Rows}

Selected cards: ${output.selectedRows}

## Faculty Completion Rule

Do not mark a card complete until all five gates are satisfied:

1. Taxonomy QA confirms this AP-spec path belongs in endocrine or documents reassignment.
2. Source-backed endocrine content is authored: definition, normal comparator, morphology, mimic/discriminator, consequence, and pitfall.
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
- Category: ${card.category}
- Endocrine organ focus: ${card.endocrineOrganFocus}
- Learner level: ${card.learnerLevel}
- AP spec path: ${card.apSpecPath}
- Specimen context: ${card.specimenContext}
- Normal comparator prompt: ${card.normalComparatorPrompt}
- Visual anchor plan: ${card.visualAnchorPlan}
- Mimic discriminator prompt: ${card.mimicDiscriminatorPrompt}
- Reporting consequence prompt: ${card.reportingConsequencePrompt}

### Reviewer Workflow

${reviewerWorkflow.map((step, stepIndex) => `${stepIndex + 1}. ${step}`).join('\n')}

### Gate Checklist

${gateChecklistFor(card)}

### Authoring Fields

- Taxonomy QA:
- Definition and scope:
- Normal endocrine comparator:
- Key morphology anchor:
- Top mimic:
- Best discriminator:
- Ancillary, functional, staging, or reporting consequence:
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

fs.writeFileSync(outPath, `// Generated by scripts/generate_ap_p0_endo_cards.cjs. Do not edit by hand.

export const apP0EndocrineCardBatch = ${JSON.stringify(output, null, 2)} as const;

export type ApP0EndocrineCard = typeof apP0EndocrineCardBatch.cards[number];
`);
fs.writeFileSync(packetPath, packetMd);
fs.writeFileSync(packetCsvPath, packetCsv);

const validation = {
  sourceP0EndocrineRows: endocrineRows.length,
  cards: cards.length,
  gatesPerCard: Math.min(...cards.map((card) => card.gateStatuses.length)),
  totalGates: batchReadiness.totalGates,
  reviewReadyGates: batchReadiness.reviewReadyGates,
  missingGates: batchReadiness.missingGates,
  duplicateCardIds: cards.length - new Set(cards.map((card) => card.id)).size,
  duplicateSourceQueueIds: cards.length - new Set(cards.map((card) => card.sourceQueueId)).size,
  outputs: [
    'scripts/generate_ap_p0_endo_cards.cjs',
    'src/content/competency/apP0EndocrineCardBatch.ts',
    'reports/ap_p0_endocrine_card_batch_faculty_packet.md',
    'reports/ap_p0_endocrine_card_batch_faculty_packet.csv',
  ],
};

console.log(JSON.stringify(validation, null, 2));
