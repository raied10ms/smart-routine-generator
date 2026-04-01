"use client";

interface Props {
  label: string;
  selected: boolean;
  variant: "success" | "warning" | "error" | "gray" | "default";
  onClick: () => void;
}

const variantStyles = {
  success: { active: "bg-[var(--color-success)] text-white", inactive: "bg-[var(--color-surface)] text-[var(--color-success)] border border-[var(--color-success)]" },
  warning: { active: "bg-[var(--color-warning)] text-white", inactive: "bg-[var(--color-surface)] text-[var(--color-warning)] border border-[var(--color-warning)]" },
  error: { active: "bg-[var(--color-error)] text-white", inactive: "bg-[var(--color-surface)] text-[var(--color-error)] border border-[var(--color-error)]" },
  gray: { active: "bg-[var(--color-gray)] text-white", inactive: "bg-[var(--color-surface)] text-[var(--color-gray)] border border-[var(--color-gray)]" },
  default: { active: "bg-[var(--color-primary)] text-white", inactive: "bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)]" },
};

export default function PillButton({ label, selected, variant, onClick }: Props) {
  const styles = variantStyles[variant];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer px-3 py-1.5 rounded-[var(--radius-pill)] text-[13px] font-medium transition-colors hover:opacity-80 ${selected ? styles.active : styles.inactive}`}
    >
      {label}
    </button>
  );
}
