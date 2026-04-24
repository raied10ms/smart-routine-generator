import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

export async function GET(req: NextRequest) {
  const grade = req.nextUrl.searchParams.get("grade");
  if (!grade || (grade !== "SSC" && grade !== "HSC")) {
    return NextResponse.json({ error: "grade required: SSC | HSC" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("chapters")
    .select("*")
    .eq("grade", grade)
    .order("subject")
    .order("chapter_num");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
