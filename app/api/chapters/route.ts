import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { getSubjects } from "@/lib/subjects";
import type { Grade, Group } from "@/lib/types";

export async function GET(req: NextRequest) {
  const grade = req.nextUrl.searchParams.get("grade") as Grade | null;
  const group = req.nextUrl.searchParams.get("group") as Group | null;

  if (!grade || (grade !== "SSC" && grade !== "HSC")) {
    return NextResponse.json({ error: "grade required: SSC | HSC" }, { status: 400 });
  }
  if (!group) {
    return NextResponse.json({ error: "group required" }, { status: 400 });
  }

  const subjects = getSubjects(grade, group);
  if (subjects.length === 0) {
    return NextResponse.json([]);
  }

  const { data, error } = await supabase
    .from("chapters")
    .select("*")
    .eq("grade", grade)
    .in("subject", subjects)
    .order("chapter_num");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Sort by canonical group subject order
  const order = new Map(subjects.map((s, i) => [s, i]));
  const sorted = (data ?? []).sort((a, b) => {
    const oa = order.get(a.subject) ?? 99;
    const ob = order.get(b.subject) ?? 99;
    return oa !== ob ? oa - ob : a.chapter_num - b.chapter_num;
  });

  return NextResponse.json(sorted);
}
