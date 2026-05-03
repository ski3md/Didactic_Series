import React, { useEffect, useMemo, useState } from 'react';
import Card from './ui/Card.tsx';
import SectionHeader from './ui/SectionHeader.tsx';
import MarkdownContent from './ui/MarkdownContent.tsx';
import { AcademicCapIcon, DocumentTextIcon } from './icons.tsx';
import { getSyllabusCategories, loadSyllabusTopics, type SyllabusTopicRecord } from '../utils/syllabusCatalog.ts';
import { consumeSyllabusIntent } from '../utils/syllabusNavigation.ts';

const SyllabusExplorer: React.FC = () => {
  const [topics, setTopics] = useState<SyllabusTopicRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const intent = consumeSyllabusIntent();
    const initialize = async () => {
      setIsLoading(true);
      const loadedTopics = await loadSyllabusTopics();
      if (!isMounted) {
        return;
      }
      setTopics(loadedTopics);
      setSelectedId(loadedTopics[0]?.id ?? '');
      if (intent?.query) {
        setQuery(intent.query);
      }
      if (intent?.category) {
        setCategoryFilter(intent.category);
      }
      if (intent?.selectedId) {
        setSelectedId(intent.selectedId);
      }
      setIsLoading(false);
    };
    initialize();
    return () => {
      isMounted = false;
    };
  }, []);

  const syllabusCategories = useMemo(() => getSyllabusCategories(topics), [topics]);

  const filteredTopics = useMemo(() => {
    const lowered = query.trim().toLowerCase();
    const scopedTopics =
      categoryFilter === 'all' ? topics : topics.filter((topic) => topic.category === categoryFilter);

    if (!lowered) {
      return scopedTopics;
    }

    return scopedTopics.filter((topic) =>
      [topic.title, topic.summary, topic.categoryLabel, ...topic.tags]
        .some((value) => value.toLowerCase().includes(lowered))
    );
  }, [categoryFilter, query]);

  const selectedTopic = filteredTopics.find((topic) => topic.id === selectedId) ?? filteredTopics[0];

  return (
    <div className="space-y-8 animate-fade-in">
      <SectionHeader
        title="Syllabus Explorer"
        subtitle="Search AP syllabus topics and review the related teaching objectives."
        icon={<AcademicCapIcon className="h-10 w-10" />}
      />

      <Card>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Search Topics</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search title, summary, tag, or category"
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Category</span>
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
            >
              <option value="all">All syllabus categories</option>
              {syllabusCategories.map((category) => (
                <option key={category.value} value={category.value}>{category.label}</option>
              ))}
            </select>
          </label>
        </div>
      </Card>

      {isLoading ? (
        <Card>
          <p className="text-slate-600">Loading syllabus topics...</p>
        </Card>
      ) : (
      <div className="grid gap-8 xl:grid-cols-[24rem_minmax(0,1fr)]">
        <div className="space-y-4">
          {filteredTopics.slice(0, 250).map((topic) => {
            const isActive = topic.id === selectedTopic?.id;
            return (
              <button
                key={topic.id}
                type="button"
                onClick={() => setSelectedId(topic.id)}
                className={`w-full rounded-xl border p-5 text-left shadow-sm transition-all ${
                  isActive
                    ? 'border-sky-400 bg-sky-50 shadow-sky-200/40'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                }`}
              >
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide">
                  <span className="text-sky-700">{topic.categoryLabel}</span>
                </div>
                <h3 className="mt-2 font-serif text-lg font-semibold text-slate-900">{topic.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{topic.summary}</p>
              </button>
            );
          })}
        </div>

        {selectedTopic ? (
          <div className="space-y-6">
            <Card>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">{selectedTopic.categoryLabel}</p>
                  </div>
                  <h2 className="mt-2 font-serif text-3xl font-semibold text-slate-900">{selectedTopic.title}</h2>
                  <p className="mt-3 text-slate-600">{selectedTopic.summary}</p>
                </div>
                <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  <div className="font-semibold text-slate-900">Tagged Terms</div>
                  <div>{selectedTopic.tags.length}</div>
                </div>
              </div>
              {selectedTopic.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedTopic.tags.slice(0, 10).map((tag) => (
                    <span key={tag} className="rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-800">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <h3 className="mb-4 flex items-center text-xl font-semibold font-serif text-slate-900">
                <DocumentTextIcon className="mr-3 h-6 w-6 text-sky-600" />
                Topic Detail
              </h3>
              <MarkdownContent content={selectedTopic.body || selectedTopic.summary} />
            </Card>
          </div>
        ) : (
          <Card>
            <p className="text-slate-600">No syllabus topics matched the current filters.</p>
          </Card>
        )}
      </div>
      )}
    </div>
  );
};

export default SyllabusExplorer;
