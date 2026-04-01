const phaseColors = {
  1: { bg: "bg-[var(--color-primary-light)]", text: "text-[var(--color-primary)]" },
  2: { bg: "bg-amber-50", text: "text-[var(--color-warning)]" },
  3: { bg: "bg-green-50", text: "text-[var(--color-success)]" },
};

export default function PhaseLabel({ phase, phaseName }: { phase: 1 | 2 | 3; phaseName?: string }) {
  const cfg = phaseColors[phase];
  const defaultNames: Record<number, string> = {
    1: "ফাউন্ডেশন মোড 🏗️",
    2: "প্র্যাকটিস গ্রাইন্ড 🔥",
    3: "ফাইনাল রিভিশন 🎯",
  };
  const label = phaseName || defaultNames[phase];
  return (
    <div className={`${cfg.bg} ${cfg.text} px-4 py-2 text-[13px] font-semibold`}>
      {label}
    </div>
  );
}
