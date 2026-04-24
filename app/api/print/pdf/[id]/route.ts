import { NextRequest, NextResponse } from "next/server";
import { readPdf, readHtml } from "@/lib/print-store";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const pdf = readPdf(id);
  if (pdf) {
    return new NextResponse(pdf.buffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${pdf.meta.filename}"`,
        "Content-Length": String(pdf.buffer.length),
      },
    });
  }

  // Still generating
  const record = readHtml(id);
  if (record && !record.meta.pdfReady) {
    return NextResponse.json({ status: "generating" }, { status: 202 });
  }

  return NextResponse.json({ error: "Not found or expired" }, { status: 404 });
}
