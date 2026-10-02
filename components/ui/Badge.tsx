import type { ReactNode } from "react";

const variants: Record<string, string> = {
  default: "bg-[var(--tm-color-bg-elevated)] text-[var(--tm-color-chrome)] border-[var(--tm-color-border)]",
  blue: "bg-[rgba(59,130,246,0.18)] text-[var(--tm-color-blue-200)] border-[rgba(59,130,246,0.35)]",
  yes: "bg-[var(--tm-color-yes-bg)] text-[var(--tm-color-yes)] border-[rgba(34,197,94,0.35)]",
  no: "bg-[var(--tm-color-no-bg)] text-[var(--tm-color-no)] border-[rgba(239,68,68,0.35)]",
  warn: "bg-[var(--tm-color-warn-bg)] text-[var(--tm-color-warn)] border-[rgba(245,158,11,0.35)]",
  muted: "bg-transparent text-[var(--tm-color-text-muted)] border-[var(--tm-color-border)]",
};

export function Badge({
  children,
  variant = "default",
}: {
  children: ReactNode;
  variant?: keyof typeof variants;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-[var(--tm-radius-pill)] border px-2.5 py-0.5 text-xs font-medium tracking-wide ${variants[variant]}`}
    >
      {children}
    </span>
  );
}
