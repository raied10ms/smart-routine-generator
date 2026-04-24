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
  const userInteracted = useRef(false);

  useEffect(() => {
    const handleInteraction = () => { userInteracted.current = true; };
    window.addEventListener("scroll", handleInteraction, { passive: true });
    window.addEventListener("touchstart", handleInteraction, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleInteraction);
      window.removeEventListener("touchstart", handleInteraction);
    };
  }, []);

  useEffect(() => {
    const saved = JSON.parse(sessionStorage.getItem("wizard") || "{}");
    if (!saved.routinePreview) { router.push("/wizard/duration"); return; }
    setData({ name: saved.name, routine: saved.routinePreview, durationDays: saved.durationDays });
  }, [router]);

  // Reveal: always 3 s total regardless of day count
  const delayMs = data ? Math.max(20, Math.round(3000 / data.routine.length)) : 300;

  useEffect(() => {
    if (!data || visibleCount >= data.routine.length) return;
    const timer = setTimeout(() => setVisibleCount((prev) => prev + 1), delayMs);
    return () => clearTimeout(timer);
  }, [data, visibleCount, delayMs]);

  // Scroll: one continuous rAF loop over 3 s, accounts for viewport height
  useEffect(() => {
    if (!data) return;
    const TOTAL_MS = 1800; // fast but smooth — finishes ~600ms after reveal
    const startTime = performance.now();
    let rafId: number;

    function tick(now: number) {
      if (userInteracted.current) return;
      const elapsed = now - startTime;
      if (elapsed >= TOTAL_MS) return;
      const progress = elapsed / TOTAL_MS;
      // maxScroll already accounts for viewport height
      const maxScroll = document.body.scrollHeight - window.innerHeight;
      window.scrollTo(0, maxScroll * progress);
      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [data]);

  if (!data) return null;

  const gapCount = data.routine.reduce((count, day) =>
    count + day.entries.filter((e) => e.taskType !== "রিভিশন").length, 0);

  function handleShare() {
    const text = `আমি SSC 27 এর জন্য ${data!.durationDays} দিনের personalized রুটিন তৈরি করেছি! তুমিও তৈরি করো 👉 ${window.location.origin}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  const visibleDays = data.routine.slice(0, visibleCount);

  return (
    <div className="pb-12">
      {/* Header */}
      <div className="pt-6 pb-5">
        <p className="text-white/50 text-[13px] mb-1">{data.name},</p>
        <h1 className="text-[22px] font-bold text-white leading-snug">তোমার রুটিন তৈরি হয়েছে!</h1>
      </div>

      {/* Summary banner */}
      <div className="bg-white/5 border border-white/8 rounded-2xl px-4 py-3.5 mb-5 flex items-center gap-4">
        <div>
          <div className="text-[10px] text-white/40 uppercase tracking-wider">মোট দিন</div>
          <div className="text-[22px] font-bold text-ten-red leading-none">{toBanglaNum(data.durationDays)}</div>
        </div>
        <div className="w-px h-8 bg-white/10" />
        <div>
          <div className="text-[10px] text-white/40 uppercase tracking-wider">টাস্ক</div>
          <div className="text-[22px] font-bold text-white leading-none">{toBanglaNum(gapCount)}</div>
        </div>
        <div className="w-px h-8 bg-white/10" />
        <div className="flex-1 min-w-0">
          <div className="text-[10px] text-white/40 uppercase tracking-wider">ছাত্র</div>
          <div className="text-[14px] font-bold text-white truncate">{data.name}</div>
        </div>
      </div>

      <RoutineTable days={visibleDays} staggered dark />

      {/* Action buttons */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={handleShare}
          className="flex-1 py-3.5 rounded-xl bg-[#25D366]/15 border border-[#25D366]/30 text-[#4ADE80] font-bold text-[14px] hover:bg-[#25D366]/25 transition-colors cursor-pointer flex items-center justify-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/></svg>
          শেয়ার করো
        </button>
        <button
          onClick={() => router.push("/wizard/capture")}
          className="flex-1 py-3.5 rounded-xl bg-ten-red/15 border border-ten-red/30 text-ten-red font-bold text-[14px] hover:bg-ten-red/25 transition-colors cursor-pointer flex items-center justify-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
          PDF নামাও
        </button>
      </div>
    </div>
  );
}
