import React, { useEffect, useMemo, useState } from 'react';
import Card from './ui/Card';
import MarkdownContent from './ui/MarkdownContent';
import SectionHeader from './ui/SectionHeader';
import {
  AcademicCapIcon,
  ArrowPathIcon,
  CollectionIcon,
  DocumentTextIcon,
  PhotographIcon,
} from './icons';
import { ImportedContentRecord } from '../types';
import lecturesDataUrl from '../src/content/downloads_imports/normalized/lectures.normalized.json?url';
import tutorialsDataUrl from '../src/content/downloads_imports/normalized/tutorials.normalized.json?url';
import algorithmsDataUrl from '../src/content/downloads_imports/normalized/algorithms.normalized.json?url';
import imagesDataUrl from '../src/content/downloads_imports/normalized/images.normalized.json?url';
import primaryTutorialsDataUrl from '../src/content/tutorials/tutorials.normalized.json?url';
import {
  getCanonicalBoardPrepTutorials,
  getPromotedClinicalPathTutorials,
  getStagingDownloadsLectures,
  getStagingDownloadsTutorials,
} from '../utils/promotedContentRegistry';

type DownloadsTab = 'lectures' | 'tutorials' | 'algorithms' | 'images';
type TopicGroup = {
  category: string;
  records: ImportedContentRecord[];
};

interface DownloadsImageRecord {
  id: string;
  title: string;
  description: string;
  src: string;
  sourceRepo: string;
  sourcePath: string;
  category?: string | null;
  uploader?: string;
  timestamp?: number;
  entity?: string;
  difficulty?: string;
  tags?: string[];
  provenance?: Record<string, unknown>;
}

interface DownloadsLibraryState {
  lectures: ImportedContentRecord[];
  tutorials: ImportedContentRecord[];
  algorithms: ImportedContentRecord[];
  images: DownloadsImageRecord[];
}

interface PromotionSummary {
  hiddenLectures: number;
  hiddenTutorials: number;
}

const SOURCE_DISPLAY_NAMES: Record<string, string> = {
  'ioc-next-app': 'Core Principles Library',
  'abpath-advanced-board-prep-platform (3)': 'ABPath Board Prep',
  'cp-content-specification-tutorial-batch-ready': 'CP Tutorial Batch',
  'cp-content-specification-tutorial_11.11.25': 'CP Tutorial Cases',
  'pathology-learning-module_-granulomatous-diseases (3)': 'Granulomatous Teaching Module',
  'workspace-3418f879-7689-4224-9717-636b27130563': 'Microbiology Algorithm Set',
};

function getSourceDisplayName(sourceRepo: string): string {
  return SOURCE_DISPLAY_NAMES[sourceRepo] || sourceRepo;
}

const emptyState: DownloadsLibraryState = {
  lectures: [],
  tutorials: [],
  algorithms: [],
  images: [],
};

const tabConfig: Array<{
  id: DownloadsTab;
  label: string;
  icon: React.ReactNode;
}> = [
  { id: 'lectures', label: 'Lectures', icon: <AcademicCapIcon className="h-5 w-5" /> },
  { id: 'tutorials', label: 'Tutorials', icon: <CollectionIcon className="h-5 w-5" /> },
  { id: 'algorithms', label: 'Algorithms', icon: <ArrowPathIcon className="h-5 w-5" /> },
  { id: 'images', label: 'Images', icon: <PhotographIcon className="h-5 w-5" /> },
];

const DownloadsLibraryView: React.FC = () => {
  const [library, setLibrary] = useState<DownloadsLibraryState>(emptyState);
  const [promotionSummary, setPromotionSummary] = useState<PromotionSummary>({ hiddenLectures: 0, hiddenTutorials: 0 });
  const [activeTab, setActiveTab] = useState<DownloadsTab>('lectures');
  const [selectedId, setSelectedId] = useState('');
  const [query, setQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [facetFilter, setFacetFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const loadLibrary = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);

        const [lecturesResponse, tutorialsResponse, algorithmsResponse, imagesResponse, primaryTutorialsResponse] = await Promise.all([
          fetch(lecturesDataUrl),
          fetch(tutorialsDataUrl),
          fetch(algorithmsDataUrl),
          fetch(imagesDataUrl),
          fetch(primaryTutorialsDataUrl),
        ]);

        const responses = [
          ['lectures', lecturesResponse],
          ['tutorials', tutorialsResponse],
          ['algorithms', algorithmsResponse],
          ['images', imagesResponse],
          ['primaryTutorials', primaryTutorialsResponse],
        ] as const;

        const failedResponse = responses.find(([, response]) => !response.ok);
        if (failedResponse) {
          throw new Error(`Unable to load ${failedResponse[0]} dataset (${failedResponse[1].status})`);
        }

        const [lectures, tutorials, algorithms, images, primaryTutorials] = await Promise.all([
          lecturesResponse.json() as Promise<ImportedContentRecord[]>,
          tutorialsResponse.json() as Promise<ImportedContentRecord[]>,
          algorithmsResponse.json() as Promise<ImportedContentRecord[]>,
          imagesResponse.json() as Promise<DownloadsImageRecord[]>,
          primaryTutorialsResponse.json() as Promise<ImportedContentRecord[]>,
        ]);

        const promotedClinicalPathTutorials = getPromotedClinicalPathTutorials(tutorials);
        const canonicalPrimaryTutorials = [
          ...promotedClinicalPathTutorials,
          ...getCanonicalBoardPrepTutorials(primaryTutorials, promotedClinicalPathTutorials),
        ];
        const stagedLectures = getStagingDownloadsLectures(lectures);
        const stagedTutorials = getStagingDownloadsTutorials(tutorials, canonicalPrimaryTutorials);

        if (!isCancelled) {
          setLibrary({ lectures: stagedLectures, tutorials: stagedTutorials, algorithms, images });
          setPromotionSummary({
            hiddenLectures: lectures.length - stagedLectures.length,
            hiddenTutorials: tutorials.length - stagedTutorials.length,
          });
          setSelectedId(
            (currentId) => currentId || stagedLectures[0]?.id || stagedTutorials[0]?.id || algorithms[0]?.id || images[0]?.id || ''
          );
        }
      } catch (error) {
        if (!isCancelled) {
          setLoadError(error instanceof Error ? error.message : 'Unable to load Downloads library.');
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadLibrary();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    setSourceFilter('all');
    setFacetFilter('all');
    setSelectedId('');
  }, [activeTab]);

  const lectureTopicGroups = useMemo<TopicGroup[]>(() => {
    return Object.entries(
      library.lectures.reduce<Record<string, ImportedContentRecord[]>>((groups, lecture) => {
        const key = lecture.category ?? 'Uncategorized';
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(lecture);
        return groups;
      }, {})
    )
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([category, records]) => ({
        category,
        records: records.sort((left, right) => left.title.localeCompare(right.title)),
      }));
  }, [library.lectures]);

  const activeDataset = useMemo(() => {
    if (activeTab === 'lectures') {
      return library.lectures;
    }
    if (activeTab === 'tutorials') {
      return library.tutorials;
    }
    if (activeTab === 'algorithms') {
      return library.algorithms;
    }
    return library.images;
  }, [activeTab, library]);

  const sourceOptions = useMemo(() => {
    return ['all', ...new Set(activeDataset.map((record) => record.sourceRepo).filter(Boolean))];
  }, [activeDataset]);

  const facetMeta = useMemo(() => {
    if (activeTab === 'images') {
      const options = ['all', ...new Set(library.images.map((image) => image.entity).filter(Boolean) as string[])];
      return { label: 'Entity', options };
    }

    if (activeTab === 'lectures') {
      const options = ['all', ...lectureTopicGroups.map((group) => group.category)];
      return { label: 'Topic', options };
    }

    const options = ['all', ...new Set(
      (activeDataset as ImportedContentRecord[])
        .map((record) => record.category)
        .filter(Boolean) as string[]
    )];
    return { label: 'Category', options };
  }, [activeDataset, activeTab, lectureTopicGroups, library.images]);

  useEffect(() => {
    if (activeTab !== 'lectures' || lectureTopicGroups.length === 0 || facetFilter !== 'all') {
      return;
    }
    setFacetFilter(lectureTopicGroups[0].category);
  }, [activeTab, facetFilter, lectureTopicGroups]);

  const filteredContent = useMemo(() => {
    const lowered = query.trim().toLowerCase();
    const filterText = (value?: string | null) => (value ?? '').toLowerCase().includes(lowered);

    if (activeTab === 'lectures') {
      return library.lectures.filter((record) => {
        if (sourceFilter !== 'all' && record.sourceRepo !== sourceFilter) {
          return false;
        }
        if (facetFilter !== 'all' && record.category !== facetFilter) {
          return false;
        }
        if (!lowered) {
          return true;
        }
        return [record.title, record.category, record.summary, record.body].some((value) => filterText(value));
      });
    }

    if (activeTab === 'tutorials') {
      return library.tutorials.filter((record) => {
        if (sourceFilter !== 'all' && record.sourceRepo !== sourceFilter) {
          return false;
        }
        if (facetFilter !== 'all' && record.category !== facetFilter) {
          return false;
        }
        if (!lowered) {
          return true;
        }
        return [record.title, record.category, record.summary, record.body].some((value) => filterText(value));
      });
    }

    if (activeTab === 'algorithms') {
      return library.algorithms.filter((record) => {
        if (sourceFilter !== 'all' && record.sourceRepo !== sourceFilter) {
          return false;
        }
        if (facetFilter !== 'all' && record.category !== facetFilter) {
          return false;
        }
        if (!lowered) {
          return true;
        }
        return [record.title, record.category, record.summary, record.body].some((value) => filterText(value));
      });
    }

    return library.images.filter((image) => {
      if (sourceFilter !== 'all' && image.sourceRepo !== sourceFilter) {
        return false;
      }
      if (facetFilter !== 'all' && image.entity !== facetFilter) {
        return false;
      }
      if (!lowered) {
        return true;
      }
      return [image.title, image.description, image.entity, image.category, ...(image.tags ?? [])]
        .some((value) => filterText(value));
    });
  }, [activeTab, facetFilter, library, query, sourceFilter]);

  useEffect(() => {
    if (filteredContent.length === 0) {
      setSelectedId('');
      return;
    }

    const hasSelection = filteredContent.some((record) => record.id === selectedId);
    if (!hasSelection) {
      setSelectedId(filteredContent[0].id);
    }
  }, [filteredContent, selectedId]);

  const selectedRecord = filteredContent.find((record) => record.id === selectedId) ?? filteredContent[0];
  const selectedLectureTriad = activeTab === 'lectures'
    ? ((selectedRecord as ImportedContentRecord | undefined)?.provenance.triad as string[] | undefined) ?? []
    : [];

  const datasetCounts = {
    lectures: library.lectures.length,
    tutorials: library.tutorials.length,
    algorithms: library.algorithms.length,
    images: library.images.length,
  };

  return (
    <div className="animate-fade-in space-y-8">
      <SectionHeader
        title="Downloads Library"
        subtitle="Read-only lecture, tutorial, algorithm, and image content imported from structured project folders in Downloads."
        icon={<CollectionIcon className="h-9 w-9" />}
      />

      <Card>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
          <div>
            <h2 className="text-xl font-semibold font-serif text-slate-900">Staged Imports</h2>
            <p className="mt-1 text-sm text-slate-500">
              {library.lectures.length} staged lectures, {library.tutorials.length} staged tutorials, {library.algorithms.length} algorithm, and {library.images.length} image records remain after canonical promotions.
            </p>
          </div>
          <label className="block">
            <span className="sr-only">Search imported Downloads content</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search title, summary, entity, or content"
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          </label>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Source Repo</span>
            <select
              value={sourceFilter}
              onChange={(event) => setSourceFilter(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            >
              {sourceOptions.map((option) => (
                <option key={option} value={option}>
                  {option === 'all' ? 'All sources' : getSourceDisplayName(option)}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">{facetMeta.label}</span>
            <select
              value={facetFilter}
              onChange={(event) => setFacetFilter(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            >
              {facetMeta.options.map((option) => (
                <option key={option} value={option}>
                  {option === 'all' ? `All ${facetMeta.label.toLowerCase()} values` : option}
                </option>
              ))}
            </select>
          </label>
        </div>
        {(promotionSummary.hiddenLectures > 0 || promotionSummary.hiddenTutorials > 0) && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {promotionSummary.hiddenLectures} promoted lectures and {promotionSummary.hiddenTutorials} tutorial duplicates are hidden from staging because
            they now live on the main didactic surfaces.
          </div>
        )}
        {activeTab === 'lectures' && lectureTopicGroups.length > 0 && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
              <div>
                <h3 className="font-serif text-lg font-semibold text-slate-900">Topic Navigator</h3>
                <p className="text-sm text-slate-600">
                  The lecture staging area is now organized by pathology topic instead of a flat import list.
                </p>
              </div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {lectureTopicGroups.length} promoted topic buckets detected
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              {lectureTopicGroups.map((group) => {
                const isActive = facetFilter === group.category;
                return (
                  <button
                    key={group.category}
                    type="button"
                    onClick={() => setFacetFilter(group.category)}
                    className={`rounded-xl border px-4 py-3 text-left transition ${
                      isActive
                        ? 'border-primary-400 bg-primary-50 text-primary-900'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-semibold">{group.category}</div>
                    <div className="mt-1 text-xs text-slate-500">{group.records.length} lecture{group.records.length === 1 ? '' : 's'}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
          <span className="rounded-full bg-slate-100 px-3 py-1">{filteredContent.length} matches in current tab</span>
          {sourceFilter !== 'all' && (
            <span className="rounded-full bg-primary-50 px-3 py-1 text-primary-800">Source: {sourceFilter}</span>
          )}
          {facetFilter !== 'all' && (
            <span className="rounded-full bg-primary-50 px-3 py-1 text-primary-800">{facetMeta.label}: {facetFilter}</span>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          {tabConfig.map((tab) => {
            const isActive = tab.id === activeTab;
            const count = datasetCounts[tab.id];
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-primary-500 bg-primary-50 text-primary-900'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:text-slate-900'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs text-slate-600">{count}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {isLoading && (
        <Card>
          <p className="text-slate-600">Loading Downloads library...</p>
        </Card>
      )}

      {loadError && !isLoading && (
        <Card>
          <p className="text-red-700">{loadError}</p>
        </Card>
      )}

      {!isLoading && !loadError && activeTab !== 'images' && (
        <div className="grid gap-8 xl:grid-cols-[22rem_minmax(0,1fr)]">
          <div className="space-y-4">
            {(filteredContent as ImportedContentRecord[]).map((record) => {
              const isActive = record.id === selectedRecord?.id;
              return (
                <button
                  key={record.id}
                  type="button"
                  onClick={() => setSelectedId(record.id)}
                  className={`w-full rounded-xl border p-5 text-left shadow-sm transition-all ${
                    isActive
                      ? 'border-primary-400 bg-primary-50 shadow-primary-200/40'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                  }`}
                >
                  {record.category && (
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">{record.category}</p>
                  )}
                  <h3 className="mt-2 font-serif text-lg font-semibold text-slate-900">{record.title}</h3>
                  {record.summary && <p className="mt-2 text-sm text-slate-600">{record.summary}</p>}
                  <p className="mt-4 text-xs text-slate-500">{getSourceDisplayName(record.sourceRepo)}</p>
                </button>
              );
            })}
          </div>

          {selectedRecord ? (
            <div className="space-y-6">
              <Card>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    {selectedRecord.category && (
                      <p className="text-sm font-semibold uppercase tracking-wide text-primary-700">
                        {selectedRecord.category}
                      </p>
                    )}
                    <h2 className="mt-2 font-serif text-3xl font-semibold text-slate-900">{selectedRecord.title}</h2>
                    {selectedRecord.summary && <p className="mt-3 text-slate-600">{selectedRecord.summary}</p>}
                  </div>
                  <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    <div className="font-semibold text-slate-900">Source</div>
                    <div>{getSourceDisplayName(selectedRecord.sourceRepo)}</div>
                  </div>
                </div>
              </Card>

              {activeTab === 'lectures' && selectedLectureTriad.length > 0 && (
                <Card>
                  <h3 className="mb-4 flex items-center text-xl font-semibold font-serif text-slate-900">
                    <AcademicCapIcon className="mr-3 h-6 w-6 text-primary-600" />
                    Topic Anchors
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {selectedLectureTriad.map((item) => (
                      <span
                        key={item}
                        className="inline-flex rounded-full bg-primary-100 px-3 py-1.5 text-sm font-semibold text-primary-800"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </Card>
              )}

              <Card>
                <h3 className="mb-4 flex items-center text-xl font-semibold font-serif text-slate-900">
                  <DocumentTextIcon className="mr-3 h-6 w-6 text-primary-600" />
                  Content
                </h3>
                <MarkdownContent content={selectedRecord.body} />
              </Card>

              {activeTab === 'algorithms' && (
                <Card>
                  <h3 className="mb-4 flex items-center text-xl font-semibold font-serif text-slate-900">
                    <ArrowPathIcon className="mr-3 h-6 w-6 text-primary-600" />
                    Preserved Graph Metadata
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      <div className="font-semibold text-slate-900">Node Count</div>
                      <div>{(selectedRecord.provenance.nodeCount as number | undefined) ?? 0}</div>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      <div className="font-semibold text-slate-900">Source Path</div>
                      <div className="break-all">{selectedRecord.sourcePath}</div>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <p className="text-slate-600">
                {activeTab === 'lectures' && library.lectures.length === 0
                  ? 'All Downloads lectures have already been promoted into the main Lectures surface.'
                  : activeTab === 'tutorials' && library.tutorials.length === 0
                    ? 'All overlapping Downloads tutorials have either been promoted or deduplicated out of staging.'
                    : `No ${activeTab} matched the current search.`}
              </p>
            </Card>
          )}
        </div>
      )}

      {!isLoading && !loadError && activeTab === 'images' && (
        filteredContent.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {(filteredContent as DownloadsImageRecord[]).map((image) => (
              <Card key={image.id} className="overflow-hidden">
                <img
                  src={image.src}
                  alt={image.title}
                  className="h-52 w-full rounded-xl object-cover"
                  loading="lazy"
                />
                <div className="mt-4">
                  <div className="flex flex-wrap gap-2">
                    {image.entity && (
                      <span className="inline-flex rounded-full bg-primary-100 px-2.5 py-1 text-xs font-semibold text-primary-800">
                        {image.entity}
                      </span>
                    )}
                    {image.category && (
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                        {image.category}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-3 font-serif text-lg font-semibold text-slate-900">{image.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{image.description}</p>
                  <div className="mt-4 space-y-1 text-xs text-slate-500">
                    <p>Source: {getSourceDisplayName(image.sourceRepo)}</p>
                    {image.difficulty && <p>Difficulty: {image.difficulty}</p>}
                    {image.uploader && <p>Uploader: {image.uploader}</p>}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <p className="text-slate-600">No images matched the current search.</p>
          </Card>
        )
      )}
    </div>
  );
};

export default DownloadsLibraryView;
