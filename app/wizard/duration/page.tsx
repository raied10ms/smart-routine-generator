"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { DurationOption } from "@/lib/types";
import DurationTile from "@/components/DurationTile";
import { toBanglaNum } from "@/lib/utils";

const options: { days: DurationOption; desc: string; rec?: boolean }[] = [
  { days: 7, desc: "দ্রুত — দ্রুত রিভিশনের জন্য" },
  { days: 15, desc: "ছোট — গুরুত্বপূর্ণ অধ্যায়গুলো cover হবে" },
  { days: 20, desc: "মাঝারি — ভালো balance" },
  { days: 30, desc: "Pre-test-এর জন্য আদর্শ", rec: true },
  { days: 60, desc: "Board-এর জন্য সেরা — পুরো syllabus" },
];

const loadingMessages = [
  "বিষয় বিশ্লেষণ করা হচ্ছে...",
  "রুটিন তৈরি হচ্ছে...",
  "প্রায় শেষ...",
];

export default function DurationPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<DurationOption | null>(null);
  const [generating, setGenerating] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const saved = JSON.parse(sessionStorage.getItem("wizard") || "{}");
    if (saved.durationDays) setSelected(saved.durationDays);
  }, []);

  const summary = useMemo(() => {
    if (typeof window === "undefined") return { totalSubjects: 0, totalChapters: 0, pari: 0, revise: 0, pariNa: 0, syllabusNai: 0 };
    const saved = JSON.parse(sessionStorage.getItem("wizard") || "{}");
    const assessment = saved.assessment || {};
    let totalSubjects = 0, totalChapters = 0;
    let pari = 0, revise = 0, pariNa = 0, syllabusNai = 0;

    for (const subject of Object.keys(assessment)) {
      totalSubjects++;
      const chapters = assessment[subject];
      for (const status of Object.values(chapters)) {
        totalChapters++;
        if (status === "pari") pari++;
        else if (status === "revise") revise++;
        else if (status === "pari_na") pariNa++;
        else if (status === "syllabus_nai") syllabusNai++;
      }
    }
    return { totalSubjects, totalChapters, pari, revise, pariNa, syllabusNai };
  }, []);

  useEffect(() => {
    if (generating) {
      setLoadingMsgIdx(0);
      // Phase 1 at 0s, Phase 2 at 2s, Phase 3 at 4s (5s total)
      const timer1 = setTimeout(() => setLoadingMsgIdx(1), 2000);
      const timer2 = setTimeout(() => setLoadingMsgIdx(2), 4000);
      intervalRef.current = timer1 as unknown as ReturnType<typeof setInterval>;
      return () => { clearTimeout(timer1); clearTimeout(timer2); };
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [generating]);

  async function handleNext() {
    if (!selected) return;
    setGenerating(true);
    const saved = JSON.parse(sessionStorage.getItem("wizard") || "{}");

    const minWait = new Promise((resolve) => setTimeout(resolve, 5000));

    const apiCall = fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section: saved.section, assessment: saved.assessment, durationDays: selected }),
    }).then((res) => res.json());

    const [{ routine }] = await Promise.all([apiCall, minWait]);

    sessionStorage.setItem("wizard", JSON.stringify({ ...saved, durationDays: selected, routinePreview: routine }));

    setGenerating(false);
    router.push("/wizard/preview");
  }

  return (
    <div>
      <h1 className="text-[22px] font-bold mb-6">কতদিনের রুটিন চাও?</h1>

      <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] p-4 mb-6">
        <h2 className="text-[15px] font-semibold mb-3">তোমার বিষয় সারাংশ</h2>
        <div className="grid grid-cols-2 gap-2 text-[13px]">
          <div>📚 <span className="font-medium">{toBanglaNum(summary.totalSubjects)}</span> বিষয়</div>
          <div>📖 <span className="font-medium">{toBanglaNum(summary.totalChapters)}</span> অধ্যায়</div>
          {summary.pariNa > 0 && <div>❌ <span className="font-medium text-[var(--color-error)]">{toBanglaNum(summary.pariNa)}</span> একদম পারি না</div>}
          {summary.revise > 0 && <div>🔄 <span className="font-medium text-[var(--color-warning)]">{toBanglaNum(summary.revise)}</span> রিভাইজ দিলে পারব</div>}
          {summary.pari > 0 && <div>✅ <span className="font-medium text-[var(--color-success)]">{toBanglaNum(summary.pari)}</span> পারি</div>}
          {summary.syllabusNai > 0 && <div>⬜ <span className="font-medium text-[var(--color-gray)]">{toBanglaNum(summary.syllabusNai)}</span> সিলেবাসে নাই</div>}
        </div>
      </div>

      <div className="bg-white rounded-[var(--radius-card)] border border-[var(--color-border)] p-4 mb-6">
        <h2 className="text-[15px] font-semibold mb-3">রুটিন কিভাবে কাজ করবে?</h2>
        <div className="space-y-2 text-[13px] text-[var(--color-text-muted)]">
          <div className="flex gap-2">
            <span className="text-[var(--color-primary)] font-semibold shrink-0">Phase 1</span>
            <span>ফাউন্ডেশন মোড — যে অধ্যায়গুলো &quot;একদম পারি না&quot; সেগুলোর basic থেকে শুরু</span>
          </div>
          <div className="flex gap-2">
            <span className="text-[var(--color-warning)] font-semibold shrink-0">Phase 2</span>
            <span>প্র্যাকটিস গ্রাইন্ড — CQ, MCQ ও গণিত অনুশীলন</span>
          </div>
          <div className="flex gap-2">
            <span className="text-[var(--color-success)] font-semibold shrink-0">Phase 3</span>
            <span>ফাইনাল রিভিশন — সব গুরুত্বপূর্ণ অধ্যায় রিভিশন</span>
          </div>
          <div className="text-[12px] mt-2 pt-2 border-t border-[var(--color-border)]">
            ⚡ প্রতি সপ্তাহে ১টি পাওয়ার ডে (বেশি সময়) • 🌙 শনি-রবি হালকা দিন
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-8">
        {options.map((o) => (
          <DurationTile key={o.days} days={o.days} description={o.desc} recommended={o.rec}
            selected={selected === o.days} onClick={() => setSelected(o.days)} />
        ))}
      </div>
      <button onClick={handleNext} disabled={!selected || generating}
        className="cursor-pointer w-full py-3.5 rounded-[var(--radius-button)] bg-[var(--color-primary)] text-white font-semibold text-[16px] disabled:opacity-40 hover:bg-[var(--color-primary)]/90 transition-colors">
        {generating ? (
          <span className="flex items-center justify-center gap-2">
            <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            {loadingMessages[loadingMsgIdx]}
          </span>
        ) : (
          "Generate Routine ✨"
        )}
      </button>
    </div>
  );
}
