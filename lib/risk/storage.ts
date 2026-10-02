import { defaultRailsState } from "./rails";
import { DEFAULT_TIER_ID, RISK_TIERS } from "./tiers";
import type { RiskRailsState, RiskTierId } from "./types";

export const RAILS_KEY = "tradmode.rails.v1";

const TIER_IDS = new Set<string>(Object.keys(RISK_TIERS));

function asFiniteNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/** Parse + sanitize rails from localStorage (never throws; never returns invalid tierId). */
export function parseRailsState(raw: unknown): RiskRailsState {
  const base = defaultRailsState(DEFAULT_TIER_ID);
  if (!raw || typeof raw !== "object") return base;
  const o = raw as Record<string, unknown>;
  const tierId = TIER_IDS.has(String(o.tierId)) ? (o.tierId as RiskTierId) : DEFAULT_TIER_ID;
  return {
    tierId,
    killSwitch: Boolean(o.killSwitch),
    dailyLossUsd: Math.max(0, asFiniteNumber(o.dailyLossUsd, 0)),
    openExposureUsd: Math.max(0, asFiniteNumber(o.openExposureUsd, 0)),
    ordersInLastMinute: Math.max(0, Math.floor(asFiniteNumber(o.ordersInLastMinute, 0))),
    lastOrderAt:
      typeof o.lastOrderAt === "string" && !Number.isNaN(Date.parse(o.lastOrderAt))
        ? o.lastOrderAt
        : null,
  };
}

export function loadRailsFromStorage(): RiskRailsState {
  if (typeof window === "undefined") return defaultRailsState(DEFAULT_TIER_ID);
  try {
    const raw = localStorage.getItem(RAILS_KEY);
    if (!raw) return defaultRailsState(DEFAULT_TIER_ID);
    return parseRailsState(JSON.parse(raw) as unknown);
  } catch {
    return defaultRailsState(DEFAULT_TIER_ID);
  }
}

export function saveRailsToStorage(state: RiskRailsState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(RAILS_KEY, JSON.stringify(state));
}
