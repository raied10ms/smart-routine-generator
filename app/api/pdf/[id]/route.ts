import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { generatePdfHtml } from "@/lib/pdf-html";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data: sub, error: subErr } = await supabase
    .from("submissions")
    .select("*")
    .eq("id", id)
    .single();

  if (subErr || !sub) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: days, error: dayErr } = await supabase
    .from("routine_days")
    .select("*")
    .eq("submission_id", id)
    .order("day_number");

  if (dayErr) return NextResponse.json({ error: dayErr.message }, { status: 500 });

  const routine = (days || []).map((d) => ({
    dayNumber: d.day_number as number,
    phase: d.phase as 1 | 2 | 3,
    phaseName: (d.phase_name as string) || "",
    isWeekend: d.is_weekend as boolean,
    isExtreme: (d.is_extreme as boolean) || false,
    entries: d.entries as Array<{ chapterId: number; subject: string; chapterName: string; taskType: string; timeMin: number }>,
    totalTimeMin: d.total_time_min as number,
  }));

  const html = generatePdfHtml({
    name: sub.name,
    section: sub.section,
    durationDays: sub.duration_days,
    routine,
    device: sub.device_preference || "mobile",
  });

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
