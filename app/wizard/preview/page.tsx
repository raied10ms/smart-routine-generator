"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import type { RoutineDay } from "@/lib/types";
import RoutineTable from "@/components/RoutineTable";
import { toBanglaNum } from "@/lib/utils";

export default function PreviewPage() {
  const router = useRouter();
  const [data, setData] = useState<{ name: string; routine: RoutineDay[]; durationDays: number } | null>(null);
  const [visibleCount, setVisibleCount] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = JSON.parse(sessionStorage.getItem("wizard") || "{}");
    if (!saved.routinePreview) { router.push("/wizard/duration"); return; }
    setData({ name: saved.name, routine: saved.routinePreview, durationDays: saved.durationDays });
  }, [router]);

  // Staggered reveal: show days one by one with 500ms delay
  useEffect(() => {
    if (!data) return;
    if (visibleCount >= data.routine.length) return;

    const timer = setTimeout(() => {
      setVisibleCount((prev) => prev + 1);
    }, 500);

    return () => clearTimeout(timer);
  }, [data, visibleCount]);

  // Auto-scroll 300ms after each day appears
  useEffect(() => {
    if (visibleCount > 0 && bottomRef.current) {
      const scrollTimer = setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      }, 300);
      return () => clearTimeout(scrollTimer);
    }
  }, [visibleCount]);

  if (!data) return null;

  const gapCount = data.routine.reduce((count, day) => {
    return count + day.entries.filter((e) => e.taskType !== "রিভিশন").length;
  }, 0);

  function handleShare() {
    const text = `আমি SSC 27 এর জন্য ${data!.durationDays} দিনের personalized রুটিন তৈরি করেছি! তুমিও তৈরি করো 👉 ${window.location.origin}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  const visibleDays = data.routine.slice(0, visibleCount);

  return (
    <div>
      <h1 className="text-[22px] font-bold mb-3">তোমার রুটিন তৈরি হয়েছে!</h1>
      <div className="bg-[var(--color-primary)] text-white rounded-[var(--radius-card)] px-4 py-3 mb-4 text-[14px]">
        <span className="font-semibold">{toBanglaNum(data.durationDays)} দিন</span> | {toBanglaNum(gapCount)} টি task চিহ্নিত
      </div>
      <RoutineTable days={visibleDays} staggered />
      <div ref={bottomRef} />
      <div className="flex gap-3 mt-6">
        <button onClick={handleShare}
          className="cursor-pointer flex-1 py-3 rounded-[var(--radius-button)] bg-[#25D366] text-white font-semibold text-[14px] hover:bg-[#1fb855] transition-colors">
          বন্ধুকে share করো
        </button>
        <button onClick={() => router.push("/wizard/capture")}
          className="cursor-pointer flex-1 py-3 rounded-[var(--radius-button)] bg-[var(--color-primary)] text-white font-semibold text-[14px] hover:bg-[var(--color-primary)]/90 transition-colors">
          PDF পেতে →
        </button>
      </div>
    </div>
  );
}
