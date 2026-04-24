import { NextRequest, NextResponse } from "next/server";
import { readPdf } from "@/lib/pdf-store";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const result = readPdf(id);
  if (!result) {
    return new NextResponse(
      `<html><body style="font-family:sans-serif;padding:40px;text-align:center">
        <h2>PDF পাওয়া যায়নি</h2>
        <p>লিঙ্কটি মেয়াদ উত্তীর্ণ হয়েছে (৬০ মিনিট) বা ইতিমধ্যে মুছে ফেলা হয়েছে।</p>
        <p><a href="/">নতুন রুটিন তৈরি করো</a></p>
      </body></html>`,
      { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  return new NextResponse(result.buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${result.meta.filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
