"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Grade } from "@/lib/types";

export default function InfoPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [grade, setGrade] = useState<Grade | null>(null);

  useEffect(() => {
    const saved = JSON.parse(sessionStorage.getItem("wizard") || "{}");
    if (saved.name)  setName(saved.name);
    if (saved.grade) setGrade(saved.grade);
  }, []);

  function handleNext() {
    if (!name.trim() || !grade) return;
    const existing = JSON.parse(sessionStorage.getItem("wizard") || "{}");
    sessionStorage.setItem("wizard", JSON.stringify({ ...existing, name: name.trim(), grade }));
    router.push("/wizard/assess");
  }

  return (
    <div className="pb-8">
      <h1 className="text-[22px] font-bold text-ten-ink mb-1">তোমার তথ্য দাও</h1>
      <p className="text-sm text-gray-400 mb-6">ধাপ ১: নাম ও পরীক্ষা</p>

      <label className="block mb-5">
        <span className="text-[13px] font-semibold text-gray-500 mb-1.5 block">তোমার নাম</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="নাম লেখো"
          className="input-field-light"
        />
      </label>

      <div className="mb-8">
        <span className="text-[13px] font-semibold text-gray-500 mb-2.5 block">কোন পরীক্ষার জন্য রুটিন?</span>
        <div className="flex gap-3">
          {(["SSC", "HSC"] as Grade[]).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGrade(g)}
              className={`flex-1 py-5 rounded-2xl border-2 text-center transition-all duration-200 cursor-pointer ${
                grade === g
                  ? "border-ten-red bg-[rgba(232,0,29,0.06)] ring-2 ring-ten-red/10"
                  : "border-gray-200 bg-white hover:border-ten-red/40"
              }`}
            >
              <div className="text-[26px] font-bold text-ten-ink leading-none">{g}</div>
              <div className="text-[11px] text-gray-400 mt-1.5">
                {g === "SSC" ? "মাধ্যমিক পরীক্ষা" : "উচ্চমাধ্যমিক পরীক্ষা"}
              </div>
              {grade === g && (
                <div className="mt-2 w-4 h-4 rounded-full bg-ten-red flex items-center justify-center mx-auto">
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleNext}
        disabled={!name.trim() || !grade}
        className="btn-primary w-full text-[16px] px-5 py-3.5 rounded-[10px]"
      >
        পরের ধাপ →
      </button>
    </div>
  );
}
