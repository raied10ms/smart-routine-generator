import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { execFile } from "child_process";
import path from "path";
import { generatePrintHtml } from "@/lib/print-html";
import { saveHtml, markPdfReady, pdfPath, STORE_DIR } from "@/lib/print-store";
import type { RoutineDay, Assessment } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 10;

interface Body {
  name: string;
  grade: string;
  durationDays: number;
  routine: RoutineDay[];
  assessment?: Assessment;
}

const PYTHON = "/opt/homebrew/bin/python3";

export async function POST(req: NextRequest) {
  const body: Body = await req.json();
  const { name, grade, durationDays, routine, assessment } = body;

  const printId = randomUUID();
  const safeName = name.replace(/[^\w\u0980-\u09FF]/g, "-").replace(/-+/g, "-");
  const filename = `${grade}-Routine-${safeName}.pdf`;

  const html = generatePrintHtml({ name, grade, durationDays, routine, assessment, autoPrint: true });
  saveHtml(printId, html, { filename, createdAt: Date.now(), pdfReady: false });

  // Kick off PDF generation async — responds immediately
  const htmlFilePath = path.join(STORE_DIR, `${printId}.html`);
  const pdfFilePath  = pdfPath(printId);
  const scriptPath   = path.join(process.cwd(), "scripts", "html_to_pdf.py");

  execFile(PYTHON, [scriptPath, htmlFilePath, pdfFilePath, process.cwd()], { timeout: 120_000 }, (err) => {
    if (err) { console.error("[print] PDF generation failed:", err.message); return; }
    markPdfReady(printId);
  });

  // Return relative paths — client uses window.location.origin for absolute URLs
  return NextResponse.json({
    printId,
    htmlPath: `/api/print/html/${printId}`,
    pdfPath:  `/api/print/pdf/${printId}`,
    filename,
  });
}
