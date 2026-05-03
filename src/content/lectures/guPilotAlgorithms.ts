import derivedAlgorithms from '../derived/stainbrain_printable/algorithms.from_service.json';
import { LectureAlgorithmRecord } from '../../types.ts';

interface DerivedAlgorithmRecord {
  id: string;
  title: string;
  category: string;
  summary: string;
  startNodeId: string;
  nodes: Record<string, LectureAlgorithmRecord['nodes'][string]>;
}

const importedAlgorithms = derivedAlgorithms as DerivedAlgorithmRecord[];

const pickDerivedAlgorithm = (id: string): LectureAlgorithmRecord => {
  const algorithm = importedAlgorithms.find((entry) => entry.id === id);
  if (!algorithm) {
    throw new Error(`Missing derived GU algorithm: ${id}`);
  }

  return {
    id: algorithm.id,
    title: algorithm.title,
    category: algorithm.category,
    summary: algorithm.summary,
    startNodeId: algorithm.startNodeId,
    nodes: algorithm.nodes,
  };
};

const bladderAlgorithm: LectureAlgorithmRecord = {
  id: 'algo_bladder_triage',
  title: 'Bladder Lesion Triage',
  category: 'GU',
  summary: 'Specimen-first bladder workflow: papillary vs flat vs invasive, then grade, CIS, invasion, and variant red flags.',
  startNodeId: 'specimen_start',
  nodes: {
    specimen_start: {
      id: 'specimen_start',
      type: 'start',
      title: 'Specimen-first orientation',
      description:
        'Before naming the lesion, define the specimen and staging substrate. Ask whether this is a biopsy/TURBT or cystectomy and whether muscularis propria is actually present.',
      options: [
        {
          label: 'Proceed to architecture triage',
          nextNodeId: 'architecture_gate',
          rationale: 'Bladder sign-out is safest when architecture and specimen context are locked first.',
        },
      ],
    },
    architecture_gate: {
      id: 'architecture_gate',
      type: 'morphology_gate',
      title: 'Architecture gate',
      description:
        'Verify the architecture before reaching for stains. The first fork is papillary, flat, or frankly invasive.',
      morphologyFeatures: [
        'Identify whether fibrovascular cores create a true papillary lesion.',
        'Confirm whether the surface lesion is flat rather than tangentially cut papillae.',
        'Look for irregular nests, single cells, or desmoplastic response suggesting invasion.',
        'Confirm whether muscularis propria is present in the specimen.',
      ],
      recommendedInitialIHC: ['CK20', 'p53', 'CD44'],
      options: [
        {
          label: 'Papillary lesion',
          nextNodeId: 'papillary_grade',
          rationale: 'Papillary lesions are graded first, then checked for invasion.',
        },
        {
          label: 'Flat atypical lesion',
          nextNodeId: 'flat_lesions',
          rationale: 'Reactive atypia, dysplasia, and CIS are the core flat-lesion differential.',
        },
        {
          label: 'Invasive or deeply suspicious lesion',
          nextNodeId: 'invasion_assessment',
          rationale: 'The report hinge is lamina propria versus muscularis propria invasion.',
        },
      ],
    },
    papillary_grade: {
      id: 'papillary_grade',
      type: 'decision',
      title: 'Papillary grading ladder',
      description:
        'Integrate architecture and cytology. Decide whether the lesion remains orderly enough for PUNLMP/low-grade or whether it is disorganized high-grade disease.',
      options: [
        {
          label: 'Orderly architecture, minimal atypia',
          nextNodeId: 'result_low_grade',
          rationale: 'This branch captures papilloma/PUNLMP and low-grade papillary carcinoma logic.',
        },
        {
          label: 'Disordered architecture, pleomorphism, brisk mitoses',
          nextNodeId: 'result_high_grade',
          rationale: 'High-grade papillary disease carries higher recurrence and progression risk.',
        },
        {
          label: 'Papillary lesion with irregular nests or desmoplasia',
          nextNodeId: 'invasion_assessment',
          rationale: 'Papillary tumors still need an invasion readout when the base is irregular.',
        },
      ],
    },
    flat_lesions: {
      id: 'flat_lesions',
      type: 'decision',
      title: 'Reactive atypia vs dysplasia vs CIS',
      description:
        'Use morphology first. Reserve CK20/p53/CD44 for cases where the H&E question is well formed.',
      recommendedReflexIHC: ['CK20', 'p53', 'CD44'],
      options: [
        {
          label: 'Uniform nuclei, preserved maturation, inflammation/instrumentation context',
          nextNodeId: 'result_reactive',
          rationale: 'Reactive atypia can look alarming, but preserved maturation and context matter.',
        },
        {
          label: 'Full-thickness disorder with severe atypia and denudation',
          nextNodeId: 'result_cis',
          rationale: 'CIS is flat, high-grade, and management-changing.',
        },
        {
          label: 'Intermediate atypia without full-thickness CIS pattern',
          nextNodeId: 'result_dysplasia',
          rationale: 'Dysplasia is a real category but should not be used as a lazy compromise.',
        },
      ],
    },
    invasion_assessment: {
      id: 'invasion_assessment',
      type: 'decision',
      title: 'Depth of invasion',
      description:
        'Anchor every invasive impression to anatomy. Distinguish lamina propria invasion from detrusor muscle invasion and say when muscularis propria is absent.',
      options: [
        {
          label: 'Confined to lamina propria',
          nextNodeId: 'result_lamina_propria',
          rationale: 'pT1 disease is high risk but still distinct from muscle-invasive disease.',
        },
        {
          label: 'Invades muscularis propria',
          nextNodeId: 'result_muscle_invasive',
          rationale: 'pT2 disease defines muscle-invasive bladder cancer.',
        },
        {
          label: 'No muscularis propria present / cannot stage depth confidently',
          nextNodeId: 'stop_restage',
          rationale: 'Absence of detrusor muscle is a reporting event, not a footnote.',
        },
      ],
    },
    result_low_grade: {
      id: 'result_low_grade',
      type: 'result',
      title: 'Papillary low-grade spectrum favored',
      diagnosis: 'Papillary urothelial neoplasm with low-grade architecture',
      description:
        'Use the low-grade spectrum when papillae remain orderly and cytologic atypia stays limited. Call out whether the lesion is PUNLMP or low-grade papillary urothelial carcinoma based on the overall pattern.',
      confirmatoryStudies: ['Morphology-led diagnosis; IHC not routinely required'],
      pearls: [
        'Orderly papillae and preserved polarity pull the case away from high-grade disease.',
        'Low-grade papillary lesions recur often, but progression risk is lower than high-grade tumors.',
      ],
      pitfalls: [
        'Do not overcall focal atypia into high-grade carcinoma without architectural disorder.',
        'Always inspect the base for invasion before ending the case.',
      ],
      relatedTutorialQuery: 'urothelial carcinoma',
      relatedImageTerms: ['bladder', 'PUNLMP', 'low grade papillary urothelial carcinoma'],
    },
    result_high_grade: {
      id: 'result_high_grade',
      type: 'result',
      title: 'High-grade papillary urothelial carcinoma favored',
      diagnosis: 'High-grade papillary urothelial carcinoma',
      description:
        'High-grade papillary disease is defined by architectural disorder, pleomorphism, and mitotic activity at multiple epithelial levels. It still needs an invasion readout when the base is concerning.',
      confirmatoryStudies: ['Morphology-led diagnosis; staging drives the next clinical step'],
      pearls: [
        'High-grade papillary carcinoma is not just uglier low-grade disease; it carries materially higher progression risk.',
      ],
      pitfalls: [
        'Do not end the case without stating whether invasion is present.',
        'Variant histology, especially micropapillary or plasmacytoid change, should be called out explicitly.',
      ],
      relatedTutorialQuery: 'urothelial carcinoma',
      relatedImageTerms: ['bladder', 'high grade urothelial carcinoma'],
    },
    result_reactive: {
      id: 'result_reactive',
      type: 'result',
      title: 'Reactive atypia favored',
      diagnosis: 'Reactive urothelial atypia',
      description:
        'The lesion fits reactive change when nuclei are relatively uniform, maturation is retained, and the clinical setting supports inflammation or instrumentation.',
      confirmatoryStudies: ['CK20 umbrella-cell pattern', 'Basal CD44 retention', 'Non-aberrant p53 if stain support is needed'],
      pearls: [
        'Context prevents overcalling: instrumentation, cystitis, and treatment effect matter.',
      ],
      pitfalls: [
        'Prominent nucleoli alone do not create CIS.',
        'Do not let one aberrant stain override a convincingly reactive H&E.',
      ],
      relatedTutorialQuery: 'non-neoplastic cystitis',
      relatedImageTerms: ['bladder', 'malakoplakia', 'BCG cystitis'],
    },
    result_cis: {
      id: 'result_cis',
      type: 'result',
      title: 'Carcinoma in situ favored',
      diagnosis: 'Urothelial carcinoma in situ',
      description:
        'CIS is a flat, high-grade lesion. The key is full-thickness disorder with marked atypia, loss of maturation, and often denudation or discohesion.',
      confirmatoryStudies: ['CK20 full-thickness staining', 'Aberrant p53 pattern', 'Loss of basal CD44 in supportive cases'],
      pearls: [
        'CIS is easy to miss if you only look for papillae.',
        'This diagnosis changes surveillance and treatment pathways even without invasion.',
      ],
      pitfalls: [
        'Do not downgrade true full-thickness atypia into vague dysplasia because the lesion is flat.',
      ],
      relatedTutorialQuery: 'reactive atypia versus CIS',
      relatedImageTerms: ['bladder', 'urothelial carcinoma in situ'],
    },
    result_dysplasia: {
      id: 'result_dysplasia',
      type: 'result',
      title: 'Urothelial dysplasia favored',
      diagnosis: 'Urothelial dysplasia',
      description:
        'Use dysplasia only when the lesion is genuinely atypical but does not reach full-thickness high-grade CIS. This is a diagnosis of precision, not indecision.',
      confirmatoryStudies: ['Selective CK20/p53/CD44 support in well-formed differentials'],
      pearls: [
        'Dysplasia lives between reactive change and CIS, but the H&E thresholds must stay disciplined.',
      ],
      pitfalls: [
        'Overusing dysplasia blurs clinically meaningful categories.',
      ],
      relatedTutorialQuery: 'reactive atypia versus CIS',
      relatedImageTerms: ['bladder', 'flat urothelial lesion'],
    },
    result_lamina_propria: {
      id: 'result_lamina_propria',
      type: 'result',
      title: 'Lamina propria invasion identified',
      diagnosis: 'pT1 urothelial carcinoma',
      description:
        'The lesion invades lamina propria but not muscularis propria in the sampled tissue. This still represents biologically serious disease and needs explicit reporting.',
      confirmatoryStudies: ['Anatomic correlation with muscularis propria presence'],
      pearls: [
        'pT1 is not “superficial” in the casual sense; it is high-risk non-muscle-invasive disease.',
      ],
      pitfalls: [
        'Do not misread muscularis mucosae as detrusor muscle.',
      ],
      relatedTutorialQuery: 'urothelial carcinoma',
      relatedImageTerms: ['bladder', 'lamina propria invasion'],
    },
    result_muscle_invasive: {
      id: 'result_muscle_invasive',
      type: 'result',
      title: 'Muscularis propria invasion identified',
      diagnosis: 'pT2 muscle-invasive urothelial carcinoma',
      description:
        'Invasion into detrusor muscle defines muscle-invasive bladder cancer and changes management far more than any single buzzword in the diagnosis line.',
      confirmatoryStudies: ['Confirm detrusor muscle is present and invaded'],
      pearls: [
        'This is the management hinge in TURBT pathology.',
      ],
      pitfalls: [
        'Tangential cuts and cautery artifact can create false impressions; anatomy still rules.',
      ],
      relatedTutorialQuery: 'urothelial carcinoma',
      relatedImageTerms: ['bladder', 'muscularis propria invasion'],
    },
    stop_restage: {
      id: 'stop_restage',
      type: 'stop',
      title: 'Stop and communicate staging limitation',
      description:
        'Muscularis propria is absent or not evaluable in this specimen. The correct action is to state the limitation explicitly and avoid false certainty about depth.',
      stopConditions: [
        'No detrusor muscle present in high-grade or invasive-appearing TURBT',
        'Cautery artifact or tangential sampling prevents confident depth assessment',
      ],
      relatedTutorialQuery: 'urothelial carcinoma',
      relatedImageTerms: ['bladder', 'TURBT', 'muscularis propria'],
    },
  },
};

export const guPilotAlgorithms: LectureAlgorithmRecord[] = [
  bladderAlgorithm,
  pickDerivedAlgorithm('algo_renal'),
  pickDerivedAlgorithm('algo_renal_mechanism'),
  pickDerivedAlgorithm('algo_testis'),
];

export const getGuPilotAlgorithm = (id: string): LectureAlgorithmRecord | undefined =>
  guPilotAlgorithms.find((algorithm) => algorithm.id === id);
