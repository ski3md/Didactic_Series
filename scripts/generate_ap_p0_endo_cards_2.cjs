const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const queuePath = path.join(repoRoot, 'src/content/competency/apGapClosureQueue.ts');
const batchDir = path.join(repoRoot, 'src/content/competency');
const outPath = path.join(batchDir, 'apP0EndocrineCardBatch2.ts');
const reportsDir = path.join(repoRoot, 'reports');
const packetPath = path.join(reportsDir, 'ap_p0_endocrine_card_batch_2_faculty_packet.md');
const packetCsvPath = path.join(reportsDir, 'ap_p0_endocrine_card_batch_2_faculty_packet.csv');

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
  if (!/^apP0.*CardBatch\d*\.ts$/.test(fileName) || fileName === 'apP0EndocrineCardBatch2.ts') continue;
  const source = fs.readFileSync(path.join(batchDir, fileName), 'utf8');
  for (const match of source.matchAll(/"sourceQueueId":\s*"([^"]+)"/g)) {
    existingSourceQueueIds.add(match[1]);
  }
}

const endocrineRows = (queue.p0Rows || [])
  .filter((row) => row.categoryId === 'ap_endo' && String(row.priority || '').startsWith('P0'))
  .sort((a, b) => {
    const sourceLineDelta = (Number(a.sourceLine) || 0) - (Number(b.sourceLine) || 0);
    if (sourceLineDelta !== 0) return sourceLineDelta;
    return String(a.path).localeCompare(String(b.path));
  });

const selectedRows = endocrineRows.filter((row) => !existingSourceQueueIds.has(row.id));

if (selectedRows.length === 0) {
  throw new Error('No unused P0 Endocrine rows found in apGapClosureQueue.');
}

const endocrineContextFor = (row) => {
  const text = `${row.path || ''} ${row.title || ''}`.toLowerCase();

  if (text.includes('thyroid') || text.includes('medullary') || text.includes('c-cell') || text.includes('hormonal synthesis')) {
    return {
      organFocus: 'thyroid / medullary C-cell axis',
      taxonomyRisk: 'plausible endocrine row; faculty should confirm whether the AP-spec path is thyroid medullary/C-cell content or a misplaced developmental/systemic row',
      specimenContext: 'thyroidectomy, thyroid lobectomy, neck endocrine specimen, or developmental/endocrine correlation specimen with gross site and clinical syndrome context',
      normalComparator: 'normal thyroid follicles and expected C-cell distribution before abnormal medullary, developmental, or hormonal-synthesis pattern recognition',
      visualAnchor: 'low-power thyroid/C-cell anatomic orientation plus high-power abnormality cue, with a normal thyroid comparator and explicit note if no representative image is available',
      mimicPrompt: 'reactive C-cell change, medullary thyroid carcinoma spectrum, developmental anomaly, endocrine cytomegaly, inherited hormonal synthesis disorder, and taxonomy artifact',
      reportingConsequence: 'state whether the card teaches a diagnosable lesion, developmental finding, inherited endocrine syndrome, or taxonomy correction; add reporting or genetic/clinical correlation consequence only after faculty review',
    };
  }

  if (text.includes('transplant') || text.includes('ptld') || text.includes('viral') || text.includes('hiv')) {
    return {
      organFocus: 'endocrine-adjacent immunocompromised-host process',
      taxonomyRisk: 'high taxonomy risk; row appears under endocrine but may represent systemic infectious/hematolymphoid or transplant-associated content',
      specimenContext: 'endocrine-site biopsy/resection only if the lesion involves thyroid, adrenal, parathyroid, pancreas, or pituitary; otherwise document reassignment',
      normalComparator: 'site-specific normal endocrine tissue and background inflammatory/lymphoid distribution before calling infection, PTLD, or viral-associated disease',
      visualAnchor: 'endocrine-site tissue with infectious/lymphoid process, or a no-image taxonomy-correction rationale if the entity belongs outside endocrine',
      mimicPrompt: 'reactive lymphoid infiltrate, autoimmune thyroiditis, infection, lymphoma, PTLD, metastatic disease, and endocrine taxonomy artifact',
      reportingConsequence: 'capture immunocompromised-host safety language, EBV/viral or immunophenotypic workup trigger, and reassignment decision before learner release',
    };
  }

  return {
    organFocus: 'taxonomy-review endocrine remainder row',
    taxonomyRisk: 'high taxonomy risk; this row is currently mapped to endocrine but its title/path may indicate skin, hematology, fluid, immune, infectious, or systemic content',
    specimenContext: 'endocrine or endocrine-adjacent specimen only after faculty taxonomy QA confirms the row belongs here; otherwise document the correct AP domain and remove from endocrine learner view',
    normalComparator: 'faculty-selected normal endocrine comparator, or a taxonomy-correction note explaining why an endocrine comparator is inappropriate',
    visualAnchor: 'taxonomy QA image plan: attach endocrine normal-to-abnormal anchor only after confirmed placement, or document no-image/reassignment rationale',
    mimicPrompt: 'faculty must identify the closest endocrine mimic, systemic mimic, or correct-domain reassignment before content authoring',
    reportingConsequence: 'do not add learner-facing reporting language until taxonomy QA determines whether this is endocrine, endocrine-adjacent, or misclassified AP-spec content',
  };
};

const gateStatusesFor = (row, context) => [
  {
    id: 'taxonomy-qa',
    label: 'Taxonomy QA',
    status: 'ready-for-review',
    evidence: `Unused ap_endo P0 row at source line ${row.sourceLine}; ${context.taxonomyRisk}`,
  },
  {
    id: 'content-authoring',
    label: 'Entity card content',
    status: 'missing',
    evidence: 'Needs source-backed definition/scope, normal comparator or taxonomy correction, morphology, mimic discriminator, pitfall, and learner-safe consequence.',
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
    evidence: 'Remainder-batch retrieval prompts are scaffolded; faculty-reviewed answers and spaced-repeat reveal text are not yet attached.',
  },
  {
    id: 'faculty-review',
    label: 'Faculty review',
    status: 'missing',
    evidence: 'Endocrine faculty/taxonomy reviewer, source citation, image/license or reassignment status, editorial decision, and review date are not yet attached.',
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
    percentComplete: totalGates ? Math.round((completedGates / totalGates) * 100) : 0,
    percentReviewReady: totalGates ? Math.round(((completedGates + reviewReadyGates) / totalGates) * 100) : 0,
  };
};

const cards = selectedRows.map((row, index) => {
  const context = endocrineContextFor(row);
  const gateStatuses = gateStatusesFor(row, context);

  return {
    id: `p0-endo-batch-2-card-${String(index + 1).padStart(2, '0')}-${row.topicId}`,
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
    endocrineOrganFocus: context.organFocus,
    taxonomyRisk: context.taxonomyRisk,
    specimenContext: context.specimenContext,
    normalComparatorPrompt: context.normalComparator,
    visualAnchorPlan: context.visualAnchor,
    mimicDiscriminatorPrompt: context.mimicPrompt,
    reportingConsequencePrompt: context.reportingConsequence,
    entityCardSections: [
      'Endocrine remainder taxonomy QA and keep/reassign decision',
      'Definition and scope in one learner-safe sentence after source review',
      'Normal endocrine comparator or explicit correct-domain comparator if reassigned',
      'Low-power anatomic/site anchor or reason no endocrine image is appropriate',
      'High-power morphology or systemic-process cue after taxonomy confirmation',
      'Top endocrine mimic or correct-domain mimic and single best discriminator',
      'Ancillary, molecular, infectious, genetic, functional, or reporting consequence when relevant',
      'Pitfall that could create a clinically meaningful miss or taxonomy teaching error',
    ],
    retrievalPrompts: [
      `Before reveal: decide whether ${row.title} is endocrine, endocrine-adjacent, or misclassified for this AP-spec path.`,
      'State the normal comparator or explain why the correct comparator belongs outside endocrine.',
      'Name the closest mimic and the discriminator or reassignment evidence that separates them.',
      'State any ancillary, infectious, genetic, molecular, functional, or clinical correlation that would matter.',
      'Write the safe report/comment or taxonomy note that should appear before learner release.',
    ],
    spacingSchedule: ['same session', '1 day', '3 days', '7 days', '21 days'],
    facultyReviewChecklist: [
      'Taxonomy QA confirms endocrine placement or documents correct AP-domain reassignment.',
      'Definition, scope, comparator, morphology, mimic, discriminator, consequence, and pitfall are source-backed.',
      'Visual anchor is local/licensed or has an explicit no-image/reassignment rationale.',
      'Retrieval answer key is reviewed before learner reveal.',
      'One contrastive near-miss or taxonomy pitfall is included for durable discrimination.',
      'Editorial status prevents misclassified content from appearing as canonical endocrine material.',
    ],
    completionGate: 'Not complete until taxonomy QA, source-backed content, visual anchor or reassignment rationale, retrieval answer key, and faculty review metadata are all satisfied.',
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

batchReadiness.percentComplete = batchReadiness.totalGates
  ? Math.round((batchReadiness.completedGates / batchReadiness.totalGates) * 100)
  : 0;
batchReadiness.percentReviewReady = batchReadiness.totalGates
  ? Math.round(((batchReadiness.completedGates + batchReadiness.reviewReadyGates) / batchReadiness.totalGates) * 100)
  : 0;

const readinessLegend = {
  complete: 'Evidence is present and reviewed.',
  'ready-for-review': 'Structured scaffold exists and needs endocrine/taxonomy faculty confirmation.',
  missing: 'Required source-backed content, visual asset or reassignment rationale, answer key, or reviewer evidence is not yet attached.',
};

const output = {
  generatedAt: new Date().toISOString(),
  sourcePlan: 'reports/ap_gap_closure_plan.json',
  sourceQueue: 'src/content/competency/apGapClosureQueue.ts',
  facultyPacketPath: 'reports/ap_p0_endocrine_card_batch_2_faculty_packet.md',
  facultyPacketCsvPath: 'reports/ap_p0_endocrine_card_batch_2_faculty_packet.csv',
  batchName: 'P0 endocrine entity card batch 2',
  batchStrategy: 'All remaining unused P0 Endocrine rows from the AP gap closure queue after excluding sourceQueueIds already present in existing apP0*CardBatch.ts files; taxonomy-risk rows require keep/reassign QA before medical authoring.',
  sourceCategory: 'ap_endo',
  sourceP0Rows: endocrineRows.length,
  existingSourceQueueIdsExcluded: endocrineRows.length - selectedRows.length,
  selectedRows: cards.length,
  status: 'draft endocrine remainder scaffolds awaiting taxonomy QA, source-backed content, visual anchors or reassignment rationale, retrieval answer keys, and faculty review',
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
  'Confirm whether the AP-spec path truly belongs in endocrine; document keep/reassign decision before medical authoring.',
  'If kept in endocrine, fill definition, normal comparator, morphology, mimic/discriminator, consequence, and pitfall with source-backed content.',
  'If reassigned, name the correct AP domain and add a learner-safe taxonomy note instead of endocrine teaching content.',
  'Attach image/gross/diagram asset or no-image rationale, retrieval answer key, reviewer/date, source citation, and final editorial decision before marking gates complete.',
];

const packetRows = cards.map((card) => ({
  cardId: card.id,
  sourceQueueId: card.sourceQueueId,
  title: card.title,
  category: card.category,
  endocrineOrganFocus: card.endocrineOrganFocus,
  taxonomyRisk: card.taxonomyRisk,
  learnerLevel: card.learnerLevel,
  apSpecPath: card.apSpecPath,
  sourceLine: card.sourceLine,
  specimenContext: card.specimenContext,
  normalComparatorPrompt: card.normalComparatorPrompt,
  visualAnchorPlan: card.visualAnchorPlan,
  mimicDiscriminatorPrompt: card.mimicDiscriminatorPrompt,
  reportingConsequencePrompt: card.reportingConsequencePrompt,
  keepOrReassignDecision: '',
  correctApDomainIfReassigned: '',
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

const packetMd = `# P0 Endocrine Entity Card Batch 2 Faculty Authoring Packet

Generated: ${output.generatedAt}

Status: ${output.status}

Batch strategy: ${output.batchStrategy}

Source P0 endocrine rows: ${output.sourceP0Rows}

Existing endocrine/P0 sourceQueueIds excluded: ${output.existingSourceQueueIdsExcluded}

Selected cards: ${output.selectedRows}

## Faculty Completion Rule

Do not mark a card complete until all five gates are satisfied:

1. Taxonomy QA confirms endocrine placement or documents correct AP-domain reassignment.
2. Source-backed content is authored: definition/scope, comparator, morphology, mimic/discriminator, consequence, and pitfall.
3. Visual anchor is attached or a no-image/reassignment rationale is explicitly documented.
4. Retrieval prompts have a faculty-reviewed answer key.
5. Reviewer, review date, source citation, image/license or reassignment status, and editorial decision are documented.

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
- Taxonomy risk: ${card.taxonomyRisk}
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

- Keep / reassign decision:
- Correct AP domain if reassigned:
- Taxonomy QA:
- Definition and scope:
- Normal comparator:
- Key morphology anchor:
- Top mimic:
- Best discriminator:
- Ancillary, molecular, infectious, functional, or reporting consequence:
- Safety-critical pitfall:
- Visual asset path or no-image/reassignment rationale:
- Source citation:
- Retrieval answer key:
- Reviewer:
- Review date:
- Editorial decision: draft / reviewed / canonical / reassigned
`).join('\n')}
`;

const csvHeader = Object.keys(packetRows[0] || {});
const csvEscape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
const packetCsv = [
  csvHeader.join(','),
  ...packetRows.map((row) => csvHeader.map((key) => csvEscape(row[key])).join(',')),
].join('\n');

fs.writeFileSync(outPath, `// Generated by scripts/generate_ap_p0_endo_cards_2.cjs. Do not edit by hand.

export const apP0EndocrineCardBatch2 = ${JSON.stringify(output, null, 2)} as const;

export type ApP0EndocrineCard2 = typeof apP0EndocrineCardBatch2.cards[number];
`);
fs.writeFileSync(packetPath, packetMd);
fs.writeFileSync(packetCsvPath, packetCsv);

const validation = {
  sourceP0EndocrineRows: endocrineRows.length,
  existingSourceQueueIdsExcluded: output.existingSourceQueueIdsExcluded,
  selectedCards: cards.length,
  totalGates: batchReadiness.totalGates,
  reviewReadyGates: batchReadiness.reviewReadyGates,
  missingGates: batchReadiness.missingGates,
  duplicateCardIds: cards.length - new Set(cards.map((card) => card.id)).size,
  duplicateSourceQueueIds: cards.length - new Set(cards.map((card) => card.sourceQueueId)).size,
  cardsWithoutFiveGates: cards.filter((card) => card.gateStatuses.length !== 5).length,
  cardsMissingRequiredSchema: cards.filter((card) => !card.entityCardSections || !card.retrievalPrompts || !card.spacingSchedule || !card.facultyReviewChecklist || !card.gateStatuses || !card.readiness).length,
  overlapWithExistingBatches: cards.filter((card) => existingSourceQueueIds.has(card.sourceQueueId)).length,
  outputs: [
    'scripts/generate_ap_p0_endo_cards_2.cjs',
    'src/content/competency/apP0EndocrineCardBatch2.ts',
    'reports/ap_p0_endocrine_card_batch_2_faculty_packet.md',
    'reports/ap_p0_endocrine_card_batch_2_faculty_packet.csv',
  ],
};

console.log(JSON.stringify(validation, null, 2));
