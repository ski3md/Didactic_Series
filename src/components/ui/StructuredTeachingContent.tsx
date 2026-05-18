import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { parseTeachingSections, type TeachingSection } from '../../utils/teachingSessionContent.ts';

interface StructuredTeachingContentProps {
  content: string;
  className?: string;
  compact?: boolean;
}

const sectionTone: Record<TeachingSection['kind'], string> = {
  intro: 'border-slate-200 bg-slate-50',
  vignette: 'border-sky-200 bg-sky-50',
  objectives: 'border-emerald-200 bg-emerald-50',
  discussion: 'border-slate-200 bg-white',
  workup: 'border-violet-200 bg-violet-50',
  findings: 'border-amber-200 bg-amber-50',
  'teaching-points': 'border-cyan-200 bg-cyan-50',
  pitfalls: 'border-rose-200 bg-rose-50',
  management: 'border-indigo-200 bg-indigo-50',
  diagnosis: 'border-teal-200 bg-teal-50',
  references: 'border-slate-200 bg-slate-50',
  general: 'border-slate-200 bg-white',
};

const renderMarkdown = (content: string, className = '') => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    components={{
      p: ({ ...props }) => <p {...props} className={`text-sm leading-7 text-slate-700 ${className}`} />,
      ul: ({ ...props }) => <ul {...props} className="space-y-2 pl-5 text-sm text-slate-700 list-disc" />,
      ol: ({ ...props }) => <ol {...props} className="space-y-2 pl-5 text-sm text-slate-700 list-decimal" />,
      li: ({ ...props }) => <li {...props} className="leading-7" />,
      strong: ({ ...props }) => <strong {...props} className="font-semibold text-slate-950" />,
      a: ({ ...props }) => (
        <a
          {...props}
          className="text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-800"
          target="_blank"
          rel="noreferrer"
        />
      ),
    }}
  >
    {content}
  </ReactMarkdown>
);

const StructuredTeachingContent: React.FC<StructuredTeachingContentProps> = ({ content, className = '', compact = false }) => {
  const sections = useMemo(() => parseTeachingSections(content), [content]);
  const intro = sections.find((section) => section.kind === 'intro');
  const primarySections = sections.filter((section) => section.kind !== 'intro');

  if (sections.length <= 1) {
    return <div className={className}>{renderMarkdown(content)}</div>;
  }

  return (
    <div className={`space-y-5 ${className}`}>
      {intro && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Session overview</div>
          <div className="mt-3 max-w-4xl">{renderMarkdown(intro.content)}</div>
        </section>
      )}

      <div className="flex flex-wrap gap-2">
        {primarySections.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
          >
            {section.title}
          </a>
        ))}
      </div>

      <div className={`grid gap-4 ${compact ? 'lg:grid-cols-1' : 'lg:grid-cols-2'}`}>
        {primarySections.map((section) => {
          const isListSection =
            section.kind === 'objectives' ||
            section.kind === 'teaching-points' ||
            section.kind === 'pitfalls' ||
            section.kind === 'references';

          return (
            <section
              key={section.id}
              id={section.id}
              className={`rounded-2xl border p-5 shadow-sm ${sectionTone[section.kind]} ${
                section.kind === 'discussion' && !compact ? 'lg:col-span-2' : ''
              }`}
            >
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                {section.kind.replace(/-/g, ' ')}
              </div>
              <h3 className="mt-2 font-serif text-xl font-semibold text-slate-950">{section.title}</h3>
              {isListSection && section.bulletItems.length > 0 ? (
                <ul className="mt-4 space-y-3">
                  {section.bulletItems.map((item) => (
                    <li key={`${section.id}-${item}`} className="flex gap-3 text-sm leading-7 text-slate-700">
                      <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-slate-400" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-4 max-w-none">{renderMarkdown(section.content)}</div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
};

export default StructuredTeachingContent;
