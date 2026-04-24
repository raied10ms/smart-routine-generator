"use client";

import type { RoutineDay } from "@/lib/types";
import { toBanglaNum } from "@/lib/utils";

interface Props {
  days: RoutineDay[];
  staggered?: boolean;
  dark?: boolean;
}

function getTaskBadgeClass(taskType: string, dark?: boolean): string {
  const isMCQ  = taskType.includes("MCQ");
  const isSQ   = taskType.includes("SQ");
  const isCQ   = taskType.includes("CQ");
  const isRev  = taskType === "রিভিশন";

  if (dark) {
    if (isMCQ)  return "bg-amber-900/50 text-amber-300";
    if (isSQ)   return "bg-blue-900/50 text-blue-300";
    if (isCQ)   return "bg-purple-900/50 text-purple-300";
    if (isRev)  return "bg-green-900/50 text-green-300";
    return "bg-white/10 text-white/60";
  }
  if (isMCQ)  return "bg-amber-100 text-amber-700";
  if (isSQ)   return "bg-blue-100 text-blue-700";
  if (isCQ)   return "bg-purple-100 text-purple-700";
  if (isRev)  return "bg-green-100 text-green-700";
  return "bg-gray-100 text-gray-700";
}

function formatTime(minutes: number): string {
  if (minutes >= 60) {
    const hrs = Math.round(minutes / 60 * 10) / 10;
    return `${toBanglaNum(hrs)} ঘণ্টা`;
  }
  return `${toBanglaNum(minutes)} মি.`;
}

export default function RoutineTable({ days, staggered, dark }: Props) {
  let currentPhase = 0;

  return (
    <div className="flex flex-col gap-3">
      {days.map((day, dayIdx) => {
        const showPhase = day.phase !== currentPhase;
        currentPhase = day.phase;

        if (dark) {
          const phaseColors: Record<number, { cardBg: string; headerBg: string; accentText: string; labelBg: string; labelText: string }> = {
            1: { cardBg: "bg-[rgba(232,0,29,0.07)] border-red-900/30",    headerBg: "bg-[rgba(232,0,29,0.12)]",    accentText: "text-red-400",    labelBg: "bg-[rgba(232,0,29,0.15)]",    labelText: "text-red-400" },
            2: { cardBg: "bg-[rgba(245,158,11,0.07)] border-amber-900/30", headerBg: "bg-[rgba(245,158,11,0.12)]",  accentText: "text-amber-400",  labelBg: "bg-[rgba(245,158,11,0.15)]",  labelText: "text-amber-400" },
            3: { cardBg: "bg-[rgba(28,171,85,0.07)] border-green-900/30",  headerBg: "bg-[rgba(28,171,85,0.12)]",   accentText: "text-green-400",  labelBg: "bg-[rgba(28,171,85,0.15)]",   labelText: "text-green-400" },
          };
          const pc = phaseColors[day.phase] || phaseColors[1];

          return (
            <div key={day.dayNumber}>
              {showPhase && (
                <div className={`${pc.labelBg} ${pc.labelText} px-4 py-2.5 text-[13px] font-bold rounded-xl mb-2`}>
                  {day.phaseName}
                </div>
              )}
              <div
                className={`${pc.cardBg} border rounded-xl overflow-hidden ${staggered ? "animate-fade-in" : ""}`}
                style={staggered ? { animationDelay: `${dayIdx * 200}ms`, animationFillMode: "both" } : undefined}
              >
                <div className={`flex items-center justify-between px-4 py-2.5 ${pc.headerBg} border-b border-white/5`}>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[14px] text-white">Day {toBanglaNum(day.dayNumber)}</span>
                    {day.isExtreme && <span className="text-[11px] bg-amber-900/50 text-amber-300 px-2 py-0.5 rounded-full font-medium">পাওয়ার ডে ⚡</span>}
                    {day.isWeekend && <span className="text-[11px] bg-blue-900/40 text-blue-300 px-2 py-0.5 rounded-full font-medium">🌙 হালকা দিন</span>}
                  </div>
                  <span className={`text-[13px] font-semibold ${pc.accentText}`}>~{formatTime(day.totalTimeMin)}</span>
                </div>
                {(() => {
                  const grouped = day.entries.reduce<Record<string, typeof day.entries>>((acc, e) => {
                    if (!acc[e.subject]) acc[e.subject] = [];
                    acc[e.subject].push(e);
                    return acc;
                  }, {});
                  return Object.entries(grouped).map(([subject, entries], groupIdx) => (
                    <div key={`${day.dayNumber}-${subject}`} className={groupIdx > 0 ? "border-t border-white/5" : ""}>
                      <div className="px-4 pt-2.5 pb-1 border-t border-white/5">
                        <span className="font-bold text-[13px] text-white/80">{subject}</span>
                      </div>
                      {entries.map((entry, i) => (
                        <div key={`${day.dayNumber}-${subject}-${i}`} className="flex items-center gap-3 px-4 pl-7 py-1.5">
                          <span className="flex-1 min-w-0 text-[12px] text-white/50 truncate">{entry.chapterName}</span>
                          <span className={`shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full ${getTaskBadgeClass(entry.taskType, true)}`}>{entry.taskType}</span>
                          <span className="shrink-0 text-[13px] font-medium w-12 text-right text-white/60">{toBanglaNum(entry.timeMin)} মি.</span>
                        </div>
                      ))}
                    </div>
                  ));
                })()}
                {day.entries.length === 0 && <div className="px-4 py-3 text-center text-[13px] text-white/30">কোনো টাস্ক নেই</div>}
              </div>
            </div>
          );
        }

        // Light mode
        const phaseColors: Record<number, { bg: string; text: string }> = {
          1: { bg: "bg-[var(--color-primary-light)]", text: "text-[var(--color-primary)]" },
          2: { bg: "bg-amber-50", text: "text-[var(--color-warning)]" },
          3: { bg: "bg-green-50", text: "text-[var(--color-success)]" },
        };
        const pc = phaseColors[day.phase] || phaseColors[1];

        return (
          <div key={day.dayNumber}>
            {showPhase && (
              <div className={`${pc.bg} ${pc.text} px-4 py-3 text-[14px] font-bold rounded-[var(--radius-card)] mb-2`}>
                {day.phaseName}
              </div>
            )}
            <div
              className={`bg-white rounded-[var(--radius-card)] shadow-[var(--shadow-card)] border border-[var(--color-border)] overflow-hidden ${day.isWeekend ? "bg-blue-50/30" : ""} ${staggered ? "animate-fade-in" : ""}`}
              style={staggered ? { animationDelay: `${dayIdx * 200}ms`, animationFillMode: "both" } : undefined}
            >
              <div className="flex items-center justify-between px-4 py-2.5 bg-[var(--color-surface)] border-b border-[var(--color-border)]">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[14px]">Day {toBanglaNum(day.dayNumber)}</span>
                  {day.isExtreme && <span className="text-[11px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">পাওয়ার ডে ⚡</span>}
                  {day.isWeekend && <span className="text-[11px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium">🌙 হালকা দিন</span>}
                </div>
                <span className="text-[13px] font-semibold text-[var(--color-primary)]">মোট: ~{formatTime(day.totalTimeMin)}</span>
              </div>
              {(() => {
                const grouped = day.entries.reduce<Record<string, typeof day.entries>>((acc, e) => {
                  if (!acc[e.subject]) acc[e.subject] = [];
                  acc[e.subject].push(e);
                  return acc;
                }, {});
                return Object.entries(grouped).map(([subject, entries], groupIdx) => (
                  <div key={`${day.dayNumber}-${subject}`} className={groupIdx > 0 ? "border-t border-[var(--color-border)]" : ""}>
                    <div className="px-4 pt-2.5 pb-1 border-t border-[var(--color-border)]">
                      <span className="font-bold text-[13px]">{subject}</span>
                    </div>
                    {entries.map((entry, i) => (
                      <div key={`${day.dayNumber}-${subject}-${i}`} className="flex items-center gap-3 px-4 pl-7 py-1.5">
                        <span className="flex-1 min-w-0 text-[12px] text-[var(--color-text-muted)] truncate">{entry.chapterName}</span>
                        <span className={`shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full ${getTaskBadgeClass(entry.taskType)}`}>{entry.taskType}</span>
                        <span className="shrink-0 text-[13px] font-medium w-12 text-right">{toBanglaNum(entry.timeMin)} মি.</span>
                      </div>
                    ))}
                  </div>
                ));
              })()}
              {day.entries.length === 0 && <div className="px-4 py-3 text-center text-[13px] text-[var(--color-text-muted)]">কোনো টাস্ক নেই</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
