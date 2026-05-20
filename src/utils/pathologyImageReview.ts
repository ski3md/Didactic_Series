const ORGAN_SYSTEM_LABELS: Record<string, string> = {
  breast: 'Breast',
  gynecologic: 'Gynecologic',
  gastrointestinal: 'GI',
  gi: 'GI',
  gu: 'Genitourinary',
  thoracic: 'Thoracic',
  hpb: 'Hepatobiliary / Pancreas',
  general: 'General pathology',
};

const MORPHOLOGY_PATTERNS: Array<{ tag: string; patterns: RegExp[] }> = [
  { tag: 'spindle cell', patterns: [/\bspindle\b/i, /\bsolitary fibrous\b/i, /\bsft\b/i] },
  { tag: 'papillary', patterns: [/\bpapillary\b/i] },
  { tag: 'basaloid', patterns: [/\bbasaloid\b/i] },
  { tag: 'mucinous', patterns: [/\bmucinous\b/i, /\bmucin\b/i] },
  { tag: 'clear cell', patterns: [/\bclear cell\b/i] },
  { tag: 'biphasic', patterns: [/\bbiphasic\b/i] },
  { tag: 'necrotic', patterns: [/\bnecros/i] },
  { tag: 'granulomatous', patterns: [/\bgranuloma/i, /\bgranulomatous\b/i] },
  { tag: 'small blue cell', patterns: [/\bsmall cell\b/i, /\bsmall blue\b/i] },
  { tag: 'oncocytic', patterns: [/\boncocytic\b/i, /\boncocyt/i] },
  { tag: 'gland-forming', patterns: [/\bgland/i, /\badenocarcinoma\b/i] },
];

const TITLE_NORMALIZATION_RULES: Array<[RegExp, string]> = [
  [/^xing mesonephric ca\b/i, 'Mesonephric-like adenocarcinoma'],
  [/^xing mesonephric\b/i, 'Mesonephric lesion'],
  [/\bca\b/i, 'carcinoma'],
  [/\bhe\b/gi, 'H&E'],
  [/\bck7\b/gi, 'CK7'],
  [/\bpax8\b/gi, 'PAX8'],
  [/\bttf1\b/gi, 'TTF1'],
  [/\bgata3\b/gi, 'GATA3'],
];

const SEARCH_ALIASES: Array<{ trigger: RegExp; terms: string[] }> = [
  {
    trigger: /\bmesonephric\b/i,
    terms: [
      'mesonephric',
      'mesonephric-like adenocarcinoma',
      'mesonephric remnants',
      'mesonephric hyperplasia',
      'gynecologic gata3',
      'gynecologic ttf1',
      'kras mutated mullerian',
      'clear cell differential',
      'endometrioid differential',
    ],
  },
  {
    trigger: /\bgranuloma|\bgranulomatous\b/i,
    terms: ['granulomatous', 'necrotizing', 'non-necrotizing', 'afb', 'gms', 'fungal differential'],
  },
];

const toWords = (value?: string) =>
  (value || '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const toTitleCase = (value: string) =>
  value
    .split(' ')
    .filter(Boolean)
    .map((part) => {
      if (/^(H&E|CK7|PAX8|TTF1|GATA3|ER|PR|HER2|CD\d+|P\d+|WT1|Napsin A|GMS|AFB)$/i.test(part)) {
        return part.toUpperCase().replace('NAPSIN A', 'Napsin A');
      }
      if (/^\d+x$/i.test(part)) {
        return part.toLowerCase();
      }
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join(' ');

export const normalizePathologyTitle = (value?: string) => {
  let normalized = toWords(value);
  for (const [pattern, replacement] of TITLE_NORMALIZATION_RULES) {
    normalized = normalized.replace(pattern, replacement);
  }
  normalized = normalized.replace(/\b(1|2|4|10|20|40)\s+(?=\d\b)/g, '$1x ');
  normalized = normalized.replace(/\b(\d{1,3}x)\b/gi, (_, mag) => mag.toLowerCase());
  normalized = normalized.replace(/\s+/g, ' ').trim();
  return toTitleCase(normalized);
};

export const inferMagnification = (...values: Array<string | undefined>) => {
  const haystack = values.filter(Boolean).join(' ');
  const match = haystack.match(/\b(\d{1,3})\s*x\b/i) || haystack.match(/\b(\d{1,3}x)\b/i);
  return match ? `${String(match[1]).replace(/x$/i, '')}x` : '';
};

export const inferStain = (...values: Array<string | undefined>) => {
  const haystack = values.filter(Boolean).join(' ');
  const match = haystack.match(/\b(H&E|CK7|PAX8|TTF1|GATA3|ER|PR|HER2|GMS|AFB|PAS|CD10|CD117|p16|p40|p63)\b/i);
  return match ? match[1].replace(/^he$/i, 'H&E') : '';
};

export const inferOrganSystem = (specialty?: string) =>
  ORGAN_SYSTEM_LABELS[(specialty || '').toLowerCase()] || toTitleCase(toWords(specialty || ''));

export const inferMorphologyTags = (...values: Array<string | undefined>) => {
  const haystack = values.filter(Boolean).join(' ');
  return MORPHOLOGY_PATTERNS.filter((entry) => entry.patterns.some((pattern) => pattern.test(haystack))).map(
    (entry) => entry.tag
  );
};

export const buildPathologySearchText = (...values: Array<string | undefined>) => {
  const base = values.filter(Boolean).join(' ');
  const aliasTerms = SEARCH_ALIASES.filter((entry) => entry.trigger.test(base)).flatMap((entry) => entry.terms);
  return `${base} ${aliasTerms.join(' ')}`.toLowerCase();
};
