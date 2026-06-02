import React, { useEffect, useMemo, useRef, useState } from 'react';
import { LearnerLevel, User } from '../types.ts';
import SectionHeader from './ui/SectionHeader.tsx';
import Card from './ui/Card.tsx';
import ImageGalleries from './ImageGalleries.tsx';
import { BookOpenIcon } from './icons.tsx';
import { consumeReferenceLibraryIntent, ReferenceLibraryIntent } from '../utils/referenceLibraryNavigation.ts';
import { getAtlasCollectionSummaries } from '../utils/atlasImageCatalog.ts';
import { readSessionState, writeSessionState } from '../utils/viewStateStorage.ts';
import signoutImageReferenceIndex from '../content/signout_sims/signout_image_reference_index.json';
import {
  apDesignationCrosswalk,
  cpRotationStandards,
  learnerLevelLabels,
  learnerLevelOrder,
  levelModeGuidance,
  signOutRubric,
  sourceStandardDocuments,
} from '../content/competency/competencyMatrix.ts';
import {
  buildPathologySearchText,
  inferMagnification,
  inferMorphologyTags,
  inferOrganSystem,
  inferStain,
  normalizePathologyTitle,
} from '../utils/pathologyImageReview.ts';
import {
  getPathologyCognition,
  type ImmunophenotypeBranch,
  type PathologyStateSignal,
  type ReasoningProgressionStep,
} from '../utils/pathologyCognition.ts';

interface ReferenceLibraryProps {
  user: User | null;
}

interface SignoutReferenceImage {
  caseId: string;
  title: string;
  specialty: string;
  workflow: string;
  localPath: string;
  exists: boolean;
  bytes: number;
  caption: string;
  stain: string;
  sourceUrl: string;
}

interface SupplementalReferenceImage {
  id: string;
  title: string;
  specialty: string;
  localPath: string;
  imageUrl?: string;
  sourcePath: string;
  sourceRelativePath?: string;
  sourceCollection?: string;
  bytes: number;
  extension: string;
  caption?: string;
  sourceDocument?: string;
  pageNumber?: number;
}

interface SupplementalReferenceImageManifest {
  imageCount: number;
  images: SupplementalReferenceImage[];
}

interface FocusPreset {
  id: string;
  title: string;
  description: string;
  focusTerms: string[];
}

interface WorkflowStartCard {
  id: string;
  label: string;
  title: string;
  description: string;
  focusTerms: string[];
}

interface MorphologyGatewayCard {
  tag: string;
  title: string;
  description: string;
  focusTerms: string[];
  previewImages: SupplementalReferenceImage[];
  uncertainty: PathologyStateSignal;
  operationalState: PathologyStateSignal;
  immunophenotype?: ImmunophenotypeBranch;
  reasoningProgression: ReasoningProgressionStep[];
}

const signoutImages = (signoutImageReferenceIndex.images ?? []) as SignoutReferenceImage[];
const SUPPLEMENTAL_PAGE_SIZE = 60;
const emptySupplementalManifest: SupplementalReferenceImageManifest = { imageCount: 0, images: [] };
const REFERENCE_LIBRARY_VIEW_STATE_KEY = 'didactic_series_reference_library_view_state';
const DEFAULT_SUPPLEMENTAL_SPECIALTY = 'thoracic';
const MORPHOLOGY_READY_SPECIALTY_PREFERENCE = ['thoracic', 'genitourinary', 'general'];

interface ReferenceLibraryViewState {
  selectedSignoutSpecialty: string;
  selectedSupplementalSpecialty: string;
  supplementalSearch: string;
  supplementalPage: number;
}

const learnerLevelTone: Record<LearnerLevel, string> = {
  PGY1: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  PGY2: 'bg-sky-50 text-sky-800 border-sky-200',
  PGY3: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  PGY4: 'bg-violet-50 text-violet-800 border-violet-200',
  PGY5_FELLOW: 'bg-amber-50 text-amber-800 border-amber-200',
  ATTENDING: 'bg-slate-100 text-slate-800 border-slate-300',
};

const normalizeReferenceKey = (value?: string) =>
  (value || '')
    .replace(/^\/?Didactic_Series\//, '')
    .replace(/^\/+/, '')
    .split(/[?#]/)[0]
    .toLowerCase()
    .trim();

const dedupeByReferenceImage = <T extends { localPath?: string; imageUrl?: string; sourcePath?: string; sourceUrl?: string; title?: string }>(images: T[]) => {
  const seen = new Set<string>();
  return images.filter((image) => {
    const key =
      normalizeReferenceKey(image.localPath) ||
      normalizeReferenceKey(image.imageUrl) ||
      normalizeReferenceKey(image.sourcePath) ||
      normalizeReferenceKey(image.sourceUrl) ||
      normalizeReferenceKey(image.title);
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

const titleCase = (value: string) =>
  value
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/\bPdf\b/g, 'PDF')
    .replace(/\bH&e\b/g, 'H&E');

const normalizeReferenceLibraryPublicLabel = (value: string) =>
  value
    .replace(/^GU\b/g, 'Genitourinary')
    .replace(/\bGU\b/g, 'Genitourinary');

const cleanDocumentTitle = (image: SupplementalReferenceImage) => {
  const sourceName = image.sourceDocument || image.sourcePath.split('/').pop() || image.title;
  return titleCase(
    sourceName
      .replace(/\.(pdf|pptx?|jpe?g|png|webp|gif|tiff?)$/i, '')
      .replace(/\bpdf\b/gi, 'PDF')
      .replace(/_page\d+.*$/i, '')
      .replace(/_img\d+.*$/i, '')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  );
};

const compactChecklist = (value: string) =>
  value
    .split(/[.;]/)
    .map((entry) => entry.trim())
    .filter(Boolean);

const supplementalCaption = (image: SupplementalReferenceImage) => {
  if (image.caption) {
    return image.caption;
  }
  const documentTitle = cleanDocumentTitle(image);
  const pageText = image.pageNumber ? `, page ${image.pageNumber}` : '';
  const specialty = image.specialty === 'general' ? 'anatomic pathology' : image.specialty.replace('-', ' ');
  return `${titleCase(specialty)} teaching image from ${documentTitle}${pageText}. Review morphology and ancillary-study context with the source material.`;
};

const supplementalSourceLabel = (image: SupplementalReferenceImage) => {
  const documentTitle = cleanDocumentTitle(image);
  const pageText = image.pageNumber ? `p. ${image.pageNumber}` : image.title.replace(/^.*?\bpage\s*/i, 'p. ');
  return `${documentTitle}${pageText && pageText !== image.title ? `, ${pageText}` : ''}`;
};

const supplementalImageSrc = (image: SupplementalReferenceImage) => {
  if (image.imageUrl?.startsWith('/@fs/')) return `${import.meta.env.BASE_URL.replace(/\/$/, '')}${image.imageUrl}`;
  if (image.imageUrl) return image.imageUrl;
  return `${import.meta.env.BASE_URL}${image.localPath}`;
};

const specialtyHasMorphologyTags = (images: SupplementalReferenceImage[], specialty: string) =>
  images.some(
    (image) =>
      image.specialty === specialty &&
      inferMorphologyTags(image.title, image.caption, image.sourceDocument).length > 0
  );

const imageHasMorphologyTag = (image: SupplementalReferenceImage, tag: string) =>
  inferMorphologyTags(image.title, image.caption, image.sourceDocument).some(
    (morphologyTag) => morphologyTag.toLowerCase() === tag.toLowerCase()
  );

const getSpecialtyForMorphologyTag = (images: SupplementalReferenceImage[], tag: string, currentSpecialty: string) => {
  const trimmedTag = tag.trim();
  if (!trimmedTag) {
    return currentSpecialty;
  }
  const currentHasTag = images.some((image) => image.specialty === currentSpecialty && imageHasMorphologyTag(image, trimmedTag));
  if (currentHasTag) {
    return currentSpecialty;
  }
  return images.find((image) => imageHasMorphologyTag(image, trimmedTag))?.specialty ?? currentSpecialty;
};

const getMorphologyReadySpecialty = (images: SupplementalReferenceImage[], currentSpecialty: string) => {
  if (specialtyHasMorphologyTags(images, currentSpecialty)) {
    return currentSpecialty;
  }

  for (const specialty of MORPHOLOGY_READY_SPECIALTY_PREFERENCE) {
    if (specialtyHasMorphologyTags(images, specialty)) {
      return specialty;
    }
  }

  const firstTaggedSpecialty = Array.from(new Set(images.map((image) => image.specialty))).find((specialty) =>
    specialtyHasMorphologyTags(images, specialty)
  );

  return firstTaggedSpecialty ?? currentSpecialty;
};

const matchesSupplementalSearch = (image: SupplementalReferenceImage, searchTerm: string) => {
  const query = searchTerm.trim().toLowerCase();
  if (!query) return true;
  return buildPathologySearchText(
    image.title,
    image.specialty,
    image.sourceDocument,
    image.sourceRelativePath,
    image.sourcePath,
    image.caption,
    ...inferMorphologyTags(image.title, image.caption, image.sourceDocument),
    inferStain(image.title, image.caption, image.sourceDocument),
    inferMagnification(image.title, image.caption, image.sourceDocument),
    inferOrganSystem(image.specialty),
  ).includes(query);
};

const collectionPresetMap: Record<
  'acquired' | 'curated' | 'promoted',
  {
    intentTitle: string;
    intentSummary: string;
    focusTerms: string[];
    bestFor: string;
    ctaLabel: string;
  }
> = {
  acquired: {
    intentTitle: 'Lecture microscopy',
    intentSummary: 'Start with the images already used in active lectures and teaching walkthroughs.',
    focusTerms: ['lecture', 'microscopy', 'histology'],
    bestFor: 'lecture review and rapid recap',
    ctaLabel: 'Open lecture images',
  },
  curated: {
    intentTitle: 'Histology comparison',
    intentSummary: 'Use a broad morphology-first set when you want to compare look-alikes side by side.',
    focusTerms: ['adipocytic', 'spindle', 'melanocytic'],
    bestFor: 'pattern recognition and differential diagnosis',
    ctaLabel: 'Compare histology',
  },
  promoted: {
    intentTitle: 'Granulomatous differential',
    intentSummary: 'Review infectious and inflammatory mimics when the key problem is granulomatous disease.',
    focusTerms: ['sarcoidosis', 'blastomycosis', 'cryptococcosis'],
    bestFor: 'granuloma workups and mimic review',
    ctaLabel: 'Review granulomas',
  },
};

const ReferenceLibrary: React.FC<ReferenceLibraryProps> = ({ user }) => {
  const appliedInitialIntentRef = useRef(false);
  const [focusIntent, setFocusIntent] = useState<ReferenceLibraryIntent | null>(null);
  const [selectedSignoutSpecialty, setSelectedSignoutSpecialty] = useState('Genitourinary Pathology Sign-Out Simulations');
  const [selectedSupplementalSpecialty, setSelectedSupplementalSpecialty] = useState(DEFAULT_SUPPLEMENTAL_SPECIALTY);
  const [supplementalSearch, setSupplementalSearch] = useState('');
  const [supplementalPage, setSupplementalPage] = useState(1);
  const [selectedCompetencyLevel, setSelectedCompetencyLevel] = useState<LearnerLevel>('PGY1');
  const [supplementalManifest, setSupplementalManifest] = useState<SupplementalReferenceImageManifest>(emptySupplementalManifest);
  const [hasStoredSupplementalSelection, setHasStoredSupplementalSelection] = useState(false);
  const atlasSummaries = getAtlasCollectionSummaries();
  const supplementalImages = useMemo(() => supplementalManifest.images ?? [], [supplementalManifest]);
  const signoutSpecialties = useMemo(
    () => ['All', ...Array.from(new Set(signoutImages.map((image) => image.specialty))).sort()],
    []
  );
  const filteredSignoutImages = useMemo(
    () =>
      dedupeByReferenceImage(
        selectedSignoutSpecialty === 'All'
          ? signoutImages
          : signoutImages.filter((image) => image.specialty === selectedSignoutSpecialty)
      ),
    [selectedSignoutSpecialty]
  );
  const supplementalSpecialties = useMemo(
    () => Array.from(new Set(supplementalImages.map((image) => image.specialty))).sort(),
    [supplementalImages]
  );
  const filteredSupplementalImages = useMemo(
    () =>
      dedupeByReferenceImage(
        supplementalImages
          .filter((image) => image.specialty === selectedSupplementalSpecialty)
          .filter((image) => matchesSupplementalSearch(image, supplementalSearch))
      ),
    [selectedSupplementalSpecialty, supplementalImages, supplementalSearch]
  );
  const supplementalMorphologyOptions = useMemo(
    () =>
      Array.from(
        new Set(
          supplementalImages
            .filter((image) => image.specialty === selectedSupplementalSpecialty)
            .flatMap((image) => inferMorphologyTags(image.title, image.caption, image.sourceDocument))
        )
      ).sort(),
    [selectedSupplementalSpecialty, supplementalImages]
  );
  const [selectedMorphologyTag, setSelectedMorphologyTag] = useState('');
  const filteredSupplementalImagesWithMorphology = useMemo(
    () =>
      selectedMorphologyTag
        ? filteredSupplementalImages.filter((image) =>
            imageHasMorphologyTag(image, selectedMorphologyTag)
          )
        : filteredSupplementalImages,
    [filteredSupplementalImages, selectedMorphologyTag]
  );
  const morphologyGatewayCards = useMemo<MorphologyGatewayCard[]>(
    () =>
      supplementalMorphologyOptions.slice(0, 8).map((tag) => {
        const previewImages = filteredSupplementalImages
          .filter((image) => imageHasMorphologyTag(image, tag))
          .slice(0, 3);
        const cognition = getPathologyCognition(
          tag,
          ...previewImages.map((image) => image.title),
          ...previewImages.map((image) => image.caption),
        );

        return {
          tag,
          title: tag,
          description: `Open a ${tag} differential review with example images and the closest morphology matches.`,
          focusTerms: [tag, ...previewImages.map((image) => normalizePathologyTitle(image.title)).slice(0, 2)],
          previewImages,
          uncertainty: cognition.uncertaintyState,
          operationalState: cognition.operationalState,
          immunophenotype: cognition.immunophenotypeBranch,
          reasoningProgression: cognition.reasoningProgression.map((step) => ({
            key: step.key,
            label: step.label,
            cue: step.guidance,
          })),
        };
      }),
    [filteredSupplementalImages, supplementalMorphologyOptions]
  );
  const supplementalPageCount = Math.max(1, Math.ceil(filteredSupplementalImagesWithMorphology.length / SUPPLEMENTAL_PAGE_SIZE));
  const visibleSupplementalImages = useMemo(
    () =>
      filteredSupplementalImagesWithMorphology.slice(
        (supplementalPage - 1) * SUPPLEMENTAL_PAGE_SIZE,
        supplementalPage * SUPPLEMENTAL_PAGE_SIZE,
      ),
    [filteredSupplementalImagesWithMorphology, supplementalPage]
  );
  const focusIntentCompetencyLevel = useMemo(
    () =>
      focusIntent?.focusTerms?.find((term): term is LearnerLevel =>
        learnerLevelOrder.includes(term as LearnerLevel)
      ) ?? null,
    [focusIntent]
  );
  const competencyGuidance = levelModeGuidance[selectedCompetencyLevel];
  const diagnosticFocusText = competencyGuidance.intent;
  const recognitionTargetText = competencyGuidance.expectedEvidence;
  const activeMorphologyIntentTag = focusIntent?.morphologyTag?.trim() ?? '';
  const matchedMorphologyIntentImages = useMemo(
    () => (activeMorphologyIntentTag ? filteredSupplementalImagesWithMorphology.slice(0, 4) : []),
    [activeMorphologyIntentTag, filteredSupplementalImagesWithMorphology]
  );

  useEffect(() => {
    const intent = consumeReferenceLibraryIntent();
    const storedView = readSessionState<ReferenceLibraryViewState>(REFERENCE_LIBRARY_VIEW_STATE_KEY);
    if (intent) {
      appliedInitialIntentRef.current = true;
      setFocusIntent(intent);
      if (intent.morphologyTag) {
        setSelectedMorphologyTag(intent.morphologyTag);
        setSupplementalSearch(intent.morphologyTag);
        setSupplementalPage(1);
        setHasStoredSupplementalSelection(false);
      }
      return;
    }
    if (appliedInitialIntentRef.current) {
      return;
    }
    if (storedView) {
      setSelectedSignoutSpecialty(storedView.selectedSignoutSpecialty);
      setSelectedSupplementalSpecialty(storedView.selectedSupplementalSpecialty);
      setSupplementalSearch(storedView.supplementalSearch);
      setSupplementalPage(storedView.supplementalPage);
      setHasStoredSupplementalSelection(Boolean(storedView.selectedSupplementalSpecialty));
    }
  }, []);

  useEffect(() => {
    if (focusIntentCompetencyLevel) {
      setSelectedCompetencyLevel(focusIntentCompetencyLevel);
    }
  }, [focusIntentCompetencyLevel]);

  useEffect(() => {
    writeSessionState<ReferenceLibraryViewState>(REFERENCE_LIBRARY_VIEW_STATE_KEY, {
      selectedSignoutSpecialty,
      selectedSupplementalSpecialty,
      supplementalSearch,
      supplementalPage,
    });
  }, [selectedSignoutSpecialty, selectedSupplementalSpecialty, supplementalSearch, supplementalPage]);

  useEffect(() => {
    let active = true;
    const manifestPath = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/reference-images/apcpboards_reference_images.json`;
    const normalizeManifest = (manifest: SupplementalReferenceImageManifest) => ({
      imageCount: manifest.imageCount ?? manifest.images?.length ?? 0,
      images: manifest.images ?? [],
    });
    fetch(manifestPath)
      .then((response) => (response.ok ? response.json() : Promise.reject(response.statusText)))
      .then((manifest) => {
        if (!active) return;
        if (typeof manifest === 'object' && manifest !== null && Array.isArray(manifest.images)) {
          setSupplementalManifest(normalizeManifest(manifest as SupplementalReferenceImageManifest));
        }
      })
      .catch(() => {
        if (active) {
          setSupplementalManifest(emptySupplementalManifest);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (supplementalImages.length === 0) {
      return;
    }

    if (focusIntent?.morphologyTag) {
      const morphologySpecialty = getSpecialtyForMorphologyTag(
        supplementalImages,
        focusIntent.morphologyTag,
        selectedSupplementalSpecialty
      );
      if (morphologySpecialty !== selectedSupplementalSpecialty) {
        setSelectedSupplementalSpecialty(morphologySpecialty);
      }
      return;
    }

    const availableSpecialties = new Set(supplementalImages.map((image) => image.specialty));
    if (hasStoredSupplementalSelection && availableSpecialties.has(selectedSupplementalSpecialty)) {
      return;
    }

    const morphologyReadySpecialty = getMorphologyReadySpecialty(supplementalImages, selectedSupplementalSpecialty);
    if (morphologyReadySpecialty !== selectedSupplementalSpecialty) {
      setSelectedSupplementalSpecialty(morphologyReadySpecialty);
    }
  }, [focusIntent?.morphologyTag, hasStoredSupplementalSelection, selectedSupplementalSpecialty, supplementalImages]);

  useEffect(() => {
    setSupplementalPage(1);
  }, [selectedSupplementalSpecialty, supplementalSearch, selectedMorphologyTag]);

  const focusPresets: FocusPreset[] = [
    ...(focusIntent?.focusTerms?.slice(0, 3).map((term) => ({
      id: `focus-${term}`,
      title: term,
      description: 'Current lecture focus',
      focusTerms: [term],
    })) || []),
    {
      id: 'preset-blastomycosis',
      title: 'Blastomycosis',
      description: 'Fungal granulomatous infection',
      focusTerms: ['blastomycosis'],
    },
    {
      id: 'preset-cryptococcosis',
      title: 'Cryptococcosis',
      description: 'Fungal infection with capsule-associated morphology',
      focusTerms: ['cryptococcosis'],
    },
    {
      id: 'preset-sarcoidosis',
      title: 'Sarcoidosis',
      description: 'Non-necrotizing granulomatous inflammation',
      focusTerms: ['sarcoidosis'],
    },
    {
      id: 'preset-sft',
      title: 'Spindle / SFT',
      description: 'Spindle-cell and solitary fibrous tumor differential',
      focusTerms: ['sft', 'solitary fibrous tumour', 'spindle'],
    },
    {
      id: 'preset-melanocytic',
      title: 'Melanocytic',
      description: 'Melanocytic lesion comparison',
      focusTerms: ['melanocytic'],
    },
    {
      id: 'preset-gastrointestinal',
      title: 'GI',
      description: 'Gastrointestinal pathology comparison',
      focusTerms: ['gastrointestinal'],
    },
    {
      id: 'preset-inflammatory-mimics',
      title: 'Inflammatory Mimics',
      description: 'Granulomatous and inflammatory mimics',
      focusTerms: ['sarcoidosis', 'hypersensitivity pneumonitis', 'gpa', 'blastomycosis', 'cryptococcosis'],
    },
    {
      id: 'preset-breast',
      title: 'Breast',
      description: 'Breast pathology comparison',
      focusTerms: ['breast', 'cribriform', 'tubular', 'sclerosing'],
    },
    {
      id: 'preset-gynecologic',
      title: 'Gynecologic',
      description: 'Gynecologic pathology comparison',
      focusTerms: ['ovary', 'endometrioid', 'serous', 'mucinous'],
    },
    {
      id: 'preset-gu',
      title: 'Genitourinary',
      description: 'Genitourinary pathology comparison',
      focusTerms: ['renal', 'bladder', 'urothelial', 'seminoma'],
    },
    {
      id: 'preset-hpb',
      title: 'HPB',
      description: 'Hepatobiliary and pancreatic pathology comparison',
      focusTerms: ['liver', 'pancreas', 'cholangiocarcinoma', 'ductal'],
    },
    {
      id: 'preset-thoracic',
      title: 'Thoracic',
      description: 'Thoracic pathology comparison',
      focusTerms: ['lung', 'adenocarcinoma', 'small cell', 'granuloma'],
    },
  ];

  const workflowStartCards: WorkflowStartCard[] = [
    {
      id: 'unknown-case',
      label: 'Case-first',
      title: 'Start unknown case',
      description: 'Open an image set, name the pattern, and commit the first safe differential.',
      focusTerms: ['unknown case', 'pattern recognition', 'differential diagnosis'],
    },
    {
      id: 'differential-drill',
      label: 'Differential',
      title: 'Differential drill',
      description: 'Review look-alikes by morphology and sort the mimics before diagnosis.',
      focusTerms: ['differential', 'spindle cell', 'papillary', 'clear cell'],
    },
    {
      id: 'frozen',
      label: 'Intraoperative',
      title: 'Frozen section simulation',
      description: 'Practice limited-sample calls, deferrals, and frozen-versus-permanent safety language.',
      focusTerms: ['frozen section', 'defer', 'discordance', 'safety critical'],
    },
    {
      id: 'immunostain',
      label: 'Ancillary',
      title: 'Immunostain interpretation',
      description: 'Use stains as diagnostic evidence instead of post-hoc decoration.',
      focusTerms: ['immunostain', 'CK7', 'GATA3', 'TTF1', 'PAX8'],
    },
    {
      id: 'molecular',
      label: 'Molecular',
      title: 'Molecular correlation',
      description: 'Link morphology to biomarker, mutation, and classification consequences.',
      focusTerms: ['molecular', 'KRAS', 'WHO classification', 'biomarker'],
    },
    {
      id: 'cyto-histo',
      label: 'Correlation',
      title: 'Cytology-histology concordance',
      description: 'Review how the same entity looks across specimen type and preparation.',
      focusTerms: ['cytology', 'histology', 'correlation'],
    },
  ];

  const groupedFocusPresets = [
    {
      id: 'differentials',
      title: 'Common differentials',
      description: 'Start from a pattern or high-yield mimic set.',
      presets: focusPresets.filter((preset) =>
        ['preset-blastomycosis', 'preset-cryptococcosis', 'preset-sarcoidosis', 'preset-sft', 'preset-melanocytic', 'preset-inflammatory-mimics'].includes(
          preset.id
        )
      ),
    },
    {
      id: 'organ-systems',
      title: 'Organ systems',
      description: 'Jump into a service-style image set by subspecialty.',
      presets: focusPresets.filter((preset) =>
        ['preset-breast', 'preset-gynecologic', 'preset-gu', 'preset-hpb', 'preset-thoracic', 'preset-gastrointestinal'].includes(preset.id)
      ),
    },
  ];

  const applyPreset = (preset: { title: string; description: string; focusTerms: string[]; morphologyTag?: string }) => {
    setFocusIntent({
      title: preset.title,
      summary: preset.description,
      morphologyTag: preset.morphologyTag,
      focusTerms: preset.focusTerms,
      tutorialTopics: focusIntent?.tutorialTopics,
      syllabusTopics: focusIntent?.syllabusTopics,
      algorithmTopics: focusIntent?.algorithmTopics,
    });
  };

  const applyCollectionPreset = (summary: (typeof atlasSummaries)[number]) => {
    const collectionPreset = collectionPresetMap[summary.id];
    applyPreset({
      title: collectionPreset.intentTitle,
      description: collectionPreset.intentSummary,
      focusTerms: collectionPreset.focusTerms,
    });
  };

  return (
    <div className="animate-fade-in space-y-8">
      <SectionHeader
        title="Reference Library"
        subtitle="Review histology, gross, and ancillary images for study and sign-out comparison."
        icon={<BookOpenIcon className="h-10 w-10" />}
      />
      <Card className="overflow-hidden border-sky-200 bg-gradient-to-r from-sky-50 via-white to-emerald-50">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Start here</p>
            <h2 className="mt-2 text-2xl font-semibold font-serif text-slate-950">Choose the kind of review you want</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Use lecture images for recap, histology comparison for morphology drills, or granulomatous sets for focused differentials. When you are reviewing CP material, keep the source-linked tutorial or operational studio as the anchor.
            </p>
          </div>
          {focusIntent && (
            <div className="rounded-2xl border border-sky-200 bg-white/90 px-4 py-3 text-sm text-slate-700 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wide text-sky-700">Current review context</div>
              <div className="mt-1 font-semibold text-slate-950">{focusIntent.title}</div>
              {focusIntent.summary && <div className="mt-1 text-slate-600">{focusIntent.summary}</div>}
            </div>
          )}
        </div>
      </Card>
      {activeMorphologyIntentTag && (
        <Card className="border-sky-200 bg-white">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Matched morphology images</p>
                <h2 className="mt-1 text-xl font-semibold font-serif text-slate-950">{titleCase(activeMorphologyIntentTag)} landing set</h2>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  This Reference Library handoff is filtered to the morphology pattern requested from the curriculum.
                </p>
              </div>
              <div className="rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-right">
                <div className="text-xs font-semibold uppercase tracking-wide text-sky-700">Matches</div>
                <div className="text-2xl font-semibold text-sky-950">{filteredSupplementalImagesWithMorphology.length.toLocaleString()}</div>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {matchedMorphologyIntentImages.length > 0 ? (
                matchedMorphologyIntentImages.map((image) => (
                  <article key={`intent-${image.id}`} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                    <img
                      src={supplementalImageSrc(image)}
                      alt={supplementalCaption(image)}
                      className="h-36 w-full bg-slate-950 object-contain"
                      loading="lazy"
                    />
                    <div className="space-y-2 p-3">
                      <div className="text-sm font-semibold leading-5 text-slate-950">{normalizePathologyTitle(image.title)}</div>
                      <div className="flex flex-wrap gap-1.5">
                        {[inferStain(image.title, image.caption, image.sourceDocument), inferMagnification(image.title, image.caption, image.sourceDocument), inferOrganSystem(image.specialty)]
                          .filter(Boolean)
                          .map((chip) => (
                            <span key={`intent-${image.id}-${chip}`} className="rounded-md bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                              {chip}
                            </span>
                          ))}
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-600 md:col-span-2 xl:col-span-4">
                  Loading matched images for {activeMorphologyIntentTag}.
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
      <Card>
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Case-first review</p>
            <h2 className="mt-2 text-2xl font-semibold font-serif text-slate-950">Start from the pathology task, not the document shelf</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Choose the review mode that matches how pathologists actually work: unknown case, differential drill, frozen section, stains, molecular correlation, or CP source-linked interpretation.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {workflowStartCards.map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() => applyPreset({ title: card.title, description: card.description, focusTerms: card.focusTerms })}
                className="rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-slate-300 hover:shadow-sm"
              >
                <div className="text-xs font-semibold uppercase tracking-wide text-sky-700">{card.label}</div>
                <div className="mt-2 text-lg font-semibold text-slate-950">{card.title}</div>
                <p className="mt-2 text-sm leading-6 text-slate-700">{card.description}</p>
              </button>
            ))}
          </div>
        </div>
      </Card>
      {morphologyGatewayCards.length > 0 && (
        <Card>
          <div className="flex flex-col gap-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Morphology-first review</p>
              <h2 className="mt-2 text-2xl font-semibold font-serif text-slate-950">Start with the closest pattern</h2>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                Choose a morphology pattern and jump directly into example images, differential thinking, and the most relevant review context.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {morphologyGatewayCards.map((card) => (
                <button
                  key={card.tag}
                  type="button"
                  onClick={() => {
                    setSelectedMorphologyTag(card.tag);
                    setSupplementalSearch(card.tag);
                    applyPreset({
                      title: `${card.title} differential`,
                      description: card.description,
                      morphologyTag: card.tag,
                      focusTerms: card.focusTerms,
                    });
                  }}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white text-left transition hover:border-slate-300 hover:shadow-sm"
                >
                  <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1">
                    {card.previewImages.length > 0 ? (
                      card.previewImages.map((image) => (
                        <img
                          key={image.id}
                          src={supplementalImageSrc(image)}
                          alt={normalizePathologyTitle(image.title)}
                          className="h-24 w-full bg-slate-900 object-contain"
                          loading="lazy"
                        />
                      ))
                    ) : (
                      <div className="col-span-3 flex h-24 items-center justify-center text-xs font-semibold uppercase tracking-wide text-slate-300">
                        Preview pending
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-sky-700">Diagnostic approach</div>
                    <div className="text-lg font-semibold capitalize text-slate-950">{card.title}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {[card.uncertainty, card.operationalState].map((signal) => (
                        <span
                          key={`${card.tag}-${signal.label}`}
                          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${signal.tone}`}
                        >
                          {signal.label}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm leading-6 text-slate-700">{card.description}</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="rounded-xl bg-slate-50 px-3 py-2">
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Uncertainty state</div>
                        <div className="mt-1 text-sm font-semibold text-slate-900">{card.uncertainty.label}</div>
                        <div className="text-xs text-slate-600">{card.uncertainty.cue}</div>
                      </div>
                      <div className="rounded-xl bg-slate-50 px-3 py-2">
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Operational state</div>
                        <div className="mt-1 text-sm font-semibold text-slate-900">{card.operationalState.label}</div>
                        <div className="text-xs text-slate-600">{card.operationalState.cue}</div>
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-3">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Reasoning progression</div>
                      <div className="mt-3 grid gap-2">
                        {card.reasoningProgression.map((step, index) => (
                          <div key={`${card.tag}-${step.key}`} className="grid grid-cols-[auto,1fr] gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-100 text-[11px] font-semibold text-sky-900">
                              {index + 1}
                            </span>
                            <div className="rounded-lg bg-slate-50 px-3 py-2">
                              <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{step.label}</div>
                              <div className="mt-1 text-xs leading-5 text-slate-700">{step.cue}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {card.immunophenotype && (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{card.immunophenotype.title}</div>
                        <div className="mt-1 text-xs leading-5 text-slate-700">{card.immunophenotype.description}</div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {card.immunophenotype.markers.map((marker) => (
                            <span
                              key={`${card.tag}-${marker}`}
                              className="rounded-full border border-sky-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-sky-900"
                            >
                              {marker}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1.5">
                      {card.focusTerms.slice(0, 3).map((term) => (
                        <span
                          key={`${card.tag}-${term}`}
                          className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700"
                        >
                          {term}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </Card>
      )}
      <Card>
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-4xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Study and sign-out calibration</p>
              <h2 className="mt-2 text-2xl font-semibold font-serif text-slate-950">Reference context for pathology review</h2>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                Keep the source documents, training-level expectations, AP designation rules, CP rotation standards, and sign-out checkpoints together while you review a case or image set.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
              {[
                ['Documents', sourceStandardDocuments.length],
                ['AP rules', apDesignationCrosswalk.length],
                ['CP standards', cpRotationStandards.length],
                ['Sign-out checks', signOutRubric.criteria.length],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
                  <div className="mt-1 text-2xl font-semibold text-slate-950">{value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Training level guidance</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {learnerLevelOrder.map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setSelectedCompetencyLevel(level)}
                    className={`rounded-full border px-3 py-2 text-sm font-semibold transition ${
                      selectedCompetencyLevel === level
                        ? learnerLevelTone[level]
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
                    }`}
                  >
                    {learnerLevelLabels[level]}
                  </button>
                ))}
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Diagnostic focus</div>
                  <ul className="mt-2 space-y-1 text-sm text-slate-800">
                    {compactChecklist(diagnosticFocusText).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Review approach</div>
                  <ul className="mt-2 space-y-1 text-sm text-slate-800">
                    {compactChecklist(competencyGuidance.interfaceMode).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">What to recognize</div>
                  <ul className="mt-2 space-y-1 text-sm text-slate-800">
                    {compactChecklist(recognitionTargetText).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Diagnostic safety</div>
              <h3 className="mt-2 text-lg font-semibold text-slate-950">{signOutRubric.title}</h3>
              <p className="mt-2 text-sm text-slate-600">
                These checkpoints make attending-style review concrete and keep downstream feedback tied to the actual sign-out task.
              </p>
              <div className="mt-4 space-y-2">
                {signOutRubric.criteria.map((criterion) => (
                  <div
                    key={criterion.id}
                    className={`rounded-xl px-3 py-3 ${
                      criterion.safetyCritical
                        ? 'border-l-4 border-amber-500 bg-amber-50'
                        : 'bg-slate-50'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="text-sm font-semibold text-slate-900">{criterion.label}</div>
                      <div className="text-xs font-semibold text-slate-500">
                        Pass {criterion.passingScore}/{criterion.maxScore}
                      </div>
                    </div>
                    {criterion.safetyCritical && (
                      <div className="mt-2 text-xs font-semibold uppercase tracking-wide text-amber-800">Safety critical review point</div>
                    )}
                    <p className="mt-2 text-sm text-slate-700">{criterion.feedbackPrompt}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {sourceStandardDocuments.map((document) => (
              <article key={document.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{document.scope}</div>
                    <h3 className="mt-1 text-base font-semibold text-slate-950">{document.shortTitle}</h3>
                  </div>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">{document.pageCount} pages</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-700">{document.publicationContext}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {document.mappedLearnerLevels.map((level) => (
                    <span
                      key={`${document.id}-${level}`}
                      className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${learnerLevelTone[level]}`}
                    >
                      {learnerLevelLabels[level]}
                    </span>
                  ))}
                </div>
                <div className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Why it matters here</div>
                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                  {document.appUse.slice(0, 2).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">AP designation crosswalk</div>
              <div className="mt-3 space-y-3">
                {apDesignationCrosswalk.map((item) => (
                  <div key={item.designation} className="rounded-xl bg-slate-50 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white">{item.designation}</span>
                      <span className="text-sm font-semibold text-slate-950">{item.label}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-700">{item.appRule}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">CP rotation standards</div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {cpRotationStandards.map((standard) => (
                  <div key={standard} className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800">
                    {standard}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>
      <div className="grid gap-4 xl:grid-cols-3">
        {atlasSummaries.map((summary) => (
          <Card
            key={summary.id}
            interactive
            className={`mb-0 h-full ${
              focusIntent?.title === collectionPresetMap[summary.id].intentTitle ? 'border-sky-300 shadow-md ring-2 ring-sky-100' : ''
            }`}
            onClick={() => applyCollectionPreset(summary)}
          >
            <div className="flex h-full flex-col">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">Image pathway</p>
                  <h2 className="mt-1 text-2xl font-semibold font-serif text-slate-950">{summary.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{summary.description}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-right">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Images</div>
                  <div className="text-2xl font-semibold text-slate-900">{summary.imageCount}</div>
                </div>
              </div>
              <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Best for</div>
                <div className="mt-1 text-sm font-medium text-slate-900">{collectionPresetMap[summary.id].bestFor}</div>
              </div>
              <div className="mt-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Common examples</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {summary.highlightedTerms.slice(0, 4).map((term) => (
                    <button
                      key={`${summary.id}-${term}`}
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        applyPreset({ title: term, description: `${summary.title} example set`, focusTerms: [term.toLowerCase()] });
                      }}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-5">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    applyCollectionPreset(summary);
                  }}
                  className="w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  {collectionPresetMap[summary.id].ctaLabel}
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <Card>
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Quick pathways</p>
            <h2 className="mt-1 text-xl font-semibold font-serif text-slate-900">Browse by morphology, differential, or service</h2>
            <p className="mt-2 text-sm text-slate-700">
              Choose a ready-made pathway when you already know the disease family, morphology, or organ system you want to review.
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {groupedFocusPresets.map((group) => (
              <div key={group.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-950">{group.title}</div>
                <p className="mt-1 text-sm text-slate-600">{group.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {group.presets.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                    >
                      {preset.title}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Sign-out image library</p>
            <h2 className="mt-1 text-xl font-semibold font-serif text-slate-900">Local visual evidence for simulation cases</h2>
            <p className="mt-2 text-sm text-slate-700">
              Explore locally available sign-out case images used across simulation workflows.
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {signoutSpecialties.map((specialty) => (
            <button
              key={specialty}
              type="button"
              onClick={() => setSelectedSignoutSpecialty(specialty)}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                selectedSignoutSpecialty === specialty
                  ? 'border-sky-300 bg-sky-50 text-sky-800'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:text-slate-900'
              }`}
            >
              {normalizeReferenceLibraryPublicLabel(
                specialty.replace(/ Pathology Sign-Out Simulations| Sign-Out Simulations/g, '')
              )}
            </button>
          ))}
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredSignoutImages.map((image) => (
            <article key={image.caseId} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <img
                src={`${import.meta.env.BASE_URL}${image.localPath}`}
                alt={image.caption}
                className="h-44 w-full bg-slate-100 object-cover"
                loading="lazy"
              />
              <div className="space-y-3 p-4">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{image.workflow}</span>
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{image.stain}</span>
                  </div>
                  <h3 className="mt-3 text-sm font-semibold leading-5 text-slate-950">{image.title}</h3>
                  <p className="mt-2 text-sm leading-5 text-slate-700">{image.caption}</p>
                </div>
                <div className="border-t border-slate-100 pt-3 text-xs text-slate-500">
                  <a
                    href={image.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-sky-700 hover:text-sky-900"
                  >
                    Source
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </Card>
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Supplemental image set</p>
            <h2 className="mt-1 text-xl font-semibold font-serif text-slate-900">Local histology and gross images</h2>
            <p className="mt-2 text-sm text-slate-700">
              {supplementalManifest.imageCount.toLocaleString()} images indexed from local teaching folders for pathology review.
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 px-4 py-3 text-right">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Matches</div>
            <div className="text-2xl font-semibold text-slate-900">{filteredSupplementalImagesWithMorphology.length.toLocaleString()}</div>
          </div>
        </div>
        <div className="mt-4">
          <label className="sr-only" htmlFor="supplemental-image-search">
            Search supplemental images
          </label>
          <input
            id="supplemental-image-search"
            type="search"
            value={supplementalSearch}
            onChange={(event) => setSupplementalSearch(event.target.value)}
            placeholder="Search diagnosis, stain, magnification, morphology, WHO terms, or differential clues"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {supplementalSpecialties.map((specialty) => (
            <button
              key={specialty}
              type="button"
              onClick={() => setSelectedSupplementalSpecialty(specialty)}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium capitalize transition ${
                selectedSupplementalSpecialty === specialty
                  ? 'border-sky-300 bg-sky-50 text-sky-800'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:text-slate-900'
              }`}
            >
              {specialty.replace('-', ' ')}
            </button>
          ))}
        </div>
        {supplementalMorphologyOptions.length > 0 && (
          <div className="mt-4">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Morphology-first filter</div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedMorphologyTag('')}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                  selectedMorphologyTag === ''
                    ? 'border-sky-300 bg-sky-50 text-sky-800'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:text-slate-900'
                }`}
              >
                All patterns
              </button>
              {supplementalMorphologyOptions.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedMorphologyTag(tag)}
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                    selectedMorphologyTag === tag
                      ? 'border-sky-300 bg-sky-50 text-sky-800'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:text-slate-900'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
          <div>
            Showing page {supplementalPage} of {supplementalPageCount} ({visibleSupplementalImages.length.toLocaleString()} images)
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSupplementalPage((page) => Math.max(1, page - 1))}
              disabled={supplementalPage === 1}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setSupplementalPage((page) => Math.min(supplementalPageCount, page + 1))}
              disabled={supplementalPage === supplementalPageCount}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
          {visibleSupplementalImages.map((image) => (
            <article key={image.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              {(() => {
                const cognition = getPathologyCognition(
                  image.title,
                  image.caption,
                  image.sourceDocument,
                  image.sourceRelativePath,
                  inferMorphologyTags(image.title, image.caption, image.sourceDocument).join(' '),
                  inferStain(image.title, image.caption, image.sourceDocument),
                );
                const { uncertaintyState: uncertainty, operationalState, immunophenotypeBranch: immunophenotype } = cognition;
                const reasoningProgression = cognition.reasoningProgression.map((step) => ({
                  key: step.key,
                  label: step.label,
                  cue: step.guidance,
                }));
                return (
                  <>
              <img
                src={supplementalImageSrc(image)}
                alt={supplementalCaption(image)}
                className="h-44 w-full bg-slate-950 object-contain"
                loading="lazy"
              />
              <div className="space-y-2 p-3">
                <div>
                  <div className="flex flex-wrap gap-1.5">
                    {[inferStain(image.title, image.caption, image.sourceDocument), inferMagnification(image.title, image.caption, image.sourceDocument), inferOrganSystem(image.specialty)]
                      .filter(Boolean)
                      .map((chip) => (
                        <span key={chip} className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                          {chip}
                        </span>
                      ))}
                    {[uncertainty, operationalState].map((signal) => (
                      <span key={`${image.id}-${signal.label}`} className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${signal.tone}`}>
                        {signal.label}
                      </span>
                    ))}
                  </div>
                  <h3 className="mt-2 text-sm font-semibold leading-5 text-slate-950">
                    {normalizePathologyTitle(image.title)}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-xs leading-4 text-slate-600">
                    {inferMorphologyTags(image.title, image.caption, image.sourceDocument).slice(0, 4).join(' • ') || supplementalCaption(image)}
                  </p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-lg bg-slate-50 px-2.5 py-2">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Uncertainty</div>
                    <div className="mt-1 text-xs font-semibold text-slate-900">{uncertainty.label}</div>
                    <div className="text-[11px] leading-4 text-slate-600">{uncertainty.cue}</div>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-2.5 py-2">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Workflow state</div>
                    <div className="mt-1 text-xs font-semibold text-slate-900">{operationalState.label}</div>
                    <div className="text-[11px] leading-4 text-slate-600">{operationalState.cue}</div>
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-2">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Reasoning progression</div>
                  <div className="mt-2 grid gap-2">
                    {reasoningProgression.map((step, index) => (
                      <div key={`${image.id}-${step.key}`} className="grid grid-cols-[auto,1fr] gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-100 text-[10px] font-semibold text-sky-900">
                          {index + 1}
                        </span>
                        <div className="rounded-md bg-slate-50 px-2 py-1.5">
                          <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{step.label}</div>
                          <div className="mt-0.5 text-[11px] leading-4 text-slate-700">{step.cue}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {immunophenotype && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{immunophenotype.title}</div>
                    <div className="mt-1 text-[11px] leading-4 text-slate-700">{immunophenotype.description}</div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {immunophenotype.markers.slice(0, 6).map((marker) => (
                        <span
                          key={`${image.id}-${marker}`}
                          className="rounded-full border border-sky-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-sky-900"
                        >
                          {marker}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="border-t border-slate-100 pt-2 text-[11px] leading-4 text-slate-500">
                  <div>{supplementalSourceLabel(image)}</div>
                  {image.sourceRelativePath && <div className="truncate" title={image.sourceRelativePath}>{image.sourceRelativePath}</div>}
                </div>
              </div>
                  </>
                );
              })()}
            </article>
          ))}
        </div>
      </Card>
      {focusIntent && (
        <div className="rounded-2xl border border-sky-200 bg-sky-50 px-5 py-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Current review context</p>
              <h2 className="mt-1 text-xl font-semibold font-serif text-slate-900">{focusIntent.title ?? 'Study context'}</h2>
              {focusIntent.summary && <p className="mt-2 text-sm text-slate-700">{focusIntent.summary}</p>}
            </div>
            <button
              type="button"
              onClick={() => setFocusIntent(null)}
              className="rounded-full border border-sky-200 bg-white px-3 py-1.5 text-sm font-medium text-sky-800 transition hover:border-sky-300 hover:bg-sky-100"
            >
              Clear context
            </button>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {focusIntent.focusTerms && focusIntent.focusTerms.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Image search terms</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {focusIntent.focusTerms.map((term) => (
                    <span key={term} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
                      {term}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {focusIntent.tutorialTopics && focusIntent.tutorialTopics.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Related teaching topics</h3>
                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                  {focusIntent.tutorialTopics.slice(0, 3).map((topic) => (
                    <li key={topic}>• {topic}</li>
                  ))}
                </ul>
              </div>
            )}
            {focusIntent.syllabusTopics && focusIntent.syllabusTopics.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Curriculum topics</h3>
                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                  {focusIntent.syllabusTopics.slice(0, 3).map((topic) => (
                    <li key={topic}>• {topic}</li>
                  ))}
                </ul>
              </div>
            )}
            {focusIntent.algorithmTopics && focusIntent.algorithmTopics.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Diagnostic pathway</h3>
                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                  {focusIntent.algorithmTopics.slice(0, 3).map((topic) => (
                    <li key={topic}>• {topic}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
      <div>
        <ImageGalleries user={user} focusIntent={focusIntent} />
      </div>
    </div>
  );
};

export default ReferenceLibrary;
