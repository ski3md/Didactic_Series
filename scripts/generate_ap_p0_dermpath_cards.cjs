const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const queuePath = path.join(repoRoot, 'src/content/competency/apGapClosureQueue.ts');
const outPath = path.join(repoRoot, 'src/content/competency/apP0DermpathCardBatch.ts');
const reportsDir = path.join(repoRoot, 'reports');
const packetPath = path.join(reportsDir, 'ap_p0_dermpath_card_batch_faculty_packet.md');
const packetCsvPath = path.join(reportsDir, 'ap_p0_dermpath_card_batch_faculty_packet.csv');

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
const selectedRows = (queue.p0Rows || [])
  .filter((row) => row.categoryId === 'ap_dermpath' && String(row.priority || '').startsWith('P0'))
  .sort((a, b) => {
    if ((a.sourceLine || 0) !== (b.sourceLine || 0)) return (a.sourceLine || 0) - (b.sourceLine || 0);
    return String(a.path).localeCompare(String(b.path));
  })
  .slice(0, 24);

if (selectedRows.length === 0) {
  throw new Error('No P0 Dermatopathology rows found in apGapClosureQueue.');
}

const dermpathContext = {
  specimenContext: 'skin biopsy or excision, with clinical morphology, anatomic site, distribution, duration, and treatment context captured before slide review',
  visualAnchor: 'low-power inflammatory pattern or tumor silhouette, high-power diagnostic feature, and normal/reactive skin comparator when available',
  reportingConsequence: 'pattern classification, organism or lineage confirmation when relevant, mimic exclusion, and report language that directs clinicopathologic correlation',
};

const gateStatusesFor = (row) => [
  {
    id: 'taxonomy-qa',
    label: 'Taxonomy QA',
    status: 'ready-for-review',
    evidence: `Generated from Dermatopathology AP specification path at source line ${row.sourceLine}; faculty must confirm whether this is an entity, pattern, infection, tumor family, or parser artifact.`,
  },
  {
    id: 'content-authoring',
    label: 'Entity card content',
    status: 'missing',
    evidence: 'Needs source-backed definition, reaction-pattern placement, morphology, mimic discriminator, clinical correlation, and safety pitfall.',
  },
  {
    id: 'visual-anchor',
    label: 'Visual anchor',
    status: 'missing',
    evidence: dermpathContext.visualAnchor,
  },
  {
    id: 'retrieval-key',
    label: 'Retrieval answer key',
    status: 'missing',
    evidence: 'Dermpath prompt set exists; faculty-reviewed answer key is not yet attached.',
  },
  {
    id: 'faculty-review',
    label: 'Faculty review',
    status: 'missing',
    evidence: 'Dermatopathology reviewer, source citation, image/license status, and last-reviewed date are not yet attached.',
  },
];

const readinessFor = (gateStatuses) => ({
  completedGates: gateStatuses.filter((gate) => gate.status === 'complete').length,
  reviewReadyGates: gateStatuses.filter((gate) => gate.status === 'ready-for-review').length,
  missingGates: gateStatuses.filter((gate) => gate.status === 'missing').length,
  totalGates: gateStatuses.length,
  percentComplete: Math.round((gateStatuses.filter((gate) => gate.status === 'complete').length / gateStatuses.length) * 100),
  percentReviewReady: Math.round((gateStatuses.filter((gate) => gate.status !== 'missing').length / gateStatuses.length) * 100),
});

const cards = selectedRows.map((row, index) => {
  const gateStatuses = gateStatusesFor(row);

  return {
    id: `p0-dermpath-card-${String(index + 1).padStart(2, '0')}-${row.topicId}`,
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
    specimenContext: dermpathContext.specimenContext,
    visualAnchorPlan: dermpathContext.visualAnchor,
    reportingConsequencePrompt: dermpathContext.reportingConsequence,
    entityCardSections: [
      'Definition and scope in one learner-safe sentence',
      'Clinical context and lesion distribution required before microscopy',
      'Low-power reaction pattern or tumor silhouette',
      'High-power diagnostic feature and one negative feature that prevents overcall',
      'Best mimic and discriminator',
      'Special stain, immunostain, molecular, or culture correlation when relevant',
      'Report phrase, clinicopathologic correlation sentence, or urgent communication trigger',
      'Pitfall that could cause a safety-critical dermatopathology miss',
    ],
    patternFirstSections: [
      'Clinical context and lesion distribution required before microscopy',
      'Low-power reaction pattern or tumor silhouette',
      'High-power diagnostic feature and one negative feature that prevents overcall',
      'Best mimic and discriminator',
      'Special stain, immunostain, molecular, or culture correlation when relevant',
      'Report phrase, clinicopathologic correlation sentence, or urgent communication trigger',
    ],
    retrievalPrompts: [
      `Before reveal: classify ${row.title} by dermpath pattern, entity, infection, or tumor family.`,
      'Name the one microscopy feature that should be present before making the call.',
      'Name the closest mimic and the discriminator that separates them.',
      'State the special stain, immunostain, ancillary test, or clinical correlation that would be appropriate if any.',
      'Write the short report/comment phrase that would be safe for a junior resident.',
    ],
    spacingSchedule: ['same session', '1 day', '3 days', '7 days', '21 days'],
    facultyReviewChecklist: [
      'Taxonomy QA confirms this queue row is a valid dermpath teaching target or documents a correction.',
      'Definition, morphology, mimic, discriminator, consequence, and pitfall are source-backed.',
      'Visual anchor is local/licensed or has an explicit no-image rationale.',
      'Answer key is faculty-reviewed before learner reveal.',
      'One contrastive near-miss is included for durable discrimination.',
    ],
    completionGate: 'Not complete until taxonomy QA, entity content, visual anchor, retrieval answer key, and dermatopathology faculty review are all satisfied.',
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
  'ready-for-review': 'Structured scaffold exists and needs dermatopathology faculty confirmation.',
  missing: 'Required content, asset, source, answer key, or reviewer evidence is not yet attached.',
};

const output = {
  generatedAt: new Date().toISOString(),
  sourcePlan: 'reports/ap_gap_closure_plan.json',
  sourceQueue: 'src/content/competency/apGapClosureQueue.ts',
  facultyPacketPath: 'reports/ap_p0_dermpath_card_batch_faculty_packet.md',
  facultyPacketCsvPath: 'reports/ap_p0_dermpath_card_batch_faculty_packet.csv',
  batchName: 'P0 dermatopathology entity card batch',
  batchStrategy: 'All available P0 Dermatopathology rows, capped at 24, converted into pattern-first draft scaffolds with five readiness gates.',
  status: 'draft scaffolds awaiting dermatopathology faculty content, visual assets, answer keys, and review metadata',
  categoryCoverage: {
    categoryId: 'ap_dermpath',
    category: 'Dermatopathology',
    queueP0Rows: queue.categorySummary?.ap_dermpath?.p0 ?? selectedRows.length,
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
  specimenContext: card.specimenContext,
  visualAnchorPlan: card.visualAnchorPlan,
  reportingConsequencePrompt: card.reportingConsequencePrompt,
  taxonomyQa: '',
  dermpathPatternOrEntityType: '',
  definition: '',
  clinicalContext: '',
  lowPowerPattern: '',
  highPowerFeature: '',
  topMimic: '',
  discriminator: '',
  ancillaryOrClinicalCorrelation: '',
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

const packetMd = `# P0 Dermatopathology Entity Card Batch Faculty Authoring Packet

Generated: ${output.generatedAt}

Status: ${output.status}

Batch strategy: ${output.batchStrategy}

## Faculty Completion Rule

Do not mark a dermpath card complete until all five gates are satisfied:

1. Taxonomy QA confirms this is a valid dermpath entity, pattern, infection, tumor family, or intentional teaching target.
2. Source-backed content is authored: definition, clinical context, low-power pattern, high-power feature, mimic/discriminator, consequence, and pitfall.
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
- Learner level: ${card.learnerLevel}
- Difficulty: ${card.difficulty}
- AP spec path: ${card.apSpecPath}
- Specimen context: ${card.specimenContext}
- Visual anchor plan: ${card.visualAnchorPlan}
- Reporting consequence prompt: ${card.reportingConsequencePrompt}

### Reviewer Workflow

1. Confirm the AP-spec path is a valid dermpath teaching target and note any taxonomy correction.
2. Author the content fields with source-backed, learner-safe language.
3. Attach the low-power/high-power image pair, gross/clinical photo when appropriate, diagram, or no-image rationale and document source/license evidence.
4. Add the retrieval answer key, reviewer/date, and final editorial decision before marking gates complete.

### Gate Checklist

${gateChecklistFor(card)}

### Authoring Fields

- Taxonomy QA:
- Dermpath pattern/entity type:
- Definition and scope:
- Clinical context:
- Low-power pattern:
- High-power diagnostic feature:
- Top mimic:
- Best discriminator:
- Ancillary or clinical correlation:
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

fs.writeFileSync(packetPath, packetMd);
fs.writeFileSync(packetCsvPath, packetCsv);

const ts = `// Generated by scripts/generate_ap_p0_dermpath_cards.cjs. Do not edit by hand.

export const apP0DermpathCardBatch = ${JSON.stringify(output, null, 2)} as const;

export type ApP0DermpathCard = typeof apP0DermpathCardBatch.cards[number];
`;

fs.writeFileSync(outPath, ts);

console.log(JSON.stringify({
  cards: cards.length,
  gates: output.batchReadiness,
  outputs: [
    'src/content/competency/apP0DermpathCardBatch.ts',
    'reports/ap_p0_dermpath_card_batch_faculty_packet.md',
    'reports/ap_p0_dermpath_card_batch_faculty_packet.csv',
  ],
}, null, 2));
