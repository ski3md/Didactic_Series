import {
  BenchmarkTraceabilityRecord,
  BenchmarkRelatedContent,
  ImportedContentRecord,
  SyllabusAnchor,
} from '../types';

type LectureTraceabilitySeed = {
  learningObjectives: string[];
  benchmarkTraceability: BenchmarkTraceabilityRecord;
};

type AtlasTraceabilitySeed = {
  benchmarkTraceability: BenchmarkTraceabilityRecord;
  diagnosticSummary: string;
};

function tutorialLink(id: string, title: string): BenchmarkRelatedContent {
  return {
    id,
    title,
    contentType: 'tutorial',
  };
}

function anchor(
  topic: string,
  summary: string,
  difficulty: 'C' | 'AR' | 'F',
  categoryId?: string,
  anchorType: 'normalized' | 'manual' | 'gap' = 'normalized'
): SyllabusAnchor {
  return {
    categoryId,
    topic,
    summary,
    difficulty,
    anchorType,
  };
}

export const CORE_PRINCIPLES_LECTURE_TRACEABILITY: Record<string, LectureTraceabilitySeed> = {
  'ioc-overview-breast-surgery': {
    learningObjectives: [
      'Differentiate invasive breast carcinoma from common benign mimickers encountered in core biopsy and lumpectomy material.',
      'Explain how margin interpretation and sentinel node evaluation change the downstream sign-out question.',
      'Use the companion breast tutorials to reinforce pattern-based recognition of sclerosing and cribriform lesions.',
    ],
    benchmarkTraceability: {
      discipline: 'AP',
      conformanceLevel: 'L3',
      learnerLevel: 'C/AR',
      promotionSurface: 'Didactic Lectures',
      uxEntryPoint: 'Lectures > Core Principles',
      reviewStatus: 'seeded',
      benchmarkTags: ['core-principles', 'ap', 'didactic', 'promoted'],
      promotionRationale:
        'High-scoring core-principles overview from the Downloads promotion queue, suitable for topic-first didactic promotion with light metadata work.',
      syllabusAnchors: [
        anchor('Normal Anatomy and Histology', 'Breast > Normal Anatomy and Histology', 'C', 'ap_breast'),
        anchor(
          'Physiologic Changes, Metabolic Conditions & Trauma/Infarct',
          'Breast > Normal Anatomy and Histology > Physiologic Changes, Metabolic Conditions & Trauma/Infarct',
          'C',
          'ap_breast'
        ),
      ],
      relatedContent: [
        tutorialLink('ioc-entity-sclerosing', 'Complex Sclerosing Lesion (Breast)'),
        tutorialLink('ioc-entity-cribriform', 'Cribriform Carcinoma (Breast)'),
      ],
    },
  },
  'ioc-overview-endocrine-surgery': {
    learningObjectives: [
      'Separate papillary thyroid carcinoma from follicular-patterned and solid-spindled thyroid lesions in an intraoperative or biopsy context.',
      'State why capsular and vascular invasion on permanent sections is required before diagnosing follicular carcinoma.',
      'Connect thyroid overview teaching points to focused tutorials on papillary and solid-spindled thyroid lesions.',
    ],
    benchmarkTraceability: {
      discipline: 'AP',
      conformanceLevel: 'L3',
      learnerLevel: 'C/AR',
      promotionSurface: 'Didactic Lectures',
      uxEntryPoint: 'Lectures > Core Principles',
      reviewStatus: 'seeded',
      benchmarkTags: ['core-principles', 'ap', 'endocrine', 'promoted'],
      promotionRationale:
        'Topic-first endocrine lecture promoted from the core-principles queue because it supports clinically relevant lesion triage with minimal cleanup.',
      syllabusAnchors: [
        anchor('The Thyroid', 'The Endocrine System > The Thyroid', 'C', 'ap_endo'),
        anchor(
          'Physiologic Changes, Metabolic Conditions & Trauma/Infarct',
          'The Endocrine System > The Thyroid > Physiologic Changes, Metabolic Conditions & Trauma/Infarct',
          'C',
          'ap_endo'
        ),
      ],
      relatedContent: [
        tutorialLink('ioc-entity-papillary', 'Papillary Thyroid Carcinoma'),
        tutorialLink('ioc-entity-solidspindle', 'Solid/Spindled Thyroid Lesion'),
      ],
    },
  },
  'ioc-overview-gynecologic-oncology': {
    learningObjectives: [
      'Classify common ovarian and endometrial neoplasms into major histologic buckets that affect staging decisions.',
      'Recognize situations where borderline and invasive serous lesions should be deferred rather than overcalled on frozen section.',
      'Use the related ovarian and endometrioid tutorials as retrieval practice after the overview lecture.',
    ],
    benchmarkTraceability: {
      discipline: 'AP',
      conformanceLevel: 'L3',
      learnerLevel: 'C/AR',
      promotionSurface: 'Didactic Lectures',
      uxEntryPoint: 'Lectures > Core Principles',
      reviewStatus: 'seeded',
      benchmarkTags: ['core-principles', 'ap', 'gynecologic', 'promoted'],
      promotionRationale:
        'Promoted as part of the highest-priority core-principles lecture set to establish a coherent topic-first didactic lane.',
      syllabusAnchors: [
        anchor('The Uterine Cervix', 'Male Reproductive System > The Uterine Cervix', 'C', 'ap_male_repro'),
        anchor(
          'Uterus and Vagina, Disorders & Neoplasms',
          'Male Reproductive System > Normal Anatomy, Histology, and Development > Small Cell Carcinoma > Uterus and Vagina, Disorders & Neoplasms',
          'AR',
          'ap_male_repro'
        ),
      ],
      relatedContent: [
        tutorialLink('ioc-entity-serous', 'Serous Tumor (Ovary)'),
        tutorialLink('ioc-entity-mucinous', 'Mucinous Tumor (Ovary)'),
        tutorialLink('ioc-entity-endometrioid', 'Endometrioid Carcinoma (Uterus/Ovary)'),
      ],
      normalizedSyllabusGap:
        'The normalized syllabus snapshot stores gynecologic AP topics under `ap_male_repro`, so the mapping is repo-local but semantically awkward.',
    },
  },
  'ioc-overview-head-neck-surgery': {
    learningObjectives: [
      'Distinguish malignant head and neck mucosal lesions from reactive and inflammatory mimickers during margin or biopsy review.',
      'Recognize when papillary thyroid carcinoma metastasis or lymphoma changes the differential for a neck specimen.',
      'Move from the overview lecture into focused head and neck tutorials for squamous, papillary thyroid, and lymphoid patterns.',
    ],
    benchmarkTraceability: {
      discipline: 'AP',
      conformanceLevel: 'L3',
      learnerLevel: 'C/AR',
      promotionSurface: 'Didactic Lectures',
      uxEntryPoint: 'Lectures > Core Principles',
      reviewStatus: 'seeded',
      benchmarkTags: ['core-principles', 'ap', 'head-neck', 'promoted'],
      promotionRationale:
        'High-value pathology overview that converts a staging import into a learner-facing head and neck didactic surface.',
      syllabusAnchors: [
        anchor('Jaws, Oral Cavity, and Oropharynx', 'Head and Neck > Jaws, Oral Cavity, and Oropharynx', 'C', 'ap_hn'),
        anchor('Salivary Glands', 'Head and Neck > Salivary Glands', 'AR', 'ap_hn'),
      ],
      relatedContent: [
        tutorialLink('ioc-entity-squamoushn', 'Squamous Cell Carcinoma (Head & Neck)'),
        tutorialLink('ioc-entity-papillarythyroid', 'Papillary Thyroid Carcinoma Metastasis (Head & Neck)'),
        tutorialLink('ioc-entity-lymphoma', 'Lymphoma Modal (Head & Neck)'),
      ],
    },
  },
  'ioc-overview-hepatobiliary-surgery': {
    learningObjectives: [
      'Differentiate primary hepatocellular patterns, biliary malignancy, and metastatic liver tumors in surgical pathology specimens.',
      'Recognize when immunostains and clinicoradiologic correlation are required before separating hepatocellular carcinoma from cholangiocarcinoma.',
      'Use the related liver tutorials to reinforce entity-level distinction after the overview lecture.',
    ],
    benchmarkTraceability: {
      discipline: 'AP',
      conformanceLevel: 'L3',
      learnerLevel: 'C/AR',
      promotionSurface: 'Didactic Lectures',
      uxEntryPoint: 'Lectures > Core Principles',
      reviewStatus: 'seeded',
      benchmarkTags: ['core-principles', 'ap', 'hepatobiliary', 'promoted'],
      promotionRationale:
        'Promoted because the lecture is clinically coherent and maps cleanly to a topic-first AP overview despite originating in Downloads staging.',
      syllabusAnchors: [
        anchor('The Liver and Biliary Tract', 'The Digestive System > The Liver and Biliary Tract', 'C', 'ap_gi'),
        anchor('Physiologic Changes, Metabolic Conditions, & Trauma/Infarct', 'The Digestive System > The Liver and Biliary Tract > Physiologic Changes, Metabolic Conditions, & Trauma/Infarct', 'AR', 'ap_gi'),
      ],
      relatedContent: [
        tutorialLink('ioc-entity-hepatocellular', 'Hepatocellular Carcinoma'),
        tutorialLink('ioc-entity-cholangiocarcinoma', 'Cholangiocarcinoma'),
        tutorialLink('ioc-entity-metastaticliver', 'Metastatic Tumor (Liver)'),
      ],
    },
  },
  'ioc-overview-neuropathology': {
    learningObjectives: [
      'Triage common CNS lesions into glioma, meningioma, or metastatic disease during intraoperative consultation and small-biopsy review.',
      'Explain why cytologic crush preparations can be more reliable than frozen section morphology for some glial lesions.',
      'Use the linked neuro tutorials to deepen entity-level pattern recognition after the overview lecture.',
    ],
    benchmarkTraceability: {
      discipline: 'AP',
      conformanceLevel: 'L3',
      learnerLevel: 'C/AR',
      promotionSurface: 'Didactic Lectures',
      uxEntryPoint: 'Lectures > Core Principles',
      reviewStatus: 'seeded',
      benchmarkTags: ['core-principles', 'ap', 'neuropathology', 'promoted'],
      promotionRationale:
        'Promoted as a first-class didactic lecture because it provides a coherent pathology task and has clear related tutorials.',
      syllabusAnchors: [
        anchor(
          'General: Neuroanatomy, Histology, Pathologic Responses, and Diagnostic Considerations',
          'Neuropathology Topics for Anatomic Pathology Residents > General: Neuroanatomy, Histology, Pathologic Responses, and Diagnostic Considerations',
          'C',
          'ap_neuro'
        ),
      ],
      relatedContent: [
        tutorialLink('ioc-entity-glioma', 'Glioma'),
        tutorialLink('ioc-entity-metastasiscns', 'Metastatic Tumor (CNS)'),
        tutorialLink('ioc-entity-meningioma', 'Meningioma'),
      ],
    },
  },
  'ioc-overview-pancreatic-surgery': {
    learningObjectives: [
      'Separate invasive pancreatic adenocarcinoma from benign ductal and inflammatory mimics in resection and frozen-section contexts.',
      'Describe how desmoplastic stroma and chronic pancreatitis complicate intraoperative interpretation.',
      'Use the linked pancreas tutorials to rehearse the glandular, ductal, and desmoplastic differential after the overview lecture.',
    ],
    benchmarkTraceability: {
      discipline: 'AP',
      conformanceLevel: 'L3',
      learnerLevel: 'C/AR',
      promotionSurface: 'Didactic Lectures',
      uxEntryPoint: 'Lectures > Core Principles',
      reviewStatus: 'seeded',
      benchmarkTags: ['core-principles', 'ap', 'pancreas', 'promoted'],
      promotionRationale:
        'This lecture is a strong promotion candidate because it teaches a concrete pathology workflow and has direct tutorial follow-through.',
      syllabusAnchors: [
        anchor('The Pancreas', 'The Digestive System > The Pancreas', 'C', 'ap_gi'),
        anchor('Acute and chronic pancreatitis', 'The Digestive System > The Pancreas > Acute and chronic pancreatitis', 'AR', 'ap_gi'),
      ],
      relatedContent: [
        tutorialLink('ioc-entity-glandular', 'Pancreatic Adenocarcinoma (Glandular)'),
        tutorialLink('ioc-entity-ductal', 'Ductal Lesion (Pancreas)'),
        tutorialLink('ioc-entity-desmoplastic', 'Desmoplastic Stroma Modal (Pancreas)'),
      ],
    },
  },
  'ioc-overview-thoracic-surgery': {
    learningObjectives: [
      'Distinguish malignant pulmonary lesions from benign and reactive mimics during rapid intraoperative or limited-biopsy evaluation.',
      'Identify when deferral is safer than overcalling subtle adenocarcinoma patterns on frozen section.',
      'Reinforce the core thoracic overview with lung tutorials that compare adenocarcinoma, squamous carcinoma, and small cell patterns.',
    ],
    benchmarkTraceability: {
      discipline: 'AP',
      conformanceLevel: 'L3',
      learnerLevel: 'C/AR',
      promotionSurface: 'Didactic Lectures',
      uxEntryPoint: 'Lectures > Core Principles',
      reviewStatus: 'seeded',
      benchmarkTags: ['core-principles', 'ap', 'thoracic', 'promoted'],
      promotionRationale:
        'Promoted into the main didactic library because it aligns tightly with diagnostic workflow and the existing thoracic/granulomatous focus of the app.',
      syllabusAnchors: [
        anchor('The Respiratory Tract', 'The Respiratory Tract, Pleura, and Mediastinum > The Respiratory Tract', 'C', 'ap_resp'),
        anchor(
          'Physiologic Changes, Metabolic Conditions & Trauma/Infarct',
          'The Respiratory Tract, Pleura, and Mediastinum > The Respiratory Tract > Physiologic Changes, Metabolic Conditions & Trauma/Infarct',
          'AR',
          'ap_resp'
        ),
      ],
      relatedContent: [
        tutorialLink('ioc-entity-adenocarcinoma', 'Adenocarcinoma (Lung)'),
        tutorialLink('ioc-entity-squamous', 'Squamous Cell Carcinoma (Lung)'),
        tutorialLink('topic-ap-lung-1', 'Lung Neoplasms: Adeno, Squamous, and Small Cell Carcinomas'),
      ],
    },
  },
  'ioc-overview-urologic-oncology': {
    learningObjectives: [
      'Differentiate major renal neoplasm patterns from benign oncocytic mimics using subtype-defining morphology.',
      'Explain how subtype recognition and margin assessment influence the surgical pathology question in renal resection specimens.',
      'Use the linked renal tutorials to practice the clear cell, papillary, and chromophobe differential.',
    ],
    benchmarkTraceability: {
      discipline: 'AP',
      conformanceLevel: 'L3',
      learnerLevel: 'C/AR',
      promotionSurface: 'Didactic Lectures',
      uxEntryPoint: 'Lectures > Core Principles',
      reviewStatus: 'seeded',
      benchmarkTags: ['core-principles', 'ap', 'genitourinary', 'promoted'],
      promotionRationale:
        'Promoted from Downloads staging because the lecture is already topic-structured and supports a coherent AP learner journey.',
      syllabusAnchors: [
        anchor('Kidney', 'The Genitourinary System > Kidney', 'C', 'ap_gu'),
        anchor('Medical Kidney Disease', 'The Genitourinary System > Kidney > Medical Kidney Disease', 'AR', 'ap_gu'),
      ],
      relatedContent: [
        tutorialLink('ioc-entity-clearcell', 'Clear Cell Renal Cell Carcinoma'),
        tutorialLink('ioc-entity-papillarykidney', 'Papillary Renal Cell Carcinoma'),
        tutorialLink('ioc-entity-chromophobe', 'Chromophobe Renal Cell Carcinoma'),
      ],
    },
  },
};

export const PROMOTED_GRANULOMATOUS_ATLAS_TRACEABILITY: Record<string, AtlasTraceabilitySeed> = {
  blastomycosis: {
    diagnosticSummary:
      'Diagnostic focus: recognize broad-based budding yeast in necrotizing or suppurative granulomatous inflammation and separate it from Histoplasma, Coccidioides, and Cryptococcus.',
    benchmarkTraceability: {
      discipline: 'AP',
      conformanceLevel: 'L2',
      learnerLevel: 'AR',
      promotionSurface: 'Histology Link-Out Atlas',
      uxEntryPoint: 'Job Aid & Atlas / Image Galleries',
      reviewStatus: 'seeded',
      benchmarkTags: ['promoted-atlas', 'granulomatous', 'fungal', 'differential'],
      promotionRationale:
        'Blastomycosis was called out as a top image-promotion target in the Downloads planning outputs and fits the native granulomatous workflow of the app.',
      diagnosticFocus:
        'Support organism recognition and fungal differential diagnosis in pulmonary granulomatous pathology.',
      syllabusAnchors: [
        anchor(
          'Blastomycosis',
          'Dermatopathology Topics for Anatomic Pathology Residents > Inflammatory Reaction Patterns > Blastomycosis',
          'AR',
          'ap_dermpath'
        ),
        anchor(
          'Pulmonary granulomatous fungal differential',
          'Respiratory fungal differential is central to this atlas family, but the current normalized syllabus snapshot does not expose a clean pulmonary blastomycosis topic.',
          'AR',
          'ap_resp',
          'gap'
        ),
      ],
      normalizedSyllabusGap:
        'The normalized syllabus snapshot lacks a clean pulmonary blastomycosis anchor, so the atlas family remains intentionally documented at L2 rather than L3.',
    },
  },
};

export function enrichLectureWithTraceability<T extends ImportedContentRecord>(lecture: T): T {
  const traceabilitySeed = CORE_PRINCIPLES_LECTURE_TRACEABILITY[lecture.id];
  if (!traceabilitySeed) {
    return lecture;
  }

  const tags = Array.from(new Set([...(lecture.tags ?? []), ...traceabilitySeed.benchmarkTraceability.benchmarkTags]));

  return {
    ...lecture,
    learningObjectives:
      lecture.learningObjectives.length > 0 ? lecture.learningObjectives : traceabilitySeed.learningObjectives,
    tags,
    benchmarkTraceability: traceabilitySeed.benchmarkTraceability,
  };
}

export function getGranulomatousAtlasTraceability(entity?: string): AtlasTraceabilitySeed | undefined {
  if (!entity) {
    return undefined;
  }

  return PROMOTED_GRANULOMATOUS_ATLAS_TRACEABILITY[entity];
}
