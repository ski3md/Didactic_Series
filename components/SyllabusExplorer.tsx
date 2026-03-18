import React, { useEffect, useMemo, useState } from 'react';
import Card from './ui/Card';
import SectionHeader from './ui/SectionHeader';
import { BookOpenIcon } from './icons';
import { ImportedContentRecord, SyllabusTopicProvenance } from '../types';
import syllabusDataUrl from '../src/content/syllabus/syllabus.normalized.json?url';

const SyllabusExplorer: React.FC = () => {
  const [syllabusTopics, setSyllabusTopics] = useState<ImportedContentRecord[]>([]);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const loadSyllabus = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);

        const response = await fetch(syllabusDataUrl);
        if (!response.ok) {
          throw new Error(`Unable to load syllabus index (${response.status})`);
        }

        const data = (await response.json()) as ImportedContentRecord[];
        if (!isCancelled) {
          setSyllabusTopics(data);
          setSelectedId((currentId) => currentId || data[0]?.id || '');
        }
      } catch (error) {
        if (!isCancelled) {
          setLoadError(error instanceof Error ? error.message : 'Unable to load syllabus index.');
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadSyllabus();

    return () => {
      isCancelled = true;
    };
  }, []);

  const filteredTopics = useMemo(() => {
    const lowered = query.trim().toLowerCase();
    if (!lowered) {
      return syllabusTopics.slice(0, 200);
    }

    return syllabusTopics
      .filter((topic) =>
        [topic.title, topic.category, topic.summary]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(lowered))
      )
      .slice(0, 200);
  }, [query, syllabusTopics]);

  useEffect(() => {
    if (filteredTopics.length === 0) {
      return;
    }

    const hasSelectedTopic = filteredTopics.some((topic) => topic.id === selectedId);
    if (!hasSelectedTopic) {
      setSelectedId(filteredTopics[0].id);
    }
  }, [filteredTopics, selectedId]);

  const selectedTopic = filteredTopics.find((topic) => topic.id === selectedId) ?? filteredTopics[0];
  const provenance = (selectedTopic?.provenance as SyllabusTopicProvenance | undefined) ?? {};

  return (
    <div className="animate-fade-in space-y-8">
      <SectionHeader
        title="Syllabus Explorer"
        subtitle="Canonical parsed syllabus topics imported from the dedicated syllabus project for read-only browsing and search."
        icon={<BookOpenIcon className="h-9 w-9" />}
      />

      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold font-serif text-slate-900">Parsed Topic Index</h2>
            <p className="mt-1 text-sm text-slate-500">
              {syllabusTopics.length} syllabus topics imported. Results are capped to 200 per query for fast navigation.
            </p>
          </div>
          <label className="block lg:w-96">
            <span className="sr-only">Search syllabus topics</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search title, path, or category"
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          </label>
        </div>
      </Card>

      {isLoading && (
        <Card>
          <p className="text-slate-600">Loading syllabus index...</p>
        </Card>
      )}

      {loadError && !isLoading && (
        <Card>
          <p className="text-red-700">{loadError}</p>
        </Card>
      )}

      {!isLoading && !loadError && (
        <div className="grid gap-8 xl:grid-cols-[24rem_minmax(0,1fr)]">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <div className="text-sm font-semibold text-slate-900">Topic Results</div>
            </div>
            <div className="max-h-[70vh] overflow-y-auto">
              {filteredTopics.map((topic) => (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => setSelectedId(topic.id)}
                  className={`w-full border-b border-slate-100 px-5 py-4 text-left transition-colors last:border-b-0 ${
                    topic.id === selectedTopic?.id ? 'bg-primary-50' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="text-sm font-semibold text-slate-900">{topic.title}</div>
                  {topic.summary && <div className="mt-1 text-xs text-slate-500">{topic.summary}</div>}
                  {topic.category && <div className="mt-2 text-xs font-medium text-primary-700">{topic.category}</div>}
                </button>
              ))}
            </div>
          </div>

          {selectedTopic ? (
            <Card>
              <p className="text-sm font-semibold uppercase tracking-wide text-primary-700">
                {selectedTopic.category ?? 'Syllabus Topic'}
              </p>
              <h2 className="mt-2 font-serif text-3xl font-semibold text-slate-900">{selectedTopic.title}</h2>
              {selectedTopic.summary && <p className="mt-3 text-slate-600">{selectedTopic.summary}</p>}

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <div className="rounded-lg bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Difficulty</div>
                  <div className="mt-2 text-sm text-slate-800">{provenance.difficulty ?? 'Unspecified'}</div>
                </div>
                <div className="rounded-lg bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Level</div>
                  <div className="mt-2 text-sm text-slate-800">{provenance.level ?? 'Unspecified'}</div>
                </div>
                <div className="rounded-lg bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Parent Topic</div>
                  <div className="mt-2 text-sm text-slate-800">{provenance.parent_topic_id ?? 'Root topic'}</div>
                </div>
                <div className="rounded-lg bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Source Line</div>
                  <div className="mt-2 text-sm text-slate-800">{provenance.source_line ?? 'Unknown'}</div>
                </div>
              </div>

              <div className="mt-8 rounded-lg border border-slate-200 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Path Context</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(provenance.path_context ?? []).map((segment) => (
                    <span
                      key={segment}
                      className="inline-flex rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-800"
                    >
                      {segment}
                    </span>
                  ))}
                </div>
              </div>
            </Card>
          ) : (
            <Card>
              <p className="text-slate-600">No syllabus topics matched the current search.</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default SyllabusExplorer;
