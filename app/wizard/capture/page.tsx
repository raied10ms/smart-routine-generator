"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface PrintResult {
  printId: string;
  htmlPath: string;
  pdfPath: string;
  filename: string;
}

export default function CapturePage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [school, setSchool] = useState("");
  const [roll, setRoll] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<PrintResult | null>(null);
  const [pdfReady, setPdfReady] = useState(false);
  const [copied, setCopied] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const saved = JSON.parse(sessionStorage.getItem("wizard") || "{}");
    if (!saved.routinePreview) router.push("/wizard/duration");
  }, [router]);

  // Poll for PDF readiness using relative path
  useEffect(() => {
    if (!result || pdfReady) return;
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(result.pdfPath, { method: "HEAD" });
        if (res.status === 200) { setPdfReady(true); clearInterval(pollRef.current!); }
      } catch { /* ignore */ }
    }, 2000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [result, pdfReady]);

  async function handleSubmit() {
    if (!phone.trim()) return;
    setError("");

    const saved = JSON.parse(sessionStorage.getItem("wizard") || "{}");
    const isBypass = phone.trim() === "1234";

    if (!isBypass) {
      const bd = /^01[3-9]\d{8}$/.test(phone.trim());
      if (!bd) { setError("সঠিক বাংলাদেশী মোবাইল নম্বর দাও (01XXXXXXXXX)"); return; }
    }

    setSubmitting(true);

    try {
      // Submit analytics (fire-and-forget)
      if (!isBypass) {
        fetch("/api/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: saved.name, phone: phone.trim(),
            school: school.trim(), classRoll: roll.trim(),
            grade: saved.grade, durationDays: saved.durationDays,
            assessment: saved.assessment, routine: saved.routinePreview,
          }),
        }).catch(() => {});
      }

      // Generate print HTML + kick off PDF
      const genRes = await fetch("/api/print/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: saved.name, grade: saved.grade,
          durationDays: saved.durationDays, routine: saved.routinePreview,
          assessment: saved.assessment,
        }),
      });
      if (!genRes.ok) throw new Error("Generation failed");

      const data: PrintResult = await genRes.json();
      setResult(data);

      // Open print HTML in new tab using relative path → auto-print dialog triggers
      window.open(data.htmlPath, "_blank");
    } catch (err) {
      setError(err instanceof Error ? err.message : "সমস্যা হয়েছে, আবার চেষ্টা করো।");
    } finally {
      setSubmitting(false);
    }
  }

  async function copyLink() {
    if (!result) return;
    // Build absolute URL client-side so it always uses the real host
    const absoluteUrl = `${window.location.origin}${result.htmlPath}`;
    await navigator.clipboard.writeText(absoluteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (result) {
    return (
      <div className="pb-8">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-full bg-ten-green/15 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1CAB55" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div>
            <div className="text-[15px] font-bold text-ten-ink">রুটিন তৈরি হয়েছে!</div>
            <div className="text-[12px] text-gray-400">Print ডায়ালগ নতুন ট্যাবে খুলেছে</div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {/* Re-open print */}
          <a
            href={result.htmlPath}
            target="_blank"
            rel="noopener"
            className="flex items-center gap-3 bg-ten-ink text-white px-4 py-3.5 rounded-xl font-bold text-[14px] hover:bg-gray-900 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
            </svg>
            Print করো (নতুন ট্যাব)
          </a>

          {/* Copy link */}
          <button
            onClick={copyLink}
            className="flex items-center gap-3 bg-gray-100 text-ten-ink px-4 py-3.5 rounded-xl font-semibold text-[14px] hover:bg-gray-200 transition-colors cursor-pointer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
            </svg>
            {copied ? "✓ লিংক কপি হয়েছে!" : "রুটিন লিংক কপি করো (২৪ ঘণ্টা বৈধ)"}
          </button>

          {/* PDF download */}
          {pdfReady ? (
            <a
              href={result.pdfPath}
              download={result.filename}
              className="btn-red flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl font-bold text-[14px]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
              </svg>
              PDF নামাও
            </a>
          ) : (
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 px-4 py-3.5 rounded-xl text-[14px] text-gray-500">
              <span className="inline-block w-4 h-4 border-2 border-gray-300 border-t-ten-red rounded-full animate-spin shrink-0" />
              PDF তৈরি হচ্ছে — একটু অপেক্ষা করো...
            </div>
          )}
        </div>

        <p className="text-[11px] text-gray-400 text-center mt-5">
          রুটিন লিংক ২৪ ঘণ্টা সংরক্ষিত থাকবে
        </p>
      </div>
    );
  }

  return (
    <div className="pb-8">
      <h1 className="text-[22px] font-bold text-ten-ink mb-1">একটু তথ্য দাও</h1>
      <p className="text-[13px] text-gray-400 mb-6">ধাপ ৫: রুটিন Print ও PDF পাবে</p>

      <div className="flex flex-col gap-4 mb-6">
        <div>
          <label className="text-[13px] font-semibold text-gray-500 mb-1.5 block">
            মোবাইল নাম্বার <span className="text-ten-red">*</span>
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="01XXXXXXXXX"
            className="input-field-light"
          />
          <p className="text-[11px] text-gray-400 mt-1">তোমার নম্বর শুধু রেকর্ড রাখতে ব্যবহার হবে।</p>
        </div>

        <div>
          <label className="text-[13px] font-semibold text-gray-500 mb-1.5 block">স্কুলের নাম (ঐচ্ছিক)</label>
          <input
            type="text"
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            placeholder="তোমার স্কুলের নাম"
            className="input-field-light"
          />
        </div>

        <div>
          <label className="text-[13px] font-semibold text-gray-500 mb-1.5 block">ক্লাস রোল (ঐচ্ছিক)</label>
          <input
            type="text"
            value={roll}
            onChange={(e) => setRoll(e.target.value)}
            placeholder="ক্লাস রোল"
            className="input-field-light"
          />
        </div>
      </div>

      {error && (
        <div className="bg-[#FFF1F2] border border-ten-red/30 rounded-xl px-4 py-3 mb-4">
          <p className="text-ten-red text-[13px] font-semibold">{error}</p>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!phone.trim() || submitting}
        className="btn-red w-full text-[16px] px-5 py-3.5 rounded-[10px] gap-2"
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            রুটিন তৈরি হচ্ছে...
          </span>
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
            </svg>
            রুটিন Print করো ও PDF পাও
          </>
        )}
      </button>
    </div>
  );
}
