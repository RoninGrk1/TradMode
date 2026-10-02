import { Badge } from "@/components/ui/Badge";
import { GlassCard } from "@/components/ui/GlassCard";
import type { Btc15mMarketView } from "@/lib/polymarket/types";
import Link from "next/link";

function pct(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${(n * 100).toFixed(1)}¢`;
}

export function MarketCard({ market }: { market: Btc15mMarketView }) {
  const statusVariant =
    market.status === "live" ? "yes" : market.status === "error" ? "no" : market.status === "closed" ? "muted" : "warn";

  return (
    <GlassCard className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-[var(--tm-color-chrome-bright)]">{market.window.label}</p>
          <p className="mt-0.5 font-mono text-[11px] text-[var(--tm-color-text-dim)]">{market.window.slug}</p>
        </div>
        <div className="flex flex-wrap justify-end gap-1">
          {market.window.isCurrent ? <Badge variant="blue">Current</Badge> : null}
          <Badge variant={statusVariant}>{market.status}</Badge>
        </div>
      </div>

      {market.status === "error" ? (
        <p className="text-sm text-[var(--tm-color-no)]">{market.error ?? "Fetch error"}</p>
      ) : market.status === "missing" ? (
        <p className="text-sm text-[var(--tm-color-warn)]">
          No Gamma event for this window yet. Waiting on Polymarket listing — not a mock price.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-[var(--tm-radius-sm)] border border-[rgba(34,197,94,0.25)] bg-[var(--tm-color-yes-bg)] p-3">
            <p className="text-[11px] uppercase tracking-wider text-[var(--tm-color-yes)]">
              Yes · {market.outcomes?.yes ?? "Up"}
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-[var(--tm-color-chrome-bright)]">
              {pct(market.prices?.yes ?? null)}
            </p>
          </div>
          <div className="rounded-[var(--tm-radius-sm)] border border-[rgba(239,68,68,0.25)] bg-[var(--tm-color-no-bg)] p-3">
            <p className="text-[11px] uppercase tracking-wider text-[var(--tm-color-no)]">
              No · {market.outcomes?.no ?? "Down"}
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-[var(--tm-color-chrome-bright)]">
              {pct(market.prices?.no ?? null)}
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 pt-1">
        <p className="text-[11px] text-[var(--tm-color-text-dim)]">
          Source: Gamma · {new Date(market.fetchedAt).toLocaleTimeString()}
        </p>
        <Link
          href={`/trade?slug=${encodeURIComponent(market.window.slug)}`}
          className="text-xs font-medium text-[var(--tm-color-blue-200)] hover:text-[var(--tm-color-blue-100)]"
        >
          Open ticket →
        </Link>
      </div>
    </GlassCard>
  );
}
