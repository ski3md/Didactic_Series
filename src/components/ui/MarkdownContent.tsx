import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownContentProps {
  content: string;
  className?: string;
  variant?: 'default' | 'tutorial';
}

const SECTION_LABELS = [
  'Clinical Vignette',
  'Clinical_Vignette',
  'Objective',
  'Objectives',
  'Learning Objectives',
  'Case Discussion',
  'Case_Discussion',
  'Discussion',
  'Differential Diagnosis',
  'Diagnostic Workup',
  'Laboratory Findings',
  'Microscopic Findings',
  'Histologic Features',
  'Key Features',
  'Teaching Points',
  'Pearls',
  'Pitfall',
  'Pitfalls',
  'Management',
  'Final Diagnosis',
  'Gold Standard Report',
  'References',
];

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeImportedMarkdown = (content: string): string => {
  let normalized = content
    .replace(/\[\[([^\]|#]+)(?:#[^\]|]+)?\|([^\]]+)\]\]/g, '$2')
    .replace(/\[\[([^\]|#]+)(?:#[^\]]+)?\]\]/g, '$1')
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, '  ')
    .replace(/\bClinical_Vignette\b/g, 'Clinical Vignette')
    .replace(/\bCase_Discussion\b/g, 'Case Discussion')
    .replace(/([^\n])#{1,6}\s*(Objective|Objectives)\s*-\s*/gi, '$1\n\n## Learning Objectives\n\n- ')
    .replace(/(^|\n)(Objective|Objectives)\s*-\s*/gi, '$1## Learning Objectives\n\n- ');

  SECTION_LABELS.forEach((label) => {
    const readableLabel = label.replace(/_/g, ' ');
    const escaped = escapeRegExp(label);
    normalized = normalized
      .replace(new RegExp(`([^\\n])#{1,6}\\s*${escaped}\\s*[-:]?\\s*`, 'g'), `$1\n\n## ${readableLabel}\n\n`)
      .replace(new RegExp(`(^|\\n)#{1,6}\\s*${escaped}(?=\\S)`, 'g'), `$1## ${readableLabel}\n\n`)
      .replace(new RegExp(`(^|\\n)${escaped}(?=[A-Z0-9])`, 'g'), `$1## ${readableLabel}\n\n`)
      .replace(new RegExp(`\\s+${escaped}(?=[A-Z0-9])`, 'g'), `\n\n## ${readableLabel}\n\n`)
      .replace(new RegExp(`(^|\\n)${escaped}\\s*[-:]\\s*`, 'g'), `$1## ${readableLabel}\n\n`);
  });

  normalized = normalized
    .replace(/^#\s+(.+?)\s+Case Tutorial\s*$/gm, '# $1\n\n_Clinical case tutorial_')
    .replace(/^#{1,6}\s*(Objective|Objectives)$/gim, '## Learning Objectives')
    .replace(/^#{1,6}\s*(Case Discussion)$/gim, '## Case Discussion')
    .replace(/([.!?])\s*-\s+(?=[A-Z0-9])/g, '$1\n- ')
    .replace(/(## References\n\n)-\s+/g, '$1- ')
    .replace(/(\n## Learning Objectives\n\n)-\s+/g, '$1- ')
    .replace(/(\n-\s+[^\n]+?)\s+-\s+/g, '$1\n- ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return normalized;
};

const MarkdownContent: React.FC<MarkdownContentProps> = ({ content, className = '', variant = 'default' }) => {
  const isTutorial = variant === 'tutorial';
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

  return (
    <div className={`${baseClassName} ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          ...tutorialComponents,
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
        {normalizeImportedMarkdown(content)}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownContent;
