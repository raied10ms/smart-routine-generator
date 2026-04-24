"use client";

import { useState } from "react";
import type { Chapter, AssessmentStatus } from "@/lib/types";
import { toBanglaNum } from "@/lib/utils";

interface Props {
  subject: string;
  chapters: Chapter[];
  subjectStatus: AssessmentStatus | null;
  chapterStatuses: Record<string, AssessmentStatus>;
  onSubjectChange: (status: AssessmentStatus) => void;
  onChapterChange: (chapterId: string, status: AssessmentStatus) => void;
}

// ── Face SVGs ────────────────────────────────────────────────────────────────

function FaceHappy({ size = 16, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" stroke={color} strokeWidth="1.5"/>
      <circle cx="5.5" cy="6.5" r="0.8" fill={color}/>
      <circle cx="10.5" cy="6.5" r="0.8" fill={color}/>
      <path d="M5 9.5 Q8 12.5 11 9.5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function FaceNeutral({ size = 16, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" stroke={color} strokeWidth="1.5"/>
      <circle cx="5.5" cy="6.5" r="0.8" fill={color}/>
      <circle cx="10.5" cy="6.5" r="0.8" fill={color}/>
      <line x1="5.5" y1="10.5" x2="10.5" y2="10.5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function FaceSad({ size = 16, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" stroke={color} strokeWidth="1.5"/>
      <circle cx="5.5" cy="6.5" r="0.8" fill={color}/>
      <circle cx="10.5" cy="6.5" r="0.8" fill={color}/>
      <path d="M5 11.5 Q8 8.5 11 11.5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function FaceVictory({ size = 16, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      {/* Index finger — spreads left */}
      <path d="M7.5 12 L5 4" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
      {/* Middle finger — spreads right */}
      <path d="M8.5 12 L11 4" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
      {/* Palm base */}
      <path d="M5 12 Q8 14 11 12" stroke={color} strokeWidth="1.4" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

// ── Status button config ─────────────────────────────────────────────────────

const STATUS_CONFIG = {
  pari:         { label: "পারি",                face: FaceHappy,   sel: "bg-[#1CAB55] text-white border-[#0E7B4F]",    idle: "bg-[#ECFDF5] text-[#0E7B4F] border-[#A7F3D0]" },
  revise:       { label: "রিভাইজ দিলে পারবো", face: FaceNeutral,  sel: "bg-[#F59E0B] text-white border-[#D97706]",    idle: "bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]" },
  pari_na:      { label: "একদম পারিনা",        face: FaceSad,     sel: "bg-[#E8001D] text-white border-[#B91C1C]",    idle: "bg-[#FEF2F2] text-[#991B1B] border-[#FCA5A5]" },
  syllabus_nai: { label: "সিলেবাসেই নাই",      face: FaceVictory, sel: "bg-[#F3F4F6] text-[#374151] border-[#374151]", idle: "text-[#9CA3AF] border-[#D1D5DB] border-dashed" },
} as const;

const FACE_COLORS: Record<AssessmentStatus, { idle: string; sel: string }> = {
  pari:         { idle: "#1CAB55", sel: "#fff" },
  revise:       { idle: "#F59E0B", sel: "#fff" },
  pari_na:      { idle: "#EF4444", sel: "#fff" },
  syllabus_nai: { idle: "#9CA3AF", sel: "#374151" },
};

// ── Chapter importance stars ─────────────────────────────────────────────────

function chapterImportance(ch: Chapter): number {
  return Math.max(ch.mcq_importance, ch.sq_importance, ch.cq_importance);
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SubjectCard({
  subject, chapters, subjectStatus, chapterStatuses,
  onSubjectChange, onChapterChange,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-[20px] border border-[#E5E7EB] overflow-hidden transition-shadow hover:shadow-md" style={{ boxShadow: "0 1px 4px rgba(17,24,39,0.04)" }}>
      <div className="p-4">
        {/* Subject name */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <span className="text-[15px] font-semibold text-[#111827] leading-snug flex-1">{subject}</span>
          <span className="text-[11px] text-gray-400 shrink-0">{toBanglaNum(chapters.length)} অধ্যায়</span>
        </div>

        {/* Main status buttons */}
        <div className="flex flex-wrap gap-2 mb-2">
          {(["pari", "revise", "pari_na"] as const).map((s) => {
            const cfg = STATUS_CONFIG[s];
            const selected = subjectStatus === s;
            const faceColor = selected ? FACE_COLORS[s].sel : FACE_COLORS[s].idle;
            const FaceComp = cfg.face;
            return (
              <button
                key={s}
                type="button"
                onClick={() => onSubjectChange(s)}
                className={`flex items-center gap-1.5 px-3 py-[7px] rounded-full border-[1.5px] text-[12px] font-medium cursor-pointer transition-all duration-150 active:scale-95 ${selected ? cfg.sel : cfg.idle}`}
              >
                <FaceComp size={15} color={faceColor} />
                <span>{cfg.label}</span>
              </button>
            );
          })}
        </div>

        {/* Bottom row: syllabus nai + expand */}
        <div className="flex items-center justify-between mt-1">
          <button
            type="button"
            onClick={() => onSubjectChange("syllabus_nai")}
            className={`flex items-center gap-1.5 px-3 py-[7px] rounded-full border-[1.5px] text-[12px] font-medium cursor-pointer transition-all duration-150 active:scale-95 ${subjectStatus === "syllabus_nai" ? STATUS_CONFIG.syllabus_nai.sel : STATUS_CONFIG.syllabus_nai.idle}`}
          >
            <FaceVictory size={14} color={subjectStatus === "syllabus_nai" ? "#374151" : "#9CA3AF"} />
            <span>সিলেবাসেই নাই</span>
          </button>

          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-[#E8001D] text-[12px] font-semibold cursor-pointer hover:opacity-75 transition-opacity"
          >
            <span>{expanded ? "অধ্যায়সমূহ Hide koro" : `অধ্যায়সমূহ দেখো (${toBanglaNum(chapters.length)})`}</span>
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: expanded ? "rotate(90deg)" : "none", transition: "transform 200ms" }}>
              <polyline points="4 2 8 6 4 10"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded chapters */}
      {expanded && (
        <div className="border-t border-dashed border-[#E5E7EB]">
          {chapters.map((ch, idx) => {
            const chId = String(ch.id);
            const status: AssessmentStatus = chapterStatuses[chId] || subjectStatus || "pari";
            const imp = chapterImportance(ch);
            return (
              <div key={ch.id} className={`px-4 py-3 ${idx < chapters.length - 1 ? "border-b border-[#F3F4F6]" : ""}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-[#F3F4F6] flex items-center justify-center text-[10px] font-semibold text-[#6B7280] shrink-0">
                    {toBanglaNum(ch.chapter_num)}
                  </div>
                  <span className="flex-1 min-w-0 text-[13px] text-[#374151] leading-snug">{ch.chapter_name_bn}</span>
                  {imp > 0 && <span className="text-[#F59E0B] text-[11px] shrink-0">{"★".repeat(imp)}</span>}
                </div>
                {/* Circular icon-only buttons for chapters */}
                <div className="flex gap-2 pl-8">
                  {(["pari", "revise", "pari_na", "syllabus_nai"] as const).map((s) => {
                    const sel = status === s;
                    const faceColor = sel ? FACE_COLORS[s].sel : FACE_COLORS[s].idle;
                    const FaceComp = STATUS_CONFIG[s].face;
                    const selBg =
                      s === "pari"         ? "bg-[#1CAB55] border-[#0E7B4F] shadow-[0_2px_6px_rgba(28,171,85,.35)]" :
                      s === "revise"       ? "bg-[#F59E0B] border-[#D97706] shadow-[0_2px_6px_rgba(245,158,11,.35)]" :
                      s === "pari_na"      ? "bg-[#E8001D] border-[#B91C1C] shadow-[0_2px_6px_rgba(232,0,29,.3)]" :
                      "bg-[#F3F4F6] border-[#6B7280]";
                    const idleBg =
                      s === "pari"         ? "bg-[#F0FDF4] border-[#D1FAE5]" :
                      s === "revise"       ? "bg-[#FFFBEB] border-[#FEF3C7]" :
                      s === "pari_na"      ? "bg-[#FFF5F5] border-[#FEE2E2]" :
                      "bg-white border-dashed border-[#D1D5DB]";
                    return (
                      <button
                        key={s}
                        type="button"
                        title={STATUS_CONFIG[s].label}
                        onClick={() => onChapterChange(chId, s)}
                        className={`w-[34px] h-[34px] rounded-full border-[1.5px] flex items-center justify-center cursor-pointer transition-all duration-150 active:scale-90 ${sel ? selBg : idleBg}`}
                      >
                        <FaceComp size={15} color={faceColor} />
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
