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
    if (!saved.section) { router.push("/wizard/info"); return; }
    if (saved.assessment) setAssessment(saved.assessment);

    fetch(`/api/chapters?section=${encodeURIComponent(saved.section)}`)
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
    const allSame = vals.every((v) => v === vals[0]);
    return allSame ? vals[0] : null;
  }

  // Compute stats for sticky bar
  const stats = useMemo(() => {
    const subjectNames = Object.keys(subjects);
    let pariCount = 0;
    let reviseCount = 0;
    let pariNaCount = 0;
    let syllabusNaiCount = 0;

    for (const subject of subjectNames) {
      const status = getSubjectStatus(subject);
      if (status === "pari") pariCount++;
      else if (status === "revise") reviseCount++;
      else if (status === "pari_na") pariNaCount++;
      else if (status === "syllabus_nai") syllabusNaiCount++;
      // null (mixed or unset) — not counted
    }

    return {
      total: subjectNames.length,
      pari: pariCount,
      revise: reviseCount,
      pariNa: pariNaCount,
      syllabusNai: syllabusNaiCount,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjects, assessment]);

  function handleSubjectChange(subject: string, status: AssessmentStatus) {
    const subjectChapters = subjects[subject] || [];
    const newChapterStatuses: Record<string, AssessmentStatus> = {};
    for (const ch of subjectChapters) {
      newChapterStatuses[String(ch.id)] = status;
    }
    setAssessment((prev) => ({ ...prev, [subject]: newChapterStatuses }));
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

  if (loading) return <div className="text-center py-12 text-[var(--color-text-muted)]">Loading...</div>;

  return (
    <div>
      <h1 className="text-[22px] font-bold mb-2">কোন বিষয়ে কী অবস্থা?</h1>
      <p className="text-[13px] text-[var(--color-text-muted)] mb-4">
        প্রতিটি বিষয়ের পাশে তোমার অবস্থা বেছে নাও। বিস্তারিত দেখতে অধ্যায়ে ক্লিক করো।
      </p>

      {/* Sticky stats bar */}
      <div className="sticky top-1 z-10 bg-white shadow-md rounded-[var(--radius-card)] px-3 py-2.5 mb-4 text-[12px] flex flex-wrap gap-x-3 gap-y-1 items-center">
        <span>📊 {toBanglaNum(stats.total)} বিষয়</span>
        <span className="text-[var(--color-success)]">✅ {toBanglaNum(stats.pari)} পারি</span>
        <span className="text-[var(--color-warning)]">🔄 {toBanglaNum(stats.revise)} রিভাইজ</span>
        <span className="text-[var(--color-error)]">❌ {toBanglaNum(stats.pariNa)} পারি না</span>
        <span className="text-[var(--color-gray)]">⬜ {toBanglaNum(stats.syllabusNai)} সিলেবাসে নাই</span>
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
      <button onClick={handleNext}
        className="cursor-pointer w-full py-3.5 rounded-[var(--radius-button)] bg-[var(--color-primary)] text-white font-semibold text-[16px] hover:bg-[var(--color-primary)]/90 transition-colors">
        পরের ধাপ →
      </button>
    </div>
  );
}
