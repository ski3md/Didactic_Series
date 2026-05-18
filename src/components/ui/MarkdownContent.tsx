import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { normalizeImportedTeachingMarkdown, parseTeachingSections } from '../../utils/teachingSessionContent.ts';

interface MarkdownContentProps {
  content: string;
  className?: string;
  variant?: 'default' | 'tutorial' | 'lecture';
}

const MarkdownContent: React.FC<MarkdownContentProps> = ({ content, className = '', variant = 'default' }) => {
  const isTutorial = variant === 'tutorial';
  const isLecture = variant === 'lecture';
  const normalizedContent = normalizeImportedTeachingMarkdown(content);
  const sections = isLecture ? parseTeachingSections(content) : [];
  const learningObjectives = isLecture
    ? sections
        .filter((section) => section.kind === 'objectives')
        .flatMap((section) => section.bulletItems)
        .slice(0, 5)
    : [];
  const teachingPoints = isLecture
    ? sections
        .filter((section) => ['teaching-points', 'pitfalls', 'diagnosis'].includes(section.kind))
        .flatMap((section) => section.bulletItems)
        .slice(0, 5)
    : [];
  const baseClassName = isTutorial
    ? [
        'prose prose-slate max-w-none',
        'prose-headings:font-serif prose-headings:text-slate-950',
        'prose-h1:mb-4 prose-h1:text-3xl prose-h1:font-semibold',
        'prose-h2:mt-8 prose-h2:border-t prose-h2:border-slate-200 prose-h2:pt-5 prose-h2:text-xl prose-h2:font-semibold',
        'prose-h3:mt-6 prose-h3:text-base prose-h3:font-semibold prose-h3:text-slate-900',
        'prose-p:my-3 prose-p:text-[1rem] prose-p:leading-7 prose-p:text-slate-700',
        'prose-li:my-1 prose-li:text-slate-700 prose-li:leading-7',
        'prose-ul:my-3 prose-ul:pl-5',
        'prose-strong:font-semibold prose-strong:text-slate-950',
        'prose-em:text-slate-500 prose-em:not-italic',
      ].join(' ')
    : isLecture
      ? [
          'prose prose-slate max-w-none',
          'prose-headings:font-serif prose-headings:text-slate-950',
          'prose-h3:mt-6 prose-h3:text-lg prose-h3:font-semibold prose-h3:text-slate-950',
          'prose-p:my-3 prose-p:text-[1rem] prose-p:leading-7 prose-p:text-slate-700',
          'prose-li:my-1 prose-li:text-slate-700 prose-li:leading-7',
          'prose-ul:my-3 prose-ul:pl-5',
          'prose-ol:my-3 prose-ol:pl-5',
          'prose-strong:font-semibold prose-strong:text-slate-950',
          'prose-blockquote:border-l-sky-300 prose-blockquote:text-slate-700',
        ].join(' ')
    : 'prose prose-slate max-w-none prose-headings:font-serif prose-headings:text-slate-900 prose-p:text-slate-700 prose-li:text-slate-700 prose-strong:text-slate-900';
  const tutorialComponents = isTutorial
    ? {
        h1: ({ ...props }) => (
          <h1 {...props} className="mb-5 font-serif text-3xl font-semibold leading-tight text-slate-950" />
        ),
        h2: ({ ...props }) => (
          <h2
            {...props}
            className="mt-8 border-t border-slate-200 pt-5 font-serif text-xl font-semibold leading-snug text-slate-950"
          />
        ),
        h3: ({ ...props }) => (
          <h3 {...props} className="mt-6 text-base font-semibold leading-snug text-slate-900" />
        ),
        p: ({ ...props }) => (
          <p {...props} className="my-3 text-[1rem] leading-7 text-slate-700" />
        ),
        ul: ({ ...props }) => (
          <ul {...props} className="my-4 list-disc space-y-2 pl-6 text-slate-700" />
        ),
        ol: ({ ...props }) => (
          <ol {...props} className="my-4 list-decimal space-y-2 pl-6 text-slate-700" />
        ),
        li: ({ ...props }) => (
          <li {...props} className="pl-1 text-[1rem] leading-7 text-slate-700" />
        ),
        strong: ({ ...props }) => (
          <strong {...props} className="font-semibold text-slate-950" />
        ),
      }
    : {};
  const lectureComponents = isLecture
    ? {
        h3: ({ ...props }) => (
          <h3 {...props} className="mt-6 font-serif text-lg font-semibold leading-snug text-slate-950" />
        ),
        p: ({ ...props }) => (
          <p {...props} className="my-3 text-[1rem] leading-7 text-slate-700" />
        ),
        ul: ({ ...props }) => (
          <ul {...props} className="my-4 list-disc space-y-2 pl-6 text-slate-700" />
        ),
        ol: ({ ...props }) => (
          <ol {...props} className="my-4 list-decimal space-y-2 pl-6 text-slate-700" />
        ),
        li: ({ ...props }) => (
          <li {...props} className="pl-1 text-[1rem] leading-7 text-slate-700" />
        ),
        strong: ({ ...props }) => (
          <strong {...props} className="font-semibold text-slate-950" />
        ),
      }
    : {};
  const markdownComponents = {
    ...tutorialComponents,
    ...lectureComponents,
    a: ({ ...props }) => (
      <a
        {...props}
        className="text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-800"
        target="_blank"
        rel="noreferrer"
      />
    ),
  };

  if (isLecture) {
    return (
      <div className={`space-y-6 ${className}`}>
        <section className="rounded-xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Teaching note view</div>
              <h4 className="mt-2 font-serif text-2xl font-semibold text-slate-950">Session guide</h4>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                The imported narrative is reorganized into faculty-friendly sections so you can skim the teaching arc before reading the full notes.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 xl:min-w-[20rem]">
              <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sections</div>
                <div className="mt-2 text-2xl font-semibold text-slate-950">{sections.length}</div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Objectives</div>
                <div className="mt-2 text-2xl font-semibold text-slate-950">{learningObjectives.length}</div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Teaching points</div>
                <div className="mt-2 text-2xl font-semibold text-slate-950">{teachingPoints.length}</div>
              </div>
            </div>
          </div>

          {sections.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:text-slate-900"
                >
                  {section.title}
                </a>
              ))}
            </div>
          )}
        </section>

        {(learningObjectives.length > 0 || teachingPoints.length > 0) && (
          <section className="grid gap-4 lg:grid-cols-2">
            {learningObjectives.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Learner objectives</div>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
                  {learningObjectives.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-sky-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {teachingPoints.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Faculty emphasis</div>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
                  {teachingPoints.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-amber-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        <div className="space-y-4">
          {sections.map((section) => (
            <section key={section.id} id={section.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Section</div>
              <h4 className="mt-2 font-serif text-2xl font-semibold text-slate-950">{section.title}</h4>
              <div className={`${baseClassName} mt-4`}>
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {section.content}
                </ReactMarkdown>
              </div>
            </section>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`${baseClassName} ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
      >
        {normalizedContent}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownContent;
