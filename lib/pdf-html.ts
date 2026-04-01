import type { RoutineDay, RoutineEntry } from "./types";

interface PdfProps {
  name: string;
  section: string;
  durationDays: number;
  routine: RoutineDay[];
  device: "mobile" | "desktop";
}

const phaseColors: Record<number, { bg: string; accent: string; name: string }> = {
  1: { bg: "#E31E24", accent: "#FFD700", name: "ফাউন্ডেশন মোড 🏗️" },
  2: { bg: "#D97706", accent: "#F59E0B", name: "প্র্যাকটিস গ্রাইন্ড 🔥" },
  3: { bg: "#16A34A", accent: "#22C55E", name: "ফাইনাল রিভিশন 🎯" },
};

function groupBySubject(entries: RoutineEntry[]): Record<string, RoutineEntry[]> {
  const grouped: Record<string, RoutineEntry[]> = {};
  for (const e of entries) {
    if (!grouped[e.subject]) grouped[e.subject] = [];
    grouped[e.subject].push(e);
  }
  return grouped;
}

export function generatePdfHtml({ name, section, durationDays, routine, device }: PdfProps): string {
  const totalHours = Math.round(routine.reduce((s, d) => s + d.totalTimeMin, 0) / 60);
  const isCompact = device === "mobile";

  let currentPhase = 0;
  let daysHtml = "";

  for (const day of routine) {
    // Phase banner
    if (day.phase !== currentPhase) {
      currentPhase = day.phase;
      const pc = phaseColors[day.phase] || phaseColors[1];
      daysHtml += `<tr class="phase-banner"><td colspan="4" style="background:${pc.bg};color:white;font-weight:700;padding:6px 10px;font-size:${isCompact ? "10px" : "11px"};">${pc.name}</td></tr>`;
    }

    const grouped = groupBySubject(day.entries);
    const subjects = Object.keys(grouped);
    const dayLabel = `Day ${day.dayNumber}${day.isExtreme ? " ⚡" : ""}${day.isWeekend ? " 🌙" : ""}`;
    const hours = (day.totalTimeMin / 60).toFixed(1);
    let firstSubject = true;

    for (const subject of subjects) {
      const chapters = grouped[subject];
      let firstChapter = true;

      for (const entry of chapters) {
        daysHtml += `<tr class="${day.isExtreme ? "extreme" : ""} ${day.isWeekend ? "weekend" : ""}">`;

        // Day column — only on first row of this day
        if (firstSubject && firstChapter) {
          const rowspan = day.entries.length;
          daysHtml += `<td class="day-col" rowspan="${rowspan}"><strong>${dayLabel}</strong><br><span class="hours">~${hours}h</span></td>`;
        }

        // Subject column — only on first row of this subject
        if (firstChapter) {
          daysHtml += `<td class="subject-col" rowspan="${chapters.length}"><strong>${subject}</strong></td>`;
        }

        // Chapter + Type
        daysHtml += `<td class="chapter-col">${entry.chapterName}</td>`;
        daysHtml += `<td class="type-col"><span class="badge badge-${entry.taskType.includes("CQ") ? "cq" : entry.taskType.includes("MCQ") ? "mcq" : entry.taskType.includes("গণিত") ? "math" : "rev"}">${entry.taskType}</span> <span class="time">${entry.timeMin}m</span></td>`;
        daysHtml += `</tr>`;

        firstChapter = false;
      }
      firstSubject = false;
    }
  }

  return `<!DOCTYPE html>
<html lang="bn">
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Hind Siliguri', sans-serif;
    background: #4A1520;
    color: white;
    font-size: ${isCompact ? "8px" : "9px"};
    line-height: 1.4;
    padding: 12px;
  }
  .header {
    background: #E31E24;
    border-radius: 6px;
    padding: 10px 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }
  .header h1 { font-size: ${isCompact ? "14px" : "16px"}; font-weight: 700; }
  .header .sub { font-size: ${isCompact ? "8px" : "9px"}; opacity: 0.8; margin-top: 2px; }
  .header .right { text-align: right; }
  .header .name { font-size: ${isCompact ? "10px" : "11px"}; font-weight: 600; }

  .summary {
    display: flex;
    gap: 6px;
    margin-bottom: 8px;
  }
  .summary-card {
    flex: 1;
    background: rgba(255,255,255,0.1);
    border-radius: 4px;
    padding: 4px 8px;
  }
  .summary-card .label { font-size: 6px; color: rgba(255,255,255,0.6); }
  .summary-card .value { font-size: 11px; font-weight: 700; color: #FFD700; }

  table { width: 100%; border-collapse: collapse; }
  th {
    background: rgba(255,255,255,0.15);
    padding: 4px 6px;
    text-align: left;
    font-size: ${isCompact ? "7px" : "8px"};
    font-weight: 700;
  }
  td {
    padding: 3px 6px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
    vertical-align: top;
  }
  tr:nth-child(even) td { background: rgba(255,255,255,0.03); }
  tr.extreme td { border-left: 2px solid #FFD700; }
  tr.weekend td { opacity: 0.85; }

  .day-col { width: ${isCompact ? "12%" : "10%"}; white-space: nowrap; }
  .subject-col { width: ${isCompact ? "22%" : "20%"}; }
  .chapter-col { width: ${isCompact ? "36%" : "40%"}; color: rgba(255,255,255,0.8); }
  .type-col { width: ${isCompact ? "30%" : "30%"}; white-space: nowrap; }

  .hours { font-size: 7px; color: rgba(255,255,255,0.5); }

  .badge {
    display: inline-block;
    padding: 1px 4px;
    border-radius: 3px;
    font-size: ${isCompact ? "6.5px" : "7px"};
    font-weight: 600;
  }
  .badge-cq { background: rgba(239,68,68,0.3); color: #fca5a5; }
  .badge-mcq { background: rgba(245,158,11,0.3); color: #fcd34d; }
  .badge-math { background: rgba(59,130,246,0.3); color: #93c5fd; }
  .badge-rev { background: rgba(34,197,94,0.3); color: #86efac; }

  .time { font-size: 7px; color: rgba(255,255,255,0.6); }

  .footer {
    margin-top: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 7px;
    color: rgba(255,255,255,0.4);
  }
  .footer .cta {
    background: #E31E24;
    color: white;
    padding: 3px 8px;
    border-radius: 4px;
    font-weight: 600;
    font-size: 8px;
  }

  .print-bar {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    background: #111; color: white; padding: 10px 16px;
    display: flex; justify-content: space-between; align-items: center;
    font-size: 13px;
  }
  .print-bar button {
    background: #E31E24; color: white; border: none; padding: 8px 20px;
    border-radius: 6px; font-weight: 600; font-size: 13px; cursor: pointer;
    font-family: 'Hind Siliguri', sans-serif;
  }
  .print-bar button:hover { opacity: 0.9; }
  body { padding-top: 50px; }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; padding-top: 0; }
    .print-bar { display: none; }
  }
</style>
</head>
<body>
  <div class="print-bar">
    <span>📄 তোমার রুটিন তৈরি হয়েছে — PDF সেভ করো!</span>
    <button onclick="window.print()">🖨️ Save as PDF</button>
  </div>
  <div class="header">
    <div>
      <h1>SSC 27 SMART ROUTINE</h1>
      <div class="sub">${section} | ${durationDays} দিন</div>
    </div>
    <div class="right">
      <div class="name">${name}</div>
      <div class="sub">10 Minute School</div>
    </div>
  </div>

  <div class="summary">
    <div class="summary-card"><div class="label">মোট দিন</div><div class="value">${durationDays}</div></div>
    <div class="summary-card"><div class="label">মোট সময়</div><div class="value">~${totalHours}h</div></div>
    <div class="summary-card"><div class="label">বিভাগ</div><div class="value">${section}</div></div>
  </div>

  <table>
    <thead>
      <tr>
        <th>দিন</th>
        <th>বিষয়</th>
        <th>অধ্যায়</th>
        <th>ধরন / সময়</th>
      </tr>
    </thead>
    <tbody>
      ${daysHtml}
    </tbody>
  </table>

  <div class="footer">
    <span>10 Minute School Smart Routine Generator</span>
    <span class="cta">SSC 27 Complete Prep — এখনই ভর্তি হও!</span>
  </div>
</body>
</html>`;
}
