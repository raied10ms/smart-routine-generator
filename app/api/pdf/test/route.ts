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

    // Try puppeteer for local dev, fallback to HTML
    try {
      const puppeteer = await import("puppeteer-core");
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
    } catch {
      // Fallback: return HTML (user can print to PDF from browser)
      return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("Test PDF generation failed:", errMsg);
    return NextResponse.json({ error: "PDF generation failed", detail: errMsg }, { status: 500 });
  }
}
