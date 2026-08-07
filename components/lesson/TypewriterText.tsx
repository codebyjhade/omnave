"use client";

import { useEffect, useState, memo } from "react";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface TypewriterTextProps {
  text?: string;
  variant?: "chat" | "summary";
  onComplete?: () => void;
}

export const TypewriterText = memo(function TypewriterText({
  text = "",
  variant = "chat",
  onComplete,
}: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    if (!text) return;
    let i = 0;
    setDisplayedText("");
    const interval = setInterval(() => {
      i += 3; // Chunk characters to optimize renders
      if (i >= text.length) {
        setDisplayedText(text);
        clearInterval(interval);
        onComplete?.();
      } else {
        setDisplayedText(text.slice(0, i));
      }
    }, 25);

    return () => clearInterval(interval);
  }, [text, onComplete]);

  return <MarkdownRenderer text={displayedText} variant={variant} />;
});
