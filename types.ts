export enum Section {
  HOME = 'Home',
  JOB_AID = 'Job Aid & Atlas',
  CASE_STUDY = 'Case Study',
  CASE_LIBRARY = 'Case Library',
  LECTURES = 'Lectures',
  TUTORIALS = 'Tutorials',
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
  // Optional enriched data
  entity?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  cells?: string[];
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
  | 'syllabus-topic'
  | 'syllabus-tree'
  | 'syllabus-source'
  | 'network';

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
