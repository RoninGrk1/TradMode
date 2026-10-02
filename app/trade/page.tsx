import { AppShell } from "@/components/layout/AppShell";
import { TradeTicket } from "@/components/trade/TradeTicket";
import { buildWindow, floorToEt15mUnix } from "@/lib/polymarket/btc15m";
import { fetchBtc15mEvent, toMarketView } from "@/lib/polymarket/client";

export const dynamic = "force-dynamic";

export default async function TradePage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string }>;
}) {
  const params = await searchParams;
  const slug =
    params.slug ??
    `btc-updown-15m-${floorToEt15mUnix()}`;
  const windowUnix = Number(String(slug).replace(/^btc-updown-15m-/, ""));
  const window = Number.isFinite(windowUnix)
    ? buildWindow(windowUnix)
    : buildWindow(floorToEt15mUnix());

  const res = await fetchBtc15mEvent(slug);
  const market = res.ok
    ? toMarketView({ ...window, slug }, res.data ?? null)
    : toMarketView({ ...window, slug }, null, res.error);

  return (
    <AppShell
      title="Trade ticket"
      subtitle="Yes (Up / win side) and No (Down / lose side) with risk-tier caps, confirmation gates, and kill switch."
    >
      <TradeTicket initialMarket={market} initialSlug={slug} />
    </AppShell>
  );
}
