export enum Section {
  HOME = 'Home',
  JOB_AID = 'Job Aid & Atlas',
  CASE_STUDY = 'Case Study',
  CASE_LIBRARY = 'Case Library',
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
