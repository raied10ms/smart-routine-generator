"use client";

interface Props {
  label: string;
  selected: boolean;
  variant: "success" | "warning" | "error" | "gray" | "default";
  onClick: () => void;
}

const variantStyles = {
  success: {
    active:   "bg-ten-green text-white border-ten-green",
    inactive: "bg-white text-ten-green border-ten-green/50 hover:border-ten-green",
  },
  warning: {
    active:   "bg-[#F59E0B] text-white border-[#F59E0B]",
    inactive: "bg-white text-[#92400E] border-[#FDE68A] hover:border-[#F59E0B]",
  },
  error: {
    active:   "bg-ten-red text-white border-ten-red",
    inactive: "bg-white text-ten-red border-ten-red/40 hover:border-ten-red",
  },
  gray: {
    active:   "bg-gray-500 text-white border-gray-500",
    inactive: "bg-white text-gray-500 border-gray-300 hover:border-gray-400",
  },
  default: {
    active:   "bg-ten-red text-white border-ten-red",
    inactive: "bg-white text-gray-600 border-gray-200 hover:border-ten-red",
  },
};

export default function PillButton({ label, selected, variant, onClick }: Props) {
  const styles = variantStyles[variant];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer px-3 py-1.5 rounded-full text-[13px] font-semibold border transition-all hover:opacity-90 ${
        selected ? styles.active : styles.inactive
      }`}
    >
      {label}
    </button>
  );
}
