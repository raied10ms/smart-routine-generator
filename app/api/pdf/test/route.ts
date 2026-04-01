import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { generateRoutine } from "@/lib/routine-engine";
import { generatePdfHtml } from "@/lib/pdf-html";
import type { Assessment } from "@/lib/types";

export async function GET() {
  try {
    const { rows: chapters } = await pool.query(
      "SELECT * FROM chapters WHERE section = $1 ORDER BY subject, chapter_number",
      ["বিজ্ঞান"]
    );

    if (chapters.length === 0) {
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

    // Use puppeteer to convert HTML to PDF
    let puppeteer;
    try {
      puppeteer = await import("puppeteer-core");
    } catch {
      // Fallback: return HTML if puppeteer not available
      return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    const browser = await puppeteer.default.launch({
      executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      headless: true,
      args: ["--no-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "10mm", bottom: "10mm", left: "10mm", right: "10mm" },
    });
    await browser.close();

    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="SSC27-Routine-Test.pdf"',
      },
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("Test PDF generation failed:", errMsg);
    return NextResponse.json({ error: "PDF generation failed", detail: errMsg }, { status: 500 });
  }
}
