import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { generateRoutine } from "@/lib/routine-engine";

export async function POST(req: NextRequest) {
  const { section, assessment, durationDays } = await req.json();

  const { data: chapters, error } = await supabase
    .from("chapters")
    .select("*")
    .eq("section", section)
    .order("subject")
    .order("chapter_number");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const routine = generateRoutine(chapters || [], assessment, durationDays);

  return NextResponse.json({ routine });
}
