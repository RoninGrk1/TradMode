export type WalletTxType = "deposit" | "withdraw" | "trade_debit" | "trade_credit" | "adjustment";

export interface WalletTransaction {
  id: string;
  type: WalletTxType;
  amountUsd: number;
  balanceAfterUsd: number;
  note: string;
  createdAt: string;
}

export interface WalletState {
  balanceUsd: number;
  currency: "USD";
  transactions: WalletTransaction[];
  updatedAt: string;
}
