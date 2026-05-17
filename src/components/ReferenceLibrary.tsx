import React, { useEffect, useMemo, useState } from 'react';
import { User } from '../types.ts';
import SectionHeader from './ui/SectionHeader.tsx';
import Card from './ui/Card.tsx';
import ImageGalleries from './ImageGalleries.tsx';
import { BookOpenIcon } from './icons.tsx';
import { consumeReferenceLibraryIntent, ReferenceLibraryIntent } from '../utils/referenceLibraryNavigation.ts';
import { getAtlasCollectionSummaries } from '../utils/atlasImageCatalog.ts';
import signoutImageReferenceIndex from '../content/signout_sims/signout_image_reference_index.json';

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

const signoutImages = (signoutImageReferenceIndex.images ?? []) as SignoutReferenceImage[];
const SUPPLEMENTAL_PAGE_SIZE = 60;
const emptySupplementalManifest: SupplementalReferenceImageManifest = { imageCount: 0, images: [] };

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

const matchesSupplementalSearch = (image: SupplementalReferenceImage, searchTerm: string) => {
  const query = searchTerm.trim().toLowerCase();
  if (!query) return true;
  return [image.title, image.specialty, image.sourceDocument, image.sourceRelativePath, image.sourcePath, image.caption]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(query));
};

const ReferenceLibrary: React.FC<ReferenceLibraryProps> = ({ user }) => {
  const [focusIntent, setFocusIntent] = useState<ReferenceLibraryIntent | null>(null);
  const [selectedSignoutSpecialty, setSelectedSignoutSpecialty] = useState('GU Pathology Sign-Out Simulations');
  const [selectedSupplementalSpecialty, setSelectedSupplementalSpecialty] = useState('breast');
  const [supplementalSearch, setSupplementalSearch] = useState('');
  const [supplementalPage, setSupplementalPage] = useState(1);
  const [supplementalManifest, setSupplementalManifest] = useState<SupplementalReferenceImageManifest>(emptySupplementalManifest);
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
  const signoutCoverage = signoutImageReferenceIndex as {
    totalImages: number;
    presentImages: number;
    missingImages: number;
    generatedAt: string;
  };
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
  const supplementalPageCount = Math.max(1, Math.ceil(filteredSupplementalImages.length / SUPPLEMENTAL_PAGE_SIZE));
  const visibleSupplementalImages = useMemo(
    () => filteredSupplementalImages.slice((supplementalPage - 1) * SUPPLEMENTAL_PAGE_SIZE, supplementalPage * SUPPLEMENTAL_PAGE_SIZE),
    [filteredSupplementalImages, supplementalPage]
  );

  useEffect(() => {
    setFocusIntent(consumeReferenceLibraryIntent());
  }, []);

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
    setSupplementalPage(1);
  }, [selectedSupplementalSpecialty, supplementalSearch]);

  const focusPresets = [
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
      title: 'GU',
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

  const applyPreset = (preset: { title: string; description: string; focusTerms: string[] }) => {
    setFocusIntent({
      title: preset.title,
      summary: preset.description,
      focusTerms: preset.focusTerms,
      tutorialTopics: focusIntent?.tutorialTopics,
      syllabusTopics: focusIntent?.syllabusTopics,
      algorithmTopics: focusIntent?.algorithmTopics,
    });
  };

  return (
    <div className="animate-fade-in space-y-8">
      <SectionHeader 
        title="Reference Library"
        subtitle="Review histology and ancillary images for teaching and diagnostic comparison."
        icon={<BookOpenIcon className="h-10 w-10" />}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {atlasSummaries.map((summary) => (
          <Card key={summary.id}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Image set</p>
                <h2 className="mt-1 text-xl font-semibold font-serif text-slate-900">{summary.title}</h2>
                <p className="mt-2 text-sm text-slate-700">{summary.description}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-right">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Images</div>
                <div className="text-2xl font-semibold text-slate-900">{summary.imageCount}</div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {summary.highlightedTerms.map((term) => (
                <button
                  key={`${summary.id}-${term}`}
                  type="button"
                  onClick={() => applyPreset({ title: term, description: `${summary.title} preset`, focusTerms: [term.toLowerCase()] })}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                >
                  {term}
                </button>
              ))}
            </div>
          </Card>
        ))}
      </div>
      <Card>
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Diagnostic groups</p>
            <h2 className="mt-1 text-xl font-semibold font-serif text-slate-900">Focused review</h2>
            <p className="mt-2 text-sm text-slate-700">
              Open a focused set of images for differential diagnosis and lecture preparation.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {focusPresets.map((preset) => (
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
      </Card>
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Sign-out image library</p>
            <h2 className="mt-1 text-xl font-semibold font-serif text-slate-900">Local visual evidence for simulation cases</h2>
            <p className="mt-2 text-sm text-slate-700">
              {signoutCoverage.presentImages} of {signoutCoverage.totalImages} sign-out case images are stored locally.
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 px-4 py-3 text-right">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Missing</div>
            <div className="text-2xl font-semibold text-slate-900">{signoutCoverage.missingImages}</div>
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
              {specialty.replace(/ Pathology Sign-Out Simulations| Sign-Out Simulations/g, '')}
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
                <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
                  <span>{Math.round(image.bytes / 1024).toLocaleString()} KB local</span>
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
            <div className="text-2xl font-semibold text-slate-900">{filteredSupplementalImages.length.toLocaleString()}</div>
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
            placeholder="Search diagnosis, folder, source, or caption"
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
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleSupplementalImages.map((image) => (
            <article key={image.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <img
                src={supplementalImageSrc(image)}
                alt={supplementalCaption(image)}
                className="h-44 w-full bg-slate-100 object-cover"
                loading="lazy"
              />
              <div className="space-y-3 p-4">
                <div>
                  <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold capitalize text-slate-700">
                    {image.specialty.replace('-', ' ')}
                  </span>
                  <h3 className="mt-3 text-sm font-semibold leading-5 text-slate-950">{image.title}</h3>
                  <p className="mt-2 text-sm leading-5 text-slate-700">{supplementalCaption(image)}</p>
                </div>
                <div className="border-t border-slate-100 pt-3 text-xs leading-5 text-slate-500">
                  <div>{supplementalSourceLabel(image)}</div>
                  {image.sourceRelativePath && <div className="truncate" title={image.sourceRelativePath}>{image.sourceRelativePath}</div>}
                  <div>
                    {Math.round(image.bytes / 1024).toLocaleString()} KB {image.imageUrl ? 'external local' : 'local'} {image.extension.toUpperCase()}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </Card>
      {focusIntent && (
        <div className="rounded-2xl border border-sky-200 bg-sky-50 px-5 py-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Lecture focus</p>
              <h2 className="mt-1 text-xl font-semibold font-serif text-slate-900">{focusIntent.title ?? 'Module context'}</h2>
              {focusIntent.summary && <p className="mt-2 text-sm text-slate-700">{focusIntent.summary}</p>}
            </div>
            <button
              type="button"
              onClick={() => setFocusIntent(null)}
              className="rounded-full border border-sky-200 bg-white px-3 py-1.5 text-sm font-medium text-sky-800 transition hover:border-sky-300 hover:bg-sky-100"
            >
              Clear Focus
            </button>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
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
