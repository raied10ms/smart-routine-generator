import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { generateRoutine } from "@/lib/routine-engine";
import { generatePdfHtml } from "@/lib/pdf-html";
import type { Assessment } from "@/lib/types";

export async function GET() {
  try {
    const { data: chapters, error } = await supabase
      .from("chapters")
      .select("*")
      .eq("section", "বিজ্ঞান")
      .order("subject")
      .order("chapter_number");

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!chapters || chapters.length === 0) {
      return NextResponse.json({ error: "No chapters found" }, { status: 404 });
    }

    const assessment: Assessment = {};
    for (const ch of chapters) {
      if (!assessment[ch.subject]) assessment[ch.subject] = {};
      assessment[ch.subject][String(ch.id)] = "revise";
    }

    const routine = generateRoutine(chapters, assessment, 30);
    const html = generatePdfHtml({
      name: "Test Student",
      section: "বিজ্ঞান",
      durationDays: 30,
      routine,
      device: "mobile",
    });

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("Test PDF generation failed:", errMsg);
    return NextResponse.json({ error: "PDF generation failed", detail: errMsg }, { status: 500 });
  }
}
