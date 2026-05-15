const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const queuePath = path.join(repoRoot, 'src/content/competency/apGapClosureQueue.ts');
const batchDir = path.join(repoRoot, 'src/content/competency');
const outPath = path.join(batchDir, 'apP0CvTaxonomyReviewCardBatch.ts');
const reportsDir = path.join(repoRoot, 'reports');
const packetPath = path.join(reportsDir, 'ap_p0_cv_taxonomy_review_card_batch_faculty_packet.md');
const packetCsvPath = path.join(reportsDir, 'ap_p0_cv_taxonomy_review_card_batch_faculty_packet.csv');

const extractExportedObject = (source, exportName) => {
  const marker = `export const ${exportName} = `;
  const start = source.indexOf(marker);
  if (start === -1) throw new Error(`Could not find export ${exportName}`);
  const objectStart = source.indexOf('{', start + marker.length);
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = objectStart; index < source.length; index += 1) {
    const char = source[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') inString = true;
    else if (char === '{') depth += 1;
    else if (char === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(objectStart, index + 1);
    }
  }
  throw new Error(`Could not find object end for ${exportName}`);
};

const queue = JSON.parse(extractExportedObject(fs.readFileSync(queuePath, 'utf8'), 'apGapClosureQueue'));

const existingSourceQueueIds = new Set();
for (const entry of fs.readdirSync(batchDir, { withFileTypes: true })) {
  if (!entry.isFile()) continue;
  if (!/^apP0.*CardBatch\d*\.ts$/.test(entry.name)) continue;
  if (entry.name === path.basename(outPath)) continue;
  const source = fs.readFileSync(path.join(batchDir, entry.name), 'utf8');
  for (const match of source.matchAll(/"sourceQueueId":\s*"([^"]+)"/g)) {
    existingSourceQueueIds.add(match[1]);
  }
}

const selectedRows = (queue.p0Rows || [])
  .filter((row) => row.categoryId === 'ap_cv' && String(row.priority || '').startsWith('P0'))
  .filter((row) => !existingSourceQueueIds.has(row.id))
  .sort((a, b) => {
    const sourceLineDelta = (Number(a.sourceLine) || 0) - (Number(b.sourceLine) || 0);
    if (sourceLineDelta !== 0) return sourceLineDelta;
    return String(a.path).localeCompare(String(b.path));
  });

const contextFor = (row) => {
  const title = String(row.title || '').toLowerCase();
  if (title.includes('diabetes')) {
    return {
      taxonomyConcern: 'Systemic metabolic disease placed under cardiovascular normal structure/function; likely belongs in endocrine/systemic disease or autopsy clinicopathologic correlation.',
      specimenContext: 'autopsy case or explant/resection correlation where diabetes contributes to cardiovascular, renal, vascular, infectious, or wound-healing morbidity',
      visualAnchor: 'vascular, myocardial, renal, or systemic diabetic complication anchor plus explicit no-single-pathognomonic-lesion caution',
      reportingConsequence: 'document diabetes as a comorbidity/contributor without overstating cause-of-death certainty; connect to macrovascular/microvascular complications when present',
      mimicFrame: 'background diabetes history without morphologic complication, hypertensive vascular disease, atherosclerosis, or nonspecific terminal changes',
    };
  }
  if (title.includes('steatosis') || title.includes('metabolic')) {
    return {
      taxonomyConcern: 'Hepatobiliary/metabolic topic nested in cardiovascular AP path; likely needs reassignment or autopsy comorbidity framing.',
      specimenContext: 'autopsy liver and cardiovascular risk context, or systemic metabolic syndrome correlation with liver, heart, and vascular findings',
      visualAnchor: 'gross liver steatosis/steatohepatitis or metabolic syndrome comorbidity diagram with cardiovascular risk linkage',
      reportingConsequence: 'separate primary hepatobiliary diagnosis from cardiovascular risk contribution and death-certificate language',
      mimicFrame: 'alcohol-related liver disease, congestion, postmortem change, obesity-related comorbidity, or nonspecific macrovesicular steatosis',
    };
  }
  return {
    taxonomyConcern: 'Inherited marrow/pancreatic syndrome nested in cardiovascular AP path; likely taxonomy spillover requiring faculty reassignment.',
    specimenContext: 'autopsy or pediatric/systemic disease case where inherited syndrome findings require clinicopathologic correlation',
    visualAnchor: 'syndrome-level diagram or organ-system correlation table unless a local/licensed histologic anchor is available',
    reportingConsequence: 'document syndrome-associated findings and decide whether this belongs in pediatric, hematopathology, GI/pancreas, or autopsy teaching',
    mimicFrame: 'nonspecific marrow failure, pancreatic insufficiency, congenital syndrome differential, or parser artifact',
  };
};

const readinessFor = (gateStatuses) => ({
  completedGates: gateStatuses.filter((gate) => gate.status === 'complete').length,
  reviewReadyGates: gateStatuses.filter((gate) => gate.status === 'ready-for-review').length,
  missingGates: gateStatuses.filter((gate) => gate.status === 'missing').length,
  totalGates: gateStatuses.length,
  percentComplete: Math.round((gateStatuses.filter((gate) => gate.status === 'complete').length / gateStatuses.length) * 100),
  percentReviewReady: Math.round((gateStatuses.filter((gate) => gate.status !== 'missing').length / gateStatuses.length) * 100),
});

const cards = selectedRows.map((row, index) => {
  const context = contextFor(row);
  const gateStatuses = [
    {
      id: 'taxonomy-qa',
      label: 'Taxonomy QA',
      status: 'ready-for-review',
      evidence: `Final unassigned AP P0 row; faculty must decide keep-in-CV/autopsy versus reassignment. Concern: ${context.taxonomyConcern}`,
    },
    {
      id: 'content-authoring',
      label: 'Entity card content',
      status: 'missing',
      evidence: 'Content must be authored only after taxonomy keep/reassign decision; include definition, normal/systemic comparator, consequence, mimic, and pitfall.',
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
      evidence: 'Retrieval prompt exists; faculty-reviewed keep/reassign rationale and answer key are not yet attached.',
    },
    {
      id: 'faculty-review',
      label: 'Faculty review',
      status: 'missing',
      evidence: 'Faculty taxonomy decision, source citation, image/license status, reviewer, and last-reviewed date are not yet attached.',
    },
  ];

  return {
    id: `p0-cv-taxonomy-review-card-${String(index + 1).padStart(2, '0')}-${row.topicId}`,
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
    taxonomyConcern: context.taxonomyConcern,
    specimenContext: context.specimenContext,
    visualAnchorPlan: context.visualAnchor,
    reportingConsequencePrompt: context.reportingConsequence,
    mimicFrame: context.mimicFrame,
    entityCardSections: [
      'Taxonomy keep/reassign decision with rationale',
      'Definition and scope only after taxonomy decision',
      'Normal/systemic comparator or explicit no-morphology rationale',
      'Gross, microscopic, or clinicopathologic anchor',
      'Top mimic, parser artifact, or adjacent-domain reassignment target',
      'Autopsy/reporting/comorbidity consequence',
      'Safety-critical pitfall: over-attributing causality or teaching in the wrong domain',
    ],
    retrievalPrompts: [
      `Before reveal: decide whether ${row.title} should remain in CV/autopsy or be reassigned.`,
      'State the taxonomy rationale in one sentence.',
      'Name the closest adjacent domain and why it may be a better home.',
      'Write a safe autopsy or report comment phrase if this is retained as a comorbidity/correlation topic.',
    ],
    spacingSchedule: ['same session', '1 day', '3 days', '7 days', '21 days'],
    facultyReviewChecklist: [
      'Taxonomy QA explicitly chooses keep, reassign, or retire as parser artifact.',
      'Source citation and review date are attached.',
      'Visual anchor or no-image rationale matches the taxonomy decision.',
      'Retrieval answer key explains the keep/reassign rationale.',
      'One pitfall about causal overstatement or domain drift is included.',
    ],
    completionGate: 'Not complete until taxonomy decision, source-backed content, visual/no-image rationale, answer key, and faculty review metadata are all present.',
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

const output = {
  generatedAt: new Date().toISOString(),
  sourcePlan: 'reports/ap_gap_closure_plan.json',
  sourceQueue: 'src/content/competency/apGapClosureQueue.ts',
  facultyPacketPath: 'reports/ap_p0_cv_taxonomy_review_card_batch_faculty_packet.md',
  facultyPacketCsvPath: 'reports/ap_p0_cv_taxonomy_review_card_batch_faculty_packet.csv',
  batchName: 'P0 cardiovascular/autopsy taxonomy review completion batch',
  batchStrategy: 'Final unassigned P0 cardiovascular/autopsy-adjacent rows captured as taxonomy-review scaffolds so all P0 rows are tracked while faculty decides keep, reassign, or retire.',
  status: 'draft taxonomy-review scaffolds awaiting faculty keep/reassign decision before canonical promotion',
  categoryCoverage: {
    categoryId: 'ap_cv',
    category: 'Cardiovascular / Autopsy-adjacent',
    selectedCards: cards.length,
  },
  batchReadiness,
  readinessLegend: {
    complete: 'Evidence is present and reviewed.',
    'ready-for-review': 'Structured taxonomy scaffold exists and needs faculty decision.',
    missing: 'Required taxonomy decision, content, asset, source, answer key, or reviewer evidence is not yet attached.',
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
    const prefix = gateColumnPrefix[gate.id];
    return [
      [`${prefix}Status`, gate.status],
      [`${prefix}Evidence`, gate.evidence],
    ];
  }),
);

const packetRows = cards.map((card) => ({
  cardId: card.id,
  sourceQueueId: card.sourceQueueId,
  title: card.title,
  apSpecPath: card.apSpecPath,
  taxonomyConcern: card.taxonomyConcern,
  keepReassignRetireDecision: '',
  reassignedDomain: '',
  decisionRationale: '',
  specimenContext: card.specimenContext,
  visualAnchorPlan: card.visualAnchorPlan,
  reportingConsequencePrompt: card.reportingConsequencePrompt,
  sourceCitation: '',
  retrievalAnswerKey: '',
  reviewer: '',
  reviewDate: '',
  decision: 'draft',
  ...gateColumnsFor(card),
}));

const gateChecklistFor = (card) => card.gateStatuses
  .map((gate) => `- [ ] ${gate.label}: ${gate.status} - ${gate.evidence}`)
  .join('\n');

const packetMd = `# P0 Cardiovascular / Autopsy Taxonomy Review Completion Batch

Generated: ${output.generatedAt}

Status: ${output.status}

Batch strategy: ${output.batchStrategy}

## Faculty Completion Rule

Do not mark a card complete until faculty explicitly chooses keep, reassign, or retire as parser artifact and documents source-backed rationale.

## Batch Readiness

- Cards: ${cards.length}
- Complete gates: ${batchReadiness.completedGates}
- Review-ready gates: ${batchReadiness.reviewReadyGates}
- Missing gates: ${batchReadiness.missingGates}
- Percent review-ready: ${batchReadiness.percentReviewReady}%

${cards.map((card, index) => `## ${index + 1}. ${card.title}

- Card ID: \`${card.id}\`
- Source queue ID: \`${card.sourceQueueId}\`
- AP spec path: ${card.apSpecPath}
- Taxonomy concern: ${card.taxonomyConcern}
- Specimen context: ${card.specimenContext}
- Visual anchor plan: ${card.visualAnchorPlan}
- Reporting consequence prompt: ${card.reportingConsequencePrompt}

### Gate Checklist

${gateChecklistFor(card)}

### Authoring Fields

- Keep / reassign / retire decision:
- Reassigned domain:
- Decision rationale:
- Definition and scope if retained:
- Autopsy/reporting consequence if retained:
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
fs.writeFileSync(outPath, `// Generated by scripts/generate_ap_p0_cv_taxonomy_review_cards.cjs. Do not edit by hand.

export const apP0CvTaxonomyReviewCardBatch = ${JSON.stringify(output, null, 2)} as const;

export type ApP0CvTaxonomyReviewCard = typeof apP0CvTaxonomyReviewCardBatch.cards[number];
`);

console.log(JSON.stringify({
  cards: cards.length,
  gateStatuses: batchReadiness.totalGates,
  readyForReviewGates: batchReadiness.reviewReadyGates,
  missingGates: batchReadiness.missingGates,
  duplicateCardIds: cards.length - new Set(cards.map((card) => card.id)).size,
  duplicateSourceQueueIds: cards.length - new Set(cards.map((card) => card.sourceQueueId)).size,
  outputs: [
    'src/content/competency/apP0CvTaxonomyReviewCardBatch.ts',
    'reports/ap_p0_cv_taxonomy_review_card_batch_faculty_packet.md',
    'reports/ap_p0_cv_taxonomy_review_card_batch_faculty_packet.csv',
  ],
}, null, 2));
