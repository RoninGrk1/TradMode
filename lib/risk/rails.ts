import { getTier } from "./tiers";
import type { RailCheckResult, RiskRailsState, RiskTierId } from "./types";

export function defaultRailsState(tierId: RiskTierId = "balanced"): RiskRailsState {
  return {
    tierId,
    killSwitch: false,
    dailyLossUsd: 0,
    openExposureUsd: 0,
    ordersInLastMinute: 0,
    lastOrderAt: null,
  };
}

export interface ProposedTrade {
  side: "Yes" | "No";
  sizeUsd: number;
  walletBalanceUsd: number;
  confirmed?: boolean;
}

/**
 * Evaluate safeguarding rails before any order path (CLOB or demo).
 * Does not place orders — pure policy check.
 */
export function checkTradeRails(state: RiskRailsState, trade: ProposedTrade): RailCheckResult {
  const tier = getTier(state.tierId);

  if (state.killSwitch) {
    return {
      allowed: false,
      code: "kill_switch",
      message: "Kill switch is ON. All trading halted until you disarm it.",
      requiresConfirmation: false,
    };
  }

  if (!Number.isFinite(trade.sizeUsd) || trade.sizeUsd <= 0) {
    return {
      allowed: false,
      code: "invalid_size",
      message: "Order size must be a positive number.",
      requiresConfirmation: false,
    };
  }

  if (trade.sizeUsd > trade.walletBalanceUsd) {
    return {
      allowed: false,
      code: "insufficient_balance",
      message: `Insufficient wallet balance ($${trade.walletBalanceUsd.toFixed(2)}).`,
      requiresConfirmation: false,
    };
  }

  if (trade.sizeUsd > tier.maxOrderUsd) {
    return {
      allowed: false,
      code: "order_too_large",
      message: `${tier.name}: max order is $${tier.maxOrderUsd}.`,
      requiresConfirmation: false,
    };
  }

  const balanceCap = trade.walletBalanceUsd * tier.maxBalanceFraction;
  if (trade.sizeUsd > balanceCap + 1e-9) {
    return {
      allowed: false,
      code: "order_too_large",
      message: `${tier.name}: max ${Math.round(tier.maxBalanceFraction * 100)}% of balance per trade ($${balanceCap.toFixed(2)}).`,
      requiresConfirmation: false,
    };
  }

  if (state.openExposureUsd + trade.sizeUsd > tier.maxPositionUsd) {
    return {
      allowed: false,
      code: "position_cap",
      message: `${tier.name}: position cap $${tier.maxPositionUsd} (open $${state.openExposureUsd.toFixed(2)}).`,
      requiresConfirmation: false,
    };
  }

  if (state.dailyLossUsd >= tier.maxDailyLossUsd) {
    return {
      allowed: false,
      code: "max_loss",
      message: `${tier.name}: daily max loss $${tier.maxDailyLossUsd} reached.`,
      requiresConfirmation: false,
    };
  }

  if (state.ordersInLastMinute >= tier.rateLimitPerMinute) {
    return {
      allowed: false,
      code: "rate_limit",
      message: `${tier.name}: rate limit ${tier.rateLimitPerMinute}/min hit. Slow down.`,
      requiresConfirmation: false,
    };
  }

  const needsConfirm = trade.sizeUsd >= tier.confirmAboveUsd && !trade.confirmed;
  if (needsConfirm) {
    return {
      allowed: false,
      code: "needs_confirmation",
      message: `${tier.name}: confirm orders ≥ $${tier.confirmAboveUsd}.`,
      requiresConfirmation: true,
    };
  }

  return {
    allowed: true,
    code: "ok",
    message: "Rails clear.",
    requiresConfirmation: false,
  };
}
