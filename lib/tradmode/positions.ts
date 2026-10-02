/**
 * Open demo positions + honest settlement against Gamma-resolved windows.
 * Never invents prices: settle only when Gamma reports closed + clear winner,
 * or void/refund when the window is closed without a clear resolution.
 */

import type { OutcomeSide, Btc15mMarketView } from "@/lib/polymarket/types";

export const POSITIONS_KEY = "tradmode.positions.v1";

export type PositionStatus = "open" | "settled" | "voided";

export interface OpenPosition {
  id: string;
  slug: string;
  side: OutcomeSide;
  /** Stake debited from wallet at ticket time. */
  sizeUsd: number;
  /** Gamma outcome price at entry; null if Gamma had no price (void-only path). */
  entryPrice: number | null;
  label: string;
  createdAt: string;
  status: PositionStatus;
  settledAt?: string;
  /** Credited back on settle/void (0 on total loss). */
  creditUsd?: number;
  note?: string;
}

export interface PositionsState {
  positions: OpenPosition[];
  updatedAt: string;
}

export function createEmptyPositions(): PositionsState {
  return { positions: [], updatedAt: new Date().toISOString() };
}

function uid(): string {
  return `pos_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function asFiniteNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function parsePositionsState(raw: unknown): PositionsState {
  const empty = createEmptyPositions();
  if (!raw || typeof raw !== "object") return empty;
  const o = raw as Record<string, unknown>;
  const list = Array.isArray(o.positions) ? o.positions : [];
  const positions: OpenPosition[] = [];
  for (const p of list.slice(0, 200)) {
    if (!p || typeof p !== "object") continue;
    const row = p as Record<string, unknown>;
    const sizeUsd = asFiniteNumber(row.sizeUsd, NaN);
    if (!Number.isFinite(sizeUsd) || sizeUsd <= 0) continue;
    if (typeof row.id !== "string" || typeof row.slug !== "string") continue;
    if (row.side !== "Yes" && row.side !== "No") continue;
    const status =
      row.status === "settled" || row.status === "voided" || row.status === "open"
        ? row.status
        : "open";
    const entryRaw = row.entryPrice;
    const entryPrice =
      entryRaw === null
        ? null
        : typeof entryRaw === "number" && Number.isFinite(entryRaw) && entryRaw > 0 && entryRaw <= 1
          ? entryRaw
          : null;
    positions.push({
      id: row.id,
      slug: row.slug,
      side: row.side,
      sizeUsd,
      entryPrice,
      label: typeof row.label === "string" ? row.label : row.slug,
      createdAt: typeof row.createdAt === "string" ? row.createdAt : new Date(0).toISOString(),
      status,
      settledAt: typeof row.settledAt === "string" ? row.settledAt : undefined,
      creditUsd:
        typeof row.creditUsd === "number" && Number.isFinite(row.creditUsd)
          ? row.creditUsd
          : undefined,
      note: typeof row.note === "string" ? row.note : undefined,
    });
  }
  return {
    positions,
    updatedAt: typeof o.updatedAt === "string" ? o.updatedAt : new Date().toISOString(),
  };
}

export function loadPositionsFromStorage(): PositionsState {
  if (typeof window === "undefined") return createEmptyPositions();
  try {
    const raw = window.localStorage.getItem(POSITIONS_KEY);
    if (!raw) return createEmptyPositions();
    return parsePositionsState(JSON.parse(raw) as unknown);
  } catch {
    return createEmptyPositions();
  }
}

export function savePositionsToStorage(state: PositionsState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(POSITIONS_KEY, JSON.stringify(state));
}

export function openPosition(
  state: PositionsState,
  input: {
    slug: string;
    side: OutcomeSide;
    sizeUsd: number;
    entryPrice: number | null;
    label: string;
  },
): PositionsState {
  const pos: OpenPosition = {
    id: uid(),
    slug: input.slug,
    side: input.side,
    sizeUsd: input.sizeUsd,
    entryPrice: input.entryPrice,
    label: input.label,
    createdAt: new Date().toISOString(),
    status: "open",
  };
  return {
    positions: [pos, ...state.positions].slice(0, 200),
    updatedAt: pos.createdAt,
  };
}

/** Clear winner from Gamma prices: one side ≥ 0.95 and the other ≤ 0.05. */
export function resolveWinnerFromPrices(
  prices: { yes: number | null; no: number | null } | null,
): OutcomeSide | null {
  if (!prices) return null;
  const y = prices.yes;
  const n = prices.no;
  if (y == null || n == null) return null;
  if (y >= 0.95 && n <= 0.05) return "Yes";
  if (n >= 0.95 && y <= 0.05) return "No";
  return null;
}

export type SettleOutcome =
  | {
      ok: true;
      kind: "win" | "loss" | "void";
      position: OpenPosition;
      creditUsd: number;
      realizedLossUsd: number;
      note: string;
    }
  | { ok: false; error: string };

/**
 * Settle one open position against a live Gamma market view.
 * - closed + clear winner → win credit (size/entry) or loss (0); requires entryPrice
 * - closed + no clear prices / no entry → void refund of stake (honest unwind, not PnL)
 * - still live → refuse
 */
export function settlePositionAgainstMarket(
  position: OpenPosition,
  market: Btc15mMarketView,
): SettleOutcome {
  if (position.status !== "open") {
    return { ok: false, error: "Position already settled or voided." };
  }
  if (market.window.slug !== position.slug) {
    return { ok: false, error: "Market slug does not match this position." };
  }
  if (market.status === "live" || market.status === "missing" || market.status === "error") {
    return {
      ok: false,
      error:
        market.status === "live"
          ? "Window still live — wait for Gamma to mark it closed."
          : `Cannot settle while market status is "${market.status}".`,
    };
  }

  // market.status === "closed"
  const winner = resolveWinnerFromPrices(market.prices);
  const now = new Date().toISOString();

  if (winner && position.entryPrice != null && position.entryPrice > 0) {
    const won = winner === position.side;
    // Binary: shares ≈ size/entry; winner pays $1/share from Gamma resolution (not invented).
    const creditUsd = won ? position.sizeUsd / position.entryPrice : 0;
    const realizedLossUsd = won ? 0 : position.sizeUsd;
    const settled: OpenPosition = {
      ...position,
      status: "settled",
      settledAt: now,
      creditUsd,
      note: won
        ? `Win: Gamma resolved ${winner}. Credited $${creditUsd.toFixed(2)} (stake/entry).`
        : `Loss: Gamma resolved ${winner}. Stake $${position.sizeUsd.toFixed(2)} stays debited.`,
    };
    return {
      ok: true,
      kind: won ? "win" : "loss",
      position: settled,
      creditUsd,
      realizedLossUsd,
      note: settled.note!,
    };
  }

  // Closed but no clear resolution or no entry price → void/refund stake (honest unwind).
  const creditUsd = position.sizeUsd;
  const voided: OpenPosition = {
    ...position,
    status: "voided",
    settledAt: now,
    creditUsd,
    note: winner
      ? "Void refund: no entry price recorded at ticket time — stake returned."
      : "Void refund: window closed without clear Gamma winner prices — stake returned.",
  };
  return {
    ok: true,
    kind: "void",
    position: voided,
    creditUsd,
    realizedLossUsd: 0,
    note: voided.note!,
  };
}

export function replacePosition(state: PositionsState, next: OpenPosition): PositionsState {
  return {
    positions: state.positions.map((p) => (p.id === next.id ? next : p)),
    updatedAt: new Date().toISOString(),
  };
}

export function openPositionsOnly(state: PositionsState): OpenPosition[] {
  return state.positions.filter((p) => p.status === "open");
}
