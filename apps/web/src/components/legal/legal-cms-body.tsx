import type { JSX } from 'react';

interface LegalCmsBodyProps {
  content: string;
}

/** Renders admin-managed legal text (plain paragraphs, ## headings, - bullets). */
export function LegalCmsBody({ content }: LegalCmsBodyProps): JSX.Element {
  const blocks = content
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <div className="space-y-5 text-base leading-7 text-ink-muted dark:text-slate-300">
      {blocks.map((block, index) => {
        if (block.startsWith('## ')) {
          return (
            <h2
              key={`h-${index}`}
              className="scroll-mt-28 text-xl font-bold text-ink dark:text-white sm:text-2xl"
            >
              {block.slice(3).trim()}
            </h2>
          );
        }

        const lines = block.split('\n').map((line) => line.trim());
        if (lines.every((line) => line.startsWith('- ') || line.startsWith('• '))) {
          return (
            <ul key={`ul-${index}`} className="list-disc space-y-2 ps-5">
              {lines.map((line, lineIndex) => (
                <li key={`li-${index}-${lineIndex}`}>{line.replace(/^[-•]\s+/, '')}</li>
              ))}
            </ul>
          );
        }

        return (
          <p key={`p-${index}`} className="whitespace-pre-wrap">
            {block}
          </p>
        );
      })}
    </div>
  );
}
