import type { RoutineDay, RoutineEntry, Assessment, AssessmentStatus } from "./types";

interface PrintProps {
  name: string;
  grade: string;
  durationDays: number;
  routine: RoutineDay[];
  assessment?: Assessment;
  autoPrint?: boolean;
}

const LOGO_B64 = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA3ODAgMjE1LjYiPjxkZWZzPjxzdHlsZT4uY2xzLTF7ZmlsbDojMjMxZjIwO30uY2xzLTJ7ZmlsbDojZWIyMDI2O308L3N0eWxlPjwvZGVmcz48dGl0bGU+MTBNUyAtIFNWRzwvdGl0bGU+PGcgaWQ9IkxheWVyXzIiIGRhdGEtbmFtZT0iTGF5ZXIgMiI+PGcgaWQ9IkxheWVyXzEtMiIgZGF0YS1uYW1lPSJMYXllciAxIj48cG9seWdvbiBjbGFzcz0iY2xzLTEiIHBvaW50cz0iNTguMTYgMjE1LjYgMjcuNjIgMjE1LjYgMjcuNjIgMzAuNTQgMCAzMC41NCAwIDAgNTguMTYgMCA1OC4xNiAyMTUuNiIvPjxwYXRoIGNsYXNzPSJjbHMtMiIgZD0iTTE2OS45LDEyNS43MywyMzIsNjMuNjJDMjI1LjIxLDMwLjQ2LDE5OC44NCw0LjQzLDE2NS40My4yNWMtLjYzLS4wOC0xLjI3LS4xNS0xLjktLjIxVjMwLjgzQzE3OCwzMy4yOCwxOTAsNDIuNjQsMTk3LDU1LjUybC00OC42NCw0OC42M1oiLz48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik0yMDMsMTE0LjI2bC0uMTMsMjAuM3YuMWMwLDI3Ljc3LTIxLjE0LDUwLjM2LTQ3LjEyLDUwLjM2cy00Ny4xLTIyLjU3LTQ3LjEyLTUwLjMxTDEwOSw4MC42NnYtLjFjMC0yNC42OCwxNi43Ni00NS42NiwzOS4zMS00OS42N1YuMDdsLTIsLjIzQzEwNy42LDUuMzgsNzguNDQsMzkuODYsNzguNDEsODAuNTFsLS4zNSw1NC4wNXYuMWMwLDQ0LjYxLDM0Ljg0LDgwLjksNzcuNjYsODAuOXM3Ny42My0zNi4yNiw3Ny42NS04MC44NWwuMzQtNTEuMTlaIi8+PHBvbHlnb24gY2xhc3M9ImNscy0xIiBwb2ludHM9IjM1MC42IDAuMTQgMzUwLjYgOTcuNjYgMzM3LjIxIDk3LjY2IDMzNy4yMSAzMC41NSAzMDYuOTMgOTcuOCAyNzcuNjQgMzAuNTUgMjc3LjY0IDk3LjY2IDI2NC4yNCA5Ny42NiAyNjQuMjQgMC4xNCAyODAuMjkgMC4xNCAzMDYuOTMgNjMuNDggMzM0LjcgMC4xNCAzNTAuNiAwLjE0Ii8+PHJlY3QgY2xhc3M9ImNscy0xIiB4PSIzODMuMzIiIHk9IjAuMTQiIHdpZHRoPSIxMy41MyIgaGVpZ2h0PSI5Ny43OSIvPjxwb2x5Z29uIGNsYXNzPSJjbHMtMSIgcG9pbnRzPSI1MDEuNDkgMC4xNCA1MDEuNDkgOTcuOCA0ODYuMTQgOTcuOCA0NDMuMzEgMjQgNDQzLjMxIDk3LjggNDMwLjIgOTcuOCA0MzAuMiAwLjE0IDQ0NS42OSAwLjE0IDQ4OC42NSA3NS43NSA0ODguNjUgMC4xNCA1MDEuNDkgMC4xNCIvPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTYwMS41OSwwVjYzLjQ4QTM1LDM1LDAsMCwxLDUzNy40Miw4MmEzNi4wNywzNi4wNywwLDAsMS01LjcyLTE4LjU1VjBoMTMuMzlWNjIuNzhhMjEuNDksMjEuNDksMCwwLDAsNDMsMFYwWiIvPjxwb2x5Z29uIGNsYXNzPSJjbHMtMSIgcG9pbnRzPSI3MDAuNTcgMCA3MDAuNTcgMTIuOTcgNjY3Ljc4IDEyLjg0IDY2OC4wNiA5Ny45MyA2NTQuMjUgOTcuOTMgNjU0LjM5IDEyLjg0IDYyMi4xNyAxMi44NCA2MjIuMTcgMCA3MDAuNTcgMCIvPjxwb2x5Z29uIGNsYXNzPSJjbHMtMSIgcG9pbnRzPSI3ODAgODQuODIgNzgwIDk3Ljc5IDcyMC43NiA5Ny43OSA3MjAuNzYgMC4xNCA3ODAgMC4xNCA3ODAgMTMuMjUgNzM0LjE2IDEzLjI1IDczNC4xNiA0My4yNSA3NjkuMTcgNDMuMjUgNzY5LjE3IDU2LjIyIDczNC4xNiA1Ni4yMiA3MzQuMTYgODQuODIgNzgwIDg0LjgyIi8+PHBhdGggY2xhc3M9ImNscy0xIiBkPSJNMjkzLjUyLDIxNC44OGMtMTIuMTMsMC0yMy4yOC01LjcxLTI5LjI4LTEzLjk0di0uMjhsNS41OC05LjQ4YzQuMzIsNi4yOCwxMi42OCwxMS4xNiwyMy44NCwxMS44NWgzLjYyYzkuNjIsMCwxNy41Ny03LjExLDE3LjU3LTE2Ljcycy03LjUzLTEzLjUzLTE3LjU3LTE1LjA2YTY1Ljg2LDY1Ljg2LDAsMCwwLTYuNTUtMWMtMTMuOC0yLjY0LTI2LjIxLTEwLjczLTI2LjIxLTI1LjM3UzI3Ni4zNywxMTgsMjkwLjczLDExOGgyLjA5YzkuNjIsMCwxOS45Myw0LjE4LDI1LjA5LDEwLjczbC02LjI3LDExLjU3Yy01LjQ0LTYtMTAuNTktOS4zNC0xOC44Mi05Ljc2aC0yLjA5Yy03LjM5LDAtMTMuNTIsNi43LTEzLjUyLDE0LjM2LDAsNy4zOSw1LjE2LDExLjQzLDEzLjUyLDEyLjU1LDMuNDkuNDIsNS44NS41Niw2LjgzLjcsMTYuNTksMi4yMywyOS4xNCwxMS43MSwyOS4xNCwyOC4xNnMtMTMuMjUsMjguMTUtMjkuNDIsMjguNTdaIi8+PHBhdGggY2xhc3M9ImNscy0xIiBkPSJNNDEyLjIsMjA2LjI0YTQ3LjkyLDQ3LjkyLDAsMCwxLTI4LDguOTIsNDguNzksNDguNzksMCwwLDEsMC05Ny41OCw0Ny44OCw0Ny44OCwwLDAsMSwyOCw4Ljc4bC02LjEzLDEyLjgzYTMzLjQxLDMzLjQxLDAsMCwwLTIxLjg5LTcuNTMsMzQuNzgsMzQuNzgsMCwxLDAsMjIuMyw2MS42MVoiLz48cG9seWdvbiBjbGFzcz0iY2xzLTEiIHBvaW50cz0iNDk4LjA5IDExNy41OCA0OTguMDkgMjE1LjAyIDQ4NC41NyAyMTUuMDIgNDg0LjU3IDE3NC4zMiA0NDAuMSAxNzQuMzIgNDQwLjEgMjE1LjAyIDQyNi41OCAyMTUuMDIgNDI2LjU4IDExNy41OCA0NDAuMSAxMTcuNTggNDQwLjEgMTYyLjA1IDQ4NC41NyAxNjIuMDUgNDg0LjU3IDExNy41OCA0OTguMDkgMTE3LjU4Ii8+PHBhdGggY2xhc3M9ImNscy0xIiBkPSJNNjA2LjQ5LDE2Ni4wOUM2MDYuNDksMTkzLDU4NiwyMTUsNTU5LDIxNWMtMjUuNjUsMC00Ni4yOC0yMi00Ni4yOC00OC45MywwLTI2Ljc2LDIwLjYzLTQ4LjY1LDQ2LjI4LTQ4LjY1LDI3LDAsNDcuNTMsMjEuODksNDcuNTMsNDguNjVtLTEzLjM4LDBjMC0xOS4zNy0xNC42NC0zNS4xMy0zNC4xNS0zNS4xMy0xOC4yNywwLTMyLjksMTUuNzYtMzIuOSwzNS4xMywwLDE5LjY2LDE0LjYzLDM1LjU1LDMyLjksMzUuNTUsMTkuNTEsMCwzNC4xNS0xNS44OSwzNC4xNS0zNS41NSIvPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTcxMS4xNiwxNjYuMDljMCwyNi45MS0yMC40OSw0OC45My00Ny41Myw0OC45My0yNS42NiwwLTQ2LjI5LTIyLTQ2LjI5LTQ4LjkzLDAtMjYuNzYsMjAuNjMtNDguNjUsNDYuMjktNDguNjUsMjcsMCw0Ny41MywyMS44OSw0Ny41Myw0OC42NW0tMTMuMzgsMGMwLTE5LjM3LTE0LjY0LTM1LjEzLTM0LjE1LTM1LjEzLTE4LjI3LDAtMzIuOTEsMTUuNzYtMzIuOTEsMzUuMTMsMCwxOS42NiwxNC42NCwzNS41NSwzMi45MSwzNS41NSwxOS41MSwwLDM0LjE1LTE1Ljg5LDM0LjE1LTM1LjU1Ii8+PHBvbHlnb24gY2xhc3M9ImNscy0xIiBwb2ludHM9IjczOS4wMiAyMDEuOTIgNzgwIDIwMS45MiA3ODAgMjE1LjE2IDcyNS43NyAyMTUuMTYgNzI1Ljc3IDExNy41OCA3MzkuMDIgMTE3LjU4IDczOS4wMiAyMDEuOTIiLz48L2c+PC9nPjwvc3ZnPg==";

function fmtTime(minutes: number): string {
  if (minutes >= 60) return `${Math.round(minutes / 60 * 10) / 10}h`;
  return `${minutes}m`;
}

function totalHours(routine: RoutineDay[]): number {
  const totalMin = routine.reduce((s, d) => s + d.totalTimeMin, 0);
  return Math.round(totalMin / 60);
}

function countSubjects(routine: RoutineDay[]): number {
  const subjects = new Set<string>();
  for (const day of routine) for (const e of day.entries) subjects.add(e.subject);
  return subjects.size;
}

function phaseDayRange(routine: RoutineDay[], phase: 1 | 2 | 3): string {
  const days = routine.filter((d) => d.phase === phase);
  if (days.length === 0) return "";
  return `Day ${days[0].dayNumber} – Day ${days[days.length - 1].dayNumber}`;
}

// ── Merge helpers (same logic as RoutineTable) ──────────────────────────────

type PrintCategory = "বেসিক" | "অনুশীলন" | "রিভিশন";

interface MergedRow {
  chapterId: number;
  chapterName: string;
  category: PrintCategory;
  types: string[];
  totalTimeMin: number;
  importance: number;
}

function categoryOf(taskType: string): PrintCategory {
  if (taskType.includes("বেসিক"))   return "বেসিক";
  if (taskType.includes("অনুশীলন")) return "অনুশীলন";
  return "রিভিশন";
}

function mergeForPrint(entries: RoutineEntry[]): Record<string, MergedRow[]> {
  const bySubject: Record<string, Map<string, MergedRow>> = {};
  for (const e of entries) {
    const cat = categoryOf(e.taskType);
    const key = `${e.chapterId}::${cat}`;
    if (!bySubject[e.subject]) bySubject[e.subject] = new Map();
    const map = bySubject[e.subject];
    if (!map.has(key)) {
      map.set(key, {
        chapterId: e.chapterId, chapterName: e.chapterName,
        category: cat, types: [], totalTimeMin: 0,
        importance: e.importance ?? 0,
      });
    }
    const m = map.get(key)!;
    m.totalTimeMin += e.timeMin;
    const t = e.taskType.includes("MCQ") ? "MCQ" : e.taskType.includes("SQ") ? "SQ" : e.taskType.includes("CQ") ? "CQ" : null;
    if (t && !m.types.includes(t)) m.types.push(t);
  }
  const result: Record<string, MergedRow[]> = {};
  for (const [subj, map] of Object.entries(bySubject)) {
    result[subj] = [...map.values()];
  }
  return result;
}

function badgeLabel(m: MergedRow): string {
  if (m.category === "রিভিশন") return "রিভিশন";
  if (m.types.length === 0 || m.types.length >= 3) return m.category;
  return `${m.types.join("+")} ${m.category}`;
}

function categoryBadgeStyle(cat: PrintCategory): string {
  if (cat === "বেসিক")    return "background:#FFF5F5;color:#931212;border:1px solid #FECACA";
  if (cat === "অনুশীলন") return "background:#FEF3C7;color:#92400E;border:1px solid #FDE68A";
  return "background:#ECFDF5;color:#065F46;border:1px solid #6EE7B7";
}

function phaseBannerStyle(phase: 1 | 2 | 3): string {
  if (phase === 1) return "background:#FFF5F5;border-left:3.5px solid #931212";
  if (phase === 2) return "background:#FFFBEB;border-left:3.5px solid #D97706";
  return "background:#F0FDF4;border-left:3.5px solid #1CAB55";
}

function phaseNumStyle(phase: 1 | 2 | 3): string {
  if (phase === 1) return "color:#931212";
  if (phase === 2) return "color:#D97706";
  return "color:#1CAB55";
}

function dayHeaderBg(day: RoutineDay): string {
  if (day.phase === 1) return "#FFF5F5";
  if (day.phase === 2) return "#FFFBEB";
  return "#F0FDF4";
}

function renderTaskRows(entries: RoutineEntry[]): string {
  const bySubject = mergeForPrint(entries);

  return Object.entries(bySubject).map(([subject, rows]) => `
    <tr style="background:#F9FAFB">
      <td colspan="4" style="padding:2px 8px;font-size:6.5pt;font-weight:700;color:#6B7280;letter-spacing:.4px;text-transform:uppercase;border-bottom:1px dashed #E5E7EB">${subject}</td>
    </tr>
    ${rows.map((m) => `
    <tr>
      <td style="width:20px;text-align:center;padding:3px 4px;border-bottom:1px solid #F3F4F6">
        <span style="display:inline-block;width:11px;height:11px;border:1.5px solid #9CA3AF;border-radius:2px"></span>
      </td>
      <td style="padding:3px 5px 3px 2px;border-bottom:1px solid #F3F4F6;font-size:8pt;color:#111827;font-family:'Hind Siliguri',sans-serif;line-height:1.3">
        ${m.chapterName}
        ${m.importance > 0 ? `<span style="color:#F59E0B;font-size:7pt;margin-left:3px">${"★".repeat(m.importance)}</span>` : ""}
      </td>
      <td style="text-align:center;padding:3px 4px;border-bottom:1px solid #F3F4F6;white-space:nowrap">
        <span style="font-size:6.5pt;font-weight:700;padding:1.5px 5px;border-radius:3px;display:inline-block;white-space:nowrap;${categoryBadgeStyle(m.category)}">${badgeLabel(m)}</span>
      </td>
      <td style="width:24px;text-align:right;padding:3px 7px 3px 0;border-bottom:1px solid #F3F4F6;font-size:7pt;color:#9CA3AF">${fmtTime(m.totalTimeMin)}</td>
    </tr>`).join("")}
  `).join("");
}

// ── Self-diagnosis summary section ──────────────────────────────────────────

function renderDiagnosis(assessment: Assessment): string {
  const entries = Object.entries(assessment);
  if (entries.length === 0) return "";

  const statusLabel: Record<AssessmentStatus, string> = {
    pari:         "পারি",
    revise:       "রিভাইজ",
    pari_na:      "পারিনা",
    syllabus_nai: "সিলেবাসে নাই",
  };
  const statusColor: Record<AssessmentStatus, string> = {
    pari:         "background:#ECFDF5;color:#065F46;border:1px solid #6EE7B7",
    revise:       "background:#FFFBEB;color:#92400E;border:1px solid #FDE68A",
    pari_na:      "background:#FEF2F2;color:#991B1B;border:1px solid #FCA5A5",
    syllabus_nai: "background:#F3F4F6;color:#6B7280;border:1px dashed #D1D5DB",
  };
  // Face SVG paths (inline, single-color)
  const faceSvg: Record<AssessmentStatus, string> = {
    pari:         `<span style="font-size:10pt;vertical-align:middle;margin-right:2px">😊</span>`,
    revise:       `<span style="font-size:10pt;vertical-align:middle;margin-right:2px">😐</span>`,
    pari_na:      `<span style="font-size:10pt;vertical-align:middle;margin-right:2px">😢</span>`,
    syllabus_nai: `<span style="font-size:10pt;vertical-align:middle;margin-right:2px">✌️</span>`,
  };

  const rows = entries.map(([subject, chStatuses]) => {
    const counts: Record<AssessmentStatus, number> = { pari: 0, revise: 0, pari_na: 0, syllabus_nai: 0 };
    for (const s of Object.values(chStatuses)) counts[s as AssessmentStatus]++;
    const total = Object.values(counts).reduce((a, b) => a + b, 0);

    // Determine dominant status (all same → single pill; mixed → show counts)
    const statuses = (["pari", "revise", "pari_na", "syllabus_nai"] as AssessmentStatus[])
      .filter((s) => counts[s] > 0);
    const allSame = statuses.length === 1;

    const pills = statuses.map((s) =>
      `<span style="display:inline-flex;align-items:center;font-size:6.5pt;font-weight:700;padding:2px 5px;border-radius:3px;${statusColor[s]}">${faceSvg[s]}${allSame ? statusLabel[s] : counts[s]}</span>`
    ).join(" ");

    return `
    <div style="display:flex;align-items:center;gap:6px;padding:5px 8px;border:1px solid #E5E7EB;border-radius:8px;background:#fff">
      <span style="flex:1;min-width:0;font-size:7.5pt;color:#111827;font-family:'Hind Siliguri',sans-serif;line-height:1.3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${subject}</span>
      <span style="font-size:6pt;color:#9CA3AF;flex-shrink:0">${total}</span>
      <div style="display:flex;gap:3px;flex-shrink:0">${pills}</div>
    </div>`;
  }).join("");

  return `
  <div style="border:1.5px solid #E5E7EB;border-radius:10px;padding:10px 14px;margin-bottom:12px">
    <div style="font-size:9pt;font-weight:700;color:#111827;margin-bottom:8px;display:flex;align-items:center;gap:6px">
      <span style="display:inline-block;width:3px;height:14px;background:#931212;border-radius:2px"></span>
      তোমার নিজস্ব মূল্যায়ন
    </div>
    <div style="display:flex;gap:8px;margin-bottom:8px;font-size:7pt;color:#6B7280">
      <span style="display:flex;align-items:center;gap:3px">${faceSvg.pari} পারি</span>
      <span style="display:flex;align-items:center;gap:3px">${faceSvg.revise} রিভাইজ দিলে পারবো</span>
      <span style="display:flex;align-items:center;gap:3px">${faceSvg.pari_na} একদম পারিনা</span>
      <span style="display:flex;align-items:center;gap:3px">${faceSvg.syllabus_nai} সিলেবাসে নাই</span>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px">${rows}</div>
  </div>`;
}

function renderCoverPage(props: PrintProps): string {
  const { name, grade, durationDays, routine, assessment } = props;
  const phases = [1, 2, 3] as const;
  const phaseNames: Record<number, string> = { 1: "ফাউন্ডেশন", 2: "প্র্যাকটিস", 3: "রিভিশন" };

  const phaseDotsHtml = routine.map((d) => {
    const color = d.phase === 1 ? "#FEE2E2" : d.phase === 2 ? "#FEF3C7" : "#D1FAE5";
    const textColor = d.phase === 1 ? "#991B1B" : d.phase === 2 ? "#92400E" : "#065F46";
    return `<span style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:4px;background:${color};color:${textColor};font-size:6.5pt;font-weight:700;margin:2px">${d.dayNumber}</span>`;
  }).join("");

  return `
  <div class="page">
    <div class="page-hd">
      <img src="${LOGO_B64}" alt="10MS" style="height:22px;width:auto">
      <div style="flex:1;text-align:center">
        <div style="font-size:11.5pt;font-weight:800;color:#111827;letter-spacing:-.2px">${grade} SMART ROUTINE</div>
        <div style="font-size:7.5pt;color:#6B7280;margin-top:2px">Personalized Study Plan · ${grade} · 10 Minute School</div>
      </div>
      <div style="text-align:right;font-size:8pt;color:#4B5563">
        <strong style="display:block;font-size:9pt">${name}</strong>
        ${grade} · 10MS
      </div>
    </div>

    <!-- Stats -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);border:1.5px solid #E5E7EB;border-radius:10px;overflow:hidden;margin-bottom:12px">
      <div style="padding:10px;text-align:center;border-right:1px solid #E5E7EB">
        <span style="display:block;font-size:22pt;font-weight:800;color:#931212;line-height:1">${durationDays}</span>
        <span style="display:block;font-size:7.5pt;color:#6B7280;margin-top:3px;font-family:'Hind Siliguri',sans-serif">মোট দিন</span>
      </div>
      <div style="padding:10px;text-align:center;border-right:1px solid #E5E7EB">
        <span style="display:block;font-size:22pt;font-weight:800;color:#931212;line-height:1">~${totalHours(routine)}</span>
        <span style="display:block;font-size:7.5pt;color:#6B7280;margin-top:3px;font-family:'Hind Siliguri',sans-serif">মোট ঘণ্টা</span>
      </div>
      <div style="padding:10px;text-align:center;border-right:1px solid #E5E7EB">
        <span style="display:block;font-size:22pt;font-weight:800;color:#931212;line-height:1">3</span>
        <span style="display:block;font-size:7.5pt;color:#6B7280;margin-top:3px;font-family:'Hind Siliguri',sans-serif">পর্যায় (Phase)</span>
      </div>
      <div style="padding:10px;text-align:center">
        <span style="display:block;font-size:22pt;font-weight:800;color:#1CAB55;line-height:1">${countSubjects(routine)}</span>
        <span style="display:block;font-size:7.5pt;color:#6B7280;margin-top:3px;font-family:'Hind Siliguri',sans-serif">বিষয়</span>
      </div>
    </div>

    <!-- Phase overview -->
    <div style="border:1.5px solid #E5E7EB;border-radius:10px;padding:10px 14px;margin-bottom:12px">
      <div style="font-size:9pt;font-weight:700;color:#111827;margin-bottom:8px;display:flex;align-items:center;gap:6px">
        <span style="display:inline-block;width:3px;height:14px;background:#931212;border-radius:2px"></span>
        পর্যায়ের ভাগ
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
        ${phases.map((p) => {
          const range = phaseDayRange(routine, p);
          const colors = [["#FFF5F5","#931212","#FECACA"],["#FFFBEB","#D97706","#FDE68A"],["#F0FDF4","#1CAB55","#6EE7B7"]];
          const [bg, text, border] = colors[p - 1];
          return range ? `
          <div style="background:${bg};border:1px solid ${border};border-radius:8px;padding:8px 10px">
            <div style="font-size:7.5pt;font-weight:700;color:${text};margin-bottom:2px">Phase ${p}</div>
            <div style="font-size:8.5pt;font-weight:700;color:#111827;font-family:'Hind Siliguri',sans-serif">${phaseNames[p]}</div>
            <div style="font-size:7pt;color:#6B7280;margin-top:3px">${range}</div>
          </div>` : "";
        }).join("")}
      </div>
    </div>

    <!-- How to use -->
    <div style="border:1.5px solid #E5E7EB;border-radius:10px;padding:10px 14px;margin-bottom:12px">
      <div style="font-size:9pt;font-weight:700;color:#111827;margin-bottom:8px;display:flex;align-items:center;gap:6px">
        <span style="display:inline-block;width:3px;height:14px;background:#931212;border-radius:2px"></span>
        এই রুটিন কীভাবে ব্যবহার করবে
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 16px">
        ${[
          ["১","প্রতিদিন পড়া শুরু করার আগে তারিখ ঘরে আজকের তারিখ লিখে নাও।"],
          ["২","প্রতিটি টপিক শেষ করার পর বাম পাশের চেকবক্সে টিক (✓) দাও।"],
          ["৩","কোনো টপিক সেদিন শেষ না হলে বৃত্ত (○) দিয়ে পরের দিন চালিয়ে নাও।"],
          ["৪","Power দিন মানে বেশি পড়ার লক্ষ্য; Weekend দিন হালকা পড়া।"],
        ].map(([num, text]) => `
          <div style="display:flex;gap:8px;align-items:flex-start;font-size:8pt;color:#4B5563;line-height:1.45;font-family:'Hind Siliguri',sans-serif">
            <span style="width:17px;height:17px;border-radius:50%;background:#931212;color:white;font-size:7pt;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;font-family:'Hind Siliguri',sans-serif">${num}</span>
            <span>${text}</span>
          </div>`).join("")}
      </div>
    </div>

    ${assessment ? renderDiagnosis(assessment) : ""}

    <!-- Progress tracker -->
    <div style="border:1.5px solid #E5E7EB;border-radius:10px;padding:10px 14px">
      <div style="font-size:9pt;font-weight:700;color:#111827;margin-bottom:8px;display:flex;align-items:center;gap:6px">
        <span style="display:inline-block;width:3px;height:14px;background:#931212;border-radius:2px"></span>
        প্রগ্রেস ট্র্যাকার — প্রতিটি দিন শেষে রঙ করো
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:3px">${phaseDotsHtml}</div>
      <div style="margin-top:8px;font-size:7pt;color:#9CA3AF;display:flex;gap:12px;flex-wrap:wrap">
        <span style="display:flex;align-items:center;gap:4px"><span style="width:10px;height:10px;border-radius:2px;background:#FEE2E2;display:inline-block"></span> Phase 1 · ফাউন্ডেশন</span>
        <span style="display:flex;align-items:center;gap:4px"><span style="width:10px;height:10px;border-radius:2px;background:#FEF3C7;display:inline-block"></span> Phase 2 · প্র্যাকটিস</span>
        <span style="display:flex;align-items:center;gap:4px"><span style="width:10px;height:10px;border-radius:2px;background:#D1FAE5;display:inline-block"></span> Phase 3 · রিভিশন</span>
      </div>
    </div>

    <div style="font-size:7pt;color:#9CA3AF;text-align:center;margin-top:12px;padding-top:8px;border-top:1px solid #E5E7EB">
      10 Minute School · ${grade} Smart Routine · 10minuteschool.com
    </div>
  </div>`;
}

function renderDayPages(routine: RoutineDay[], name: string, grade: string): string {
  let currentPhase = 0;
  let html = "";

  for (const day of routine) {
    const showPhaseBanner = day.phase !== currentPhase;
    currentPhase = day.phase;
    const phaseNames: Record<number, [string, string]> = {
      1: ["ফাউন্ডেশন", "Foundation Mode"],
      2: ["প্র্যাকটিস গ্রাইন্ড", "Practice Grind"],
      3: ["ফাইনাল রিভিশন", "Final Revision"],
    };
    const [phName, phSub] = phaseNames[day.phase] || phaseNames[1];
    const dayBg = dayHeaderBg(day);

    html += `
      ${showPhaseBanner ? `
      <div style="${phaseBannerStyle(day.phase)};border-radius:0 6px 6px 0;padding:7px 12px;margin:0 0 7px;display:flex;align-items:center;gap:10px;break-inside:avoid;break-after:avoid">
        <span style="font-size:7.5pt;font-weight:700;text-transform:uppercase;letter-spacing:.6px;${phaseNumStyle(day.phase)}">Phase ${day.phase}</span>
        <span style="font-size:10pt;font-weight:700;color:#111827;font-family:'Hind Siliguri',sans-serif">${phName}</span>
        <span style="font-size:8pt;color:#6B7280;margin-left:4px">${phSub}</span>
        <span style="margin-left:auto;font-size:8pt;color:#6B7280">${phaseDayRange(routine, day.phase as 1|2|3)}</span>
      </div>` : ""}

      <div style="border:1.5px solid #E5E7EB;border-radius:8px;margin-bottom:7px;overflow:hidden;break-inside:avoid">
        <div style="background:${dayBg};display:flex;align-items:center;gap:8px;padding:6px 10px;border-bottom:1px solid #E5E7EB">
          <span style="font-size:10pt;font-weight:800;color:#111827;min-width:42px">Day ${day.dayNumber}</span>
          <span style="font-size:7.5pt;color:#6B7280;display:flex;align-items:center;gap:4px">তারিখ: <span style="display:inline-block;width:18mm;border-bottom:1px solid #9CA3AF;height:14px"></span></span>
          <div style="margin-left:auto;display:flex;align-items:center;gap:6px">
            <span style="font-size:8pt;font-weight:600;color:#4B5563">~${fmtTime(day.totalTimeMin)}</span>
            ${day.isExtreme ? `<span style="font-size:7pt;font-weight:700;padding:2px 6px;border-radius:3px;background:#FFF0F0;color:#931212;border:1px solid #FECACA">পাওয়ার ডে ⚡</span>` : ""}
            ${day.isWeekend ? `<span style="font-size:7pt;font-weight:700;padding:2px 6px;border-radius:3px;background:#ECFDF5;color:#065F46;border:1px solid #6EE7B7">হালকা দিন</span>` : ""}
          </div>
        </div>
        <table style="width:100%;border-collapse:collapse">
          ${renderTaskRows(day.entries)}
        </table>
        <div style="background:#F9FAFB;border-top:1px dashed #E5E7EB;padding:5px 10px;display:flex;align-items:center;gap:8px;font-size:7.5pt;color:#9CA3AF">
          <span style="font-family:'Hind Siliguri',sans-serif">Notes:</span>
          <span style="flex:1;border-bottom:1px solid #E5E7EB;height:14px"></span>
        </div>
      </div>`;
  }

  return html;
}

export function generatePrintHtml(props: PrintProps): string {
  const { name, grade, durationDays, routine, autoPrint } = props;

  return `<!DOCTYPE html>
<html lang="bn">
<head>
<meta charset="UTF-8">
<title>${grade} Smart Routine — ${name}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Hind+Siliguri:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',sans-serif;font-size:9pt;color:#111827;background:#EEF2F4;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{width:210mm;min-height:auto;background:white;margin:8mm auto;padding:12mm 13mm 14mm;box-shadow:0 2px 20px rgba(0,0,0,.10)}
.page-hd{display:flex;align-items:center;gap:10px;padding-bottom:8px;margin-bottom:12px;border-bottom:2.5px solid #931212}
.days-2col{column-count:2;column-gap:8mm;column-fill:auto}
@media print{
  @page{size:A4 portrait;margin:12mm 13mm}
  body{background:white}
  .page{margin:0;box-shadow:none;padding:0}
  .page:not(:last-child){break-after:page}
  .days-2col{column-count:2;column-gap:8mm}
}
</style>
</head>
<body>
${renderCoverPage(props)}
<div class="page">
  <div class="page-hd">
    <img src="${LOGO_B64}" alt="10MS" style="height:20px;width:auto">
    <div style="flex:1;text-align:center;font-size:10pt;font-weight:800;color:#111827">${grade} SMART ROUTINE</div>
    <div style="font-size:8pt;color:#4B5563;text-align:right"><strong>${name}</strong></div>
  </div>
  <div class="days-2col">
    ${renderDayPages(routine, name, grade)}
  </div>
  <div style="font-size:7pt;color:#9CA3AF;text-align:center;margin-top:10px;padding-top:8px;border-top:1px solid #E5E7EB">
    10 Minute School · ${grade} Smart Routine · 10minuteschool.com
  </div>
</div>
${autoPrint ? `<script>window.addEventListener('load', function(){ setTimeout(function(){ window.print(); }, 900); });</script>` : ""}
</body>
</html>`;
}
