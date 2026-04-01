import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { sendSms } from "@/lib/sms";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, phone, school, classRoll, section, devicePreference, durationDays, assessment, routine } = body;

  // 1. Insert submission
  const { rows } = await pool.query(
    `INSERT INTO submissions (name, phone, school, class_roll, section, device_preference, duration_days, assessment)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
    [name, phone, school || null, classRoll || null, section, devicePreference, durationDays, JSON.stringify(assessment)]
  );
  const submissionId = rows[0].id;

  // 2. Insert routine days
  for (const day of routine) {
    await pool.query(
      `INSERT INTO routine_days (submission_id, day_number, phase, phase_name, is_weekend, is_extreme, entries, total_time_min)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [submissionId, day.dayNumber, day.phase, day.phaseName || "", day.isWeekend, day.isExtreme ?? false, JSON.stringify(day.entries), day.totalTimeMin]
    );
  }

  // 3. Generate PDF URL
  const pdfUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "https://ssc.10ms.com"}/api/pdf/${submissionId}`;
  await pool.query("UPDATE submissions SET pdf_url = $1 WHERE id = $2", [pdfUrl, submissionId]);

  // 4. Send SMS
  const smsSent = await sendSms(phone, `${name}, তোমার SSC 27 রুটিন তৈরি হয়েছে! Download করো: ${pdfUrl}`);
  await pool.query("UPDATE submissions SET sms_sent = $1 WHERE id = $2", [smsSent, submissionId]);

  return NextResponse.json({ id: submissionId, pdfUrl });
}
