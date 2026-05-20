#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const cpSpecPath = path.join(root, 'src/content/downloads_imports/raw/cp_content_specification_11_11_25.raw.json');
const cpBatchPath = path.join(root, 'src/content/downloads_imports/raw/cp_content_specification_batch_ready.raw.json');
const apLectureContractPath = path.join(root, 'src/content/lectures/lectureAbpathContracts.json');
const cpInteractiveTutorialsPath = path.join(root, 'src/content/tutorials/clinicalPathInteractiveTutorials.json');
const validatedManifestPath = path.join(root, 'src/content/tutorials/validatedMappingsManifest.json');
const tutorialCoveragePath = path.join(root, 'reports/tutorial_abpath_spec_coverage.json');
const activeCurriculumPath = path.join(root, 'src/content/curriculum/activeCurriculum.ts');
const algorithmsPath = path.join(root, 'src/content/algorithms/algorithms.normalized.json');

const journeyJsonPath = path.join(root, 'reports/content_consumption_journey_evaluation.json');
const journeyMdPath = path.join(root, 'reports/content_consumption_journey_evaluation.md');
const worldContractPath = path.join(root, 'src/content/contracts/worldClassFreeResourceContract.json');
const cpContractPath = path.join(root, 'src/content/clinical_pathology/cpContentContracts.json');
const learningUxContractPath = path.join(root, 'src/content/contracts/pthfndrDidacticsLearningUxContract.json');
const cpReportPath = path.join(root, 'reports/clinical_pathology_contract_parameters.md');
const cpCsvPath = path.join(root, 'reports/clinical_pathology_contract_parameters.csv');

const ensureDir = (filePath) => fs.mkdirSync(path.dirname(filePath), { recursive: true });
const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const readText = (filePath) => fs.readFileSync(filePath, 'utf8');

const extractModuleAlgorithmTopics = (curriculumText, moduleId) => {
  const match = curriculumText.match(new RegExp(`moduleId: '${moduleId}'[\\s\\S]*?algorithmTopics: \\[(.*?)\\]`));
  if (!match) {
    return [];
  }
  return [...match[1].matchAll(/'([^']+)'/g)].map((entry) => entry[1]);
};

const countImplementedAlgorithmRoutes = (algorithms, topics) => {
  const normalizedTopics = topics.map((topic) => topic.toLowerCase());
  return algorithms.filter((algorithm) => {
    const haystack = `${algorithm.title || ''} ${algorithm.patternFamily || ''} ${algorithm.category || ''}`.toLowerCase();
    return normalizedTopics.some((topic) => haystack.includes(topic));
  }).length;
};

const journeyDefinitions = [
  {
    id: 'lecture_first_questions',
    name: 'Lecture-first didactic consumption',
    pathway: ['Home', 'Open lectures', 'Core principles', 'Breast Pathology: Core Principles', 'Questions'],
    observedStrengths: [
      'Six top lecture sections are visible after the ABPath lecture fillout.',
      'Questions tab now combines oral recall, morphology checks, flashcards, and MCQs.',
      'The learner can move from ABPath objective to retrieval practice without leaving the lecture.',
    ],
    observedWeaknesses: [
      'Lecture tabs use app-specific labels such as Diagnostic Approach and Diagnostic Criteria rather than the same terms used in the contract JSON.',
      'Image-pending lectures still rely on checklist scaffolds until faculty-approved assets are attached.',
    ],
    opportunities: [
      'Add a visible contract badge showing content area, ABPath anchors, and promotion gate status.',
      'Add spaced-review scheduling from completed flashcards and quick checks.',
    ],
    threats: [
      'If generated scaffolds are mistaken for faculty-reviewed images, learner trust erodes.',
      'Large lecture libraries can become a content shelf unless recommended sequencing is explicit.',
    ],
    deterministicGates: [
      'All six lecture tabs render for every promoted lecture.',
      'Every lecture has at least five scoped objectives and five specification anchors unless explicitly waived.',
      'Questions must test recognition, differential logic, ancillary appropriateness, and report consequence.',
    ],
  },
  {
    id: 'curriculum_first_ap',
    name: 'Curriculum-first AP rotation consumption',
    pathway: ['Learn', 'Pathology Curriculum', 'AP filter or Start Here card', 'Module detail', 'Lecture/Tutorial/Image/Practice route'],
    observedStrengths: [
      'Curriculum modules expose canonical versus buildout state.',
      'AP modules link learners to lectures, images, tutorials, and practice rather than a single reading page.',
      'Module metadata already carries PGY level, priority, pattern family, and specimen context.',
    ],
    observedWeaknesses: [
      'Duplicate visible text such as Breast Core Module creates ambiguous click targets and can confuse screen-reader or automation workflows.',
      'Some buildout modules list planned assets before the route has content parity.',
    ],
    opportunities: [
      'Make each module a contract card with route completeness, level, and source-spec conformance.',
      'Add a progress rail: orientation, learn, inspect, apply, remediate.',
    ],
    threats: [
      'Learners may assume staged modules are complete if buildout status is visually secondary.',
      'A broad curriculum map can bury the best next action for a busy resident.',
    ],
    deterministicGates: [
      'Every canonical module must have at least one active route in lecture/tutorial/image/practice.',
      'Every staged module must show missing route categories and not appear as complete.',
      'Each module must declare learner level, competency domain, and source-spec role.',
    ],
  },
  {
    id: 'clinical_path_curriculum',
    name: 'Clinical Pathology curriculum consumption',
    pathway: ['Home or Learn', 'Pathology Curriculum', 'CP filter', 'Clinical Pathology Foundations', 'Tutorial or practice'],
    observedStrengths: [
      'CP is present as a first-class curriculum filter and includes foundations, hematology, coagulation, and transfusion modules.',
      'CP modules route to clinical-path tutorials instead of being mixed silently with AP content.',
      'Competency matrix already frames CP using consultation, laboratory leadership, and performance-in-practice language.',
    ],
    observedWeaknesses: [
      'CP lacks the lecture-level contract rigor now present for AP lectures.',
      'CP image/library routes are less naturally aligned to laboratory medicine tasks than AP histology routes.',
      'The current CP entry path is less obvious from Home than the AP masterclass lecture route.',
    ],
    opportunities: [
      'Promote CP contracts by domain: transfusion, hematopathology, microbiology, and chemical pathology.',
      'Make CP practice case types operational: consult call, result interpretation, test utilization, QC/PT event, and blood bank reaction workup.',
    ],
    threats: [
      'If CP remains tutorial-only, it will feel like board prep rather than laboratory medicine training.',
      'Without deterministic operational cases, CP cannot credibly become world-class.',
    ],
    deterministicGates: [
      'Each CP domain must map to source-spec anchors, consultation tasks, assessment types, and safety-critical actions.',
      'CP modules must include operational scenarios, not only explanatory tutorials.',
      'Blood bank/transfusion and coagulation content must include escalation and patient-safety gates.',
    ],
  },
  {
    id: 'competency_remediation',
    name: 'Competency and remediation consumption',
    pathway: ['Competency', 'PGY level mode', 'Domain filter', 'Gap or available module', 'Open linked route'],
    observedStrengths: [
      'PGY1 through attending modes are visible and operational.',
      'The matrix lists source standards and ties AP/CP documents to learner-level expectations.',
      'P0 gap queues and deterministic sign-out rubric appear in the same learner/faculty surface.',
    ],
    observedWeaknesses: [
      'Competency matrix is dense and faculty-facing; novice users may need a simpler learner view.',
      'Available-now versus gap state can be visually overwhelmed by the amount of metadata.',
    ],
    opportunities: [
      'Add a resident dashboard showing only next three actions and one remediation path.',
      'Add faculty calibration mode with assignment, review, and export states.',
    ],
    threats: [
      'A world-class free resource needs trust; dense matrices without editorial state can feel opaque.',
      'If learner performance does not feed back into remediation, competency mapping remains static.',
    ],
    deterministicGates: [
      'Each competency record must declare learner level, domain, source type, route, availability, gap summary, and closure action.',
      'Every gap must have an executable next action and owner type: content, image, assessment, QA, or faculty.',
      'Every assessment route must write evidence back to the competency model.',
    ],
  },
  {
    id: 'reference_atlas_consumption',
    name: 'Reference/image atlas consumption',
    pathway: ['Images', 'Reference Library', 'Image set', 'Focused review', 'Source/provenance'],
    observedStrengths: [
      'Reference Library aggregates lecture microscopy, histology sets, granulomatous disease images, and sign-out images.',
      'The sign-out library reports 72 of 72 local case images with zero missing.',
      'Focused review groups support differential comparison.',
    ],
    observedWeaknesses: [
      'ABPath/CP contract anchors are not visible on the reference library landing surface.',
      'CP laboratory medicine is not naturally represented by static histology image sets.',
    ],
    opportunities: [
      'Add image QA badges: source, license, stain/modality, magnification, reviewed status, linked contract.',
      'Add CP visual/interpretive assets: smear fields, gel cards, electropherograms, antibiograms, QC charts, chemistry delta checks.',
    ],
    threats: [
      'Unclear provenance is the fastest route to loss of learner and faculty trust.',
      'Image-heavy AP design does not automatically translate to CP.',
    ],
    deterministicGates: [
      'Every promoted image must declare source, local path, modality/stain, diagnosis certainty, and reviewed status.',
      'Every image set must link to at least one curriculum or lecture contract.',
      'CP assets must include interpretive artifacts beyond histology.',
    ],
  },
  {
    id: 'signout_practice_consumption',
    name: 'Sign-out practice consumption',
    pathway: ['Sign-Out', 'Subspecialty Sign-Out or General Unknown', 'Image-first case', 'Ancillary/report drafting', 'Feedback'],
    observedStrengths: [
      'The sign-out simulator offers subspecialty and general unknown entry points.',
      'The product already has AP sign-out contracts and validation scripts.',
      'Practice follows the intended learn-study-apply mental model from the sidebar.',
    ],
    observedWeaknesses: [
      'The sign-out landing page is sparse relative to the depth claimed in underlying contracts.',
      'CP consult workflows do not yet have an equivalent sign-out/consult simulator.',
    ],
    opportunities: [
      'Expose case queue depth, learner level, workflow type, and entrustment target before launching.',
      'Build CP consult simulator lanes for transfusion reaction, coagulation workup, antimicrobial interpretation, and chemistry result adjudication.',
    ],
    threats: [
      'If validated contract depth is not visible at the route, learners may underuse the strongest part of the app.',
      'AP-only practice could make CP feel secondary.',
    ],
    deterministicGates: [
      'Every sign-out lane must declare workflow type, case count, image readiness, report rubric, and feedback mode.',
      'PGY4+ queues must include timed prioritization and entrustment scoring.',
      'CP consult lanes must include patient-safety escalation and laboratory stewardship decisions.',
    ],
  },
  {
    id: 'short_assessment_consumption',
    name: 'Short assessment and visual reset consumption',
    pathway: ['Home or Curriculum', 'Visual drill or CP checks', 'Question/case', 'Immediate feedback', 'Return to route'],
    observedStrengths: [
      'Home exposes visual drill and CP checks as assessment routes.',
      'Lecture questions now support quick retrieval rather than passive reading.',
      'Competency records can route learners back to the relevant surface.',
    ],
    observedWeaknesses: [
      'Visual drill is less visible from the simplified sidebar than lectures/images/sign-out.',
      'Assessment evidence is not yet presented as longitudinal memory consolidation.',
    ],
    opportunities: [
      'Add daily five-minute queue: one image, one CP consult question, one flashcard, one report phrase.',
      'Use spaced repetition and interleaving across AP/CP domains.',
    ],
    threats: [
      'Without memory scheduling, quick checks become one-off quizzes rather than durable learning.',
      'If feedback is generic, world-class aspirations collapse into ordinary board-review behavior.',
    ],
    deterministicGates: [
      'Every quick assessment must map to a contract, competency domain, and next remediation route.',
      'Every completed item must produce a spaced-review due date.',
      'Feedback must identify the missed discriminator and the next safest action.',
    ],
  },
];

const summarizeSwot = (journeys) => ({
  strengths: [
    'The app already has a coherent learn-study-apply shell with lectures, curriculum, competency, images, and sign-out practice.',
    'AP lecture tabs now support ABPath-scoped objectives, algorithms, microscopy plans, criteria, questions, and transcript access.',
    'Competency matrix bridges PGY level, AP/CP source standards, and gap closure.',
    'The reference/sign-out image footprint is substantial and locally governed.',
  ],
  weaknesses: [
    'Navigation labels and route depth are not always explicit enough for first-time users.',
    'CP exists but is not yet governed with the same route-level contract rigor as AP.',
    'Faculty QA, provenance badges, and learner analytics are not yet first-class across every pathway.',
    'Some staged content can appear close to canonical unless contract state is made visible.',
  ],
  opportunities: [
    'Create contract badges and route-readiness gates for every learner-facing surface.',
    'Build CP consult simulation as a first-class counterpart to AP sign-out.',
    'Add memory consolidation: spaced repetition, interleaving, short daily queues, and remediation routing.',
    'Make the free-resource promise concrete through transparent provenance, editorial status, and reproducible validators.',
  ],
  threats: [
    'A free resource can still fail if users cannot distinguish reviewed content from generated scaffolds.',
    'AP image-first excellence may not translate to CP without operational laboratory artifacts.',
    'Large content volume can overwhelm PGY1/PGY2 learners unless defaults are tightly staged.',
    'Trust depends on visible source, review, and update status.',
  ],
  executionImplication:
    'World-class execution should be deterministic: every route must declare scope, source anchors, learner level, required assets, assessment evidence, remediation path, and validation command before promotion.',
});

const flattenCpTopics = (roots) => {
  const output = [];
  const visit = (node, ancestors = []) => {
    const pathParts = [...ancestors, node.title].filter(Boolean);
    output.push({
      id: node.id,
      title: node.title,
      level: node.level || 'C',
      path: pathParts.join(' > '),
    });
    (node.children || []).forEach((child) => visit(child, pathParts));
  };
  roots.forEach((root) => visit(root));
  return output;
};

const cpDomainRules = {
  bb: {
    contentArea: 'Blood Banking/Transfusion Medicine',
    consultationTasks: ['transfusion reaction triage', 'product selection', 'compatibility testing', 'cell/tissue therapy stewardship'],
    operationalArtifacts: ['DAT panel', 'clerical check', 'unit segment testing', 'antibody screen', 'RhIg calculation', 'massive transfusion decision'],
    safetyCriticalActions: ['stop transfusion', 'notify blood bank/clinical team', 'confirm patient/unit identity', 'escalate suspected hemolysis or TRALI/TACO'],
    minimums: { sourceAnchors: 10, tutorials: 5, mcqs: 10, flashcards: 20, operationalCases: 5 },
  },
  hp: {
    contentArea: 'Hematopathology / Laboratory Hematology',
    consultationTasks: ['CBC/smear interpretation', 'coagulation correlation', 'flow/cytogenetic/molecular triage', 'bone marrow workup'],
    operationalArtifacts: ['peripheral smear', 'CBC histogram', 'coagulation panel', 'flow cytometry plot', 'bone marrow differential'],
    safetyCriticalActions: ['recognize blasts/acute leukemia flags', 'escalate TTP/DIC/APL concern', 'recommend confirmatory testing'],
    minimums: { sourceAnchors: 5, tutorials: 1, mcqs: 3, flashcards: 6, operationalCases: 5 },
  },
  mb: {
    contentArea: 'Clinical Microbiology',
    consultationTasks: ['specimen adequacy', 'Gram stain/culture interpretation', 'molecular/serologic test utilization', 'antimicrobial stewardship'],
    operationalArtifacts: ['Gram stain', 'culture plate', 'PCR result', 'antibiogram', 'O&P morphology', 'AFB/fungal workup'],
    safetyCriticalActions: ['critical organism notification', 'infection-control escalation', 'avoid low-value tests from poor specimens'],
    minimums: { sourceAnchors: 5, tutorials: 1, mcqs: 5, flashcards: 10, operationalCases: 5 },
  },
  mi: {
    contentArea: 'Management and Informatics',
    consultationTasks: ['QC interpretation', 'validation-versus-verification oversight', 'LIS/workflow redesign', 'finance-aware laboratory planning'],
    operationalArtifacts: ['QC chart', 'Westgard pattern', 'validation plan', 'LIS workflow', 'budget worksheet', 'patient-safety vignette'],
    safetyCriticalActions: ['hold unsafe patient results', 'escalate workflow or reporting risk', 'correct high-yield pre-analytic or informatics failures'],
    minimums: { sourceAnchors: 10, tutorials: 5, mcqs: 10, flashcards: 10, operationalCases: 5 },
  },
  cp: {
    contentArea: 'Chemical Pathology',
    consultationTasks: ['critical value adjudication', 'delta check interpretation', 'method interference recognition', 'test utilization'],
    operationalArtifacts: ['chemistry panel', 'QC chart', 'calibration/linearity record', 'toxicology result', 'endocrine/metabolic panel'],
    safetyCriticalActions: ['verify critical results', 'recognize assay interference', 'recommend repeat/alternate method when needed'],
    minimums: { sourceAnchors: 8, tutorials: 1, mcqs: 5, flashcards: 10, operationalCases: 5 },
  },
};

const summarizeAssessmentDeficits = (counts, minimums) => {
  const deficits = [];
  if ((counts.tutorials || 0) < minimums.tutorials) {
    deficits.push(`tutorials ${counts.tutorials || 0}/${minimums.tutorials}`);
  }
  if ((counts.mcqs || 0) < minimums.mcqs) {
    deficits.push(`MCQs ${counts.mcqs || 0}/${minimums.mcqs}`);
  }
  if ((counts.flashcards || 0) < minimums.flashcards) {
    deficits.push(`flashcards ${counts.flashcards || 0}/${minimums.flashcards}`);
  }
  return deficits;
};

const classifyCpBuildoutStatus = ({ sourceAnchorCount, minimums, sourceRealizationMode, counts }) => {
  if (sourceAnchorCount < minimums.sourceAnchors) {
    return 'source-thin scaffold';
  }
  if (sourceRealizationMode === 'native-spec-root') {
    return 'promotion-ready seed depth';
  }
  const assessmentDeficits = summarizeAssessmentDeficits(counts, minimums);
  return assessmentDeficits.length === 0 ? 'promotion-ready seed depth' : 'governed recovery scaffold';
};

const makeCpContracts = () => {
  const cpSpec = readJson(cpSpecPath);
  const batchTutorials = readJson(cpBatchPath);
  const cpInteractiveTutorials = readJson(cpInteractiveTutorialsPath);
  const validatedManifest = readJson(validatedManifestPath);
  const tutorialCoverage = readJson(tutorialCoveragePath);
  const activeCurriculum = readText(activeCurriculumPath);
  const algorithms = readJson(algorithmsPath);
  const topics = flattenCpTopics(cpSpec.SYLLABUS_DATA);
  const mcqs = cpSpec.MCQS || [];
  const flashcards = cpSpec.FLASHCARDS || [];
  const tutorialData = cpSpec.TUTORIAL_DATA || {};
  const generatedDomains = cpSpec.SYLLABUS_DATA.map((root) => {
    const rule = cpDomainRules[root.id];
    const domainTopics = topics.filter((topic) => topic.id === root.id || topic.id?.startsWith(`${root.id}-`));
    const domainTutorials = batchTutorials.filter((item) => {
      const haystack = `${item.topic} ${item.tutorial?.title || ''}`.toLowerCase();
      return root.id === 'bb'
        ? /blood|transfusion|platelet|hla|tissue|anticoag|coag|hemolytic|rhig/i.test(haystack)
        : root.id === 'mi'
          ? /management|informatics|quality|westgard|validation|verification|lis|budget|safety/i.test(haystack)
        : haystack.includes(rule.contentArea.toLowerCase().split('/')[0]);
    });
    const availableTutorialCount =
      domainTutorials.length + Object.values(tutorialData).filter((item) => item?.topicId?.startsWith(root.id)).length;
    const availableMcqCount = mcqs.filter((item) => String(item.topicId || '').startsWith(root.id)).length;
    const availableFlashcardCount = flashcards.filter((item) => String(item.topicId || '').startsWith(root.id)).length;
    const buildoutStatus = classifyCpBuildoutStatus({
      sourceAnchorCount: domainTopics.length,
      minimums: rule.minimums,
      sourceRealizationMode: 'native-spec-root',
      counts: {
        tutorials: availableTutorialCount,
        mcqs: availableMcqCount,
        flashcards: availableFlashcardCount,
      },
    });
    const contractWarnings =
      domainTopics.length >= rule.minimums.sourceAnchors
        ? []
        : [
            `Current structured CP seed provides ${domainTopics.length} source anchors; add deeper source anchors and operational cases before canonical launch.`,
          ];

    return {
      domainId: root.id,
      contentArea: rule.contentArea,
      buildoutStatus,
      contractWarnings,
      sourceSpecRoot: root.title,
      sourceRealizationMode: 'native-spec-root',
      sourceAnchorBasis: 'raw-cp-spec-root',
      representativeAnchorBasis: 'raw-cp-spec-root',
      tutorialCountBasis: 'batch-plus-raw-tutorial-data',
      availableInteractiveTutorialCount: availableTutorialCount,
      availableGovernedTutorialRowCount: 0,
      levelMix: Array.from(new Set(domainTopics.map((topic) => topic.level))).sort(),
      sourceAnchorCount: domainTopics.length,
      representativeAnchors: domainTopics.slice(0, 12),
      availableTutorialCount,
      availableMcqCount,
      availableFlashcardCount,
      contractParameters: {
        scope: [
          `Keep content scoped to ${rule.contentArea}.`,
          'Teach laboratory medicine as consultation and operations, not as isolated fact recall.',
          'Declare C/AR/F level and rotation context for every promoted CP asset.',
        ],
        consumptionPathways: [
          'Curriculum module -> tutorial -> operational artifact -> consult question -> remediation.',
          'Competency matrix -> CP domain -> case/consult -> faculty or answer-key feedback.',
          'Daily review queue -> CP artifact interpretation -> spaced recall.',
        ],
        requiredAssets: [
          ...rule.operationalArtifacts,
          'case vignette with clinical decision point',
          'deterministic answer key with escalation threshold',
        ],
        assessmentGates: [
          'Recognition of the specimen/result/artifact.',
          'Correct interpretation with limitations.',
          'Appropriate next test or product recommendation.',
          'Critical value or patient-safety escalation when indicated.',
          'Clear consult note or laboratory communication.',
        ],
        safetyCriticalActions: rule.safetyCriticalActions,
        minimums: rule.minimums,
      },
      promotionGate:
        'Promote when source anchors, tutorial/assessment assets, operational artifacts, safety actions, and remediation routing all pass validation.',
    };
  });

  const hasManagementDomain = generatedDomains.some((domain) => domain.domainId === 'mi');
  if (hasManagementDomain) {
    return generatedDomains;
  }

  const miRule = cpDomainRules.mi;
  const miCoverage = (tutorialCoverage.coverage?.byRoot || []).find(
    (row) => row.root === 'Management and Informatics' && row.domain === 'CP'
  );
  const miInteractiveTutorials = cpInteractiveTutorials.filter(
    (row) => row.cpGovernance?.abpathRootTopic === 'Management and Informatics'
  );
  const miValidatedRows = (validatedManifest.rows || []).filter(
    (row) =>
      row.canonicalForId &&
      row.validatedForPromotion &&
      row.abpathRoot === 'Management and Informatics'
  );
  const representativeAnchors = Array.from(
    new Map(
      miValidatedRows
        .map((row, index) => [
          row.abpathPrimaryPath,
          {
            id: `mi-derived-${index + 1}`,
            title: String(row.abpathPrimaryPath || 'Management and Informatics').split(' > ').at(-1) || 'Management and Informatics',
            level: 'C',
            path: row.abpathPrimaryPath || 'Management and Informatics',
          },
        ])
        .filter(([pathValue]) => Boolean(pathValue))
    ).values()
  ).slice(0, 12);
  const miAvailableInteractiveTutorialCount = miInteractiveTutorials.length;
  const miAvailableGovernedTutorialRowCount = miValidatedRows.length;
  const miAvailableTutorialCount = miAvailableInteractiveTutorialCount;
  const miDeclaredAlgorithmTopics = extractModuleAlgorithmTopics(activeCurriculum, 'management-informatics-core');
  const miAvailableAlgorithmRouteCount = countImplementedAlgorithmRoutes(algorithms, miDeclaredAlgorithmTopics);
  const miAvailableMcqCount = miInteractiveTutorials.reduce(
    (total, tutorial) => total + (tutorial.mcqs || []).length,
    0,
  );
  const miAvailableFlashcardCount = miInteractiveTutorials.reduce(
    (total, tutorial) => total + (tutorial.flashcards || []).length,
    0,
  );
  const miAssessmentDeficits = summarizeAssessmentDeficits(
    {
      tutorials: miAvailableTutorialCount,
      mcqs: miAvailableMcqCount,
      flashcards: miAvailableFlashcardCount,
    },
    miRule.minimums,
  );
  const miSourceAnchorCount = miCoverage?.specNodeCount || representativeAnchors.length;
  const miBuildoutStatus = classifyCpBuildoutStatus({
    sourceAnchorCount: miSourceAnchorCount,
    minimums: miRule.minimums,
    sourceRealizationMode: 'synthetic-governed-recovery',
    counts: {
      tutorials: miAvailableTutorialCount,
      mcqs: miAvailableMcqCount,
      flashcards: miAvailableFlashcardCount,
    },
  });

  generatedDomains.push({
    domainId: 'mi',
    contentArea: miRule.contentArea,
    buildoutStatus: miBuildoutStatus,
    contractWarnings: [
      'Management and Informatics is currently realized through governed tutorial coverage because the active raw CP spec seed does not expose a native `mi` root.',
      ...(miSourceAnchorCount >= miRule.minimums.sourceAnchors
        ? []
        : [
            `Current governed Management and Informatics seed provides ${miSourceAnchorCount} source anchors; add deeper source anchors and operational cases before canonical launch.`,
          ]),
      ...(miAssessmentDeficits.length
        ? [
            `Assessment coverage remains below contract minimums: ${miAssessmentDeficits.join(', ')}.`,
          ]
        : []),
      ...(miDeclaredAlgorithmTopics.length > miAvailableAlgorithmRouteCount
        ? [
            `Algorithm coverage remains declared-only in part: ${miAvailableAlgorithmRouteCount}/${miDeclaredAlgorithmTopics.length} curriculum MI algorithm routes are currently implemented.`,
          ]
        : []),
    ],
    sourceSpecRoot: 'Management and Informatics',
    sourceRealizationMode: 'synthetic-governed-recovery',
    sourceAnchorBasis: 'tutorial-abpath-coverage-by-root',
    representativeAnchorBasis: 'validated-management-tutorial-primary-paths',
    tutorialCountBasis: 'interactive-tutorial-records',
    availableInteractiveTutorialCount: miAvailableInteractiveTutorialCount,
    availableGovernedTutorialRowCount: miAvailableGovernedTutorialRowCount,
    algorithmCountBasis: 'curriculum-topic-declarations-vs-normalized-algorithm-routes',
    declaredAlgorithmTopicCount: miDeclaredAlgorithmTopics.length,
    availableAlgorithmRouteCount: miAvailableAlgorithmRouteCount,
    levelMix: ['AR', 'C'],
    sourceAnchorCount: miSourceAnchorCount,
    representativeAnchors,
    availableTutorialCount: miAvailableTutorialCount,
    availableMcqCount: miAvailableMcqCount,
    availableFlashcardCount: miAvailableFlashcardCount,
    contractParameters: {
      scope: [
        `Keep content scoped to ${miRule.contentArea}.`,
        'Teach laboratory medicine as consultation and operations, not as isolated fact recall.',
        'Declare C/AR/F level and rotation context for every promoted CP asset.',
      ],
      consumptionPathways: [
        'Curriculum module -> tutorial -> operational artifact -> consult question -> remediation.',
        'Competency matrix -> CP domain -> case/consult -> faculty or answer-key feedback.',
        'Daily review queue -> CP artifact interpretation -> spaced recall.',
      ],
      requiredAssets: [
        ...miRule.operationalArtifacts,
        'case vignette with clinical decision point',
        'deterministic answer key with escalation threshold',
      ],
      assessmentGates: [
        'Recognition of the specimen/result/artifact.',
        'Correct interpretation with limitations.',
        'Appropriate next test or workflow recommendation.',
        'Critical value or patient-safety escalation when indicated.',
        'Clear consult note or laboratory communication.',
      ],
      safetyCriticalActions: miRule.safetyCriticalActions,
      minimums: miRule.minimums,
    },
    promotionGate:
      'Promote when source anchors, tutorial/assessment assets, operational artifacts, safety actions, and remediation routing all pass validation.',
  });

  return generatedDomains;
};

const writeMarkdown = (journeys, swot, worldContract, cpContracts) => {
  const lines = [
    '# Content Consumption User Journey Evaluation',
    '',
    'Live route evaluated: `https://pthfndr.online/didactics/?v=journey-eval` and `?v=journey-eval-2`.',
    '',
    '## Executive SWOT',
    '',
    '| Strengths | Weaknesses | Opportunities | Threats |',
    '| --- | --- | --- | --- |',
    `| ${swot.strengths.join('<br>')} | ${swot.weaknesses.join('<br>')} | ${swot.opportunities.join('<br>')} | ${swot.threats.join('<br>')} |`,
    '',
    `Execution implication: ${swot.executionImplication}`,
    '',
    '## Seven Pathways',
    '',
  ];
  for (const journey of journeys) {
    lines.push(`### ${journey.name}`);
    lines.push(`- Pathway: ${journey.pathway.join(' -> ')}`);
    lines.push(`- Strengths: ${journey.observedStrengths.join(' ')}`);
    lines.push(`- Weaknesses: ${journey.observedWeaknesses.join(' ')}`);
    lines.push(`- Opportunities: ${journey.opportunities.join(' ')}`);
    lines.push(`- Threats: ${journey.threats.join(' ')}`);
    lines.push('- Deterministic gates:');
    journey.deterministicGates.forEach((gate) => lines.push(`  - ${gate}`));
    lines.push('');
  }
  lines.push('## Deterministic World-Class Free Resource Contract', '');
  lines.push(`- Version: ${worldContract.version}`);
  lines.push(`- Required route contracts: ${worldContract.globalGates.requiredRouteContracts.join(', ')}`);
  lines.push(`- Promotion rule: ${worldContract.globalGates.promotionRule}`);
  lines.push(`- Free-resource trust rule: ${worldContract.globalGates.freeResourceTrustRule}`);
  lines.push('');
  lines.push('## Clinical Pathology Contract Mirror', '');
  lines.push('| CP domain | Status | Source anchors | Level mix | Available tutorials | MCQs | Flashcards | Promotion gate |');
  lines.push('| --- | --- | ---: | --- | ---: | ---: | ---: | --- |');
  for (const domain of cpContracts) {
    lines.push(`| ${domain.contentArea} | ${domain.buildoutStatus} | ${domain.sourceAnchorCount} | ${domain.levelMix.join(', ')} | ${domain.availableTutorialCount} | ${domain.availableMcqCount} | ${domain.availableFlashcardCount} | ${domain.promotionGate} |`);
  }
  fs.writeFileSync(journeyMdPath, `${lines.join('\n')}\n`);
};

const writeCpMarkdown = (cpContracts) => {
  const lines = [
    '# Clinical Pathology Contract Parameters',
    '',
    'This mirrors the AP lecture-contract approach for Clinical Pathology, but uses laboratory medicine tasks: consultation, operational artifacts, safety escalation, and performance-in-practice evidence.',
    '',
  ];
  for (const domain of cpContracts) {
    lines.push(`## ${domain.contentArea}`, '');
    lines.push(`- Buildout status: ${domain.buildoutStatus}`);
    lines.push(`- Source root: ${domain.sourceSpecRoot}`);
    lines.push(`- Source anchors: ${domain.sourceAnchorCount}`);
    lines.push(`- Level mix: ${domain.levelMix.join(', ')}`);
    lines.push(`- Available tutorials: ${domain.availableTutorialCount}`);
    lines.push(`- Available MCQs: ${domain.availableMcqCount}`);
    lines.push(`- Available flashcards: ${domain.availableFlashcardCount}`);
    lines.push(`- Promotion gate: ${domain.promotionGate}`);
    if (domain.contractWarnings.length) {
      lines.push('- Contract warnings:');
      domain.contractWarnings.forEach((warning) => lines.push(`  - ${warning}`));
    }
    lines.push('- Required assets:');
    domain.contractParameters.requiredAssets.forEach((asset) => lines.push(`  - ${asset}`));
    lines.push('- Safety-critical actions:');
    domain.contractParameters.safetyCriticalActions.forEach((action) => lines.push(`  - ${action}`));
    lines.push('- Representative anchors:');
    domain.representativeAnchors.slice(0, 8).forEach((anchor) => lines.push(`  - ${anchor.path} (${anchor.level})`));
    lines.push('');
  }
  fs.writeFileSync(cpReportPath, `${lines.join('\n')}\n`);

  const csvRows = [
    ['domainId', 'contentArea', 'buildoutStatus', 'sourceAnchorCount', 'levelMix', 'availableTutorialCount', 'availableMcqCount', 'availableFlashcardCount', 'contractWarnings', 'promotionGate'],
    ...cpContracts.map((domain) => [
      domain.domainId,
      domain.contentArea,
      domain.buildoutStatus,
      domain.sourceAnchorCount,
      domain.levelMix.join('; '),
      domain.availableTutorialCount,
      domain.availableMcqCount,
      domain.availableFlashcardCount,
      domain.contractWarnings.join('; '),
      domain.promotionGate,
    ]),
  ];
  const csv = csvRows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  fs.writeFileSync(cpCsvPath, `${csv}\n`);
};

const main = () => {
  const apLectureContract = JSON.parse(fs.readFileSync(apLectureContractPath, 'utf8'));
  const learningUxContract = JSON.parse(fs.readFileSync(learningUxContractPath, 'utf8'));
  const swot = summarizeSwot(journeyDefinitions);
  const cpContracts = makeCpContracts();
  const learningUxGateLabel = 'learning UX';
  const worldContract = {
    version: 'world-class-free-resource-contract.v1',
    purpose:
      'Deterministic execution contract for turning P@thfndr into a true world-class free pathology education resource across AP and CP.',
    sourceInputs: [
      'live browser journey evaluation 2026-05-15',
      'src/content/lectures/lectureAbpathContracts.json',
      'src/content/downloads_imports/raw/cp_content_specification_11_11_25.raw.json',
      'src/content/downloads_imports/raw/cp_content_specification_batch_ready.raw.json',
      'competency matrix and active curriculum surfaces',
      'src/content/contracts/pthfndrDidacticsLearningUxContract.json',
    ],
    globalGates: {
      requiredRouteContracts: ['scope', 'source anchors', 'learner level', 'asset readiness', 'assessment evidence', 'remediation path', 'trust/provenance', learningUxGateLabel],
      learningUxGateLabel,
      learningUxContractVersion: learningUxContract.version,
      learningUxContractSurface: learningUxContract.productSurface,
      promotionRule:
        'No learner-facing route is canonical unless it declares scope, source anchors, level, required assets, assessment evidence, remediation route, and validation command.',
      freeResourceTrustRule:
        'Free does not mean informal: every promoted asset must expose provenance, editorial status, last-reviewed date, and a deterministic route back to source contracts.',
      learningUxRule:
        `Every promoted learner route on ${learningUxContract.productSurface} must satisfy the didactics learning UX contract so workspace labels, navigation state, and visible teaching context stay truthful and consistent.`,
      learningScienceRule:
        'Every pathway must include retrieval practice, interleaving or comparison, feedback, and a spaced-review or remediation output.',
    },
    apCurrentState: {
      lectureContracts: apLectureContract.lectures.length,
      lectureContractVersion: apLectureContract.version,
      primaryGap:
        'Surface route contracts and trust badges in the live app; continue attaching reviewed image assets and senior/faculty workflow analytics.',
    },
    journeyContracts: journeyDefinitions.map((journey) => ({
      id: journey.id,
      name: journey.name,
      deterministicGates: journey.deterministicGates,
    })),
    cpContracts,
  };

  [journeyJsonPath, journeyMdPath, worldContractPath, cpContractPath, cpReportPath, cpCsvPath].forEach(ensureDir);
  fs.writeFileSync(journeyJsonPath, `${JSON.stringify({ journeys: journeyDefinitions, swot, worldContractSummary: worldContract.globalGates }, null, 2)}\n`);
  fs.writeFileSync(worldContractPath, `${JSON.stringify(worldContract, null, 2)}\n`);
  fs.writeFileSync(cpContractPath, `${JSON.stringify({ version: 'clinical-pathology-contract.v1', domains: cpContracts }, null, 2)}\n`);
  writeMarkdown(journeyDefinitions, swot, worldContract, cpContracts);
  writeCpMarkdown(cpContracts);

  console.log(`Wrote ${path.relative(root, journeyMdPath)}`);
  console.log(`Wrote ${path.relative(root, worldContractPath)}`);
  console.log(`Wrote ${path.relative(root, cpContractPath)}`);
};

main();
