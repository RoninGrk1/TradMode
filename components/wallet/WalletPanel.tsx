"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { useTradMode } from "@/components/providers/TradModeProvider";
import { WALLET_POLICY } from "@/lib/wallet/policy";

export function WalletPanel() {
  const { wallet, hydrated, deposit, withdraw, openPositions } = useTradMode();
  const [amount, setAmount] = useState("100");
  const [msg, setMsg] = useState<string | null>(null);

  function onDeposit() {
    setMsg(null);
    const n = Number(amount);
    const res = deposit(n);
    if (!res.ok) {
      setMsg(res.error);
      return;
    }
    setMsg(`Deposited $${n.toFixed(2)}. Fee $0.`);
  }

  function onWithdraw() {
    setMsg(null);
    const n = Number(amount);
    const res = withdraw(n);
    if (!res.ok) {
      setMsg(res.error);
      return;
    }
    setMsg(`Withdrew $${n.toFixed(2)}. Fee $0.`);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <GlassCard className="lg:col-span-3 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-[var(--tm-color-chrome-bright)]">In-website wallet</h2>
          <Badge variant="blue">USD ledger</Badge>
        </div>
        <p className="text-3xl font-semibold tabular-nums text-[var(--tm-color-chrome-bright)]">
          ${wallet.balanceUsd.toFixed(2)}
        </p>
        <p className="text-sm text-[var(--tm-color-text-muted)]">{WALLET_POLICY.summary}</p>
        {openPositions.length > 0 ? (
          <p className="text-xs text-[var(--tm-color-warn)]">
            {openPositions.length} open demo position{openPositions.length === 1 ? "" : "s"} — settle on
            Trade after Gamma closes the window (credit path). Debits without settle leave funds locked in
            exposure.
          </p>
        ) : null}

        <label className="block space-y-1.5">
          <span className="text-xs uppercase tracking-wider text-[var(--tm-color-text-dim)]">Amount</span>
          <input
            type="number"
            min={0}
            step={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-[var(--tm-radius-sm)] border border-[var(--tm-color-border)] bg-[rgba(0,0,0,0.25)] px-3 py-2 text-[var(--tm-color-text)] outline-none focus:border-[var(--tm-color-focus)]"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="primary" disabled={!hydrated} onClick={onDeposit}>
            Deposit
          </Button>
          <Button type="button" variant="chrome" disabled={!hydrated} onClick={onWithdraw}>
            Withdraw
          </Button>
        </div>
        {msg ? <p className="text-sm text-[var(--tm-color-blue-200)]">{msg}</p> : null}

        <div className="grid grid-cols-2 gap-2 text-xs text-[var(--tm-color-text-dim)] sm:grid-cols-4">
          <div className="rounded-[var(--tm-radius-sm)] border border-[var(--tm-color-border)] p-2">
            Deposit fee: ${WALLET_POLICY.depositFeeUsd}
          </div>
          <div className="rounded-[var(--tm-radius-sm)] border border-[var(--tm-color-border)] p-2">
            Withdraw fee: ${WALLET_POLICY.withdrawFeeUsd}
          </div>
          <div className="rounded-[var(--tm-radius-sm)] border border-[var(--tm-color-border)] p-2">
            Min deposit: none
          </div>
          <div className="rounded-[var(--tm-radius-sm)] border border-[var(--tm-color-border)] p-2">
            Max withdraw: balance
          </div>
        </div>
      </GlassCard>

      <GlassCard className="lg:col-span-2 space-y-3">
        <h3 className="font-semibold text-[var(--tm-color-chrome-bright)]">Recent activity</h3>
        {wallet.transactions.length === 0 ? (
          <p className="text-sm text-[var(--tm-color-text-muted)]">No transactions yet.</p>
        ) : (
          <ul className="max-h-80 space-y-2 overflow-y-auto text-sm">
            {wallet.transactions.map((tx) => (
              <li
                key={tx.id}
                className="rounded-[var(--tm-radius-sm)] border border-[var(--tm-color-border)] p-2"
              >
                <div className="flex justify-between gap-2">
                  <span className="capitalize text-[var(--tm-color-chrome)]">{tx.type.replaceAll("_", " ")}</span>
                  <span className="tabular-nums text-[var(--tm-color-chrome-bright)]">
                    ${tx.amountUsd.toFixed(2)}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--tm-color-text-dim)]">{tx.note}</p>
                <p className="text-[11px] text-[var(--tm-color-text-dim)]">
                  Bal ${tx.balanceAfterUsd.toFixed(2)} · {new Date(tx.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
    </div>
  );
}
