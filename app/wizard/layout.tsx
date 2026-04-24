"use client";

import { usePathname } from "next/navigation";
import ProgressBar from "@/components/ProgressBar";

const stepMap: Record<string, number> = {
  "/wizard/info":     1,
  "/wizard/assess":   2,
  "/wizard/duration": 3,
  "/wizard/preview":  4,
  "/wizard/capture":  5,
};

const stepLabels = ["তথ্য", "বিষয়", "সময়কাল", "রুটিন", "PDF"];

export default function WizardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const step = stepMap[pathname] || 1;

  const isDark = step === 4;

  return (
    <div className={`min-h-dvh ${isDark ? "bg-[#0a0004]" : "bg-white"}`}>
      <ProgressBar currentStep={step} totalSteps={5} stepLabels={stepLabels} dark={isDark} />
      <div className="max-w-md mx-auto px-[var(--padding-page)]">
        {!isDark && (
          <div className="py-3 flex items-center justify-center">
            <img src="/10ms-logo.svg" alt="10 Minute School" className="h-6" />
          </div>
        )}
        {isDark && (
          <div className="py-3 flex items-center justify-center">
            <img src="/10ms-logo-white.svg" alt="10 Minute School" className="h-6" />
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
