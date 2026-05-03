export enum Section {
  HOME = 'Home',
  SURGICAL_PATH_CURRICULUM = 'Pathology Curriculum',
  JOB_AID = 'Job Aid & Atlas',
  CASE_STUDY = 'Case Study',
  CASE_LIBRARY = 'Case Library',
  LECTURES = 'Lectures',
  TUTORIALS = 'Tutorials',
  DOWNLOADS_LIBRARY = 'Downloads Library',
  SYLLABUS_EXPLORER = 'Syllabus Explorer',
  VISUAL_CHALLENGE = 'Visual Challenge',
  DIAGNOSTIC_PATHWAY = 'Diagnostic Pathway',
  AI_CASE_GENERATOR = 'AI Case Generator',
  IMAGE_GALLERIES = 'Image Galleries',
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

export interface CaseData {
  clinicalHistory: string;
  radiologicFindings: string;
  histologicDescription: string;
  diagnosis: string;
}

export interface StoredImage {
  id: string;
  src: string;
  title: string;
  description: string;
  uploader: string;
  timestamp: number;
  family?: string;
  stain?: string;
  magnification?: string;
  sourceUrl?: string;
  collection?: 'curated' | 'promoted' | 'official' | 'community';
  readOnly?: boolean;
  // Optional enriched data
  entity?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  cells?: string[];
  benchmarkTraceability?: BenchmarkTraceabilityRecord;
}

export interface QuizAnswer {
  question: string;
  selectedAnswer: string;
  isCorrect: boolean;
  timestamp: number;
}

export interface AICaseLog {
  caseData: CaseData;
  userDx: string;
  feedback: string;
  timestamp: number;
}

export interface UserActivity {
  Analysis?: Record<string, QuizAnswer>;
  Evaluation?: QuizAnswer;
  VisualChallenge?: Record<string, QuizAnswer>;
  DiagnosticPathway?: Record<string, QuizAnswer>;
  AICaseGenerator?: AICaseLog[];
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
}

export type ImportedContentType =
  | 'lecture'
  | 'tutorial'
  | 'algorithm'
  | 'image'
  | 'syllabus-topic'
  | 'syllabus-tree'
  | 'syllabus-source'
  | 'network';

export type BenchmarkDiscipline = 'AP' | 'CP' | 'mixed' | 'domain-adjacent';

export type BenchmarkConformanceLevel = 'L0' | 'L1' | 'L2' | 'L3' | 'L4';

export type BenchmarkLearnerLevel = 'C' | 'AR' | 'F' | 'C/AR' | 'AR/F';

export interface SyllabusAnchor {
  categoryId?: string;
  topic: string;
  summary: string;
  difficulty?: 'C' | 'AR' | 'F';
  anchorType?: 'normalized' | 'manual' | 'gap';
}

export interface BenchmarkRelatedContent {
  id: string;
  title: string;
  contentType: ImportedContentType | 'image-family';
}

export interface BenchmarkTraceabilityRecord {
  discipline: BenchmarkDiscipline;
  conformanceLevel: BenchmarkConformanceLevel;
  learnerLevel: BenchmarkLearnerLevel;
  promotionSurface: string;
  uxEntryPoint: string;
  reviewStatus: 'seeded' | 'ready' | 'needs-curation' | 'hold';
  benchmarkTags: string[];
  promotionRationale: string;
  diagnosticFocus?: string;
  syllabusAnchors: SyllabusAnchor[];
  relatedContent?: BenchmarkRelatedContent[];
  normalizedSyllabusGap?: string;
}

export interface ImportedContentRecord {
  id: string;
  sourceRepo: string;
  sourcePath: string;
  contentType: ImportedContentType;
  title: string;
  category: string | null;
  summary: string | null;
  body: string;
  learningObjectives: string[];
  slides: Array<Record<string, unknown>>;
  mcqs: TutorialMCQ[];
  flashcards: TutorialFlashcard[];
  references: string[];
  tags: string[];
  provenance: Record<string, unknown>;
  benchmarkTraceability?: BenchmarkTraceabilityRecord;
}

export interface TutorialMCQ {
  question: string;
  choices: string[];
  answer: string;
  rationale?: string;
  type?: string;
}

export interface TutorialFlashcard {
  front: string;
  back: string;
  tag?: string;
}

export interface LectureSlide {
  title?: string;
  type?: string;
  content?: string;
  config?: Record<string, unknown>;
}

export interface LectureEntityCard {
  entityId?: string;
  summary?: string;
  keyMorphology?: string[];
  keyIHC?: {
    positive?: string[];
    negative?: string[];
    patterns?: string[];
  };
  pearls?: Array<{
    text?: string;
    type?: string;
  }>;
}

export interface SyllabusTopicProvenance {
  topic_id?: string;
  title?: string;
  clean_title?: string;
  difficulty?: string;
  level?: number;
  category_id?: string;
  parent_topic_id?: string | null;
  path_context?: string[];
  source_line?: number;
  is_valid_topic?: boolean;
}

export type SurgicalPathSubspecialty =
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
  | 'Hematolymphoid Interface'
  | 'Neuropathology'
  | 'Pediatric / Placental';

export type SurgicalPathPatternFamily =
  | 'clear-cell'
  | 'spindle-cell'
  | 'papillary'
  | 'cystic'
  | 'mucinous'
  | 'small-round-blue-cell'
  | 'oncocytic'
  | 'necrotizing-inflammatory-mimic'
  | 'neuroendocrine'
  | 'glandular'
  | 'lymphoid-interface'
  | 'melanocytic'
  | 'serrated-dysplasia'
  | 'borderline-ovarian'
  | 'bone-cartilage'
  | 'hematology'
  | 'coagulation'
  | 'transfusion-medicine'
  | 'plasma-cell-disorder';

export type SurgicalPathSpecimenContext =
  | 'biopsy'
  | 'excision'
  | 'resection'
  | 'margin'
  | 'lymph-node'
  | 'frozen-section'
  | 'cytology'
  | 'consult-triage'
  | 'lab-workup'
  | 'transfusion-reaction'
  | 'blood-bank';

export type SurgicalPathBoardPriority = 'core' | 'high-yield' | 'advanced';

export type SurgicalPathPromotionState = 'staged' | 'canonical' | 'archived';

export type SurgicalPathAssetKind =
  | 'lectures'
  | 'tutorials'
  | 'algorithms'
  | 'images'
  | 'syllabus'
  | 'assessment';

export interface SurgicalPathAssetRef {
  id: string;
  label: string;
}

export interface CurriculumNavigationIntent {
  selectedId?: string;
  query?: string;
  track?: string;
  filter?: string;
}

export interface SurgicalPathModule {
  moduleId: string;
  title: string;
  summary: string;
  subspecialty: SurgicalPathSubspecialty;
  patternFamilies: SurgicalPathPatternFamily[];
  specimenContexts: SurgicalPathSpecimenContext[];
  boardPriority: SurgicalPathBoardPriority;
  promotionState: SurgicalPathPromotionState;
  priorityScore: number;
  recommendedOrder: number;
  relatedModules: string[];
  linkedLectureIds: string[];
  linkedTutorialIds: string[];
  linkedAlgorithmIds: string[];
  linkedImageIds: string[];
  linkedSyllabusTopicIds: string[];
  plannedAssets: SurgicalPathAssetKind[];
  lectures: SurgicalPathAssetRef[];
  tutorials: SurgicalPathAssetRef[];
  algorithms: SurgicalPathAssetRef[];
  images: SurgicalPathAssetRef[];
  syllabus: SurgicalPathAssetRef[];
  navigationIntents?: Partial<Record<'lectures' | 'tutorials' | 'images' | 'syllabus', CurriculumNavigationIntent>>;
}
