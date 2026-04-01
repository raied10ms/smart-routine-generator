import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { generateRoutine } from "@/lib/routine-engine";

export async function POST(req: NextRequest) {
  const { section, assessment, durationDays } = await req.json();

  const { rows: chapters } = await pool.query(
    "SELECT * FROM chapters WHERE section = $1 ORDER BY subject, chapter_number",
    [section]
  );

  const routine = generateRoutine(chapters, assessment, durationDays);

  return NextResponse.json({ routine });
}
