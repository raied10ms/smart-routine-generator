import type { RoutineDay, RoutineEntry } from "./types";

interface PdfProps {
  name: string;
  section: string;
  durationDays: number;
  routine: RoutineDay[];
  device: "mobile" | "desktop";
}

const phaseLabels: Record<number, string> = {
  1: "Phase 1 — ফাউন্ডেশন মোড",
  2: "Phase 2 — প্র্যাকটিস গ্রাইন্ড",
  3: "Phase 3 — ফাইনাল রিভিশন",
};

function groupBySubject(entries: RoutineEntry[]): Record<string, RoutineEntry[]> {
  const grouped: Record<string, RoutineEntry[]> = {};
  for (const e of entries) {
    if (!grouped[e.subject]) grouped[e.subject] = [];
    grouped[e.subject].push(e);
  }
  return grouped;
}

export function generatePdfHtml({ name, section, durationDays, routine }: PdfProps): string {
  const totalHours = Math.round(routine.reduce((s, d) => s + d.totalTimeMin, 0) / 60);

  let currentPhase = 0;
  let daysHtml = "";

  for (const day of routine) {
    // Phase divider
    if (day.phase !== currentPhase) {
      currentPhase = day.phase;
      const label = phaseLabels[day.phase] || "";
      const borderColor = day.phase === 1 ? "#E31E24" : day.phase === 2 ? "#D97706" : "#16A34A";
      daysHtml += `<tr class="phase-row"><td colspan="4" style="border-left:3px solid ${borderColor};padding:5px 8px;font-weight:700;font-size:9px;color:${borderColor};background:#f8f8f8;">${label}</td></tr>`;
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
        const isFirstRow = firstSubject && firstChapter;
        const rowClass = [
          isFirstRow ? "day-start" : "",
          day.isExtreme ? "extreme-row" : "",
          day.isWeekend ? "weekend-row" : "",
        ].filter(Boolean).join(" ");
        daysHtml += `<tr class="${rowClass}">`;

        // Day col — show on first row of the day only, blank otherwise
        if (firstSubject && firstChapter) {
          daysHtml += `<td class="day-col"><strong>${dayLabel}</strong><span class="hours">${hours}h</span></td>`;
        } else {
          daysHtml += `<td class="day-col day-cont"></td>`;
        }

        // Subject col — show on first row of each subject, blank otherwise
        if (firstChapter) {
          daysHtml += `<td class="subject-col"><strong>${subject}</strong></td>`;
        } else {
          daysHtml += `<td class="subject-col subject-cont"></td>`;
        }

        const typeShort = entry.taskType.includes("CQ") ? "CQ" : entry.taskType.includes("MCQ") ? "MCQ" : entry.taskType.includes("গণিত") ? "Math" : "Rev";
        daysHtml += `<td class="chapter-col">${entry.chapterName}</td>`;
        daysHtml += `<td class="type-col"><span class="badge badge-${typeShort.toLowerCase()}">${entry.taskType}</span> <span class="time">${entry.timeMin}m</span> <span class="check">☐</span></td>`;
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
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>SSC 27 Smart Routine — ${name}</title>
<link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;600;700&display=swap" rel="stylesheet">
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }

  html, body {
    font-family: 'Hind Siliguri', sans-serif;
    background: #fff;
    color: #111;
    font-size: 8.5px;
    line-height: 1.45;
    overflow-x: hidden;
  }

  /* ── Toolbar (hidden in PDF) ── */
  .toolbar {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    background: #111; color: white; padding: 10px 20px;
    display: flex; justify-content: space-between; align-items: center;
    font-size: 13px; font-family: 'Hind Siliguri', sans-serif;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  }
  .toolbar .info { opacity: 0.75; font-size: 12px; }
  .toolbar button {
    background: #E31E24; color: white; border: none; padding: 9px 22px;
    border-radius: 6px; font-weight: 700; font-size: 13px; cursor: pointer;
    font-family: 'Hind Siliguri', sans-serif;
  }
  .toolbar button:disabled { opacity: 0.5; cursor: not-allowed; }

  /* ── Content wrapper — 190mm = A4 minus 10mm margins each side ── */
  #routine-content {
    width: 190mm;
    padding: 0;
    margin: 44px auto 0;
  }

  /* ── Header ── */
  .header {
    display: flex; justify-content: space-between; align-items: flex-start;
    border-bottom: 2px solid #E31E24; padding-bottom: 8px; margin-bottom: 8px;
  }
  .header-left .title {
    font-size: 15px; font-weight: 700; color: #E31E24; letter-spacing: 0.3px;
  }
  .header-left .sub { font-size: 8px; color: #555; margin-top: 2px; }
  .header-right { text-align: right; }
  .header-right .name { font-size: 11px; font-weight: 700; }
  .header-right .sub2 { font-size: 8px; color: #555; }

  /* ── Summary bar ── */
  .summary {
    display: flex; gap: 8px; margin-bottom: 10px;
    border: 1px solid #e5e5e5; border-radius: 5px; overflow: hidden;
  }
  .summary-item {
    flex: 1; padding: 5px 8px; border-right: 1px solid #e5e5e5;
  }
  .summary-item:last-child { border-right: none; }
  .summary-item .s-label { font-size: 6.5px; color: #888; text-transform: uppercase; letter-spacing: 0.4px; }
  .summary-item .s-value { font-size: 12px; font-weight: 700; color: #111; }

  /* ── Table ── */
  table { width: 100%; border-collapse: collapse; }

  thead tr th {
    background: #111; color: white;
    padding: 4px 6px; text-align: left;
    font-size: 7.5px; font-weight: 700; letter-spacing: 0.3px;
  }

  td {
    padding: 3px 6px;
    border-bottom: 1px solid #ebebeb;
    vertical-align: top;
  }

  tr:nth-child(even) td { background: #fafafa; }
  .extreme-row td { border-left: 2px solid #E31E24; }
  .weekend-row td { color: #555; }
  /* blank continuation cells — no bottom border so rows within a day feel grouped */
  .day-cont, .subject-cont { border-bottom: 1px solid #f0f0f0 !important; }
  /* visual separator between days */
  tr.day-start td { border-top: 2px solid #e0e0e0; }

  .day-col {
    width: 10%; white-space: nowrap;
    font-weight: 700; font-size: 8px;
  }
  .hours {
    display: block; font-size: 7px; font-weight: 400; color: #888;
  }
  .subject-col { width: 20%; font-size: 8px; }
  .chapter-col { width: 40%; color: #333; }
  .type-col { width: 30%; white-space: nowrap; }

  .badge {
    display: inline-block; padding: 1px 4px; border-radius: 2px;
    font-size: 7px; font-weight: 700; border: 1px solid;
  }
  /* B&W friendly — uses borders + patterns, no fill colors */
  .badge-cq    { border-color: #E31E24; color: #E31E24; }
  .badge-mcq   { border-color: #D97706; color: #D97706; }
  .badge-math  { border-color: #1d4ed8; color: #1d4ed8; }
  .badge-rev   { border-color: #16A34A; color: #16A34A; }

  .time { font-size: 7px; color: #888; margin-left: 3px; }
  .check { font-size: 9px; color: #ccc; margin-left: 4px; }

  /* ── Footer ── */
  .footer {
    margin-top: 12px; padding-top: 8px; border-top: 1px solid #e5e5e5;
    display: flex; justify-content: space-between; align-items: center;
    font-size: 7px; color: #aaa;
  }
  .footer .cta { color: #E31E24; font-weight: 700; font-size: 8px; }
</style>
</head>
<body>

<div class="toolbar">
  <span class="info" id="status">📄 তোমার রুটিন তৈরি হয়েছে — নিচের বাটনে ক্লিক করে PDF সেভ করো</span>
  <button id="dlBtn" onclick="downloadPdf()">⬇️ PDF Download করো</button>
</div>

<script>
function downloadPdf() {
  const btn = document.getElementById('dlBtn');
  const status = document.getElementById('status');
  btn.disabled = true;
  btn.textContent = '⏳ তৈরি হচ্ছে...';
  status.textContent = 'PDF generate হচ্ছে, একটু অপেক্ষা করো...';

  const opt = {
    margin: [10, 10, 10, 10],
    filename: 'SSC27-Smart-Routine-${name.replace(/\s+/g, "-")}.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      letterRendering: true,
      scrollX: 0,
      scrollY: 0
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['css', 'legacy'], avoid: 'tr' }
  };

  document.fonts.ready.then(() => html2pdf().set(opt).from(document.getElementById('routine-content')).save())
    .then(() => {
      btn.disabled = false;
      btn.textContent = '✅ আবার Download';
      status.textContent = 'PDF সেভ হয়েছে! ফাইলটি তোমার Downloads ফোল্ডারে পাবে।';
    }).catch(() => {
      btn.disabled = false;
      btn.textContent = '⬇️ PDF Download করো';
      status.textContent = '❌ সমস্যা হয়েছে, আবার চেষ্টা করো।';
    });
}
</script>

<div id="routine-content">
  <div class="header">
    <div class="header-left">
      <div class="title">SSC 27 SMART ROUTINE</div>
      <div class="sub">10 Minute School · ${section} · ${durationDays} দিন</div>
    </div>
    <div class="header-right">
      <div class="name">${name}</div>
      <div class="sub2">Generated by 10MS Smart Routine</div>
    </div>
  </div>

  <div class="summary">
    <div class="summary-item"><div class="s-label">মোট দিন</div><div class="s-value">${durationDays}</div></div>
    <div class="summary-item"><div class="s-label">মোট সময়</div><div class="s-value">~${totalHours}h</div></div>
    <div class="summary-item"><div class="s-label">বিভাগ</div><div class="s-value">${section}</div></div>
  </div>

  <table>
    <thead>
      <tr>
        <th>DAY</th>
        <th>বিষয়</th>
        <th>অধ্যায়</th>
        <th>ধরন / সময় / ✓</th>
      </tr>
    </thead>
    <tbody>
      ${daysHtml}
    </tbody>
  </table>

  <div class="footer">
    <span>10 Minute School Smart Routine Generator · ssc.10minuteschool.com</span>
    <span class="cta">SSC 27 Complete Prep — এখনই ভর্তি হও!</span>
  </div>
</div>

</body>
</html>`;
}
