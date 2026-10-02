import { WALLET_POLICY } from "./policy";
import type { WalletState, WalletTransaction, WalletTxType } from "./types";

const STORAGE_KEY = "tradmode.wallet.v1";

export function createEmptyWallet(startingBalance = 0): WalletState {
  const now = new Date().toISOString();
  return {
    balanceUsd: startingBalance,
    currency: "USD",
    transactions: [],
    updatedAt: now,
  };
}

function uid(): string {
  return `tx_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function asFiniteNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/** Sanitize wallet JSON from storage — rejects NaN/non-object shapes that would crash UI. */
export function parseWalletState(raw: unknown): WalletState | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const balanceUsd = asFiniteNumber(o.balanceUsd, NaN);
  if (!Number.isFinite(balanceUsd) || balanceUsd < 0) return null;
  const txsRaw = Array.isArray(o.transactions) ? o.transactions : [];
  const transactions: WalletTransaction[] = [];
  for (const t of txsRaw.slice(0, 100)) {
    if (!t || typeof t !== "object") continue;
    const tx = t as Record<string, unknown>;
    const amountUsd = asFiniteNumber(tx.amountUsd, NaN);
    const balanceAfterUsd = asFiniteNumber(tx.balanceAfterUsd, NaN);
    if (!Number.isFinite(amountUsd) || !Number.isFinite(balanceAfterUsd)) continue;
    if (typeof tx.id !== "string" || typeof tx.type !== "string") continue;
    transactions.push({
      id: tx.id,
      type: tx.type as WalletTransaction["type"],
      amountUsd,
      balanceAfterUsd,
      note: typeof tx.note === "string" ? tx.note : "",
      createdAt: typeof tx.createdAt === "string" ? tx.createdAt : new Date(0).toISOString(),
    });
  }
  return {
    balanceUsd,
    currency: "USD",
    transactions,
    updatedAt: typeof o.updatedAt === "string" ? o.updatedAt : new Date().toISOString(),
  };
}

export function applyTx(
  state: WalletState,
  type: WalletTxType,
  amountUsd: number,
  note: string,
): { ok: true; state: WalletState } | { ok: false; error: string } {
  if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
    return { ok: false, error: "Amount must be a positive number." };
  }

  let nextBalance = state.balanceUsd;
  if (type === "deposit" || type === "trade_credit" || type === "adjustment") {
    nextBalance = state.balanceUsd + amountUsd;
  } else if (type === "withdraw" || type === "trade_debit") {
    if (amountUsd > state.balanceUsd) {
      return { ok: false, error: "Insufficient balance." };
    }
    // Policy: no max withdrawal beyond available balance; no fee.
    void WALLET_POLICY;
    nextBalance = state.balanceUsd - amountUsd;
  }

  const tx: WalletTransaction = {
    id: uid(),
    type,
    amountUsd,
    balanceAfterUsd: nextBalance,
    note,
    createdAt: new Date().toISOString(),
  };

  return {
    ok: true,
    state: {
      ...state,
      balanceUsd: nextBalance,
      transactions: [tx, ...state.transactions].slice(0, 100),
      updatedAt: tx.createdAt,
    },
  };
}

export function loadWalletFromStorage(): WalletState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return parseWalletState(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

export function saveWalletToStorage(state: WalletState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export { STORAGE_KEY };
