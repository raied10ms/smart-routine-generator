import { NextRequest, NextResponse } from "next/server";
import { parse } from "csv-parse/sync";
import { supabase } from "@/lib/db";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const text = await file.text();
  const records = parse(text, { columns: true, skip_empty_lines: true, trim: true });

  await supabase.from("chapters").delete().neq("id", 0);

  const rows = (records as Record<string, string>[]).map((row) => ({
    section: row.section,
    subject: row.subject,
    chapter_number: parseInt(row.chapter_number),
    chapter_name_bn: row.chapter_name_bn,
    chapter_name_en: row.chapter_name_en || null,
    question_type: row.question_type,
    cq_importance: parseInt(row.cq_importance),
    mcq_importance: parseInt(row.mcq_importance),
    math_importance: parseInt(row.math_importance),
    time_cq_min: parseInt(row.time_cq_min),
    time_mcq_min: parseInt(row.time_mcq_min),
    time_math_min: parseInt(row.time_math_min),
    time_revision_min: parseInt(row.time_revision_min),
  }));

  const { error } = await supabase.from("chapters").insert(rows);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ imported: rows.length });
}
