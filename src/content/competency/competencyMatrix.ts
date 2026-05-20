import {
  ActiveCurriculumModule,
  AssessmentRubric,
  AutonomyTarget,
  CompetencyDomain,
  CompetencyMatrixRecord,
  ContentTrustMetadata,
  LearnerCompetencyMetadata,
  LearnerLevel,
  Section,
} from '../../types.ts';
import { activeCurriculumModules } from '../curriculum/activeCurriculum.ts';

export const learnerLevelLabels: Record<LearnerLevel, string> = {
  PGY1: 'PGY1',
  PGY2: 'PGY2',
  PGY3: 'PGY3',
  PGY4: 'PGY4',
  PGY5_FELLOW: 'PGY5/Fellow',
  ATTENDING: 'Attending',
};

export const learnerLevelOrder: LearnerLevel[] = ['PGY1', 'PGY2', 'PGY3', 'PGY4', 'PGY5_FELLOW', 'ATTENDING'];

export const competencyDomains: CompetencyDomain[] = [
  'foundations',
  'organ-system knowledge',
  'image recognition',
  'differential diagnosis',
  'ancillary selection',
  'report writing',
  'staging/synoptic',
  'quality assurance',
  'teaching',
];

export const levelModeGuidance: Record<LearnerLevel, {
  intent: string;
  interfaceMode: string;
  expectedEvidence: string;
}> = {
  PGY1: {
    intent: 'Build a normal-to-abnormal mental model before diagnostic closure.',
    interfaceMode: 'Guided hints, glossary language, normal histology contrast, and specimen orientation.',
    expectedEvidence: 'Recognizes tissue, pattern, stain, and one safe next step.',
  },
  PGY2: {
    intent: 'Convert recognition into organ-system rotation competence.',
    interfaceMode: 'Rotation tracks, core differentials, basic ancillary choices, and low-complexity unknowns.',
    expectedEvidence: 'Names a differential, chooses reasonable studies, and explains the first-pass diagnosis.',
  },
  PGY3: {
    intent: 'Draft defensible reports with staging, IHC, and pitfall awareness.',
    interfaceMode: 'Report composition, synoptic requirements, IHC panels, and near-miss feedback.',
    expectedEvidence: 'Submits a report that includes required elements and avoids safety-critical omissions.',
  },
  PGY4: {
    intent: 'Practice near-independent service behavior under attending review.',
    interfaceMode: 'Timed mixed queues, minimal hints, prioritization, and entrustment-style scoring.',
    expectedEvidence: 'Completes a case queue with accurate triage, report quality, and turnaround discipline.',
  },
  PGY5_FELLOW: {
    intent: 'Handle subspecialty ambiguity, rare entities, and molecular/management implications.',
    interfaceMode: 'Consult-level cases, rare variants, WHO classification nuance, and management language.',
    expectedEvidence: 'Defends a consult diagnosis and explains why alternatives are less likely.',
  },
  ATTENDING: {
    intent: 'Author, calibrate, assign, and review teaching cases with visible QA.',
    interfaceMode: 'Faculty authoring, case conference export, learner analytics, and editorial review.',
    expectedEvidence: 'Approves content, calibrates learners, and exports a conference-ready teaching set.',
  },
};

export const apP0PromotionMilestones = [
  {
    milestone: 'Scaffold complete',
    target: 'Every P0 entity card has a stable title, ABPath path, gap summary, closure action, and draft teaching structure.',
    outcome: 'Faculty reviewers can assess scope and identify which cards are ready for source-backed enrichment.',
  },
  {
    milestone: 'Evidence enriched',
    target: 'Cards gain source-backed explanations, curated images, answer-key logic, and deterministic review cues.',
    outcome: 'The promotion queue reflects which entities are educationally usable versus structurally present only.',
  },
  {
    milestone: 'Faculty review-ready',
    target: 'All five gates show complete or ready-for-review status with no safety-critical omissions.',
    outcome: 'The batch can move into attending review without hidden authoring debt.',
  },
  {
    milestone: 'Canonical release',
    target: 'Reviewer sign-off, provenance, and learner-facing QA language are present before public exposure.',
    outcome: 'The card can enter the active teaching library as a canonical resource.',
  },
] as const;

export const apP0LearningQualityStandards = [
  {
    standard: 'ABPath governed',
    appRule: 'Every scaffold must anchor to the correct AP or CP specification frame before detail is expanded.',
    evidenceTarget: 'Visible content-spec alignment and subordinate teaching labels.',
  },
  {
    standard: 'Diagnostic first',
    appRule: 'Teaching content should orient the learner to pattern recognition, differential logic, and safe next steps quickly.',
    evidenceTarget: 'Clear diagnostic frame, pitfalls, and action-oriented explanations.',
  },
  {
    standard: 'Feedback ready',
    appRule: 'Questions, reports, and image review should support deterministic feedback before optional AI narration.',
    evidenceTarget: 'Answer rationales, completeness checks, and error-recovery guidance.',
  },
  {
    standard: 'Faculty reviewable',
    appRule: 'Draft cards need provenance, source expectations, and a visible editorial state so attendings can trust the queue.',
    evidenceTarget: 'Review packet path, editorial label, and provenance notes.',
  },
  {
    standard: 'Promotion safe',
    appRule: 'No card should advance into public teaching without passing the gate model for scope, evidence, images, assessment, and QA.',
    evidenceTarget: 'Gate statuses support complete or ready-for-review promotion decisions.',
  },
] as const;

export const defaultTrustMetadata: ContentTrustMetadata = {
  editorialStatus: 'reviewed',
  lastReviewed: '2026-05-15',
  provenance: 'Derived from local app curriculum, sign-out validation outputs, ABPath AP content specifications, ACLPS CP curriculum guidance, and pathology competency assessment literature.',
  sourceQuality: 'local validated',
};

const autonomyByPrimaryLevel: Record<LearnerLevel, AutonomyTarget> = {
  PGY1: 'guided',
  PGY2: 'supervised',
  PGY3: 'independent draft',
  PGY4: 'near-independent',
  PGY5_FELLOW: 'consult-level',
  ATTENDING: 'faculty calibration',
};

const milestoneByPrimaryLevel: Record<LearnerLevel, string> = {
  PGY1: 'Orient to tissue, specimen, vocabulary, and histomorphologic features that separate benign from atypical, neoplastic, malignant, and invasive processes.',
  PGY2: 'Build rotation-level organ-system differential diagnosis and basic ancillary logic.',
  PGY3: 'Produce complete draft reports with staging, synoptic, IHC, and pitfall handling.',
  PGY4: 'Demonstrate near-independent prioritization, sign-out quality, and error recovery.',
  PGY5_FELLOW: 'Resolve consult-level ambiguity with rare-entity and molecular classification nuance.',
  ATTENDING: 'Author, calibrate, assign, and review teaching content with transparent provenance.',
};

const modulePrimaryLevel = (module: ActiveCurriculumModule): LearnerLevel => {
  if (module.subspecialty === 'Foundations') {
    return module.boardPriority === 'core' ? 'PGY1' : 'PGY2';
  }
  if (module.boardPriority === 'advanced') {
    return 'PGY5_FELLOW';
  }
  if (module.specimenContexts.some((context) => /frozen|margin|resection|cystectomy|whipple/i.test(context))) {
    return 'PGY3';
  }
  if (module.promotionState === 'staged') {
    return 'PGY2';
  }
  return 'PGY2';
};

const moduleLevels = (primaryLevel: LearnerLevel, module: ActiveCurriculumModule): LearnerLevel[] => {
  if (primaryLevel === 'PGY1') {
    return ['PGY1', 'PGY2'];
  }
  if (primaryLevel === 'PGY5_FELLOW') {
    return ['PGY4', 'PGY5_FELLOW', 'ATTENDING'];
  }
  if (module.specimenContexts.includes('frozen section') || module.boardPriority === 'advanced') {
    return ['PGY3', 'PGY4', 'PGY5_FELLOW'];
  }
  if (primaryLevel === 'PGY3') {
    return ['PGY2', 'PGY3', 'PGY4'];
  }
  return ['PGY1', 'PGY2', 'PGY3'];
};

const moduleDomains = (module: ActiveCurriculumModule): CompetencyDomain[] => {
  const domains = new Set<CompetencyDomain>();
  if (module.subspecialty === 'Foundations') {
    domains.add('foundations');
  }
  domains.add('organ-system knowledge');
  if (module.referenceFocusTerms.length > 0 || module.plannedAssets.includes('images')) {
    domains.add('image recognition');
  }
  if (module.patternFamilies.length > 0) {
    domains.add('differential diagnosis');
  }
  if (module.algorithmTopics.length > 0) {
    domains.add('ancillary selection');
  }
  if (module.assessmentTopics.length > 0) {
    domains.add('report writing');
  }
  if (module.specimenContexts.some((context) => /resection|margin|sentinel|cystectomy|whipple|stage/i.test(context))) {
    domains.add('staging/synoptic');
  }
  return Array.from(domains);
};

const difficultyForModule = (module: ActiveCurriculumModule): LearnerCompetencyMetadata['difficulty'] => {
  if (module.boardPriority === 'advanced') {
    return 'expert';
  }
  if (module.specimenContexts.some((context) => /frozen|margin|resection|cystectomy|whipple/i.test(context))) {
    return 'advanced';
  }
  if (module.subspecialty === 'Foundations') {
    return 'introductory';
  }
  return 'core';
};

export const deriveModuleCompetency = (module: ActiveCurriculumModule): LearnerCompetencyMetadata => {
  const primaryLevel = modulePrimaryLevel(module);
  return {
    learnerLevels: moduleLevels(primaryLevel, module),
    primaryLevel,
    competencyDomains: moduleDomains(module),
    difficulty: difficultyForModule(module),
    rotation: module.subspecialty,
    autonomyTarget: autonomyByPrimaryLevel[primaryLevel],
    milestoneOutcome: milestoneByPrimaryLevel[primaryLevel],
    facultyUse: module.promotionState === 'canonical' ? 'assign' : 'teach',
    trust: {
      ...defaultTrustMetadata,
      editorialStatus: module.promotionState === 'canonical' ? 'canonical' : 'draft',
      sourceQuality: module.promotionState === 'canonical' ? 'local validated' : 'derived planning',
    },
  };
};

const moduleRecord = (module: ActiveCurriculumModule): CompetencyMatrixRecord => {
  const competency = deriveModuleCompetency(module);
  const availableNow = module.promotionState === 'canonical';
  const missingRoutes = [
    module.lectures.length === 0 && module.plannedAssets.includes('lectures') ? 'lecture' : null,
    module.tutorialTopics.length === 0 && module.plannedAssets.includes('tutorials') ? 'tutorial' : null,
    module.referenceFocusTerms.length === 0 && module.plannedAssets.includes('images') ? 'image review' : null,
    module.assessmentTopics.length === 0 && module.plannedAssets.includes('assessment') ? 'assessment' : null,
  ].filter(Boolean);

  return {
    id: `curriculum-${module.moduleId}`,
    title: module.title,
    summary: module.summary,
    sourceType: 'curriculum',
    linkedSection: Section.PATHOLOGY_CURRICULUM,
    linkedModuleId: module.moduleId,
    linkedQuery: module.title,
    availableNow,
    gapSummary: missingRoutes.length > 0 ? `Needs ${missingRoutes.join(', ')} promotion.` : 'Core learner route is available.',
    closureAction: missingRoutes.length > 0
      ? `Promote ${missingRoutes.join(', ')} content and attach level-specific rubric evidence.`
      : 'Add longitudinal outcomes and faculty assignment analytics.',
    ...competency,
  };
};

export const competencyMatrixRecords: CompetencyMatrixRecord[] = [
  ...activeCurriculumModules.map(moduleRecord),
  {
    id: 'signout-active-specialty-directory',
    title: 'Specialty Sign-Out Case Directory',
    summary: 'Image-first specialty cases spanning biopsy, resection, and gross-only workflows with report-element feedback.',
    sourceType: 'signout',
    linkedSection: Section.SIGN_OUT_SIMULATOR,
    availableNow: true,
    gapSummary: 'Active pages expose a validated sign-out shell, but senior queues and entrustment scoring are still first-pass.',
    closureAction: 'Add timed senior queues, attending-review states, and case-level entrustment scores.',
    learnerLevels: ['PGY2', 'PGY3', 'PGY4'],
    primaryLevel: 'PGY3',
    competencyDomains: ['image recognition', 'ancillary selection', 'report writing', 'staging/synoptic', 'quality assurance'],
    difficulty: 'advanced',
    rotation: 'Cross-Rotation',
    autonomyTarget: 'independent draft',
    milestoneOutcome: milestoneByPrimaryLevel.PGY3,
    facultyUse: 'assign',
    trust: defaultTrustMetadata,
  },
  {
    id: 'faculty-attending-control-plane',
    title: 'Faculty QA And Case Conference Mode',
    summary: 'Attending-facing controls for authoring, assignment, calibration, learner analytics, and conference export.',
    sourceType: 'faculty',
    linkedSection: Section.COMPETENCY_MATRIX,
    availableNow: false,
    gapSummary: 'The teaching shell is useful for faculty, but authoring, peer review, and learner analytics are not yet first-class.',
    closureAction: 'Build faculty controls for case authoring, editorial status, assignment, and exportable conference packets.',
    learnerLevels: ['ATTENDING'],
    primaryLevel: 'ATTENDING',
    competencyDomains: ['quality assurance', 'teaching'],
    difficulty: 'expert',
    rotation: 'Faculty Development',
    autonomyTarget: 'faculty calibration',
    milestoneOutcome: milestoneByPrimaryLevel.ATTENDING,
    facultyUse: 'author',
    trust: {
      ...defaultTrustMetadata,
      editorialStatus: 'draft',
      sourceQuality: 'derived planning',
    },
  },
];

export const signOutRubric: AssessmentRubric = {
  id: 'deterministic-signout-rubric-v1',
  title: 'Deterministic Sign-Out Rubric',
  appliesTo: 'signout',
  criteria: [
    {
      id: 'diagnostic-accuracy',
      label: 'Diagnostic accuracy',
      domain: 'differential diagnosis',
      learnerLevels: ['PGY2', 'PGY3', 'PGY4', 'PGY5_FELLOW'],
      maxScore: 4,
      passingScore: 3,
      safetyCritical: true,
      feedbackPrompt: 'Does the draft name the expected diagnosis or a defensible close differential?',
    },
    {
      id: 'report-completeness',
      label: 'Report completeness',
      domain: 'report writing',
      learnerLevels: ['PGY3', 'PGY4', 'PGY5_FELLOW'],
      maxScore: 4,
      passingScore: 3,
      feedbackPrompt: 'Are required diagnosis, qualifier, specimen, and comment elements present?',
    },
    {
      id: 'ancillary-appropriateness',
      label: 'Ancillary appropriateness',
      domain: 'ancillary selection',
      learnerLevels: ['PGY2', 'PGY3', 'PGY4', 'PGY5_FELLOW'],
      maxScore: 3,
      passingScore: 2,
      feedbackPrompt: 'Were recommended studies selected without excessive or misleading extras?',
    },
    {
      id: 'staging-synoptic',
      label: 'Staging and synoptic completeness',
      domain: 'staging/synoptic',
      learnerLevels: ['PGY3', 'PGY4', 'PGY5_FELLOW'],
      maxScore: 4,
      passingScore: 3,
      safetyCritical: true,
      feedbackPrompt: 'Are invasion, grade, margin, stage, and checklist fields addressed when applicable?',
    },
    {
      id: 'safety-critical-misses',
      label: 'Safety-critical misses',
      domain: 'quality assurance',
      learnerLevels: ['PGY4', 'PGY5_FELLOW', 'ATTENDING'],
      maxScore: 3,
      passingScore: 3,
      safetyCritical: true,
      feedbackPrompt: 'Does the work avoid omissions that would change patient management or require amended reporting?',
    },
  ],
};

export const competencyMatrixSummary = {
  totalCurriculumModules: activeCurriculumModules.length,
  validatedSpecialtySignoutImages: 72,
  supplementalReferenceImages: 655,
  normalizedTutorials: 190,
  syllabusEntries: 3863,
  apWorkflowContractCases: 508,
};

export interface SourceStandardDocument {
  id: string;
  title: string;
  shortTitle: string;
  sourcePath: string;
  pageCount: number;
  publicationContext: string;
  scope: 'anatomic pathology' | 'clinical pathology' | 'competency framework' | 'laboratory medicine assessment';
  appUse: string[];
  mappedLearnerLevels: LearnerLevel[];
  mappedDomains: CompetencyDomain[];
  implementationActions: string[];
}

export const sourceStandardDocuments: SourceStandardDocument[] = [
  {
    id: 'abpath-ap-content-specifications-2024',
    title: 'Preparing for the American Board of Pathology Fundamental Knowledge and Skills: Anatomic Pathology Content Specifications',
    shortTitle: 'ABPath AP Content Specifications',
    sourcePath: '/Users/ski_mini/Library/Mobile Documents/com~apple~CloudDocs/abpathdocs/Anatomic Pathology.pdf',
    pageCount: 133,
    publicationContext: 'American Board of Pathology content specifications, 2024 PDF metadata.',
    scope: 'anatomic pathology',
    appUse: [
      'Map AP curriculum topics to Core/Foundational, Advanced Resident, and Fellow/Advanced Practitioner levels.',
      'Use C/AR/F designations as the source standard for PGY progression and fellow-level flags.',
      'Audit organ-system coverage across breast, GU, GI, endocrine, gynecologic, thoracic, soft tissue/bone, cytology, dermatopathology, forensic, hematopathology, neuropathology, and pediatric/placental pathology.',
    ],
    mappedLearnerLevels: ['PGY1', 'PGY2', 'PGY3', 'PGY4', 'PGY5_FELLOW'],
    mappedDomains: ['foundations', 'organ-system knowledge', 'image recognition', 'differential diagnosis', 'ancillary selection', 'staging/synoptic'],
    implementationActions: [
      'Treat C topics as PGY1-PGY2 core foundations.',
      'Treat AR topics as PGY3-PGY4 independent-draft and near-independent targets.',
      'Treat F topics as PGY5/Fellow exposure and attending teaching flags.',
    ],
  },
  {
    id: 'aclps-cp-curriculum-proposal-2006',
    title: 'Curriculum Content and Evaluation of Resident Competency in Clinical Pathology (Laboratory Medicine): A Proposal',
    shortTitle: 'ACLPS CP Curriculum Proposal',
    sourcePath: '/Users/ski_mini/Library/Mobile Documents/com~apple~CloudDocs/abpathdocs/Curriculum Content and Evaluation of Resident Competency in Clinical Pathology (Laboratory  Medicine) - A Proposal.pdf',
    pageCount: 33,
    publicationContext: 'Clinical Chemistry 2006 special report from the Academy of Clinical Laboratory Physicians and Scientists.',
    scope: 'clinical pathology',
    appUse: [
      'Anchor CP training around consultation, laboratory management, test development, test utilization, assay interpretation, informatics, therapeutics, and research literacy.',
      'Represent common competencies across rotations before subdiscipline-specific objectives.',
      'Give CP modules a consultative physician identity rather than a board-topic-only identity.',
    ],
    mappedLearnerLevels: ['PGY1', 'PGY2', 'PGY3', 'PGY4', 'ATTENDING'],
    mappedDomains: ['organ-system knowledge', 'ancillary selection', 'quality assurance', 'teaching'],
    implementationActions: [
      'Add CP rotation tracks for chemistry, microbiology, transfusion medicine, hematology/coagulation, molecular diagnostics, informatics, and laboratory management.',
      'Add consultation-note and test-utilization rubric criteria to CP cases.',
      'Use systems-level laboratory leadership as the senior resident and attending target.',
    ],
  },
  {
    id: 'competency-based-pathology-training-2002',
    title: 'Competency-Based Residency Training in Pathology: Challenges and Opportunities',
    shortTitle: 'Competency-Based Pathology Training',
    sourcePath: '/Users/ski_mini/Library/Mobile Documents/com~apple~CloudDocs/abpathdocs/Competency-Based Residency Training in Pathology - Challenges and Opportunities.pdf',
    pageCount: 4,
    publicationContext: 'Human Pathology 2002 education and informatics commentary.',
    scope: 'competency framework',
    appUse: [
      'Frame competency as more than medical knowledge: practice improvement, communication, professionalism, and systems-based practice must be visible.',
      'Use multisource feedback from clinicians, laboratory staff, administrators, and faculty as the model for senior resident assessment.',
      'Support flexible progression by documenting achieved skills and remediation needs.',
    ],
    mappedLearnerLevels: ['PGY2', 'PGY3', 'PGY4', 'ATTENDING'],
    mappedDomains: ['quality assurance', 'teaching', 'report writing'],
    implementationActions: [
      'Add 360-degree feedback hooks to senior sign-out and conference workflows.',
      'Add QA/project participation as evidence for PGY3-PGY4 advancement.',
      'Expose benchmark and remediation language in the competency matrix.',
    ],
  },
  {
    id: 'assessing-lm-competency-2007',
    title: 'Assessing Resident Competency in Laboratory Medicine',
    shortTitle: 'Assessing LM Competency',
    sourcePath: '/Users/ski_mini/Library/Mobile Documents/com~apple~CloudDocs/abpathdocs/Assessing Resident Competency in Laboratory Medicine.pdf',
    pageCount: 13,
    publicationContext: 'Clinics in Laboratory Medicine 2007 review article.',
    scope: 'laboratory medicine assessment',
    appUse: [
      'Align CP training with outcome-based assessment and rotation-specific competency evidence.',
      'Make consultation a day-one laboratory medicine activity rather than a late-stage add-on.',
      'Connect residency habits to lifelong learning, MOC-style self-assessment, and evaluation of performance in practice.',
    ],
    mappedLearnerLevels: ['PGY1', 'PGY2', 'PGY3', 'PGY4', 'ATTENDING'],
    mappedDomains: ['ancillary selection', 'quality assurance', 'teaching'],
    implementationActions: [
      'Add CP consultation cases with explicit evidence fields.',
      'Track rotation-specific competency evidence rather than only completion.',
      'Add self-assessment and performance-in-practice prompts to faculty review.',
    ],
  },
];

export const apDesignationCrosswalk = [
  {
    designation: 'C',
    label: 'Core/Foundational Knowledge',
    learnerLevels: ['PGY1', 'PGY2'] as LearnerLevel[],
    appRule: 'Teach with guided hints, normal-to-abnormal comparison, and early unknowns.',
  },
  {
    designation: 'AR',
    label: 'Advanced Resident',
    learnerLevels: ['PGY3', 'PGY4'] as LearnerLevel[],
    appRule: 'Assess with report drafting, ancillary logic, staging/synoptic completion, and near-independent review.',
  },
  {
    designation: 'F',
    label: 'Fellow/Advanced Practitioner',
    learnerLevels: ['PGY5_FELLOW', 'ATTENDING'] as LearnerLevel[],
    appRule: 'Flag for rare-entity, consult-level, molecular/management, and faculty teaching use.',
  },
];

export const cpRotationStandards = [
  'Clinical chemistry and toxicology',
  'Hematology and coagulation',
  'Transfusion medicine and cellular therapy',
  'Microbiology, virology, mycology, and parasitology',
  'Immunopathology and protein diagnostics',
  'Molecular diagnostics and cytogenetics',
  'Laboratory informatics',
  'Laboratory management, quality, utilization, and systems practice',
];
