import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

export async function GET(req: NextRequest) {
  const section = req.nextUrl.searchParams.get("section");
  if (!section) return NextResponse.json({ error: "section required" }, { status: 400 });

  const { data, error } = await supabase
    .from("chapters")
    .select("*")
    .eq("section", section)
    .order("subject")
    .order("chapter_number");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
