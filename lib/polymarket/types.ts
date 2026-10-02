/** Polymarket Gamma / CLOB shared types (subset used by TradMode). */

export type OutcomeSide = "Yes" | "No";

/** Polymarket BTC up/down markets use Up/Down; we map Yes↔Up, No↔Down. */
export type PolymarketUpDown = "Up" | "Down";

export interface GammaMarket {
  id: string;
  question: string;
  conditionId: string;
  slug: string;
  outcomes: string; // JSON string array from Gamma, e.g. '["Up","Down"]'
  outcomePrices: string; // JSON string array of price strings
  volume?: string | number;
  volume24hr?: number;
  liquidity?: string | number;
  active?: boolean;
  closed?: boolean;
  endDate?: string;
  startDate?: string;
  description?: string;
  clobTokenIds?: string; // JSON string array
  enableOrderBook?: boolean;
  orderMinSize?: number;
  orderPriceMinTickSize?: number;
}

export interface GammaEvent {
  id: string;
  slug: string;
  title: string;
  description?: string;
  active?: boolean;
  closed?: boolean;
  endDate?: string;
  startDate?: string;
  markets?: GammaMarket[];
  volume?: number;
  volume24hr?: number;
}

export interface Btc15mWindow {
  /** Unix seconds used in Polymarket slug btc-updown-15m-{ts} (ET-aligned window start). */
  windowStartUnix: number;
  slug: string;
  label: string;
  startIso: string;
  endIso: string;
  isCurrent: boolean;
  isPast: boolean;
  isFuture: boolean;
}

export interface Btc15mMarketView {
  window: Btc15mWindow;
  event: GammaEvent | null;
  market: GammaMarket | null;
  /** Parsed live prices; null when unavailable (never invented). */
  prices: { yes: number | null; no: number | null } | null;
  outcomes: { yes: string; no: string } | null;
  clobTokenIds: { yes: string | null; no: string | null } | null;
  status: "live" | "closed" | "missing" | "error";
  error?: string;
  fetchedAt: string;
  source: "gamma";
}

export interface FetchResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
  status?: number;
}

/** CLOB order path is documented; live order placement requires auth keys (not in free public path). */
export const CLOB_BASE = "https://clob.polymarket.com";
export const GAMMA_BASE = "https://gamma-api.polymarket.com";
