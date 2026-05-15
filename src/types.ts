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
}
