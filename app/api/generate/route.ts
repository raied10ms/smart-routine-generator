import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { generateRoutine } from "@/lib/routine-engine";
import { getSubjects } from "@/lib/subjects";
import type { Grade, Group } from "@/lib/types";

export async function POST(req: NextRequest) {
  const { grade, group, assessment, durationDays } = await req.json();

  const subjects = getSubjects(grade as Grade, group as Group);

  const query = supabase
    .from("chapters")
    .select("*")
    .eq("grade", grade)
    .order("chapter_num");

  if (subjects.length > 0) query.in("subject", subjects);

  const { data: chapters, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Sort by canonical subject order before generating routine
  const order = new Map(subjects.map((s, i) => [s, i]));
  const sorted = (chapters ?? []).sort((a, b) => {
    const oa = order.get(a.subject) ?? 99;
    const ob = order.get(b.subject) ?? 99;
    return oa !== ob ? oa - ob : a.chapter_num - b.chapter_num;
  });

  const routine = generateRoutine(sorted, assessment, durationDays);
  return NextResponse.json({ routine });
}
