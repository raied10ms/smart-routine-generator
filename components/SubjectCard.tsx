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

const borderColors: Record<string, string> = {
  pari:         "border-l-ten-green",
  revise:       "border-l-[#F59E0B]",
  pari_na:      "border-l-ten-red",
  syllabus_nai: "border-l-gray-300",
};

const statusLabels: Record<string, string> = {
  revise:       "রিভাইজ দিলে পারব",
  pari_na:      "একদম পারি না",
  syllabus_nai: "সিলেবাসে নাই",
};

export default function SubjectCard({
  subject, chapters, subjectStatus, chapterStatuses,
  onSubjectChange, onChapterChange,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  const borderColor = subjectStatus ? (borderColors[subjectStatus] ?? "border-l-transparent") : "border-l-transparent";

  return (
    <div className={`bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 overflow-hidden border-l-4 ${borderColor} transition-all duration-200 hover:shadow-md`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[14px] font-bold text-ten-ink">{subject}</span>
          {subjectStatus && statusLabels[subjectStatus] && (
            <span className="text-[11px] text-gray-400">{statusLabels[subjectStatus]}</span>
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
          className="cursor-pointer mt-3 text-ten-red text-[13px] font-semibold hover:opacity-80 transition-opacity">
          {expanded ? "অধ্যায়সমূহ Hide koro ▴" : `অধ্যায়সমূহ দেখো (${toBanglaNum(chapters.length)}) ▾`}
        </button>
      </div>
      {expanded && (
        <div className="border-t border-gray-100 px-4 pb-3">
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
