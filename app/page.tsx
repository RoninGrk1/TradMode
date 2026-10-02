import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { StatusStrip } from "@/components/dashboard/StatusStrip";
import { MarketList } from "@/components/markets/MarketList";
import { GlassCard } from "@/components/ui/GlassCard";
import { orchestratorSnapshot } from "@/lib/agents/orchestrator";
import { fetchNearbyBtc15mMarkets, fetchPublicBtcUsd } from "@/lib/polymarket/client";
import { RISK_TIERS, DEFAULT_TIER_ID } from "@/lib/risk/tiers";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [marketsBundle, btc] = await Promise.all([
    fetchNearbyBtc15mMarkets(1, 2),
    fetchPublicBtcUsd(),
  ]);
  const snap = orchestratorSnapshot();
  const liveWindows = marketsBundle.markets.filter((m) => m.status === "live").length;

  return (
    <AppShell
      title="Dashboard"
      subtitle="Live Polymarket BTC 15-minute windows, risk rails, wallet, and the 23-agent roster."
    >
      <div className="space-y-6">
        <StatusStrip
          btcUsd={btc.ok ? (btc.data ?? null) : null}
          btcError={btc.ok ? undefined : btc.error}
          liveWindows={liveWindows}
          killSwitch={false}
          tierName={RISK_TIERS[DEFAULT_TIER_ID].name}
          walletBalance={0}
          agentNote={snap.note}
        />

        <div className="flex flex-wrap gap-2">
          <Link
            href="/markets"
            className="inline-flex items-center rounded-[var(--tm-radius-sm)] bg-[var(--tm-color-blue-500)] px-3.5 py-2 text-sm font-medium text-white shadow-[var(--tm-shadow-glow)] hover:bg-[var(--tm-color-blue-400)]"
          >
            Browse markets
          </Link>
          <Link
            href="/trade"
            className="inline-flex items-center rounded-[var(--tm-radius-sm)] border border-[var(--tm-color-chrome-edge)] bg-[rgba(200,212,232,0.12)] px-3.5 py-2 text-sm font-medium text-[var(--tm-color-chrome-bright)] hover:bg-[rgba(200,212,232,0.2)]"
          >
            Open trade ticket
          </Link>
          <Link
            href="/wallet"
            className="inline-flex items-center rounded-[var(--tm-radius-sm)] px-3.5 py-2 text-sm font-medium text-[var(--tm-color-text-muted)] hover:bg-[rgba(255,255,255,0.04)] hover:text-[var(--tm-color-text)]"
          >
            Fund wallet
          </Link>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-[var(--tm-color-chrome-bright)]">
            Nearby BTC 15m markets
          </h2>
          <MarketList
            markets={marketsBundle.markets}
            gammaOk={marketsBundle.gammaOk}
            fetchedAt={marketsBundle.fetchedAt}
          />
        </section>

        <GlassCard>
          <h2 className="font-semibold text-[var(--tm-color-chrome-bright)]">First-run checklist</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-[var(--tm-color-text-muted)]">
            <li>Deposit into the in-app wallet (no fees, no minimum).</li>
            <li>Pick Conservative / Balanced / Aggressive on Risk.</li>
            <li>Trade Yes (Up) or No (Down) on a live BTC 15m window.</li>
            <li>Optional: set GROK_API_KEY / POLYMARKET_PRIVATE_KEY for live agent/CLOB paths.</li>
          </ol>
        </GlassCard>
      </div>
    </AppShell>
  );
}
