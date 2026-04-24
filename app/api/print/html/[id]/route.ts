import { NextRequest, NextResponse } from "next/server";
import { readHtml } from "@/lib/print-store";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = readHtml(id);
  if (!result) return NextResponse.json({ error: "Not found or expired" }, { status: 404 });

  return new NextResponse(result.html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
