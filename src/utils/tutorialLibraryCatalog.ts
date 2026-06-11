import boardPrepTutorialsUrl from '../content/tutorials/tutorials.normalized.json?url';
import downloadsTutorialsUrl from '../content/downloads_imports/normalized/tutorials.normalized.json?url';
import clinicalPathInteractiveTutorialsUrl from '../content/tutorials/clinicalPathInteractiveTutorials.json?url';
import tutorialAbpathSpecCrosswalkUrl from '../content/tutorials/tutorialAbpathSpecCrosswalk.json?url';
import validatedMappingsManifestUrl from '../content/tutorials/validatedMappingsManifest.json?url';
import type {
  CPGovernanceContract,
  StoredImage,
  TutorialAbpathScope,
  ValidatedMappingManifestRow,
  ValidatedMappingsManifest,
} from '../types.ts';
import { resolveExactClinicalPathScope } from './clinicalPathAbpathScope.ts';
import { surgicalPathCurriculumModules } from '../content/curriculum/surgicalPathCurriculum.ts';
import { getCuratedAtlasImages } from '../../utils/curatedHistologyAtlas.ts';
import { getPromotedGranulomatousAtlasImages } from '../../utils/promotedGranulomatousAtlas.ts';
import { getContentNamespaceLabel, type ContentNamespace } from './contentNamespaces.ts';

export type TutorialLane = 'board-prep' | 'core-patterns' | 'granuloma' | 'lab-studio' | 'mixed';
export type TutorialTrack = 'surgical-path' | 'clinical-path' | 'cross-cutting';
export type TutorialPromotionState = ContentNamespace;

export interface TutorialMCQ {
  question: string;
  choices: string[];
  answer: string;
  rationale?: string;
}

export interface TutorialFlashcard {
  front: string;
  back: string;
  tag?: string;
}

export interface TutorialInteractiveAsset {
  id: string;
  title: string;
  path: string;
  summary: string;
}

export interface TutorialMappedImageAsset {
  id: string;
  title: string;
  src: string;
  description: string;
  sourceUrl?: string;
  atlasCollection?: StoredImage['atlasCollection'];
}

export interface TutorialMappedImageSupport {
  imageQuery?: string;
  moduleTitles: string[];
  images: TutorialMappedImageAsset[];
}

export interface TutorialSourceTruth {
  statusLabel: string;
  sourceDecision: string;
  reviewRule: string;
  reviewer: string;
}

export interface DidacticTutorialRecord {
  id: string;
  title: string;
  summary: string;
  body: string;
  lane: TutorialLane;
  laneLabel: string;
  track: TutorialTrack;
  trackLabel: string;
  promotionState: TutorialPromotionState;
  promotionLabel: string;
  sourceRepo: string;
  sourceLabel: string;
  topicChips: string[];
  tags: string[];
  mcqCount: number;
  flashcardCount: number;
  category?: string;
  mcqs: TutorialMCQ[];
  flashcards: TutorialFlashcard[];
  interactiveAssets?: TutorialInteractiveAsset[];
  mappedImageSupport?: TutorialMappedImageSupport;
  cpGovernance?: CPGovernanceContract;
  abpathScope?: TutorialAbpathScope;
  sourceTruth?: TutorialSourceTruth;
}

export interface TutorialTopicScope {
  id: string;
  label: string;
  root: string;
}

export interface TutorialLibraryParityBaseline {
  totalTutorials: number;
  byTrack: Record<TutorialTrack, number>;
  clinicalPathInteractiveTutorials: {
    totalTutorials: number;
    interactiveAssetCount: number;
    rootTopicCount: number;
  };
}

const arraysMatchExactly = (left: string[], right: string[]) =>
  left.length === right.length && left.every((value, index) => value === right[index]);

const normalizeTutorialLookupTerm = (value: string) =>
  value
    .toLowerCase()
    .replace(/^case tutorial:\s*/g, '')
    .replace(/: a case tutorial$/g, '')
    .replace(/\(itp\)/g, 'itp')
    .replace(/\(cci\)/g, 'cci')
    .replace(/[^\w\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const validateDidacticGovernanceManifest = (manifest: ValidatedMappingsManifest) => {
  const canonicalRows = manifest.rows.filter((row) => row.canonicalForId);
  const validatedRows = canonicalRows.filter((row) => row.validatedForPromotion);
  const governancePendingRows = canonicalRows.filter((row) => row.governancePending);
  const validatedKeys = validatedRows.map((row) => row.key);
  const validatedIds = validatedRows.map((row) => row.id);
  const blockedKeys = governancePendingRows.map((row) => row.key);
  const blockedIds = governancePendingRows.map((row) => row.id);
  const summary = manifest.summary;

  const manifestIsConsistent =
    arraysMatchExactly(manifest.tutorialKeysValidated, validatedKeys) &&
    arraysMatchExactly(manifest.tutorialIdsValidated, validatedIds) &&
    arraysMatchExactly(manifest.blockedTutorialKeys, blockedKeys) &&
    arraysMatchExactly(manifest.blockedTutorialIds, blockedIds) &&
    summary?.totalRows === manifest.rows.length &&
    summary?.canonicalRowCount === canonicalRows.length &&
    summary?.validatedRowCount === validatedRows.length &&
    summary?.governancePendingRowCount === governancePendingRows.length &&
    summary?.excludedRowCount === canonicalRows.filter((row) => row.promotionStatus === 'excluded').length;

  if (!manifestIsConsistent) {
    throw new Error('Didactic governance manifest drift detected: runtime manifest no longer matches canonical row-derived invariants.');
  }

  return manifest;
};

type RawTutorialRecord = {
  id: string;
  title: string;
  summary?: string;
  body?: string;
  sourceRepo?: string;
  tags?: string[];
  mcqs?: TutorialMCQ[];
  flashcards?: TutorialFlashcard[];
  category?: string;
  lane?: TutorialLane;
  track?: TutorialTrack;
  promotionState?: TutorialPromotionState;
  sourceLabel?: string;
  interactiveAssets?: TutorialInteractiveAsset[];
  cpGovernance?: CPGovernanceContract;
  __catalogFile?: string;
};

const laneConfig: Record<TutorialLane, { label: string }> = {
  'board-prep': { label: 'Board Prep Tutorials' },
  'core-patterns': { label: 'Core Pattern Tutorials' },
  granuloma: { label: 'Granuloma Tutorials' },
  'lab-studio': { label: 'Clinical Pathology' },
  mixed: { label: 'Tutorial Library' },
};

const trackConfig: Record<TutorialTrack, { label: string }> = {
  'surgical-path': { label: 'Surgical Pathology' },
  'clinical-path': { label: 'Clinical Pathology' },
  'cross-cutting': { label: 'Cross-Cutting' },
};

const promotionConfig: Record<TutorialPromotionState, { label: string }> = {
  canonical: { label: getContentNamespaceLabel('canonical') },
  staged: { label: getContentNamespaceLabel('staged') },
};

const atlasImagesById = new Map(
  [...getCuratedAtlasImages(), ...getPromotedGranulomatousAtlasImages()].map((image) => [image.id, image] as const)
);

const tutorialMappedImageSupportById = (() => {
  const supportByTutorialId = new Map<string, TutorialMappedImageSupport>();

  surgicalPathCurriculumModules.forEach((module) => {
    if (module.linkedTutorialIds.length === 0 || module.linkedImageIds.length === 0) {
      return;
    }

    const mappedImages = module.linkedImageIds
      .map((imageId) => atlasImagesById.get(imageId))
      .filter((image): image is StoredImage => Boolean(image))
      .map((image) => ({
        id: image.id,
        title: image.title,
        src: image.src,
        description: image.description,
        sourceUrl: image.sourceUrl,
        atlasCollection: image.atlasCollection,
      }));

    if (mappedImages.length === 0) {
      return;
    }

    module.linkedTutorialIds.forEach((tutorialId) => {
      const existing = supportByTutorialId.get(tutorialId);
      const existingTitles = new Set(existing?.moduleTitles ?? []);
      const existingImages = new Set(existing?.images.map((image) => image.id) ?? []);
      supportByTutorialId.set(tutorialId, {
        imageQuery: existing?.imageQuery ?? module.navigationIntents?.images?.query,
        moduleTitles: existingTitles.has(module.title)
          ? Array.from(existingTitles)
          : [...existingTitles, module.title],
        images: [
          ...(existing?.images ?? []),
          ...mappedImages.filter((image) => !existingImages.has(image.id)),
        ],
      });
    });
  });

  return supportByTutorialId;
})();

export const getTutorialMappedImageSupport = (tutorialId: string) => tutorialMappedImageSupportById.get(tutorialId);

const CLINICAL_PATH_KEYWORDS = [
  'abnormal coagulation',
  'analytical technique',
  'antibody screen',
  'antimicrobial',
  'apheresis',
  'bacteriology',
  'blood bank',
  'blood banking',
  'blood donor',
  'blood donors',
  'blood gas',
  'blood gases',
  'blood group',
  'blood product',
  'blood products',
  'carbohydrate blood groups',
  'chemical pathology',
  'transfusion',
  'clinical chemistry',
  'chemistry',
  'clia',
  'microbiology',
  'coagulation',
  'coagulopathy',
  'compatibility testing',
  'component processing',
  'cryopreservation',
  'cytapheresis',
  'dat',
  'delta check',
  'donor eligibility',
  'drugs of abuse',
  'electrochemistry',
  'electrolytes',
  'electrophoresis',
  'ffp',
  'gram negative',
  'gram positive',
  'hla',
  'immunoassay',
  'laboratory management',
  'laboratory medicine',
  'laboratory safety',
  'mass spectrometry',
  'medical microbiology',
  'mycobacteria',
  'mycology',
  'parasitology',
  'platelet',
  'plasma components',
  'quality assurance',
  'quality control',
  'reference intervals',
  'rhig',
  'serum protein electrophoresis',
  'laboratory',
  'clinical pathology',
  'serology',
  'spectrophotometry',
  'therapeutic drug monitoring',
  'toxicology',
  'trali',
  'taco',
  'virology',
];

const CROSS_CUTTING_KEYWORDS = [
  'acute leukemia',
  'acute leukemias',
  'benign hematology',
  'hematopathology',
  'hematopoietic',
  'hemoglobinopathy',
  'histiocytic',
  'lymphoma',
  'leukemia',
  'myelodysplastic',
  'myeloproliferative',
  'bone marrow',
  'plasma cell neoplasm',
  'plasma cell neoplasms',
  'sickle cell',
];

const SURGICAL_PATH_KEYWORDS = [
  'ap:',
  'adenocarcinoma',
  'adipocytic',
  'adrenal',
  'breast',
  'cardiovascular',
  'carcinoma',
  'cervix',
  'cholangiocarcinoma',
  'cytopathology',
  'dermatopathology',
  'endocrine',
  'esophagus',
  'forensic',
  'glial',
  'glioblastoma',
  'glioma',
  'gyn',
  'gynecologic',
  'renal',
  'testicular',
  'lung',
  'gi',
  'gastrointestinal',
  'bladder',
  'pancreas',
  'thyroid',
  'soft tissue',
  'bone',
  'histology',
  'neuropathology',
  'ovary',
  'placenta',
  'prostate',
  'salivary',
  'sarcoidosis',
  'granuloma',
];

const inferLane = (record: RawTutorialRecord): TutorialLane => {
  if (record.lane) {
    return record.lane;
  }
  if (record.sourceRepo === 'board_prep') {
    return 'board-prep';
  }
  if (record.sourceRepo === 'ioc-next-app') {
    return 'core-patterns';
  }
  if ((record.category || '').toLowerCase().includes('granulomatous')) {
    return 'granuloma';
  }
  return 'mixed';
};

const inferTrack = (record: RawTutorialRecord): TutorialTrack => {
  if (record.track) {
    return record.track;
  }
  const sourceRepo = (record.sourceRepo || '').toLowerCase();
  const id = record.id.toLowerCase();
  const text = [record.title, record.summary, record.body?.slice(0, 2200), record.category, ...(record.tags || [])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (sourceRepo.includes('cp-content-specification')) {
    return /^topic-hp\b/.test(id) ? 'cross-cutting' : 'clinical-path';
  }
  const clinicalHits = CLINICAL_PATH_KEYWORDS.filter((keyword) => text.includes(keyword)).length + (/^topic-(bb|cp|mb)\b/.test(id) ? 3 : 0);
  const crossCuttingHits = CROSS_CUTTING_KEYWORDS.filter((keyword) => text.includes(keyword)).length + (/^topic-hp\b/.test(id) ? 3 : 0);
  const surgicalHits = SURGICAL_PATH_KEYWORDS.filter((keyword) => text.includes(keyword)).length + (/^topic-ap\b/.test(id) ? 3 : 0);

  if (clinicalHits > 0 && clinicalHits >= crossCuttingHits && clinicalHits >= surgicalHits) {
    return 'clinical-path';
  }
  if (crossCuttingHits > 0 && crossCuttingHits >= surgicalHits) {
    return 'cross-cutting';
  }
  if (sourceRepo.includes('granulomatous') || surgicalHits > 0) {
    return 'surgical-path';
  }
  return 'surgical-path';
};

const inferPromotionState = (record: RawTutorialRecord): TutorialPromotionState =>
  record.promotionState || (record.sourceRepo === 'board_prep' ? 'canonical' : 'staged');

const toSourceLabel = (sourceRepo?: string, explicitSourceLabel?: string) => {
  if (explicitSourceLabel) {
    return explicitSourceLabel;
  }
  if (!sourceRepo) {
    return 'Unknown source';
  }
  if (sourceRepo === 'board_prep') {
    return 'Board Prep Library';
  }
  if (sourceRepo === 'ioc-next-app') {
    return 'Pattern Tutorial Imports';
  }
  if (sourceRepo.includes('cp-content-specification')) {
    return 'CP Content Specifications';
  }
  if (sourceRepo.includes('granulomatous')) {
    return 'Granulomatous Module Imports';
  }
  if (sourceRepo.includes('abpath-advanced-board-prep-platform')) {
    return 'ABPath Board Prep Imports';
  }
  return sourceRepo;
};

type CrosswalkPrimaryMapping = {
  domain: 'AP' | 'CP';
  root: string;
  path: string[];
  title: string;
  confidence: 'high' | 'medium' | 'low';
  sourceLine?: number | null;
};

type CrosswalkEntry = {
  tutorial: {
    key: string;
    id: string;
    file: string;
  };
  primaryMapping: CrosswalkPrimaryMapping;
};

type CrosswalkDataset = {
  crosswalk?: CrosswalkEntry[];
};

interface DidacticTutorialGovernanceManifest extends ValidatedMappingsManifest {
  rowsById: Record<string, ValidatedMappingManifestRow>;
  rowsByKey: Record<string, ValidatedMappingManifestRow>;
}

export interface DidacticTutorialCatalog {
  tutorials: DidacticTutorialRecord[];
  governanceManifest: DidacticTutorialGovernanceManifest;
}

const toAbpathScope = (mapping?: CrosswalkPrimaryMapping | null): TutorialAbpathScope | undefined => {
  if (!mapping) {
    return undefined;
  }
  const publicRoot = resolvePublicAbpathRoot(mapping.root, mapping.path);

  return {
    domain: mapping.domain,
    root: publicRoot,
    primaryPath: mapping.path.join(' > '),
    title: mapping.title,
    confidence: mapping.confidence,
    source: mapping.domain === 'CP'
      ? 'ABPath Clinical Pathology Content Specifications 04/10/2026'
      : 'ABPath Anatomic Pathology Content Specifications',
    sourceLine: mapping.sourceLine ?? null,
  };
};

export const toAbpathScopeFromManifestRow = (row?: ValidatedMappingManifestRow | null): TutorialAbpathScope | undefined => {
  if (!row?.abpathRoot || !row.abpathPrimaryPath) {
    return undefined;
  }
  const publicRoot = resolvePublicAbpathRoot(row.abpathRoot, row.abpathPrimaryPath.split(' > '));

  return {
    domain: row.abpathDomain,
    root: publicRoot,
    primaryPath: row.abpathPrimaryPath,
    title: row.abpathPrimaryPath.split(' > ').at(-1) || row.abpathRoot,
    confidence:
      row.abpathAnchorConfidence === 'moderate'
        ? 'medium'
        : row.abpathAnchorConfidence === 'high'
          ? 'high'
          : 'low',
    source:
      row.abpathDomain === 'CP'
        ? row.abpathSpecVersion
          ? `ABPath Clinical Pathology Content Specifications ${row.abpathSpecVersion.replaceAll('_', '/')}`
          : 'ABPath Clinical Pathology Content Specifications'
        : 'ABPath Anatomic Pathology Content Specifications',
    sourceLine: null,
  };
};

const resolvePublicAbpathRoot = (root: string, pathSegments: string[]) => {
  const normalizedSegments = pathSegments.map((segment) => segment.trim()).filter(Boolean);
  const secondSegment = normalizedSegments[1];

  if (root === 'Breast' && secondSegment === 'Lung Primary') {
    return 'Lung Primary';
  }

  return root;
};

const buildTopicChips = (
  record: RawTutorialRecord,
  track: TutorialTrack,
  abpathScope?: TutorialAbpathScope
) => {
  const abpathSegments = abpathScope?.primaryPath.split(' > ') ?? [];
  const abpathLeaf = abpathSegments.at(-1) ?? '';
  const abpathBranch = abpathSegments.length > 2 ? abpathSegments.at(-2) ?? '' : '';
  return Array.from(
    new Set(
      [
        abpathScope?.root || trackConfig[track].label,
        abpathLeaf && abpathLeaf !== abpathScope?.root ? abpathLeaf : '',
        abpathBranch && abpathBranch !== abpathScope?.root ? abpathBranch : '',
        record.category || '',
        ...(record.tags || []).slice(0, 4),
      ].filter(Boolean)
    )
  ).slice(0, 6);
};

const normalizeTutorial = (
  record: RawTutorialRecord,
  crosswalkByKey: Map<string, CrosswalkPrimaryMapping>,
  manifestRow?: ValidatedMappingManifestRow
): DidacticTutorialRecord => {
  const lane = inferLane(record);
  const track = inferTrack(record);
  const promotionState = inferPromotionState(record);
  const crosswalkKey = `${record.__catalogFile || ''}::${record.id}`;
  const exactCpScope = track === 'clinical-path' ? resolveExactClinicalPathScope(record) : undefined;
  const manifestScope = toAbpathScopeFromManifestRow(manifestRow);
  const abpathScope = manifestScope ?? exactCpScope ?? toAbpathScope(crosswalkByKey.get(crosswalkKey));
  const sourceTruth = manifestRow?.validatedForPromotion && manifestRow.abpathRoot && manifestRow.abpathPrimaryPath
    ? {
        statusLabel: manifestRow.abpathReviewStatus === 'confirmed' ? 'Reviewed source decision' : 'Source decision under review',
        sourceDecision: `Study this lesson under ${manifestRow.abpathDomain} truth: ${manifestRow.abpathPrimaryPath}.`,
        reviewRule: manifestRow.reviewAction || 'Keep this lesson tied to its reviewed ABPath source decision before promotion.',
        reviewer: manifestRow.reviewOwner || 'Didactics governance review',
      }
    : undefined;
  return {
    id: record.id,
    title: record.title,
    summary: record.summary || record.title,
    body: record.body || '',
    lane,
    laneLabel: abpathScope?.root || laneConfig[lane].label,
    track,
    trackLabel: trackConfig[track].label,
    promotionState,
    promotionLabel: promotionConfig[promotionState].label,
    sourceRepo: record.sourceRepo || 'unknown',
    sourceLabel: toSourceLabel(record.sourceRepo, record.sourceLabel),
    topicChips: buildTopicChips(record, track, abpathScope),
    tags: record.tags || [],
    mcqCount: record.mcqs?.length || 0,
    flashcardCount: record.flashcards?.length || 0,
    category: record.category || undefined,
    mcqs: record.mcqs || [],
    flashcards: record.flashcards || [],
    interactiveAssets: record.interactiveAssets,
    mappedImageSupport: tutorialMappedImageSupportById.get(record.id),
    cpGovernance: record.cpGovernance,
    abpathScope,
    sourceTruth,
  };
};

export const loadDidacticTutorials = async (): Promise<DidacticTutorialRecord[]> => {
  const catalog = await loadDidacticTutorialCatalog();
  return catalog.tutorials;
};

export const loadDidacticTutorialGovernanceManifest = async (): Promise<DidacticTutorialGovernanceManifest> => {
  const response = await fetch(validatedMappingsManifestUrl);
  const manifest = validateDidacticGovernanceManifest((await response.json()) as ValidatedMappingsManifest);
  return {
    ...manifest,
    rowsById: Object.fromEntries(
      manifest.rows
        .filter((row) => row.canonicalForId || row.governancePending)
        .map((row) => [row.id, row])
    ),
    rowsByKey: Object.fromEntries(manifest.rows.map((row) => [row.key, row])),
  };
};

export const loadDidacticTutorialCatalog = async (): Promise<DidacticTutorialCatalog> => {
  const [boardPrepResponse, downloadsResponse, interactiveResponse, crosswalkResponse, manifestResponse] = await Promise.all([
    fetch(boardPrepTutorialsUrl),
    fetch(downloadsTutorialsUrl),
    fetch(clinicalPathInteractiveTutorialsUrl),
    fetch(tutorialAbpathSpecCrosswalkUrl),
    fetch(validatedMappingsManifestUrl),
  ]);
  const [boardPrepData, downloadsData, interactiveData, crosswalkData, manifestData] = await Promise.all([
    boardPrepResponse.json() as Promise<RawTutorialRecord[]>,
    downloadsResponse.json() as Promise<RawTutorialRecord[]>,
    interactiveResponse.json() as Promise<RawTutorialRecord[]>,
    crosswalkResponse.json() as Promise<CrosswalkDataset>,
    manifestResponse.json() as Promise<ValidatedMappingsManifest>,
  ]);
  const hardenedManifest = validateDidacticGovernanceManifest(manifestData);
  const governanceManifest: DidacticTutorialGovernanceManifest = {
    ...hardenedManifest,
    rowsById: Object.fromEntries(
      hardenedManifest.rows
        .filter((row) => row.canonicalForId || row.governancePending)
        .map((row) => [row.id, row])
    ),
    rowsByKey: Object.fromEntries(hardenedManifest.rows.map((row) => [row.key, row])),
  };
  const validatedKeys = new Set(governanceManifest.tutorialKeysValidated);
  const crosswalkByKey = new Map(
    (crosswalkData.crosswalk || []).map((entry) => [`${entry.tutorial.file}::${entry.tutorial.id}`, entry.primaryMapping] as const)
  );
  const tutorials = [
    ...interactiveData.map((record) => ({ ...record, __catalogFile: 'src/content/tutorials/clinicalPathInteractiveTutorials.json' })),
    ...boardPrepData.map((record) => ({ ...record, __catalogFile: 'src/content/tutorials/tutorials.normalized.json' })),
    ...downloadsData.map((record) => ({ ...record, __catalogFile: 'src/content/downloads_imports/normalized/tutorials.normalized.json' })),
  ]
    .filter((record) => {
      const recordKey = `${record.__catalogFile || ''}::${record.id}`;
      if (!validatedKeys.has(recordKey)) {
        return false;
      }
      const manifestRow = governanceManifest.rowsByKey[recordKey];
      return Boolean(manifestRow?.validatedForPromotion && manifestRow.abpathRoot && manifestRow.abpathPrimaryPath);
    })
    .map((record) =>
      normalizeTutorial(
        record,
        crosswalkByKey,
        governanceManifest.rowsByKey[`${record.__catalogFile || ''}::${record.id}`]
      )
    )
    .sort((left, right) => {
      const leftRoot = left.abpathScope?.root || '';
      const rightRoot = right.abpathScope?.root || '';
      if (leftRoot !== rightRoot) {
        return leftRoot.localeCompare(rightRoot);
      }
      if (left.track !== right.track) {
        return left.track.localeCompare(right.track);
      }
      return left.title.localeCompare(right.title);
    });

  return {
    tutorials,
    governanceManifest,
  };
};

export const getDidacticTutorialById = (tutorials: DidacticTutorialRecord[], id?: string | null) =>
  tutorials.find((tutorial) => tutorial.id === id);

export const getGovernancePendingTutorial = (
  governanceManifest: Pick<DidacticTutorialGovernanceManifest, 'rowsById'>,
  id?: string | null
) => {
  if (!id) {
    return undefined;
  }
  const row = governanceManifest.rowsById[id];
  return row?.governancePending ? row : undefined;
};

export const loadTutorialRootTopics = async (): Promise<string[]> => {
  const tutorials = await loadDidacticTutorials();
  const roots = tutorials
    .map((tutorial) => tutorial.abpathScope?.root)
    .filter(Boolean) as string[];
  return Array.from(new Set(roots)).sort((left, right) => left.localeCompare(right));
};

export const deriveTutorialSubtopic = (tutorial: DidacticTutorialRecord): TutorialTopicScope | null => {
  const root = tutorial.abpathScope?.root;
  const primaryPath = tutorial.abpathScope?.primaryPath;
  if (!root || !primaryPath) {
    return null;
  }

  const segments = primaryPath.split(' > ').map((segment) => segment.trim()).filter(Boolean);
  const rootIndex = segments.findIndex((segment) => segment === root);
  const descendantSegments = rootIndex >= 0 ? segments.slice(rootIndex + 1) : segments.slice(1);
  const label = descendantSegments[0] || segments.at(-1);

  if (!label || label === root) {
    return null;
  }

  return {
    id: label,
    label,
    root,
  };
};

export const loadTutorialSubtopicsByRoot = async (): Promise<Record<string, TutorialTopicScope[]>> => {
  const tutorials = await loadDidacticTutorials();
  const grouped = tutorials.reduce<Record<string, Map<string, TutorialTopicScope>>>((accumulator, tutorial) => {
    const scope = deriveTutorialSubtopic(tutorial);
    if (!scope) {
      return accumulator;
    }
    accumulator[scope.root] ||= new Map<string, TutorialTopicScope>();
    accumulator[scope.root].set(scope.id, scope);
    return accumulator;
  }, {});

  return Object.fromEntries(
    Object.entries(grouped).map(([root, scopeMap]) => [
      root,
      Array.from(scopeMap.values()).sort((left, right) => left.label.localeCompare(right.label)),
    ])
  );
};

type TutorialMatchFilters = {
  track?: TutorialTrack | 'all';
  lane?: TutorialLane | 'all';
};

export const findBestTutorialMatch = (
  tutorials: DidacticTutorialRecord[],
  terms: string[],
  filters: TutorialMatchFilters = {}
): DidacticTutorialRecord | undefined => {
  const trackFilter = filters.track ?? 'all';
  const laneFilter = filters.lane ?? 'all';
  const filterScope = tutorials.filter(
    (tutorial) => (trackFilter === 'all' || tutorial.track === trackFilter) && (laneFilter === 'all' || tutorial.lane === laneFilter)
  );
  const searchableTutorials = filterScope.length > 0 ? filterScope : tutorials;

  const normalizedTerms = terms
    .map((term) => normalizeTutorialLookupTerm(term))
    .filter(Boolean);

  if (normalizedTerms.length === 0) {
    return searchableTutorials[0];
  }

  let bestMatch: DidacticTutorialRecord | undefined;
  let bestScore = -1;

  for (const tutorial of searchableTutorials) {
    const normalizedTitle = normalizeTutorialLookupTerm(tutorial.title);
    const normalizedCategory = normalizeTutorialLookupTerm(tutorial.category || '');
    const normalizedTags = tutorial.tags.map((tag) => normalizeTutorialLookupTerm(tag));
    const haystack = [
      tutorial.title,
      tutorial.summary,
      tutorial.body.slice(0, 1200),
      tutorial.category || '',
      ...tutorial.tags,
    ]
      .join(' ')
      .toLowerCase();
    const normalizedHaystack = normalizeTutorialLookupTerm(haystack);

    const score = normalizedTerms.reduce((total, term) => {
      if (normalizedTitle === term) {
        return total + 10;
      }
      if (normalizedTitle.includes(term)) {
        return total + 6;
      }
      if (normalizedCategory === term) {
        return total + 5;
      }
      if (normalizedCategory.includes(term)) {
        return total + 4;
      }
      if (normalizedTags.some((tag) => tag === term)) {
        return total + 4;
      }
      if (normalizedTags.some((tag) => tag.includes(term))) {
        return total + 3;
      }
      if (normalizedHaystack.includes(term)) {
        return total + 1;
      }
      return total;
    }, 0);

    if (score > bestScore) {
      bestScore = score;
      bestMatch = tutorial;
    }
  }

  return bestScore > 0 ? bestMatch : undefined;
};

export const summarizeTutorialLibraryParityBaseline = (
  tutorials: DidacticTutorialRecord[]
): TutorialLibraryParityBaseline => {
  const byTrack = tutorials.reduce(
    (counts, tutorial) => {
      counts[tutorial.track] += 1;
      return counts;
    },
    {
      'surgical-path': 0,
      'clinical-path': 0,
      'cross-cutting': 0,
    } as Record<TutorialTrack, number>
  );

  const clinicalPathInteractiveTutorials = tutorials.filter(
    (tutorial) => tutorial.track === 'clinical-path' && tutorial.sourceRepo === 'pthfndr_cp_interactive'
  );

  return {
    totalTutorials: tutorials.length,
    byTrack,
    clinicalPathInteractiveTutorials: {
      totalTutorials: clinicalPathInteractiveTutorials.length,
      interactiveAssetCount: clinicalPathInteractiveTutorials.reduce(
        (count, tutorial) => count + (tutorial.interactiveAssets?.length || 0),
        0
      ),
      rootTopicCount: new Set(
        clinicalPathInteractiveTutorials
          .map((tutorial) => tutorial.abpathScope?.root)
          .filter((root): root is string => Boolean(root))
      ).size,
    },
  };
};
