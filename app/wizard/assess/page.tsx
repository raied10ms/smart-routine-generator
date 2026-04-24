"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Chapter, Assessment, AssessmentStatus } from "@/lib/types";
import SubjectCard from "@/components/SubjectCard";
import { toBanglaNum } from "@/lib/utils";

export default function AssessPage() {
  const router = useRouter();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [assessment, setAssessment] = useState<Assessment>({});
  const [loading, setLoading] = useState(true);

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
    let pari = 0, revise = 0, pariNa = 0, syllabusNai = 0;
    for (const subject of subjectNames) {
      const status = getSubjectStatus(subject);
      if (status === "pari") pari++;
      else if (status === "revise") revise++;
      else if (status === "pari_na") pariNa++;
      else if (status === "syllabus_nai") syllabusNai++;
    }
    return { total: subjectNames.length, pari, revise, pariNa, syllabusNai };
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

  if (loading) {
    return (
      <div className="pb-8">
        <h1 className="text-[22px] font-bold text-ten-ink mb-1">কোন বিষয়ে কী অবস্থা?</h1>
        <p className="text-sm text-gray-400 mb-6">ধাপ ২: বিষয় মূল্যায়ন</p>
        <div className="flex flex-col gap-3">
          {[1,2,3,4].map((i) => <div key={i} className="skeleton h-[90px] w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-8">
      <h1 className="text-[22px] font-bold text-ten-ink mb-1">কোন বিষয়ে কী অবস্থা?</h1>
      <p className="text-[13px] text-gray-400 mb-4">ধাপ ২: প্রতিটি বিষয়ের পাশে অবস্থা বেছে নাও</p>

      <div className="sticky top-1 z-10 bg-white/95 backdrop-blur shadow-sm rounded-xl px-3 py-2.5 mb-4 flex flex-wrap gap-1.5 items-center ring-1 ring-gray-100">
        <span className="badge-muted">
          <svg width="6" height="6" viewBox="0 0 8 8" fill="#4B5563"><circle cx="4" cy="4" r="4"/></svg>
          {toBanglaNum(stats.total)}টি বিষয়
        </span>
        {stats.pari > 0 && (
          <span className="badge-success">
            <svg width="6" height="6" viewBox="0 0 8 8" fill="#0E7B4F"><circle cx="4" cy="4" r="4"/></svg>
            {toBanglaNum(stats.pari)}টি পারি
          </span>
        )}
        {stats.revise > 0 && (
          <span className="badge-warning">
            <svg width="6" height="6" viewBox="0 0 8 8" fill="#92400E"><circle cx="4" cy="4" r="4"/></svg>
            {toBanglaNum(stats.revise)}টি রিভাইজ
          </span>
        )}
        {stats.pariNa > 0 && (
          <span className="badge-error">
            <svg width="6" height="6" viewBox="0 0 8 8" fill="#931212"><circle cx="4" cy="4" r="4"/></svg>
            {toBanglaNum(stats.pariNa)}টি পারি না
          </span>
        )}
        {stats.syllabusNai > 0 && (
          <span className="badge-muted">
            <svg width="6" height="6" viewBox="0 0 8 8" fill="#4B5563"><circle cx="4" cy="4" r="4"/></svg>
            {toBanglaNum(stats.syllabusNai)}টি সিলেবাসে নাই
          </span>
        )}
      </div>

      <div className="flex flex-col gap-3 mb-6">
        {Object.entries(subjects).map(([subject, chs]) => (
          <SubjectCard key={subject} subject={subject} chapters={chs}
            subjectStatus={getSubjectStatus(subject)}
            chapterStatuses={assessment[subject] || {}}
            onSubjectChange={(s) => handleSubjectChange(subject, s)}
            onChapterChange={(chId, s) => handleChapterChange(subject, chId, s)} />
        ))}
      </div>

      <button onClick={handleNext} className="btn-primary w-full text-[16px] px-5 py-3.5 rounded-[10px]">
        পরের ধাপ →
      </button>
    </div>
  );
}
