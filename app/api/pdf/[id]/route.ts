import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { generatePdfHtml } from "@/lib/pdf-html";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { rows: subs } = await pool.query("SELECT * FROM submissions WHERE id = $1", [id]);
  if (subs.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const sub = subs[0];

  const { rows: days } = await pool.query(
    "SELECT * FROM routine_days WHERE submission_id = $1 ORDER BY day_number",
    [id]
  );

  const routine = days.map((d: Record<string, unknown>) => ({
    dayNumber: d.day_number as number,
    phase: d.phase as 1 | 2 | 3,
    phaseName: (d.phase_name as string) || "",
    isWeekend: d.is_weekend as boolean,
    isExtreme: (d.is_extreme as boolean) || false,
    entries: d.entries as Array<{ chapterId: number; subject: string; chapterName: string; taskType: string; timeMin: number }>,
    totalTimeMin: d.total_time_min as number,
  }));

  const html = generatePdfHtml({
    name: sub.name,
    section: sub.section,
    durationDays: sub.duration_days,
    routine,
    device: sub.device_preference || "mobile",
  });

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
        "Content-Disposition": `attachment; filename="SSC27-Routine-${sub.name.replace(/\s+/g, "-")}.pdf"`,
      },
    });
  } catch {
    return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }
}
