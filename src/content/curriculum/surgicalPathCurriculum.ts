import { getCuratedAtlasImages } from '../../../utils/curatedHistologyAtlas';
import { getPromotedGranulomatousAtlasImages } from '../../../utils/promotedGranulomatousAtlas';
import {
  CurriculumNavigationIntent,
  SurgicalPathAssetKind,
  SurgicalPathAssetRef,
  SurgicalPathModule,
  SurgicalPathPatternFamily,
  SurgicalPathSpecimenContext,
} from '../../../types';

const curatedAtlasImages = getCuratedAtlasImages();
const promotedAtlasImages = getPromotedGranulomatousAtlasImages();

function refs(items: Array<[string, string]>): SurgicalPathAssetRef[] {
  return items.map(([id, label]) => ({ id, label }));
}

function imageRefsByCuratedFamilies(families: string[]): SurgicalPathAssetRef[] {
  return curatedAtlasImages
    .filter((image) => image.family && families.includes(image.family))
    .map((image) => ({ id: image.id, label: image.title }));
}

function imageRefsByPromotedFamilies(families: string[]): SurgicalPathAssetRef[] {
  return promotedAtlasImages
    .filter((image) => image.family && families.includes(image.family))
    .map((image) => ({ id: image.id, label: image.title }));
}

function buildModule(config: {
  moduleId: string;
  title: string;
  summary: string;
  subspecialty: SurgicalPathModule['subspecialty'];
  patternFamilies: SurgicalPathPatternFamily[];
  specimenContexts: SurgicalPathSpecimenContext[];
  boardPriority: SurgicalPathModule['boardPriority'];
  promotionState: SurgicalPathModule['promotionState'];
  priorityScore: number;
  recommendedOrder: number;
  relatedModules: string[];
  lectures?: SurgicalPathAssetRef[];
  tutorials?: SurgicalPathAssetRef[];
  algorithms?: SurgicalPathAssetRef[];
  images?: SurgicalPathAssetRef[];
  syllabus?: SurgicalPathAssetRef[];
  plannedAssets?: SurgicalPathAssetKind[];
  navigationIntents?: Partial<Record<'lectures' | 'tutorials' | 'images' | 'syllabus', CurriculumNavigationIntent>>;
}): SurgicalPathModule {
  const lectures = config.lectures ?? [];
  const tutorials = config.tutorials ?? [];
  const algorithms = config.algorithms ?? [];
  const images = config.images ?? [];
  const syllabus = config.syllabus ?? [];

  return {
    moduleId: config.moduleId,
    title: config.title,
    summary: config.summary,
    subspecialty: config.subspecialty,
    patternFamilies: config.patternFamilies,
    specimenContexts: config.specimenContexts,
    boardPriority: config.boardPriority,
    promotionState: config.promotionState,
    priorityScore: config.priorityScore,
    recommendedOrder: config.recommendedOrder,
    relatedModules: config.relatedModules,
    linkedLectureIds: lectures.map((item) => item.id),
    linkedTutorialIds: tutorials.map((item) => item.id),
    linkedAlgorithmIds: algorithms.map((item) => item.id),
    linkedImageIds: images.map((item) => item.id),
    linkedSyllabusTopicIds: syllabus.map((item) => item.id),
    plannedAssets: config.plannedAssets ?? [],
    lectures,
    tutorials,
    algorithms,
    images,
    syllabus,
    navigationIntents: config.navigationIntents,
  };
}

const spindleCellImages = imageRefsByCuratedFamilies(['sft', 'pnst', 'uncertain', 'adipocytic']);
const smallRoundBlueImages = imageRefsByCuratedFamilies(['undifferentiated']);
const inflammatoryMimicImages = imageRefsByPromotedFamilies([
  'Sarcoidosis',
  'Histoplasmosis',
  'Blastomycosis',
  'Coccidioidomycosis',
  'Cryptococcosis',
]);

export const surgicalPathCurriculumModules: SurgicalPathModule[] = [
  buildModule({
    moduleId: 'foundations-surgical-pathology',
    title: 'Foundations of Surgical Pathology',
    summary: 'Boards-first orientation to specimen context, margin logic, frozen section caution, and pattern-driven sign-out.',
    subspecialty: 'Foundations',
    patternFamilies: ['glandular', 'spindle-cell', 'papillary', 'clear-cell'],
    specimenContexts: ['biopsy', 'excision', 'resection', 'margin', 'frozen-section', 'consult-triage'],
    boardPriority: 'core',
    promotionState: 'staged',
    priorityScore: 100,
    recommendedOrder: 1,
    relatedModules: ['spindle-cell-differential', 'clear-cell-differential', 'papillary-lesion-differential'],
    plannedAssets: ['lectures', 'tutorials', 'assessment'],
    navigationIntents: {
      syllabus: { query: 'surgical pathology' },
    },
  }),
  buildModule({
    moduleId: 'spindle-cell-differential',
    title: 'Spindle Cell Differential',
    summary: 'Cross-cutting pattern module for spindle cell lesions in soft tissue, nerve sheath, and biphasic mesenchymal mimics.',
    subspecialty: 'Foundations',
    patternFamilies: ['spindle-cell'],
    specimenContexts: ['biopsy', 'resection', 'consult-triage'],
    boardPriority: 'high-yield',
    promotionState: 'canonical',
    priorityScore: 96,
    recommendedOrder: 2,
    relatedModules: ['soft-tissue-bone-core', 'small-round-blue-cell-differential'],
    tutorials: refs([
      ['ap-soft-tissue-bone', 'AP: Soft Tissue & Bone'],
      ['bone-tumors-osteosarcoma-chondrosarcoma', 'Bone Tumors (Osteosarcoma, Chondrosarcoma)'],
    ]),
    algorithms: refs([
      ['st-soft-tissue-spindle-basic', 'Spindle Cell Tumor Workup (Soft Tissue)'],
    ]),
    images: spindleCellImages,
    plannedAssets: ['lectures', 'syllabus', 'assessment'],
    navigationIntents: {
      tutorials: { query: 'Soft Tissue' },
      images: { query: 'sarcoma spindle schwannoma', filter: 'all' },
    },
  }),
  buildModule({
    moduleId: 'clear-cell-differential',
    title: 'Clear Cell Differential',
    summary: 'High-yield clear cell workup centered on renal cortical tumors and their key board-level mimics.',
    subspecialty: 'Foundations',
    patternFamilies: ['clear-cell', 'oncocytic'],
    specimenContexts: ['biopsy', 'resection', 'margin', 'frozen-section'],
    boardPriority: 'core',
    promotionState: 'canonical',
    priorityScore: 98,
    recommendedOrder: 3,
    relatedModules: ['renal-and-testicular-core', 'papillary-lesion-differential'],
    lectures: refs([
      ['renal_mass_eval', 'Renal Mass Evaluation'],
      ['ioc-overview-urologic-oncology', 'Renal Pathology: Core Principles'],
    ]),
    tutorials: refs([
      ['renal-cell-carcinoma-clear-cell-papillary', 'Renal Cell Carcinoma (Clear Cell, Papillary)'],
      ['ioc-entity-clearcell', 'Clear Cell Renal Cell Carcinoma'],
      ['ioc-entity-chromophobe', 'Chromophobe Renal Cell Carcinoma'],
      ['ioc-entity-papillarykidney', 'Papillary Renal Cell Carcinoma'],
    ]),
    plannedAssets: ['images', 'syllabus', 'assessment'],
    navigationIntents: {
      lectures: { selectedId: 'renal_mass_eval', query: 'Renal Mass Evaluation', track: 'curated' },
      tutorials: { query: 'Renal Cell Carcinoma' },
      syllabus: { query: 'renal cell carcinoma' },
    },
  }),
  buildModule({
    moduleId: 'papillary-lesion-differential',
    title: 'Papillary Lesion Differential',
    summary: 'Boards-focused papillary pattern review spanning thyroid and kidney, with attention to metastasis and follicular-pattern pitfalls.',
    subspecialty: 'Foundations',
    patternFamilies: ['papillary', 'clear-cell'],
    specimenContexts: ['biopsy', 'frozen-section', 'consult-triage'],
    boardPriority: 'high-yield',
    promotionState: 'canonical',
    priorityScore: 92,
    recommendedOrder: 4,
    relatedModules: ['head-neck-endocrine-core', 'renal-and-testicular-core'],
    lectures: refs([
      ['ioc-overview-endocrine-surgery', 'Thyroid Pathology: Core Principles'],
      ['ioc-overview-urologic-oncology', 'Renal Pathology: Core Principles'],
    ]),
    tutorials: refs([
      ['thyroid-nodules-ca-thyroiditis', 'Thyroid (Nodules, Ca, Thyroiditis)'],
      ['ioc-entity-papillary', 'Papillary Thyroid Carcinoma'],
      ['ioc-entity-papillarythyroid', 'Papillary Thyroid Carcinoma Metastasis (Head & Neck)'],
      ['ioc-entity-papillarykidney', 'Papillary Renal Cell Carcinoma'],
    ]),
    plannedAssets: ['images', 'syllabus', 'assessment'],
    navigationIntents: {
      lectures: { selectedId: 'ioc-overview-endocrine-surgery', query: 'Thyroid Pathology: Core Principles', track: 'core-principles' },
      tutorials: { query: 'Papillary Thyroid' },
      syllabus: { query: 'papillary thyroid papillary renal' },
    },
  }),
  buildModule({
    moduleId: 'small-round-blue-cell-differential',
    title: 'Small Round Blue Cell Differential',
    summary: 'Cross-system high-yield pattern block linking Ewing-family lesions, pediatric tumors, and germ-cell style mimics.',
    subspecialty: 'Foundations',
    patternFamilies: ['small-round-blue-cell'],
    specimenContexts: ['biopsy', 'resection', 'consult-triage'],
    boardPriority: 'high-yield',
    promotionState: 'staged',
    priorityScore: 88,
    recommendedOrder: 5,
    relatedModules: ['soft-tissue-bone-core', 'pediatric-placental-core', 'renal-and-testicular-core'],
    tutorials: refs([
      ['bone-tumors-osteosarcoma-chondrosarcoma', 'Bone Tumors (Osteosarcoma, Chondrosarcoma)'],
      ['pediatric-tumors-wilms', 'Pediatric Tumors (Wilms)'],
      ['testis', 'Testis'],
    ]),
    images: smallRoundBlueImages,
    plannedAssets: ['lectures', 'algorithms', 'syllabus', 'assessment'],
    navigationIntents: {
      tutorials: { query: 'Wilms Testis Ewing' },
      images: { query: 'ewing sarcoma', filter: 'all' },
      syllabus: { query: 'small round blue cell' },
    },
  }),
  buildModule({
    moduleId: 'necrosis-inflammatory-mimics',
    title: 'Necrosis and Inflammatory Mimics',
    summary: 'Pattern block for inflammatory and necrotizing lesions that can mimic malignancy in thoracic and soft tissue sign-out.',
    subspecialty: 'Foundations',
    patternFamilies: ['necrotizing-inflammatory-mimic'],
    specimenContexts: ['biopsy', 'consult-triage', 'frozen-section'],
    boardPriority: 'high-yield',
    promotionState: 'staged',
    priorityScore: 84,
    recommendedOrder: 6,
    relatedModules: ['thoracic-core', 'breast-core'],
    tutorials: refs([
      ['inflammatory-reactive-fat-necrosis-mastitis', 'Inflammatory/Reactive (Fat Necrosis, Mastitis)'],
      ['interstitial-lung-disease', 'Interstitial Lung Disease'],
    ]),
    images: inflammatoryMimicImages,
    plannedAssets: ['lectures', 'algorithms', 'syllabus', 'assessment'],
    navigationIntents: {
      tutorials: { query: 'fat necrosis inflammatory lung' },
      images: { query: 'granulomatous inflammatory mimic', filter: 'all' },
    },
  }),
  buildModule({
    moduleId: 'clinical-path-foundations',
    title: 'Clinical Pathology Foundations',
    summary: 'Boards-first CP anchor module for lab correlation, case-based interpretation, and when to shift from morphology to test-selection logic.',
    subspecialty: 'Clinical Pathology',
    patternFamilies: ['hematology', 'coagulation', 'transfusion-medicine'],
    specimenContexts: ['lab-workup', 'consult-triage', 'blood-bank'],
    boardPriority: 'core',
    promotionState: 'canonical',
    priorityScore: 90,
    recommendedOrder: 7,
    relatedModules: ['hematology-red-cell-disorders', 'coagulation-hemostasis-core', 'transfusion-medicine-core'],
    tutorials: refs([
      ['blood-banking-transfusion-medicine', 'Blood Banking/Transfusion Medicine'],
      ['anemia-in-oncology-patients', 'Anemia in Oncology Patients'],
      ['bleeding-from-coagulation-defects', 'Bleeding from Coagulation Defects'],
    ]),
    plannedAssets: ['lectures', 'algorithms', 'images', 'syllabus', 'assessment'],
    navigationIntents: {
      tutorials: { query: 'Blood Banking anemia coagulation', track: 'clinical-path' },
      syllabus: { query: 'clinical pathology hematology transfusion coagulation' },
    },
  }),
  buildModule({
    moduleId: 'hematology-red-cell-disorders',
    title: 'Hematology and Red Cell Disorders',
    summary: 'Canonical CP block for hemolytic anemia, PNH, sickle cell disease, oncology-associated anemia, and plasma-cell style board review.',
    subspecialty: 'Clinical Pathology',
    patternFamilies: ['hematology', 'plasma-cell-disorder'],
    specimenContexts: ['lab-workup', 'consult-triage'],
    boardPriority: 'core',
    promotionState: 'canonical',
    priorityScore: 91,
    recommendedOrder: 8,
    relatedModules: ['clinical-path-foundations', 'coagulation-hemostasis-core'],
    tutorials: refs([
      ['paroxysmal-nocturnal-hemoglobinuria', 'Paroxysmal Nocturnal Hemoglobinuria'],
      ['anemia-in-oncology-patients', 'Anemia in Oncology Patients'],
      ['drug-induced-hemolytic-anemia', 'Drug-Induced Hemolytic Anemia'],
      ['TUT001', 'Case Study: Vaso-occlusive Crisis in Sickle Cell Anemia'],
      ['TUT003', 'Case Study: Acute Anemia and a Positive DAT'],
      ['TUT005', 'Case Study: Quantifying an M-Spike'],
    ]),
    plannedAssets: ['lectures', 'algorithms', 'images', 'syllabus', 'assessment'],
    navigationIntents: {
      tutorials: { query: 'anemia PNH sickle DAT M-Spike', track: 'clinical-path', filter: 'Hematology' },
      syllabus: { query: 'anemia hemolysis plasma cell myeloma hematology' },
    },
  }),
  buildModule({
    moduleId: 'coagulation-hemostasis-core',
    title: 'Coagulation and Hemostasis Core',
    summary: 'Canonical CP block for bleeding, thrombosis, platelet dysfunction, anticoagulation, inhibitors, and perioperative coagulation reasoning.',
    subspecialty: 'Clinical Pathology',
    patternFamilies: ['coagulation', 'hematology'],
    specimenContexts: ['lab-workup', 'consult-triage'],
    boardPriority: 'core',
    promotionState: 'canonical',
    priorityScore: 92,
    recommendedOrder: 9,
    relatedModules: ['clinical-path-foundations', 'hematology-red-cell-disorders', 'transfusion-medicine-core'],
    tutorials: refs([
      ['immune-thrombocytopenia', 'Immune Thrombocytopenia'],
      ['bleeding-from-coagulation-defects', 'Bleeding from Coagulation Defects'],
      ['cirrhosis-coagulopathy', 'Cirrhosis Coagulopathy'],
      ['acquired-coagulation-factor-inhibitors', 'Acquired Coagulation Factor Inhibitors'],
      ['acquired-platelet-function-disorders', 'Acquired Platelet Function Disorders'],
      ['antithrombotic-therapy', 'Antithrombotic Therapy'],
      ['congenital-coagulopathies-thrombophilias', 'Congenital Coagulopathies/Thrombophilias'],
      ['perioperative-blood-management', 'Perioperative Blood Management'],
    ]),
    plannedAssets: ['lectures', 'algorithms', 'images', 'syllabus', 'assessment'],
    navigationIntents: {
      tutorials: { query: 'coagulation platelet bleeding thrombophilia anticoagulation', track: 'clinical-path', filter: 'Coagulation & Hemostasis' },
      syllabus: { query: 'coagulation hemostasis thrombosis platelet inhibitor' },
    },
  }),
  buildModule({
    moduleId: 'transfusion-medicine-core',
    title: 'Transfusion and Cellular Therapy Core',
    summary: 'Canonical CP block for transfusion reactions, platelet support, CCI, HLA matching, tissue banking, and cellular therapy complications.',
    subspecialty: 'Clinical Pathology',
    patternFamilies: ['transfusion-medicine', 'hematology'],
    specimenContexts: ['blood-bank', 'transfusion-reaction', 'lab-workup'],
    boardPriority: 'core',
    promotionState: 'canonical',
    priorityScore: 92,
    recommendedOrder: 10,
    relatedModules: ['clinical-path-foundations', 'coagulation-hemostasis-core'],
    tutorials: refs([
      ['blood-banking-transfusion-medicine', 'Blood Banking/Transfusion Medicine'],
      ['platelet-product-choice-in-leukemia', 'Platelet Product Choice in Leukemia'],
      ['corrected-platelet-count-increment-cci', 'Corrected Platelet Count Increment (CCI)'],
      ['cell-and-tissue-therapy', 'Cell and Tissue Therapy'],
      ['hla-antigens-and-alleles', 'HLA Antigens and Alleles'],
      ['tissue-banking', 'Tissue Banking'],
    ]),
    plannedAssets: ['lectures', 'algorithms', 'images', 'syllabus', 'assessment'],
    navigationIntents: {
      tutorials: { query: 'transfusion HLA platelet CCI tissue banking cellular therapy', track: 'clinical-path', filter: 'Transfusion & Cellular Therapy' },
      syllabus: { query: 'transfusion medicine HLA tissue banking stem cell transplant' },
    },
  }),
  buildModule({
    moduleId: 'breast-core',
    title: 'Breast Core Module',
    summary: 'First-line breast boards block spanning benign/reactive, proliferative, in situ, invasive, fibroepithelial, and biomarker interpretation.',
    subspecialty: 'Breast',
    patternFamilies: ['glandular', 'papillary'],
    specimenContexts: ['biopsy', 'excision', 'resection', 'margin', 'lymph-node'],
    boardPriority: 'core',
    promotionState: 'canonical',
    priorityScore: 99,
    recommendedOrder: 11,
    relatedModules: ['papillary-lesion-differential', 'necrosis-inflammatory-mimics'],
    lectures: refs([
      ['ioc-overview-breast-surgery', 'Breast Pathology: Core Principles'],
    ]),
    tutorials: refs([
      ['ap-breast', 'AP: Breast'],
      ['inflammatory-reactive-fat-necrosis-mastitis', 'Inflammatory/Reactive (Fat Necrosis, Mastitis)'],
      ['benign-neoplasms-fibroadenoma-papilloma', 'Benign Neoplasms (Fibroadenoma, Papilloma)'],
      ['proliferative-lesions-udh-adh-alh', 'Proliferative Lesions (UDH, ADH, ALH)'],
      ['in-situ-carcinoma-dcis-lcis', 'In Situ Carcinoma (DCIS, LCIS)'],
      ['invasive-carcinoma-ductal-lobular-special-types', 'Invasive Carcinoma (Ductal, Lobular, Special Types)'],
      ['fibroepithelial-lesions-phyllodes', 'Fibroepithelial Lesions (Phyllodes)'],
      ['biomarkers-er-pr-her2', 'Biomarkers (ER/PR/HER2)'],
      ['ioc-entity-cribriform', 'Cribriform Carcinoma (Breast)'],
      ['ioc-entity-sclerosing', 'Complex Sclerosing Lesion (Breast)'],
      ['ioc-entity-tubular', 'Tubular Carcinoma (Breast)'],
    ]),
    plannedAssets: ['algorithms', 'images', 'syllabus', 'assessment'],
    navigationIntents: {
      lectures: { selectedId: 'ioc-overview-breast-surgery', query: 'Breast Pathology: Core Principles', track: 'core-principles' },
      tutorials: { query: 'Breast' },
      syllabus: { query: 'breast pathology' },
    },
  }),
  buildModule({
    moduleId: 'gynecologic-core',
    title: 'Gynecologic Core Module',
    summary: 'Boards-first gynecologic block spanning cervix, vulva, uterine/endometrial patterns, and ovarian serous, mucinous, and endometrioid differentials.',
    subspecialty: 'Gynecologic',
    patternFamilies: ['papillary', 'mucinous', 'borderline-ovarian', 'clear-cell'],
    specimenContexts: ['biopsy', 'excision', 'resection', 'frozen-section'],
    boardPriority: 'core',
    promotionState: 'canonical',
    priorityScore: 95,
    recommendedOrder: 12,
    relatedModules: ['papillary-lesion-differential', 'hepatobiliary-pancreatic-core'],
    lectures: refs([
      ['ioc-overview-gynecologic-oncology', 'Gynecologic Pathology: Core Principles'],
    ]),
    tutorials: refs([
      ['gynecologic-pap-smear-bethesda', 'Gynecologic (Pap Smear, Bethesda)'],
      ['vulva-vagina-vin-carcinoma-dermatoses', 'Vulva & Vagina (VIN, Carcinoma, Dermatoses)'],
      ['ioc-entity-endometrioid', 'Endometrioid Carcinoma (Uterus/Ovary)'],
      ['ioc-entity-serous', 'Serous Tumor (Ovary)'],
      ['ioc-entity-mucinous', 'Mucinous Tumor (Ovary)'],
    ]),
    plannedAssets: ['algorithms', 'images', 'syllabus', 'assessment'],
    navigationIntents: {
      lectures: { selectedId: 'ioc-overview-gynecologic-oncology', query: 'Gynecologic Pathology: Core Principles', track: 'core-principles' },
      tutorials: { query: 'Gynecologic Ovar' },
      syllabus: { query: 'gynecologic ovarian endometrial' },
    },
  }),
  buildModule({
    moduleId: 'renal-and-testicular-core',
    title: 'Renal and Testicular Core Module',
    summary: 'High-yield genitourinary block linking renal mass workup, papillary and eosinophilic differentials, seminoma versus NSGCT, and stromal tumor pitfalls.',
    subspecialty: 'Genitourinary',
    patternFamilies: ['clear-cell', 'papillary', 'oncocytic', 'small-round-blue-cell'],
    specimenContexts: ['biopsy', 'resection', 'margin', 'frozen-section'],
    boardPriority: 'core',
    promotionState: 'canonical',
    priorityScore: 99,
    recommendedOrder: 13,
    relatedModules: ['clear-cell-differential', 'papillary-lesion-differential', 'small-round-blue-cell-differential'],
    lectures: refs([
      ['renal_mass_eval', 'Renal Mass Evaluation'],
      ['testicular_mass_eval', 'Testicular Mass Evaluation'],
      ['ioc-overview-urologic-oncology', 'Renal Pathology: Core Principles'],
    ]),
    tutorials: refs([
      ['ap-genitourinary', 'AP: Genitourinary'],
      ['renal-cell-carcinoma-clear-cell-papillary', 'Renal Cell Carcinoma (Clear Cell, Papillary)'],
      ['testis', 'Testis'],
      ['ioc-entity-clearcell', 'Clear Cell Renal Cell Carcinoma'],
      ['ioc-entity-chromophobe', 'Chromophobe Renal Cell Carcinoma'],
      ['ioc-entity-papillarykidney', 'Papillary Renal Cell Carcinoma'],
    ]),
    plannedAssets: ['algorithms', 'images', 'syllabus', 'assessment'],
    navigationIntents: {
      lectures: { selectedId: 'renal_mass_eval', query: 'Renal Mass Evaluation', track: 'curated' },
      tutorials: { query: 'Renal Testis' },
      syllabus: { query: 'renal testis germ cell' },
    },
  }),
  buildModule({
    moduleId: 'lower-gu-core',
    title: 'Lower Genitourinary Core Module',
    summary: 'Planned boards block for prostate, bladder, urethra, and penile pathology, with current genitourinary assets staged behind broader renal and testicular coverage.',
    subspecialty: 'Genitourinary',
    patternFamilies: ['papillary', 'glandular'],
    specimenContexts: ['biopsy', 'resection', 'margin', 'lymph-node'],
    boardPriority: 'high-yield',
    promotionState: 'staged',
    priorityScore: 80,
    recommendedOrder: 14,
    relatedModules: ['renal-and-testicular-core'],
    tutorials: refs([
      ['ap-genitourinary', 'AP: Genitourinary'],
    ]),
    plannedAssets: ['lectures', 'algorithms', 'images', 'syllabus', 'assessment'],
    navigationIntents: {
      tutorials: { query: 'prostate bladder penile urothelial' },
      syllabus: { query: 'prostate urothelial bladder' },
    },
  }),
  buildModule({
    moduleId: 'upper-gi-core',
    title: 'Upper GI Core Module',
    summary: 'Esophagus and stomach boards block centered on Barrett dysplasia, gastric glandular lesions, polyps, and GIST-era pattern recognition.',
    subspecialty: 'Gastrointestinal',
    patternFamilies: ['glandular', 'papillary', 'spindle-cell'],
    specimenContexts: ['biopsy', 'resection', 'margin'],
    boardPriority: 'high-yield',
    promotionState: 'staged',
    priorityScore: 86,
    recommendedOrder: 15,
    relatedModules: ['colorectal-core', 'spindle-cell-differential'],
    tutorials: refs([
      ['esophagus-barretts-ca', 'Esophagus (Barretts, Ca)'],
      ['stomach-gastritis-polyps-gist-carcinoma', 'Stomach (Gastritis, Polyps, GIST, Carcinoma)'],
    ]),
    plannedAssets: ['lectures', 'algorithms', 'images', 'syllabus', 'assessment'],
    navigationIntents: {
      tutorials: { query: 'Esophagus Stomach GIST Barrett' },
      syllabus: { query: 'esophagus stomach gastrointestinal' },
    },
  }),
  buildModule({
    moduleId: 'colorectal-core',
    title: 'Colorectal Core Module',
    summary: 'Lower GI boards block for serrated versus conventional pathways, dysplasia, IBD, appendiceal mucin, and invasive colorectal carcinoma.',
    subspecialty: 'Gastrointestinal',
    patternFamilies: ['serrated-dysplasia', 'mucinous', 'glandular'],
    specimenContexts: ['biopsy', 'excision', 'resection', 'margin'],
    boardPriority: 'core',
    promotionState: 'staged',
    priorityScore: 89,
    recommendedOrder: 16,
    relatedModules: ['upper-gi-core', 'gynecologic-core'],
    tutorials: refs([
      ['colon-ibd-polyps-cancer-syndromes', 'Colon (IBD, Polyps, Cancer Syndromes)'],
    ]),
    plannedAssets: ['lectures', 'algorithms', 'images', 'syllabus', 'assessment'],
    navigationIntents: {
      tutorials: { query: 'Colon polyps cancer syndromes' },
      syllabus: { query: 'colon serrated adenoma carcinoma' },
    },
  }),
  buildModule({
    moduleId: 'hepatobiliary-pancreatic-core',
    title: 'Hepatobiliary and Pancreatic Core Module',
    summary: 'High-yield liver, bile duct, and pancreas module covering HCC, cholangiocarcinoma, metastatic liver lesions, PDAC, and pancreatic ductal/desmoplastic patterns.',
    subspecialty: 'Hepatobiliary & Pancreatic',
    patternFamilies: ['glandular', 'mucinous', 'neuroendocrine'],
    specimenContexts: ['biopsy', 'resection', 'margin', 'frozen-section'],
    boardPriority: 'core',
    promotionState: 'canonical',
    priorityScore: 94,
    recommendedOrder: 17,
    relatedModules: ['thoracic-core', 'gynecologic-core'],
    lectures: refs([
      ['ioc-overview-hepatobiliary-surgery', 'Liver/Biliary Pathology: Core Principles'],
      ['ioc-overview-pancreatic-surgery', 'Pancreas Pathology: Core Principles'],
    ]),
    tutorials: refs([
      ['liver-hepatitis-cirrhosis-tumors', 'Liver (Hepatitis, Cirrhosis, Tumors)'],
      ['pancreas-pancreatitis-pdac-neuroendocrine', 'Pancreas (Pancreatitis, PDAC, Neuroendocrine)'],
      ['ioc-entity-cholangiocarcinoma', 'Cholangiocarcinoma'],
      ['ioc-entity-hepatocellular', 'Hepatocellular Carcinoma'],
      ['ioc-entity-metastaticliver', 'Metastatic Tumor (Liver)'],
      ['ioc-entity-desmoplastic', 'Desmoplastic Stroma Modal (Pancreas)'],
      ['ioc-entity-ductal', 'Ductal Lesion (Pancreas)'],
      ['ioc-entity-glandular', 'Pancreatic Adenocarcinoma (Glandular)'],
    ]),
    plannedAssets: ['algorithms', 'images', 'syllabus', 'assessment'],
    navigationIntents: {
      lectures: { selectedId: 'ioc-overview-hepatobiliary-surgery', query: 'Liver/Biliary Pathology: Core Principles', track: 'core-principles' },
      tutorials: { query: 'Liver Pancreas Cholangiocarcinoma' },
      syllabus: { query: 'liver pancreas cholangiocarcinoma pancreatic adenocarcinoma' },
    },
  }),
  buildModule({
    moduleId: 'thoracic-core',
    title: 'Thoracic Core Module',
    summary: 'Boards-first thoracic block linking lung core principles, adenocarcinoma versus squamous versus small cell patterns, and inflammatory mimics.',
    subspecialty: 'Thoracic',
    patternFamilies: ['glandular', 'neuroendocrine', 'necrotizing-inflammatory-mimic'],
    specimenContexts: ['biopsy', 'resection', 'margin', 'frozen-section', 'lymph-node'],
    boardPriority: 'core',
    promotionState: 'canonical',
    priorityScore: 93,
    recommendedOrder: 18,
    relatedModules: ['necrosis-inflammatory-mimics', 'hepatobiliary-pancreatic-core'],
    lectures: refs([
      ['ioc-overview-thoracic-surgery', 'Lung Pathology: Core Principles'],
    ]),
    tutorials: refs([
      ['ap-respiratory-mediastinum', 'AP: Respiratory & Mediastinum'],
      ['lung-neoplasms-adeno-squamous-small-cell', 'Lung Neoplasms (Adeno, Squamous, Small Cell)'],
      ['interstitial-lung-disease', 'Interstitial Lung Disease'],
      ['ioc-entity-adenocarcinoma', 'Adenocarcinoma (Lung)'],
      ['ioc-entity-squamous', 'Squamous Cell Carcinoma (Lung)'],
      ['ioc-entity-smallcell', 'Small Cell Carcinoma (Lung)'],
    ]),
    plannedAssets: ['algorithms', 'images', 'syllabus', 'assessment'],
    navigationIntents: {
      lectures: { selectedId: 'ioc-overview-thoracic-surgery', query: 'Lung Pathology: Core Principles', track: 'core-principles' },
      tutorials: { query: 'Lung adenocarcinoma squamous small cell' },
      images: { query: 'granulomatous lung', filter: 'all' },
      syllabus: { query: 'lung adenocarcinoma small cell squamous' },
    },
  }),
  buildModule({
    moduleId: 'head-neck-endocrine-core',
    title: 'Head & Neck / Endocrine Core Module',
    summary: 'Integrated HN/endocrine block for salivary/thyroid/FNA reasoning, squamous lesions, papillary thyroid patterns, and endocrine sign-out pitfalls.',
    subspecialty: 'Head & Neck / Endocrine',
    patternFamilies: ['papillary', 'oncocytic', 'lymphoid-interface'],
    specimenContexts: ['biopsy', 'cytology', 'resection', 'frozen-section', 'lymph-node'],
    boardPriority: 'core',
    promotionState: 'canonical',
    priorityScore: 94,
    recommendedOrder: 19,
    relatedModules: ['papillary-lesion-differential', 'hematolymphoid-interface'],
    lectures: refs([
      ['ioc-overview-head-neck-surgery', 'Head & Neck Pathology: Core Principles'],
      ['ioc-overview-endocrine-surgery', 'Thyroid Pathology: Core Principles'],
    ]),
    tutorials: refs([
      ['fna-thyroid-lung-salivary', 'FNA (Thyroid, Lung, Salivary)'],
      ['ap-endocrine', 'AP: Endocrine'],
      ['thyroid-nodules-ca-thyroiditis', 'Thyroid (Nodules, Ca, Thyroiditis)'],
      ['adrenal-cortical-pheochromocytoma', 'Adrenal (Cortical, Pheochromocytoma)'],
      ['parathyroid', 'Parathyroid'],
      ['pituitary-adenomas', 'Pituitary Adenomas'],
      ['ioc-entity-squamoushn', 'Squamous Cell Carcinoma (Head & Neck)'],
      ['ioc-entity-papillary', 'Papillary Thyroid Carcinoma'],
      ['ioc-entity-papillarythyroid', 'Papillary Thyroid Carcinoma Metastasis (Head & Neck)'],
      ['ioc-entity-solidspindle', 'Solid/Spindled Thyroid Lesion'],
      ['ioc-entity-lymphoma', 'Lymphoma Modal (Head & Neck)'],
    ]),
    plannedAssets: ['algorithms', 'images', 'syllabus', 'assessment'],
    navigationIntents: {
      lectures: { selectedId: 'ioc-overview-head-neck-surgery', query: 'Head & Neck Pathology: Core Principles', track: 'core-principles' },
      tutorials: { query: 'Thyroid salivary head neck endocrine' },
      syllabus: { query: 'thyroid head neck salivary' },
    },
  }),
  buildModule({
    moduleId: 'skin-melanocytic-core',
    title: 'Skin / Melanocytic Core Module',
    summary: 'Compact skin boards block focused on melanoma, nevi, BCC, SCC, and the major keratinocytic-versus-melanocytic distinctions.',
    subspecialty: 'Skin / Melanocytic',
    patternFamilies: ['melanocytic', 'spindle-cell'],
    specimenContexts: ['biopsy', 'excision', 'resection', 'margin'],
    boardPriority: 'high-yield',
    promotionState: 'staged',
    priorityScore: 82,
    recommendedOrder: 20,
    relatedModules: ['soft-tissue-bone-core'],
    tutorials: refs([
      ['neoplasms-bcc-scc-melanoma-nevi', 'Neoplasms (BCC, SCC, Melanoma, Nevi)'],
    ]),
    plannedAssets: ['lectures', 'algorithms', 'images', 'syllabus', 'assessment'],
    navigationIntents: {
      tutorials: { query: 'Melanoma Nevi BCC SCC' },
      syllabus: { query: 'melanoma squamous basal cell' },
    },
  }),
  buildModule({
    moduleId: 'soft-tissue-bone-core',
    title: 'Soft Tissue and Bone Core Module',
    summary: 'Boards-first mesenchymal block linking spindle cell workup, giant cell-rich lytic bone differential, lipomatous lesions, nerve sheath tumors, and sarcoma patterns.',
    subspecialty: 'Soft Tissue / Bone',
    patternFamilies: ['spindle-cell', 'small-round-blue-cell', 'bone-cartilage'],
    specimenContexts: ['biopsy', 'resection', 'consult-triage'],
    boardPriority: 'core',
    promotionState: 'canonical',
    priorityScore: 91,
    recommendedOrder: 21,
    relatedModules: ['spindle-cell-differential', 'small-round-blue-cell-differential'],
    tutorials: refs([
      ['ap-soft-tissue-bone', 'AP: Soft Tissue & Bone'],
      ['bone-tumors-osteosarcoma-chondrosarcoma', 'Bone Tumors (Osteosarcoma, Chondrosarcoma)'],
    ]),
    algorithms: refs([
      ['st-soft-tissue-spindle-basic', 'Spindle Cell Tumor Workup (Soft Tissue)'],
      ['bone-giant-cell-basic', 'Lytic Bone Lesion: Giant Cell–Rich Differential'],
    ]),
    images: spindleCellImages.concat(smallRoundBlueImages),
    plannedAssets: ['lectures', 'syllabus', 'assessment'],
    navigationIntents: {
      tutorials: { query: 'Soft Tissue Bone' },
      images: { query: 'sarcoma bone soft tissue', filter: 'all' },
      syllabus: { query: 'soft tissue bone sarcoma osteosarcoma' },
    },
  }),
  buildModule({
    moduleId: 'hematolymphoid-interface',
    title: 'Hematolymphoid Surgical Path Interface',
    summary: 'Surg-path-facing lymphoid interface module for node, extranodal mass, and metastatic-versus-lymphoid reasoning in tissue diagnosis.',
    subspecialty: 'Hematolymphoid Interface',
    patternFamilies: ['lymphoid-interface', 'small-round-blue-cell'],
    specimenContexts: ['biopsy', 'lymph-node', 'consult-triage'],
    boardPriority: 'high-yield',
    promotionState: 'staged',
    priorityScore: 78,
    recommendedOrder: 22,
    relatedModules: ['head-neck-endocrine-core', 'thoracic-core'],
    tutorials: refs([
      ['ioc-entity-lymphoma', 'Lymphoma Modal (Head & Neck)'],
    ]),
    plannedAssets: ['lectures', 'algorithms', 'images', 'syllabus', 'assessment'],
    navigationIntents: {
      tutorials: { query: 'Lymphoma node metastatic' },
      syllabus: { query: 'lymph node lymphoma surgical pathology' },
    },
  }),
  buildModule({
    moduleId: 'neuropathology-core',
    title: 'Neuropathology Core Module',
    summary: 'Compact high-yield CNS block for glioma, meningioma, and metastasis-versus-primary reasoning with intraoperative caution.',
    subspecialty: 'Neuropathology',
    patternFamilies: ['small-round-blue-cell', 'glandular'],
    specimenContexts: ['biopsy', 'frozen-section', 'consult-triage', 'resection'],
    boardPriority: 'high-yield',
    promotionState: 'canonical',
    priorityScore: 87,
    recommendedOrder: 23,
    relatedModules: ['small-round-blue-cell-differential'],
    lectures: refs([
      ['ioc-overview-neuropathology', 'Neuropathology: Core Principles'],
    ]),
    tutorials: refs([
      ['ap-neuropathology', 'AP: Neuropathology'],
      ['ioc-entity-glioma', 'Glioma'],
      ['ioc-entity-meningioma', 'Meningioma'],
      ['ioc-entity-metastasiscns', 'Metastatic Tumor (CNS)'],
    ]),
    plannedAssets: ['algorithms', 'images', 'syllabus', 'assessment'],
    navigationIntents: {
      lectures: { selectedId: 'ioc-overview-neuropathology', query: 'Neuropathology: Core Principles', track: 'core-principles' },
      tutorials: { query: 'Glioma Meningioma Neuropathology' },
      syllabus: { query: 'glioma meningioma metastasis cns' },
    },
  }),
  buildModule({
    moduleId: 'pediatric-placental-core',
    title: 'Pediatric / Placental High-Yield Module',
    summary: 'High-yield boards block for Wilms tumor, pediatric small round blue cell reasoning, placenta, and gestational trophoblastic disease.',
    subspecialty: 'Pediatric / Placental',
    patternFamilies: ['small-round-blue-cell', 'mucinous'],
    specimenContexts: ['biopsy', 'resection', 'consult-triage'],
    boardPriority: 'high-yield',
    promotionState: 'staged',
    priorityScore: 76,
    recommendedOrder: 24,
    relatedModules: ['small-round-blue-cell-differential', 'gynecologic-core'],
    tutorials: refs([
      ['pediatric-tumors-wilms', 'Pediatric Tumors (Wilms)'],
      ['placenta-trophoblastic-disease-inflammation', 'Placenta (Trophoblastic Disease, Inflammation)'],
    ]),
    plannedAssets: ['lectures', 'algorithms', 'images', 'syllabus', 'assessment'],
    navigationIntents: {
      tutorials: { query: 'Wilms Placenta Trophoblastic' },
      syllabus: { query: 'wilms placenta trophoblastic disease' },
    },
  }),
];

export const surgicalPathSubspecialtyOrder = [
  'Foundations',
  'Clinical Pathology',
  'Breast',
  'Gynecologic',
  'Genitourinary',
  'Gastrointestinal',
  'Hepatobiliary & Pancreatic',
  'Thoracic',
  'Head & Neck / Endocrine',
  'Skin / Melanocytic',
  'Soft Tissue / Bone',
  'Hematolymphoid Interface',
  'Neuropathology',
  'Pediatric / Placental',
] as const;

export const surgicalPathBoardPriorities: SurgicalPathModule['boardPriority'][] = ['core', 'high-yield', 'advanced'];

export const surgicalPathPromotionStates: SurgicalPathModule['promotionState'][] = ['canonical', 'staged', 'archived'];
