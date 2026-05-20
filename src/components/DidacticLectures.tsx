import React, { useEffect, useMemo, useState } from 'react';
import Card from './ui/Card.tsx';
import MarkdownContent from './ui/MarkdownContent.tsx';
import StructuredTeachingContent from './ui/StructuredTeachingContent.tsx';
import { ArrowDownTrayIcon, DocumentTextIcon, SparklesIcon } from './icons.tsx';
import {
  getPromotedLectureById,
  promotedLectures,
} from '../utils/lectureLibraryCatalog.ts';
import { consumeLectureLibraryIntent } from '../utils/lectureLibraryNavigation.ts';
import { getInteractivePromotedLecture } from '../utils/interactiveLectureCatalog.ts';
import { LearningPreferences } from '../hooks/useLearningPreferences.ts';
import {
  type ActiveStudyDestination,
  DxEntityCard,
  LecturePlayerMode,
  LectureVisualAid,
  Section,
} from '../types.ts';
import LectureAlgorithmPlayer from './lectures/LectureAlgorithmPlayer.tsx';
import LectureTissueLayers from './lectures/LectureTissueLayers.tsx';
import LectureKnowledgePack from './lectures/LectureKnowledgePack.tsx';
import LectureQuickCheckPanel from './lectures/LectureQuickCheckPanel.tsx';
import { setTutorialLibraryIntent } from '../utils/tutorialLibraryNavigation.ts';
import { setReferenceLibraryIntent } from '../utils/referenceLibraryNavigation.ts';
import { resolveAcquiredImageUrl } from '../utils/acquiredImageCatalog.ts';
import { getAnswerChoiceReasoning } from '../utils/answerChoiceReasoning.ts';
import { parseTeachingSections } from '../utils/teachingSessionContent.ts';
import { buildLectureStudyTree } from '../utils/studyCatalogScopes.ts';
import { readSessionState, writeSessionState } from '../utils/viewStateStorage.ts';
import {
  getDefaultStudyDestination,
  pushStudyDestination,
  replaceStudyDestination,
  restoreStudyDestination,
  setStudyDestinationActiveTab,
  STUDY_DESTINATION_EVENT,
} from '../utils/studyDestinationState.ts';
import { resolveStudyDestinationForRender } from '../utils/studyDestinationResolver.ts';
import guWhoEntityManifest from '../content/gu/who_gu_entity_manifest.json';

interface DidacticLecturesProps {
  preferences: LearningPreferences;
  onSectionChange: (section: Section) => void;
}

interface LectureStudyProgress {
  lastMode?: LecturePlayerMode;
  completedModes: LecturePlayerMode[];
  completedAlgorithms: string[];
  completedLayerSets: string[];
  completedChecks: string[];
}

interface LectureSelectionSeed {
  lectureId: string;
  mode?: LecturePlayerMode;
  initialNodeId?: string;
  initialLayerSetId?: string;
}

interface DescriptorVisualAid {
  imageUrl: string;
  sourcePageUrl: string;
  alt: string;
  caption: string;
  stain?: string;
  credit?: string;
}

interface GuWhoEntityDescriptor {
  id: string;
  site: 'penis' | 'testis';
  category: string;
  family: string;
  entity: string;
  morphology_anchor: string;
  ancillary_anchor: string;
  top_differential: string[];
  visualAids?: DescriptorVisualAid[];
}

interface EntityReviewItem {
  id: string;
  category: string;
  family?: string;
  entity: string;
  summary?: string;
  morphology: string[];
  ancillary: string[];
  differentials: string[];
  visualAids: DescriptorVisualAid[];
}

type InteractiveLectureRecord = NonNullable<ReturnType<typeof getInteractivePromotedLecture>>;

interface LecturePrintDocumentProps {
  lecture: InteractiveLectureRecord;
  learningTargets: string[];
  facultyRunSheet: Array<{ time: string; title: string; text: string }>;
  lectureMetrics: Array<{ label: string; value: number }>;
  entityCategoryCounts: Array<{ category: string; count: number }>;
  entityReviewItems: EntityReviewItem[];
}

const STUDY_PROGRESS_KEY = 'didactic_series_lecture_study_progress';
const emptyProgress = (): LectureStudyProgress => ({
  completedModes: [],
  completedAlgorithms: [],
  completedLayerSets: [],
  completedChecks: [],
});

const LECTURE_VIEW_STATE_KEY = 'pthfndr-didactics-lecture-view-state';

interface LectureViewState {
  selectedId: string;
  majorTopicId?: string;
  subtopicId?: string;
  activeMode: LecturePlayerMode;
  activeQuestionIndex: number;
  initialNodeId?: string;
  initialLayerSetId?: string;
}

const LECTURE_VIEW_STATE_DEFAULTS: LectureViewState = {
  selectedId: '',
  activeMode: 'overview',
  activeQuestionIndex: 0,
};

const persistLectureViewState = (updates: Partial<LectureViewState> = {}) => {
  const current = readSessionState<LectureViewState>(LECTURE_VIEW_STATE_KEY);
  const next = {
    ...LECTURE_VIEW_STATE_DEFAULTS,
    ...(current || {}),
    ...updates,
  };
  writeSessionState<LectureViewState>(LECTURE_VIEW_STATE_KEY, next);
};

const readProgressStore = (): Record<string, LectureStudyProgress> => {
  if (typeof window === 'undefined') {
    return {};
  }
  try {
    const raw = window.localStorage.getItem(STUDY_PROGRESS_KEY);
    if (!raw) {
      return {};
    }
    return JSON.parse(raw) as Record<string, LectureStudyProgress>;
  } catch {
    return {};
  }
};

const writeProgressStore = (store: Record<string, LectureStudyProgress>) => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(STUDY_PROGRESS_KEY, JSON.stringify(store));
  } catch {
    // ignore storage issues
  }
};

const modeLabels: Record<LecturePlayerMode, string> = {
  overview: 'Foundations Review',
  algorithm: 'Diagnostic Approach',
  tissue: 'Microscopy',
  knowledge: 'Ancillary Studies',
  check: 'Board-Style Questions',
  transcript: 'Teaching Text',
};

const modeGuidance: Record<LecturePlayerMode, string> = {
  overview: 'Start with the main signout points.',
  algorithm: 'Work through the diagnostic approach.',
  tissue: 'Review the paired microscopic images.',
  knowledge: 'Review the stains, molecular findings, and reporting implications.',
  check: 'Work through board-style questions.',
  transcript: 'Read the full teaching text.',
};

const getLectureExportFilename = (title: string) =>
  `${title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'lecture'}-handout`;

const teachingImageFrameClass = 'w-full max-w-3xl';
const teachingImageClass = 'h-80 w-full bg-white object-contain';

type SlideVisualAid = NonNullable<InteractiveLectureRecord['slides'][number]['visualAid']>;

const resolveDidacticAsset = (assetPath: string) =>
  `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${assetPath.replace(/^\/+/, '')}`;

const slideFallbackVisualAids: Record<string, Record<string, SlideVisualAid>> = {
  renal_mass_eval: {
    Welcome: {
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/46/Clear_cell_renal_cell_carcinoma_intermed_mag.jpg',
      sourcePageUrl: 'https://commons.wikimedia.org/wiki/File:Clear_cell_renal_cell_carcinoma_intermed_mag.jpg',
      alt: 'Clear cell renal cell carcinoma with clear cytoplasm and delicate vasculature.',
      caption: 'Clear cell renal cell carcinoma illustrates the dominant renal mass sign-out problem: subtype, grade, necrosis, and invasion must be assessed together.',
      stain: 'H&E',
      credit: 'Wikimedia Commons',
    },
    'Anatomic Context': {
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/46/Clear_cell_renal_cell_carcinoma_intermed_mag.jpg',
      sourcePageUrl: 'https://commons.wikimedia.org/wiki/File:Clear_cell_renal_cell_carcinoma_intermed_mag.jpg',
      alt: 'Clear cell renal cell carcinoma in renal parenchyma.',
      caption: 'Renal mass evaluation begins by linking the microscopic tumor to anatomic compartment and staging surfaces.',
      stain: 'H&E',
      credit: 'Wikimedia Commons',
    },
    'The Universe of Renal Tumors': {
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/c4/Chromophobe_renal_cell_carcinoma%2C_eosinophilic_variant_-_high_mag.jpg',
      sourcePageUrl: 'https://commons.wikimedia.org/wiki/File:Chromophobe_renal_cell_carcinoma,_eosinophilic_variant_-_high_mag.jpg',
      alt: 'Chromophobe renal cell carcinoma with eosinophilic cytoplasm.',
      caption: 'The renal epithelial tumor differential is organized by cytoplasm, architecture, grade, and marker pattern.',
      stain: 'H&E',
      credit: 'Wikimedia Commons',
    },
    'Diagnostic Algorithm': {
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/21/Clear_cell_papillary_renal_cell_carcinoma_-_high_mag.jpg',
      sourcePageUrl: 'https://commons.wikimedia.org/wiki/File:Clear_cell_papillary_renal_cell_carcinoma_-_high_mag.jpg',
      alt: 'Clear cell papillary renal cell tumor with bland clear cells.',
      caption: 'Clear-cell morphology requires a deliberate checkpoint for indolent mimics before signing out conventional clear cell RCC.',
      stain: 'H&E',
      credit: 'Wikimedia Commons',
    },
    'Mechanism-First Tree': {
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/46/Clear_cell_renal_cell_carcinoma_intermed_mag.jpg',
      sourcePageUrl: 'https://commons.wikimedia.org/wiki/File:Clear_cell_renal_cell_carcinoma_intermed_mag.jpg',
      alt: 'Clear cell renal cell carcinoma, intermediate magnification.',
      caption: 'VHL/HIF biology explains the clear cytoplasm and delicate vascular pattern that anchor conventional clear cell RCC.',
      stain: 'H&E',
      credit: 'Wikimedia Commons',
    },
    'Deep Dive: Clear Cell RCC': {
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/46/Clear_cell_renal_cell_carcinoma_intermed_mag.jpg',
      sourcePageUrl: 'https://commons.wikimedia.org/wiki/File:Clear_cell_renal_cell_carcinoma_intermed_mag.jpg',
      alt: 'Clear cell renal cell carcinoma with delicate vascular network.',
      caption: 'Clear cell RCC shows clear cytoplasm and a delicate capillary network; the sign-out audit includes grade, necrosis, sarcomatoid/rhabdoid change, and invasion.',
      stain: 'H&E',
      credit: 'Wikimedia Commons',
    },
    'Critical Differential: The “Clear” Mimics': {
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/21/Clear_cell_papillary_renal_cell_carcinoma_-_high_mag.jpg',
      sourcePageUrl: 'https://commons.wikimedia.org/wiki/File:Clear_cell_papillary_renal_cell_carcinoma_-_high_mag.jpg',
      alt: 'Clear cell papillary renal cell tumor with tubulopapillary architecture.',
      caption: 'Clear cell papillary renal cell tumor is the key indolent clear-cell mimic; the teaching point is to stop before overcalling conventional RCC.',
      stain: 'H&E',
      credit: 'Wikimedia Commons',
    },
    'Case Challenge: The "Clear" Trap': {
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/21/Clear_cell_papillary_renal_cell_carcinoma_-_high_mag.jpg',
      sourcePageUrl: 'https://commons.wikimedia.org/wiki/File:Clear_cell_papillary_renal_cell_carcinoma_-_high_mag.jpg',
      alt: 'Clear cell papillary renal cell tumor, high magnification.',
      caption: 'Diffuse CK7 with cup-like CA9 pattern supports clear cell papillary renal cell tumor rather than conventional clear cell RCC.',
      stain: 'H&E',
      credit: 'Wikimedia Commons',
    },
    'Deep Dive: The Pink Tumors': {
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/c4/Chromophobe_renal_cell_carcinoma%2C_eosinophilic_variant_-_high_mag.jpg',
      sourcePageUrl: 'https://commons.wikimedia.org/wiki/File:Chromophobe_renal_cell_carcinoma,_eosinophilic_variant_-_high_mag.jpg',
      alt: 'Chromophobe renal cell carcinoma with eosinophilic cytoplasm and distinct cell borders.',
      caption: 'Chromophobe RCC and oncocytoma are separated by morphology plus CK7 pattern; the diagnosis changes staging and follow-up language.',
      stain: 'H&E',
      credit: 'Wikimedia Commons',
    },
    'Case Challenge: The "Pink" Trap': {
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/b5/Renal_oncocytoma_--_low_mag.jpg',
      sourcePageUrl: 'https://commons.wikimedia.org/wiki/File:Renal_oncocytoma_--_low_mag.jpg',
      alt: 'Renal oncocytoma with eosinophilic cells.',
      caption: 'Oncocytic renal tumors require CK7 pattern review before deciding whether the lesion is oncocytoma or chromophobe RCC.',
      stain: 'H&E',
      credit: 'Wikimedia Commons',
    },
    'Prognosis: WHO/ISUP Grading': {
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/46/Clear_cell_renal_cell_carcinoma_intermed_mag.jpg',
      sourcePageUrl: 'https://commons.wikimedia.org/wiki/File:Clear_cell_renal_cell_carcinoma_intermed_mag.jpg',
      alt: 'Clear cell renal cell carcinoma used for WHO/ISUP grading discussion.',
      caption: 'WHO/ISUP grading in clear cell RCC and papillary RCC is based on nucleolar prominence, with sarcomatoid or rhabdoid change defining grade 4.',
      stain: 'H&E',
      credit: 'Wikimedia Commons',
    },
    'Lecture Complete': {
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/46/Clear_cell_renal_cell_carcinoma_intermed_mag.jpg',
      sourcePageUrl: 'https://commons.wikimedia.org/wiki/File:Clear_cell_renal_cell_carcinoma_intermed_mag.jpg',
      alt: 'Clear cell renal cell carcinoma summary image.',
      caption: 'The renal mass sign-out closes by integrating subtype, grade, necrosis, sarcomatoid/rhabdoid change, vascular invasion, and stage.',
      stain: 'H&E',
      credit: 'Wikimedia Commons',
    },
  },
  testicular_mass_eval: {
    'Introduction to Testicular Pathology': {
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Seminoma_high_mag.jpg',
      sourcePageUrl: 'https://commons.wikimedia.org/wiki/File:Seminoma_high_mag.jpg',
      alt: 'Seminoma with uniform large cells and lymphocytic infiltrate.',
      caption: 'Seminoma anchors the postpubertal germ cell tumor workflow: classify the component, then account for markers, serum findings, and stage.',
      stain: 'H&E',
      credit: 'Wikimedia Commons',
    },
    'Anatomic Context': {
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/f0/Seminoma_with_syncytiotrophoblasts_-_low_mag.jpg',
      sourcePageUrl: 'https://commons.wikimedia.org/wiki/File:Seminoma_with_syncytiotrophoblasts_-_low_mag.jpg',
      alt: 'Seminoma involving testicular parenchyma at low magnification.',
      caption: 'Testicular tumor sign-out links tubules, interstitium, rete/epididymis/paratestis, and lymphovascular spaces to diagnosis and stage.',
      stain: 'H&E',
      credit: 'Wikimedia Commons',
    },
    'Diagnostic Algorithm': {
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/f6/Mixed_germ_cell_tumour_-_high_mag.jpg',
      sourcePageUrl: 'https://commons.wikimedia.org/wiki/File:Mixed_germ_cell_tumour_-_high_mag.jpg',
      alt: 'Mixed germ cell tumor at high magnification.',
      caption: 'A testicular mass is triaged by age, GCNIS relationship, morphology, serum markers, lymphovascular invasion, and component percentage.',
      stain: 'H&E',
      credit: 'Wikimedia Commons',
    },
    'Galaxy of Testicular Tumors': {
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/f6/Mixed_germ_cell_tumour_-_high_mag.jpg',
      sourcePageUrl: 'https://commons.wikimedia.org/wiki/File:Mixed_germ_cell_tumour_-_high_mag.jpg',
      alt: 'Mixed germ cell tumor demonstrating component heterogeneity.',
      caption: 'Mixed germ cell tumor demonstrates why component accounting is required in postpubertal testicular tumor reports.',
      stain: 'H&E',
      credit: 'Wikimedia Commons',
    },
    'Deep Dive: Seminoma': {
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Seminoma_high_mag.jpg',
      sourcePageUrl: 'https://commons.wikimedia.org/wiki/File:Seminoma_high_mag.jpg',
      alt: 'Classic seminoma, high magnification.',
      caption: 'Classic seminoma shows uniform large cells with clear cytoplasm, distinct borders, prominent nucleoli, and lymphocytic septa.',
      stain: 'H&E',
      credit: 'Wikimedia Commons',
    },
    'The Precursor: GCNIS': {
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/f0/Seminoma_with_syncytiotrophoblasts_-_low_mag.jpg',
      sourcePageUrl: 'https://commons.wikimedia.org/wiki/File:Seminoma_with_syncytiotrophoblasts_-_low_mag.jpg',
      alt: 'Seminoma in testicular parenchyma used for GCNIS-pathway teaching.',
      caption: 'GCNIS-pathway tumors require review of adjacent tubules, background testis, and component composition.',
      stain: 'H&E',
      credit: 'Wikimedia Commons',
    },
    'Case Challenge: The Serologic Mismatch': {
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/f6/Mixed_germ_cell_tumour_-_high_mag.jpg',
      sourcePageUrl: 'https://commons.wikimedia.org/wiki/File:Mixed_germ_cell_tumour_-_high_mag.jpg',
      alt: 'Mixed germ cell tumor for serum marker mismatch teaching.',
      caption: 'Elevated AFP in a tumor that appears seminomatous requires search for a nonseminomatous component, especially yolk sac tumor.',
      stain: 'H&E',
      credit: 'Wikimedia Commons',
    },
    'Deep Dive: Non-Seminomatous GCTs': {
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/00/Teratoma_2_high_mag.jpg',
      sourcePageUrl: 'https://commons.wikimedia.org/wiki/File:Teratoma_2_high_mag.jpg',
      alt: 'Teratoma with somatic-type tissue elements.',
      caption: 'Nonseminomatous germ cell tumor sign-out requires component identification because embryonal carcinoma, yolk sac tumor, choriocarcinoma, and teratoma carry different implications.',
      stain: 'H&E',
      credit: 'Wikimedia Commons',
    },
    'Reality Check: Mixed Tumors': {
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/f6/Mixed_germ_cell_tumour_-_high_mag.jpg',
      sourcePageUrl: 'https://commons.wikimedia.org/wiki/File:Mixed_germ_cell_tumour_-_high_mag.jpg',
      alt: 'Mixed germ cell tumor with more than one tumor component.',
      caption: 'Mixed germ cell tumor is reported by component percentage because even a minor aggressive component can change management.',
      stain: 'H&E',
      credit: 'Wikimedia Commons',
    },
    'Deep Dive: Sex Cord-Stromal Tumors': {
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/b8/Sertoli_cell_tumour_high_mag.jpg',
      sourcePageUrl: 'https://commons.wikimedia.org/wiki/File:Sertoli_cell_tumour_high_mag.jpg',
      alt: 'Sertoli cell tumor at high magnification.',
      caption: 'Sex cord-stromal tumors are separated from germ cell tumors by morphology, inhibin/SF1-calretinin support, and absence of germ cell marker profile.',
      stain: 'H&E',
      credit: 'Wikimedia Commons',
    },
    'Case Challenge: The Elderly Patient': {
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/3c/Testicular_spermatocytic_tumour_high_mag.jpg',
      sourcePageUrl: 'https://commons.wikimedia.org/wiki/File:Testicular_spermatocytic_tumour_high_mag.jpg',
      alt: 'Spermatocytic tumor in an older patient.',
      caption: 'Older-patient testicular masses shift the differential toward spermatocytic tumor, lymphoma, metastasis, and sex cord-stromal tumors.',
      stain: 'H&E',
      credit: 'Wikimedia Commons',
    },
    'Lecture Complete': {
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/f6/Mixed_germ_cell_tumour_-_high_mag.jpg',
      sourcePageUrl: 'https://commons.wikimedia.org/wiki/File:Mixed_germ_cell_tumour_-_high_mag.jpg',
      alt: 'Mixed germ cell tumor summary image.',
      caption: 'The testicular mass sign-out closes by integrating age, GCNIS status, tumor components, serum markers, lymphovascular invasion, margins, and stage.',
      stain: 'H&E',
      credit: 'Wikimedia Commons',
    },
  },
  bladder_path_core_principles: {
    'Bladder TURBT Reporting Consequences': {
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/63/High-grade_papillary_urothelial_carcinoma_--_high_mag.jpg',
      sourcePageUrl: 'https://commons.wikimedia.org/wiki/File:High-grade_papillary_urothelial_carcinoma_--_high_mag.jpg',
      alt: 'High-grade papillary urothelial carcinoma at high magnification.',
      caption: 'A TURBT report must establish grade, invasion, muscularis propria adequacy, and variant histology because those elements determine the next management step.',
      stain: 'H&E',
      credit: 'Wikimedia Commons',
    },
    'Specimen-First Approach': {
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/eb/High-grade_papillary_urothelial_carcinoma_-_inv_--_low_mag.jpg',
      sourcePageUrl: 'https://commons.wikimedia.org/wiki/File:High-grade_papillary_urothelial_carcinoma_-_inv_--_low_mag.jpg',
      alt: 'Invasive high-grade papillary urothelial carcinoma at low magnification.',
      caption: 'Specimen adequacy and depth of invasion are assessed before final grade language is useful.',
      stain: 'H&E',
      credit: 'Wikimedia Commons',
    },
    'Three Buckets': {
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/cf/Histopathology_of_papillary_urothelial_neoplasm_of_low_malignant_potential_-_low_magnification.jpg',
      sourcePageUrl: 'https://commons.wikimedia.org/wiki/File:Histopathology_of_papillary_urothelial_neoplasm_of_low_malignant_potential_-_low_magnification.jpg',
      alt: 'Papillary urothelial neoplasm at low magnification.',
      caption: 'Bladder lesions are first sorted into papillary, flat, and invasive patterns before subtype or ancillary questions.',
      stain: 'H&E',
      credit: 'Wikimedia Commons',
    },
    'Papillary Ladder': {
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/26/Histopathology_of_papillary_urothelial_neoplasm_of_low_malignant_potential_-_high_magnification.jpg',
      sourcePageUrl: 'https://commons.wikimedia.org/wiki/File:Histopathology_of_papillary_urothelial_neoplasm_of_low_malignant_potential_-_high_magnification.jpg',
      alt: 'Papillary urothelial neoplasm at high magnification.',
      caption: 'Papillary grading integrates epithelial thickness, polarity, architectural complexity, cytologic atypia, and mitotic distribution.',
      stain: 'H&E',
      credit: 'Wikimedia Commons',
    },
    'Flat Lesions': {
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/04/Urothelial_carcinoma_in_situ%2C_high_mag.jpg',
      sourcePageUrl: 'https://commons.wikimedia.org/wiki/File:Urothelial_carcinoma_in_situ,_high_mag.jpg',
      alt: 'Urothelial carcinoma in situ at high magnification.',
      caption: 'CIS diagnosis rests on full-thickness cytologic atypia; CK20, p53, and CD44 are adjuncts to a disciplined H&E read.',
      stain: 'H&E',
      credit: 'Wikimedia Commons',
    },
    'Invasion and Staging': {
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/eb/High-grade_papillary_urothelial_carcinoma_-_inv_--_low_mag.jpg',
      sourcePageUrl: 'https://commons.wikimedia.org/wiki/File:High-grade_papillary_urothelial_carcinoma_-_inv_--_low_mag.jpg',
      alt: 'Invasive high-grade urothelial carcinoma.',
      caption: 'The distinction between lamina propria invasion and muscularis propria invasion is the central management hinge in TURBT sign-out.',
      stain: 'H&E',
      credit: 'Wikimedia Commons',
    },
    'Aggressive Variants': {
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/63/High-grade_papillary_urothelial_carcinoma_--_high_mag.jpg',
      sourcePageUrl: 'https://commons.wikimedia.org/wiki/File:High-grade_papillary_urothelial_carcinoma_--_high_mag.jpg',
      alt: 'High-grade urothelial carcinoma used for variant histology teaching.',
      caption: 'Aggressive variant histology must be called out because micropapillary, plasmacytoid, nested, and sarcomatoid patterns can alter treatment planning.',
      stain: 'H&E',
      credit: 'Wikimedia Commons',
    },
    'Inflammatory and Metaplastic Mimics': {
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d5/BCG-induced_granulomatous_cystitis%2C_intermed._mag.jpg',
      sourcePageUrl: 'https://commons.wikimedia.org/wiki/File:BCG-induced_granulomatous_cystitis,_intermed._mag.jpg',
      alt: 'BCG-induced granulomatous cystitis at intermediate magnification.',
      caption: 'Treatment effect, cystitis, and metaplastic lesions must be interpreted with clinical context to avoid overcalling carcinoma.',
      stain: 'H&E',
      credit: 'Wikimedia Commons',
    },
    'Ancillary Studies': {
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/04/Urothelial_carcinoma_in_situ%2C_high_mag.jpg',
      sourcePageUrl: 'https://commons.wikimedia.org/wiki/File:Urothelial_carcinoma_in_situ,_high_mag.jpg',
      alt: 'Urothelial carcinoma in situ for ancillary study discussion.',
      caption: 'Ancillary studies support the H&E diagnosis: CK20, p53, and CD44 help in flat lesions; GATA3, p63, and uroplakin support urothelial lineage.',
      stain: 'H&E',
      credit: 'Wikimedia Commons',
    },
    'Tomorrow’s Sign-Out Script': {
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/eb/High-grade_papillary_urothelial_carcinoma_-_inv_--_low_mag.jpg',
      sourcePageUrl: 'https://commons.wikimedia.org/wiki/File:High-grade_papillary_urothelial_carcinoma_-_inv_--_low_mag.jpg',
      alt: 'Invasive high-grade urothelial carcinoma for sign-out workflow teaching.',
      caption: 'The bladder sign-out sequence is specimen, architecture, grade, CIS, invasion, muscularis propria, variant histology, and mimics.',
      stain: 'H&E',
      credit: 'Wikimedia Commons',
    },
    'High-Yield Takeaways': {
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/63/High-grade_papillary_urothelial_carcinoma_--_high_mag.jpg',
      sourcePageUrl: 'https://commons.wikimedia.org/wiki/File:High-grade_papillary_urothelial_carcinoma_--_high_mag.jpg',
      alt: 'High-grade papillary urothelial carcinoma summary image.',
      caption: 'Bladder pathology teaching closes on grade, depth, muscularis propria adequacy, CIS, and aggressive variant histology.',
      stain: 'H&E',
      credit: 'Wikimedia Commons',
    },
  },
  'ioc-overview-neuropathology': {
    'ABPath content-specification frame': {
      imageUrl: resolveDidacticAsset('reference-library/signout-sims/neuropathology/glioblastoma-high-mag-he.jpg'),
      sourcePageUrl:
        'https://commons.wikimedia.org/wiki/File:Histopathology_of_glioblastoma,_high_magnification',
      alt: 'Glioblastoma, high-grade astrocytic tumor with pseudopalisading necrosis and microvascular proliferation.',
      caption: 'Start with specimen context, then triage diffuse glial lesions by pattern, anatomic site, and treatment-effect risk before classifying.',
      stain: 'H&E',
      credit: 'Pathology image library',
    },
    'Normal-to-abnormal orientation': {
      imageUrl: resolveDidacticAsset('reference-library/signout-sims/neuropathology/meningioma-he.jpg'),
      sourcePageUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10918275/',
      alt: 'Meningioma tissue showing lobules and whorls.',
      caption:
        'Neuropathology starts by distinguishing normal CNS architecture from neoplastic and non-neoplastic abnormalities such as meningioma and glioma.',
      stain: 'H&E',
      credit: 'PMC (CC BY)',
    },
    'Diagnostic decision sequence': {
      imageUrl: resolveDidacticAsset('reference-library/signout-sims/neuropathology/anaplastic-oligodendroglioma-he.jpg'),
      sourcePageUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4745799/',
      alt: 'Oligodendroglioma with uniform round nuclei and clear cytoplasmic halos.',
      caption: 'Use a sequence of specimen type, architecture, grade, and molecular context to reduce anchoring in neuropathology sign-out.',
      stain: 'H&E',
      credit: 'PMC (CC BY)',
    },
    'ABPath topic targets': {
      imageUrl: resolveDidacticAsset('reference-library/signout-sims/neuropathology/primary-cns-lymphoma-high-mag.jpg'),
      sourcePageUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11011375/',
      alt: 'Primary CNS lymphoma-like large-cell lymphoid morphology on CNS biopsy.',
      caption: 'Crosswalk each target to where morphology could confuse glioma, lymphoma, or treatment effect before reporting.',
      stain: 'H&E / HPS',
      credit: 'PMC (CC BY)',
    },
    'Retrieval before reveal': {
      imageUrl: resolveDidacticAsset('reference-library/signout-sims/neuropathology/medulloblastoma-he.jpg'),
      sourcePageUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9421471/',
      alt: 'Medulloblastoma with dense blue cellular growth pattern.',
      caption: 'Practice retrieval by naming entity, critical microscopic clue, and report phrase that changes immediate management before answer reveal.',
      stain: 'H&E',
      credit: 'PMC (CC BY)',
    },
  },
};

const getSlideVisualAid = (lectureId: string, slide: InteractiveLectureRecord['slides'][number]) =>
  slide.visualAid ?? slideFallbackVisualAids[lectureId]?.[slide.title];

const slideTypeLabels: Record<InteractiveLectureRecord['slides'][number]['type'], string> = {
  intro: 'Opening frame',
  framework: 'Signout framework',
  anatomy: 'Anatomic context',
  network: 'Diagnostic network',
  algorithm: 'Decision checkpoint',
  tissue_layer: 'Microscopy checkpoint',
  knowledge_pack: 'Ancillary checkpoint',
  pitfall: 'Common trap',
  workflow: 'Workflow checkpoint',
  quick_check: 'Recall checkpoint',
  summary: 'Closing synthesis',
  grading: 'Grading checkpoint',
  staging: 'Staging checkpoint',
  variant: 'Variant checkpoint',
  mimic: 'Mimic checkpoint',
  ihc: 'Ancillary checkpoint',
};

const slideTypePrompts: Record<InteractiveLectureRecord['slides'][number]['type'], string> = {
  intro: 'Name the signout problem before revealing the teaching point.',
  framework: 'Use the mapped image to anchor the diagnostic framework.',
  anatomy: 'Orient the specimen and anatomic compartment before naming the lesion.',
  network: 'Place this finding inside the broader diagnostic network before revealing.',
  algorithm: 'Call the next branch in the algorithm from morphology first.',
  tissue_layer: 'Read the slide in order before opening the explanation.',
  knowledge_pack: 'Commit to the key ancillary clue before revealing it.',
  pitfall: 'State the overcall or undercall risk before reveal.',
  workflow: 'Say which report element changes management first.',
  quick_check: 'Answer the checkpoint aloud before revealing.',
  summary: 'Close the case in signout language before reveal.',
  grading: 'Decide the grading hinge before revealing the answer.',
  staging: 'Identify the staging threshold before reveal.',
  variant: 'Name the variant logic before opening the explanation.',
  mimic: 'Commit to the mimic split before revealing the teaching point.',
  ihc: 'Choose the morphology-led stain question before reveal.',
};

const getSlideContextLine = (
  slide: InteractiveLectureRecord['slides'][number],
  visualAid?: SlideVisualAid
) => visualAid?.caption ?? slideTypePrompts[slide.type] ?? 'Review the mapped image before revealing the teaching point.';

const getEntityContextLine = (item: EntityReviewItem) =>
  item.summary ??
  item.visualAids[0]?.caption ??
  item.morphology[0] ??
  'Use morphology first, then ancillary studies, then the reporting consequence.';

const guWhoEntities = guWhoEntityManifest.entities as GuWhoEntityDescriptor[];

const getDescriptorSiteForLecture = (lectureId: string): GuWhoEntityDescriptor['site'] | null => {
  if (lectureId === 'penile_who_complete_pathology') {
    return 'penis';
  }
  if (lectureId === 'testicular_who_complete_pathology') {
    return 'testis';
  }
  return null;
};

const entityCardToReviewItem = (card: DxEntityCard): EntityReviewItem => {
  const ancillary = [
    ...card.keyIHC.positive.map((item) => `Positive: ${item}`),
    ...(card.keyIHC.negative ?? []).map((item) => `Negative: ${item}`),
    ...(card.keyIHC.patterns ?? []).map((item) => `Pattern: ${item}`),
    ...(card.keyMolecular ?? []).map((item) => `Molecular: ${item}`),
  ];

  return {
    id: card.entityId,
    category: 'Diagnostic entity',
    family: card.prognosis.tier,
    entity: card.entityId,
    summary: card.summary,
    morphology: card.keyMorphology,
    ancillary,
    differentials: card.criticalDifferential,
    visualAids: (card.visualAids ?? []).map((aid) => ({
      imageUrl: aid.imageUrl,
      sourcePageUrl: aid.sourcePageUrl,
      alt: aid.alt,
      caption: aid.caption,
      stain: aid.stain,
      credit: aid.credit,
    })),
  };
};

const whoDescriptorToReviewItem = (entity: GuWhoEntityDescriptor): EntityReviewItem => ({
  id: entity.id,
  category: entity.category,
  family: entity.family,
  entity: entity.entity,
  morphology: [entity.morphology_anchor],
  ancillary: [entity.ancillary_anchor],
  differentials: entity.top_differential,
  visualAids: entity.visualAids ?? [],
});

const renderSlideVisualAid = (
  slide: { visualAid?: NonNullable<ReturnType<typeof getInteractivePromotedLecture>>['slides'][number]['visualAid'] },
  options?: { showCaption?: boolean; imageClassName?: string }
) => {
  if (!slide.visualAid) {
    return null;
  }

  return (
    <figure className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
      <img
        src={resolveAcquiredImageUrl(slide.visualAid.imageUrl)}
        alt={slide.visualAid.alt}
        loading="lazy"
        className={options?.imageClassName ?? 'h-44 w-full object-cover'}
      />
      {(options?.showCaption ?? true) && (
        <figcaption className="space-y-1 px-3 py-2 text-xs text-slate-600">
          <div>{slide.visualAid.caption}</div>
        </figcaption>
      )}
    </figure>
  );
};

const renderPrimaryVisual = (
  visualAid: NonNullable<ReturnType<typeof getInteractivePromotedLecture>>['slides'][number]['visualAid'],
  options?: { showCaption?: boolean }
) => {
  if (!visualAid) {
    return null;
  }

  return (
    <figure className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <img
        src={resolveAcquiredImageUrl(visualAid.imageUrl)}
        alt={visualAid.alt}
        loading="eager"
        className={teachingImageClass}
      />
      {(options?.showCaption ?? true) && (
        <figcaption className="border-t border-slate-200 px-4 py-3 text-sm leading-6 text-slate-700">
          {visualAid.caption}
        </figcaption>
      )}
    </figure>
  );
};

const renderDescriptorVisualAid = (
  aid: DescriptorVisualAid,
  entityName: string,
  options?: { showCaption?: boolean; imageClassName?: string }
) => (
  <figure className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
    <img
      src={resolveAcquiredImageUrl(aid.imageUrl)}
      alt={aid.alt || `${entityName} histology image`}
      loading="lazy"
      className={options?.imageClassName ?? 'h-40 w-full object-cover'}
    />
    {(options?.showCaption ?? true) && (
      <figcaption className="space-y-1 px-3 py-2 text-xs text-slate-600">
        <div>{aid.caption}</div>
        <div className="flex flex-wrap items-center gap-2">
          {aid.stain && (
            <span className="rounded-full bg-white px-2 py-0.5 font-semibold text-slate-600">
              {aid.stain}
            </span>
          )}
        </div>
      </figcaption>
    )}
  </figure>
);

const renderPrintVisualAid = (aid: DescriptorVisualAid | LectureVisualAid, entityName: string) => (
  <figure key={`${entityName}-${aid.imageUrl}`} className="lecture-print-figure">
    <img
      src={resolveAcquiredImageUrl(aid.imageUrl)}
      alt={aid.alt || `${entityName} histology image`}
      className="lecture-print-image"
    />
    <figcaption>
      <div>{aid.caption}</div>
      {aid.stain && <div className="lecture-print-stain">{aid.stain}</div>}
    </figcaption>
  </figure>
);

const LecturePrintDocument: React.FC<LecturePrintDocumentProps> = ({
  lecture,
  learningTargets,
  facultyRunSheet,
  lectureMetrics,
  entityCategoryCounts,
  entityReviewItems,
}) => (
  <article className="print-only lecture-print-document" aria-label={`${lecture.title} printable lecture handout`}>
    <header className="lecture-print-cover">
      <p>{lecture.category ?? 'Pathology Lecture'}</p>
      <h1>{lecture.title}</h1>
      {lecture.summary && <div className="lecture-print-summary">{lecture.summary}</div>}
    </header>

    <section className="lecture-print-section">
      <h2>Session Plan</h2>
      <div className="lecture-print-metrics">
        {lectureMetrics.map((metric) => (
          <div key={metric.label} className="lecture-print-metric">
            <strong>{metric.value}</strong>
            <span>{metric.label}</span>
          </div>
        ))}
      </div>
      <div className="lecture-print-run-sheet">
        {facultyRunSheet.map((item) => (
          <div key={`${item.time}-${item.title}`} className="lecture-print-card">
            <div className="lecture-print-time">{item.time}</div>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </div>
        ))}
      </div>
    </section>

    {learningTargets.length > 0 && (
      <section className="lecture-print-section">
        <h2>Learning Objectives</h2>
        <ul>
          {learningTargets.map((target) => (
            <li key={target}>{target}</li>
          ))}
        </ul>
      </section>
    )}

    {lecture.slides.length > 0 && (
      <section className="lecture-print-section">
        <h2>Teaching Sequence</h2>
        {lecture.slides.map((slide, index) => (
          <div key={`${lecture.id}-print-slide-${index}`} className="lecture-print-card">
            <div className="lecture-print-time">Step {index + 1}</div>
            <h3>{slide.title}</h3>
            {slide.content && <p>{slide.content}</p>}
            {slide.visualAid && renderPrintVisualAid(slide.visualAid, slide.title)}
          </div>
        ))}
      </section>
    )}

    {entityReviewItems.length > 0 && (
      <section className="lecture-print-section">
        <h2>Entities, Microscopy, and Ancillary Studies</h2>
        {entityCategoryCounts.length > 0 && (
          <div className="lecture-print-diagnostic-groups">
            {entityCategoryCounts.map((item) => (
              <span key={item.category}>
                {item.category}: {item.count}
              </span>
            ))}
          </div>
        )}
        {entityReviewItems.map((item) => (
          <div key={`${item.id}-print`} className="lecture-print-card lecture-print-entity">
            <div className="lecture-print-entity-heading">
              <div>
                <div className="lecture-print-time">{item.category}</div>
                <h3>{item.entity}</h3>
              </div>
              {item.family && <span>{item.family}</span>}
            </div>
            {item.summary && <p>{item.summary}</p>}
            {item.visualAids.length > 0 && (
              <div className="lecture-print-image-grid">
                {item.visualAids.map((aid) => renderPrintVisualAid(aid, item.entity))}
              </div>
            )}
            <div className="lecture-print-two-column">
              <div>
                <h4>Microscopic Findings</h4>
                <ul>
                  {item.morphology.map((finding) => (
                    <li key={`${item.id}-print-morph-${finding}`}>{finding}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4>Ancillary Studies</h4>
                <ul>
                  {item.ancillary.map((study) => (
                    <li key={`${item.id}-print-ancillary-${study}`}>{study}</li>
                  ))}
                </ul>
              </div>
            </div>
            {item.differentials.length > 0 && (
              <div>
                <h4>Differential Diagnosis</h4>
                <p>{item.differentials.join('; ')}</p>
              </div>
            )}
          </div>
        ))}
      </section>
    )}

    {lecture.tissueLayerSets.length > 0 && (
      <section className="lecture-print-section">
        <h2>Microscopy Image Sets</h2>
        {lecture.tissueLayerSets.map((layerSet) => (
          <div key={`${layerSet.id}-print`} className="lecture-print-card">
            <h3>{layerSet.title}</h3>
            <p>{layerSet.summary}</p>
            <div className="lecture-print-image-grid">
              {layerSet.images.map((image) => (
                <div key={`${layerSet.id}-${image.id}`} className="lecture-print-figure">
                  <img
                    src={resolveAcquiredImageUrl(image.imageUrl)}
                    alt={image.title}
                    className="lecture-print-image"
                  />
                  <figcaption>
                    <div>{image.description}</div>
                    {image.stain && <div className="lecture-print-stain">{image.stain}</div>}
                  </figcaption>
                </div>
              ))}
            </div>
            <div className="lecture-print-two-column">
              {layerSet.images.map((image) => (
                <div key={`${layerSet.id}-${image.id}-notes`}>
                  <h4>{image.viewLabel}</h4>
                  <ul>
                    {image.whatToNotice.map((notice) => (
                      <li key={`${image.id}-${notice}`}>{notice}</li>
                    ))}
                  </ul>
                  {image.pitfallNote && <p>{image.pitfallNote}</p>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    )}

    {lecture.algorithms.length > 0 && (
      <section className="lecture-print-section">
        <h2>Diagnostic Algorithms</h2>
        {lecture.algorithms.map((algorithm) => (
          <div key={`${algorithm.id}-print`} className="lecture-print-card">
            <h3>{algorithm.title}</h3>
            <p>{algorithm.summary}</p>
            {Object.values(algorithm.nodes).map((node) => (
              <div key={`${algorithm.id}-${node.id}`} className="lecture-print-node">
                <h4>{node.title}</h4>
                <p>{node.description}</p>
                {node.morphologyFeatures && (
                  <ul>
                    {node.morphologyFeatures.map((feature) => (
                      <li key={`${node.id}-morph-${feature}`}>{feature}</li>
                    ))}
                  </ul>
                )}
                {node.recommendedInitialIHC && <p><strong>Initial stains:</strong> {node.recommendedInitialIHC.join(', ')}</p>}
                {node.recommendedReflexIHC && <p><strong>Reflex stains:</strong> {node.recommendedReflexIHC.join(', ')}</p>}
                {node.confirmatoryStudies && <p><strong>Confirmatory studies:</strong> {node.confirmatoryStudies.join(', ')}</p>}
                {node.options && <p><strong>Next steps:</strong> {node.options.map((option) => option.label).join('; ')}</p>}
                {node.diagnosis && <p><strong>Diagnosis:</strong> {node.diagnosis}</p>}
              </div>
            ))}
          </div>
        ))}
      </section>
    )}

    {(lecture.enhancement?.pitfalls.length ?? 0) > 0 && (
      <section className="lecture-print-section">
        <h2>Diagnostic Pitfalls</h2>
        {lecture.enhancement?.pitfalls.map((pitfall) => (
          <div key={`${pitfall.id}-print`} className="lecture-print-card">
            <h3>{pitfall.title}</h3>
            <p><strong>Overcall risk:</strong> {pitfall.overcallRisk}</p>
            <p><strong>Undercall risk:</strong> {pitfall.undercallRisk}</p>
            <p><strong>Stain support:</strong> {pitfall.stainHelp}</p>
            <p><strong>Morphology guardrail:</strong> {pitfall.morphologyGuardrail}</p>
          </div>
        ))}
      </section>
    )}

    {(lecture.quickChecks.length > 0 || lecture.mcqs.length > 0 || lecture.flashcards.length > 0) && (
      <section className="lecture-print-section">
        <h2>Discussion Questions</h2>
        {lecture.quickChecks.map((check) => (
          <div key={`${check.id}-print`} className="lecture-print-card">
            <h3>{check.prompt}</h3>
            <p>{check.teachingCue}</p>
            {check.checkpoints && (
              <ul>
                {check.checkpoints.map((checkpoint) => (
                  <li key={`${check.id}-${checkpoint}`}>{checkpoint}</li>
                ))}
              </ul>
            )}
            {check.mcq && (
              <>
                <p>
                  <strong>Answer:</strong> {check.mcq.answer}
                </p>
                <ul>
                  {getAnswerChoiceReasoning(check.mcq).map((item) => (
                    <li key={`${check.id}-${item.choice}-reasoning`}>
                      <strong>{item.choice}:</strong> {item.reasoning}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        ))}
        {lecture.mcqs.map((mcq) => (
          <div key={`${mcq.topic}-${mcq.question}`} className="lecture-print-card">
            <h3>{mcq.question}</h3>
            <ul>
              {mcq.choices.map((choice) => (
                <li key={`${mcq.question}-${choice}`}>{choice}</li>
              ))}
            </ul>
            <p>
              <strong>Answer:</strong> {mcq.answer}
            </p>
            <ul>
              {getAnswerChoiceReasoning(mcq).map((item) => (
                <li key={`${mcq.topic}-${mcq.question}-${item.choice}-reasoning`}>
                  <strong>{item.choice}:</strong> {item.reasoning}
                </li>
              ))}
            </ul>
          </div>
        ))}
        {lecture.flashcards.map((card) => (
          <div key={`${card.tag}-${card.front}`} className="lecture-print-card">
            <h3>{card.front}</h3>
            <p>{card.back}</p>
          </div>
        ))}
      </section>
    )}

    <section className="lecture-print-section">
      <h2>Full Lecture Text</h2>
      <MarkdownContent content={lecture.body} />
    </section>

    {lecture.references.length > 0 && (
      <section className="lecture-print-section">
        <h2>References</h2>
        <ol>
          {lecture.references.map((reference) => (
            <li key={reference}>{reference}</li>
          ))}
        </ol>
      </section>
    )}
  </article>
);

const DidacticLectures: React.FC<DidacticLecturesProps> = ({ preferences, onSectionChange }) => {
  const [destination, setDestination] = useState<ActiveStudyDestination>(() =>
    getDefaultStudyDestination('lectures')
  );
  const [activeMode, setActiveMode] = useState<LecturePlayerMode>('overview');
  const [initialNodeId, setInitialNodeId] = useState<string | undefined>(undefined);
  const [initialLayerSetId, setInitialLayerSetId] = useState<string | undefined>(undefined);
  const [selectionSeed, setSelectionSeed] = useState<LectureSelectionSeed | null>(null);
  const [progressStore, setProgressStore] = useState<Record<string, LectureStudyProgress>>(readProgressStore);
  const [revealedSlideIds, setRevealedSlideIds] = useState<Record<string, boolean>>({});
  const lectureStudyTree = useMemo(() => buildLectureStudyTree(promotedLectures), []);

  const selectLecture = (
    lectureId: string,
    options?: { mode?: LecturePlayerMode; initialNodeId?: string; initialLayerSetId?: string }
  ) => {
    const lecture = getPromotedLectureById(lectureId);
    const nextDestination = pushStudyDestination('lectures', {
      kind: 'item_detail',
      majorTopicId: lecture?.category || undefined,
      subtopicId: lectureId,
      itemId: lectureId,
      activeTab: options?.mode ?? 'overview',
    });
    setDestination(nextDestination);
    setSelectionSeed({
      lectureId,
      mode: options?.mode,
      initialNodeId: options?.initialNodeId,
      initialLayerSetId: options?.initialLayerSetId,
    });
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const returnToLectureList = () => {
    const previousDestination = effectiveDestination.previous ?? getDefaultStudyDestination('lectures');
    replaceStudyDestination(previousDestination);
    setDestination(previousDestination);
    setSelectionSeed(null);
    setInitialNodeId(undefined);
    setInitialLayerSetId(undefined);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const intent = consumeLectureLibraryIntent();
    const restoredDestination = restoreStudyDestination('lectures');
    setDestination(restoredDestination);
    if (restoredDestination.activeTab) {
      setActiveMode(restoredDestination.activeTab as LecturePlayerMode);
    }
    if (!intent) {
      return;
    }

    if (intent.track) {
      const matchingLecture = promotedLectures.find((lecture) => lecture.lectureTrack === intent.track);
      if (matchingLecture) {
        const nextDestination = pushStudyDestination('lectures', {
          kind: 'topic_overview',
          majorTopicId: matchingLecture.category || undefined,
        });
        setDestination(nextDestination);
      }
    }
    if (intent.selectedId) {
      const lecture = getPromotedLectureById(intent.selectedId);
      if (lecture) {
        selectLecture(lecture.id, {
          mode: intent.initialMode,
          initialNodeId: intent.initialNodeId,
          initialLayerSetId: intent.imageLayerSetId,
        });
      }
    } else {
      setActiveMode(intent.initialMode ?? 'overview');
      setInitialNodeId(intent.initialNodeId);
      setInitialLayerSetId(intent.imageLayerSetId);
    }
  }, []);

  useEffect(() => {
    setStudyDestinationActiveTab('lectures', activeMode);
  }, [activeMode]);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const nextDestination = (event.state?.didacticsStudyDestination as ActiveStudyDestination | undefined);
      if (nextDestination?.workspace === 'lectures') {
        setDestination(nextDestination);
        if (nextDestination.activeTab) {
          setActiveMode(nextDestination.activeTab as LecturePlayerMode);
        }
      }
    };

    const handleDestinationChange = (event: Event) => {
      const nextDestination = (event as CustomEvent<ActiveStudyDestination>).detail;
      if (nextDestination?.workspace === 'lectures') {
        setDestination(nextDestination);
        if (nextDestination.activeTab) {
          setActiveMode(nextDestination.activeTab as LecturePlayerMode);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener(STUDY_DESTINATION_EVENT, handleDestinationChange as EventListener);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener(STUDY_DESTINATION_EVENT, handleDestinationChange as EventListener);
    };
  }, []);

  const lectureSubtopicsByRoot = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(lectureStudyTree.subtopicsByRoot).map(([rootId, entries]) => [
          rootId,
          entries.map((entry) => ({ id: entry.id })),
        ])
      ),
    [lectureStudyTree.subtopicsByRoot]
  );
  const resolvedDestination = useMemo(
    () =>
      resolveStudyDestinationForRender({
        destination,
        validRoots: lectureStudyTree.roots.map((root) => root.id),
        subtopicsByRoot: lectureSubtopicsByRoot,
        isValidItemId: (itemId) => Boolean(itemId && getPromotedLectureById(itemId)),
      }),
    [destination, lectureStudyTree.roots, lectureSubtopicsByRoot]
  );
  const effectiveDestination = resolvedDestination.destination;
  const effectiveKind = resolvedDestination.renderedKind;
  useEffect(() => {
    if (!resolvedDestination.resolved) {
      return;
    }
    const nextDestination = effectiveDestination;
    if (JSON.stringify(nextDestination) !== JSON.stringify(destination)) {
      replaceStudyDestination(nextDestination);
      setDestination(nextDestination);
      const syncedMode = nextDestination.activeTab as LecturePlayerMode | undefined;
      if (syncedMode) {
        setActiveMode(syncedMode);
      }
    }
  }, [destination, effectiveDestination, resolvedDestination.resolved]);

  const activeLectureRecords = useMemo(() => {
    if (!effectiveDestination.majorTopicId) {
      return [];
    }
    return promotedLectures.filter((lecture) => (lecture.category || 'Curated Lectures') === effectiveDestination.majorTopicId);
  }, [effectiveDestination.majorTopicId]);

  const selectedLecture = useMemo(() => {
    if (effectiveDestination.kind !== 'item_detail' || !effectiveDestination.itemId) {
      return undefined;
    }
    const lecture = getPromotedLectureById(effectiveDestination.itemId);
    return lecture ? getInteractivePromotedLecture(lecture.id) : undefined;
  }, [effectiveDestination.itemId, effectiveDestination.kind]);
  useEffect(() => {
    persistLectureViewState({
      selectedId: selectedLecture?.id ?? '',
      majorTopicId: effectiveDestination.majorTopicId,
      subtopicId: effectiveDestination.subtopicId,
      activeMode,
      activeQuestionIndex: 0,
      initialNodeId,
      initialLayerSetId,
    });
  }, [
    activeMode,
    effectiveDestination.itemId,
    effectiveDestination.majorTopicId,
    effectiveDestination.subtopicId,
    initialNodeId,
    initialLayerSetId,
    selectedLecture?.id,
  ]);
  const activeLectureRoot = effectiveDestination.majorTopicId;
  const activeLectureSubtopics = useMemo(
    () => (activeLectureRoot ? lectureStudyTree.subtopicsByRoot[activeLectureRoot] ?? [] : []),
    [activeLectureRoot, lectureStudyTree.subtopicsByRoot]
  );
  const activeLectureSubtopic = activeLectureSubtopics.find((entry) => entry.id === effectiveDestination.subtopicId) ?? null;
  const activeLectureSubtopicItems = useMemo(
    () => activeLectureRecords.filter((lecture) => lecture.id === activeLectureSubtopic?.id),
    [activeLectureRecords, activeLectureSubtopic?.id]
  );
  const lectureBodySections = useMemo(
    () => (selectedLecture?.body ? parseTeachingSections(selectedLecture.body).filter((section) => section.kind !== 'intro') : []),
    [selectedLecture?.body]
  );
  const descriptorEntities = useMemo(() => {
    const descriptorSite = selectedLecture ? getDescriptorSiteForLecture(selectedLecture.id) : null;
    if (!descriptorSite) {
      return [];
    }
    return guWhoEntities.filter((entity) => entity.site === descriptorSite);
  }, [selectedLecture?.id]);
  const entityReviewItems = useMemo(() => {
    if (!selectedLecture) {
      return [];
    }
    if (descriptorEntities.length > 0) {
      return descriptorEntities.map(whoDescriptorToReviewItem);
    }
    return selectedLecture.entityCards
      .map(entityCardToReviewItem)
      .filter((item) => item.visualAids.length > 0 || item.morphology.length > 0 || item.ancillary.length > 0);
  }, [descriptorEntities, selectedLecture]);
  const availableModes = useMemo(() => {
    if (!selectedLecture) {
      return ['overview', 'transcript'] as LecturePlayerMode[];
    }
    const modes: LecturePlayerMode[] = ['overview'];
    if (selectedLecture.algorithms.length > 0) modes.push('algorithm');
    if (selectedLecture.tissueLayerSets.length > 0) modes.push('tissue');
    if (selectedLecture.entityCards.length > 0 || (selectedLecture.enhancement?.pitfalls.length ?? 0) > 0) modes.push('knowledge');
    if (
      selectedLecture.quickChecks.length > 0 ||
      selectedLecture.flashcards.length > 0 ||
      selectedLecture.mcqs.length > 0
    ) {
      modes.push('check');
    }
    modes.push('transcript');
    return modes;
  }, [selectedLecture]);

  const selectedProgress = selectedLecture ? progressStore[selectedLecture.id] ?? emptyProgress() : emptyProgress();
  const resumeLecture = useMemo(() => {
    const previousItemId = effectiveDestination.previous?.itemId;
    return previousItemId ? getPromotedLectureById(previousItemId) : undefined;
  }, [effectiveDestination.previous?.itemId]);

  useEffect(() => {
    setRevealedSlideIds({});
  }, [selectedLecture?.id]);

  useEffect(() => {
    if (!selectedLecture) {
      return;
    }

    const requestedSeed = selectionSeed?.lectureId === selectedLecture.id ? selectionSeed : null;
    const storedProgress = progressStore[selectedLecture.id];
    const preferredMode =
      requestedSeed?.mode ||
      storedProgress?.lastMode ||
      selectedLecture.defaultMode ||
      selectedLecture.enhancement?.recommendedOrder[0] ||
      'overview';
    const nextMode = availableModes.includes(preferredMode) ? preferredMode : availableModes[0];

    setActiveMode(nextMode);
    setInitialNodeId(requestedSeed?.initialNodeId);
    setInitialLayerSetId(requestedSeed?.initialLayerSetId);
  }, [availableModes, selectedLecture?.id, selectionSeed]);

  const persistProgress = (lectureId: string, updater: (current: LectureStudyProgress) => LectureStudyProgress) => {
    setProgressStore((current) => {
      const next = {
        ...current,
        [lectureId]: updater(current[lectureId] ?? emptyProgress()),
      };
      writeProgressStore(next);
      return next;
    });
  };

  useEffect(() => {
    if (!selectedLecture) {
      return;
    }
    persistProgress(selectedLecture.id, (current) => ({
      ...current,
      lastMode: activeMode,
      completedModes: current.completedModes.includes(activeMode)
        ? current.completedModes
        : [...current.completedModes, activeMode],
    }));
  }, [activeMode, selectedLecture?.id]);

  const studyPath = useMemo(() => {
    if (!selectedLecture) {
      return [];
    }

    const preferredOrder = selectedLecture.enhancement?.recommendedOrder ?? ['overview', 'transcript'];
    const orderedModes = preferredOrder.filter((mode) => availableModes.includes(mode));
    const remainingModes = availableModes.filter((mode) => !orderedModes.includes(mode));
    return [...orderedModes, ...remainingModes];
  }, [availableModes, selectedLecture]);

  const learningTargets = useMemo(() => {
    if (!selectedLecture) {
      return [];
    }
    return [
      ...(selectedLecture.learningObjectives ?? []),
      selectedLecture.summary ?? '',
      ...(selectedLecture.slides.slice(0, 3).map((slide) => slide.title)),
    ].filter(Boolean);
  }, [selectedLecture]);

  const primaryVisualAid = useMemo(() => {
    if (!selectedLecture) {
      return undefined;
    }
    return selectedLecture.slides.map((slide) => getSlideVisualAid(selectedLecture.id, slide)).find(Boolean);
  }, [selectedLecture]);
  const recommendedLectureRoot = useMemo(
    () => effectiveDestination.previous?.majorTopicId ?? lectureStudyTree.roots[0]?.id,
    [effectiveDestination.previous?.majorTopicId, lectureStudyTree.roots]
  );
  const recommendedLectureRootLabel = useMemo(
    () => lectureStudyTree.roots.find((root) => root.id === recommendedLectureRoot)?.label ?? recommendedLectureRoot,
    [lectureStudyTree.roots, recommendedLectureRoot]
  );
  const lectureScopeLine = useMemo(() => {
    if (!selectedLecture) {
      return '';
    }
    return selectedLecture.tags?.slice(0, 4).join(' · ') || selectedLecture.category || 'General review';
  }, [selectedLecture]);
  const lecturePitfallPreview = useMemo(
    () => selectedLecture?.enhancement?.pitfalls?.[0]?.title ?? null,
    [selectedLecture]
  );
  const nextLectureMode = useMemo(() => {
    const activeIndex = studyPath.indexOf(activeMode);
    return activeIndex >= 0 ? studyPath[activeIndex + 1] ?? null : studyPath[0] ?? null;
  }, [activeMode, studyPath]);

  const entityCategoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    entityReviewItems.forEach((item) => {
      counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
    });
    return Array.from(counts.entries()).map(([category, count]) => ({ category, count }));
  }, [entityReviewItems]);

  const lectureMetrics = useMemo(() => {
    if (!selectedLecture) {
      return [];
    }
    return [
      { label: 'Teaching steps', value: selectedLecture.slides.length + entityReviewItems.length },
      { label: 'Entities reviewed', value: entityReviewItems.length },
      {
        label: 'Image-backed entities',
        value: entityReviewItems.filter((item) => item.visualAids.length > 0).length,
      },
      { label: 'Questions', value: selectedLecture.quickChecks.length + selectedLecture.flashcards.length + selectedLecture.mcqs.length },
    ];
  }, [entityReviewItems, selectedLecture]);

  const facultyRunSheet = useMemo(() => {
    if (!selectedLecture) {
      return [];
    }
    const opening = selectedLecture.slides[0]?.title ?? selectedLecture.title;
    const microscopy =
      selectedLecture.slides.find((slide, index) => index > 0 && getSlideVisualAid(selectedLecture.id, slide))?.title ??
      selectedLecture.slides.find((slide) => getSlideVisualAid(selectedLecture.id, slide))?.title ??
      'Microscopy review';
    const criteria = entityReviewItems[0]?.entity ?? 'Diagnostic criteria';
    return [
      {
        time: '0-5 min',
        title: opening,
        text: learningTargets[0] ?? selectedLecture.summary ?? 'Define the clinical problem and the sign-out task.',
      },
      {
        time: '5-20 min',
        title: microscopy,
        text: primaryVisualAid?.caption ?? 'Review the first diagnostic image before moving to criteria.',
      },
      {
        time: '20-35 min',
        title: criteria,
        text: 'Move entity by entity: morphology first, then ancillary studies, then the reporting consequence.',
      },
      {
        time: '35-45 min',
        title: 'Sign-out synthesis',
        text: 'Close with the report elements that change staging, treatment, or specimen handling.',
      },
    ];
  }, [entityReviewItems, learningTargets, primaryVisualAid, selectedLecture]);
  const exportLecturePdf = () => {
    if (!selectedLecture || typeof window === 'undefined') {
      return;
    }

    const originalTitle = document.title;
    const printableTitle = `${getLectureExportFilename(selectedLecture.title)}.pdf`;
    const restoreTitle = () => {
      document.title = originalTitle;
      window.removeEventListener('afterprint', restoreTitle);
    };

    document.title = printableTitle;
    window.addEventListener('afterprint', restoreTitle);
    window.print();
    window.setTimeout(restoreTitle, 1000);
  };

  const openResumeLecture = () => {
    if (resumeLecture) {
      selectLecture(resumeLecture.id, {
        mode: effectiveDestination.previous?.activeTab as LecturePlayerMode | undefined,
      });
      return;
    }
    if (recommendedLectureRoot) {
      openLectureTopicOverview(recommendedLectureRoot);
    }
  };

  const openTutorials = (queryText?: string) => {
    if (!selectedLecture) {
      return;
    }
    setTutorialLibraryIntent({
      query: queryText ?? selectedLecture.enhancement?.relatedTutorialQueries[0] ?? selectedLecture.title,
      lane: 'all',
      track: 'surgical-path',
    });
    onSectionChange(Section.DIDACTIC_TUTORIALS);
  };
  const openLectureTopicOverview = (majorTopicId: string) => {
    const nextDestination = pushStudyDestination('lectures', {
      kind: 'topic_overview',
      majorTopicId,
    });
    setDestination(nextDestination);
  };

  const openLectureSubtopicOverview = (majorTopicId: string, subtopicId: string) => {
    const nextDestination = pushStudyDestination('lectures', {
      kind: 'subtopic_overview',
      majorTopicId,
      subtopicId,
    });
    setDestination(nextDestination);
  };

  const openReferenceLibrary = (focusTerms?: string[], imageLayerSetId?: string) => {
    if (!selectedLecture) {
      return;
    }
    setReferenceLibraryIntent({
      lectureId: selectedLecture.id,
      title: selectedLecture.title,
      summary: selectedLecture.summary ?? undefined,
      focusTerms: focusTerms ?? selectedLecture.enhancement?.referenceFocusTerms ?? selectedLecture.tags,
      tutorialTopics: selectedLecture.enhancement?.relatedTutorialQueries ?? [],
      imageLayerSetId,
    });
    onSectionChange(Section.REFERENCE_LIBRARY);
  };

  return (
    <>
    <div className="print-hide space-y-8 animate-fade-in">
      {effectiveKind !== 'item_detail' ? (
        <div className="space-y-3">
          {effectiveKind === 'landing' && (
            <>
              <Card>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-3xl">
                    <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Lectures</p>
                    <h2 className="mt-2 font-serif text-2xl font-semibold text-slate-950">Choose a teaching topic</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Open one topic, choose a teaching session, and stay with it until you are ready to switch.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2 text-sm">
                      <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">Current review: Lectures</span>
                      <span className="rounded-full bg-sky-50 px-3 py-1 font-medium text-sky-800">Next: open one topic</span>
                    </div>
                  </div>
                  <div className="grid min-w-[16rem] gap-2 text-sm text-slate-600">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                      <span className="font-semibold text-slate-900">{lectureStudyTree.roots.length}</span> topics
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                      <span className="font-semibold text-slate-900">
                        {resumeLecture ? 'Resume last lecture' : 'Recommended topic'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-5 grid gap-3 lg:grid-cols-2">
                  <button
                    type="button"
                    onClick={openResumeLecture}
                    className="rounded-xl border border-slate-200 bg-white p-5 text-left transition hover:border-sky-300"
                  >
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {resumeLecture ? 'Resume last lecture' : 'Start here'}
                    </div>
                    <div className="mt-3 font-serif text-xl font-semibold text-slate-900">
                      {resumeLecture?.title ?? recommendedLectureRootLabel ?? 'Open a lecture topic'}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {resumeLecture?.summary ?? 'Begin with the recommended topic and move into the first teaching session.'}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (recommendedLectureRoot) {
                        openLectureTopicOverview(recommendedLectureRoot);
                      }
                    }}
                    className="rounded-xl border border-slate-200 bg-white p-5 text-left transition hover:border-sky-300"
                  >
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Browse topics</div>
                    <div className="mt-3 font-serif text-xl font-semibold text-slate-900">
                      Open the topic list
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Pick one topic, then choose a single teaching session inside it.
                    </p>
                  </button>
                </div>
              </Card>
              <Card>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Major topics</p>
                    <h3 className="mt-1 font-serif text-xl font-semibold text-slate-900">Recommended major topics</h3>
                  </div>
                  <p className="text-sm text-slate-600">Pick one topic, then choose a single teaching session inside it.</p>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {lectureStudyTree.roots.slice(0, preferences.focusMode ? 4 : 6).map((root) => (
                    <button
                      key={root.id}
                      type="button"
                      onClick={() => openLectureTopicOverview(root.id)}
                      className="rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-sky-300"
                    >
                      <div className="font-semibold text-slate-900">{root.label}</div>
                      <div className="mt-2 text-sm text-slate-600">
                        {(lectureStudyTree.subtopicsByRoot[root.id] ?? []).length} teaching sets
                      </div>
                      <div className="mt-3 text-sm font-semibold text-sky-700">Open review set</div>
                    </button>
                  ))}
                </div>
              </Card>
            </>
          )}

          {effectiveKind === 'topic_overview' && activeLectureRoot && (
            <>
              <Card>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="max-w-4xl">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Major topic</p>
                    <h2 className="mt-2 font-serif text-2xl font-semibold text-slate-950">{activeLectureRoot}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Confirm the scope, then choose the next review set in this topic.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2 text-sm">
                      <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                        Scope: {activeLectureSubtopics[0]?.label ?? activeLectureRecords[0]?.title ?? activeLectureRoot}
                      </span>
                      <span className="rounded-full bg-sky-50 px-3 py-1 font-medium text-sky-800">
                        {activeLectureSubtopics.length > 0 ? 'Next: open the first review set' : 'Next: open the first lecture'}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {(activeLectureSubtopics[0] || activeLectureRecords[0]) && (
                      <button
                        type="button"
                        onClick={() =>
                          activeLectureSubtopics[0]
                            ? openLectureSubtopicOverview(activeLectureRoot, activeLectureSubtopics[0].id)
                            : activeLectureRecords[0] &&
                              selectLecture(activeLectureRecords[0].id, {
                                mode: 'overview',
                                initialLayerSetId: getInteractivePromotedLecture(activeLectureRecords[0].id)?.tissueLayerSets[0]?.id,
                              })
                        }
                        className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                      >
                        {activeLectureSubtopics[0] ? `Open ${activeLectureSubtopics[0].label}` : `Open ${activeLectureRecords[0]?.title ?? 'lecture'}`}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={returnToLectureList}
                      className="text-sm font-semibold text-slate-600 transition hover:text-slate-900"
                    >
                      Back to lectures
                    </button>
                  </div>
                </div>
              </Card>
              {activeLectureSubtopics.length > 0 ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  {activeLectureSubtopics.map((subtopic, index) => (
                    <button
                      key={subtopic.id}
                      type="button"
                      onClick={() => openLectureSubtopicOverview(activeLectureRoot, subtopic.id)}
                      className="rounded-xl border border-slate-200 bg-white p-5 text-left transition hover:border-sky-300"
                    >
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {index === 0 ? 'Start here' : 'Review set'}
                      </div>
                      <div className="mt-3 font-serif text-xl font-semibold text-slate-900">{subtopic.label}</div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <Card>
                    <p className="text-slate-700">
                      No smaller review sets are defined for this topic. Choose directly from the lecture list below.
                    </p>
                  </Card>
                  {activeLectureRecords.length === 0 ? (
                    <Card>
                      <p className="text-slate-600">No lectures are currently available for this topic.</p>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {activeLectureRecords.map((lecture, index) => (
                        <button
                          key={lecture.id}
                          type="button"
                          onClick={() =>
                            selectLecture(lecture.id, {
                              mode: 'overview',
                              initialLayerSetId: getInteractivePromotedLecture(lecture.id)?.tissueLayerSets[0]?.id,
                            })
                          }
                          className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-sky-300"
                        >
                          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {index === 0 ? 'Recommended first item' : 'Lecture'}
                          </div>
                          <h3 className="mt-2 font-serif text-lg font-semibold text-slate-900">{lecture.title}</h3>
                          <p className="mt-2 text-sm text-slate-600">{lecture.summary}</p>
                          <div className="mt-2 text-sm font-semibold text-sky-700">Open</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {effectiveKind === 'subtopic_overview' && activeLectureRoot && activeLectureSubtopic && (
            <>
              <Card>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="max-w-4xl">
                    <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Lectures</p>
                    <h2 className="mt-2 font-serif text-2xl font-semibold text-slate-950">{activeLectureSubtopic.label}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {activeLectureRoot} {'>'} {activeLectureSubtopic.label}
                    </p>
                    <p className="mt-3 text-sm text-slate-700">
                      Open the lecture below and work straight through the signout-focused sections.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2 text-sm">
                      <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                        Scope: {activeLectureSubtopicItems[0]?.tags?.slice(0, 4).join(' · ') || activeLectureSubtopicItems[0]?.category || activeLectureSubtopic.label}
                      </span>
                      <span className="rounded-full bg-sky-50 px-3 py-1 font-medium text-sky-800">
                        Next: open the first lecture
                      </span>
                    </div>
                  </div>
                  {activeLectureSubtopicItems[0] && (
                    <button
                      type="button"
                      onClick={() =>
                        selectLecture(activeLectureSubtopicItems[0].id, {
                          mode: 'overview',
                          initialLayerSetId: getInteractivePromotedLecture(activeLectureSubtopicItems[0].id)?.tissueLayerSets[0]?.id,
                        })
                      }
                      className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      Open {activeLectureSubtopicItems[0].title}
                    </button>
                  )}
                </div>
              </Card>
              {activeLectureSubtopicItems.map((lecture) => (
                <button
                  key={lecture.id}
                  type="button"
                  onClick={() =>
                    selectLecture(lecture.id, {
                      mode: 'overview',
                      initialLayerSetId: getInteractivePromotedLecture(lecture.id)?.tissueLayerSets[0]?.id,
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:border-sky-300 hover:shadow-md"
                >
                  <div className="max-w-4xl">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Start here</div>
                    <h3 className="mt-3 font-serif text-xl font-semibold leading-snug text-slate-900">{lecture.title}</h3>
                    <p className="mt-2 text-sm font-medium text-slate-800">
                      Scope: {lecture.tags?.slice(0, 4).join(' · ') || lecture.category || 'General pathology review'}
                    </p>
                    {!preferences.focusMode && lecture.summary && <p className="mt-3 text-sm leading-6 text-slate-600">{lecture.summary}</p>}
                    <div className="mt-2 text-sm font-semibold text-sky-700">Open</div>
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      ) : (
          <div className="space-y-6">
            <Card className="!mb-0">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={returnToLectureList}
                  className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-800"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={exportLecturePdf}
                  aria-label="Export lecture to PDF"
                  className="inline-flex items-center gap-2 rounded-md border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-800 transition hover:border-sky-300 hover:bg-sky-100"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  Export PDF
                </button>
              </div>
              <div className="max-w-5xl">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <span className="text-sky-700">Lectures</span>
                  {selectedLecture.category && (
                    <>
                      <span aria-hidden="true">/</span>
                      <span>{selectedLecture.category}</span>
                    </>
                  )}
                </div>
                <h2 className="mt-2 font-serif text-3xl font-semibold leading-tight text-slate-900">{selectedLecture.title}</h2>
                <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">
                  {selectedLecture.summary ?? 'Start with the main morphologic problem, then move directly into the signout sequence.'}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
                <div className="flex flex-wrap gap-2" aria-label="Lecture sections">
                  {studyPath.map((mode) => {
                    const isActive = activeMode === mode;
                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setActiveMode(mode)}
                        title={modeGuidance[mode]}
                        className={`rounded-md border px-4 py-2 text-sm font-semibold transition ${
                          isActive
                            ? 'border-sky-500 bg-sky-50 text-sky-800'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
                        }`}
                      >
                        {modeLabels[mode]}
                      </button>
                    );
                  })}
                </div>
                {nextLectureMode && (
                  <button
                    type="button"
                    onClick={() => setActiveMode(nextLectureMode)}
                    className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Open {modeLabels[nextLectureMode]}
                  </button>
                )}
              </div>
            </Card>

            {activeMode === 'overview' && (
              <div className="space-y-6">
                <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
                  <div className="grid gap-6 p-5 sm:p-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <SparklesIcon className="h-6 w-6 text-sky-700" />
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Start here</p>
                          <h3 className="mt-1 font-serif text-lg font-semibold text-slate-950">Opening slide</h3>
                        </div>
                      </div>
                      {primaryVisualAid ? (
                        <div className={teachingImageFrameClass}>
                          {renderPrimaryVisual(primaryVisualAid)}
                        </div>
                      ) : (
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
                          Lecture image mapping is still being attached for this opening slide.
                        </div>
                      )}
                    </div>
                    <aside className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Signout brief</div>
                        <p className="mt-2 text-sm leading-6 text-slate-700">
                          {primaryVisualAid?.caption ??
                            'Read the mapped image first, then move directly into the signout sequence below.'}
                        </p>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                        <div className="rounded-md border border-slate-200 bg-white px-3 py-3">
                          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Focus</div>
                          <p className="mt-2 text-sm leading-6 text-slate-700">{lectureScopeLine}</p>
                        </div>
                        {primaryVisualAid?.stain && (
                          <div className="rounded-md border border-slate-200 bg-white px-3 py-3">
                            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Stain</div>
                            <p className="mt-2 text-sm font-semibold text-slate-900">{primaryVisualAid.stain}</p>
                          </div>
                        )}
                      </div>
                      <div className="rounded-md border border-slate-200 bg-white px-3 py-3">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Teaching flow</div>
                        <div className="mt-3 space-y-3">
                          {facultyRunSheet.slice(0, 3).map((item) => (
                            <div key={`${item.time}-${item.title}`} className="border-l-2 border-sky-300 pl-3">
                              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.time}</div>
                              <div className="mt-1 text-sm font-semibold text-slate-950">{item.title}</div>
                              <p className="mt-1 text-sm leading-6 text-slate-700">{item.text}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      {(lecturePitfallPreview ||
                        selectedLecture.quickChecks.length + selectedLecture.flashcards.length + selectedLecture.mcqs.length > 0) && (
                        <div className="flex flex-wrap gap-2">
                          {lecturePitfallPreview && (
                            <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-800">
                              Common trap: {lecturePitfallPreview}
                            </span>
                          )}
                          {selectedLecture.quickChecks.length + selectedLecture.flashcards.length + selectedLecture.mcqs.length > 0 && (
                            <span className="rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-700">
                              Questions later: {selectedLecture.quickChecks.length + selectedLecture.flashcards.length + selectedLecture.mcqs.length}
                            </span>
                          )}
                        </div>
                      )}
                      {nextLectureMode && (
                        <div className="rounded-md border border-slate-200 bg-white px-3 py-3">
                          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Next section</div>
                          <button
                            type="button"
                            onClick={() => setActiveMode(nextLectureMode)}
                            className="mt-3 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                          >
                            Open {modeLabels[nextLectureMode]}
                          </button>
                        </div>
                      )}
                    </aside>
                  </div>
                </section>

                <section className="space-y-4">
                  {selectedLecture.slides.length > 0 && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm" data-testid="lecture-teaching-sequence">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Signout sequence</div>
                      <div className="mt-3 divide-y divide-slate-200">
                        {selectedLecture.slides.map((slide, index) => {
                          const slideRevealId = `${selectedLecture.id}-sequence-${index}`;
                          const isRevealed = Boolean(revealedSlideIds[slideRevealId]);
                          const revealLabel = isRevealed ? 'Hide signout point' : 'Show signout point';
                          const slideVisualAid = getSlideVisualAid(selectedLecture.id, slide);

                          return (
                            <article
                              key={slideRevealId}
                              data-testid={`lecture-slide-step-${index + 1}`}
                              className="grid gap-3 py-4 md:grid-cols-[2.5rem_minmax(0,1fr)]"
                            >
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                                {index + 1}
                              </div>
                              <div className="space-y-3">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                  <div>
                                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                      <span>{slideTypeLabels[slide.type] ?? `Slide ${index + 1}`}</span>
                                      {slideVisualAid?.stain && (
                                        <span className="rounded-full bg-slate-100 px-2 py-0.5 normal-case tracking-normal text-slate-600">
                                          {slideVisualAid.stain}
                                        </span>
                                      )}
                                    </div>
                                    <h4 className="mt-2 font-serif text-xl font-semibold leading-snug text-slate-950">
                                      {slide.title}
                                    </h4>
                                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
                                      {getSlideContextLine(slide, slideVisualAid)}
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    data-testid={`lecture-slide-reveal-${index + 1}`}
                                    aria-expanded={isRevealed}
                                    onClick={() =>
                                      setRevealedSlideIds((current) => ({
                                        ...current,
                                        [slideRevealId]: !current[slideRevealId],
                                      }))
                                    }
                                    className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition ${
                                      isRevealed
                                        ? 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
                                        : 'border-sky-300 bg-sky-50 text-sky-800 hover:bg-sky-100'
                                    }`}
                                  >
                                    {revealLabel}
                                  </button>
                                </div>

                                {slideVisualAid ? (
                                  <div className={teachingImageFrameClass}>
                                    {renderSlideVisualAid({ ...slide, visualAid: slideVisualAid }, {
                                      showCaption: isRevealed,
                                      imageClassName: teachingImageClass,
                                    })}
                                  </div>
                                ) : (
                                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                                    This slide image is still being added.
                                  </div>
                                )}

                                {isRevealed && (
                                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Signout point</div>
                                    {slide.content && <p className="mt-2 text-sm leading-6 text-slate-700">{slide.content}</p>}
                                  </div>
                                )}
                              </div>
                            </article>
                          );
                        })}
                        {entityReviewItems.length > 0 && (
                          <div className="py-5">
                            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Case-by-case review
                            </div>
                            <div className="mt-3 divide-y divide-slate-200">
                              {entityReviewItems.map((item, index) => {
                                const entityStepNumber = selectedLecture.slides.length + index + 1;
                                const entityRevealId = `${selectedLecture.id}-entity-${item.id}`;
                                const isRevealed = Boolean(revealedSlideIds[entityRevealId]);
                                const revealLabel = isRevealed ? 'Hide diagnosis' : 'Show diagnosis';

                                return (
                                  <article
                                    key={entityRevealId}
                                    data-testid={`lecture-entity-step-${index + 1}`}
                                    className="grid gap-3 py-4 md:grid-cols-[2.5rem_minmax(0,1fr)]"
                                  >
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                                      {entityStepNumber}
                                    </div>
                                    <div className="space-y-3">
                                      <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            <span>Case {index + 1}</span>
                                            <span className="rounded-full bg-slate-100 px-2 py-0.5 normal-case tracking-normal text-slate-600">
                                              {item.category}
                                            </span>
                                            {item.family && (
                                              <span className="rounded-full bg-slate-100 px-2 py-0.5 normal-case tracking-normal text-slate-600">
                                                {item.family}
                                              </span>
                                            )}
                                          </div>
                                          <h4 className="mt-2 font-serif text-xl font-semibold leading-snug text-slate-950">
                                            {item.entity}
                                          </h4>
                                          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
                                            {getEntityContextLine(item)}
                                          </p>
                                          {item.differentials.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-2">
                                              {item.differentials.slice(0, 3).map((differential) => (
                                                <span
                                                  key={`${item.id}-preview-dx-${differential}`}
                                                  className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                                                >
                                                  {differential}
                                                </span>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                        <button
                                          type="button"
                                          data-testid={`lecture-entity-reveal-${index + 1}`}
                                          aria-expanded={isRevealed}
                                          onClick={() =>
                                            setRevealedSlideIds((current) => ({
                                              ...current,
                                              [entityRevealId]: !current[entityRevealId],
                                            }))
                                          }
                                          className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition ${
                                            isRevealed
                                              ? 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
                                              : 'border-sky-300 bg-sky-50 text-sky-800 hover:bg-sky-100'
                                          }`}
                                        >
                                          {revealLabel}
                                        </button>
                                      </div>

                                      {item.visualAids.length > 0 ? (
                                        <div className="grid gap-3">
                                          {item.visualAids.map((aid) => (
                                            <div key={`${item.id}-teaching-${aid.imageUrl}`} className={teachingImageFrameClass}>
                                              {renderDescriptorVisualAid(aid, item.entity, {
                                                showCaption: isRevealed,
                                                imageClassName: teachingImageClass,
                                              })}
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                                          This case image is still being added.
                                        </div>
                                      )}

                                      {isRevealed && (
                                        <div className="rounded-lg border border-slate-200 bg-white p-4">
                                          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            <span>{item.category}</span>
                                            {item.family && (
                                              <span className="rounded-full bg-slate-100 px-2 py-0.5 normal-case tracking-normal text-slate-600">
                                                {item.family}
                                              </span>
                                            )}
                                          </div>
                                          <h4 className="mt-2 font-serif text-xl font-semibold leading-snug text-slate-950">
                                            {item.entity}
                                          </h4>
                                          {item.summary && <p className="mt-2 text-sm leading-6 text-slate-700">{item.summary}</p>}
                                          <div className="mt-4 grid gap-4 text-sm text-slate-700 md:grid-cols-2">
                                            <div>
                                              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Microscopic findings</div>
                                              <ul className="mt-2 space-y-1.5">
                                                {item.morphology.map((finding) => (
                                                  <li key={`${item.id}-teaching-morph-${finding}`}>• {finding}</li>
                                                ))}
                                              </ul>
                                            </div>
                                            <div>
                                              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ancillary studies</div>
                                              <ul className="mt-2 space-y-1.5">
                                                {item.ancillary.map((study) => (
                                                  <li key={`${item.id}-teaching-ancillary-${study}`}>• {study}</li>
                                                ))}
                                              </ul>
                                            </div>
                                          </div>
                                          {item.differentials.length > 0 && (
                                            <div className="mt-3 flex flex-wrap gap-2">
                                              {item.differentials.map((differential) => (
                                                <span
                                                  key={`${item.id}-teaching-dx-${differential}`}
                                                  className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                                                >
                                                  {differential}
                                                </span>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </article>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {entityCategoryCounts.length > 0 && (
                    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Related diagnostic groups</div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {entityCategoryCounts.map((item) => (
                          <span
                            key={`coverage-${item.category}`}
                            className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700"
                          >
                            {item.category} ({item.count})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              </div>
            )}

            {activeMode === 'algorithm' && selectedLecture.algorithms.length > 0 && (
              <div className="space-y-6">
                {selectedLecture.algorithms.map((algorithm) => (
                  <LectureAlgorithmPlayer
                    key={algorithm.id}
                    algorithm={algorithm}
                    entityCards={selectedLecture.entityCards}
                    initialNodeId={initialNodeId}
                    onOpenTutorial={openTutorials}
                    onOpenReference={(terms) => openReferenceLibrary(terms)}
                    onComplete={(algorithmId) =>
                      persistProgress(selectedLecture.id, (current) => ({
                        ...current,
                        completedAlgorithms: current.completedAlgorithms.includes(algorithmId)
                          ? current.completedAlgorithms
                          : [...current.completedAlgorithms, algorithmId],
                        completedModes: current.completedModes.includes('algorithm')
                          ? current.completedModes
                          : [...current.completedModes, 'algorithm'],
                      }))
                    }
                  />
                ))}
              </div>
            )}

            {activeMode === 'tissue' && selectedLecture.tissueLayerSets.length > 0 && (
              <LectureTissueLayers
                layerSets={selectedLecture.tissueLayerSets}
                focusMode={preferences.focusMode}
                initialLayerSetId={initialLayerSetId}
                onComplete={(layerSetId) =>
                  persistProgress(selectedLecture.id, (current) => ({
                    ...current,
                    completedLayerSets: current.completedLayerSets.includes(layerSetId)
                      ? current.completedLayerSets
                      : [...current.completedLayerSets, layerSetId],
                    completedModes: current.completedModes.includes('tissue')
                      ? current.completedModes
                      : [...current.completedModes, 'tissue'],
                  }))
                }
              />
            )}

            {activeMode === 'knowledge' && (
              <LectureKnowledgePack
                entityCards={selectedLecture.entityCards}
                pitfalls={selectedLecture.enhancement?.pitfalls ?? []}
                focusMode={preferences.focusMode}
              />
            )}

            {activeMode === 'check' && (
              <LectureQuickCheckPanel
                checks={selectedLecture.quickChecks}
                flashcards={selectedLecture.flashcards}
                extraMcqs={selectedLecture.mcqs}
                onComplete={(checkId) =>
                  persistProgress(selectedLecture.id, (current) => ({
                    ...current,
                    completedChecks: current.completedChecks.includes(checkId)
                      ? current.completedChecks
                      : [...current.completedChecks, checkId],
                    completedModes: current.completedModes.includes('check')
                      ? current.completedModes
                      : [...current.completedModes, 'check'],
                  }))
                }
              />
            )}

            {activeMode === 'transcript' && (
              <Card>
                <h3 className="mb-4 flex items-center text-xl font-semibold font-serif text-slate-900">
                  <DocumentTextIcon className="mr-3 h-6 w-6 text-sky-600" />
                  Teaching Text
                </h3>
                <StructuredTeachingContent content={selectedLecture.body} compact />
                {lectureBodySections.length > 0 && (
                  <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Section guide</div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {lectureBodySections.slice(0, 10).map((section, index) => (
                        <span
                          key={section.id}
                          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700"
                        >
                          {index + 1}. {section.title}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )}

          </div>
      )}
    </div>
    {selectedLecture && (
      <LecturePrintDocument
        lecture={selectedLecture}
        learningTargets={learningTargets}
        facultyRunSheet={facultyRunSheet}
        lectureMetrics={lectureMetrics}
        entityCategoryCounts={entityCategoryCounts}
        entityReviewItems={entityReviewItems}
      />
    )}
    </>
  );
};

export default DidacticLectures;
