import { AppShell } from "@/components/layout/AppShell";
import { MarketList } from "@/components/markets/MarketList";
import { fetchNearbyBtc15mMarkets } from "@/lib/polymarket/client";

export const dynamic = "force-dynamic";

export default async function MarketsPage() {
  const bundle = await fetchNearbyBtc15mMarkets(2, 4);

  return (
    <AppShell
      title="BTC 15-minute markets"
      subtitle="Polymarket incremental Up/Down windows (mapped to Yes/No). Live Gamma data only — empty states when a window is not listed yet."
    >
      <MarketList markets={bundle.markets} gammaOk={bundle.gammaOk} fetchedAt={bundle.fetchedAt} />
    </AppShell>
  );
}
