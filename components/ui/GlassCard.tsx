import type { ReactNode } from "react";

export function GlassCard({
  children,
  className = "",
  padding = true,
}: {
  children: ReactNode;
  className?: string;
  padding?: boolean;
}) {
  return (
    <div
      className={`glass-card ${padding ? "p-4 sm:p-5" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
