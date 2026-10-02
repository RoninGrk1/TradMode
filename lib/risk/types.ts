export type RiskTierId = "conservative" | "balanced" | "aggressive";

export interface RiskTier {
  id: RiskTierId;
  name: string;
  description: string;
  /** Max notional per single order (USD). */
  maxOrderUsd: number;
  /** Max open exposure across Yes+No (USD). */
  maxPositionUsd: number;
  /** Max daily realized + unrealized loss before auto-halt (USD). */
  maxDailyLossUsd: number;
  /** Max orders per rolling minute. */
  rateLimitPerMinute: number;
  /** Require explicit confirmation above this size. */
  confirmAboveUsd: number;
  /** Suggested max share of wallet balance per trade (0–1). */
  maxBalanceFraction: number;
}

export interface RiskRailsState {
  tierId: RiskTierId;
  killSwitch: boolean;
  dailyLossUsd: number;
  openExposureUsd: number;
  ordersInLastMinute: number;
  lastOrderAt: string | null;
}

export type RailCheckCode =
  | "ok"
  | "kill_switch"
  | "order_too_large"
  | "position_cap"
  | "max_loss"
  | "rate_limit"
  | "needs_confirmation"
  | "insufficient_balance"
  | "invalid_size";

export interface RailCheckResult {
  allowed: boolean;
  code: RailCheckCode;
  message: string;
  requiresConfirmation: boolean;
}
