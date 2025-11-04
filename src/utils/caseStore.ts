import { Case, CaseStudy } from '../types.ts';
import { 
    apiGetCases, 
    apiSaveCases,
    apiGetCaseStudies,
    apiSaveCaseStudies
} from '../api/mockApi.ts';

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
export const getCases = async (): Promise<CasesStore> => {
  return await apiGetCases();
};

export const saveCases = async (store: CasesStore): Promise<void> => {
  await apiSaveCases(store);
};


// --- Case Studies ---
export const getCaseStudies = async (): Promise<CaseStudiesStore> => {
  return await apiGetCaseStudies();
};

export const saveCaseStudies = async (store: CaseStudiesStore): Promise<void> => {
  await apiSaveCaseStudies(store);
};