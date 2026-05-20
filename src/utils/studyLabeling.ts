export const normalizePublicStudyLabel = (label: string) =>
  label
    .replace(/_/g, ' ')
    .replace(/\s*\/\s*/g, ' / ')
    .replace(/\s*\+\s*/g, ' + ')
    .replace(/\s*>\s*/g, ' > ')
    .replace(/\s+/g, ' ')
    .trim();

export const normalizePublicStudyPath = (path?: string | null) => {
  if (!path) {
    return '';
  }

  return path
    .split('>')
    .map((segment) => normalizePublicStudyLabel(segment))
    .join(' > ');
};
