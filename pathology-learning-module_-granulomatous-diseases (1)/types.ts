export interface User {
  username: string;
  isAdmin?: boolean;
  email?: string;
}

export enum Section {
  HOME = 'Home',
  JOB_AID = 'Job Aid',
  CASE_STUDY = 'Case Study',
  VISUAL_CHALLENGE = 'Visual Challenge',
  DIAGNOSTIC_PATHWAY = 'Diagnostic Pathway',
  AI_CASE_GENERATOR = 'AI Case Generator',
  ANALYSIS = 'Analysis',
  DESIGN = 'Design',
  DEVELOPMENT = 'Development',
  EVALUATION = 'Evaluation',
  ASSESSMENT = 'Assessment', // Added to match usage in App.tsx
  ADMIN = 'Admin View',
}

// Types for tracking user responses
export interface CaseData {
    clinicalHistory: string;
    radiologicFindings: string;
    histologicDescription: string;
    diagnosis: string;
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
    [key: string]: any; // To allow for flexible section keys
    AnalysisPhase?: Record<string, QuizAnswer>;
    AssessmentPhase?: QuizAnswer;
    VisualChallenge?: Record<string, QuizAnswer>;
    DiagnosticPathway?: Record<string, QuizAnswer>;
    AICaseGenerator?: AICaseLog[];
}