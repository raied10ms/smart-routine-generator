"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Grade, Group } from "@/lib/types";

const GROUPS: { key: Group; sub: string }[] = [
  { key: "বিজ্ঞান",         sub: "Physics · Chemistry · Biology" },
  { key: "ব্যবসায় শিক্ষা", sub: "Math · Science · ICT" },
  { key: "মানবিক",           sub: "Math · Science · ICT" },
];

export default function InfoPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [grade, setGrade] = useState<Grade | null>(null);
  const [group, setGroup] = useState<Group | null>(null);

  useEffect(() => {
    const saved = JSON.parse(sessionStorage.getItem("wizard") || "{}");
    if (saved.name)  setName(saved.name);
    if (saved.grade) setGrade(saved.grade);
    if (saved.group) setGroup(saved.group);
  }, []);

  // Reset group when grade changes
  function selectGrade(g: Grade) {
    setGrade(g);
    if (g !== grade) setGroup(null);
  }

  function handleNext() {
    if (!name.trim() || !grade || !group) return;
    const existing = JSON.parse(sessionStorage.getItem("wizard") || "{}");
    sessionStorage.setItem("wizard", JSON.stringify({ ...existing, name: name.trim(), grade, group }));
    router.push("/wizard/assess");
  }

  return (
    <div className="pb-8">
      <h1 className="text-[22px] font-bold text-ten-ink mb-1">তোমার তথ্য দাও</h1>
      <p className="text-sm text-gray-400 mb-6">ধাপ ১: নাম, পরীক্ষা ও বিভাগ</p>

      {/* Name */}
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

      {/* Grade */}
      <div className="mb-5">
        <span className="text-[13px] font-semibold text-gray-500 mb-2.5 block">কোন পরীক্ষার জন্য রুটিন?</span>
        <div className="flex gap-3">
          {(["SSC", "HSC"] as Grade[]).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => selectGrade(g)}
              className={`flex-1 py-4 rounded-2xl border-2 text-center transition-all duration-200 cursor-pointer ${
                grade === g
                  ? "border-ten-red bg-[rgba(232,0,29,0.06)] ring-2 ring-ten-red/10"
                  : "border-gray-200 bg-white hover:border-ten-red/40"
              }`}
            >
              <div className="text-[24px] font-bold text-ten-ink leading-none">{g}</div>
              <div className="text-[11px] text-gray-400 mt-1.5">
                {g === "SSC" ? "মাধ্যমিক" : "উচ্চমাধ্যমিক"}
              </div>
              {grade === g && (
                <div className="mt-1.5 w-4 h-4 rounded-full bg-ten-red flex items-center justify-center mx-auto">
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Group — always visible, highlights when grade is selected */}
      <div className="mb-8">
        <span className="text-[13px] font-semibold text-gray-500 mb-2.5 block">বিভাগ</span>
        <div className="flex flex-col gap-2">
          {GROUPS.map((g) => (
            <button
              key={g.key}
              type="button"
              onClick={() => setGroup(g.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all duration-200 cursor-pointer ${
                group === g.key
                  ? "border-ten-red bg-[rgba(232,0,29,0.06)] ring-2 ring-ten-red/10"
                  : "border-gray-200 bg-white hover:border-ten-red/40"
              }`}
            >
              <div className="flex-1">
                <div className="text-[15px] font-bold text-ten-ink">{g.key}</div>
                <div className="text-[11px] text-gray-400 mt-0.5">{g.sub}</div>
              </div>
              {group === g.key && (
                <div className="w-5 h-5 rounded-full bg-ten-red flex items-center justify-center shrink-0">
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleNext}
        disabled={!name.trim() || !grade || !group}
        className="btn-primary w-full text-[16px] px-5 py-3.5 rounded-[10px]"
      >
        পরের ধাপ →
      </button>
    </div>
  );
}
