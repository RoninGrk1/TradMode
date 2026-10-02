/**
 * In-website wallet product policy (documented + enforced in UI model).
 * - No fees on deposit or withdrawal
 * - No minimum deposit
 * - No maximum withdrawal (up to available balance)
 * - Balance is an app-local ledger for TradeMode UX (not a custodial bank)
 */

export const WALLET_POLICY = {
  depositFeeUsd: 0,
  withdrawFeeUsd: 0,
  minDepositUsd: 0,
  maxDepositUsd: null as number | null, // unrestricted in product policy
  minWithdrawUsd: 0,
  maxWithdrawUsd: null as number | null, // unrestricted except available balance
  currency: "USD" as const,
  summary:
    "No fees. No minimum deposit. No maximum withdrawal (up to your available balance). TradeMode wallet is an in-app ledger for terminal UX.",
} as const;
