import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { execFile } from "child_process";
import path from "path";
import { generatePrintHtml } from "@/lib/print-html";
import { saveHtml, markPdfReady, pdfPath, STORE_DIR } from "@/lib/print-store";
import type { RoutineDay } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 10;

interface Body {
  name: string;
  grade: string;
  durationDays: number;
  routine: RoutineDay[];
}

// Homebrew Python has weasyprint + all GTK libs properly linked
const PYTHON = "/opt/homebrew/bin/python3";

export async function POST(req: NextRequest) {
  const body: Body = await req.json();
  const { name, grade, durationDays, routine } = body;

  const printId = randomUUID();
  const safeName = name.replace(/[^\w\u0980-\u09FF]/g, "-").replace(/-+/g, "-");
  const filename = `${grade}-Routine-${safeName}.pdf`;

  const html = generatePrintHtml({ name, grade, durationDays, routine, autoPrint: true });
  saveHtml(printId, html, { filename, createdAt: Date.now(), pdfReady: false });

  // Kick off PDF generation async — responds immediately
  const htmlFilePath = path.join(STORE_DIR, `${printId}.html`);
  const pdfFilePath  = pdfPath(printId);
  const scriptPath   = path.join(process.cwd(), "scripts", "html_to_pdf.py");

  execFile(PYTHON, [scriptPath, htmlFilePath, pdfFilePath], { timeout: 120_000 }, (err) => {
    if (err) { console.error("[print] PDF generation failed:", err.message); return; }
    markPdfReady(printId);
  });

  const base = req.nextUrl.origin;
  return NextResponse.json({
    printId,
    htmlUrl: `${base}/api/print/html/${printId}`,
    pdfUrl:  `${base}/api/print/pdf/${printId}`,
    filename,
  });
}
