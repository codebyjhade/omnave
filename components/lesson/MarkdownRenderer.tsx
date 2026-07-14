"use client";

import React, { memo } from "react";

interface MarkdownRendererProps {
  text: string;
  className?: string;
  variant?: "summary" | "chat";
}

function parseInlineMarkdown(text: string): React.ReactNode[] {
  if (!text) return [text];
  
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  const boldSplit = remaining.split(/(\*\*[^*]+\*\*)/g);
  boldSplit.forEach((part) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      parts.push(
        <strong key={key++} className="font-extrabold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    } else {
      const italicSplit = part.split(/(\*[^*]+\*)/g);
      italicSplit.forEach((iPart) => {
        if (iPart.startsWith("*") && iPart.endsWith("*") && iPart.length > 2) {
          parts.push(
            <em key={key++} className="italic text-white/80">
              {iPart.slice(1, -1)}
            </em>
          );
        } else {
          const codeSplit = iPart.split(/(`[^`]+`)/g);
          codeSplit.forEach((cPart) => {
            if (cPart.startsWith("`") && cPart.endsWith("`")) {
              parts.push(
                <code key={key++} className="px-1.5 py-0.5 bg-white/5 rounded-md text-xs font-mono text-white/90 border border-white/5">
                  {cPart.slice(1, -1)}
                </code>
              );
            } else {
              parts.push(cPart);
            }
          });
        }
      });
    }
  });

  return parts;
}

export const MarkdownRenderer = memo(function MarkdownRenderer({ text, className = '', variant = 'summary' }: MarkdownRendererProps) {
  if (!text) return null;

  const lines = text.split("\n");
  let inList = false;
  let inOrderedList = false;
  let listItems: React.ReactNode[] = [];
  let orderedItems: React.ReactNode[] = [];
  const elements: React.ReactNode[] = [];
  let key = 0;

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${key++}`} className={`list-disc pl-5 space-y-2 ${variant === 'summary' ? 'mb-6 text-white/80' : 'mb-2 text-white/90'}`}>
          {listItems.map((item, i) => (
            <li key={i} className="leading-relaxed text-sm">{item}</li>
          ))}
        </ul>
      );
      listItems = [];
      inList = false;
    }
    if (orderedItems.length > 0) {
      elements.push(
        <ol key={`ol-${key++}`} className={`list-decimal pl-5 space-y-2 ${variant === 'summary' ? 'mb-6 text-white/80' : 'mb-2 text-white/90'}`}>
          {orderedItems.map((item, i) => (
            <li key={i} className="leading-relaxed text-sm">{item}</li>
          ))}
        </ol>
      );
      orderedItems = [];
      inOrderedList = false;
    }
  };

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (/^(---|___|\*\*\*)$/.test(trimmed)) {
      flushList();
      elements.push(
        <hr key={`hr-${key++}`} className="my-8 border-white/5" />
      );
      return;
    }

    if (trimmed.startsWith("> ")) {
      flushList();
      const quoteText = trimmed.substring(2);
      elements.push(
        <blockquote key={`bq-${key++}`} className="border-l-4 border-omnave-primary pl-4 py-2 my-4 bg-white/5 rounded-r-lg">
          <p className="text-sm italic text-white/70 leading-relaxed">
            {parseInlineMarkdown(quoteText)}
          </p>
        </blockquote>
      );
      return;
    }

    if (trimmed.startsWith("# ")) {
      flushList();
      const headingText = trimmed.substring(2);
      elements.push(
        <h1 key={`h1-${key++}`} className="text-xl font-black text-white mt-12 mb-6 tracking-tight">
          {parseInlineMarkdown(headingText)}
        </h1>
      );
      return;
    }

    if (trimmed.startsWith("## ")) {
      flushList();
      const headingText = trimmed.substring(3);
      elements.push(
        <h2 key={`h2-${key++}`} className="text-lg font-extrabold text-white mt-10 mb-4 tracking-tight flex items-center gap-2 border-b border-white/5 pb-2">
          {parseInlineMarkdown(headingText)}
        </h2>
      );
      return;
    }

    if (trimmed.startsWith("### ")) {
      flushList();
      const headingText = trimmed.substring(4);
      elements.push(
        <h3 key={`h3-${key++}`} className="text-base font-bold text-white mt-8 mb-4 tracking-tight flex items-center gap-2 border-b border-white/5 pb-2">
          {parseInlineMarkdown(headingText)}
        </h3>
      );
      return;
    }

    if (/^#{4,6}\s/.test(trimmed)) {
      flushList();
      const headingText = trimmed.replace(/^#{4,6}\s/, "");
      elements.push(
        <h4 key={`h4-${key++}`} className="text-sm font-bold text-white mt-6 mb-3 tracking-tight">
          {parseInlineMarkdown(headingText)}
        </h4>
      );
      return;
    }

    if (trimmed.startsWith("```")) {
      flushList();
      return;
    }

    if (trimmed.startsWith("|")) {
      flushList();
      elements.push(
        <p key={`table-${key++}`} className="text-sm leading-7 text-white/80 mb-5 select-text font-mono bg-white/5 p-3 rounded-lg overflow-x-auto border border-white/5">
          {trimmed}
        </p>
      );
      return;
    }

    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      inList = true;
      const itemText = trimmed.substring(2);
      listItems.push(parseInlineMarkdown(itemText));
      return;
    }

    if (/^\d+\.\s/.test(trimmed)) {
      inOrderedList = true;
      const itemText = trimmed.replace(/^\d+\.\s/, "");
      orderedItems.push(parseInlineMarkdown(itemText));
      return;
    }

    if (trimmed === "") {
      flushList();
      return;
    }

    flushList();
    elements.push(
      <p key={`p-${key++}`} className={`leading-7 text-white/80 mb-5 select-text text-sm`}>
        {parseInlineMarkdown(line)}
      </p>
    );
  });

  flushList();

  return (
    <div className={`select-text break-words w-full overflow-hidden ${className}`}>
      {elements}
    </div>
  );
});
