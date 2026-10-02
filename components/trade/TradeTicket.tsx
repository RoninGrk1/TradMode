"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { bumpOrderCounters, checkTradeRails, defaultRailsState, effectiveOrdersInLastMinute } from "@/lib/risk/rails";
import { loadRailsFromStorage, saveRailsToStorage } from "@/lib/risk/storage";
import { DEFAULT_TIER_ID, getTier } from "@/lib/risk/tiers";
import type { RiskRailsState, RiskTierId } from "@/lib/risk/types";
import type { Btc15mMarketView, OutcomeSide } from "@/lib/polymarket/types";
import {
  applyTx,
  createEmptyWallet,
  loadWalletFromStorage,
  saveWalletToStorage,
} from "@/lib/wallet/store";
import type { WalletState } from "@/lib/wallet/types";

export function TradeTicket({
  initialMarket,
  initialSlug,
}: {
  initialMarket: Btc15mMarketView | null;
  initialSlug?: string;
}) {
  const [market, setMarket] = useState<Btc15mMarketView | null>(initialMarket);
  const [loading, setLoading] = useState(false);
  const [side, setSide] = useState<OutcomeSide>("Yes");
  const [size, setSize] = useState("10");
  const [confirmed, setConfirmed] = useState(false);
  const [wallet, setWallet] = useState<WalletState>(createEmptyWallet(0));
  const [rails, setRails] = useState<RiskRailsState>(defaultRailsState(DEFAULT_TIER_ID));
  const [message, setMessage] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submitLock = useRef(false);

  useEffect(() => {
    const w = loadWalletFromStorage() ?? createEmptyWallet(0);
    setWallet(w);
    setRails(loadRailsFromStorage());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!initialSlug || initialMarket) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/markets/btc-15m?slug=${encodeURIComponent(initialSlug)}`);
        const json = await res.json();
        if (!cancelled && json.market) setMarket(json.market as Btc15mMarketView);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialSlug, initialMarket]);

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

  function onTier(id: RiskTierId) {
    const next = { ...rails, tierId: id };
    setRails(next);
    saveRailsToStorage(next);
  }

  function submitIntent() {
    if (submitLock.current || submitting) return;
    setMessage(null);

    if (!marketTradable) {
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
      // Scaffold: debit wallet locally; CLOB live orders require POLYMARKET_PRIVATE_KEY.
      const hasClobKey = false; // client cannot read server secrets; document in UI
      const note = hasClobKey
        ? `CLOB ${side} on ${market?.window.slug ?? "unknown"}`
        : `Intent recorded (scaffold — not a live CLOB order): ${side} $${sizeUsd.toFixed(2)} on ${market?.window.slug ?? "n/a"}`;

      const debited = applyTx(wallet, "trade_debit", sizeUsd, note);
      if (!debited.ok) {
        setMessage(debited.error);
        return;
      }
      setWallet(debited.state);
      saveWalletToStorage(debited.state);

      const nextRails = bumpOrderCounters(rails, sizeUsd);
      setRails(nextRails);
      saveRailsToStorage(nextRails);
      setConfirmed(false);
      setMessage(
        `Ticket accepted under ${tier.name} rails. Live CLOB submission needs POLYMARKET_PRIVATE_KEY — this debit is the in-app wallet ledger only.`,
      );
    } finally {
      submitLock.current = false;
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <GlassCard className="lg:col-span-3 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-[var(--tm-color-chrome-bright)]">Trade ticket</h2>
          <Badge variant="blue">Yes = Up · No = Down</Badge>
        </div>

        {loading ? (
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
              onClick={() => onTier(id)}
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
          <Button
            type="button"
            variant="danger"
            onClick={() => {
              const next = { ...rails, killSwitch: !rails.killSwitch };
              setRails(next);
              saveRailsToStorage(next);
            }}
          >
            {rails.killSwitch ? "Disarm kill switch" : "Arm kill switch"}
          </Button>
        </div>

        {!check.allowed ? (
          <p className="text-sm text-[var(--tm-color-warn)]">{check.message}</p>
        ) : (
          <p className="text-sm text-[var(--tm-color-yes)]">{check.message}</p>
        )}
        {message ? <p className="text-sm text-[var(--tm-color-blue-200)]">{message}</p> : null}
        <p className="text-[11px] text-[var(--tm-color-text-dim)]">
          Order path: document-only CLOB at clob.polymarket.com. This UI records safeguarded intents against
          the in-app wallet; it does not fabricate fills or prices.
        </p>
      </GlassCard>

      <GlassCard className="lg:col-span-2 space-y-3">
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
    </div>
  );
}
