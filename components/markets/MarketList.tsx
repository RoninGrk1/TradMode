import { MarketCard } from "./MarketCard";
import type { Btc15mMarketView } from "@/lib/polymarket/types";
import { GlassCard } from "@/components/ui/GlassCard";

export function MarketList({
  markets,
  gammaOk,
  fetchedAt,
}: {
  markets: Btc15mMarketView[];
  gammaOk: boolean;
  fetchedAt: string;
}) {
  return (
    <div className="space-y-4">
      {!gammaOk ? (
        <GlassCard>
          <p className="text-sm text-[var(--tm-color-warn)]">
            Gamma API did not return usable BTC 15m events for nearby windows. Showing honest empty/error
            states — no invented prices.
          </p>
          <p className="mt-1 text-xs text-[var(--tm-color-text-dim)]">Fetched {fetchedAt}</p>
        </GlassCard>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        {markets.map((m) => (
          <MarketCard key={m.window.slug} market={m} />
        ))}
      </div>
    </div>
  );
}
