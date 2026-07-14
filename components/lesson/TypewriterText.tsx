"use client";

import { useEffect, useState, memo } from "react";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface TypewriterTextProps {
  text: string;
  variant?: "chat" | "summary";
}

export const TypewriterText = memo(function TypewriterText({ text, variant = "chat" }: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let i = 0;
    setDisplayedText("");
    const interval = setInterval(() => {
      i += 3; // Chunk characters to optimize renders
      if (i >= text.length) {
        setDisplayedText(text);
        clearInterval(interval);
      } else {
        setDisplayedText(text.slice(0, i));
      }
    }, 25);

    return () => clearInterval(interval);
  }, [text]);

  return <MarkdownRenderer text={displayedText} variant={variant} />;
});
