import type { ReactNode } from "react";
import { Nav } from "./Nav";

export function AppShell({
  children,
  title,
  subtitle,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="tm-app min-h-screen">
      <div className="tm-bg-grid pointer-events-none fixed inset-0" aria-hidden />
      <header className="sticky top-0 z-40 border-b border-[var(--tm-color-border)] bg-[rgba(5,10,20,0.72)] backdrop-blur-[var(--tm-blur-md)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-[var(--tm-radius-sm)] border border-[var(--tm-color-chrome-edge)] bg-[rgba(59,130,246,0.2)] text-sm font-bold tracking-tight text-[var(--tm-color-blue-100)] shadow-[var(--tm-shadow-glow)]">
                TM
              </div>
              <div>
                <p className="text-sm font-semibold tracking-wide text-[var(--tm-color-chrome-bright)]">
                  TradeMode
                </p>
                <p className="text-[11px] text-[var(--tm-color-text-dim)]">
                  Polymarket BTC 15m · glass terminal
                </p>
              </div>
            </div>
            <span className="hidden rounded-[var(--tm-radius-pill)] border border-[var(--tm-color-border)] px-2.5 py-1 text-[10px] uppercase tracking-widest text-[var(--tm-color-chrome-dim)] sm:inline">
              Live Gamma · Free APIs
            </span>
          </div>
          <Nav />
        </div>
      </header>
      <main className="relative mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--tm-color-chrome-bright)] sm:text-3xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-1 max-w-2xl text-sm text-[var(--tm-color-text-muted)]">{subtitle}</p>
          ) : null}
        </div>
        {children}
      </main>
      <footer className="mx-auto max-w-6xl px-4 pb-10 text-xs text-[var(--tm-color-text-dim)] sm:px-6">
        TradeMode is a research/trading terminal scaffold. Polymarket geographic restrictions may apply.
        Not financial advice. Prices shown only when returned by public APIs.
      </footer>
    </div>
  );
}
