"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { DurationOption } from "@/lib/types";
import DurationTile from "@/components/DurationTile";
import { toBanglaNum } from "@/lib/utils";

const options: { days: DurationOption; desc: string; rec?: boolean }[] = [
  { days: 7,  desc: "দ্রুত রিভিশনের জন্য" },
  { days: 15, desc: "গুরুত্বপূর্ণ অধ্যায় cover" },
  { days: 20, desc: "ভালো balance" },
  { days: 30, desc: "Pre-test-এর জন্য আদর্শ", rec: true },
  { days: 60, desc: "Board-এর জন্য সেরা" },
];

const loadingMessages = [
  "বিষয় বিশ্লেষণ করা হচ্ছে...",
  "রুটিন তৈরি হচ্ছে...",
  "প্রায় শেষ...",
];

function getTomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

function daysFromTomorrow(dateStr: string): number {
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const diff = Math.round((target.getTime() - tomorrow.getTime()) / (1000 * 60 * 60 * 24));
  return diff + 1; // inclusive of target day
}

export default function DurationPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<number | null>(null);
  const [customDate, setCustomDate] = useState<string>("");
  const [customActive, setCustomActive] = useState(false);
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
    let totalSubjects = 0, totalChapters = 0, pari = 0, revise = 0, pariNa = 0, syllabusNai = 0;
    for (const subject of Object.keys(assessment)) {
      totalSubjects++;
      for (const status of Object.values(assessment[subject] as Record<string, string>)) {
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
      const t1 = setTimeout(() => setLoadingMsgIdx(1), 2000);
      const t2 = setTimeout(() => setLoadingMsgIdx(2), 4000);
      intervalRef.current = t1 as unknown as ReturnType<typeof setInterval>;
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [generating]);

  function handlePresetSelect(days: DurationOption) {
    setCustomActive(false);
    setCustomDate("");
    setSelected(days);
  }

  function handleCustomDateChange(val: string) {
    setCustomDate(val);
    if (val) {
      const days = daysFromTomorrow(val);
      if (days >= 1) {
        setSelected(days);
        setCustomActive(true);
      }
    }
  }

  function handleCustomTileClick() {
    setCustomActive(true);
    setSelected(null);
  }

  async function handleNext() {
    if (!selected) return;
    setGenerating(true);
    const saved = JSON.parse(sessionStorage.getItem("wizard") || "{}");
    const minWait = new Promise((resolve) => setTimeout(resolve, 5000));
    const apiCall = fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grade: saved.grade, assessment: saved.assessment, durationDays: selected }),
    }).then((res) => res.json());
    const [{ routine }] = await Promise.all([apiCall, minWait]);
    sessionStorage.setItem("wizard", JSON.stringify({ ...saved, durationDays: selected, routinePreview: routine }));
    setGenerating(false);
    router.push("/wizard/preview");
  }

  const customDays = customDate ? daysFromTomorrow(customDate) : null;

  return (
    <div className="pb-8">
      <h1 className="text-[22px] font-bold text-ten-ink mb-1">কতদিনের রুটিন চাও?</h1>
      <p className="text-sm text-gray-400 mb-5">ধাপ ৩: সময়কাল বেছে নাও</p>

      {/* Summary card — light themed */}
      <div className="bg-gray-50 ring-1 ring-gray-200 rounded-2xl px-4 py-4 mb-5 flex flex-wrap gap-x-6 gap-y-3">
        <div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">বিষয়</div>
          <div className="text-[22px] font-bold text-ten-ink">{toBanglaNum(summary.totalSubjects)}</div>
        </div>
        <div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">অধ্যায়</div>
          <div className="text-[22px] font-bold text-ten-ink">{toBanglaNum(summary.totalChapters)}</div>
        </div>
        {summary.pariNa > 0 && (
          <div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">পারি না</div>
            <div className="text-[22px] font-bold text-ten-red">{toBanglaNum(summary.pariNa)}</div>
          </div>
        )}
        {summary.revise > 0 && (
          <div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">রিভাইজ</div>
            <div className="text-[22px] font-bold text-[#F59E0B]">{toBanglaNum(summary.revise)}</div>
          </div>
        )}
      </div>

      {/* Phase explanation */}
      <div className="bg-white rounded-2xl ring-1 ring-gray-200 p-4 mb-5">
        <h2 className="text-[14px] font-bold text-ten-ink mb-3">রুটিন কিভাবে কাজ করবে?</h2>
        <div className="space-y-2 text-[13px] text-gray-500">
          <div className="flex gap-2">
            <span className="text-ten-red font-bold shrink-0">Phase 1</span>
            <span>ফাউন্ডেশন মোড — &quot;একদম পারি না&quot; অধ্যায়গুলো basic থেকে শুরু</span>
          </div>
          <div className="flex gap-2">
            <span className="text-[#F59E0B] font-bold shrink-0">Phase 2</span>
            <span>প্র্যাকটিস গ্রাইন্ড — CQ, MCQ ও গণিত অনুশীলন</span>
          </div>
          <div className="flex gap-2">
            <span className="text-ten-green font-bold shrink-0">Phase 3</span>
            <span>ফাইনাল রিভিশন — সব গুরুত্বপূর্ণ অধ্যায় রিভিশন</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        {options.map((o) => (
          <DurationTile key={o.days} days={o.days} description={o.desc} recommended={o.rec}
            selected={!customActive && selected === o.days}
            onClick={() => handlePresetSelect(o.days)} />
        ))}

        {/* Custom date tile */}
        <button
          type="button"
          onClick={handleCustomTileClick}
          className={`cursor-pointer relative p-4 rounded-2xl border-2 text-left transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 col-span-2 ${
            customActive
              ? "border-ten-red bg-[rgba(232,0,29,0.06)] ring-2 ring-ten-red/10"
              : "border-gray-200 bg-white hover:border-ten-red/40"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <span className="block text-[14px] font-bold text-ten-ink">কবে পর্যন্ত রুটিন করতে চাও?</span>
              <span className="block text-[12px] text-gray-400 mt-0.5">
                {customActive && customDays && customDays >= 1
                  ? `আগামীকাল থেকে ${toBanglaNum(customDays)} দিন`
                  : "তারিখ দাও, দিন আপনা-আপনি হিসাব হবে"}
              </span>
            </div>
            <input
              type="date"
              min={getTomorrowStr()}
              value={customDate}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => handleCustomDateChange(e.target.value)}
              className="shrink-0 border border-gray-300 rounded-lg px-2 py-1.5 text-[13px] text-ten-ink bg-white focus:outline-none focus:border-ten-red cursor-pointer"
            />
          </div>
          {customActive && customDays && customDays >= 1 && (
            <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-ten-red flex items-center justify-center">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
          )}
        </button>
      </div>

      <button
        onClick={handleNext}
        disabled={!selected || generating}
        className="btn-primary w-full text-[16px] px-5 py-3.5 rounded-[10px] mt-5"
      >
        {generating ? (
          <span className="flex items-center justify-center gap-2">
            <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            {loadingMessages[loadingMsgIdx]}
          </span>
        ) : (
          "রুটিন জেনারেট করো →"
        )}
      </button>
    </div>
  );
}
