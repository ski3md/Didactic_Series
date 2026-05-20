export interface PathologyStateSignal {
  label: string;
  cue: string;
  tone: string;
}

export interface ImmunophenotypeBranch {
  title: string;
  description: string;
  markers: string[];
}

export interface ReasoningProgressionStep {
  key: 'pattern' | 'compartment' | 'differential' | 'ancillary' | 'wording';
  label: string;
  guidance: string;
}

interface ReasoningProgressionProfile {
  pattern: string;
  compartment: string;
  differential: string;
  ancillary: string;
  wording: string;
}

export interface PathologyCognition {
  uncertaintyState: PathologyStateSignal;
  operationalState: PathologyStateSignal;
  immunophenotypeBranch?: ImmunophenotypeBranch;
  reasoningProgression: ReasoningProgressionStep[];
}

const DEFAULT_TONE = 'bg-slate-100 text-slate-900 border-slate-300';
const DEFAULT_UNCERTAINTY = createStateSignal('Descriptive first', 'Name the pattern before closure');
const DEFAULT_OPERATIONAL = createStateSignal(
  'Reviewed example',
  'Ready for teaching review',
  'bg-emerald-50 text-emerald-900 border-emerald-200'
);
const DEFAULT_REASONING_PROGRESSION_PROFILE: ReasoningProgressionProfile = {
  pattern: 'Name the dominant microscopic pattern before reaching for a diagnosis.',
  compartment: 'Anchor the process to the compartment of origin and the tissue you are actually seeing.',
  differential: 'Keep the closest mimics open until architecture and cytology narrow the field.',
  ancillary: 'Use stains or biomarkers only when morphology leaves a real fork in the workup.',
  wording: 'Word the impression to match the evidence, using descriptive language when certainty is limited.',
};
const REASONING_STEP_ORDER: Array<ReasoningProgressionStep['key']> = [
  'pattern',
  'compartment',
  'differential',
  'ancillary',
  'wording',
];

const IMMUNOPHENOTYPE_BRANCHES: Record<string, ImmunophenotypeBranch> = {
  'small blue cell': {
    title: 'Immunophenotype branch',
    description: 'Sort the small round blue cell differential by lineage before naming a tumor.',
    markers: ['CD99', 'desmin', 'myogenin', 'synaptophysin', 'TdT', 'keratin', 'WT1', 'NKX2.2'],
  },
  'clear cell': {
    title: 'Immunophenotype branch',
    description: 'Use site-defining markers early because clear cytoplasm alone is not specific.',
    markers: ['PAX8', 'HNF1B', 'Napsin A', 'AMACR', 'GATA3', 'TTF1', 'CK7'],
  },
  'spindle cell': {
    title: 'Immunophenotype branch',
    description: 'Separate fibroblastic, myogenic, neural, epithelial, and vascular mimics with a directed panel.',
    markers: ['STAT6', 'S100', 'SOX10', 'desmin', 'SMA', 'keratin', 'CD34', 'MUC4'],
  },
  papillary: {
    title: 'Immunophenotype branch',
    description: 'Choose a site-aware panel once the architecture points toward a papillary lesion.',
    markers: ['WT1', 'PAX8', 'TTF1', 'thyroglobulin', 'GATA3', 'CK7'],
  },
  basaloid: {
    title: 'Immunophenotype branch',
    description: 'Basaloid tumors often need lineage confirmation before the wording becomes safe.',
    markers: ['p40', 'p63', 'CK5/6', 'CD117', 'MYB', 'HPV ISH'],
  },
};

const REASONING_PROGRESSION_PROFILES: Record<string, ReasoningProgressionProfile> = {
  'small blue cell': {
    pattern: 'Recognize the small round blue cell pattern and note rosettes, crush, or necrosis.',
    compartment: 'Anchor the lesion to the age group, site, and tissue compartment before naming a tumor family.',
    differential: 'Keep hematolymphoid, neuroendocrine, primitive neuroectodermal, rhabdomyoblastic, and poorly differentiated mimics open.',
    ancillary: 'Move quickly to lineage-defining immunophenotype and molecular tests.',
    wording: 'Use small-round-blue-cell language when morphology alone is not safe enough for a final entity call.',
  },
  'clear cell': {
    pattern: 'Call the clear-cell change first and note whether it reflects glycogen, lipid, or artifact-like clearing.',
    compartment: 'Anchor the lesion to renal, gynecologic, salivary, pulmonary, or other site-specific compartments.',
    differential: 'Keep metastatic and primary clear-cell mimics open until the site and lineage align.',
    ancillary: 'Use site-defining markers early because clear cytoplasm is only a clue.',
    wording: 'Use clear-cell wording that keeps the likely lineage explicit and the unsupported subtype open.',
  },
  'spindle cell': {
    pattern: 'Call out the spindle-cell pattern and note whether it looks bland, atypical, or pleomorphic.',
    compartment: 'Decide whether the lesion tracks mesenchymal, epithelial, melanocytic, or neural territory.',
    differential: 'Keep fibroblastic, myogenic, peripheral nerve sheath, vascular, and spindle epithelial mimics in play.',
    ancillary: 'Order a lineage panel only after the morphologic buckets are explicit.',
    wording: 'Use spindle-cell wording that preserves the active differential until lineage is supported.',
  },
  papillary: {
    pattern: 'Start by confirming true papillary architecture rather than a crowded glandular mimic.',
    compartment: 'Tie the papillae to the organ compartment and lining epithelium that make sense for the case.',
    differential: 'Compare the main papillary mimics for that site before settling on one entity.',
    ancillary: 'Use site-directed markers when papillary architecture alone does not lock the diagnosis.',
    wording: 'Phrase the impression around papillary morphology first, then add the favored entity if justified.',
  },
  basaloid: {
    pattern: 'State the basaloid pattern and whether necrosis, palisading, or cribriform change is present.',
    compartment: 'Localize the process to surface epithelium, adnexal structures, salivary-type tissue, or deeper soft tissue.',
    differential: 'Keep high-grade squamous, adnexal, salivary-type, and metastatic basaloid mimics open.',
    ancillary: 'Use lineage-defining stains or HPV-associated studies before closing the case.',
    wording: 'Choose wording that reflects a basaloid malignant process when the exact subtype is still evolving.',
  },
  granulomatous: {
    pattern: 'Name the granulomatous reaction pattern and note necrotizing versus non-necrotizing features.',
    compartment: 'Localize the granulomas to mucosa, lymph node, skin, lung, or another organ-specific compartment.',
    differential: 'Keep infection, foreign-body reaction, systemic inflammatory disease, and tumor-associated granulomas in mind.',
    ancillary: 'Let AFB, GMS, polarization, and microbiology correlation decide the next branch.',
    wording: 'Report granulomatous inflammation descriptively before forcing an etiology that the slide does not prove.',
  },
};

function createStateSignal(label: string, cue: string, tone = DEFAULT_TONE): PathologyStateSignal {
  return { label, cue, tone };
}

function normalizeEvidence(values: Array<string | undefined>): string {
  return values.filter(Boolean).join(' ').toLowerCase();
}

function inferMorphologyFamily(haystack: string): string | undefined {
  if (/\bsmall cell\b|\bsmall blue\b|\bsmall round blue\b/.test(haystack)) {
    return 'small blue cell';
  }
  if (/\bclear cell\b/.test(haystack)) {
    return 'clear cell';
  }
  if (/\bspindle\b|\bsolitary fibrous\b|\bsft\b/.test(haystack)) {
    return 'spindle cell';
  }
  if (/\bpapillary\b/.test(haystack)) {
    return 'papillary';
  }
  if (/\bbasaloid\b/.test(haystack)) {
    return 'basaloid';
  }
  if (/\bgranuloma|\bgranulomatous\b/.test(haystack)) {
    return 'granulomatous';
  }
  return undefined;
}

export function getUncertaintyState(...values: Array<string | undefined>): PathologyStateSignal {
  const haystack = normalizeEvidence(values);

  if (/\bfavor|\bfavoured|\bfavored\b/.test(haystack)) {
    return createStateSignal('Favored pattern', 'Most likely diagnosis is visible', 'bg-emerald-50 text-emerald-900 border-emerald-200');
  }
  if (/\bsuspicious|\batypical|\bconcerning\b/.test(haystack)) {
    return createStateSignal('Suspicious pattern', 'Escalate before final wording', 'bg-rose-50 text-rose-900 border-rose-200');
  }
  if (/\bcannot exclude|\bdefer|\bindeterminate\b/.test(haystack)) {
    return createStateSignal('Cannot exclude', 'Keep the wording open', 'bg-rose-50 text-rose-900 border-rose-200');
  }
  if (/\bdifferential|\bmimic|\bversus\b/.test(haystack)) {
    return createStateSignal('Differential only', 'Mimics still active', 'bg-amber-50 text-amber-900 border-amber-200');
  }
  if (/\bdescriptive|\breactive|\bgranulomatous\b/.test(haystack)) {
    return createStateSignal('Descriptive first', 'Reaction pattern leads first');
  }

  return DEFAULT_UNCERTAINTY;
}

export function getOperationalState(...values: Array<string | undefined>): PathologyStateSignal {
  const haystack = normalizeEvidence(values);

  if (/\bfrozen\b/.test(haystack)) {
    return createStateSignal('Frozen pending permanent', 'Use limited-call language', 'bg-orange-50 text-orange-900 border-orange-200');
  }
  if (/\bmolecular|\bkras|\bngs|\bmutation|\bbiomarker\b/.test(haystack)) {
    return createStateSignal('Molecular pending', 'Result may change classification', 'bg-indigo-50 text-indigo-900 border-indigo-200');
  }
  if (/\bck7|\bpax8|\bttf1|\bgata3|\bafb|\bgms|\bpas|\bstat6|\bkeratin|\bsox10|\bs100|\bdesmin|\bsma|\bimmun|\bstain/i.test(haystack)) {
    return createStateSignal('Ancillary pending', 'Stain evidence is part of the workup', 'bg-sky-50 text-sky-900 border-sky-200');
  }
  if (/\bcompare|\bmimic|\bdifferential|\bversus\b/.test(haystack)) {
    return createStateSignal('Differential open', 'Compare close look-alikes', 'bg-violet-50 text-violet-900 border-violet-200');
  }
  if (/\bdiscordance|\bqa|\bsafety critical\b/.test(haystack)) {
    return createStateSignal('QA flagged', 'High-cost miss pattern', 'bg-rose-50 text-rose-900 border-rose-200');
  }

  return DEFAULT_OPERATIONAL;
}

export function getImmunophenotypeBranch(...values: Array<string | undefined>): ImmunophenotypeBranch | undefined {
  const haystack = normalizeEvidence(values);
  const family = inferMorphologyFamily(haystack);
  return family ? IMMUNOPHENOTYPE_BRANCHES[family] : undefined;
}

export function getReasoningProgression(...values: Array<string | undefined>): ReasoningProgressionStep[] {
  const haystack = normalizeEvidence(values);
  const family = inferMorphologyFamily(haystack);
  const profile = (family && REASONING_PROGRESSION_PROFILES[family]) || DEFAULT_REASONING_PROGRESSION_PROFILE;

  return REASONING_STEP_ORDER.map((key) => ({
    key,
    label: key,
    guidance: profile[key],
  }));
}

export function getPathologyCognition(...values: Array<string | undefined>): PathologyCognition {
  const uncertaintyState = getUncertaintyState(...values);
  const operationalState = getOperationalState(...values);
  const immunophenotypeBranch = getImmunophenotypeBranch(...values);
  const reasoningProgression = getReasoningProgression(...values);

  return {
    uncertaintyState,
    operationalState,
    immunophenotypeBranch,
    reasoningProgression,
  };
}
