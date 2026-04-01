"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Section } from "@/lib/types";

const sections: Section[] = ["বিজ্ঞান", "মানবিক", "বাণিজ্য", "কলা"];

export default function InfoPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [section, setSection] = useState<Section | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem("wizard");
    if (saved) {
      const data = JSON.parse(saved);
      if (data.name) setName(data.name);
      if (data.section) setSection(data.section);
    }
  }, []);

  function handleNext() {
    if (!name.trim() || !section) return;
    const existing = JSON.parse(sessionStorage.getItem("wizard") || "{}");
    sessionStorage.setItem("wizard", JSON.stringify({ ...existing, name: name.trim(), section }));
    router.push("/wizard/assess");
  }

  return (
    <div>
      <h1 className="text-[22px] font-bold mb-6">তোমার তথ্য দাও</h1>
      <label className="block mb-4">
        <span className="text-[14px] text-[var(--color-text-muted)] mb-1 block">তোমার নাম</span>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="নাম লেখো"
          className="w-full px-4 py-3 rounded-[var(--radius-button)] bg-[var(--color-surface)] border border-[var(--color-border)] text-[15px] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all" />
      </label>
      <div className="mb-8">
        <span className="text-[14px] text-[var(--color-text-muted)] mb-2 block">তোমার বিভাগ</span>
        <div className="flex gap-2 flex-wrap">
          {sections.map((s) => (
            <button key={s} type="button" onClick={() => setSection(s)}
              className={`cursor-pointer px-5 py-2.5 rounded-[var(--radius-pill)] text-[14px] font-medium transition-colors hover:opacity-80 ${
                section === s ? "bg-[var(--color-primary)] text-white" : "bg-[var(--color-surface)] border border-[var(--color-border)]"
              }`}>{s}</button>
          ))}
        </div>
      </div>
      <button onClick={handleNext} disabled={!name.trim() || !section}
        className="cursor-pointer w-full py-3.5 rounded-[var(--radius-button)] bg-[var(--color-primary)] text-white font-semibold text-[16px] disabled:opacity-40 hover:bg-[var(--color-primary)]/90 transition-colors">
        পরের ধাপ →
      </button>
    </div>
  );
}
