import os from "os";
import fs from "fs";
import path from "path";

const STORE_DIR = path.join(os.tmpdir(), "ssc-pdfs");
const TTL_MS = 60 * 60 * 1000; // 60 minutes

function ensureDir() {
  if (!fs.existsSync(STORE_DIR)) fs.mkdirSync(STORE_DIR, { recursive: true });
}

function pdfPath(id: string) {
  // Sanitise id to prevent path traversal — only allow UUID chars
  if (!/^[a-f0-9-]{36}$/.test(id)) throw new Error("Invalid PDF id");
  return path.join(STORE_DIR, `${id}.pdf`);
}

function metaPath(id: string) {
  return path.join(STORE_DIR, `${id}.json`);
}

export interface PdfMeta {
  filename: string;
  createdAt: number;
}

export function savePdf(id: string, buffer: Buffer, meta: PdfMeta) {
  ensureDir();
  cleanupExpired();
  fs.writeFileSync(pdfPath(id), buffer);
  fs.writeFileSync(metaPath(id), JSON.stringify(meta));
}

export function readPdf(id: string): { buffer: Buffer; meta: PdfMeta } | null {
  try {
    const p = pdfPath(id);
    const m = metaPath(id);
    if (!fs.existsSync(p) || !fs.existsSync(m)) return null;

    const meta: PdfMeta = JSON.parse(fs.readFileSync(m, "utf8"));
    if (Date.now() - meta.createdAt > TTL_MS) {
      fs.unlinkSync(p);
      fs.unlinkSync(m);
      return null;
    }
    return { buffer: fs.readFileSync(p), meta };
  } catch {
    return null;
  }
}

function cleanupExpired() {
  try {
    const files = fs.readdirSync(STORE_DIR);
    const now = Date.now();
    for (const f of files) {
      if (!f.endsWith(".json")) continue;
      const fp = path.join(STORE_DIR, f);
      try {
        const meta: PdfMeta = JSON.parse(fs.readFileSync(fp, "utf8"));
        if (now - meta.createdAt > TTL_MS) {
          fs.unlinkSync(fp);
          const pdfFile = fp.replace(".json", ".pdf");
          if (fs.existsSync(pdfFile)) fs.unlinkSync(pdfFile);
        }
      } catch { /* skip corrupt entries */ }
    }
  } catch { /* store dir may not exist yet */ }
}
