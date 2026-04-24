import type { RoutineDay, RoutineEntry } from "./types";

interface PdfProps {
  name: string;
  section: string;
  durationDays: number;
  routine: RoutineDay[];
  device?: "mobile" | "desktop";
  puppeteer?: boolean;
}

const phaseLabels: Record<number, string> = {
  1: "Phase 1 — ফাউন্ডেশন মোড",
  2: "Phase 2 — প্র্যাকটিস গ্রাইন্ড",
  3: "Phase 3 — ফাইনাল রিভিশন",
};

const phaseColors: Record<number, string> = {
  1: "#E8001D",
  2: "#D97706",
  3: "#1CAB55",
};

// 10MS logo (dark version, base64 inline)
const LOGO_B64 = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA3ODAgMjE1LjYiPjxkZWZzPjxzdHlsZT4uY2xzLTF7ZmlsbDojMjMxZjIwO30uY2xzLTJ7ZmlsbDojZWIyMDI2O308L3N0eWxlPjwvZGVmcz48dGl0bGU+MTBNUyAtIFNWRzwvdGl0bGU+PGcgaWQ9IkxheWVyXzIiIGRhdGEtbmFtZT0iTGF5ZXIgMiI+PGcgaWQ9IkxheWVyXzEtMiIgZGF0YS1uYW1lPSJMYXllciAxIj48cG9seWdvbiBjbGFzcz0iY2xzLTEiIHBvaW50cz0iNTguMTYgMjE1LjYgMjcuNjIgMjE1LjYgMjcuNjIgMzAuNTQgMCAzMC41NCAwIDAgNTguMTYgMCA1OC4xNiAyMTUuNiIvPjxwYXRoIGNsYXNzPSJjbHMtMiIgZD0iTTE2OS45LDEyNS43MywyMzIsNjMuNjJDMjI1LjIxLDMwLjQ2LDE5OC44NCw0LjQzLDE2NS40My4yNWMtLjYzLS4wOC0xLjI3LS4xNS0xLjktLjIxVjMwLjgzQzE3OCwzMy4yOCwxOTAsNDIuNjQsMTk3LDU1LjUybC00OC42NCw0OC42M1oiLz48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik0yMDMsMTE0LjI2bC0uMTMsMjAuM3YuMWMwLDI3Ljc3LTIxLjE0LDUwLjM2LTQ3LjEyLDUwLjM2cy00Ny4xLTIyLjU3LTQ3LjEyLTUwLjMxTDEwOSw4MC42NnYtLjFjMC0yNC42OCwxNi43Ni00NS42NiwzOS4zMS00OS42N1YuMDdsLTIsLjIzQzEwNy42LDUuMzgsNzguNDQsMzkuODYsNzguNDEsODAuNTFsLS4zNSw1NC4wNXYuMWMwLDQ0LjYxLDM0Ljg0LDgwLjksNzcuNjYsODAuOXM3Ny42My0zNi4yNiw3Ny42NS04MC44NWwuMzQtNTEuMTlaIi8+PHBvbHlnb24gY2xhc3M9ImNscy0xIiBwb2ludHM9IjM1MC42IDAuMTQgMzUwLjYgOTcuNjYgMzM3LjIxIDk3LjY2IDMzNy4yMSAzMC41NSAzMDYuOTMgOTcuOCAyNzcuNjQgMzAuNTUgMjc3LjY0IDk3LjY2IDI2NC4yNCA5Ny42NiAyNjQuMjQgMC4xNCAyODAuMjkgMC4xNCAzMDYuOTMgNjMuNDggMzM0LjcgMC4xNCAzNTAuNiAwLjE0Ii8+PHJlY3QgY2xhc3M9ImNscy0xIiB4PSIzODMuMzIiIHk9IjAuMTQiIHdpZHRoPSIxMy41MyIgaGVpZ2h0PSI5Ny43OSIvPjxwb2x5Z29uIGNsYXNzPSJjbHMtMSIgcG9pbnRzPSI1MDEuNDkgMC4xNCA1MDEuNDkgOTcuOCA0ODYuMTQgOTcuOCA0NDMuMzEgMjQgNDQzLjMxIDk3LjggNDMwLjIgOTcuOCA0MzAuMiAwLjE0IDQ0NS42OSAwLjE0IDQ4OC42NSA3NS43NSA0ODguNjUgMC4xNCA1MDEuNDkgMC4xNCIvPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTYwMS41OSwwVjYzLjQ4QTM1LDM1LDAsMCwxLDUzNy40Miw4MmEzNi4wNywzNi4wNywwLDAsMS01LjcyLTE4LjU1VjBoMTMuMzlWNjIuNzhhMjEuNDksMjEuNDksMCwwLDAsNDMsMFYwWiIvPjxwb2x5Z29uIGNsYXNzPSJjbHMtMSIgcG9pbnRzPSI3MDAuNTcgMCA3MDAuNTcgMTIuOTcgNjY3Ljc4IDEyLjg0IDY2OC4wNiA5Ny45MyA2NTQuMjUgOTcuOTMgNjU0LjM5IDEyLjg0IDYyMi4xNyAxMi44NCA2MjIuMTcgMCA3MDAuNTcgMCIvPjxwb2x5Z29uIGNsYXNzPSJjbHMtMSIgcG9pbnRzPSI3ODAgODQuODIgNzgwIDk3Ljc5IDcyMC43NiA5Ny43OSA3MjAuNzYgMC4xNCA3ODAgMC4xNCA3ODAgMTMuMjUgNzM0LjE2IDEzLjI1IDczNC4xNiA0My4yNSA3NjkuMTcgNDMuMjUgNzY5LjE3IDU2LjIyIDczNC4xNiA1Ni4yMiA3MzQuMTYgODQuODIgNzgwIDg0LjgyIi8+PHBhdGggY2xhc3M9ImNscy0xIiBkPSJNMjkzLjUyLDIxNC44OGMtMTIuMTMsMC0yMy4yOC01LjcxLTI5LjI4LTEzLjk0di0uMjhsNS41OC05LjQ4YzQuMzIsNi4yOCwxMi42OCwxMS4xNiwyMy44NCwxMS44NWgzLjYyYzkuNjIsMCwxNy41Ny03LjExLDE3LjU3LTE2Ljcycy03LjUzLTEzLjUzLTE3LjU3LTE1LjA2YTY1Ljg2LDY1Ljg2LDAsMCwwLTYuNTUtMWMtMTMuOC0yLjY0LTI2LjIxLTEwLjczLTI2LjIxLTI1LjM3UzI3Ni4zNywxMTgsMjkwLjczLDExOGgyLjA5YzkuNjIsMCwxOS45Myw0LjE4LDI1LjA5LDEwLjczbC02LjI3LDExLjU3Yy01LjQ0LTYtMTAuNTktOS4zNC0xOC44Mi05Ljc2aC0yLjA5Yy03LjM5LDAtMTMuNTIsNi43LTEzLjUyLDE0LjM2LDAsNy4zOSw1LjE2LDExLjQzLDEzLjUyLDEyLjU1LDMuNDkuNDIsNS44NS41Niw2LjgzLjcsMTYuNTksMi4yMywyOS4xNCwxMS43MSwyOS4xNCwyOC4xNnMtMTMuMjUsMjguMTUtMjkuNDIsMjguNTdaIi8+PHBhdGggY2xhc3M9ImNscy0xIiBkPSJNNDEyLjIsMjA2LjI0YTQ3LjkyLDQ3LjkyLDAsMCwxLTI4LDguOTIsNDguNzksNDguNzksMCwwLDEsMC05Ny41OCw0Ny44OCw0Ny44OCwwLDAsMSwyOCw4Ljc4bC02LjEzLDEyLjgzYTMzLjQxLDMzLjQxLDAsMCwwLTIxLjg5LTcuNTMsMzQuNzgsMzQuNzgsMCwxLDAsMjIuMyw2MS42MVoiLz48cG9seWdvbiBjbGFzcz0iY2xzLTEiIHBvaW50cz0iNDk4LjA5IDExNy41OCA0OTguMDkgMjE1LjAyIDQ4NC41NyAyMTUuMDIgNDg0LjU3IDE3NC4zMiA0NDAuMSAxNzQuMzIgNDQwLjEgMjE1LjAyIDQyNi41OCAyMTUuMDIgNDI2LjU4IDExNy41OCA0NDAuMSAxMTcuNTggNDQwLjEgMTYyLjA1IDQ4NC41NyAxNjIuMDUgNDg0LjU3IDExNy41OCA0OTguMDkgMTE3LjU4Ii8+PHBhdGggY2xhc3M9ImNscy0xIiBkPSJNNjA2LjQ5LDE2Ni4wOUM2MDYuNDksMTkzLDU4NiwyMTUsNTU5LDIxNWMtMjUuNjUsMC00Ni4yOC0yMi00Ni4yOC00OC45MywwLTI2Ljc2LDIwLjYzLTQ4LjY1LDQ2LjI4LTQ4LjY1LDI3LDAsNDcuNTMsMjEuODksNDcuNTMsNDguNjVtLTEzLjM4LDBjMC0xOS4zNy0xNC42NC0zNS4xMy0zNC4xNS0zNS4xMy0xOC4yNywwLTMyLjksMTUuNzYtMzIuOSwzNS4xMywwLDE5LjY2LDE0LjYzLDM1LjU1LDMyLjksMzUuNTUsMTkuNTEsMCwzNC4xNS0xNS44OSwzNC4xNS0zNS41NSIvPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTcxMS4xNiwxNjYuMDljMCwyNi45MS0yMC40OSw0OC45My00Ny41Myw0OC45My0yNS42NiwwLTQ2LjI5LTIyLTQ2LjI5LTQ4LjkzLDAtMjYuNzYsMjAuNjMtNDguNjUsNDYuMjktNDguNjUsMjcsMCw0Ny41MywyMS44OSw0Ny41Myw0OC42NW0tMTMuMzgsMGMwLTE5LjM3LTE0LjY0LTM1LjEzLTM0LjE1LTM1LjEzLTE4LjI3LDAtMzIuOTEsMTUuNzYtMzIuOTEsMzUuMTMsMCwxOS42NiwxNC42NCwzNS41NSwzMi45MSwzNS41NSwxOS41MSwwLDM0LjE1LTE1Ljg5LDM0LjE1LTM1LjU1Ii8+PHBvbHlnb24gY2xhc3M9ImNscy0xIiBwb2ludHM9IjczOS4wMiAyMDEuOTIgNzgwIDIwMS45MiA3ODAgMjE1LjE2IDcyNS43NyAyMTUuMTYgNzI1Ljc3IDExNy41OCA3MzkuMDIgMTE3LjU4IDczOS4wMiAyMDEuOTIiLz48L2c+PC9nPjwvc3ZnPg==";

function groupBySubject(entries: RoutineEntry[]): Record<string, RoutineEntry[]> {
  const g: Record<string, RoutineEntry[]> = {};
  for (const e of entries) {
    if (!g[e.subject]) g[e.subject] = [];
    g[e.subject].push(e);
  }
  return g;
}

function taskBadge(taskType: string): { label: string; cls: string } {
  if (taskType.includes("CQ"))     return { label: "CQ",   cls: "badge-cq" };
  if (taskType.includes("MCQ"))    return { label: "MCQ",  cls: "badge-mcq" };
  if (taskType.includes("গণিত"))   return { label: "Math", cls: "badge-math" };
  return { label: "Rev", cls: "badge-rev" };
}

export function generatePdfHtml({ name, section, durationDays, routine, puppeteer: forPuppeteer = false }: PdfProps): string {
  const totalHours = Math.round(routine.reduce((s, d) => s + d.totalTimeMin, 0) / 60);

  // Build table body — one <tbody> per day for page-break control
  let tbodiesHtml = "";
  let currentPhase = 0;

  for (const day of routine) {
    if (day.phase !== currentPhase) {
      currentPhase = day.phase;
      const label = phaseLabels[day.phase] || "";
      const color = phaseColors[day.phase] || "#E8001D";
      tbodiesHtml += `
        <tbody class="phase-header-body">
          <tr>
            <td colspan="4" class="phase-divider" style="--phase-color:${color}">
              <span class="phase-dot" style="background:${color}"></span>
              ${label}
            </td>
          </tr>
        </tbody>`;
    }

    const grouped = groupBySubject(day.entries);
    const subjectList = Object.keys(grouped);
    const hours = (day.totalTimeMin / 60).toFixed(1);
    const phaseColor = phaseColors[day.phase] || "#E8001D";

    tbodiesHtml += `<tbody class="day-group" style="--phase-color:${phaseColor}">`;

    let firstSubjectInDay = true;
    for (const subject of subjectList) {
      const entries = grouped[subject];
      let firstEntryInSubject = true;

      for (const entry of entries) {
        const isVeryFirstRow = firstSubjectInDay && firstEntryInSubject;
        const { label: badgeLabel, cls: badgeCls } = taskBadge(entry.taskType);

        tbodiesHtml += `<tr class="${isVeryFirstRow ? "day-first-row" : ""}${day.isWeekend ? " weekend" : ""}">`;

        // Day column — only on very first row of the day
        if (isVeryFirstRow) {
          const subjectCount = subjectList.length;
          const rowSpan = day.entries.length + (subjectCount - 1); // rough, we'll use rowspan
          tbodiesHtml += `
            <td class="day-cell" rowspan="${rowSpan}">
              <div class="day-num">Day ${day.dayNumber}</div>
              <div class="day-hrs">${hours}h</div>
              ${day.isWeekend ? '<div class="day-tag weekend-tag">Weekend</div>' : ""}
              ${day.isExtreme ? '<div class="day-tag extreme-tag">Power</div>' : ""}
            </td>`;
        }

        // Subject column — only on first entry of each subject
        if (firstEntryInSubject) {
          tbodiesHtml += `
            <td class="subject-cell" rowspan="${entries.length}">
              <strong>${subject}</strong>
            </td>`;
        }

        tbodiesHtml += `
          <td class="chapter-cell">${entry.chapterName}</td>
          <td class="type-cell">
            <span class="${badgeCls}">${badgeLabel}</span>
            <span class="task-label">${entry.taskType}</span>
            <span class="time-label">${entry.timeMin}m</span>
            <span class="check-box">&#9744;</span>
          </td>
        </tr>`;

        firstEntryInSubject = false;
        firstSubjectInDay = false;
      }
    }

    tbodiesHtml += `</tbody>`;
  }

  const toolbarHtml = forPuppeteer ? "" : `
<div class="toolbar">
  <span id="status">তোমার রুটিন তৈরি হয়েছে — PDF সেভ করতে নিচের বাটনে ক্লিক করো</span>
  <button id="dlBtn" onclick="downloadPdf()">PDF Download করো</button>
</div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
<script>
function downloadPdf() {
  const btn = document.getElementById('dlBtn');
  const status = document.getElementById('status');
  btn.disabled = true; btn.textContent = 'তৈরি হচ্ছে...';
  const opt = {
    margin: 0, filename: 'SSC27-Routine.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, backgroundColor: '#fff' },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['css', 'legacy'], avoid: '.day-group' }
  };
  document.fonts.ready.then(() =>
    html2pdf().set(opt).from(document.getElementById('page-wrap')).save()
  ).then(() => { btn.disabled = false; btn.textContent = 'আবার Download'; status.textContent = 'সেভ হয়েছে!'; });
}
</script>`;

  return `<!DOCTYPE html>
<html lang="bn">
<head>
<meta charset="UTF-8">
<title>SSC 27 Smart Routine — ${name}</title>
<link href="https://fonts.googleapis.com/css2?family=Anek+Bangla:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
@page {
  size: A4;
  margin: 0;
}

* { margin: 0; padding: 0; box-sizing: border-box; }

html, body {
  font-family: 'Anek Bangla', 'Noto Sans Bengali', sans-serif;
  background: #fff;
  color: #111827;
  font-size: 8.5px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

/* ── Toolbar (browser-only) ── */
.toolbar {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  background: #1a0005; color: white;
  padding: 10px 24px; display: flex; justify-content: space-between; align-items: center;
  font-size: 13px; box-shadow: 0 2px 12px rgba(0,0,0,.4);
}
.toolbar button {
  background: #E8001D; color: white; border: none;
  padding: 9px 24px; border-radius: 6px; font-weight: 700; font-size: 13px; cursor: pointer;
}
.toolbar button:disabled { opacity: .5; }

/* ── Page wrapper ── */
#page-wrap {
  width: 210mm;
  min-height: 297mm;
  margin: ${forPuppeteer ? "0" : "52px"} auto 0;
}

/* ── Cover header strip ── */
.cover-header {
  background: #1a0005;
  padding: 10mm 12mm 8mm;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8mm;
}
.cover-left {
  display: flex;
  align-items: center;
  gap: 5mm;
}
.cover-logo {
  height: 16px;
  filter: brightness(0) invert(1);
  flex-shrink: 0;
}
.cover-divider {
  width: 1px;
  height: 20px;
  background: rgba(255,255,255,.25);
  flex-shrink: 0;
}
.cover-title {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 700;
  color: white;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  white-space: nowrap;
}
.cover-subtitle {
  font-size: 8px;
  color: rgba(255,255,255,.55);
  margin-top: 2px;
  white-space: nowrap;
}
.cover-right {
  text-align: right;
  flex-shrink: 0;
}
.cover-name {
  font-size: 12px;
  font-weight: 700;
  color: white;
}
.cover-meta {
  font-size: 8px;
  color: rgba(255,255,255,.5);
  margin-top: 2px;
}

/* ── Summary bar ── */
.summary-bar {
  background: #F9FAFB;
  border-bottom: 1.5px solid #E5E7EB;
  padding: 5mm 12mm;
  display: flex;
  align-items: center;
  gap: 0;
}
.stat-item {
  flex: 1;
  text-align: center;
  padding: 0 4mm;
  border-right: 1px solid #E5E7EB;
}
.stat-item:last-child { border-right: none; }
.stat-label {
  font-size: 7px;
  color: #9CA3AF;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-family: 'Inter', sans-serif;
}
.stat-value {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  font-family: 'Inter', sans-serif;
  line-height: 1.2;
}
.stat-value.red   { color: #E8001D; }
.stat-value.green { color: #1CAB55; }

/* ── Table wrap ── */
.table-wrap {
  padding: 0 12mm 8mm;
}

table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

/* Column widths */
col.col-day     { width: 11%; }
col.col-subject { width: 19%; }
col.col-chapter { width: 44%; }
col.col-type    { width: 26%; }

/* Table header */
thead th {
  background: #111827;
  color: white;
  padding: 4px 6px;
  text-align: left;
  font-size: 7.5px;
  font-weight: 600;
  letter-spacing: 0.3px;
  font-family: 'Inter', sans-serif;
  position: sticky;
  top: 0;
}
thead th:first-child { border-radius: 4px 0 0 0; }
thead th:last-child  { border-radius: 0 4px 0 0; }

/* Phase divider */
.phase-header-body td.phase-divider {
  padding: 5px 8px 5px 10px;
  font-weight: 700;
  font-size: 8.5px;
  color: var(--phase-color);
  background: color-mix(in srgb, var(--phase-color) 8%, white);
  border-left: 3.5px solid var(--phase-color);
  border-top: 6px solid white;
  letter-spacing: 0.2px;
  font-family: 'Inter', sans-serif;
}
.phase-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-right: 4px;
  vertical-align: middle;
  position: relative;
  top: -1px;
}

/* Day group */
tbody.day-group {
  page-break-inside: avoid;
  break-inside: avoid;
}

td {
  padding: 3.5px 6px;
  vertical-align: top;
  border-bottom: 1px solid #F3F4F6;
  font-size: 8.5px;
}

/* First row of each day — top border accent */
tr.day-first-row td {
  border-top: 1.5px solid var(--phase-color, #E8001D);
}

/* Day cell */
.day-cell {
  font-weight: 700;
  color: #111827;
  padding: 5px 6px;
  border-left: 3px solid var(--phase-color, #E8001D) !important;
  vertical-align: top;
  white-space: nowrap;
}
.day-num {
  font-size: 9px;
  font-weight: 700;
  font-family: 'Inter', sans-serif;
  color: #111827;
}
.day-hrs {
  font-size: 7px;
  color: #9CA3AF;
  font-family: 'Inter', sans-serif;
  margin-top: 1px;
}
.day-tag {
  display: inline-block;
  font-size: 6.5px;
  font-weight: 700;
  padding: 1px 4px;
  border-radius: 3px;
  margin-top: 2px;
  font-family: 'Inter', sans-serif;
  letter-spacing: 0.2px;
}
.weekend-tag  { background: #EEF2FF; color: #4338CA; }
.extreme-tag  { background: #FEF3C7; color: #92400E; }

/* Subject cell */
.subject-cell {
  font-weight: 600;
  font-size: 8.5px;
  color: #374151;
  padding: 5px 6px;
  vertical-align: top;
}
.subject-cell strong { font-weight: 700; }

/* Chapter cell */
.chapter-cell {
  color: #374151;
  font-size: 8.5px;
}

/* Type cell */
.type-cell {
  white-space: nowrap;
  font-size: 8px;
}

/* Task type badges */
.badge-cq, .badge-mcq, .badge-math, .badge-rev {
  display: inline-block;
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 7px;
  font-weight: 700;
  border: 1px solid;
  font-family: 'Inter', sans-serif;
  letter-spacing: 0.2px;
  margin-right: 3px;
}
.badge-cq   { color: #E8001D; border-color: #E8001D; background: #FFF1F2; }
.badge-mcq  { color: #D97706; border-color: #D97706; background: #FFFBEB; }
.badge-math { color: #1D4ED8; border-color: #1D4ED8; background: #EFF6FF; }
.badge-rev  { color: #1CAB55; border-color: #1CAB55; background: #F0FBF4; }

.task-label {
  font-size: 7.5px;
  color: #6B7280;
  margin-right: 3px;
}
.time-label {
  font-size: 7px;
  color: #9CA3AF;
  font-family: 'Inter', sans-serif;
  margin-right: 4px;
}
.check-box {
  font-size: 10px;
  color: #D1D5DB;
}

/* Weekend rows */
tr.weekend td { background: #FAFAFA; color: #6B7280; }

/* Alternating row tint (within a day) */
tbody.day-group tr:nth-child(even) td { background: #FAFBFC; }
tbody.day-group tr:nth-child(even).weekend td { background: #F5F5F5; }

/* Last row of table */
tbody:last-child tr:last-child td { border-bottom: none; }

/* ── Footer ── */
.cover-footer {
  padding: 4mm 12mm;
  border-top: 1.5px solid #E5E7EB;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.footer-left  { font-size: 7px; color: #9CA3AF; font-family: 'Inter', sans-serif; }
.footer-right { font-size: 7.5px; font-weight: 700; color: #E8001D; font-family: 'Inter', sans-serif; }

/* ── Print overrides ── */
@media print {
  .toolbar { display: none !important; }
  #page-wrap { margin: 0; }
  thead th { background: #111827 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .cover-header { background: #1a0005 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .phase-divider { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .badge-cq, .badge-mcq, .badge-math, .badge-rev { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .day-tag { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  tbody.day-group { page-break-inside: avoid; break-inside: avoid; }
}
</style>
</head>
<body>

${toolbarHtml}

<div id="page-wrap">

  <!-- Cover header -->
  <div class="cover-header">
    <div class="cover-left">
      <img src="${LOGO_B64}" alt="10 Minute School" class="cover-logo" />
      <div class="cover-divider"></div>
      <div>
        <div class="cover-title">SSC 27 Smart Routine</div>
        <div class="cover-subtitle">Personalized Study Planner · 10 Minute School</div>
      </div>
    </div>
    <div class="cover-right">
      <div class="cover-name">${name}</div>
      <div class="cover-meta">${section} · ${durationDays} দিন · ~${totalHours}h</div>
    </div>
  </div>

  <!-- Summary bar -->
  <div class="summary-bar">
    <div class="stat-item">
      <div class="stat-label">মোট দিন</div>
      <div class="stat-value">${durationDays}</div>
    </div>
    <div class="stat-item">
      <div class="stat-label">মোট সময়</div>
      <div class="stat-value">~${totalHours}h</div>
    </div>
    <div class="stat-item">
      <div class="stat-label">বিভাগ</div>
      <div class="stat-value" style="font-size:13px">${section}</div>
    </div>
    <div class="stat-item">
      <div class="stat-label">Phase 1</div>
      <div class="stat-value red" style="font-size:11px">Foundation</div>
    </div>
    <div class="stat-item">
      <div class="stat-label">Phase 2</div>
      <div class="stat-value" style="font-size:11px;color:#D97706">Practice</div>
    </div>
    <div class="stat-item">
      <div class="stat-label">Phase 3</div>
      <div class="stat-value green" style="font-size:11px">Revision</div>
    </div>
  </div>

  <!-- Routine table -->
  <div class="table-wrap">
    <table>
      <colgroup>
        <col class="col-day">
        <col class="col-subject">
        <col class="col-chapter">
        <col class="col-type">
      </colgroup>
      <thead>
        <tr>
          <th>Day</th>
          <th>বিষয়</th>
          <th>অধ্যায়</th>
          <th>ধরন · সময় · ✓</th>
        </tr>
      </thead>
      ${tbodiesHtml}
    </table>
  </div>

  <!-- Footer -->
  <div class="cover-footer">
    <span class="footer-left">10 Minute School · Smart Routine Generator · ssc.10minuteschool.com</span>
    <span class="footer-right">SSC 27 Complete Prep — এখনই শুরু করো!</span>
  </div>

</div>
</body>
</html>`;
}
