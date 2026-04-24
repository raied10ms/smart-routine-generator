"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Chapter, Assessment, AssessmentStatus } from "@/lib/types";
import SubjectCard from "@/components/SubjectCard";
import { toBanglaNum } from "@/lib/utils";

type Filter = "all" | AssessmentStatus;

const FILTERS: { key: Filter; label: string; dot: string }[] = [
  { key: "all",          label: "সব বিষয়",            dot: "#E8001D" },
  { key: "pari",         label: "পারি",                dot: "#1CAB55" },
  { key: "revise",       label: "রিভাইজ দিলে পারবো",  dot: "#F59E0B" },
  { key: "pari_na",      label: "একদম পারিনা",         dot: "#E8001D" },
  { key: "syllabus_nai", label: "সিলেবাসেই নাই",       dot: "#9CA3AF" },
];

export default function AssessPage() {
  const router = useRouter();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [assessment, setAssessment] = useState<Assessment>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    const saved = JSON.parse(sessionStorage.getItem("wizard") || "{}");
    if (!saved.grade) { router.push("/wizard/info"); return; }
    if (saved.assessment) setAssessment(saved.assessment);

    fetch(`/api/chapters?grade=${encodeURIComponent(saved.grade)}`)
      .then((r) => r.json())
      .then((data) => { setChapters(data); setLoading(false); });
  }, [router]);

  const subjects = chapters.reduce<Record<string, Chapter[]>>((acc, ch) => {
    if (!acc[ch.subject]) acc[ch.subject] = [];
    acc[ch.subject].push(ch);
    return acc;
  }, {});

  function getSubjectStatus(subject: string): AssessmentStatus | null {
    const chStatuses = assessment[subject];
    if (!chStatuses) return null;
    const vals = Object.values(chStatuses);
    if (vals.length === 0) return null;
    return vals.every((v) => v === vals[0]) ? vals[0] : null;
  }

  const stats = useMemo(() => {
    const subjectNames = Object.keys(subjects);
    let pari = 0, revise = 0, pariNa = 0, syllabusNai = 0, unset = 0;
    for (const subject of subjectNames) {
      const status = getSubjectStatus(subject);
      if (status === "pari") pari++;
      else if (status === "revise") revise++;
      else if (status === "pari_na") pariNa++;
      else if (status === "syllabus_nai") syllabusNai++;
      else unset++;
    }
    return { total: subjectNames.length, pari, revise, pariNa, syllabusNai, unset };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjects, assessment]);

  function handleSubjectChange(subject: string, status: AssessmentStatus) {
    const newStatuses: Record<string, AssessmentStatus> = {};
    for (const ch of subjects[subject] || []) newStatuses[String(ch.id)] = status;
    setAssessment((prev) => ({ ...prev, [subject]: newStatuses }));
  }

  function handleChapterChange(subject: string, chapterId: string, status: AssessmentStatus) {
    setAssessment((prev) => ({
      ...prev,
      [subject]: { ...prev[subject], [chapterId]: status },
    }));
  }

  function handleNext() {
    const saved = JSON.parse(sessionStorage.getItem("wizard") || "{}");
    sessionStorage.setItem("wizard", JSON.stringify({ ...saved, assessment }));
    router.push("/wizard/duration");
  }

  const filteredSubjects = Object.entries(subjects).filter(([subject]) => {
    if (filter === "all") return true;
    return getSubjectStatus(subject) === filter;
  });

  if (loading) {
    return (
      <div className="pb-8">
        <h1 className="text-[22px] font-bold text-ten-ink mb-1">কোন বিষয়ের কী অবস্থা?</h1>
        <p className="text-sm text-gray-400 mb-6">ধাপ ২: বিষয় মূল্যায়ন</p>
        <div className="flex flex-col gap-3">
          {[1,2,3,4].map((i) => <div key={i} className="skeleton h-[110px] w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-8">
      <div className="mb-4">
        <h1 className="text-[22px] font-bold text-ten-ink mb-1">কোন বিষয়ের কী অবস্থা?</h1>
        <p className="text-[13px] text-gray-400">ধাপ ২: প্রতিটি বিষয়ের পাশে অবস্থা বেছে নাও</p>
      </div>

      {/* Progress chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {stats.pari > 0 && (
          <div className="flex items-center gap-1.5 bg-white border border-[#E5E7EB] rounded-full px-3 py-1.5 text-[12px] font-medium text-[#374151]">
            <span className="w-2 h-2 rounded-full bg-[#1CAB55] shrink-0" />
            <span>পারি — {toBanglaNum(stats.pari)}</span>
          </div>
        )}
        {stats.revise > 0 && (
          <div className="flex items-center gap-1.5 bg-white border border-[#E5E7EB] rounded-full px-3 py-1.5 text-[12px] font-medium text-[#374151]">
            <span className="w-2 h-2 rounded-full bg-[#F59E0B] shrink-0" />
            <span>রিভাইজ দিলে — {toBanglaNum(stats.revise)}</span>
          </div>
        )}
        {stats.pariNa > 0 && (
          <div className="flex items-center gap-1.5 bg-white border border-[#E5E7EB] rounded-full px-3 py-1.5 text-[12px] font-medium text-[#374151]">
            <span className="w-2 h-2 rounded-full bg-[#E8001D] shrink-0" />
            <span>পারি না — {toBanglaNum(stats.pariNa)}</span>
          </div>
        )}
        {stats.unset > 0 && (
          <div className="flex items-center gap-1.5 bg-white border border-[#E5E7EB] rounded-full px-3 py-1.5 text-[12px] font-medium text-[#374151]">
            <span className="w-2 h-2 rounded-full bg-[#D1D5DB] shrink-0" />
            <span>বাকি — {toBanglaNum(stats.unset)}</span>
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className="overflow-x-auto -mx-4 px-4 mb-4 scrollbar-none">
        <div className="flex gap-2 pb-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border-[1.5px] text-[13px] font-medium cursor-pointer whitespace-nowrap transition-all shrink-0 ${
                filter === f.key
                  ? "bg-[#111827] border-[#111827] text-white"
                  : "bg-white border-[#E5E7EB] text-[#6B7280] hover:border-[#D1D5DB]"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: filter === f.key ? "#fff" : f.dot }} />
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Subject cards */}
      <div className="flex flex-col gap-2.5 mb-6">
        {filteredSubjects.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-[14px]">এই ফিল্টারে কোনো বিষয় নেই</div>
        ) : (
          filteredSubjects.map(([subject, chs]) => (
            <SubjectCard key={subject} subject={subject} chapters={chs}
              subjectStatus={getSubjectStatus(subject)}
              chapterStatuses={assessment[subject] || {}}
              onSubjectChange={(s) => handleSubjectChange(subject, s)}
              onChapterChange={(chId, s) => handleChapterChange(subject, chId, s)} />
          ))
        )}
      </div>

      <button onClick={handleNext} className="btn-primary w-full text-[16px] px-5 py-3.5 rounded-[10px]">
        পরের ধাপ →
      </button>
    </div>
  );
}
