export type TeachingSectionKind =
  | 'intro'
  | 'vignette'
  | 'objectives'
  | 'discussion'
  | 'workup'
  | 'findings'
  | 'teaching-points'
  | 'pitfalls'
  | 'management'
  | 'diagnosis'
  | 'references'
  | 'general';

export interface TeachingSection {
  id: string;
  title: string;
  kind: TeachingSectionKind;
  content: string;
  bulletItems: string[];
}

const SECTION_LABELS = [
  'Clinical Vignette',
  'Clinical_Vignette',
  'Objective',
  'Objectives',
  'Learning Objectives',
  'Case Discussion',
  'Case_Discussion',
  'Discussion',
  'Differential Diagnosis',
  'Diagnostic Workup',
  'Laboratory Findings',
  'Microscopic Findings',
  'Histologic Features',
  'Key Features',
  'Teaching Points',
  'Pearls',
  'Pitfall',
  'Pitfalls',
  'Management',
  'Final Diagnosis',
  'Gold Standard Report',
  'References',
];

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export const normalizeImportedTeachingMarkdown = (content: string): string => {
  let normalized = content
    .replace(/\[\[([^\]|#]+)(?:#[^\]|]+)?\|([^\]]+)\]\]/g, '$2')
    .replace(/\[\[([^\]|#]+)(?:#[^\]]+)?\]\]/g, '$1')
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, '  ')
    .replace(/\bClinical_Vignette\b/g, 'Clinical Vignette')
    .replace(/\bCase_Discussion\b/g, 'Case Discussion')
    .replace(/([^\n])#{1,6}\s*(Objective|Objectives)\s*-\s*/gi, '$1\n\n## Learning Objectives\n\n- ')
    .replace(/(^|\n)(Objective|Objectives)\s*-\s*/gi, '$1## Learning Objectives\n\n- ');

  SECTION_LABELS.forEach((label) => {
    const readableLabel = label.replace(/_/g, ' ');
    const escaped = escapeRegExp(label);
    normalized = normalized
      .replace(new RegExp(`([^\\n])#{1,6}\\s*${escaped}\\s*[-:]?\\s*`, 'g'), `$1\n\n## ${readableLabel}\n\n`)
      .replace(new RegExp(`(^|\\n)#{1,6}\\s*${escaped}(?=\\S)`, 'g'), `$1## ${readableLabel}\n\n`)
      .replace(new RegExp(`(^|\\n)${escaped}(?=[A-Z0-9])`, 'g'), `$1## ${readableLabel}\n\n`)
      .replace(new RegExp(`\\s+${escaped}(?=[A-Z0-9])`, 'g'), `\n\n## ${readableLabel}\n\n`)
      .replace(new RegExp(`(^|\\n)${escaped}\\s*[-:]\\s*`, 'g'), `$1## ${readableLabel}\n\n`);
  });

  return normalized
    .replace(/^#\s+(.+?)\s+Case Tutorial\s*$/gm, '# $1\n\n_Clinical case tutorial_')
    .replace(/^#{1,6}\s*(Objective|Objectives)$/gim, '## Learning Objectives')
    .replace(/^#{1,6}\s*(Case Discussion)$/gim, '## Case Discussion')
    .replace(/([.!?])\s*-\s+(?=[A-Z0-9])/g, '$1\n- ')
    .replace(/(## References\n\n)-\s+/g, '$1- ')
    .replace(/(\n## Learning Objectives\n\n)-\s+/g, '$1- ')
    .replace(/(\n-\s+[^\n]+?)\s+-\s+/g, '$1\n- ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

const inferSectionKind = (title: string): TeachingSectionKind => {
  const normalized = title.toLowerCase();
  if (normalized.includes('vignette')) return 'vignette';
  if (normalized.includes('objective')) return 'objectives';
  if (normalized.includes('discussion')) return 'discussion';
  if (normalized.includes('workup') || normalized.includes('differential')) return 'workup';
  if (normalized.includes('finding') || normalized.includes('feature')) return 'findings';
  if (normalized.includes('teaching') || normalized.includes('pearl')) return 'teaching-points';
  if (normalized.includes('pitfall')) return 'pitfalls';
  if (normalized.includes('management')) return 'management';
  if (normalized.includes('diagnosis') || normalized.includes('report')) return 'diagnosis';
  if (normalized.includes('reference')) return 'references';
  return 'general';
};

const extractBulletItems = (content: string) =>
  content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^[-*]\s+/.test(line) || /^\d+\.\s+/.test(line))
    .map((line) => line.replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, '').trim());

export const parseTeachingSections = (content: string): TeachingSection[] => {
  const normalized = normalizeImportedTeachingMarkdown(content);
  const lines = normalized.split('\n');
  const sections: TeachingSection[] = [];
  let currentTitle = 'Overview';
  let currentLines: string[] = [];

  const flush = () => {
    const body = currentLines.join('\n').trim();
    if (!body) return;
    sections.push({
      id: slugify(currentTitle || `section-${sections.length + 1}`),
      title: currentTitle,
      kind: sections.length === 0 && currentTitle === 'Overview' ? 'intro' : inferSectionKind(currentTitle),
      content: body,
      bulletItems: extractBulletItems(body),
    });
  };

  for (const line of lines) {
    const headingMatch = line.match(/^##\s+(.+)$/);
    if (headingMatch) {
      flush();
      currentTitle = headingMatch[1].trim();
      currentLines = [];
      continue;
    }
    currentLines.push(line);
  }
  flush();
  return sections;
};
