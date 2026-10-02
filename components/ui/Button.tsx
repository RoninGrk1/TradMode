import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "ghost" | "yes" | "no" | "danger" | "chrome";

const styles: Record<Variant, string> = {
  primary:
    "bg-[var(--tm-color-blue-500)] text-white hover:bg-[var(--tm-color-blue-400)] shadow-[var(--tm-shadow-glow)]",
  chrome:
    "bg-[rgba(200,212,232,0.12)] text-[var(--tm-color-chrome-bright)] border border-[var(--tm-color-chrome-edge)] hover:bg-[rgba(200,212,232,0.2)]",
  ghost:
    "bg-transparent text-[var(--tm-color-text-muted)] hover:text-[var(--tm-color-text)] hover:bg-[rgba(255,255,255,0.04)]",
  yes: "bg-[var(--tm-color-yes)] text-[#04140a] hover:brightness-110 font-semibold",
  no: "bg-[var(--tm-color-no)] text-white hover:brightness-110 font-semibold",
  danger:
    "bg-[var(--tm-color-no-bg)] text-[var(--tm-color-no)] border border-[rgba(239,68,68,0.4)] hover:bg-[rgba(239,68,68,0.25)]",
};

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: Variant;
}) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-[var(--tm-radius-sm)] px-3.5 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-45 ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
