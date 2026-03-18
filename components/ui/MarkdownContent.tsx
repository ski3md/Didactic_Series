import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

const normalizeImportedMarkdown = (content: string): string => {
  return content
    .replace(/\[\[([^\]|#]+)(?:#[^\]|]+)?\|([^\]]+)\]\]/g, '$2')
    .replace(/\[\[([^\]|#]+)(?:#[^\]]+)?\]\]/g, '$1');
};

const MarkdownContent: React.FC<MarkdownContentProps> = ({ content, className = '' }) => {
  const normalizedContent = normalizeImportedMarkdown(content);

  return (
    <div className={`prose prose-slate max-w-none prose-headings:font-serif prose-headings:text-slate-900 prose-p:text-slate-700 prose-li:text-slate-700 prose-strong:text-slate-900 ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ ...props }) => (
            <a
              {...props}
              className="text-primary-700 underline decoration-primary-300 underline-offset-2 hover:text-primary-800"
              target="_blank"
              rel="noreferrer"
            />
          ),
          code: ({ inline, className: codeClassName, children, ...props }) => {
            if (inline) {
              return (
                <code
                  {...props}
                  className={`rounded bg-slate-100 px-1.5 py-0.5 text-sm text-slate-800 ${codeClassName ?? ''}`}
                >
                  {children}
                </code>
              );
            }
            return (
              <code {...props} className={codeClassName}>
                {children}
              </code>
            );
          },
          table: ({ ...props }) => (
            <div className="overflow-x-auto">
              <table {...props} />
            </div>
          ),
        }}
      >
        {normalizedContent}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownContent;
