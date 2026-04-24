import os from "os";
import fs from "fs";
import path from "path";

export const STORE_DIR = path.join(os.tmpdir(), "ssc-prints");
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function ensureDir() {
  if (!fs.existsSync(STORE_DIR)) fs.mkdirSync(STORE_DIR, { recursive: true });
}

function safePath(id: string, ext: string) {
  if (!/^[a-f0-9-]{36}$/.test(id)) throw new Error("Invalid print id");
  return path.join(STORE_DIR, `${id}.${ext}`);
}

export interface PrintMeta {
  filename: string;
  createdAt: number;
  pdfReady: boolean;
}

export function saveHtml(id: string, html: string, meta: PrintMeta) {
  ensureDir();
  cleanupExpired();
  fs.writeFileSync(safePath(id, "html"), html, "utf8");
  fs.writeFileSync(safePath(id, "json"), JSON.stringify(meta));
}

export function markPdfReady(id: string) {
  try {
    const mp = safePath(id, "json");
    const meta: PrintMeta = JSON.parse(fs.readFileSync(mp, "utf8"));
    meta.pdfReady = true;
    fs.writeFileSync(mp, JSON.stringify(meta));
  } catch { /* ignore */ }
}

export function readHtml(id: string): { html: string; meta: PrintMeta } | null {
  try {
    const hp = safePath(id, "html");
    const mp = safePath(id, "json");
    if (!fs.existsSync(hp) || !fs.existsSync(mp)) return null;
    const meta: PrintMeta = JSON.parse(fs.readFileSync(mp, "utf8"));
    if (Date.now() - meta.createdAt > TTL_MS) { cleanup(id); return null; }
    return { html: fs.readFileSync(hp, "utf8"), meta };
  } catch { return null; }
}

export function readPdf(id: string): { buffer: Buffer; meta: PrintMeta } | null {
  try {
    const pp = safePath(id, "pdf");
    const mp = safePath(id, "json");
    if (!fs.existsSync(pp) || !fs.existsSync(mp)) return null;
    const meta: PrintMeta = JSON.parse(fs.readFileSync(mp, "utf8"));
    if (Date.now() - meta.createdAt > TTL_MS) { cleanup(id); return null; }
    return { buffer: fs.readFileSync(pp), meta };
  } catch { return null; }
}

export function pdfPath(id: string) { return safePath(id, "pdf"); }

function cleanup(id: string) {
  for (const ext of ["html", "pdf", "json"]) {
    try { fs.unlinkSync(safePath(id, ext)); } catch { /* ignore */ }
  }
}

function cleanupExpired() {
  try {
    const now = Date.now();
    for (const f of fs.readdirSync(STORE_DIR)) {
      if (!f.endsWith(".json")) continue;
      try {
        const meta: PrintMeta = JSON.parse(fs.readFileSync(path.join(STORE_DIR, f), "utf8"));
        if (now - meta.createdAt > TTL_MS) {
          const id = f.replace(".json", "");
          cleanup(id);
        }
      } catch { /* skip */ }
    }
  } catch { /* dir may not exist */ }
}
