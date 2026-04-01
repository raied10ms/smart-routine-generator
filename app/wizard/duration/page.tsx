"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { DurationOption } from "@/lib/types";
import DurationTile from "@/components/DurationTile";

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
