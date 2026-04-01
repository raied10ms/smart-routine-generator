"use client";

import type { Chapter, AssessmentStatus } from "@/lib/types";
import PillButton from "./PillButton";

interface Props {
  chapter: Chapter;
  status: AssessmentStatus;
  onChange: (status: AssessmentStatus) => void;
}

export default function ChapterRow({ chapter, status, onChange }: Props) {
  const importance = Math.max(chapter.cq_importance, chapter.mcq_importance, chapter.math_importance);
  const stars = "\u2605".repeat(importance) + "\u2606".repeat(5 - importance);

  return (
    <div className={`py-3 border-b border-[var(--color-border)] last:border-b-0 ${
      status === "pari" ? "border-l-2 border-l-[var(--color-success)] pl-3" :
      status === "pari_na" ? "border-l-2 border-l-[var(--color-error)] pl-3" :
      status === "revise" ? "border-l-2 border-l-[var(--color-warning)] pl-3" :
      status === "syllabus_nai" ? "border-l-2 border-l-[var(--color-gray)] pl-3" : ""
    }`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[14px]">{chapter.chapter_name_bn}</span>
        <span className="text-[12px] text-[var(--color-warning)]">{stars}</span>
      </div>
      <div className="flex gap-1.5 flex-wrap">
        <PillButton label="পারি" selected={status === "pari"} variant="success"
          onClick={() => onChange("pari")} />
        <PillButton label="রিভাইজ দিলে পারব" selected={status === "revise"} variant="warning"
          onClick={() => onChange(status === "revise" ? "pari" : "revise")} />
        <PillButton label="একদম পারি না" selected={status === "pari_na"} variant="error"
          onClick={() => onChange(status === "pari_na" ? "pari" : "pari_na")} />
        <PillButton label="সিলেবাসে নাই" selected={status === "syllabus_nai"} variant="gray"
          onClick={() => onChange(status === "syllabus_nai" ? "pari" : "syllabus_nai")} />
      </div>
    </div>
  );
}
