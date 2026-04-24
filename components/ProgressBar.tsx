"use client";

interface Props {
  currentStep: number;
  totalSteps: number;
  stepLabels?: string[];
  dark?: boolean;
}

export default function ProgressBar({ currentStep, totalSteps, stepLabels, dark }: Props) {
  const pct = (currentStep / totalSteps) * 100;
  return (
    <div className="px-4 pt-3 pb-2">
      {stepLabels && (
        <div className="flex items-center justify-between mb-2">
          {stepLabels.map((label, i) => {
            const stepNum = i + 1;
            const done = stepNum < currentStep;
            const active = stepNum === currentStep;
            return (
              <div key={label} className="flex flex-col items-center gap-1">
                <div
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    done || active ? "bg-ten-red" : dark ? "bg-white/20" : "bg-[#E5E7EB]"
                  } ${active ? "ring-2 ring-ten-red/30 scale-125" : ""}`}
                />
                <span
                  className={`text-[9px] font-medium transition-colors ${
                    active ? "text-ten-red" : done ? (dark ? "text-white/60" : "text-ten-ink") : (dark ? "text-white/30" : "text-gray-400")
                  }`}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      )}
      <div className={`w-full h-1 ${dark ? "bg-white/10" : "bg-[#E5E7EB]"} rounded-full overflow-hidden`}>
        <div
          className="h-full bg-ten-red rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
