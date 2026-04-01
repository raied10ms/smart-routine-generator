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
    <button type="button" onClick={onClick}
      className={`cursor-pointer relative p-4 rounded-[var(--radius-card)] border-2 text-left transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
        selected ? "border-[var(--color-primary)] bg-[var(--color-primary-light)]" : "border-[var(--color-border)] bg-white"
      }`}>
      {recommended && (
        <span className="absolute -top-2.5 left-3 bg-[var(--color-primary)] text-white text-[11px] px-2 py-0.5 rounded-full">সেরা পছন্দ</span>
      )}
      <span className="block text-[24px] font-bold text-[var(--color-secondary)]">{toBanglaNum(days)} দিন</span>
      <span className="block text-[13px] text-[var(--color-text-muted)] mt-1">{description}</span>
      {selected && <span className="absolute top-3 right-3 text-[var(--color-primary)]">✓</span>}
    </button>
  );
}
