"use client";

import { usePathname } from "next/navigation";
import ProgressBar from "@/components/ProgressBar";

const stepMap: Record<string, number> = {
  "/wizard/info": 1,
  "/wizard/assess": 2,
  "/wizard/duration": 3,
  "/wizard/preview": 4,
  "/wizard/capture": 5,
};

export default function WizardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const step = stepMap[pathname] || 1;

  return (
    <div className="min-h-dvh bg-[var(--color-bg)]">
      <ProgressBar currentStep={step} totalSteps={5} />
      <div className="max-w-md mx-auto px-[var(--padding-page)] py-6">
        {children}
      </div>
    </div>
  );
}
