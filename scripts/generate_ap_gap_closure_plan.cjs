const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const reportsDir = path.join(repoRoot, 'reports');
const gapPath = path.join(reportsDir, 'ap_spec_active_coverage_gap.json');
const appQueuePath = path.join(repoRoot, 'src/content/competency/apGapClosureQueue.ts');

if (!fs.existsSync(gapPath)) {
  throw new Error(`Missing gap input: ${gapPath}. Run the AP coverage gap report first.`);
}

const gapReport = JSON.parse(fs.readFileSync(gapPath, 'utf8'));
const missing = gapReport.missing || [];

const categoryLabels = {
  ap_breast: 'Breast',
  ap_gu: 'Medical Kidney / GU',
  ap_male_repro: 'Male Reproductive',
  ap_cv: 'Cardiovascular / Autopsy-adjacent',
  ap_hn: 'Head and Neck',
  ap_gi: 'Gastrointestinal',
  ap_endo: 'Endocrine',
  ap_placenta: 'Placenta',
  ap_resp: 'Respiratory / Thoracic',
  ap_soft: 'Soft Tissue, Bone, and Joint',
  ap_cyto: 'Cytopathology',
  ap_dermpath: 'Dermatopathology',
  ap_forensic: 'Forensic',
  ap_neuro: 'Neuropathology',
  ap_pediatric: 'Pediatric / Perinatal',
};

const rotationByCategory = {
  ap_breast: 'Breast pathology',
  ap_gu: 'Renal pathology / GU pathology',
  ap_male_repro: 'GU pathology',
  ap_cv: 'Autopsy, cardiovascular, and pulmonary pathology',
  ap_hn: 'Head and neck / endocrine pathology',
  ap_gi: 'GI pathology',
  ap_endo: 'Endocrine pathology',
  ap_placenta: 'Placenta/perinatal pathology',
  ap_resp: 'Thoracic pathology',
  ap_soft: 'Bone and soft tissue pathology',
  ap_cyto: 'Cytopathology',
  ap_dermpath: 'Dermatopathology',
  ap_forensic: 'Forensic/autopsy pathology',
  ap_neuro: 'Neuropathology',
  ap_pediatric: 'Pediatric pathology',
};

const artifactByCategory = {
  ap_cyto: ['image card', 'diagnostic criteria card', 'Bethesda-style report template', 'quick recognition quiz'],
  ap_forensic: ['scenario card', 'gross/photo checklist', 'death certificate/scene reasoning drill', 'safety/chain-of-custody QA checklist'],
  ap_placenta: ['gross orientation card', 'histology card', 'reporting checklist', 'maternal/fetal consequence one-liner'],
  ap_cv: ['gross-micro correlation card', 'autopsy clinicopathologic correlation drill', 'mechanism-of-death reasoning check', 'image/gross atlas entry'],
  ap_dermpath: ['pattern-first image card', 'mimic pair', 'interface/spongiotic/psoriasiform/vesiculobullous classifier item', 'spaced recognition quiz'],
  ap_neuro: ['neuroanatomy/context card', 'molecular/reporting checklist when relevant', 'atlas link or image card', 'differential discriminator'],
  default: ['entity card', 'representative image/gross or diagram', 'differential diagnosis card', 'sign-out or report element drill'],
};

function norm(value) {
  return String(value || '').toLowerCase();
}

function learnerLevel(row) {
  if (row.difficulty === 'C') return 'PGY1-PGY2';
  if (row.difficulty === 'AR') return 'PGY2-PGY4';
  if (row.difficulty === 'F') return 'PGY4-PGY5/Fellow';
  return 'PGY2-PGY4';
}

function priorityBand(row) {
  const text = norm(`${row.path} ${row.title}`);
  const coreCategory = ['ap_gu', 'ap_gi', 'ap_placenta', 'ap_resp', 'ap_soft', 'ap_cyto', 'ap_hn'].includes(row.categoryId);
  if (row.difficulty === 'C') return 'P0 core board/sign-out gap';
  if (row.difficulty === 'AR' && coreCategory) return 'P1 advanced resident gap';
  if (text.includes('report') || text.includes('staging') || text.includes('margin') || text.includes('glomerul')) return 'P1 reporting/safety gap';
  if (row.difficulty === 'AR') return 'P2 rotation depth gap';
  return 'P3 fellow/reference depth gap';
}

function complexity(row) {
  const text = norm(`${row.path} ${row.title}`);
  if (row.difficulty === 'F') return 'expert';
  if (text.includes('molecular') || text.includes('syndrome') || text.includes('classification') || text.includes('glomerul')) return 'high';
  if (row.difficulty === 'AR') return 'moderate';
  return 'core';
}

function learningTreatment(row) {
  const text = norm(`${row.path} ${row.title}`);
  if (row.difficulty === 'C') {
    return 'worked example -> image/gross recognition -> one-minute retrieval -> mixed contrast against common mimic';
  }
  if (text.includes('differential') || text.includes('tumor') || text.includes('carcinoma') || text.includes('lymphoma')) {
    return 'contrastive learning set with two near-misses, diagnostic threshold cue, and delayed mixed retrieval';
  }
  if (text.includes('report') || text.includes('staging') || text.includes('margin') || text.includes('glomerul')) {
    return 'case-to-report deliberate practice with checklist feedback, error recovery, and later re-signout';
  }
  return 'schema card, discriminating features, short-answer retrieval, and spaced review in organ-system block';
}

function assessment(row) {
  const text = norm(`${row.path} ${row.title}`);
  if (row.categoryId === 'ap_cyto') return 'Image-based adequacy/category call plus report-language check.';
  if (row.categoryId === 'ap_forensic') return 'Scenario-based mechanism/manner reasoning plus documentation checklist.';
  if (text.includes('glomerul') || text.includes('kidney')) return 'Pattern diagnosis, IF/EM correlation, and report adequacy rubric.';
  if (text.includes('placenta') || row.categoryId === 'ap_placenta') return 'Gross triage, lesion recognition, and maternal/fetal consequence short answer.';
  if (row.difficulty === 'F') return 'Consult-style short answer with molecular/clinical implication and confidence calibration.';
  return 'Five-item micro-assessment: recognition, key criterion, top mimic, ancillary/reporting action, safety-critical miss.';
}

function qaStandard(row) {
  const base = 'faculty-reviewed entity card with source/provenance, last-reviewed date, image license/status, and rubric anchor';
  if (row.difficulty === 'C') return `${base}; must be understandable without prior subspecialty rotation`;
  if (row.difficulty === 'F') return `${base}; requires subspecialist review or explicit fellow-level caveat`;
  return `${base}; must include at least one pitfall and one reporting consequence`;
}

function deliverables(row) {
  const items = artifactByCategory[row.categoryId] || artifactByCategory.default;
  return items.join('; ');
}

function closurePhase(row) {
  if (row.difficulty === 'C') return 'Phase 1: core resident coverage';
  if (priorityBand(row).startsWith('P1')) return 'Phase 2: advanced sign-out readiness';
  if (row.difficulty === 'AR') return 'Phase 3: rotation depth';
  return 'Phase 4: fellow/consult depth';
}

const rows = missing.map((row, index) => ({
  index: index + 1,
  categoryId: row.categoryId,
  category: categoryLabels[row.categoryId] || row.categoryId,
  rotation: rotationByCategory[row.categoryId] || 'AP integrated curriculum',
  difficulty: row.difficulty,
  learnerLevel: learnerLevel(row),
  priority: priorityBand(row),
  phase: closurePhase(row),
  complexity: complexity(row),
  title: row.title,
  path: row.path,
  deliverables: deliverables(row),
  learningTreatment: learningTreatment(row),
  assessment: assessment(row),
  qaStandard: qaStandard(row),
  sourceLine: row.sourceLine,
  topicId: row.topicId,
}));

const phaseSummary = rows.reduce((acc, row) => {
  acc[row.phase] ||= { total: 0, P0: 0, P1: 0, P2: 0, P3: 0 };
  acc[row.phase].total += 1;
  const priorityKey = row.priority.slice(0, 2);
  acc[row.phase][priorityKey] = (acc[row.phase][priorityKey] || 0) + 1;
  return acc;
}, {});

const categorySummary = rows.reduce((acc, row) => {
  acc[row.categoryId] ||= {
    category: row.category,
    total: 0,
    C: 0,
    AR: 0,
    F: 0,
    P0: 0,
    P1: 0,
    P2: 0,
    P3: 0,
  };
  const bucket = acc[row.categoryId];
  bucket.total += 1;
  bucket[row.difficulty] = (bucket[row.difficulty] || 0) + 1;
  const priorityKey = row.priority.slice(0, 2);
  bucket[priorityKey] = (bucket[priorityKey] || 0) + 1;
  return acc;
}, {});

const qualityEvaluation = [
  {
    domain: 'Coverage architecture',
    currentState: 'The AP spec is present as a broad syllabus and a subset has been promoted into active modules, tutorials, sign-out cases, GU/Breast/Neuro manifests, and image assets.',
    risk: 'Learners can see breadth but may not receive teachable, assessable practice for many entities, especially dermatopathology, cardiovascular/autopsy, neuro, endocrine, breast edge cases, and pediatric/perinatal pathology.',
    recommendation: 'Use this closure plan as the promotion queue: each row graduates only after entity card, visual anchor, assessment, QA metadata, and spaced retrieval hooks are present.',
  },
  {
    domain: 'Cognitive load',
    currentState: 'Current surfaces are image-rich and useful, but dense lists can behave like a library more than a guided sequence.',
    risk: 'PGY1-PGY2 learners may experience split attention and premature diagnostic closure without staged normal-to-abnormal scaffolding.',
    recommendation: 'For core entities, start with worked examples and one discriminating feature, then add mimic pairs and report implications after first retrieval success.',
  },
  {
    domain: 'Retrieval and retention',
    currentState: 'Assessment exists in quick checks, MCQs, visual challenges, and report rubrics, but spacing/interleaving are not yet systematic across the AP spec.',
    risk: 'Learners may recognize content during the lesson but lose transfer to mixed unknowns and sign-out.',
    recommendation: 'Attach every entity to a 1-3-7-21 day retrieval schedule, mix organ-system and pattern-based unknowns, and require free-response before reveal.',
  },
  {
    domain: 'Transfer to sign-out',
    currentState: 'Sign-out simulation is strong for selected specialties and cases.',
    risk: 'Entities without a report-language or safety-critical-miss drill may remain board-recognition knowledge rather than clinical competence.',
    recommendation: 'Every AR/F entity should include a case-to-report task, ancillary decision, top mimic, and attending-style feedback anchor.',
  },
  {
    domain: 'Trust and faculty governance',
    currentState: 'Some provenance and validation scaffolding exists, but not uniformly across all learner-facing content.',
    risk: 'Attending-level use will be limited unless source, review status, and editorial ownership are visible.',
    recommendation: 'Require reviewed/canonical status, source lineage, image license, last-reviewed date, and reviewer role before marking an entity complete.',
  },
  {
    domain: 'Specification hygiene',
    currentState: 'The normalized AP specification includes some parser artifacts and non-entity professional-practice rows that can inherit an organ-system path.',
    risk: 'A purely mechanical promotion queue could create awkward or misleading organ-system cards for topics that should be professionalism, lab management, or governance content.',
    recommendation: 'Before content generation, run each batch through taxonomy QA: entity, process, reporting task, professionalism/admin, or parser artifact. Parser artifacts should be corrected or excluded from entity completion metrics.',
  },
];

const plan = {
  generatedAt: new Date().toISOString(),
  inputGapReport: path.relative(repoRoot, gapPath),
  objective: 'Close every active-teaching gap between the normalized AP content specification and P@thfndr didactics.',
  completionDefinition: [
    'Entity is discoverable through competency matrix and organ-system navigation.',
    'Entity has a concise entity card with morphology, differential, ancillary/reporting consequence, and pitfall.',
    'Entity has a visual anchor: licensed/local image, gross photo, diagram, or explicit no-image rationale.',
    'Entity has at least one retrieval item; AR/F entities also have a case/report or consult drill.',
    'Entity has trust metadata: source/provenance, author/reviewer status, last-reviewed date, and difficulty mapping.',
  ],
  totals: {
    missingEntities: rows.length,
    phases: phaseSummary,
    categories: categorySummary,
  },
  qualityEvaluation,
  rows,
};

fs.writeFileSync(path.join(reportsDir, 'ap_gap_closure_plan.json'), JSON.stringify(plan, null, 2));

const csvHeader = [
  'index',
  'categoryId',
  'category',
  'rotation',
  'difficulty',
  'learnerLevel',
  'priority',
  'phase',
  'complexity',
  'title',
  'path',
  'deliverables',
  'learningTreatment',
  'assessment',
  'qaStandard',
  'sourceLine',
  'topicId',
];

const csvEscape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
const csv = [
  csvHeader.join(','),
  ...rows.map((row) => csvHeader.map((key) => csvEscape(row[key])).join(',')),
].join('\n');
fs.writeFileSync(path.join(reportsDir, 'ap_gap_closure_plan.csv'), csv);

const categoryRows = Object.entries(categorySummary)
  .sort((a, b) => b[1].total - a[1].total)
  .map(([id, summary]) => `| ${summary.category} (${id}) | ${summary.total} | ${summary.C || 0} | ${summary.AR || 0} | ${summary.F || 0} | ${summary.P0 || 0} | ${summary.P1 || 0} | ${summary.P2 || 0} | ${summary.P3 || 0} |`)
  .join('\n');

const phaseRows = Object.entries(phaseSummary)
  .map(([phase, summary]) => `| ${phase} | ${summary.total} | ${summary.P0 || 0} | ${summary.P1 || 0} | ${summary.P2 || 0} | ${summary.P3 || 0} |`)
  .join('\n');

const qualityMd = qualityEvaluation
  .map((item) => `### ${item.domain}\n\n- Current state: ${item.currentState}\n- Risk: ${item.risk}\n- Recommendation: ${item.recommendation}`)
  .join('\n\n');

const topRows = rows
  .filter((row) => row.priority.startsWith('P0') || row.priority.startsWith('P1'))
  .slice(0, 40)
  .map((row) => `| ${row.priority} | ${row.category} | ${row.difficulty} | ${row.path} | ${row.deliverables} |`)
  .join('\n');

const md = `# AP Content Specification Gap-Closure Plan

Generated: ${plan.generatedAt}

Objective: ${plan.objective}

## Completion Definition

${plan.completionDefinition.map((item) => `- ${item}`).join('\n')}

## Executive Summary

- Missing AP entities requiring active teaching promotion: ${rows.length}
- Phase 1 core resident coverage: ${phaseSummary['Phase 1: core resident coverage']?.total || 0}
- Phase 2 advanced sign-out readiness: ${phaseSummary['Phase 2: advanced sign-out readiness']?.total || 0}
- Phase 3 rotation depth: ${phaseSummary['Phase 3: rotation depth']?.total || 0}
- Phase 4 fellow/consult depth: ${phaseSummary['Phase 4: fellow/consult depth']?.total || 0}

## Phase Summary

| Phase | Entities | P0 | P1 | P2 | P3 |
|---|---:|---:|---:|---:|---:|
${phaseRows}

## Category Summary

| Category | Missing | C | AR | F | P0 | P1 | P2 | P3 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
${categoryRows}

## First 40 P0/P1 Rows

The complete row-level plan is in \`reports/ap_gap_closure_plan.csv\` and \`reports/ap_gap_closure_plan.json\`.

| Priority | Category | Difficulty | Entity Path | Deliverables |
|---|---|---|---|---|
${topRows}

## Quality Evaluation

${qualityMd}

## Learning Theory Upgrade Pattern

Use this pattern for every row before marking the entity complete:

1. Pretraining: define the specimen/site context and two vocabulary terms before showing abnormal morphology.
2. Worked example: show one clean example with labels and an attending-style reasoning narration.
3. Contrastive pair: compare against the nearest mimic or normal/reactive pattern.
4. Retrieval before reveal: ask for diagnosis, one criterion, top mimic, and report/ancillary consequence before showing answer.
5. Elaboration: connect morphology to mechanism, clinical consequence, or staging/reporting requirement.
6. Spacing: resurface at 1, 3, 7, and 21 days with increasing interleaving.
7. Transfer: require a mixed unknown or sign-out/report task before the entity leaves remediation.
8. Calibration: ask learner confidence and show miss-cost/safety-critical feedback when relevant.

## Governance

- P0 rows are not complete until a faculty-reviewed core card, image/gross anchor, and retrieval item exist.
- P1 rows require a report-language or ancillary-decision drill.
- P2 rows require rotation-track placement and at least one mimic/near-miss.
- P3 rows may be fellow/reference depth, but must carry explicit difficulty and consult-level caveats.
- Every entity should expose provenance, review status, last-reviewed date, and image/license status in-app.
`;

fs.writeFileSync(path.join(reportsDir, 'ap_gap_closure_plan.md'), md);

const p0Rows = rows.filter((row) => row.priority.startsWith('P0'));
const p1Rows = rows.filter((row) => row.priority.startsWith('P1'));
const appQueue = {
  generatedAt: plan.generatedAt,
  sourceReport: 'reports/ap_gap_closure_plan.json',
  definition: 'P0 rows are core AP content-spec entities missing from active teaching surfaces. Each row requires an entity card, visual/gross anchor, retrieval item, and QA metadata before it can be considered closed.',
  totals: {
    allMissing: rows.length,
    p0: p0Rows.length,
    p1: p1Rows.length,
    p2: rows.filter((row) => row.priority.startsWith('P2')).length,
    p3: rows.filter((row) => row.priority.startsWith('P3')).length,
  },
  categorySummary: Object.fromEntries(
    Object.entries(categorySummary).map(([categoryId, summary]) => [
      categoryId,
      {
        category: summary.category,
        missing: summary.total,
        p0: summary.P0 || 0,
        p1: summary.P1 || 0,
        p2: summary.P2 || 0,
        p3: summary.P3 || 0,
      },
    ]),
  ),
  p0Rows: p0Rows.map((row) => ({
    id: `${row.categoryId}-${row.topicId}`,
    categoryId: row.categoryId,
    category: row.category,
    rotation: row.rotation,
    title: row.title,
    path: row.path,
    difficulty: row.difficulty,
    learnerLevel: row.learnerLevel,
    priority: row.priority,
    deliverables: row.deliverables,
    learningTreatment: row.learningTreatment,
    assessment: row.assessment,
    qaStandard: row.qaStandard,
    sourceLine: row.sourceLine,
    topicId: row.topicId,
  })),
  qualityGates: [
    'Taxonomy QA confirms row is true entity/process/reporting task rather than parser artifact.',
    'Entity card includes morphology, differential, ancillary/reporting consequence, pitfall, and learner level.',
    'Visual anchor is licensed/local, generated diagram, gross schematic, or explicit no-image rationale.',
    'Retrieval item requires free response before reveal and is scheduled for 1, 3, 7, and 21 day review.',
    'Faculty review status, source lineage, image/license status, and last-reviewed date are visible in-app.',
  ],
};

const appQueueTs = `// Generated by scripts/generate_ap_gap_closure_plan.cjs. Do not edit by hand.

export const apGapClosureQueue = ${JSON.stringify(appQueue, null, 2)} as const;

export type ApGapClosureQueueRow = typeof apGapClosureQueue.p0Rows[number];
`;

fs.writeFileSync(appQueuePath, appQueueTs);

console.log(JSON.stringify({
  missingEntities: rows.length,
  outputs: [
    'reports/ap_gap_closure_plan.md',
    'reports/ap_gap_closure_plan.csv',
    'reports/ap_gap_closure_plan.json',
    'src/content/competency/apGapClosureQueue.ts',
  ],
}, null, 2));
