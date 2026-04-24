import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { generatePdfHtml } from "@/lib/pdf-html";
import { savePdf } from "@/lib/pdf-store";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { name, section, durationDays, routine } = await req.json();

  const html = generatePdfHtml({ name, section, durationDays, routine, puppeteer: true });

  const puppeteer = await import("puppeteer");
  const browser = await puppeteer.default.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfUint8 = await page.pdf({
      format: "A4",
      margin: { top: "10mm", bottom: "10mm", left: "10mm", right: "10mm" },
      printBackground: true,
      displayHeaderFooter: false,
    });

    const safeName = name.replace(/[^\w\u0980-\u09FF]/g, "-").replace(/-+/g, "-");
    const filename = `SSC27-Routine-${safeName}.pdf`;
    const pdfId = randomUUID();

    savePdf(pdfId, Buffer.from(pdfUint8), { filename, createdAt: Date.now() });

    return NextResponse.json({ pdfId, filename });
  } finally {
    await browser.close();
  }
}
