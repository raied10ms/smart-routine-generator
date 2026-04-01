"use client";

interface Props {
  currentStep: number;
  totalSteps: number;
}

export default function ProgressBar({ currentStep, totalSteps }: Props) {
  const pct = (currentStep / totalSteps) * 100;
  return (
    <div className="w-full h-1 bg-[var(--color-border)]">
      <div
        className="h-full bg-[var(--color-primary)] transition-all duration-300"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
