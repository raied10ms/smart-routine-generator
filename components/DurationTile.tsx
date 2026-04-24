"use client";

import type { DurationOption } from "@/lib/types";
import { toBanglaNum } from "@/lib/utils";

interface Props {
  days: DurationOption;
  description: string;
  recommended?: boolean;
  selected: boolean;
  onClick: () => void;
}

export default function DurationTile({ days, description, recommended, selected, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer relative p-4 rounded-2xl border-2 text-left transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
        selected
          ? "border-ten-red bg-[rgba(232,0,29,0.06)] ring-2 ring-ten-red/10"
          : "border-gray-200 bg-white hover:border-ten-red/40"
      }`}
    >
      {recommended && (
        <span className="absolute -top-2.5 left-3 bg-ten-red text-white text-[11px] px-2 py-0.5 rounded-full font-bold">
          সেরা পছন্দ
        </span>
      )}
      <span className="block text-[24px] font-bold text-ten-ink">{toBanglaNum(days)} দিন</span>
      <span className="block text-[12px] text-gray-400 mt-1">{description}</span>
      {selected && (
        <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-ten-red flex items-center justify-center">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
      )}
    </button>
  );
}
