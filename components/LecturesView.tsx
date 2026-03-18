import React, { useMemo, useState } from 'react';
import Card from './ui/Card';
import SectionHeader from './ui/SectionHeader';
import MarkdownContent from './ui/MarkdownContent';
import { AcademicCapIcon, ArrowPathIcon, DocumentTextIcon } from './icons';
import algorithmsData from '../src/content/algorithms/algorithms.normalized.json';
import lecturesData from '../src/content/lectures/lectures.normalized.json';
import { ImportedContentRecord, LectureEntityCard, LectureSlide } from '../types';

const lectures = lecturesData as ImportedContentRecord[];
const algorithms = algorithmsData as ImportedContentRecord[];

const LecturesView: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string>(lectures[0]?.id ?? '');
  const [query, setQuery] = useState('');

  const filteredLectures = useMemo(() => {
    const lowered = query.trim().toLowerCase();
    if (!lowered) {
      return lectures;
    }

    return lectures.filter((lecture) =>
      [lecture.title, lecture.category, lecture.summary]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(lowered))
    );
  }, [query]);

  const selectedLecture = filteredLectures.find((lecture) => lecture.id === selectedId) ?? filteredLectures[0];
  const entityCards = (selectedLecture?.provenance.entityCards as LectureEntityCard[] | undefined) ?? [];
  const slides = (selectedLecture?.slides as LectureSlide[] | undefined) ?? [];
  const relatedAlgorithms = useMemo(() => {
    if (!selectedLecture?.category) {
      return [];
    }
    return algorithms.filter((algorithm) => algorithm.category === selectedLecture.category);
  }, [selectedLecture]);

  return (
    <div className="animate-fade-in space-y-8">
      <SectionHeader
        title="Imported Lectures"
        subtitle="Read-only lecture transcripts, slide structure, and companion algorithms imported from curated source projects."
        icon={<AcademicCapIcon className="h-9 w-9" />}
      />

      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold font-serif text-slate-900">Lecture Library</h2>
            <p className="mt-1 text-sm text-slate-500">
              {lectures.length} lectures imported, {algorithms.length} companion algorithms preserved.
            </p>
          </div>
          <label className="block lg:w-96">
            <span className="sr-only">Search lectures</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search title, category, or summary"
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          </label>
        </div>
      </Card>

      <div className="grid gap-8 xl:grid-cols-[22rem_minmax(0,1fr)]">
        <div className="space-y-4">
          {filteredLectures.map((lecture) => {
            const isActive = lecture.id === selectedLecture?.id;
            return (
              <button
                key={lecture.id}
                type="button"
                onClick={() => setSelectedId(lecture.id)}
                className={`w-full rounded-xl border p-5 text-left shadow-sm transition-all ${
                  isActive
                    ? 'border-primary-400 bg-primary-50 shadow-primary-200/40'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">
                  {lecture.category ?? 'Lecture'}
                </p>
                <h3 className="mt-2 font-serif text-lg font-semibold text-slate-900">{lecture.title}</h3>
                {lecture.summary && <p className="mt-2 text-sm text-slate-600">{lecture.summary}</p>}
                <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
                  <span>{(lecture.provenance.slideCount as number | undefined) ?? 0} slides</span>
                  <span>{(lecture.provenance.entityCardsCount as number | undefined) ?? 0} entity cards</span>
                </div>
              </button>
            );
          })}
        </div>

        {selectedLecture ? (
          <div className="space-y-6">
            <Card>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-primary-700">
                    {selectedLecture.category ?? 'Lecture'}
                  </p>
                  <h2 className="mt-2 font-serif text-3xl font-semibold text-slate-900">{selectedLecture.title}</h2>
                  {selectedLecture.summary && <p className="mt-3 text-slate-600">{selectedLecture.summary}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
                  <div className="rounded-lg bg-slate-50 px-4 py-3">
                    <div className="font-semibold text-slate-900">Slides</div>
                    <div>{selectedLecture.provenance.slideCount as number | undefined ?? slides.length}</div>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-4 py-3">
                    <div className="font-semibold text-slate-900">Entity Cards</div>
                    <div>{selectedLecture.provenance.entityCardsCount as number | undefined ?? entityCards.length}</div>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <h3 className="mb-4 flex items-center text-xl font-semibold font-serif text-slate-900">
                <DocumentTextIcon className="mr-3 h-6 w-6 text-primary-600" />
                Transcript
              </h3>
              <MarkdownContent content={selectedLecture.body} />
            </Card>

            {slides.length > 0 && (
              <Card>
                <h3 className="mb-4 text-xl font-semibold font-serif text-slate-900">Slide Outline</h3>
                <div className="space-y-4">
                  {slides.map((slide, index) => (
                    <div key={`${slide.title ?? 'slide'}-${index}`} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="inline-flex rounded-full bg-primary-100 px-2.5 py-1 text-xs font-semibold text-primary-800">
                          Slide {index + 1}
                        </span>
                        {slide.type && (
                          <span className="inline-flex rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
                            {slide.type}
                          </span>
                        )}
                      </div>
                      <h4 className="mt-3 font-semibold text-slate-900">{slide.title ?? 'Untitled Slide'}</h4>
                      {slide.content && <MarkdownContent content={slide.content} className="mt-3 prose-sm" />}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {entityCards.length > 0 && (
              <Card>
                <h3 className="mb-4 text-xl font-semibold font-serif text-slate-900">Key Entities</h3>
                <div className="grid gap-4 lg:grid-cols-2">
                  {entityCards.map((card, index) => (
                    <div key={`${card.entityId ?? 'entity'}-${index}`} className="rounded-lg border border-slate-200 p-4">
                      <h4 className="font-semibold text-slate-900">{card.entityId ?? `Entity ${index + 1}`}</h4>
                      {card.summary && <p className="mt-2 text-sm text-slate-600">{card.summary}</p>}
                      {card.keyMorphology && card.keyMorphology.length > 0 && (
                        <div className="mt-3">
                          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Morphology</div>
                          <ul className="mt-2 space-y-1 text-sm text-slate-700">
                            {card.keyMorphology.slice(0, 4).map((item) => (
                              <li key={item} className="list-disc ml-5">{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {card.pearls && card.pearls.length > 0 && (
                        <div className="mt-3">
                          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pearls</div>
                          <ul className="mt-2 space-y-1 text-sm text-slate-700">
                            {card.pearls.slice(0, 3).map((pearl, pearlIndex) => (
                              <li key={`${pearl.text ?? 'pearl'}-${pearlIndex}`} className="list-disc ml-5">
                                {pearl.text}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {relatedAlgorithms.length > 0 && (
              <Card>
                <h3 className="mb-4 flex items-center text-xl font-semibold font-serif text-slate-900">
                  <ArrowPathIcon className="mr-3 h-6 w-6 text-primary-600" />
                  Related Algorithms
                </h3>
                <div className="space-y-4">
                  {relatedAlgorithms.map((algorithm) => (
                    <div key={algorithm.id} className="rounded-lg border border-slate-200 p-4">
                      <h4 className="font-semibold text-slate-900">{algorithm.title}</h4>
                      {algorithm.summary && <p className="mt-2 text-sm text-slate-600">{algorithm.summary}</p>}
                      <p className="mt-3 text-xs text-slate-500">
                        {(algorithm.provenance.nodeCount as number | undefined) ?? 0} nodes preserved in the imported algorithm graph.
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        ) : (
          <Card>
            <p className="text-slate-600">No lectures matched the current search.</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default LecturesView;
