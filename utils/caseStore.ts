import { Case, CaseStudy } from '../types';

const CASES_KEY = 'pathology_module_cases';
const CASE_STUDIES_KEY = 'pathology_module_case_studies';

type CasesStore = {
    version: string;
    generated: string;
    cases: Record<string, Case>;
}

type CaseStudiesStore = {
    version: string;
    generated: string;
    caseStudies: Record<string, CaseStudy>;
}

// --- Cases ---
export const getCases = (): CasesStore => {
  try {
    const data = localStorage.getItem(CASES_KEY);
    return data ? JSON.parse(data) : { version: '1.0.0', generated: new Date().toISOString(), cases: {} };
  } catch (error) {
    console.error("Failed to parse cases from localStorage:", error);
    return { version: '1.0.0', generated: new Date().toISOString(), cases: {} };
  }
};

export const saveCases = (store: CasesStore): void => {
  try {
    store.generated = new Date().toISOString();
    localStorage.setItem(CASES_KEY, JSON.stringify(store));
  } catch (error) {
    console.error("Failed to save cases to localStorage:", error);
  }
};


// --- Case Studies ---
export const getCaseStudies = (): CaseStudiesStore => {
  try {
    const data = localStorage.getItem(CASE_STUDIES_KEY);
    return data ? JSON.parse(data) : { version: '1.0.0', generated: new Date().toISOString(), caseStudies: {} };
  } catch (error) {
    console.error("Failed to parse case studies from localStorage:", error);
    return { version: '1.0.0', generated: new Date().toISOString(), caseStudies: {} };
  }
};

export const saveCaseStudies = (store: CaseStudiesStore): void => {
  try {
    store.generated = new Date().toISOString();
    localStorage.setItem(CASE_STUDIES_KEY, JSON.stringify(store));
  } catch (error) {
    console.error("Failed to save case studies to localStorage:", error);
  }
};
