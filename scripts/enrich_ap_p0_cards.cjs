#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const batchDir = path.join(repoRoot, 'src/content/competency');
const reportsDir = path.join(repoRoot, 'reports');
const reportJsonPath = path.join(reportsDir, 'ap_p0_card_content_enrichment.json');
const reportMdPath = path.join(reportsDir, 'ap_p0_card_content_enrichment.md');

const BATCH_FILE_PATTERN = /^apP0.*CardBatch\d*\.ts$/;

const categoryProfiles = [
  {
    match: /breast/i,
    comparator: 'normal terminal duct lobular unit or expected breast stroma/epithelium',
    morphology: 'low-power duct/lobular architecture, epithelial proliferation pattern, stromal response, and high-power cytologic atypia',
    mimic: 'usual hyperplasia, reactive change, in situ carcinoma, invasive carcinoma, or treatment effect depending on the path context',
    discriminator: 'architecture plus cytologic atypia, myoepithelial pattern, biomarker context, and whether invasion or concordance changes management',
    ancillary: 'ER/PR/HER2, myoepithelial stains, margin/synoptic language, or radiology-pathology concordance when relevant',
    pitfall: 'missing invasion, overcalling reactive/proliferative change, or omitting biomarker/concordance language that changes care',
  },
  {
    match: /cardiovascular|autopsy|myocard|aorta|valve|vascular/i,
    comparator: 'expected myocardium, valve, vessel wall, or systemic autopsy baseline',
    morphology: 'gross-micro correlation, anatomic distribution, injury pattern, inflammation, degeneration, thrombosis, or rupture plane',
    mimic: 'postmortem artifact, nonspecific degeneration, ischemic injury, vasculitis, infection, or systemic comorbidity',
    discriminator: 'clinicopathologic timing, distribution, gross correlation, and whether the lesion explains mechanism of disease or death',
    ancillary: 'cause-of-death wording, clinicopathologic correlation, special stains, cultures, toxicology, or genetic/syndromic correlation when indicated',
    pitfall: 'overstating causality without clinicopathologic support or missing a mechanism-relevant cardiovascular lesion',
  },
  {
    match: /derm|skin|cutaneous/i,
    comparator: 'normal epidermis, dermis, adnexa, and inflammatory reaction pattern',
    morphology: 'epidermal reaction pattern, dermal infiltrate distribution, adnexal involvement, cytology, and interface or vascular change',
    mimic: 'reactive dermatitis, infection, inflammatory mimic, adnexal lesion, melanocytic lesion, or cutaneous malignancy',
    discriminator: 'pattern plus compartment, cytology, maturation, organism/stain support, and clinicopathologic distribution',
    ancillary: 'PAS/GMS/AFB, immunostains, margin language, or clinicopathologic correlation when it changes classification',
    pitfall: 'calling a pattern without excluding infection, reactive mimics, or melanoma/carcinoma where the differential demands it',
  },
  {
    match: /endocrine|thyroid|adrenal|pituitary|parathyroid/i,
    comparator: 'normal endocrine architecture for the gland or a clearly documented taxonomy reassignment comparator',
    morphology: 'capsule/interface, growth pattern, cytology, invasion, necrosis, mitotic activity, and organ-specific architecture',
    mimic: 'hyperplasia, adenoma, carcinoma, metastatic disease, or non-endocrine taxonomy spillover depending on the path context',
    discriminator: 'invasion, lineage/site confirmation, functional context, and whether architecture supports the endocrine category',
    ancillary: 'organ-specific immunostains, molecular tests, staging/synoptic elements, or taxonomy correction before learner promotion',
    pitfall: 'promoting taxonomy spillover or calling malignancy without invasion/reportable criteria required for the organ',
  },
  {
    match: /gastro|intestinal|liver|pancrea|biliary|colon|esophagus|stomach/i,
    comparator: 'normal mucosa, hepatobiliary tissue, pancreatic tissue, or expected biopsy compartment for the site',
    morphology: 'site, architecture, inflammation/activity, dysplasia, invasion, stromal response, and high-power cytology',
    mimic: 'reactive/regenerative change, infection, treatment effect, dysplasia, carcinoma, or site-specific inflammatory mimic',
    discriminator: 'architecture plus cytology, distribution, chronicity/activity, invasion, organism evidence, or precursor-lesion context',
    ancillary: 'special stains, IHC/molecular tests, dysplasia grade, margin/stage language, or management-relevant comment',
    pitfall: 'overcalling reactive atypia as dysplasia/cancer or failing to report activity, dysplasia, invasion, or staging consequence',
  },
  {
    match: /kidney|renal|genitourinary|urothelial|bladder|gu/i,
    comparator: 'normal renal compartment or urothelial tract anatomy appropriate to the specimen',
    morphology: 'glomerular/tubulointerstitial/vascular compartment or urothelial architecture, invasion, and cytologic atypia',
    mimic: 'reactive urothelial change, medical renal pattern mimic, treatment effect, inflammation, dysplasia, or invasive carcinoma',
    discriminator: 'compartment, chronicity/activity, invasion depth, IF/EM pattern, or urothelial staging threshold as applicable',
    ancillary: 'IF/EM, deeper levels, IHC, staging language, adequacy statement, or chronicity/activity classification',
    pitfall: 'missing adequacy, invasion, chronicity/activity, or treatment-effect context that changes management',
  },
  {
    match: /male reproductive|testis|prostate|penis|paratesticular/i,
    comparator: 'normal prostate, testis, paratesticular tissue, or penile epithelium appropriate to the path context',
    morphology: 'architecture, germ-cell or glandular lineage, stromal invasion, cytology, necrosis, and precursor lesion context',
    mimic: 'reactive atypia, benign mimics, lymphoma, sex cord-stromal tumor, germ-cell tumor component, or carcinoma variant',
    discriminator: 'age/serum marker context, lineage markers, invasion, component quantification, or grade/stage threshold',
    ancillary: 'lineage IHC, serum-marker correlation, grade group/stage/synoptic language, margin status, or component percentage',
    pitfall: 'missing mixed tumor components, lymphoma in older patients, invasion, or reporting elements that determine treatment',
  },
  {
    match: /pediatric|perinatal|placenta|fetal|neonatal|developmental/i,
    comparator: 'age-appropriate normal tissue, placental compartment, fetal membrane, cord, or developmental baseline',
    morphology: 'developmental stage, compartment, inflammation, vascular/malperfusion pattern, lesion distribution, and clinical timing',
    mimic: 'developmental variant, sampling artifact, infection, malperfusion, inflammatory lesion, or syndromic process',
    discriminator: 'gestational/age context, compartment-specific pattern, staging/grading when applicable, and maternal/fetal consequence',
    ancillary: 'placental diagnosis language, culture/special stains, genetic/syndromic correlation, or maternal/fetal risk comment',
    pitfall: 'using adult thresholds, ignoring gestational/age context, or omitting maternal/fetal consequence language',
  },
  {
    match: /soft|bone|joint|sarcoma/i,
    comparator: 'normal soft tissue, bone, cartilage, synovium, or radiology-gross baseline',
    morphology: 'growth pattern, matrix, cytology, mitotic activity, necrosis, interface, and radiology/gross correlation',
    mimic: 'reactive lesion, benign mesenchymal tumor, sarcoma, metastatic disease, or treatment effect',
    discriminator: 'matrix type, architecture, cytologic atypia, mitotic/necrosis threshold, and targeted molecular/IHC correlation',
    ancillary: 'lineage IHC, molecular confirmation, grade, margin, or staging language when it changes classification',
    pitfall: 'overcalling reactive lesions as sarcoma or undercalling malignancy when grade/margin/reporting language is required',
  },
  {
    match: /cyto|cytopathology|fluid|csf|fn[ae]/i,
    comparator: 'adequate benign cellular background for the specimen type and preparation',
    morphology: 'adequacy, cellularity, architecture, background, nuclear features, and diagnostic category',
    mimic: 'reactive atypia, contamination, degenerative change, low-cellularity sampling, or metastatic malignancy',
    discriminator: 'preparation type, adequacy, reproducible cytologic criteria, and clinicoradiologic correlation',
    ancillary: 'cell block IHC, flow cytometry, molecular testing, repeat sampling, or diagnostic-category language',
    pitfall: 'issuing an overconfident diagnosis from inadequate material or omitting category/adequacy language',
  },
  {
    match: /neuro|brain|mening|glial|spinal/i,
    comparator: 'normal neuroanatomic compartment, meninges, peripheral nerve, or expected surgical biopsy context',
    morphology: 'anatomic site, pattern, cytology, mitotic activity, necrosis, vascular proliferation, and infiltrative edge',
    mimic: 'reactive gliosis, metastasis, meningioma subtype, nerve sheath tumor, infection, or treatment effect',
    discriminator: 'site, molecular/IHC class-defining features, grade criteria, and integration of morphology with ancillary results',
    ancillary: 'CNS WHO integrated diagnosis, molecular testing, IHC, grade, or consultation language when required',
    pitfall: 'using morphology alone when integrated diagnosis or grade-defining molecular data are required',
  },
  {
    match: /head and neck|oral|salivary|sinonasal|jaw|larynx/i,
    comparator: 'normal mucosa, salivary gland, sinonasal tissue, jaw/oral cavity, or lymphoid background as appropriate',
    morphology: 'site, epithelial or salivary architecture, invasion, keratinization, stromal/myoepithelial pattern, and cytology',
    mimic: 'reactive squamous change, odontogenic lesion, salivary tumor mimic, infection, or metastatic disease',
    discriminator: 'site-specific architecture, invasion, HPV/EBV or lineage context, and targeted ancillary confirmation',
    ancillary: 'p16/HPV, EBV, salivary-lineage IHC, molecular fusion testing, margin/stage language, or clinicoradiologic correlation',
    pitfall: 'missing site-specific staging/viral association or overcalling reactive/inflammatory mimics as malignancy',
  },
  {
    match: /forensic|autopsy|injury|death/i,
    comparator: 'expected postmortem baseline with documented interval, scene, and clinical history',
    morphology: 'injury pattern, timing, distribution, competing disease, toxicologic context, and gross-micro correlation',
    mimic: 'postmortem artifact, resuscitation change, decomposition, natural disease, or nonspecific injury',
    discriminator: 'scene/clinical correlation, injury vital reaction, distribution, timing, and toxicology/ancillary support',
    ancillary: 'cause and manner language, toxicology, microbiology, radiology, or scene-investigation correlation',
    pitfall: 'overstating mechanism or manner without adequate autopsy, scene, and ancillary correlation',
  },
];

const defaultProfile = {
  comparator: 'normal or reactive comparator appropriate to the AP content-spec path',
  morphology: 'low-power pattern, high-power discriminator, site/context, and report-relevant limitation',
  mimic: 'closest reactive, benign, malignant, infectious, treatment-related, or artifact mimic from the same compartment',
  discriminator: 'the single feature or test result that separates the topic from its closest mimic',
  ancillary: 'targeted ancillary test, staging/synoptic element, adequacy language, or management-relevant report phrase',
  pitfall: 'calling the entity without the required discriminator, mimic exclusion, or report consequence',
};

function findBatchFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && BATCH_FILE_PATTERN.test(entry.name))
    .map((entry) => path.join(dir, entry.name))
    .sort((a, b) => path.basename(a).localeCompare(path.basename(b)));
}

function findExportedObjectText(source, filePath) {
  const exportMatch = source.match(/export\s+const\s+(apP0\w*CardBatch\d*)\s*=/);
  if (!exportMatch) throw new Error(`Could not find apP0*CardBatch export in ${path.relative(repoRoot, filePath)}`);

  const exportName = exportMatch[1];
  const objectStart = source.indexOf('{', exportMatch.index + exportMatch[0].length);
  if (objectStart === -1) throw new Error(`Could not find object literal for ${exportName}`);

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
      if (depth === 0) {
        return { exportName, objectText: source.slice(objectStart, index + 1), objectStart, objectEnd: index + 1 };
      }
    }
  }
  throw new Error(`Could not find object literal end for ${exportName}`);
}

function loadBatch(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');
  const parsed = findExportedObjectText(source, filePath);
  return {
    source,
    exportName: parsed.exportName,
    prefix: source.slice(0, parsed.objectStart),
    suffix: source.slice(parsed.objectEnd),
    batch: JSON.parse(parsed.objectText),
  };
}

function profileFor(card) {
  const text = `${card.category || ''} ${card.apSpecPath || ''} ${card.title || ''}`;
  return categoryProfiles.find((profile) => profile.match.test(text)) || defaultProfile;
}

function terminalPathParts(card) {
  return String(card.apSpecPath || card.title || '')
    .split('>')
    .map((part) => part.trim())
    .filter(Boolean);
}

function parentTopic(card) {
  const parts = terminalPathParts(card);
  return parts.length > 1 ? parts[parts.length - 2] : (card.category || 'the relevant AP category');
}

function firstSpecRoot(card) {
  return terminalPathParts(card)[0] || card.category || 'Anatomic Pathology';
}

function makeEntityCardDraft(card) {
  const profile = profileFor(card);
  const title = card.title;
  const parent = parentTopic(card);
  const root = firstSpecRoot(card);
  return {
    definition: `${title} is treated in this curriculum as an ABPath AP content-specification topic within ${parent}; learners should first confirm the specimen context, then decide whether the process is a true entity, pattern, specimen task, or reportable finding.`,
    normalComparator: `Compare against ${profile.comparator} before labeling the abnormality.`,
    morphologyAnchor: `Use ${profile.morphology} to decide whether the finding fits ${title}.`,
    topMimic: profile.mimic,
    discriminator: profile.discriminator,
    ancillaryOrReportingConsequence: profile.ancillary,
    safetyPitfall: profile.pitfall,
    sourceBasis: `Drafted from ABPath AP content-spec path: ${card.apSpecPath}. Source line: ${card.sourceLine}.`,
    scopedDomain: root,
  };
}

function makeRetrievalAnswerKey(card, draft) {
  return [
    {
      prompt: `Before reveal: name the entity or process represented by ${card.title}.`,
      answer: `${card.title}; scoped to ${parentTopic(card)} in the ABPath AP content specifications.`,
      reasoning: 'Start by naming the content-spec target and its organ-system location before adding details.',
    },
    {
      prompt: 'State one feature that must be present before calling it.',
      answer: draft.morphologyAnchor,
      reasoning: 'The learner must commit to an observable morphologic or workflow feature rather than a memorized label.',
    },
    {
      prompt: 'Name the closest mimic and the discriminator that separates them.',
      answer: `${draft.topMimic}; separate with ${draft.discriminator}.`,
      reasoning: 'Contrastive recall strengthens diagnostic discrimination and reduces common overcall/undercall errors.',
    },
    {
      prompt: 'Write the report or comment phrase that would matter clinically.',
      answer: draft.ancillaryOrReportingConsequence,
      reasoning: 'The close of the card must connect recognition to a report, staging, adequacy, ancillary, or safety action.',
    },
  ];
}

function makeVisualAnchorDraft(card, draft) {
  return {
    plan: card.visualAnchorPlan,
    inspectionSequence: [
      `Orient to ${draft.scopedDomain} and specimen context before magnifying.`,
      `Find the normal/reactive comparator: ${draft.normalComparator}`,
      `At low power and high power, test the morphology anchor: ${draft.morphologyAnchor}`,
      `Before sign-out, check the pitfall: ${draft.safetyPitfall}`,
    ],
    assetStatus: 'pending licensed/local image or explicit no-image rationale',
  };
}

function updateGate(gate, card) {
  if (gate.id === 'content-authoring') {
    return {
      ...gate,
      status: 'ready-for-review',
      evidence: 'Deterministic draft entity card content attached from ABPath path, organ-system profile, mimic/discriminator template, and report-consequence scaffold; requires faculty fact-check before canonical release.',
    };
  }
  if (gate.id === 'retrieval-key') {
    return {
      ...gate,
      status: 'ready-for-review',
      evidence: 'Draft retrieval answer key attached for entity/process, required feature, mimic discriminator, and report consequence; requires faculty review before learner answer reveal is canonical.',
    };
  }
  if (gate.id === 'visual-anchor') {
    return {
      ...gate,
      status: 'ready-for-review',
      evidence: `Visual inspection sequence attached; asset remains pending. Plan: ${card.visualAnchorPlan}`,
    };
  }
  return gate;
}

function readinessFor(gateStatuses) {
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
}

function batchReadinessFor(cards) {
  const summary = cards.reduce(
    (acc, card) => {
      acc.completedGates += card.readiness.completedGates;
      acc.reviewReadyGates += card.readiness.reviewReadyGates;
      acc.missingGates += card.readiness.missingGates;
      acc.totalGates += card.readiness.totalGates;
      return acc;
    },
    { completedGates: 0, reviewReadyGates: 0, missingGates: 0, totalGates: 0 },
  );
  return {
    ...summary,
    percentComplete: summary.totalGates ? Math.round((summary.completedGates / summary.totalGates) * 100) : 0,
    percentReviewReady: summary.totalGates
      ? Math.round(((summary.completedGates + summary.reviewReadyGates) / summary.totalGates) * 100)
      : 0,
  };
}

function enrichCard(card) {
  const entityCardDraft = makeEntityCardDraft(card);
  const retrievalAnswerKey = makeRetrievalAnswerKey(card, entityCardDraft);
  const visualAnchorDraft = makeVisualAnchorDraft(card, entityCardDraft);
  const gateStatuses = (card.gateStatuses || []).map((gate) => updateGate(gate, card));
  return {
    ...card,
    editorialStatus: card.editorialStatus === 'draft-scaffold' ? 'draft-content-ready-for-review' : card.editorialStatus,
    entityCardDraft,
    retrievalAnswerKey,
    visualAnchorDraft,
    completionGate: 'Not complete until drafted content, visual inspection plan, retrieval key, and taxonomy scaffold receive faculty QA plus citation/reviewer metadata.',
    gateStatuses,
    readiness: readinessFor(gateStatuses),
  };
}

function writeBatch(filePath, loaded, batch) {
  const output = `${loaded.prefix}${JSON.stringify(batch, null, 2)}${loaded.suffix}`;
  fs.writeFileSync(filePath, output);
}

function markdownTable(headers, rows) {
  return [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.join(' | ')} |`),
  ].join('\n');
}

const files = findBatchFiles(batchDir);
const batchReports = [];

for (const filePath of files) {
  const loaded = loadBatch(filePath);
  const cards = (loaded.batch.cards || []).map(enrichCard);
  const enrichedBatch = {
    ...loaded.batch,
    status: 'draft content attached; awaiting faculty review, citation, and asset/license completion',
    batchReadiness: batchReadinessFor(cards),
    cards,
  };
  writeBatch(filePath, loaded, enrichedBatch);
  batchReports.push({
    file: path.relative(repoRoot, filePath),
    batchName: enrichedBatch.batchName,
    cards: cards.length,
    readiness: enrichedBatch.batchReadiness,
  });
}

const totals = batchReports.reduce(
  (acc, report) => {
    acc.cards += report.cards;
    acc.completedGates += report.readiness.completedGates;
    acc.reviewReadyGates += report.readiness.reviewReadyGates;
    acc.missingGates += report.readiness.missingGates;
    acc.totalGates += report.readiness.totalGates;
    return acc;
  },
  { cards: 0, completedGates: 0, reviewReadyGates: 0, missingGates: 0, totalGates: 0 },
);

const summary = {
  ...totals,
  percentComplete: totals.totalGates ? Math.round((totals.completedGates / totals.totalGates) * 100) : 0,
  percentReviewReady: totals.totalGates
    ? Math.round(((totals.completedGates + totals.reviewReadyGates) / totals.totalGates) * 100)
    : 0,
};

const report = {
  generatedAt: new Date().toISOString(),
  rule: 'Attach deterministic draft entity-card content, retrieval answer keys, and visual inspection sequences to every AP P0 card while preserving faculty review as the canonical release gate.',
  files: batchReports,
  summary,
};

fs.mkdirSync(reportsDir, { recursive: true });
fs.writeFileSync(reportJsonPath, JSON.stringify(report, null, 2) + '\n');

const rows = batchReports.map((item) => [
  `\`${item.file}\``,
  item.cards,
  item.readiness.completedGates,
  item.readiness.reviewReadyGates,
  item.readiness.missingGates,
  `${item.readiness.percentReviewReady}%`,
]);

fs.writeFileSync(
  reportMdPath,
  `# AP P0 Card Content Enrichment

Generated: ${report.generatedAt}

Every AP P0 card now has a deterministic draft entity card, retrieval answer key, and visual inspection sequence. These are marked ready-for-review rather than complete because faculty source verification, image/license attachment, reviewer, and review date remain required before canonical release.

## Summary

- Cards enriched: ${summary.cards}
- Total gates: ${summary.totalGates}
- Complete gates: ${summary.completedGates}
- Review-ready gates: ${summary.reviewReadyGates}
- Missing gates: ${summary.missingGates}
- Review-ready percent: ${summary.percentReviewReady}%

## Batch Results

${markdownTable(['Batch file', 'Cards', 'Complete gates', 'Review-ready gates', 'Missing gates', 'Review-ready'], rows)}

## Remaining Gates

- Faculty review remains missing for every card until reviewer, review date, source citation, and editorial decision are attached.
- Visual anchors remain non-canonical until licensed/local assets or explicit no-image rationales are attached.
- Draft retrieval keys should be faculty checked before being treated as final answer keys.
`,
);

console.log(`Enriched ${summary.cards} AP P0 cards across ${batchReports.length} batch files.`);
console.log(`Review-ready gates: ${summary.reviewReadyGates}/${summary.totalGates}`);
console.log(`Wrote ${path.relative(repoRoot, reportMdPath)}`);
