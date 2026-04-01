import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(req: NextRequest) {
  const section = req.nextUrl.searchParams.get("section");
  if (!section) return NextResponse.json({ error: "section required" }, { status: 400 });

  const { rows } = await pool.query(
    "SELECT * FROM chapters WHERE section = $1 ORDER BY subject, chapter_number",
    [section]
  );

  return NextResponse.json(rows);
}
