import { Section, type StudyWorkspace } from '../types.ts';

/**
 * Canonical workspace keys used in URLs and state persistence.
 */
export enum WorkspaceKey {
  CURRICULUM = 'curriculum',
  LECTURES = 'lectures',
  TUTORIALS = 'tutorials',
  ALGORITHMS = 'algorithms',
  REFERENCE = 'reference',
}

/**
 * Public-facing labels for each workspace.
 * These are governed and should not be changed without checking the UX contract.
 */
export const WORKSPACE_LABELS: Record<string, string> = {
  [WorkspaceKey.CURRICULUM]: 'Curriculum',
  [WorkspaceKey.LECTURES]: 'Lectures',
  [WorkspaceKey.TUTORIALS]: 'Tutorials',
  [WorkspaceKey.ALGORITHMS]: 'Workups',
  [WorkspaceKey.REFERENCE]: 'Reference',
};

/**
 * Mapping from Section to its corresponding WorkspaceKey.
 */
export const SECTION_TO_WORKSPACE_KEY: Partial<Record<Section, WorkspaceKey>> = {
  [Section.PATHOLOGY_CURRICULUM]: WorkspaceKey.CURRICULUM,
  [Section.LECTURE]: WorkspaceKey.LECTURES,
  [Section.DIDACTIC_LECTURES]: WorkspaceKey.LECTURES,
  [Section.DIDACTIC_TUTORIALS]: WorkspaceKey.TUTORIALS,
  [Section.DIDACTIC_ALGORITHMS]: WorkspaceKey.ALGORITHMS,
  [Section.REFERENCE_LIBRARY]: WorkspaceKey.REFERENCE,
};

/**
 * Mapping from WorkspaceKey string back to Section.
 */
export const WORKSPACE_KEY_TO_SECTION: Record<string, Section> = {
  [WorkspaceKey.CURRICULUM]: Section.PATHOLOGY_CURRICULUM,
  [WorkspaceKey.LECTURES]: Section.DIDACTIC_LECTURES,
  [WorkspaceKey.TUTORIALS]: Section.DIDACTIC_TUTORIALS,
  [WorkspaceKey.ALGORITHMS]: Section.DIDACTIC_ALGORITHMS,
  [WorkspaceKey.REFERENCE]: Section.REFERENCE_LIBRARY,
};

/**
 * Resolves the WorkspaceKey for a given Section.
 */
export const getWorkspaceKeyForSection = (section: Section): WorkspaceKey | null => {
  return SECTION_TO_WORKSPACE_KEY[section] ?? null;
};

/**
 * Resolves the Section for a given WorkspaceKey string.
 */
export const getSectionForWorkspaceKey = (workspace: string | null): Section | null => {
  if (!workspace) return null;
  return WORKSPACE_KEY_TO_SECTION[workspace.toLowerCase()] ?? null;
};

/**
 * Helper to ensure a workspace key is valid.
 */
export const isValidWorkspaceKey = (key: string): key is WorkspaceKey => {
  return Object.values(WorkspaceKey).includes(key as WorkspaceKey);
};

/**
 * Casts a Section to a StudyWorkspace if applicable.
 */
export const getStudyWorkspaceForSection = (section: Section): StudyWorkspace | null => {
  const key = getWorkspaceKeyForSection(section);
  if (key === WorkspaceKey.LECTURES || key === WorkspaceKey.TUTORIALS || key === WorkspaceKey.ALGORITHMS) {
    return key as StudyWorkspace;
  }
  return null;
};
