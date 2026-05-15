#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const queuePath = path.join(repoRoot, 'src/content/competency/apGapClosureQueue.ts');
const batchDir = path.join(repoRoot, 'src/content/competency');
const outPath = path.join(batchDir, 'apP0MaleReproCardBatch.ts');
const reportsDir = path.join(repoRoot, 'reports');
const packetPath = path.join(reportsDir, 'ap_p0_male_repro_card_batch_faculty_packet.md');
const packetCsvPath = path.join(reportsDir, 'ap_p0_male_repro_card_batch_faculty_packet.csv');

if (!fs.existsSync(queuePath)) {
  throw new Error(`Missing queue input: ${queuePath}. Run npm run ap:gaps:plan first.`);
}

const extractExportedObjectText = (source, exportName) => {
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

const readExportedObject = (filePath, exportName) =>
  JSON.parse(extractExportedObjectText(fs.readFileSync(filePath, 'utf8'), exportName));

const collectExistingSourceQueueIds = () => {
  if (!fs.existsSync(batchDir)) return new Set();

  const ids = new Set();
  for (const entry of fs.readdirSync(batchDir, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    if (!/^apP0.*CardBatch\.ts$/.test(entry.name)) continue;
    if (entry.name === path.basename(outPath)) continue;

    const source = fs.readFileSync(path.join(batchDir, entry.name), 'utf8');
    const matches = source.matchAll(/"sourceQueueId":\s*"([^"]+)"/g);
    for (const match of matches) ids.add(match[1]);
  }

  return ids;
};

const queue = readExportedObject(queuePath, 'apGapClosureQueue');
const existingSourceQueueIds = collectExistingSourceQueueIds();
const maleReproRows = (queue.p0Rows || [])
  .filter((row) => row.categoryId === 'ap_male_repro' && String(row.priority || '').startsWith('P0'))
  .sort((a, b) => {
    const sourceLineDelta = (Number(a.sourceLine) || 0) - (Number(b.sourceLine) || 0);
    if (sourceLineDelta !== 0) return sourceLineDelta;
    return String(a.path).localeCompare(String(b.path));
  });

const selectedRows = maleReproRows
  .filter((row) => !existingSourceQueueIds.has(row.id))
  .slice(0, 24);

if (selectedRows.length === 0) {
  throw new Error('No unclaimed P0 Male Reproductive rows found in apGapClosureQueue.');
}

const contextFor = (row) => {
  const pathText = String(row.path || '').toLowerCase();
  const titleText = String(row.title || '').toLowerCase();
  const combined = `${pathText} ${titleText}`;

  if (combined.includes('prostate') || combined.includes('seminal vesicle') || combined.includes('extraprostatic')) {
    return {
      organFocus: 'prostate and seminal vesicles',
      specimenContext: 'prostate needle biopsy, TURP, prostatectomy, seminal vesicle section, or adjacent male GU specimen with clinical PSA/imaging context',
      normalComparator: 'benign prostatic glands, stroma, corpora amylacea, and seminal vesicle mucosa before abnormal pattern recognition',
      visualAnchor: 'low-power prostate/seminal vesicle architecture plus high-power feature that separates benign, traumatic, infiltrative, or staging-relevant change',
      mimicFrame: 'benign glands, atrophy, post-biopsy change, amyloid, intraprostatic/seminal vesicle tissue, and adenocarcinoma or extraprostatic extension mimic as applicable',
      reportingConsequence: 'biopsy/prostatectomy report language, staging consequence, margin or extraprostatic extension implication, and safety-critical benign-versus-malignant distinction',
    };
  }

  if (combined.includes('testis') || combined.includes('cryptorchid')) {
    return {
      organFocus: 'testis',
      specimenContext: 'orchiectomy, testicular biopsy, torsion/infarct specimen, pediatric gonadal specimen, or fertility-related testis section with age and laterality',
      normalComparator: 'age-appropriate seminiferous tubules, germ cells, Sertoli cells, Leydig cells, epididymis, and tunica before lesion-level interpretation',
      visualAnchor: 'testis low-power architecture plus high-power germ-cell, inflammatory, developmental, or infarct-related feature',
      mimicFrame: 'atrophy, maturation arrest, germ cell neoplasia in situ, scar/regression, torsion/infarct, infection, and developmental anomaly as applicable',
      reportingConsequence: 'orchiectomy/biopsy diagnosis, germ-cell-risk statement, margin/staging consideration, fertility implication, or urgent clinical correlation',
    };
  }

  if (combined.includes('penis') || combined.includes('balanitis') || combined.includes('bowenoid') || combined.includes('lichen')) {
    return {
      organFocus: 'penis',
      specimenContext: 'penile biopsy, circumcision, glans/foreskin excision, or urethral-adjacent specimen with HPV, inflammatory, or lesion-distribution context',
      normalComparator: 'normal squamous mucosa, preputial skin, adnexa, and urethral-adjacent epithelium before dysplasia or inflammatory pattern recognition',
      visualAnchor: 'squamous mucosa low-power silhouette plus high-power dysplasia, inflammation, HPV effect, invasion, or reactive mimic feature',
      mimicFrame: 'reactive atypia, lichen sclerosus, bowenoid papulosis, HPV-related dysplasia, invasive squamous carcinoma, and infectious balanitis as applicable',
      reportingConsequence: 'biopsy diagnosis, dysplasia grade, invasion concern, margin status, HPV/inflammation comment, and clinicopathologic correlation',
    };
  }

  if (
    combined.includes('ovaries')
    || combined.includes('fallopian')
    || combined.includes('cervix')
    || combined.includes('endometr')
    || combined.includes('peritone')
    || combined.includes('uterine')
  ) {
    return {
      organFocus: 'taxonomy QA: possible female-tract row inside male reproductive category',
      specimenContext: 'do not author as male reproductive until faculty confirms the row is truly male GU or documents reassignment to gynecologic/peritoneal AP content',
      normalComparator: 'taxonomy-correct normal comparator after reassignment; if retained, document why this belongs in male reproductive teaching',
      visualAnchor: 'taxonomy QA visual plan: attach correction note, organ-system reassignment, or local image only after category review',
      mimicFrame: 'primary task is parser/category correction; contrastive mimic should be assigned after organ-system QA',
      reportingConsequence: 'editorial correction, reassignment, or explicit rationale must precede learner-facing diagnostic/report language',
    };
  }

  return {
    organFocus: 'male reproductive taxonomy-review row',
    specimenContext: 'male reproductive or male GU-adjacent specimen only after taxonomy QA confirms organ, specimen type, and entity/process status',
    normalComparator: 'faculty-selected normal male reproductive comparator or taxonomy-correction note',
    visualAnchor: 'organ-specific gross/H&E anchor or documented no-image/taxonomy-correction rationale',
    mimicFrame: 'faculty-selected male reproductive mimic, developmental anomaly, infection, benign mimic, or malignancy pitfall',
    reportingConsequence: 'safe report phrase, staging/synoptic consequence, ancillary decision, or taxonomy correction before learner-facing release',
  };
};

const gateStatusesFor = (row, context) => [
  {
    id: 'taxonomy-qa',
    label: 'Taxonomy QA',
    status: 'ready-for-review',
    evidence: `Generated from ap_male_repro P0 queue at source line ${row.sourceLine}; confirm male reproductive placement, organ focus (${context.organFocus}), and entity/process status before authoring.`,
  },
  {
    id: 'content-authoring',
    label: 'Entity card content',
    status: 'missing',
    evidence: 'Needs source-backed definition, normal comparator, morphology, mimic discriminator, report/staging/clinical consequence, and safety pitfall.',
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
    evidence: 'Retrieval prompts are scaffolded; faculty-reviewed answer key and spaced-repeat reveal text are not yet attached.',
  },
  {
    id: 'faculty-review',
    label: 'Faculty review',
    status: 'missing',
    evidence: 'Male GU/reproductive faculty reviewer, source citation, image/license status, editorial decision, and review date are not yet attached.',
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
    id: `p0-male-repro-card-${String(index + 1).padStart(2, '0')}-${row.topicId}`,
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
    maleReproductiveOrganFocus: context.organFocus,
    specimenContext: context.specimenContext,
    normalComparatorPrompt: context.normalComparator,
    visualAnchorPlan: context.visualAnchor,
    mimicDiscriminatorPrompt: context.mimicFrame,
    reportingConsequencePrompt: context.reportingConsequence,
    entityCardSections: [
      'Taxonomy QA and organ/site assignment before learner release',
      'Definition and scope in one learner-safe sentence',
      'Normal male reproductive comparator before abnormal pattern',
      'Gross, low-power, or compartment-level orientation cue',
      'High-power diagnostic feature and one negative feature that prevents overcall',
      'Top mimic and the single best discriminator',
      'Ancillary, staging, synoptic, or report consequence',
      'Pitfall that could cause a safety-critical male GU miss',
    ],
    retrievalPrompts: [
      `Before reveal: identify or taxonomy-triage the male reproductive entity/process represented by ${row.title}.`,
      'State the normal comparator and one feature that must be present before calling this abnormal.',
      'Name the closest mimic and the discriminator that separates them.',
      'State the report, staging, ancillary, or editorial correction consequence.',
      'Write one learner-safe phrase that should appear in feedback after reveal.',
    ],
    spacingSchedule: ['same session', '1 day', '3 days', '7 days', '21 days'],
    facultyReviewChecklist: [
      'Taxonomy QA confirms this row belongs in male reproductive pathology or documents reassignment.',
      'Definition, morphology, mimic, discriminator, consequence, and pitfall are source-backed.',
      'Normal comparator is male reproductive or taxonomy-correct after reassignment.',
      'Visual anchor is local/licensed or has an explicit no-image/taxonomy-correction rationale.',
      'Retrieval answer key is faculty-reviewed before learner reveal.',
      'One near-miss mimic is included for contrastive learning and memory consolidation.',
    ],
    completionGate: 'Not complete until taxonomy QA, source-backed content, visual anchor, retrieval answer key, and male GU/reproductive faculty review metadata are all satisfied.',
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
  'ready-for-review': 'Structured scaffold exists and needs male GU/reproductive faculty confirmation.',
  missing: 'Required content, visual asset, source, answer key, taxonomy correction, or reviewer evidence is not yet attached.',
};

const output = {
  generatedAt: new Date().toISOString(),
  sourcePlan: 'reports/ap_gap_closure_plan.json',
  sourceQueue: 'src/content/competency/apGapClosureQueue.ts',
  facultyPacketPath: 'reports/ap_p0_male_repro_card_batch_faculty_packet.md',
  facultyPacketCsvPath: 'reports/ap_p0_male_repro_card_batch_faculty_packet.csv',
  batchName: 'P0 male reproductive entity card batch',
  batchStrategy: 'Up to 24 unclaimed P0 Male Reproductive rows from the AP gap closure queue, preserving source order and requiring taxonomy QA before source-backed medical authoring.',
  sourceCategory: 'ap_male_repro',
  sourceP0Rows: maleReproRows.length,
  excludedExistingSourceQueueIds: maleReproRows.length - selectedRows.length,
  selectedRows: cards.length,
  status: 'draft male reproductive scaffolds awaiting taxonomy QA, source-backed content, visual anchors, retrieval answer keys, and faculty review',
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
  'Confirm the AP-spec path belongs in male reproductive pathology; document taxonomy correction or reassignment if it does not.',
  'Fill definition, normal comparator, morphology, mimic/discriminator, consequence, and pitfall with source-backed content.',
  'Attach the image, gross photo, diagram, or no-image/taxonomy-correction rationale and document source/license evidence.',
  'Add retrieval answer key, reviewer/date, source citation, and final editorial decision before marking gates complete.',
];

const packetRows = cards.map((card) => ({
  cardId: card.id,
  sourceQueueId: card.sourceQueueId,
  title: card.title,
  category: card.category,
  maleReproductiveOrganFocus: card.maleReproductiveOrganFocus,
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
  ancillaryStagingOrReportingConsequence: '',
  safetyPitfall: '',
  visualAssetPathOrRationale: '',
  sourceCitation: '',
  retrievalAnswerKey: '',
  reviewer: '',
  reviewDate: '',
  decision: 'draft',
  ...gateColumnsFor(card),
}));

const packetMd = `# P0 Male Reproductive Entity Card Batch Faculty Authoring Packet

Generated: ${output.generatedAt}

Status: ${output.status}

Batch strategy: ${output.batchStrategy}

Source P0 male reproductive rows: ${output.sourceP0Rows}

Selected cards: ${output.selectedRows}

Excluded existing sourceQueueIds: ${output.excludedExistingSourceQueueIds}

## Faculty Completion Rule

Do not mark a card complete until all five gates are satisfied:

1. Taxonomy QA confirms this AP-spec path belongs in male reproductive pathology or documents reassignment.
2. Source-backed content is authored: definition, normal comparator, morphology, mimic/discriminator, consequence, and pitfall.
3. Visual anchor is attached or a no-image/taxonomy-correction rationale is explicitly documented.
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
- Male reproductive organ focus: ${card.maleReproductiveOrganFocus}
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
- Normal comparator:
- Key morphology anchor:
- Top mimic:
- Best discriminator:
- Ancillary, staging, synoptic, or reporting consequence:
- Safety-critical pitfall:
- Visual asset path or no-image/taxonomy-correction rationale:
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

fs.mkdirSync(reportsDir, { recursive: true });
fs.writeFileSync(outPath, `// Generated by scripts/generate_ap_p0_male_repro_cards.cjs. Do not edit by hand.

export const apP0MaleReproCardBatch = ${JSON.stringify(output, null, 2)} as const;

export type ApP0MaleReproCard = typeof apP0MaleReproCardBatch.cards[number];
`);
fs.writeFileSync(packetPath, packetMd);
fs.writeFileSync(packetCsvPath, packetCsv);

const validation = {
  sourceP0MaleReproductiveRows: maleReproRows.length,
  selectedCards: cards.length,
  excludedExistingSourceQueueIds: output.excludedExistingSourceQueueIds,
  gatesPerCard: cards.length ? Math.min(...cards.map((card) => card.gateStatuses.length)) : 0,
  totalGates: batchReadiness.totalGates,
  reviewReadyGates: batchReadiness.reviewReadyGates,
  missingGates: batchReadiness.missingGates,
  duplicateCardIds: cards.length - new Set(cards.map((card) => card.id)).size,
  duplicateSourceQueueIds: cards.length - new Set(cards.map((card) => card.sourceQueueId)).size,
  cardsWithoutFiveGates: cards.filter((card) => card.gateStatuses.length !== 5).length,
  nonMaleReproSourceIds: cards.filter((card) => !String(card.sourceQueueId).startsWith('ap_male_repro-')).length,
  outputs: [
    'scripts/generate_ap_p0_male_repro_cards.cjs',
    'src/content/competency/apP0MaleReproCardBatch.ts',
    'reports/ap_p0_male_repro_card_batch_faculty_packet.md',
    'reports/ap_p0_male_repro_card_batch_faculty_packet.csv',
  ],
};

console.log(JSON.stringify(validation, null, 2));
