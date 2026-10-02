"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { useTradMode } from "@/components/providers/TradModeProvider";
import { checkTradeRails, effectiveOrdersInLastMinute } from "@/lib/risk/rails";
import { getTier } from "@/lib/risk/tiers";
import type { RiskTierId } from "@/lib/risk/types";
import type { Btc15mMarketView, OutcomeSide } from "@/lib/polymarket/types";

const POLL_MS = 15_000;

export function TradeTicket({
  initialMarket,
  initialSlug,
}: {
  initialMarket: Btc15mMarketView | null;
  initialSlug?: string;
}) {
  const {
    wallet,
    rails,
    hydrated,
    openPositions,
    setTier,
    toggleKillSwitch,
    recordTradeIntent,
    settlePosition,
  } = useTradMode();

  const [market, setMarket] = useState<Btc15mMarketView | null>(initialMarket);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [side, setSide] = useState<OutcomeSide>("Yes");
  const [size, setSize] = useState("10");
  const [confirmed, setConfirmed] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [settlingId, setSettlingId] = useState<string | null>(null);
  const submitLock = useRef(false);
  const slug = market?.window.slug ?? initialSlug;

  const refreshMarket = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!slug) return;
      if (!opts?.silent) setLoading(true);
      else setRefreshing(true);
      try {
        const res = await fetch(`/api/markets/btc-15m?slug=${encodeURIComponent(slug)}`, {
          cache: "no-store",
        });
        const json = (await res.json()) as { market?: Btc15mMarketView };
        if (json.market) setMarket(json.market);
      } finally {
        if (!opts?.silent) setLoading(false);
        else setRefreshing(false);
      }
    },
    [slug],
  );

  // Initial client fetch when SSR had no market, plus periodic Gamma refresh even when SSR set.
  useEffect(() => {
    if (!slug) return;
    let cancelled = false;

    (async () => {
      if (!initialMarket) {
        if (!cancelled) await refreshMarket();
      }
    })();

    const id = window.setInterval(() => {
      if (!cancelled) void refreshMarket({ silent: true });
    }, POLL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [slug, initialMarket, refreshMarket]);

  const sizeUsd = Number(size);
  const tier = getTier(rails.tierId);
  const ordersInWindow = effectiveOrdersInLastMinute(rails);
  const check = useMemo(
    () =>
      checkTradeRails(rails, {
        side,
        sizeUsd: Number.isFinite(sizeUsd) ? sizeUsd : 0,
        walletBalanceUsd: wallet.balanceUsd,
        confirmed,
      }),
    [rails, side, sizeUsd, wallet.balanceUsd, confirmed],
  );

  const marketTradable = market?.status === "live";
  const entryPrice =
    side === "Yes" ? (market?.prices?.yes ?? null) : (market?.prices?.no ?? null);

  const positionsForSlug = openPositions.filter((p) => !slug || p.slug === slug);
  const otherOpen = openPositions.filter((p) => slug && p.slug !== slug);

  function submitIntent() {
    if (submitLock.current || submitting) return;
    setMessage(null);

    if (!marketTradable || !market) {
      setMessage(
        market
          ? `Market status is "${market.status}" — only live windows accept tickets.`
          : "No market loaded — cannot submit.",
      );
      return;
    }

    const result = checkTradeRails(rails, {
      side,
      sizeUsd,
      walletBalanceUsd: wallet.balanceUsd,
      confirmed,
    });
    if (!result.allowed) {
      setMessage(result.message);
      return;
    }

    submitLock.current = true;
    setSubmitting(true);

    try {
      const note = `Intent recorded (scaffold — not a live CLOB order): ${side} $${sizeUsd.toFixed(2)} on ${market.window.slug}`;
      const res = recordTradeIntent({
        side,
        sizeUsd,
        slug: market.window.slug,
        label: market.window.label,
        entryPrice,
        note,
      });
      if (!res.ok) {
        setMessage(res.error);
        return;
      }
      setConfirmed(false);
      setMessage(
        `Ticket accepted under ${tier.name} rails. Open position ${res.position.id} — settle after Gamma marks the window closed (win/loss from resolved prices, or void refund). Live CLOB needs POLYMARKET_PRIVATE_KEY.`,
      );
    } finally {
      submitLock.current = false;
      setSubmitting(false);
    }
  }

  async function onSettle(positionId: string, positionSlug: string) {
    setMessage(null);
    setSettlingId(positionId);
    try {
      const res = await fetch(`/api/markets/btc-15m?slug=${encodeURIComponent(positionSlug)}`, {
        cache: "no-store",
      });
      const json = (await res.json()) as { market?: Btc15mMarketView; error?: string };
      if (!json.market) {
        setMessage(json.error ?? "Could not load market for settlement.");
        return;
      }
      if (positionSlug === slug) setMarket(json.market);
      const settled = settlePosition(positionId, json.market);
      if (!settled.ok) {
        setMessage(settled.error);
        return;
      }
      setMessage(settled.note);
    } finally {
      setSettlingId(null);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <GlassCard className="lg:col-span-3 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-[var(--tm-color-chrome-bright)]">Trade ticket</h2>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="blue">Yes = Up · No = Down</Badge>
            {refreshing ? (
              <span className="text-[10px] uppercase tracking-wider text-[var(--tm-color-text-dim)]">
                Refreshing…
              </span>
            ) : market?.fetchedAt ? (
              <span className="text-[10px] text-[var(--tm-color-text-dim)]">
                Gamma {new Date(market.fetchedAt).toLocaleTimeString()}
              </span>
            ) : null}
          </div>
        </div>

        {loading && !market ? (
          <p className="text-sm text-[var(--tm-color-text-muted)]">Loading market from Gamma…</p>
        ) : market ? (
          <div className="space-y-2">
            <p className="text-sm text-[var(--tm-color-text-muted)]">{market.window.label}</p>
            <p className="font-mono text-xs text-[var(--tm-color-text-dim)]">{market.window.slug}</p>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSide("Yes")}
                className={`rounded-[var(--tm-radius-sm)] border p-3 text-left transition ${
                  side === "Yes"
                    ? "border-[rgba(34,197,94,0.5)] bg-[var(--tm-color-yes-bg)]"
                    : "border-[var(--tm-color-border)]"
                }`}
              >
                <p className="text-xs text-[var(--tm-color-yes)]">Yes · {market.outcomes?.yes ?? "Up"}</p>
                <p className="text-lg font-semibold tabular-nums">
                  {market.prices?.yes != null ? `${(market.prices.yes * 100).toFixed(1)}¢` : "—"}
                </p>
              </button>
              <button
                type="button"
                onClick={() => setSide("No")}
                className={`rounded-[var(--tm-radius-sm)] border p-3 text-left transition ${
                  side === "No"
                    ? "border-[rgba(239,68,68,0.5)] bg-[var(--tm-color-no-bg)]"
                    : "border-[var(--tm-color-border)]"
                }`}
              >
                <p className="text-xs text-[var(--tm-color-no)]">No · {market.outcomes?.no ?? "Down"}</p>
                <p className="text-lg font-semibold tabular-nums">
                  {market.prices?.no != null ? `${(market.prices.no * 100).toFixed(1)}¢` : "—"}
                </p>
              </button>
            </div>
            {market.prices == null ? (
              <p className="text-xs text-[var(--tm-color-warn)]">
                No live outcome prices from Gamma for this window.
              </p>
            ) : null}
            {!marketTradable ? (
              <p className="text-xs text-[var(--tm-color-warn)]">
                Status “{market.status}” — submit is disabled until Gamma reports live.
              </p>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-[var(--tm-color-warn)]">
            No market loaded. Open from Markets or pass ?slug=btc-updown-15m-…
          </p>
        )}

        <label className="block space-y-1.5">
          <span className="text-xs uppercase tracking-wider text-[var(--tm-color-text-dim)]">Size (USD)</span>
          <input
            type="number"
            min={0}
            step={1}
            value={size}
            onChange={(e) => {
              setSize(e.target.value);
              setConfirmed(false);
            }}
            className="w-full rounded-[var(--tm-radius-sm)] border border-[var(--tm-color-border)] bg-[rgba(0,0,0,0.25)] px-3 py-2 text-[var(--tm-color-text)] outline-none focus:border-[var(--tm-color-focus)]"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          {(["conservative", "balanced", "aggressive"] as RiskTierId[]).map((id) => (
            <Button
              key={id}
              type="button"
              variant={rails.tierId === id ? "primary" : "chrome"}
              onClick={() => setTier(id)}
            >
              {getTier(id).name}
            </Button>
          ))}
        </div>

        {check.requiresConfirmation || check.code === "needs_confirmation" ? (
          <label className="flex items-center gap-2 text-sm text-[var(--tm-color-text-muted)]">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="accent-[var(--tm-color-blue-400)]"
            />
            I confirm this order (≥ ${tier.confirmAboveUsd} gate)
          </label>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={side === "Yes" ? "yes" : "no"}
            disabled={!hydrated || submitting || !marketTradable || !check.allowed}
            onClick={submitIntent}
          >
            {submitting ? "Submitting…" : `Submit ${side} intent`}
          </Button>
          <Button type="button" variant="danger" onClick={toggleKillSwitch}>
            {rails.killSwitch ? "Disarm kill switch" : "Arm kill switch"}
          </Button>
          <Button type="button" variant="chrome" onClick={() => void refreshMarket()}>
            Refresh prices
          </Button>
        </div>

        {!check.allowed ? (
          <p className="text-sm text-[var(--tm-color-warn)]">{check.message}</p>
        ) : (
          <p className="text-sm text-[var(--tm-color-yes)]">{check.message}</p>
        )}
        {message ? <p className="text-sm text-[var(--tm-color-blue-200)]">{message}</p> : null}
        <p className="text-[11px] text-[var(--tm-color-text-dim)]">
          Order path: document-only CLOB at clob.polymarket.com. Debits open a demo position; settle credits
          only from Gamma-resolved winner prices (or void-refunds stake if unclear). No invented fills.
        </p>
      </GlassCard>

      <div className="lg:col-span-2 space-y-4">
        <GlassCard className="space-y-3">
          <h3 className="font-semibold text-[var(--tm-color-chrome-bright)]">Rails snapshot</h3>
          <ul className="space-y-2 text-sm text-[var(--tm-color-text-muted)]">
            <li>Tier: {tier.name}</li>
            <li>Max order: ${tier.maxOrderUsd}</li>
            <li>Max position: ${tier.maxPositionUsd}</li>
            <li>Max daily loss: ${tier.maxDailyLossUsd}</li>
            <li>
              Rate: {tier.rateLimitPerMinute}/min (used {ordersInWindow} in window)
            </li>
            <li>Open exposure: ${rails.openExposureUsd.toFixed(2)}</li>
            <li>Daily loss: ${rails.dailyLossUsd.toFixed(2)}</li>
            <li>Wallet: ${wallet.balanceUsd.toFixed(2)}</li>
            <li>Kill switch: {rails.killSwitch ? "ON" : "OFF"}</li>
          </ul>
          {market?.clobTokenIds ? (
            <div className="rounded-[var(--tm-radius-sm)] border border-[var(--tm-color-border)] p-2 font-mono text-[10px] text-[var(--tm-color-text-dim)] break-all">
              <p>CLOB Yes token: {market.clobTokenIds.yes ?? "—"}</p>
              <p className="mt-1">CLOB No token: {market.clobTokenIds.no ?? "—"}</p>
            </div>
          ) : null}
        </GlassCard>

        <GlassCard className="space-y-3">
          <h3 className="font-semibold text-[var(--tm-color-chrome-bright)]">Open positions</h3>
          <p className="text-[11px] text-[var(--tm-color-text-dim)]">
            Demo settlement: Gamma must report <strong>closed</strong>. Clear winner (≥95¢ / ≤5¢) pays
            stake÷entry; otherwise void refunds the stake. Exposure and daily loss update on settle.
          </p>
          {openPositions.length === 0 ? (
            <p className="text-sm text-[var(--tm-color-text-muted)]">No open positions.</p>
          ) : (
            <ul className="max-h-72 space-y-2 overflow-y-auto text-sm">
              {[...positionsForSlug, ...otherOpen].map((p) => (
                <li
                  key={p.id}
                  className="rounded-[var(--tm-radius-sm)] border border-[var(--tm-color-border)] p-2 space-y-1"
                >
                  <div className="flex justify-between gap-2">
                    <span className="text-[var(--tm-color-chrome)]">
                      {p.side} · ${p.sizeUsd.toFixed(2)}
                    </span>
                    <span className="tabular-nums text-[var(--tm-color-text-dim)]">
                      @{p.entryPrice != null ? `${(p.entryPrice * 100).toFixed(1)}¢` : "n/a"}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--tm-color-text-dim)]">{p.label}</p>
                  <p className="font-mono text-[10px] text-[var(--tm-color-text-dim)]">{p.slug}</p>
                  <Button
                    type="button"
                    variant="chrome"
                    disabled={settlingId === p.id}
                    onClick={() => void onSettle(p.id, p.slug)}
                  >
                    {settlingId === p.id ? "Settling…" : "Settle if resolved"}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
