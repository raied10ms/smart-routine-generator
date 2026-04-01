import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { sendSms } from "@/lib/sms";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, phone, school, classRoll, section, devicePreference, durationDays, assessment, routine } = body;

  // 1. Insert submission
  const { data: sub, error: subErr } = await supabase
    .from("submissions")
    .insert({
      name, phone, school: school || null, class_roll: classRoll || null,
      section, device_preference: devicePreference, duration_days: durationDays,
      assessment,
    })
    .select("id")
    .single();

  if (subErr) return NextResponse.json({ error: subErr.message }, { status: 500 });
  const submissionId = sub.id;

  // 2. Insert routine days
  const dayRows = routine.map((day: { dayNumber: number; phase: number; phaseName?: string; isWeekend: boolean; isExtreme?: boolean; entries: unknown[]; totalTimeMin: number }) => ({
    submission_id: submissionId,
    day_number: day.dayNumber,
    phase: day.phase,
    phase_name: day.phaseName || "",
    is_weekend: day.isWeekend,
    is_extreme: day.isExtreme ?? false,
    entries: day.entries,
    total_time_min: day.totalTimeMin,
  }));

  const { error: dayErr } = await supabase.from("routine_days").insert(dayRows);
  if (dayErr) return NextResponse.json({ error: dayErr.message }, { status: 500 });

  // 3. Generate PDF URL
  const pdfUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "https://ssc.10ms.com"}/api/pdf/${submissionId}`;
  await supabase.from("submissions").update({ pdf_url: pdfUrl }).eq("id", submissionId);

  // 4. Send SMS
  const smsSent = await sendSms(phone, `${name}, তোমার SSC 27 রুটিন তৈরি হয়েছে! Download করো: ${pdfUrl}`);
  await supabase.from("submissions").update({ sms_sent: smsSent }).eq("id", submissionId);

  return NextResponse.json({ id: submissionId, pdfUrl });
}
