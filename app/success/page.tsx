"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function SuccessPage() {
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [filename, setFilename] = useState("SSC27-Routine.pdf");
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    const url = sessionStorage.getItem("pdfDownloadUrl");
    const fn  = sessionStorage.getItem("pdfFilename");
    if (url) setDownloadUrl(url);
    if (fn)  setFilename(fn);
    setShareUrl(window.location.origin);
  }, []);

  return (
    <div className="min-h-dvh sg-hero flex flex-col justify-center items-center px-6 text-center relative z-10">
      <img src="/10ms-logo-white.svg" alt="10 Minute School" className="h-6 mb-12" />

      <div className="w-16 h-16 rounded-full bg-ten-green flex items-center justify-center mb-6 shadow-lg">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <h1 className="text-[26px] font-bold text-white mb-3">PDF Download হয়েছে!</h1>
      <p className="text-white/60 text-[15px] mb-8 max-w-xs">
        ফাইলটি তোমার Downloads ফোল্ডারে পাবে। খুঁজে না পেলে নিচে আবার Download করো।
      </p>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        {downloadUrl && (
          <a
            href={downloadUrl}
            download={filename}
            className="btn-red text-[15px] px-6 py-3 rounded-[10px] gap-2 w-full flex items-center justify-center"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
            </svg>
            PDF আবার Download করো
          </a>
        )}

        <a
          href={`https://wa.me/?text=${encodeURIComponent(`আমি SSC 27 এর জন্য personalized রুটিন তৈরি করেছি! তুমিও তৈরি করো 👉 ${shareUrl}`)}`}
          target="_blank"
          rel="noopener"
          className="btn-primary text-[15px] px-6 py-3 rounded-[10px] gap-2 w-full flex items-center justify-center"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/>
          </svg>
          বন্ধুকে পাঠাও
        </a>
      </div>

      <Link href="/" className="text-white/40 text-[13px] hover:text-white/70 transition-colors mt-6">
        আবার শুরু করো
      </Link>
    </div>
  );
}
