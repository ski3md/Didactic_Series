const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const queuePath = path.join(repoRoot, 'src/content/competency/apGapClosureQueue.ts');
const batchDir = path.join(repoRoot, 'src/content/competency');
const outPath = path.join(batchDir, 'apP0SmallDomainsCardBatch.ts');
const reportsDir = path.join(repoRoot, 'reports');
const packetPath = path.join(reportsDir, 'ap_p0_small_domains_card_batch_faculty_packet.md');
const packetCsvPath = path.join(reportsDir, 'ap_p0_small_domains_card_batch_faculty_packet.csv');

const targetCategoryIds = ['ap_soft', 'ap_hn', 'ap_cyto', 'ap_forensic', 'ap_neuro', 'ap_resp'];

const categoryContexts = {
  ap_soft: {
    label: 'Soft Tissue, Bone, and Joint',
    reviewerGroup: 'soft tissue/bone/joint pathology',
    specimenContext: 'biopsy, excision, resection, curettage, joint specimen, or bone lesion with site, depth, imaging, procedure, and prior treatment context captured before microscopy',
    normalComparator: 'normal soft tissue, bone, cartilage, synovium, or marrow architecture appropriate to the site',
    visualAnchor: 'low-power architecture or lesion distribution, high-power lineage or inflammatory clue, and radiology/gross comparator when relevant',
    reportingConsequence: 'benign versus malignant or inflammatory/metabolic classification, margin or adequacy language when relevant, ancillary plan, and safety limits around overclassification',
    mimicPrompt: 'reactive, infectious, metabolic, traumatic, degenerative, hematolymphoid, and sarcoma mimics selected by faculty',
    fieldLabel: 'softTissueBoneJointFocus',
  },
  ap_hn: {
    label: 'Head and Neck',
    reviewerGroup: 'head and neck pathology',
    specimenContext: 'biopsy, excision, or resection with anatomic subsite, laterality, clinical/endoscopic finding, exposure history, and prior procedure context',
    normalComparator: 'normal site-specific squamous, respiratory, glandular, ocular adnexal, or laryngeal mucosa before lesion recognition',
    visualAnchor: 'site-specific low-power lesion architecture plus high-power epithelial, stromal, inflammatory, or cyst-lining discriminator',
    reportingConsequence: 'site-aware diagnosis, dysplasia/invasion exclusion when relevant, infection or clinicopathologic correlation, and communication of sampling limits',
    mimicPrompt: 'reactive mucosal injury, cystic lesion, infection, neoplasm, trauma-related change, and site-misclassification mimic',
    fieldLabel: 'headNeckFocus',
  },
  ap_cyto: {
    label: 'Cytopathology',
    reviewerGroup: 'cytopathology',
    specimenContext: 'cytology specimen with collection method, adequacy, preparation type, screening indication, patient age, hormone status, and relevant prior results',
    normalComparator: 'adequate normal cytology background, expected squamous/glandular elements, microbiota, and preparation artifact spectrum',
    visualAnchor: 'representative cytology field with adequacy/background context, benign cellular pattern, artifact discriminator, or abnormal-cell threshold as appropriate',
    reportingConsequence: 'Bethesda-style adequacy/category language, safe screening interpretation, follow-up implication, and limits around overcalling normal variants',
    mimicPrompt: 'sampling artifact, atrophy, inflammation, microbiota, repair, hormonal effect, glandular contaminant, and true epithelial abnormality',
    fieldLabel: 'cytopathologyFocus',
  },
  ap_forensic: {
    label: 'Forensic Pathology',
    reviewerGroup: 'forensic pathology',
    specimenContext: 'death investigation or autopsy context with age, scene information, medical history, circumstances, gross findings, toxicology, microbiology, and ancillary sampling plan',
    normalComparator: 'age-appropriate organ development and expected postmortem/autopsy change before attributing disease or injury',
    visualAnchor: 'gross-organ or histologic correlate tied to cause, mechanism, manner, or exclusion of competing explanations',
    reportingConsequence: 'cause-of-death reasoning, manner-of-death limits, ancillary test selection, documentation language, and chain-of-evidence awareness',
    mimicPrompt: 'postmortem artifact, resuscitation change, prematurity/developmental baseline, natural disease, congenital anomaly, trauma, and toxicologic confounder',
    fieldLabel: 'forensicFocus',
  },
  ap_neuro: {
    label: 'Neuropathology',
    reviewerGroup: 'neuropathology',
    specimenContext: 'brain, spinal cord, nerve, muscle, epilepsy, autopsy, or biopsy context with neuroanatomic site, imaging, clinical syndrome, seizure history, and sampling orientation',
    normalComparator: 'normal neuroanatomic and histologic organization for cortex, white matter, hippocampus, spinal cord, meninges, nerve, or muscle as applicable',
    visualAnchor: 'low-power neuroanatomic localization, high-power diagnostic cell/process cue, and normal-region comparator',
    reportingConsequence: 'localization-aware diagnosis, degenerative/developmental/tumor/seizure-related framing, ancillary plan, and limits around sampling and clinicoradiologic correlation',
    mimicPrompt: 'normal regional variation, reactive gliosis, developmental lesion, seizure-related change, tumor mimic, degenerative process, and sampling artifact',
    fieldLabel: 'neuropathologyFocus',
  },
  ap_resp: {
    label: 'Respiratory, Pleura, and Mediastinum',
    reviewerGroup: 'pulmonary pathology',
    specimenContext: 'lung biopsy, wedge, resection, cytology, or mediastinal specimen with imaging distribution, smoking/exposure history, procedure type, and clinical question',
    normalComparator: 'normal airway, alveolar, pleural, or mediastinal architecture before emphysematous, nodular, inflammatory, or neoplastic interpretation',
    visualAnchor: 'low-power airway/alveolar/nodule architecture plus high-power diagnostic discriminator and radiology/gross correlate when relevant',
    reportingConsequence: 'benign versus neoplastic classification, biopsy adequacy, ancillary/immunostain plan, and clinicoradiologic correlation language',
    mimicPrompt: 'reactive nodule, emphysematous change, infection, metastatic lesion, carcinoid/neuroendocrine mimic, and sampling artifact',
    fieldLabel: 'respiratoryFocus',
  },
};

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
  if (!/^apP0.*CardBatch\d*\.ts$/.test(fileName) || fileName === 'apP0SmallDomainsCardBatch.ts') continue;
  const source = fs.readFileSync(path.join(batchDir, fileName), 'utf8');
  for (const match of source.matchAll(/"sourceQueueId":\s*"([^"]+)"/g)) {
    existingSourceQueueIds.add(match[1]);
  }
}

const targetRows = (queue.p0Rows || [])
  .filter((row) => targetCategoryIds.includes(row.categoryId) && String(row.priority || '').startsWith('P0'))
  .sort((a, b) => {
    const categoryDelta = targetCategoryIds.indexOf(a.categoryId) - targetCategoryIds.indexOf(b.categoryId);
    if (categoryDelta !== 0) return categoryDelta;
    const sourceLineDelta = (Number(a.sourceLine) || 0) - (Number(b.sourceLine) || 0);
    if (sourceLineDelta !== 0) return sourceLineDelta;
    return String(a.path).localeCompare(String(b.path));
  });

const selectedRows = targetRows.filter((row) => !existingSourceQueueIds.has(row.id));

if (selectedRows.length === 0) {
  throw new Error('No unused small-domain P0 rows found in apGapClosureQueue.');
}

const slugFor = (value) => String(value || 'row')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '')
  .slice(0, 52);

const gateStatusesFor = (row, context) => [
  {
    id: 'taxonomy-qa',
    label: 'Taxonomy QA',
    status: 'ready-for-review',
    evidence: `Generated from ${context.label} AP specification path at source line ${row.sourceLine}; faculty must confirm entity/process placement and exclusion from prior batches.`,
  },
  {
    id: 'content-authoring',
    label: 'Entity card content',
    status: 'missing',
    evidence: 'Needs source-backed definition, normal comparator, specimen context, microscopic discriminator, mimic, pitfall, and report/autopsy consequence.',
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
    evidence: `${context.label} prompt set exists; faculty-reviewed answer key is not yet attached.`,
  },
  {
    id: 'faculty-review',
    label: 'Faculty review',
    status: 'missing',
    evidence: `${context.reviewerGroup} reviewer, source citation, asset/license status, editorial decision, and last-reviewed date are not yet attached.`,
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
  const context = categoryContexts[row.categoryId];
  const gateStatuses = gateStatusesFor(row, context);

  return {
    id: `p0-small-domain-card-${String(index + 1).padStart(2, '0')}-${slugFor(row.topicId || row.title)}`,
    sourceQueueId: row.id,
    editorialStatus: 'draft-scaffold',
    priority: row.priority,
    title: row.title,
    categoryId: row.categoryId,
    category: row.category,
    rotation: row.rotation,
    apSpecPath: row.path,
    learnerLevel: row.learnerLevel,
    difficulty: row.difficulty,
    sourceLine: row.sourceLine,
    smallDomainFocus: context.label,
    [context.fieldLabel]: row.title,
    specimenContext: context.specimenContext,
    normalComparatorPrompt: context.normalComparator,
    visualAnchorPlan: context.visualAnchor,
    mimicDiscriminatorPrompt: context.mimicPrompt,
    reportingConsequencePrompt: context.reportingConsequence,
    entityCardSections: [
      `${context.label} taxonomy QA and scope assignment`,
      'Definition and inclusion/exclusion boundaries in one learner-safe sentence',
      'Specimen, clinical, gross, imaging, scene, or adequacy context required before diagnosis',
      'Normal or expected comparator for the site/specimen before abnormal pattern recognition',
      'Low-power or gross anchor and high-power diagnostic discriminator',
      'Closest mimic and single best discriminator',
      'Ancillary, imaging, toxicology, molecular, microbiology, or clinicopathologic correlation when relevant',
      'Report, autopsy, cytology adequacy, or consultation consequence plus one safety-critical pitfall',
    ],
    retrievalPrompts: [
      `Before reveal: classify ${row.title} within ${context.label}.`,
      'State the normal/expected comparator and one feature that must be present before calling this abnormal.',
      'Name the closest mimic and the discriminator that separates them.',
      'State any ancillary test, imaging/gross correlation, toxicology/microbiology, molecular marker, or clinical correlation that would matter.',
      'Write the short learner-safe report/comment/autopsy/cytology phrase and one safety caveat.',
    ],
    spacingSchedule: ['same session', '1 day', '3 days', '7 days', '21 days'],
    facultyReviewChecklist: [
      `Taxonomy QA confirms this row is a valid unused ${context.label} teaching target or documents a correction.`,
      'Definition, comparator, morphology/context, mimic, discriminator, consequence, and pitfall are source-backed.',
      'Visual, gross, scene, imaging, cytology, or histology anchor is local/licensed or has an explicit no-image rationale.',
      'Retrieval answer key is faculty-reviewed before learner reveal.',
      'One contrastive near-miss is included for durable discrimination.',
      'Final language is safe for the relevant diagnostic, cytology, autopsy, forensic, or consult context.',
    ],
    completionGate: `Not complete until taxonomy QA, source-backed ${context.label} content, visual/context anchor, retrieval answer key, and ${context.reviewerGroup} review metadata are all satisfied.`,
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
  'ready-for-review': 'Structured scaffold exists and needs small-domain faculty confirmation.',
  missing: 'Required content, asset/context anchor, source, answer key, or reviewer evidence is not yet attached.',
};

const categoryCoverage = Object.fromEntries(targetCategoryIds.map((categoryId) => {
  const rows = targetRows.filter((row) => row.categoryId === categoryId);
  const selected = selectedRows.filter((row) => row.categoryId === categoryId);
  return [
    categoryId,
    {
      category: categoryContexts[categoryId].label,
      sourceP0Rows: rows.length,
      alreadyAssignedSourceQueueIds: rows.filter((row) => existingSourceQueueIds.has(row.id)).length,
      selectedCards: selected.length,
    },
  ];
}));

const output = {
  generatedAt: new Date().toISOString(),
  sourcePlan: 'reports/ap_gap_closure_plan.json',
  sourceQueue: 'src/content/competency/apGapClosureQueue.ts',
  facultyPacketPath: 'reports/ap_p0_small_domains_card_batch_faculty_packet.md',
  facultyPacketCsvPath: 'reports/ap_p0_small_domains_card_batch_faculty_packet.csv',
  batchName: 'P0 small-domain entity card batch',
  batchStrategy: 'All remaining unassigned P0 rows from soft tissue/bone/joint, head and neck, cytopathology, forensic pathology, neuropathology, and respiratory categories, preserving category/source order and excluding sourceQueueIds already present in existing apP0 card batches.',
  status: 'draft small-domain scaffolds awaiting faculty-reviewed medical content, visual/context anchors, answer keys, and review metadata',
  categoryCoverage,
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
  categoryId: card.categoryId,
  category: card.category,
  smallDomainFocus: card.smallDomainFocus,
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
  normalOrExpectedComparator: '',
  grossImagingSceneAdequacyOrLowPowerAnchor: '',
  highPowerOrDiagnosticDiscriminator: '',
  topMimic: '',
  bestDiscriminator: '',
  ancillaryCorrelationOrEvidencePlan: '',
  reportAutopsyCytologyOrConsultLanguage: '',
  safetyPitfall: '',
  visualContextAssetPathOrRationale: '',
  sourceCitation: '',
  retrievalAnswerKey: '',
  reviewer: '',
  reviewDate: '',
  decision: 'draft',
  ...gateColumnsFor(card),
}));

const packetMd = `# P0 Small-Domain Entity Card Batch Faculty Authoring Packet

Generated: ${output.generatedAt}

Status: ${output.status}

Batch strategy: ${output.batchStrategy}

## Category Coverage

${Object.entries(output.categoryCoverage).map(([categoryId, coverage]) => `- ${categoryId}: ${coverage.selectedCards} selected of ${coverage.sourceP0Rows} source P0 rows; ${coverage.alreadyAssignedSourceQueueIds} already assigned and excluded.`).join('\n')}

## Faculty Completion Rule

Do not mark a small-domain card complete until all five gates are satisfied:

1. Taxonomy QA confirms this is a valid unused teaching target in the assigned small domain.
2. Source-backed content is authored: definition, normal/expected comparator, specimen or context anchor, discriminator, mimic, consequence, and pitfall.
3. Visual, gross, scene, imaging, cytology, histology, or context anchor is attached or a no-asset rationale is documented.
4. Retrieval prompts have a faculty-reviewed answer key.
5. Reviewer, review date, source citation, asset/license status, and editorial decision are documented.

## Batch Readiness

- Cards: ${cards.length}
- Complete gates: ${output.batchReadiness.completedGates}
- Review-ready gates: ${output.batchReadiness.reviewReadyGates}
- Missing gates: ${output.batchReadiness.missingGates}
- Percent review-ready: ${output.batchReadiness.percentReviewReady}%

${cards.map((card, index) => `## ${index + 1}. ${card.title}

- Card ID: \`${card.id}\`
- Source queue ID: \`${card.sourceQueueId}\`
- Small-domain focus: ${card.smallDomainFocus}
- Category ID: ${card.categoryId}
- Learner level: ${card.learnerLevel}
- Difficulty: ${card.difficulty}
- AP spec path: ${card.apSpecPath}
- Specimen/context: ${card.specimenContext}
- Normal comparator prompt: ${card.normalComparatorPrompt}
- Visual/context anchor plan: ${card.visualAnchorPlan}
- Mimic discriminator prompt: ${card.mimicDiscriminatorPrompt}
- Reporting/autopsy/cytology consequence prompt: ${card.reportingConsequencePrompt}

### Reviewer Workflow

1. Confirm the AP-spec path is a valid unused ${card.smallDomainFocus} teaching target and note any taxonomy correction.
2. Author the content fields with source-backed, learner-safe language.
3. Attach the visual, gross, scene, imaging, cytology, histology, or context anchor, or document the no-asset rationale and source/license evidence.
4. Add the retrieval answer key, reviewer/date, and final editorial decision before marking gates complete.
5. Check that final language is safe for the specimen, autopsy, cytology, consult, or diagnostic context.

### Gate Checklist

${gateChecklistFor(card)}

### Authoring Fields

- Taxonomy QA:
- Small-domain entity/process type:
- Definition and scope:
- Normal or expected comparator:
- Gross/imaging/scene/adequacy/low-power anchor:
- High-power or diagnostic discriminator:
- Top mimic:
- Best discriminator:
- Ancillary, correlation, or evidence plan:
- Report/autopsy/cytology/consult language:
- Safety-critical pitfall:
- Visual/context asset path or no-asset rationale:
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

fs.writeFileSync(outPath, `// Generated by scripts/generate_ap_p0_small_domains_cards.cjs. Do not edit by hand.

export const apP0SmallDomainsCardBatch = ${JSON.stringify(output, null, 2)} as const;

export type ApP0SmallDomainsCard = typeof apP0SmallDomainsCardBatch.cards[number];
`);
fs.writeFileSync(packetPath, packetMd);
fs.writeFileSync(packetCsvPath, packetCsv);

const validation = {
  sourceP0Rows: targetRows.length,
  selectedCards: cards.length,
  categoryCoverage: output.categoryCoverage,
  existingSourceQueueIdsExcluded: targetRows.filter((row) => existingSourceQueueIds.has(row.id)).length,
  totalGates: batchReadiness.totalGates,
  reviewReadyGates: batchReadiness.reviewReadyGates,
  missingGates: batchReadiness.missingGates,
  duplicateCardIds: cards.length - new Set(cards.map((card) => card.id)).size,
  duplicateSourceQueueIds: cards.length - new Set(cards.map((card) => card.sourceQueueId)).size,
  crossBatchSourceQueueIdCollisions: cards.filter((card) => existingSourceQueueIds.has(card.sourceQueueId)).length,
  cardsWithoutFiveGates: cards.filter((card) => card.gateStatuses.length !== 5).length,
  cardsMissingEntityCardSections: cards.filter((card) => !Array.isArray(card.entityCardSections) || card.entityCardSections.length === 0).length,
  cardsMissingRetrievalPrompts: cards.filter((card) => !Array.isArray(card.retrievalPrompts) || card.retrievalPrompts.length === 0).length,
  cardsMissingSpacingSchedule: cards.filter((card) => !Array.isArray(card.spacingSchedule) || card.spacingSchedule.length === 0).length,
  cardsMissingFacultyReviewChecklist: cards.filter((card) => !Array.isArray(card.facultyReviewChecklist) || card.facultyReviewChecklist.length === 0).length,
  gatesMissingRequiredFields: cards.flatMap((card) => card.gateStatuses).filter((gate) => !gate.id || !gate.label || !gate.status || !gate.evidence).length,
  outputs: [
    'scripts/generate_ap_p0_small_domains_cards.cjs',
    'src/content/competency/apP0SmallDomainsCardBatch.ts',
    'reports/ap_p0_small_domains_card_batch_faculty_packet.md',
    'reports/ap_p0_small_domains_card_batch_faculty_packet.csv',
  ],
};

const blockingIssues = [
  validation.duplicateCardIds,
  validation.duplicateSourceQueueIds,
  validation.crossBatchSourceQueueIdCollisions,
  validation.cardsWithoutFiveGates,
  validation.cardsMissingEntityCardSections,
  validation.cardsMissingRetrievalPrompts,
  validation.cardsMissingSpacingSchedule,
  validation.cardsMissingFacultyReviewChecklist,
  validation.gatesMissingRequiredFields,
].reduce((sum, count) => sum + count, 0);

console.log(JSON.stringify(validation, null, 2));

if (blockingIssues > 0) {
  throw new Error(`Small-domain batch validation failed with ${blockingIssues} blocking issue(s).`);
}
