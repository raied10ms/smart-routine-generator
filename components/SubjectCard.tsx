"use client";

import { useState } from "react";
import type { Chapter, AssessmentStatus } from "@/lib/types";
import PillButton from "./PillButton";
import ChapterRow from "./ChapterRow";
import { toBanglaNum } from "@/lib/utils";

interface Props {
  subject: string;
  chapters: Chapter[];
  subjectStatus: AssessmentStatus | null;
  chapterStatuses: Record<string, AssessmentStatus>;
  onSubjectChange: (status: AssessmentStatus) => void;
  onChapterChange: (chapterId: string, status: AssessmentStatus) => void;
}

export default function SubjectCard({
  subject, chapters, subjectStatus, chapterStatuses,
  onSubjectChange, onChapterChange,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  const statusLabel = !subjectStatus || subjectStatus === "pari"
    ? null
    : subjectStatus === "revise" ? "রিভাইজ দিলে পারব"
    : subjectStatus === "pari_na" ? "একদম পারি না"
    : "সিলেবাসে নাই";

  const borderColor =
    subjectStatus === "pari" ? "border-l-[var(--color-success)]" :
    subjectStatus === "revise" ? "border-l-[var(--color-warning)]" :
    subjectStatus === "pari_na" ? "border-l-[var(--color-error)]" :
    subjectStatus === "syllabus_nai" ? "border-l-[var(--color-gray)]" :
    "border-l-transparent";

  return (
    <div className={`bg-white rounded-[var(--radius-card)] shadow-[var(--shadow-card)] overflow-hidden border-l-4 ${borderColor} transition-all duration-200 hover:shadow-md`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[var(--font-size-body)] font-semibold">{subject}</span>
          {statusLabel && (
            <span className="text-[11px] text-[var(--color-text-muted)]">{statusLabel}</span>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <PillButton label="পারি" selected={subjectStatus === "pari"} variant="success"
            onClick={() => onSubjectChange("pari")} />
          <PillButton label="রিভাইজ দিলে পারব" selected={subjectStatus === "revise"} variant="warning"
            onClick={() => onSubjectChange(subjectStatus === "revise" ? "pari" : "revise")} />
          <PillButton label="একদম পারি না" selected={subjectStatus === "pari_na"} variant="error"
            onClick={() => onSubjectChange(subjectStatus === "pari_na" ? "pari" : "pari_na")} />
          <PillButton label="সিলেবাসে নাই" selected={subjectStatus === "syllabus_nai"} variant="gray"
            onClick={() => onSubjectChange(subjectStatus === "syllabus_nai" ? "pari" : "syllabus_nai")} />
        </div>
        <button type="button" onClick={() => setExpanded(!expanded)}
          className="cursor-pointer mt-3 text-[var(--color-primary)] text-[13px] font-medium hover:opacity-80 transition-opacity">
          {expanded ? "অধ্যায়সমূহ লুকাও ▴" : `অধ্যায়সমূহ দেখো (${toBanglaNum(chapters.length)}) ▾`}
        </button>
      </div>
      {expanded && (
        <div className="border-t border-[var(--color-border)] px-4 pb-3">
          {chapters.map((ch) => (
            <ChapterRow key={ch.id} chapter={ch}
              status={chapterStatuses[String(ch.id)] || subjectStatus || "pari"}
              onChange={(s) => onChapterChange(String(ch.id), s)} />
          ))}
        </div>
      )}
    </div>
  );
}
