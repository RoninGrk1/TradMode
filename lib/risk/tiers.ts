import type { RiskTier, RiskTierId } from "./types";

export const RISK_TIERS: Record<RiskTierId, RiskTier> = {
  conservative: {
    id: "conservative",
    name: "Conservative",
    description: "Tight caps for capital preservation. Small tickets, low rate, early confirmation.",
    maxOrderUsd: 25,
    maxPositionUsd: 100,
    maxDailyLossUsd: 40,
    rateLimitPerMinute: 4,
    confirmAboveUsd: 10,
    maxBalanceFraction: 0.1,
  },
  balanced: {
    id: "balanced",
    name: "Balanced",
    description: "Default rails for active BTC 15m trading with sensible position limits.",
    maxOrderUsd: 100,
    maxPositionUsd: 400,
    maxDailyLossUsd: 150,
    rateLimitPerMinute: 10,
    confirmAboveUsd: 40,
    maxBalanceFraction: 0.25,
  },
  aggressive: {
    id: "aggressive",
    name: "Aggressive",
    description: "Higher caps for experienced operators. Kill switch and max-loss still enforce.",
    maxOrderUsd: 500,
    maxPositionUsd: 2000,
    maxDailyLossUsd: 750,
    rateLimitPerMinute: 20,
    confirmAboveUsd: 100,
    maxBalanceFraction: 0.5,
  },
};

export const DEFAULT_TIER_ID: RiskTierId = "balanced";

/** Always returns a defined tier — unknown ids fall back to default (avoids UI crashes from bad storage). */
export function getTier(id: RiskTierId | string | null | undefined): RiskTier {
  if (id && id in RISK_TIERS) return RISK_TIERS[id as RiskTierId];
  return RISK_TIERS[DEFAULT_TIER_ID];
}
