const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const planPath = path.join(repoRoot, 'reports/ap_gap_closure_plan.json');
const outPath = path.join(repoRoot, 'src/content/competency/apP0EntityCardBatch.ts');
const reportsDir = path.join(repoRoot, 'reports');
const packetPath = path.join(reportsDir, 'ap_p0_entity_card_batch_1_faculty_packet.md');
const packetCsvPath = path.join(reportsDir, 'ap_p0_entity_card_batch_1_faculty_packet.csv');

if (!fs.existsSync(planPath)) {
  throw new Error(`Missing plan input: ${planPath}. Run npm run ap:gaps:plan first.`);
}

const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
const p0Rows = (plan.rows || []).filter((row) => String(row.priority || '').startsWith('P0'));

const categoryPriority = [
  'ap_gu',
  'ap_placenta',
  'ap_gi',
  'ap_cv',
  'ap_endo',
  'ap_resp',
  'ap_soft',
  'ap_cyto',
  'ap_hn',
  'ap_pediatric',
  'ap_breast',
  'ap_dermpath',
  'ap_forensic',
  'ap_neuro',
  'ap_male_repro',
];

const categoryRank = new Map(categoryPriority.map((category, index) => [category, index]));

const selectedRows = [...p0Rows]
  .sort((a, b) => {
    const rankA = categoryRank.get(a.categoryId) ?? 999;
    const rankB = categoryRank.get(b.categoryId) ?? 999;
    if (rankA !== rankB) return rankA - rankB;
    return String(a.path).localeCompare(String(b.path));
  })
  .slice(0, 24);

const categoryContext = {
  ap_gu: {
    specimenContext: 'renal biopsy, nephrectomy, bladder biopsy/TURBT, or cystectomy depending on entity',
    visualAnchor: 'H&E plus IF/EM when medical kidney, or H&E/gross for bladder and lower GU',
    reportingConsequence: 'diagnostic category, chronicity/activity or report element that changes management',
  },
  ap_placenta: {
    specimenContext: 'placental disc, membranes, cord, and maternal/fetal surfaces',
    visualAnchor: 'gross orientation image or diagram plus H&E lesion anchor',
    reportingConsequence: 'maternal/fetal consequence and reportable placental lesion language',
  },
  ap_gi: {
    specimenContext: 'endoscopic biopsy or resection from the relevant GI site',
    visualAnchor: 'low-power architecture plus high-power diagnostic feature',
    reportingConsequence: 'diagnosis, activity/chronicity, dysplasia/neoplasia status, or management-relevant comment',
  },
  ap_cv: {
    specimenContext: 'autopsy heart/vessel specimen or cardiovascular surgical pathology specimen',
    visualAnchor: 'gross-micro correlation, vessel/valve/myocardium diagram, or H&E anchor',
    reportingConsequence: 'mechanism-of-disease or mechanism-of-death reasoning and clinicopathologic correlation',
  },
  ap_endo: {
    specimenContext: 'endocrine biopsy/resection or endocrine-adjacent surgical specimen',
    visualAnchor: 'normal-to-abnormal endocrine architecture comparison plus key diagnostic field',
    reportingConsequence: 'diagnosis, functional/clinical implication, and any required ancillary or staging element',
  },
  ap_resp: {
    specimenContext: 'lung biopsy/resection, pleura, or mediastinal specimen',
    visualAnchor: 'pattern-level lung/pleura/mediastinum image plus mimic comparison',
    reportingConsequence: 'diagnosis, pattern classification, and management-relevant comment',
  },
  ap_soft: {
    specimenContext: 'bone, joint, or soft tissue biopsy/resection',
    visualAnchor: 'radiology/gross context plus pattern-level histology',
    reportingConsequence: 'benign/malignant category, grade when relevant, and ancillary/staging implication',
  },
  ap_cyto: {
    specimenContext: 'cytology specimen with adequacy, preparation type, and diagnostic category',
    visualAnchor: 'representative cytology image with adequacy and diagnostic-feature callouts',
    reportingConsequence: 'diagnostic category, adequacy, and recommended follow-up language',
  },
  default: {
    specimenContext: 'organ-system specimen appropriate to the AP content-spec path',
    visualAnchor: 'representative image, gross photo, diagram, or explicit no-image rationale',
    reportingConsequence: 'diagnostic, differential, ancillary, or reporting consequence relevant to patient care',
  },
};

const contextFor = (categoryId) => categoryContext[categoryId] || categoryContext.default;

const cards = selectedRows.map((row, index) => {
  const context = contextFor(row.categoryId);
  const gateStatuses = [
    {
      id: 'taxonomy-qa',
      label: 'Taxonomy QA',
      status: 'ready-for-review',
      evidence: 'Generated from normalized AP specification path; faculty must confirm entity/process classification.',
    },
    {
      id: 'content-authoring',
      label: 'Entity card content',
      status: 'missing',
      evidence: 'Definition, morphology, mimic discriminator, pitfall, and report language still require source-backed authoring.',
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
      evidence: 'Prompts exist; faculty-reviewed answer key is not yet attached.',
    },
    {
      id: 'faculty-review',
      label: 'Faculty review',
      status: 'missing',
      evidence: 'Reviewer, source citation, and last-reviewed date are not yet attached.',
    },
  ];

  return {
    id: `p0-card-${String(index + 1).padStart(2, '0')}-${row.topicId}`,
    sourceQueueId: `${row.categoryId}-${row.topicId}`,
    editorialStatus: 'draft-scaffold',
    priority: row.priority,
    title: row.title,
    category: row.category,
    rotation: row.rotation,
    apSpecPath: row.path,
    learnerLevel: row.learnerLevel,
    sourceLine: row.sourceLine,
    specimenContext: context.specimenContext,
    visualAnchorPlan: context.visualAnchor,
    reportingConsequencePrompt: context.reportingConsequence,
    entityCardSections: [
      'Definition and scope in one learner-safe sentence',
      'Normal or reactive comparator before abnormal pattern',
      'Key morphology anchor with one low-power cue and one high-power cue',
      'Top mimic and the single best discriminator',
      'Ancillary or reporting consequence',
      'Pitfall that could cause a safety-critical miss',
    ],
    retrievalPrompts: [
      `Before reveal: name the entity or process represented by ${row.title}.`,
      'State one feature that must be present before calling it.',
      'Name the closest mimic and the discriminator that separates them.',
      'Write the report or comment phrase that would matter clinically.',
    ],
    spacingSchedule: ['same session', '1 day', '3 days', '7 days', '21 days'],
    facultyReviewChecklist: [
      'Taxonomy QA confirms this is a true content entity/process/reporting task.',
      'Source citation and review date are attached.',
      'Image/gross/diagram asset is licensed, local, or explicitly deferred.',
      'Answer key is faculty-reviewed before learner reveal.',
      'One near-miss or mimic is included for contrastive learning.',
    ],
    completionGate: 'Not complete until entity card, visual anchor, retrieval answer key, and faculty QA metadata are all present.',
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

batchReadiness.percentComplete = Math.round((batchReadiness.completedGates / batchReadiness.totalGates) * 100);
batchReadiness.percentReviewReady = Math.round(((batchReadiness.completedGates + batchReadiness.reviewReadyGates) / batchReadiness.totalGates) * 100);

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
    return `- ${checkbox} ${gate.label}: ${gate.status} — ${gate.evidence}`;
  })
  .join('\n');

const output = {
  generatedAt: new Date().toISOString(),
  sourcePlan: 'reports/ap_gap_closure_plan.json',
  facultyPacketPath: 'reports/ap_p0_entity_card_batch_1_faculty_packet.md',
  batchName: 'P0 core entity card batch 1',
  batchStrategy: 'First 24 P0 rows prioritized toward medical kidney/GU, placenta, GI, cardiovascular/autopsy, endocrine, thoracic, soft tissue, cytology, and head and neck before broader long-tail domains.',
  status: 'draft scaffolds awaiting faculty-reviewed medical content and visual assets',
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
  title: card.title,
  category: card.category,
  learnerLevel: card.learnerLevel,
  apSpecPath: card.apSpecPath,
  specimenContext: card.specimenContext,
  visualAnchorPlan: card.visualAnchorPlan,
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

const packetMd = `# P0 Core Entity Card Batch 1 Faculty Authoring Packet

Generated: ${output.generatedAt}

Status: ${output.status}

Batch strategy: ${output.batchStrategy}

## Faculty Completion Rule

Do not mark a card complete until all five gates are satisfied:

1. Taxonomy QA confirms this is a true entity, process, reporting task, or intentional professionalism/admin topic.
2. Source-backed medical content is authored: definition, normal comparator, morphology, mimic/discriminator, consequence, and pitfall.
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
- Category: ${card.category}
- Learner level: ${card.learnerLevel}
- AP spec path: ${card.apSpecPath}
- Specimen context: ${card.specimenContext}
- Visual anchor plan: ${card.visualAnchorPlan}
- Reporting consequence prompt: ${card.reportingConsequencePrompt}

### Reviewer Workflow

1. Confirm the AP-spec path is a valid teachable entity/process and note any taxonomy correction.
2. Fill the authoring fields with source-backed, learner-safe content.
3. Attach the image, gross photo, diagram, or no-image rationale and document source/license evidence.
4. Add the retrieval answer key, reviewer/date, and final editorial decision before marking gates complete.

### Gate Checklist

${gateChecklistFor(card)}

### Authoring Fields

- Taxonomy QA:
- Definition and scope:
- Normal/reactive comparator:
- Key morphology anchor:
- Top mimic:
- Best discriminator:
- Ancillary or reporting consequence:
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

const ts = `// Generated by scripts/generate_ap_p0_entity_cards.cjs. Do not edit by hand.

export const apP0EntityCardBatch = ${JSON.stringify(output, null, 2)} as const;

export type ApP0EntityCard = typeof apP0EntityCardBatch.cards[number];
`;

fs.writeFileSync(outPath, ts);

console.log(JSON.stringify({
  cards: cards.length,
  outputs: [
    'src/content/competency/apP0EntityCardBatch.ts',
    'reports/ap_p0_entity_card_batch_1_faculty_packet.md',
    'reports/ap_p0_entity_card_batch_1_faculty_packet.csv',
  ],
}, null, 2));
