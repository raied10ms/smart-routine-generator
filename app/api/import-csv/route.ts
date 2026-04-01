import { NextRequest, NextResponse } from "next/server";
import { parse } from "csv-parse/sync";
import pool from "@/lib/db";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const text = await file.text();
  const records = parse(text, { columns: true, skip_empty_lines: true, trim: true });

  await pool.query("DELETE FROM chapters");
  let imported = 0;

  for (const rawRow of records) {
    const row = rawRow as Record<string, string>;
    await pool.query(
      `INSERT INTO chapters (section, subject, chapter_number, chapter_name_bn, chapter_name_en, question_type, cq_importance, mcq_importance, math_importance, time_cq_min, time_mcq_min, time_math_min, time_revision_min)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [
        row.section, row.subject, parseInt(row.chapter_number),
        row.chapter_name_bn, row.chapter_name_en || null, row.question_type,
        parseInt(row.cq_importance), parseInt(row.mcq_importance), parseInt(row.math_importance),
        parseInt(row.time_cq_min), parseInt(row.time_mcq_min), parseInt(row.time_math_min),
        parseInt(row.time_revision_min),
      ]
    );
    imported++;
  }

  return NextResponse.json({ imported });
}
