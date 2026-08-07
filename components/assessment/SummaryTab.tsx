"use client";

import React from "react";
import { MarkdownRenderer } from "@/components/lesson";

interface SummaryTabProps {
  summary: string;
  lessonId?: string;
}

export const SummaryTab = React.memo(function SummaryTab({ summary }: SummaryTabProps) {
  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 pb-8 animate-in fade-in duration-300">
      <div className="select-text prose prose-slate max-w-none text-gray-900" id="summary-text">
        <MarkdownRenderer text={summary || "No summary content available."} variant="summary" theme="light" />
      </div>
    </div>
  );
});

SummaryTab.displayName = "SummaryTab";