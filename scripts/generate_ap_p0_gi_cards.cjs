const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const queuePath = path.join(repoRoot, 'src/content/competency/apGapClosureQueue.ts');
const batchDir = path.join(repoRoot, 'src/content/competency');
const outPath = path.join(batchDir, 'apP0GiCardBatch.ts');
const reportsDir = path.join(repoRoot, 'reports');
const packetPath = path.join(reportsDir, 'ap_p0_gi_card_batch_faculty_packet.md');
const packetCsvPath = path.join(reportsDir, 'ap_p0_gi_card_batch_faculty_packet.csv');

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
  if (!/^apP0.*CardBatch\.ts$/.test(fileName) || fileName === 'apP0GiCardBatch.ts') continue;
  const source = fs.readFileSync(path.join(batchDir, fileName), 'utf8');
  for (const match of source.matchAll(/"sourceQueueId":\s*"([^"]+)"/g)) {
    existingSourceQueueIds.add(match[1]);
  }
}

const giRows = (queue.p0Rows || [])
  .filter((row) => row.categoryId === 'ap_gi' && String(row.priority || '').startsWith('P0'))
  .sort((a, b) => {
    const sourceLineDelta = (Number(a.sourceLine) || 0) - (Number(b.sourceLine) || 0);
    if (sourceLineDelta !== 0) return sourceLineDelta;
    return String(a.path).localeCompare(String(b.path));
  });

const selectedRows = giRows
  .filter((row) => !existingSourceQueueIds.has(row.id))
  .slice(0, 24);

if (selectedRows.length === 0) {
  throw new Error('No unused P0 Gastrointestinal rows found in apGapClosureQueue.');
}

const giContextFor = (row) => {
  const text = `${row.path || ''} ${row.title || ''}`.toLowerCase();

  if (text.includes('celiac') || text.includes('sprue') || text.includes('duodenitis') || text.includes('peptic')) {
    return {
      organFocus: 'small bowel / duodenum',
      specimenContext: 'duodenal or small-bowel biopsy with endoscopic, serologic, medication, and infection context captured before slide review',
      normalComparator: 'normal villous architecture, crypt-to-villus ratio, and expected intraepithelial lymphocyte density',
      visualAnchor: 'low-power villous/crypt architecture plus high-power epithelial, inflammatory, or injury cue with a normal duodenal comparator',
      mimicPrompt: 'peptic injury, celiac disease, tropical sprue, medication injury, infection, and sampling/orientation artifact as appropriate',
      reportingConsequence: 'biopsy diagnosis, activity/chronicity language, suggested clinicoserologic correlation, and safety limits around overcalling villous blunting',
    };
  }

  if (text.includes('crohn') || text.includes('ulcerative') || text.includes('colitis') || text.includes('pseudomembranous') || text.includes('amebic')) {
    return {
      organFocus: 'colon / inflammatory bowel disease and infectious colitis',
      specimenContext: 'colonic biopsy, resection, or appendiceal/ileocolic specimen with disease distribution, treatment status, and infection risk context',
      normalComparator: 'normal colonic mucosa with preserved crypt architecture and expected lamina propria inflammation',
      visualAnchor: 'low-power crypt architecture or membrane/ulcer pattern plus high-power activity, chronicity, organism, or granuloma cue',
      mimicPrompt: 'IBD, infectious colitis, ischemia, medication injury, diversion change, and procedure-related artifact',
      reportingConsequence: 'activity/chronicity grading, dysplasia awareness, organism trigger, and report wording that guides clinicopathologic correlation',
    };
  }

  if (text.includes('polyp') || text.includes('adenoma') || text.includes('serrated') || text.includes('familial') || text.includes('cancer syndrome')) {
    return {
      organFocus: 'colorectal polyps and hereditary risk',
      specimenContext: 'colorectal polypectomy, biopsy, or resection with size, site, multiplicity, dysplasia, and family/syndrome context',
      normalComparator: 'normal colorectal crypt maturation and surface maturation before dysplastic or serrated architecture',
      visualAnchor: 'low-power polyp architecture plus high-power dysplasia/serration/maturation discriminator',
      mimicPrompt: 'hyperplastic polyp, sessile serrated lesion, traditional serrated adenoma, conventional adenoma, prolapse/inflammatory polyp',
      reportingConsequence: 'polyp type, dysplasia grade, margin/fragmentation caveat when relevant, and hereditary/surveillance implication',
    };
  }

  if (text.includes('mesenchymal') || text.includes('neuroendocrine') || text.includes('lymphoma') || text.includes('melanosis')) {
    return {
      organFocus: 'GI tumor and tumor mimic',
      specimenContext: 'GI biopsy, polypectomy, or resection with anatomic layer, site, size, and clinical/endoscopic impression',
      normalComparator: 'normal GI mucosal, submucosal, and wall-layer orientation before tumor lineage assignment',
      visualAnchor: 'low-power growth pattern or layer of origin plus high-power lineage cue and planned ancillary discriminator',
      mimicPrompt: 'epithelial tumor, mesenchymal tumor, neuroendocrine tumor, lymphoma, melanoma/metastasis, and reactive mimic as appropriate',
      reportingConsequence: 'diagnostic lineage, grading/staging or risk element when relevant, and ancillary/immunophenotypic workup language',
    };
  }

  if (text.includes('meckel') || text.includes('hirschsprung') || text.includes('tailgut') || text.includes('diverticulum')) {
    return {
      organFocus: 'developmental / anatomic GI lesion',
      specimenContext: 'GI resection or biopsy with anatomic site, age, symptoms, obstruction/bleeding context, and gross orientation',
      normalComparator: 'normal site-appropriate mucosa, wall layers, and ganglion cell/nerve plexus expectations where relevant',
      visualAnchor: 'gross or low-power anatomic architecture plus high-power diagnostic structure, mucosa, ganglion cell, or cyst lining cue',
      mimicPrompt: 'sampling limitation, reactive mucosa, duplication cyst, diverticulum, aganglionosis mimic, and ectopic tissue differential',
      reportingConsequence: 'gross-micro correlation, margin or ganglion-cell adequacy language when relevant, and clinical consequence statement',
    };
  }

  return {
    organFocus: 'gastrointestinal tract',
    specimenContext: 'GI biopsy, polypectomy, resection, or appendiceal specimen with site, endoscopic appearance, clinical context, and sampling adequacy',
    normalComparator: 'site-appropriate normal GI mucosa, crypt/villus architecture, and wall-layer orientation before abnormal pattern recognition',
    visualAnchor: 'low-power GI architecture or gross correlate plus high-power diagnostic discriminator with a normal-site comparator',
    mimicPrompt: 'common inflammatory, infectious, dysplastic, reactive, tumor, or sampling artifact mimic selected by faculty',
    reportingConsequence: 'diagnostic category, biopsy/resection wording, ancillary or correlation recommendation, and safety-critical caveat',
  };
};

const gateStatusesFor = (row, context) => [
  {
    id: 'taxonomy-qa',
    label: 'Taxonomy QA',
    status: 'ready-for-review',
    evidence: `Generated from Gastrointestinal AP specification path at source line ${row.sourceLine}; faculty must confirm entity/process placement and exclusion from prior batches.`,
  },
  {
    id: 'content-authoring',
    label: 'Entity card content',
    status: 'missing',
    evidence: 'Needs source-backed definition, normal comparator, gross/endoscopic or low-power anchor, microscopic discriminator, mimic, pitfall, and report consequence.',
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
    evidence: 'GI prompt set exists; faculty-reviewed diagnosis, discriminator, consequence, and safety caveat answer key is not yet attached.',
  },
  {
    id: 'faculty-review',
    label: 'Faculty review',
    status: 'missing',
    evidence: 'GI faculty reviewer, source citation, image/license status, editorial decision, and last-reviewed date are not yet attached.',
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
  const context = giContextFor(row);
  const gateStatuses = gateStatusesFor(row, context);

  return {
    id: `p0-gi-card-${String(index + 1).padStart(2, '0')}-${row.topicId}`,
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
    gastrointestinalOrganFocus: context.organFocus,
    specimenContext: context.specimenContext,
    normalComparatorPrompt: context.normalComparator,
    visualAnchorPlan: context.visualAnchor,
    mimicDiscriminatorPrompt: context.mimicPrompt,
    reportingConsequencePrompt: context.reportingConsequence,
    entityCardSections: [
      'GI taxonomy QA and anatomic site assignment',
      'Definition and scope in one learner-safe sentence',
      'Normal site-specific comparator before abnormal pattern',
      'Gross, endoscopic, or low-power architecture anchor',
      'High-power microscopic discriminator and one negative feature that prevents overcall',
      'Top mimic and single best discriminator',
      'Ancillary, infection, molecular, grading, staging, or clinicopathologic correlation when relevant',
      'Report phrase, biopsy/resection consequence, and safety-critical pitfall',
    ],
    retrievalPrompts: [
      `Before reveal: classify the GI entity or process represented by ${row.title}.`,
      'State the site-specific normal comparator and one feature that must be present before calling this abnormal.',
      'Name the closest mimic and the discriminator that separates them.',
      'State any stain, ancillary test, molecular feature, staging element, infection trigger, or clinical correlation that would matter.',
      'Write the short report/comment phrase that would be safe for a junior resident.',
    ],
    spacingSchedule: ['same session', '1 day', '3 days', '7 days', '21 days'],
    facultyReviewChecklist: [
      'Taxonomy QA confirms this row is an unused GI teaching target and documents any correction.',
      'Definition, normal comparator, morphology, mimic, discriminator, consequence, and pitfall are source-backed.',
      'Visual anchor is local/licensed or has an explicit no-image rationale.',
      'Retrieval answer key is faculty-reviewed before learner reveal.',
      'One contrastive near-miss is included for durable discrimination.',
      'Report language is clinically safe for biopsy, polypectomy, resection, or ancillary-workup context.',
    ],
    completionGate: 'Not complete until taxonomy QA, source-backed GI content, visual anchor, retrieval answer key, and GI faculty review metadata are all satisfied.',
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
  'ready-for-review': 'Structured scaffold exists and needs GI faculty confirmation.',
  missing: 'Required GI content, asset, source, answer key, or reviewer evidence is not yet attached.',
};

const output = {
  generatedAt: new Date().toISOString(),
  sourcePlan: 'reports/ap_gap_closure_plan.json',
  sourceQueue: 'src/content/competency/apGapClosureQueue.ts',
  facultyPacketPath: 'reports/ap_p0_gi_card_batch_faculty_packet.md',
  facultyPacketCsvPath: 'reports/ap_p0_gi_card_batch_faculty_packet.csv',
  batchName: 'P0 gastrointestinal entity card batch',
  batchStrategy: 'First up to 24 unused P0 Gastrointestinal rows from the AP gap closure queue, preserving source order and excluding sourceQueueIds already present in existing apP0 card batches.',
  status: 'draft GI scaffolds awaiting faculty-reviewed medical content, visual anchors, answer keys, and review metadata',
  categoryCoverage: {
    categoryId: 'ap_gi',
    category: 'Gastrointestinal',
    sourceP0Rows: giRows.length,
    alreadyAssignedSourceQueueIds: giRows.filter((row) => existingSourceQueueIds.has(row.id)).length,
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
  gastrointestinalOrganFocus: card.gastrointestinalOrganFocus,
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
  grossEndoscopicOrLowPowerAnchor: '',
  highPowerMicroscopicDiscriminator: '',
  topMimic: '',
  discriminator: '',
  ancillaryOrClinicopathologicCorrelation: '',
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

const packetMd = `# P0 Gastrointestinal Entity Card Batch Faculty Authoring Packet

Generated: ${output.generatedAt}

Status: ${output.status}

Batch strategy: ${output.batchStrategy}

Source P0 GI rows: ${output.categoryCoverage.sourceP0Rows}

Already assigned GI sourceQueueIds excluded: ${output.categoryCoverage.alreadyAssignedSourceQueueIds}

Selected cards: ${output.categoryCoverage.selectedCards}

## Faculty Completion Rule

Do not mark a GI card complete until all five gates are satisfied:

1. Taxonomy QA confirms this is an unused GI entity, pattern, infection, tumor, anatomic lesion, or intentional teaching target.
2. Source-backed content is authored: definition, normal comparator, gross/endoscopic or low-power anchor, high-power discriminator, mimic, consequence, and pitfall.
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
- GI organ focus: ${card.gastrointestinalOrganFocus}
- Learner level: ${card.learnerLevel}
- Difficulty: ${card.difficulty}
- AP spec path: ${card.apSpecPath}
- Specimen context: ${card.specimenContext}
- Normal comparator prompt: ${card.normalComparatorPrompt}
- Visual anchor plan: ${card.visualAnchorPlan}
- Mimic discriminator prompt: ${card.mimicDiscriminatorPrompt}
- Reporting consequence prompt: ${card.reportingConsequencePrompt}

### Reviewer Workflow

1. Confirm the AP-spec path is a valid unused GI teaching target and note any taxonomy correction.
2. Author the content fields with source-backed, learner-safe language.
3. Attach the endoscopic/gross/low-power/high-power image set, diagram, or no-image rationale and document source/license evidence.
4. Add the retrieval answer key, reviewer/date, and final editorial decision before marking gates complete.
5. Check that report language is safe for the specimen type and does not overstate dysplasia, invasion, infection, or staging.

### Gate Checklist

${gateChecklistFor(card)}

### Authoring Fields

- Taxonomy QA:
- GI site/entity/pattern type:
- Definition and scope:
- Normal comparator:
- Gross/endoscopic or low-power anchor:
- High-power microscopic discriminator:
- Top mimic:
- Best discriminator:
- Ancillary or clinicopathologic correlation:
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

fs.writeFileSync(outPath, `// Generated by scripts/generate_ap_p0_gi_cards.cjs. Do not edit by hand.

export const apP0GiCardBatch = ${JSON.stringify(output, null, 2)} as const;

export type ApP0GiCard = typeof apP0GiCardBatch.cards[number];
`);
fs.writeFileSync(packetPath, packetMd);
fs.writeFileSync(packetCsvPath, packetCsv);

const validation = {
  sourceP0GiRows: giRows.length,
  excludedExistingSourceQueueIds: output.categoryCoverage.alreadyAssignedSourceQueueIds,
  cards: cards.length,
  gatesPerCard: Math.min(...cards.map((card) => card.gateStatuses.length)),
  totalGates: batchReadiness.totalGates,
  reviewReadyGates: batchReadiness.reviewReadyGates,
  missingGates: batchReadiness.missingGates,
  duplicateCardIds: cards.length - new Set(cards.map((card) => card.id)).size,
  duplicateSourceQueueIds: cards.length - new Set(cards.map((card) => card.sourceQueueId)).size,
  cardsWithoutFiveGates: cards.filter((card) => card.gateStatuses.length !== 5).length,
  cardsMissingEntityCardSections: cards.filter((card) => !Array.isArray(card.entityCardSections) || card.entityCardSections.length === 0).length,
  outputs: [
    'scripts/generate_ap_p0_gi_cards.cjs',
    'src/content/competency/apP0GiCardBatch.ts',
    'reports/ap_p0_gi_card_batch_faculty_packet.md',
    'reports/ap_p0_gi_card_batch_faculty_packet.csv',
  ],
};

console.log(JSON.stringify(validation, null, 2));
