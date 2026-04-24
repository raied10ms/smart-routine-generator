"use client";

import type { RoutineDay, RoutineEntry } from "@/lib/types";
import { toBanglaNum } from "@/lib/utils";

interface Props {
  days: RoutineDay[];
  staggered?: boolean;
  dark?: boolean;
}

// ── Merge same-chapter entries within a day ───────────────────────────────────

type Category = "বেসিক" | "অনুশীলন" | "রিভিশন";

interface MergedEntry {
  chapterId: number;
  chapterName: string;
  subject: string;
  category: Category;
  types: string[];          // e.g. ["MCQ","SQ","CQ"]
  totalTimeMin: number;
  importance: number;
}

function categoryOf(taskType: string): Category {
  if (taskType.includes("বেসিক"))   return "বেসিক";
  if (taskType.includes("অনুশীলন")) return "অনুশীলন";
  return "রিভিশন";
}

function mergeEntries(entries: RoutineEntry[]): MergedEntry[] {
  const map = new Map<string, MergedEntry>();
  for (const e of entries) {
    const cat = categoryOf(e.taskType);
    const key = `${e.chapterId}::${cat}`;
    if (!map.has(key)) {
      map.set(key, {
        chapterId: e.chapterId, chapterName: e.chapterName, subject: e.subject,
        category: cat, types: [], totalTimeMin: 0,
        importance: e.importance ?? 0,
      });
    }
    const m = map.get(key)!;
    m.totalTimeMin += e.timeMin;
    const t = e.taskType.includes("MCQ") ? "MCQ"
            : e.taskType.includes("SQ")  ? "SQ"
            : e.taskType.includes("CQ")  ? "CQ"
            : null;
    if (t && !m.types.includes(t)) m.types.push(t);
  }
  return [...map.values()];
}

function badgeLabel(m: MergedEntry): string {
  if (m.category === "রিভিশন") return "রিভিশন";
  if (m.types.length >= 3 || m.types.length === 0) return m.category;
  return `${m.types.join("+")} ${m.category}`;
}

function stars(n: number): string {
  return "★".repeat(Math.max(0, Math.min(5, n)));
}

function fmtTime(minutes: number): string {
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${toBanglaNum(h)}h ${toBanglaNum(m)}m` : `${toBanglaNum(h)}h`;
  }
  return `${toBanglaNum(minutes)}m`;
}

// ── Badge colors ──────────────────────────────────────────────────────────────

function badgeClass(cat: Category, dark?: boolean): string {
  if (dark) {
    if (cat === "বেসিক")    return "bg-red-900/50 text-red-300";
    if (cat === "অনুশীলন") return "bg-amber-900/50 text-amber-300";
    return "bg-green-900/50 text-green-300";
  }
  if (cat === "বেসিক")    return "bg-red-100 text-red-700";
  if (cat === "অনুশীলন") return "bg-amber-100 text-amber-700";
  return "bg-green-100 text-green-700";
}

// ── Day header background ─────────────────────────────────────────────────────

function dayHeaderStyle(phase: number, dark?: boolean): string {
  if (dark) {
    if (phase === 1) return "bg-[rgba(232,0,29,0.12)]";
    if (phase === 2) return "bg-[rgba(245,158,11,0.12)]";
    return "bg-[rgba(28,171,85,0.12)]";
  }
  return "bg-[var(--color-surface)]";
}

function dayCardStyle(phase: number, dark?: boolean): string {
  if (dark) {
    if (phase === 1) return "bg-[rgba(232,0,29,0.07)] border-red-900/30";
    if (phase === 2) return "bg-[rgba(245,158,11,0.07)] border-amber-900/30";
    return "bg-[rgba(28,171,85,0.07)] border-green-900/30";
  }
  return "bg-white border-[var(--color-border)] shadow-[var(--shadow-card)]";
}

function phaseAccent(phase: number, dark?: boolean): string {
  if (dark) {
    if (phase === 1) return "text-red-400";
    if (phase === 2) return "text-amber-400";
    return "text-green-400";
  }
  return "text-[var(--color-primary)]";
}

function phaseLabelStyle(phase: number): string {
  if (phase === 1) return "bg-[rgba(232,0,29,0.15)] text-red-400";
  if (phase === 2) return "bg-[rgba(245,158,11,0.15)] text-amber-400";
  return "bg-[rgba(28,171,85,0.15)] text-green-400";
}

// ── Main component ────────────────────────────────────────────────────────────

export default function RoutineTable({ days, staggered, dark }: Props) {
  let currentPhase = 0;

  return (
    <div className="flex flex-col gap-2">
      {days.map((day, dayIdx) => {
        const showPhase = day.phase !== currentPhase;
        currentPhase = day.phase;

        // Group entries by subject, then merge within subject
        const bySubject: Record<string, RoutineEntry[]> = {};
        for (const e of day.entries) {
          if (!bySubject[e.subject]) bySubject[e.subject] = [];
          bySubject[e.subject].push(e);
        }

        return (
          <div key={day.dayNumber}>
            {showPhase && (
              <div className={`${phaseLabelStyle(day.phase)} px-4 py-2 text-[12px] font-bold rounded-xl mb-1.5`}>
                {day.phaseName}
              </div>
            )}
            <div
              className={`${dayCardStyle(day.phase, dark)} border rounded-xl overflow-hidden ${staggered ? "animate-fade-in" : ""}`}
              style={staggered ? { animationDelay: `${dayIdx * 200}ms`, animationFillMode: "both" } : undefined}
            >
              {/* Day header */}
              <div className={`flex items-center justify-between px-3 py-2 ${dayHeaderStyle(day.phase, dark)} border-b ${dark ? "border-white/5" : "border-[var(--color-border)]"}`}>
                <div className="flex items-center gap-2">
                  <span className={`font-bold text-[13px] ${dark ? "text-white" : "text-ten-ink"}`}>
                    Day {toBanglaNum(day.dayNumber)}
                  </span>
                  {day.isExtreme && <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${dark ? "bg-amber-900/50 text-amber-300" : "bg-amber-100 text-amber-700"}`}>⚡ পাওয়ার ডে</span>}
                  {day.isWeekend && <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${dark ? "bg-blue-900/40 text-blue-300" : "bg-blue-100 text-blue-600"}`}>🌙 হালকা</span>}
                </div>
                <span className={`text-[12px] font-semibold ${phaseAccent(day.phase, dark)}`}>
                  ~{fmtTime(day.totalTimeMin)}
                </span>
              </div>

              {/* Subjects → merged chapter rows */}
              {Object.entries(bySubject).map(([subject, entries], subIdx) => {
                const merged = mergeEntries(entries);
                return (
                  <div key={subject} className={subIdx > 0 ? `border-t ${dark ? "border-white/5" : "border-[var(--color-border)]"}` : ""}>
                    <div className={`px-3 pt-2 pb-0.5`}>
                      <span className={`text-[11px] font-bold uppercase tracking-wide ${dark ? "text-white/50" : "text-gray-400"}`}>{subject}</span>
                    </div>
                    {merged.map((m, i) => (
                      <div key={`${m.chapterId}-${m.category}`}
                        className={`flex items-center gap-2 px-3 pl-5 py-1.5 ${i < merged.length - 1 ? `border-b ${dark ? "border-white/5" : "border-gray-100"}` : ""}`}
                      >
                        <span className={`flex-1 min-w-0 text-[12px] truncate ${dark ? "text-white/80" : "text-ten-ink"}`}>
                          {m.chapterName}
                        </span>
                        {m.importance > 0 && (
                          <span className="shrink-0 text-[10px] text-amber-400 tracking-tighter leading-none">
                            {"★".repeat(m.importance)}
                          </span>
                        )}
                        <span className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded ${badgeClass(m.category, dark)}`}>
                          {badgeLabel(m)}
                        </span>
                        <span className={`shrink-0 text-[11px] font-medium w-10 text-right ${dark ? "text-white/50" : "text-gray-400"}`}>
                          {fmtTime(m.totalTimeMin)}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })}

              {day.entries.length === 0 && (
                <div className={`px-3 py-3 text-center text-[12px] ${dark ? "text-white/30" : "text-gray-400"}`}>কোনো টাস্ক নেই</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
