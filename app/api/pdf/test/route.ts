import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import pool from "@/lib/db";
import { generateRoutine } from "@/lib/routine-engine";
import RoutinePDF from "@/lib/pdf-generator";
import type { Assessment } from "@/lib/types";

export async function GET() {
  try {
    // Fetch chapters for বিজ্ঞান section
    const { rows: chapters } = await pool.query(
      "SELECT * FROM chapters WHERE section = $1 ORDER BY subject, chapter_number",
      ["বিজ্ঞান"]
    );

    if (chapters.length === 0) {
      return NextResponse.json({ error: "No chapters found for বিজ্ঞান" }, { status: 404 });
    }

    // Build assessment: mark all chapters as "revise"
    const assessment: Assessment = {};
    for (const ch of chapters) {
      if (!assessment[ch.subject]) assessment[ch.subject] = {};
      assessment[ch.subject][String(ch.id)] = "revise";
    }

    // Generate routine for 30 days
    const routine = generateRoutine(chapters, assessment, 30);

    // Render PDF
    const buffer = await renderToBuffer(
      RoutinePDF({
        name: "Test Student",
        section: "বিজ্ঞান",
        durationDays: 30,
        routine,
      })
    );

    const uint8 = new Uint8Array(buffer);

    return new NextResponse(uint8, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="SSC27-Routine-Test.pdf"`,
      },
    });
  } catch (error) {
    console.error("Test PDF generation failed:", error);
    return NextResponse.json({ error: "PDF generation failed" }, { status: 500 });
  }
}
