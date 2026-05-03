import syllabusTopicsUrl from '../content/syllabus/syllabus.normalized.json?url';

export interface SyllabusTopicRecord {
  id: string;
  title: string;
  summary: string;
  category: string;
  categoryLabel: string;
  tags: string[];
  body: string;
}

type RawSyllabusRecord = {
  id: string;
  title: string;
  summary?: string;
  category?: string;
  tags?: string[];
  body?: string;
};

const categoryLabels: Record<string, string> = {
  ap_breast: 'AP Breast',
  ap_cyto: 'AP Cytopathology',
  ap_dermpath: 'AP Dermatopathology',
  ap_endo: 'AP Endocrine',
  ap_forensic: 'AP Forensic Pathology',
  ap_gi: 'AP Gastrointestinal',
  ap_gu: 'AP Genitourinary',
  ap_hn: 'AP Head and Neck',
  ap_male_repro: 'AP Male Reproductive',
  ap_neuro: 'AP Neuropathology',
  ap_pediatric: 'AP Pediatric',
  ap_placenta: 'AP Placenta',
  ap_resp: 'AP Respiratory',
  ap_soft: 'AP Soft Tissue / Bone',
  ap_cv: 'AP Cardiovascular',
};

const normalizedCategoryLabel = (category: string) =>
  categoryLabels[category] || category.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

export const loadSyllabusTopics = async (): Promise<SyllabusTopicRecord[]> => {
  const response = await fetch(syllabusTopicsUrl);
  const data = (await response.json()) as RawSyllabusRecord[];
  return data.map((topic) => ({
    id: topic.id,
    title: topic.title,
    summary: topic.summary || topic.title,
    category: topic.category || 'uncategorized',
    categoryLabel: normalizedCategoryLabel(topic.category || 'uncategorized'),
    tags: topic.tags || [],
    body: topic.body || '',
  }));
};

export const getSyllabusCategories = (topics: SyllabusTopicRecord[]) =>
  Array.from(new Map(topics.map((topic) => [topic.category, topic.categoryLabel])).entries())
    .map(([value, label]) => ({ value, label }));

export const findBestSyllabusCategory = (terms: string[]) => {
  const normalizedTerms = terms.map((term) => term.trim().toLowerCase()).filter(Boolean);
  if (normalizedTerms.length === 0) {
    return 'ap_breast';
  }

  const categories = Object.keys(categoryLabels);
  let bestCategory = categories[0];
  let bestScore = -1;

  for (const value of categories) {
    const label = normalizedCategoryLabel(value);
    const haystack = `${value} ${label}`.toLowerCase();
    const score = normalizedTerms.reduce((total, term) => {
      if (haystack.includes(term)) {
        return total + 2;
      }
      return total;
    }, 0);
    if (score > bestScore) {
      bestScore = score;
      bestCategory = value;
    }
  }

  return bestCategory;
};
