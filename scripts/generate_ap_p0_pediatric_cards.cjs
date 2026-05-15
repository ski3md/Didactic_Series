#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const queuePath = path.join(repoRoot, 'src/content/competency/apGapClosureQueue.ts');
const batchDir = path.join(repoRoot, 'src/content/competency');
const outPath = path.join(batchDir, 'apP0PediatricCardBatch.ts');
const reportsDir = path.join(repoRoot, 'reports');
const packetPath = path.join(reportsDir, 'ap_p0_pediatric_card_batch_faculty_packet.md');
const packetCsvPath = path.join(reportsDir, 'ap_p0_pediatric_card_batch_faculty_packet.csv');

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
for (const entry of fs.readdirSync(batchDir, { withFileTypes: true })) {
  if (!entry.isFile()) continue;
  if (!/^apP0.*CardBatch\d*\.ts$/.test(entry.name)) continue;
  if (entry.name === path.basename(outPath)) continue;

  const source = fs.readFileSync(path.join(batchDir, entry.name), 'utf8');
  for (const match of source.matchAll(/"sourceQueueId":\s*"([^"]+)"/g)) {
    existingSourceQueueIds.add(match[1]);
  }
}

const pediatricRows = (queue.p0Rows || [])
  .filter((row) => row.categoryId === 'ap_pediatric' && String(row.priority || '').startsWith('P0'))
  .filter((row) => !existingSourceQueueIds.has(row.id))
  .sort((a, b) => {
    const lineDelta = (Number(a.sourceLine) || 0) - (Number(b.sourceLine) || 0);
    if (lineDelta !== 0) return lineDelta;
    return String(a.path).localeCompare(String(b.path));
  });

const selectedRows = pediatricRows.slice(0, 24);

if (selectedRows.length === 0) {
  throw new Error('No unused P0 Pediatric / Perinatal rows found in apGapClosureQueue.');
}

const pediatricContextFor = (row) => {
  const text = `${row.path || ''} ${row.title || ''}`.toLowerCase();

  if (text.includes('placental') || text.includes('amniotic') || text.includes('membrane') || text.includes('basal plate') || text.includes('hydatidiform') || text.includes('mole')) {
    return {
      domain: 'Placental and maternal-fetal pathology',
      specimenContext: 'placenta, membranes, cord, products of conception, or related maternal-fetal specimen with gestational age and clinical indication available',
      normalComparator: 'gestational-age appropriate placenta, membranes, cord, and villous maturation before abnormal pattern recognition',
      visualAnchor: 'gross placental orientation or membrane/cord photograph plus low-power villous, basal plate, or membrane histology with gestational-age comparator',
      reportingConsequence: 'gestational-age correlation, maternal/fetal risk implication, recurrence or genetic follow-up language, and clinically safe placental diagnosis phrasing',
      mimicFrame: 'normal maturational change, sampling artifact, post-delivery change, molar mimic, maternal vascular malperfusion, fetal vascular malperfusion, or infection',
    };
  }

  if (text.includes('fetal') || text.includes('neonatal') || text.includes('prematurity') || text.includes('post-term') || text.includes('growth') || text.includes('hydrops')) {
    return {
      domain: 'Fetal and neonatal pathophysiology',
      specimenContext: 'fetal/neonatal autopsy, placental correlation, or perinatal specimen with gestational age, growth parameters, and clinical course',
      normalComparator: 'expected fetal/neonatal organ maturation and gestational-age appropriate growth before assigning abnormality',
      visualAnchor: 'gross fetal/neonatal organ or placental correlate plus histologic maturation, injury, or hydrops-associated anchor',
      reportingConsequence: 'cause or contributor to fetal/neonatal morbidity, need for genetic/metabolic/infectious correlation, and limitations of causality language',
      mimicFrame: 'autolysis, maceration, prematurity-related baseline, normal organ immaturity, infection, genetic syndrome, or iatrogenic change',
    };
  }

  if (text.includes('trisomy') || text.includes('genetic') || text.includes('chromosomal') || text.includes('syndrome')) {
    return {
      domain: 'Pediatric genetics and syndromes',
      specimenContext: 'pediatric or perinatal autopsy/specimen with dysmorphology, organ findings, placental correlation, family history, and genetic testing context',
      normalComparator: 'age-appropriate normal organ development and expected anatomic relationships before syndrome-pattern recognition',
      visualAnchor: 'gross anomaly pattern, organ-system diagram, or histologic developmental abnormality linked to a genetic/syndromic comparator',
      reportingConsequence: 'genetic testing recommendation, recurrence-risk framing, clinicopathologic correlation, and careful diagnostic certainty language',
      mimicFrame: 'isolated anomaly, disruptive sequence, prematurity-associated finding, autolysis, or overlapping chromosomal/syndromic phenotype',
    };
  }

  if (text.includes('retinopathy') || text.includes('iatrogenic') || text.includes('nutritional')) {
    return {
      domain: 'Pediatric complications and developmental injury',
      specimenContext: 'pediatric/neonatal specimen or autopsy correlation with treatment exposure, nutrition, oxygenation, and clinical timeline',
      normalComparator: 'age-appropriate tissue development and expected treatment-related baseline before abnormality assignment',
      visualAnchor: 'developmental anatomy or complication-focused gross/micro anchor plus timeline cue',
      reportingConsequence: 'clinically relevant complication language, avoidable harm or iatrogenic context when applicable, and differential with prematurity-related baseline',
      mimicFrame: 'normal immaturity, treatment effect, infection, ischemia, nutritional deficiency, or unrelated congenital abnormality',
    };
  }

  return {
    domain: 'Pediatric / perinatal pathology',
    specimenContext: 'pediatric, fetal, neonatal, placental, or perinatal specimen with age or gestational-age context and clinicopathologic correlation',
    normalComparator: 'age-appropriate or gestational-age appropriate normal comparator before abnormal pattern recognition',
    visualAnchor: 'gross, radiographic, diagrammatic, or H&E anchor that ties age/gestational age to the entity or process',
    reportingConsequence: 'diagnostic certainty, recurrence-risk or follow-up implication, and clinically safe pediatric/perinatal report language',
    mimicFrame: 'normal developmental baseline, autolysis, sampling artifact, infection, genetic syndrome, or placental/perinatal mimic',
  };
};

const gateStatusesFor = (row, context) => [
  {
    id: 'taxonomy-qa',
    label: 'Taxonomy QA',
    status: 'ready-for-review',
    evidence: `Generated from Pediatric / Perinatal AP specification path at source line ${row.sourceLine}; faculty must confirm entity/process status and whether this belongs in pediatric, placental, perinatal, or genetics teaching.`,
  },
  {
    id: 'content-authoring',
    label: 'Entity card content',
    status: 'missing',
    evidence: 'Needs source-backed definition, age/gestational-age comparator, morphology, mimic discriminator, clinical consequence, and safety pitfall.',
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
    evidence: 'Retrieval prompts are scaffolded; faculty-reviewed diagnosis/process, discriminator, and reporting answer key is not yet attached.',
  },
  {
    id: 'faculty-review',
    label: 'Faculty review',
    status: 'missing',
    evidence: 'Pediatric/perinatal faculty reviewer, source citation, image/license status, editorial decision, and last-reviewed date are not yet attached.',
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
  const context = pediatricContextFor(row);
  const gateStatuses = gateStatusesFor(row, context);

  return {
    id: `p0-pediatric-card-${String(index + 1).padStart(2, '0')}-${row.topicId}`,
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
      'Taxonomy QA and pediatric, placental, perinatal, or genetics domain assignment',
      'Definition and scope in one learner-safe sentence',
      'Age or gestational-age appropriate normal comparator before abnormal pattern',
      'Gross, developmental, or low-power architecture anchor',
      'High-power, ancillary, genetic, or clinicopathologic confirmatory cue',
      'Top mimic and single best discriminator',
      'Report, autopsy summary, recurrence-risk, or follow-up consequence',
      'Pitfall that could create a clinically meaningful pediatric/perinatal miss',
    ],
    retrievalPrompts: [
      `Before reveal: identify the pediatric/perinatal entity or process represented by ${row.title}.`,
      'State the age or gestational-age comparator that must be checked before calling it abnormal.',
      'Name the closest mimic and the discriminator that separates them.',
      'State the gross, microscopic, ancillary, or genetic finding that should anchor the diagnosis.',
      'Write the report, autopsy-summary, recurrence-risk, or follow-up phrase that would matter clinically.',
    ],
    spacingSchedule: ['same session', '1 day', '3 days', '7 days', '21 days'],
    facultyReviewChecklist: [
      'Taxonomy QA confirms this is a true pediatric/perinatal teaching target or documents reassignment.',
      'Definition, comparator, morphology, mimic, consequence, and pitfall are source-backed.',
      'Age or gestational-age dependency is explicit and clinically safe.',
      'Visual anchor is local/licensed or has an explicit no-image rationale.',
      'Retrieval answer key is faculty-reviewed before learner reveal.',
      'One contrastive near-miss is included for durable discrimination.',
      'Autopsy, recurrence-risk, genetic, or placental correlation language avoids overstating causality.',
    ],
    completionGate: 'Not complete until taxonomy QA, pediatric/perinatal content, visual anchor, retrieval answer key, and faculty QA metadata are all satisfied.',
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
  'ready-for-review': 'Structured scaffold exists and needs pediatric/perinatal faculty confirmation.',
  missing: 'Required content, visual asset, source, answer key, or reviewer evidence is not yet attached.',
};

const output = {
  generatedAt: new Date().toISOString(),
  sourcePlan: 'reports/ap_gap_closure_plan.json',
  sourceQueue: 'src/content/competency/apGapClosureQueue.ts',
  facultyPacketPath: 'reports/ap_p0_pediatric_card_batch_faculty_packet.md',
  facultyPacketCsvPath: 'reports/ap_p0_pediatric_card_batch_faculty_packet.csv',
  batchName: 'P0 pediatric/perinatal entity card batch',
  batchStrategy: 'First up to 24 unused P0 Pediatric / Perinatal rows from the AP gap closure queue, preserving source order and requiring age/gestational-age aware taxonomy QA before medical authoring.',
  sourceCategory: 'ap_pediatric',
  sourceP0Rows: (queue.p0Rows || []).filter((row) => row.categoryId === 'ap_pediatric' && String(row.priority || '').startsWith('P0')).length,
  excludedExistingSourceQueueIds: existingSourceQueueIds.size,
  selectedRows: cards.length,
  status: 'draft pediatric/perinatal scaffolds awaiting taxonomy QA, source-backed content, visual anchors, retrieval answer keys, and faculty review',
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
  'Confirm the AP-spec path belongs in pediatric/perinatal pathology; document taxonomy correction if it belongs in placenta, genetics, forensic, or another AP domain.',
  'Fill definition, age/gestational-age comparator, morphology, mimic/discriminator, consequence, and pitfall with source-backed content.',
  'Attach the image, gross photo, diagram, or no-image rationale and document source/license evidence.',
  'Add retrieval answer key, reviewer/date, source citation, and final editorial decision before marking gates complete.',
];

const packetRows = cards.map((card) => ({
  cardId: card.id,
  sourceQueueId: card.sourceQueueId,
  title: card.title,
  category: card.category,
  domain: card.domain,
  learnerLevel: card.learnerLevel,
  difficulty: card.difficulty,
  sourceLine: card.sourceLine,
  apSpecPath: card.apSpecPath,
  specimenContext: card.specimenContext,
  normalComparatorPrompt: card.normalComparatorPrompt,
  visualAnchorPlan: card.visualAnchorPlan,
  mimicFrame: card.mimicFrame,
  reportingConsequencePrompt: card.reportingConsequencePrompt,
  completionGate: card.completionGate,
  ...gateColumnsFor(card),
}));

const md = [
  '# P0 Pediatric / Perinatal Entity Card Batch Faculty Packet',
  '',
  `Generated: ${output.generatedAt}`,
  `Batch source: ${output.sourceQueue}`,
  `Source plan: ${output.sourcePlan}`,
  `Cards: ${cards.length}`,
  `Readiness: ${batchReadiness.completedGates} complete, ${batchReadiness.reviewReadyGates} ready-for-review, ${batchReadiness.missingGates} missing of ${batchReadiness.totalGates} gates`,
  '',
  '## Reviewer Workflow',
  '',
  ...reviewerWorkflow.map((item, index) => `${index + 1}. ${item}`),
  '',
  '## Batch Gate Legend',
  '',
  `- complete: ${readinessLegend.complete}`,
  `- ready-for-review: ${readinessLegend['ready-for-review']}`,
  `- missing: ${readinessLegend.missing}`,
  '',
  ...cards.flatMap((card, index) => [
    `## ${index + 1}. ${card.title}`,
    '',
    `- Card ID: ${card.id}`,
    `- Source queue ID: ${card.sourceQueueId}`,
    `- AP spec path: ${card.apSpecPath}`,
    `- Domain: ${card.domain}`,
    `- Learner level: ${card.learnerLevel}`,
    `- Difficulty: ${card.difficulty}`,
    `- Specimen context: ${card.specimenContext}`,
    `- Normal comparator prompt: ${card.normalComparatorPrompt}`,
    `- Visual anchor plan: ${card.visualAnchorPlan}`,
    `- Mimic frame: ${card.mimicFrame}`,
    `- Reporting consequence prompt: ${card.reportingConsequencePrompt}`,
    '',
    '### Entity Card Sections',
    '',
    ...card.entityCardSections.map((section) => `- ${section}`),
    '',
    '### Retrieval Prompts',
    '',
    ...card.retrievalPrompts.map((prompt) => `- ${prompt}`),
    '',
    '### Faculty Review Checklist',
    '',
    ...card.facultyReviewChecklist.map((item) => `- [ ] ${item}`),
    '',
    '### Completion Gates',
    '',
    gateChecklistFor(card),
    '',
  ]),
].join('\n');

const csvEscape = (value) => {
  const text = Array.isArray(value) ? value.join('; ') : String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
};

const csvHeaders = Object.keys(packetRows[0] || {});
const csv = [
  csvHeaders.join(','),
  ...packetRows.map((row) => csvHeaders.map((header) => csvEscape(row[header])).join(',')),
].join('\n');

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.mkdirSync(reportsDir, { recursive: true });
fs.writeFileSync(outPath, `export const apP0PediatricCardBatch = ${JSON.stringify(output, null, 2)} as const;\n`);
fs.writeFileSync(packetPath, `${md}\n`);
fs.writeFileSync(packetCsvPath, `${csv}\n`);

const duplicateCardIds = cards.length - new Set(cards.map((card) => card.id)).size;
const duplicateSourceQueueIds = cards.length - new Set(cards.map((card) => card.sourceQueueId)).size;
const cardsWithoutFiveGates = cards.filter((card) => card.gateStatuses.length !== 5).length;

console.log('P0 pediatric/perinatal entity card batch generated.');
console.log(`Source P0 Pediatric / Perinatal rows found: ${output.sourceP0Rows}`);
console.log(`Selected cards: ${cards.length}`);
console.log(`Gate statuses: ${batchReadiness.totalGates}`);
console.log(`Gate readiness: ${batchReadiness.reviewReadyGates} ready-for-review, ${batchReadiness.missingGates} missing`);
console.log(`Duplicate card IDs: ${duplicateCardIds}`);
console.log(`Duplicate source queue IDs: ${duplicateSourceQueueIds}`);
console.log(`Cards without five gates: ${cardsWithoutFiveGates}`);
console.log(`Wrote ${path.relative(repoRoot, outPath)}`);
console.log(`Wrote ${path.relative(repoRoot, packetPath)}`);
console.log(`Wrote ${path.relative(repoRoot, packetCsvPath)}`);
