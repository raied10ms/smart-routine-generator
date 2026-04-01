import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import pool from "@/lib/db";
import RoutinePDF from "@/lib/pdf-generator";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { rows: subs } = await pool.query(
    "SELECT * FROM submissions WHERE id = $1",
    [id]
  );
  if (subs.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const sub = subs[0];

  const { rows: days } = await pool.query(
    "SELECT * FROM routine_days WHERE submission_id = $1 ORDER BY day_number",
    [id]
  );

  const phaseNames: Record<number, string> = {
    1: "ফাউন্ডেশন মোড 🏗️",
    2: "প্র্যাকটিস গ্রাইন্ড 🔥",
    3: "ফাইনাল রিভিশন 🎯",
  };

  const routine = days.map((d: any) => ({
    dayNumber: d.day_number,
    phase: d.phase as 1 | 2 | 3,
    phaseName: d.phase_name || phaseNames[d.phase] || "",
    isWeekend: d.is_weekend,
    isExtreme: d.is_extreme ?? false,
    entries: d.entries,
    totalTimeMin: d.total_time_min,
  }));

  const buffer = await renderToBuffer(
    RoutinePDF({
      name: sub.name,
      section: sub.section,
      durationDays: sub.duration_days,
      routine,
    })
  );

  // Convert Buffer to Uint8Array for NextResponse compatibility
  const uint8 = new Uint8Array(buffer);

  return new NextResponse(uint8, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="SSC27-Routine-${sub.name.replace(/\s+/g, "-")}.pdf"`,
    },
  });
}
