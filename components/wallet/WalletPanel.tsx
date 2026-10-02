"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { WALLET_POLICY } from "@/lib/wallet/policy";
import {
  applyTx,
  createEmptyWallet,
  loadWalletFromStorage,
  saveWalletToStorage,
} from "@/lib/wallet/store";
import type { WalletState } from "@/lib/wallet/types";

export function WalletPanel() {
  const [wallet, setWallet] = useState<WalletState>(createEmptyWallet(0));
  const [amount, setAmount] = useState("100");
  const [msg, setMsg] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setWallet(loadWalletFromStorage() ?? createEmptyWallet(0));
    setHydrated(true);
  }, []);

  function persist(next: WalletState) {
    setWallet(next);
    saveWalletToStorage(next);
  }

  function deposit() {
    setMsg(null);
    const n = Number(amount);
    const res = applyTx(wallet, "deposit", n, "Deposit (no fee, no minimum)");
    if (!res.ok) {
      setMsg(res.error);
      return;
    }
    persist(res.state);
    setMsg(`Deposited $${n.toFixed(2)}. Fee $0.`);
  }

  function withdraw() {
    setMsg(null);
    const n = Number(amount);
    const res = applyTx(wallet, "withdraw", n, "Withdrawal (no fee, no max beyond balance)");
    if (!res.ok) {
      setMsg(res.error);
      return;
    }
    persist(res.state);
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
          <Button type="button" variant="primary" disabled={!hydrated} onClick={deposit}>
            Deposit
          </Button>
          <Button type="button" variant="chrome" disabled={!hydrated} onClick={withdraw}>
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
                  <span className="capitalize text-[var(--tm-color-chrome)]">{tx.type.replace("_", " ")}</span>
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
