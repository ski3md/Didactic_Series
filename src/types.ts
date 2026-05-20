// FIX: Removed circular import of 'Section' from the same file.
export enum Section {
  LECTURE = 'Lecture',
  DIDACTIC_LECTURES = 'Didactic Lectures',
  DIDACTIC_ALGORITHMS = 'Didactic Algorithms',
  DIDACTIC_TUTORIALS = 'Didactic Tutorials',
  BREAST_SIGNOUT_MASTERCLASS = 'Breast Sign-Out Masterclass',
  COMPETENCY_MATRIX = 'Competency Matrix',
  SYLLABUS_EXPLORER = 'Syllabus Explorer',
  PATHOLOGY_CURRICULUM = 'Pathology Curriculum',
  HOME = 'Home',
  REFERENCE_LIBRARY = 'Reference Library',
  SIGN_OUT_SIMULATOR = 'Sign-Out Simulator',
  VISUAL_CHALLENGE = 'Visual Challenge',
  DIAGNOSTIC_PATHWAY = 'Diagnostic Pathway',
  ANALYSIS = 'Analysis Phase',
  DESIGN = 'Design Phase',
  DEVELOPMENT = 'Development Phase',
  EVALUATION = 'Evaluation & Assessment',
  ADMIN = 'Admin View',
}

export interface User {
  username: string;
  email: string;
  isAdmin?: boolean;
}

// User details stored in the database
export interface StoredUser extends User {
  passwordHash: string;
  resetToken?: string;
  resetTokenExpires?: number;
}

// Login analytics record
export interface LoginHistory {
  timestamp: number;
  ip: string;
  userAgent: string;
}

export interface PingTelemetryRecord {
  id: string;
  timestamp: number;
  sourceIp: string;
  city: string;
  region: string;
  country: string;
  countryCode: string;
  postalCode: string;
  timezone: string;
  asn: string;
  isp: string;
  org: string;
  owner: string;
  deviceType: string;
  deviceModel?: string;
  os: string;
  browser: string;
  viewportWidth: number;
  viewportHeight: number;
  screenWidth: number;
  screenHeight: number;
  devicePixelRatio: number;
  language: string;
  path: string;
  method: string;
  referer: string;
  query: string;
  host: string;
  userAgent: string;
  userAgentRaw: string;
  physicalAddressNote: string;
  latitude?: number;
  longitude?: number;
}

export interface CaseData {
  clinicalHistory: string;
  radiologicFindings: string;
  histologicDescription: string;
  diagnosis: string;
}

export interface StoredImage {
  id: string;
  src: string; // Public URL to the image, now from GCS
  gcsPath: string; // Path within GCS bucket, for backend operations
  title: string;
  description: string;
  uploader: string;
  timestamp: number;
  category: 'official' | 'community'; // To distinguish between admin-curated and user-submitted images
  tags?: string[];
  // Optional enriched data
  entity?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  cells?: string[];
  family?: string;
  magnification?: string;
  sourceUrl?: string;
  atlasCollection?: 'curated' | 'promoted' | 'acquired' | 'local';
  readOnly?: boolean;
}

export interface QuizAnswer {
  question: string;
  selectedAnswer: string;
  isCorrect: boolean;
  timestamp: number;
}

export interface SignOutLog {
  caseTopic: string;
  userReport: string;
  feedback: string;
  timestamp: number;
}


export interface UserActivity {
  currentSection?: Section;
  Analysis?: Record<string, QuizAnswer>;
  Evaluation?: QuizAnswer[];
  VisualChallenge?: Record<string, QuizAnswer>;
  SignOutSimulator?: SignOutLog[];
  // Keep track of visited sections for progress
  visitedSections?: Section[];
  [key: string]: any;
}

// Case Authoring Types
export interface CaseMetadataRules {
  version: string;
  schema: string;
  entities: Record<string, {
    category: string;
    patterns: Array<{ keyword: string; description: string }>;
    cells: string[];
    difficulty: string;
    tags: string[];
    teachingPoint: string;
    caseContext: string;
  }>;
  stainRoles: Record<string, string>;
  difficultyLevels: Record<string, string>;
  caseTypes: Record<string, string>;
}

export interface Case {
  caseId: string;
  title: string;
  entity: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  caseType: 'classic' | 'atypical' | 'mimic' | 'complicated';
  description: string;
  caseContext: string;
  learningObjectives: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CaseImage extends StoredImage {
  caseId: string;
  imageId: string; // A unique ID within the case
  stain: string;
}

export interface CaseStudy extends Case {
    images: Array<{
        imageId: string;
        path: string; // This is `src` from StoredImage
        stain: string;
        caption: string;
        findings: string[];
    }>;
    discussion: string;
    teachingPoints: string[];
    references: string[];
    mcqs?: MCQ[];
}


// Types for imported educational content
export interface CaseTutorial {
  title: string;
  clinicalVignette: string;
  objective: string;
  caseDiscussion: string;
  teachingPoints: string[];
  references: string[];
  histologyImage?: {
    src: string;
    alt: string;
    caption: string;
  };
  // Add a gold standard report for the simulator
  goldStandardReport: {
    finalDiagnosis: string;
    microscopicDescription: string;
    comment: string;
  };
}

export interface MCQ {
  topic: string;
  question: string;
  choices: string[];
  answer: string;
  rationale: string;
  choiceRationales?: Record<string, string>;
}

export interface Flashcard {
  front: string;
  back: string;
  tag: string;
}

export type LecturePlayerMode =
  | 'overview'
  | 'algorithm'
  | 'tissue'
  | 'knowledge'
  | 'check'
  | 'transcript';

export type StudyDestinationKind =
  | 'landing'
  | 'topic_overview'
  | 'subtopic_overview'
  | 'item_detail';

export type StudyWorkspace = 'tutorials' | 'lectures' | 'algorithms';

export interface ActiveStudyDestination {
  workspace: StudyWorkspace;
  kind: StudyDestinationKind;
  majorTopicId?: string;
  subtopicId?: string;
  itemId?: string;
  activeTab?: string;
  previous?: ActiveStudyDestination | null;
}

export type InteractiveLectureSlideType =
  | 'intro'
  | 'framework'
  | 'anatomy'
  | 'network'
  | 'algorithm'
  | 'tissue_layer'
  | 'knowledge_pack'
  | 'pitfall'
  | 'workflow'
  | 'quick_check'
  | 'summary'
  | 'grading'
  | 'staging'
  | 'variant'
  | 'mimic'
  | 'ihc';

export interface InteractiveLectureSlideConfig {
  system?: string;
  nodeId?: string;
  algorithmId?: string;
  startNodeId?: string;
  highlightGroup?: string;
  entityRefs?: string[];
  pitfallRefs?: string[];
  imageLayerSetId?: string;
  comparisonMode?: 'magnification' | 'mimic' | 'branch';
  showPrognosisPanel?: boolean;
  showPitfallPanel?: boolean;
}

export interface LectureVisualAid {
  imageUrl: string;
  sourcePageUrl: string;
  alt: string;
  caption: string;
  stain?: string;
  credit?: string;
}

export interface InteractiveLectureSlide {
  type: InteractiveLectureSlideType;
  title: string;
  content?: string;
  config?: InteractiveLectureSlideConfig;
  visualAid?: LectureVisualAid;
}

export interface DxPearl {
  type: 'pitfall' | 'discriminator' | 'workflow' | 'reporting';
  text: string;
}

export interface PrognosticDriver {
  name: string;
  effect: 'favorable' | 'unfavorable' | 'contextual';
  notes?: string;
}

export interface DxEntityCard {
  entityId: string;
  summary: string;
  visualAids?: LectureVisualAid[];
  keyMorphology: string[];
  keyIHC: {
    positive: string[];
    negative?: string[];
    patterns?: string[];
  };
  keyMolecular?: string[];
  criticalDifferential: string[];
  pearls: DxPearl[];
  prognosis: {
    tier:
      | 'Benign/Indolent'
      | 'Generally Favorable'
      | 'Intermediate/Variable'
      | 'Aggressive'
      | 'Highly Aggressive'
      | 'Contextual';
    drivers: PrognosticDriver[];
    counseling: string[];
  };
  managementImplications: string[];
}

export interface LecturePitfallCard {
  id: string;
  title: string;
  overcallRisk: string;
  undercallRisk: string;
  stainHelp: string;
  morphologyGuardrail: string;
}

export interface LectureQuickCheck {
  id: string;
  prompt: string;
  teachingCue: string;
  checkpointType: 'mcq' | 'oral-recall' | 'morphology-check';
  mcq?: MCQ;
  checkpoints?: string[];
}

export interface LectureTissueImageLayer {
  id: string;
  title: string;
  viewLabel: string;
  description: string;
  imageUrl: string;
  sourcePageUrl?: string;
  stain?: string;
  tags?: string[];
  label: string;
  whatToNotice: string[];
  pitfallNote: string;
}

export interface LectureWsiManifest {
  slideId: string;
  title: string;
  description: string;
  dziUrl?: string;
  staticImageUrl?: string;
  initialViewport?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  annotationOverlays?: Array<{
    id: string;
    label: string;
    description: string;
  }>;
  teachingSteps: string[];
}

export interface LectureTissueLayerSet {
  id: string;
  lectureId: string;
  title: string;
  summary: string;
  comparisonMode: 'magnification' | 'mimic' | 'branch';
  images: LectureTissueImageLayer[];
  optionalWsi?: LectureWsiManifest;
}

export interface LectureAlgorithmOption {
  label: string;
  nextNodeId: string;
  rationale?: string;
}

export interface LectureAlgorithmNode {
  id: string;
  type: 'start' | 'decision' | 'morphology_gate' | 'result' | 'stop' | 'handoff';
  title: string;
  description: string;
  options?: LectureAlgorithmOption[];
  morphologyFeatures?: string[];
  recommendedInitialIHC?: string[];
  recommendedReflexIHC?: string[];
  molecularIndications?: string[];
  confirmatoryStudies?: string[];
  pearls?: string[];
  pitfalls?: string[];
  diagnosis?: string;
  nextAlgorithmId?: string;
  relatedLectureId?: string;
  relatedTutorialQuery?: string;
  relatedImageTerms?: string[];
  stopConditions?: string[];
  workedExamples?: Array<{
    title: string;
    steps: string[];
    takeaway?: string;
  }>;
}

export interface LectureAlgorithmRecord {
  id: string;
  title: string;
  category: string;
  summary: string;
  startNodeId: string;
  nodes: Record<string, LectureAlgorithmNode>;
}

export interface InteractiveLectureEnhancement {
  lectureId: string;
  pilotTrack: 'gu';
  defaultMode: LecturePlayerMode;
  recommendedOrder: LecturePlayerMode[];
  algorithmIds: string[];
  tissueLayerSets: LectureTissueLayerSet[];
  entityCards: DxEntityCard[];
  pitfalls: LecturePitfallCard[];
  quickChecks: LectureQuickCheck[];
  workflowSummary: string[];
  relatedTutorialQueries: string[];
  referenceFocusTerms: string[];
}

export interface ModuleData {
  topic: string;
  case_tutorial: CaseTutorial;
  mcqs: MCQ[];
  flashcards: Flashcard[];
  status: string;
}

export type ActiveCurriculumSubspecialty =
  | 'Foundations'
  | 'Clinical Pathology'
  | 'Breast'
  | 'Gynecologic'
  | 'Genitourinary'
  | 'Gastrointestinal'
  | 'Hepatobiliary & Pancreatic'
  | 'Thoracic'
  | 'Head & Neck / Endocrine'
  | 'Skin / Melanocytic'
  | 'Soft Tissue / Bone'
  | 'Neuropathology'
  | 'Pediatric / Placental';

export type ActiveCurriculumPriority = 'core' | 'high-yield' | 'advanced';
export type ActiveCurriculumPromotionState = 'canonical' | 'staged' | 'archived';

export type LearnerLevel = 'PGY1' | 'PGY2' | 'PGY3' | 'PGY4' | 'PGY5_FELLOW' | 'ATTENDING';

export type CompetencyDomain =
  | 'foundations'
  | 'organ-system knowledge'
  | 'image recognition'
  | 'differential diagnosis'
  | 'ancillary selection'
  | 'report writing'
  | 'staging/synoptic'
  | 'quality assurance'
  | 'teaching';

export type AutonomyTarget =
  | 'observe'
  | 'guided'
  | 'supervised'
  | 'independent draft'
  | 'near-independent'
  | 'consult-level'
  | 'faculty calibration';

export type EditorialStatus = 'draft' | 'reviewed' | 'canonical';

export interface ContentTrustMetadata {
  editorialStatus: EditorialStatus;
  lastReviewed: string;
  provenance: string;
  sourceQuality: 'local validated' | 'curated public' | 'imported source' | 'derived planning';
}

export interface LearnerCompetencyMetadata {
  learnerLevels: LearnerLevel[];
  primaryLevel: LearnerLevel;
  competencyDomains: CompetencyDomain[];
  difficulty: 'introductory' | 'core' | 'advanced' | 'expert';
  rotation: ActiveCurriculumSubspecialty | 'Cross-Rotation' | 'Faculty Development';
  autonomyTarget: AutonomyTarget;
  milestoneOutcome: string;
  facultyUse?: 'assign' | 'teach' | 'calibrate' | 'author';
  trust: ContentTrustMetadata;
}

export interface CompetencyMatrixRecord extends LearnerCompetencyMetadata {
  id: string;
  title: string;
  summary: string;
  sourceType: 'curriculum' | 'lecture' | 'tutorial' | 'atlas' | 'signout' | 'assessment' | 'faculty';
  linkedSection: Section;
  linkedModuleId?: string;
  linkedQuery?: string;
  availableNow: boolean;
  gapSummary: string;
  closureAction: string;
}

export interface AssessmentRubricCriterion {
  id: string;
  label: string;
  domain: CompetencyDomain;
  learnerLevels: LearnerLevel[];
  maxScore: number;
  passingScore: number;
  safetyCritical?: boolean;
  feedbackPrompt: string;
}

export interface AssessmentRubric {
  id: string;
  title: string;
  appliesTo: 'signout' | 'visual challenge' | 'lecture check' | 'faculty calibration';
  criteria: AssessmentRubricCriterion[];
}

export type AbpathPrecisionMode =
  | 'literal'
  | 'nearest-valid-deep'
  | 'cross-domain-governed'
  | 'local-teaching-only';

export type AbpathAnchorConfidence = 'high' | 'moderate' | 'low';

export type AbpathTestableTask =
  | 'recognize'
  | 'interpret'
  | 'calculate'
  | 'troubleshoot'
  | 'select-next-test'
  | 'manage-critical-result'
  | 'quality-regulatory';

export type AbpathExamRisk = 'high-yield' | 'medium-yield' | 'low-yield';

export type AbpathReviewStatus = 'confirmed' | 'needs-faculty-review';

export type AbpathNearestValidReason =
  | 'disease narrower than CP spec'
  | 'modern entity not literal in spec'
  | 'workflow concept distributed across multiple spec nodes'
  | 'interactive artifact teaches operational interpretation';

export interface TutorialAbpathScope {
  domain: 'AP' | 'CP';
  root: string;
  primaryPath: string;
  title: string;
  confidence: 'high' | 'medium' | 'low';
  source: string;
  sourceLine?: number | null;
}

export interface ValidatedMappingManifestRow {
  key: string;
  id: string;
  title: string;
  file: string;
  track: 'surgical-path' | 'clinical-path' | 'cross-cutting';
  sourceType: 'crosswalk' | 'cp-governance' | 'interactive-cp';
  abpathDomain: 'AP' | 'CP';
  sourceAnchorExists: boolean;
  validatedForPromotion: boolean;
  governancePending: boolean;
  promotionStatus: 'validated' | 'governance-pending' | 'excluded';
  canonicalForId: boolean;
  canonicalSourceKey: string;
  abpathRoot: string;
  abpathPrimaryPath: string;
  abpathSpecVersion?: string;
  abpathPrecisionMode?: AbpathPrecisionMode;
  abpathAnchorConfidence?: AbpathAnchorConfidence | 'medium';
  abpathReviewStatus?: AbpathReviewStatus;
  abpathExamRisk?: AbpathExamRisk;
  abpathTestableTask?: AbpathTestableTask[];
  nearestValidReason?: AbpathNearestValidReason;
  crossDomainJustification?: string;
  facultyReviewReason?: string;
  reviewOwner?: string;
  reviewAction?: string;
  conflictFlags?: string[];
}

export interface ValidatedMappingsManifest {
  generatedAt: string;
  sourceFingerprint: string;
  source?: {
    crosswalk: string;
    cpGovernanceReport: string;
    cpModules: string;
    cpInteractiveTutorials: string;
    tutorialLabelValidation: string;
  };
  summary?: {
    totalRows: number;
    canonicalRowCount: number;
    validatedRowCount: number;
    governancePendingRowCount: number;
    excludedRowCount: number;
    clinicalPathValidatedCount: number;
    cpDomainValidatedCount: number;
  };
  tutorialKeysValidated: string[];
  tutorialIdsValidated: string[];
  blockedTutorialKeys: string[];
  blockedTutorialIds: string[];
  rows: ValidatedMappingManifestRow[];
}

export interface PathfndrPerformanceSnapshot {
  subject: string;
  percentAnswered: number;
  numberAnswered: number;
  totalQuestions: number;
  remainingQuestions: number;
  remainingPercent: number;
  percentCorrect: number;
  correct: number;
  incorrect: number;
  userPercentile?: number;
  allUsersAverage?: number;
  allUsersMedian?: number;
  allUsersMode?: number;
  allUsersRange?: string;
}

export interface ReviewGridTile {
  questionNumber: number;
  domain: string;
  result: 'correct' | 'incorrect' | 'unanswered' | 'flagged';
  questionId?: string;
  abpathAnchorPath?: string;
  timeToAnswerSeconds?: number;
  confidence?: 1 | 2 | 3 | 4 | 5;
}

export interface QuestionOption {
  label?: string;
  text: string;
}

export interface ImportedQuestion {
  source: 'pthfndr_export' | 'manual' | 'pdf_review' | 'anki' | 'custom';
  stem: string;
  options: QuestionOption[];
  selectedAnswer?: string;
  markedCorrectAnswer?: string;
  images?: string[];
  domain?: string;
  abpathAnchorPath?: string;
  importWarnings?: string[];
}

export interface AnswerKeyValidationConfig {
  enabled: boolean;
  compareAgainstInternalKnowledgeBase: boolean;
  flagBiologicallyImplausibleAnswers: boolean;
  requireFacultyReviewForDiscordantItems: boolean;
}

export interface BoardPassingPredictorInputs {
  inServiceScore?: number;
  mcqPracticeSessions: number;
  pthfndrSessions: number;
  ankiAccuracy?: number;
  studyHoursPerWeek?: number;
  grossingExperience?: number;
  feedbackQuality?: number;
  wellBeingScore?: number;
}

export interface BoardPassingPrediction {
  predictedScore: number;
  readinessBand: 'unsafe' | 'borderline' | 'improving' | 'likely_pass' | 'maintenance';
  confidence: 'low' | 'moderate' | 'high';
  limitingFactors: string[];
  nextActions: string[];
}

export interface TimeSeriesPoint {
  label: string;
  value: number;
}

export interface PerformanceForecast {
  subject: string;
  metric: 'percentCorrect' | 'percentAnswered' | 'remainingQuestions' | 'timePerQuestion' | 'percentile';
  observedPoints: TimeSeriesPoint[];
  forecastPoints: TimeSeriesPoint[];
  forecastModel: 'linear' | 'moving_average' | 'prophet' | 'bayesian_mastery';
  warning?: string;
}

export type DidacticsCockpitCard =
  | "Today's board-risk topics"
  | 'Weakest CP domains'
  | 'Questions remaining'
  | 'Accuracy vs percentile'
  | 'Incorrect cluster review'
  | 'Time per question'
  | 'Predicted readiness'
  | 'Next 20-question drill'
  | 'Answer-key discrepancy alerts';

export type DidacticsVisualMode =
  | 'cockpit_dashboard'
  | 'pthfndr_review_grid'
  | 'weakness_heatmap'
  | 'abpath_anchor_map'
  | 'forecast_timeline'
  | 'question_review_stack'
  | 'board_passing_calculator';

export interface DidacticsReviewGridBehavior {
  showTileGrid: boolean;
  groupBy: 'domain' | 'abpathAnchor' | 'testSession';
  tileClickBehavior: 'open_question_review';
  showCorrectIncorrectOverlay: boolean;
  showWeakClusterSummary: boolean;
}

export interface CPGovernanceContract {
  abpathSpecVersion: 'CP_2026_04_10';
  abpathSourceUrl: string;
  abpathRootTopic: string;
  abpathPrimaryPath: string;
  abpathPrimaryLevel: string;
  abpathAnchorSet: string[];
  abpathPrecisionMode: AbpathPrecisionMode;
  abpathAnchorConfidence: AbpathAnchorConfidence;
  abpathTestableTask: AbpathTestableTask[];
  abpathExamRisk: AbpathExamRisk;
  nearestValidReason?: AbpathNearestValidReason;
  crossDomainJustification?: string;
  facultyReviewReason?: string;
  abpathReviewStatus: AbpathReviewStatus;
  boardMasteryFocusTitle: string;
  mustKnowConcepts: string[];
  mustNotMissPitfalls: string[];
  classicBoardStemPatterns: string[];
  calculationOrInterpretationTasks: string[];
  commonWrongAnswerTraps: string[];
}

export interface ActiveCurriculumLectureRef {
  id: string;
  label: string;
}

export interface ActiveCurriculumModule {
  moduleId: string;
  title: string;
  summary: string;
  subspecialty: ActiveCurriculumSubspecialty;
  boardPriority: ActiveCurriculumPriority;
  promotionState: ActiveCurriculumPromotionState;
  recommendedOrder: number;
  patternFamilies: string[];
  specimenContexts: string[];
  plannedAssets: Array<'lectures' | 'tutorials' | 'images' | 'algorithms' | 'assessment'>;
  lectures: ActiveCurriculumLectureRef[];
  referenceFocusTerms: string[];
  tutorialTopics: string[];
  syllabusTopics: string[];
  algorithmTopics: string[];
  assessmentTopics: string[];
  competency?: LearnerCompetencyMetadata;
  cpGovernance?: CPGovernanceContract;
}

export const NEXT_1000_LANE_IDS = [
  'L1_CP_TRUTH',
  'L2_CONTENT_PARITY',
  'L3_LEARNER_UX',
  'L4_WORKUPS_ROUTING',
  'L5_CONTRACTS_VALIDATORS',
] as const;

export type LaneId = typeof NEXT_1000_LANE_IDS[number];

export const NEXT_1000_WAVE_IDS = [
  'W01', 'W02', 'W03', 'W04', 'W05',
  'W06', 'W07', 'W08', 'W09', 'W10',
  'W11', 'W12', 'W13', 'W14', 'W15',
  'W16', 'W17', 'W18', 'W19', 'W20',
] as const;

export type WaveId = typeof NEXT_1000_WAVE_IDS[number];

export const NEXT_1000_CHANGE_STATUSES = [
  'planned',
  'historical-precondition',
  'blocked',
  'ready-next',
] as const;

export type ChangeStatus = typeof NEXT_1000_CHANGE_STATUSES[number];

export const NEXT_1000_CONTENT_OUTPUTS = [
  'NONE',
  'LEARNER_COPY',
  'FACULTY_REVIEW_PACKET',
  'BOARD_PREP_ASSET',
  'DEMO_ARTIFACT',
  'MANUSCRIPT_ASSET',
  'SPONSOR_PACKET_ASSET',
  'PRODUCT_POSITIONING_ASSET',
] as const;

export type ContentOutput = typeof NEXT_1000_CONTENT_OUTPUTS[number];

export const NEXT_1000_AUDIENCES = [
  'learner',
  'faculty',
  'recruiter',
  'chair',
  'reviewer',
  'product_lead',
  'self',
] as const;

export type Audience = typeof NEXT_1000_AUDIENCES[number];

export const NEXT_1000_REUSE_TARGETS = [
  'Didactic_Series',
  'DERC',
  'Projection_Atlas',
  'Frozens',
  'sponsor_packet',
  'manuscript',
  'portfolio',
] as const;

export type ReuseTarget = typeof NEXT_1000_REUSE_TARGETS[number];

export const NEXT_1000_VALUE_LEVELS = ['low', 'moderate', 'high'] as const;

export type ValueLevel = typeof NEXT_1000_VALUE_LEVELS[number];

export const NEXT_1000_PROOF_STYLES = [
  'CLI_ONLY',
  'CLI_FIRST',
  'CLI_PLUS_BROWSER_LAST_STEP',
] as const;

export type ProofStyle = typeof NEXT_1000_PROOF_STYLES[number];

export interface Next1000ChangeRecord {
  id: string;
  wave: WaveId;
  lane: LaneId;
  title: string;
  why_this_matters: string;
  current_problem: string;
  done_when: string;
  required_files: string[];
  do_not_touch: string[];
  contracts: string[];
  depends_on: string[];
  proof_commands: string[];
  status: ChangeStatus;
  wave_sync_rule: string;
  proof_style: ProofStyle;
  content_output: ContentOutput;
  audience: Audience;
  reuse_target: ReuseTarget;
  public_safe: boolean;
  phi_safe: boolean;
  career_value: ValueLevel;
  product_value: ValueLevel;
}

export interface Next1000WaveSummary {
  id: WaveId;
  title: string;
  group: string;
  recordCount: number;
  artifactCoverage: {
    learnerFacing: boolean;
    proofValidator: boolean;
    sponsorReviewer: boolean;
    demoProduct: boolean;
  };
  contentOutputs: Array<{ contentOutput: ContentOutput; count: number }>;
  reuseTargets: Array<{ reuseTarget: ReuseTarget; count: number }>;
}

export interface Next1000LaneSummary {
  id: LaneId;
  title: string;
  recordCount: number;
  contentOutputs: Array<{ contentOutput: ContentOutput; count: number }>;
  reuseTargets: Array<{ reuseTarget: ReuseTarget; count: number }>;
}

export interface Next1000Program {
  title: string;
  summary: string;
  lanes: Array<{
    id: LaneId;
    public_label: string;
    title: string;
    wave_goal_prefix: string;
    expected_outputs: string[];
  }>;
  waves: Array<{
    id: WaveId;
    title: string;
    group: string;
    goal: string;
    wave_sync_rule: string;
    prerequisites: string[];
  }>;
  wave_groups: Array<{
    id: string;
    title: string;
    waves: WaveId[];
    focus: string;
  }>;
  records: Next1000ChangeRecord[];
}
