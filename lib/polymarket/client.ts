/**
 * Polymarket public client — Gamma for discovery; CLOB documented for orders.
 * Free / unauthenticated reads only. Never invents prices.
 */

import {
  GAMMA_BASE,
  CLOB_BASE,
  type Btc15mMarketView,
  type FetchResult,
  type GammaEvent,
  type GammaMarket,
} from "./types";
import { nearbyBtc15mWindows, buildWindow } from "./btc15m";

export { GAMMA_BASE, CLOB_BASE };

async function gammaFetch<T>(path: string, init?: RequestInit): Promise<FetchResult<T>> {
  const url = `${GAMMA_BASE}${path}`;
  try {
    const res = await fetch(url, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init?.headers ?? {}),
      },
      // Server-side: short cache for Vercel; client callers pass their own.
      next: { revalidate: 15 },
    });
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error: `Gamma ${res.status} for ${path}`,
      };
    }
    const data = (await res.json()) as T;
    return { ok: true, status: res.status, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Network error talking to Gamma API",
    };
  }
}

function parseJsonArray<T = string>(raw: string | undefined | null): T[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : null;
  } catch {
    return null;
  }
}

function mapOutcomesToYesNo(outcomes: string[] | null): { yesIdx: number; noIdx: number; yes: string; no: string } | null {
  if (!outcomes || outcomes.length < 2) return null;
  const lower = outcomes.map((o) => o.toLowerCase());
  let yesIdx = lower.findIndex((o) => o === "yes" || o === "up");
  let noIdx = lower.findIndex((o) => o === "no" || o === "down");
  if (yesIdx < 0) yesIdx = 0;
  if (noIdx < 0) noIdx = 1;
  return { yesIdx, noIdx, yes: outcomes[yesIdx], no: outcomes[noIdx] };
}

export function toMarketView(
  window: ReturnType<typeof buildWindow>,
  event: GammaEvent | null,
  error?: string,
): Btc15mMarketView {
  const fetchedAt = new Date().toISOString();
  if (error) {
    return {
      window,
      event: null,
      market: null,
      prices: null,
      outcomes: null,
      clobTokenIds: null,
      status: "error",
      error,
      fetchedAt,
      source: "gamma",
    };
  }
  if (!event) {
    return {
      window,
      event: null,
      market: null,
      prices: null,
      outcomes: null,
      clobTokenIds: null,
      status: "missing",
      fetchedAt,
      source: "gamma",
    };
  }
  const market: GammaMarket | null = event.markets?.[0] ?? null;
  if (!market) {
    return {
      window,
      event,
      market: null,
      prices: null,
      outcomes: null,
      clobTokenIds: null,
      status: event.closed ? "closed" : "missing",
      fetchedAt,
      source: "gamma",
    };
  }
  const outcomesRaw = parseJsonArray<string>(market.outcomes);
  const pricesRaw = parseJsonArray<string>(market.outcomePrices);
  const tokensRaw = parseJsonArray<string>(market.clobTokenIds);
  const mapped = mapOutcomesToYesNo(outcomesRaw);

  let prices: Btc15mMarketView["prices"] = null;
  let outcomes: Btc15mMarketView["outcomes"] = null;
  let clobTokenIds: Btc15mMarketView["clobTokenIds"] = null;

  if (mapped) {
    outcomes = { yes: mapped.yes, no: mapped.no };
    if (pricesRaw && pricesRaw.length > mapped.noIdx) {
      const yesP = Number(pricesRaw[mapped.yesIdx]);
      const noP = Number(pricesRaw[mapped.noIdx]);
      prices = {
        yes: Number.isFinite(yesP) ? yesP : null,
        no: Number.isFinite(noP) ? noP : null,
      };
    }
    if (tokensRaw) {
      clobTokenIds = {
        yes: tokensRaw[mapped.yesIdx] ?? null,
        no: tokensRaw[mapped.noIdx] ?? null,
      };
    }
  }

  const status: Btc15mMarketView["status"] =
    market.closed || event.closed ? "closed" : "live";

  return {
    window,
    event,
    market,
    prices,
    outcomes,
    clobTokenIds,
    status,
    fetchedAt,
    source: "gamma",
  };
}

/** Fetch a single BTC 15m event by slug from Gamma. */
export async function fetchBtc15mEvent(slug: string): Promise<FetchResult<GammaEvent | null>> {
  const result = await gammaFetch<GammaEvent[]>(`/events?slug=${encodeURIComponent(slug)}`);
  if (!result.ok) return { ok: false, error: result.error, status: result.status };
  const list = result.data ?? [];
  return { ok: true, data: list[0] ?? null, status: result.status };
}

/** Fetch nearby BTC 15m windows with live Gamma data. Honest empty/error states. */
export async function fetchNearbyBtc15mMarkets(
  countPast = 1,
  countFuture = 3,
): Promise<{ markets: Btc15mMarketView[]; fetchedAt: string; gammaOk: boolean }> {
  const windows = nearbyBtc15mWindows(countPast, countFuture);
  const results = await Promise.all(
    windows.map(async (w) => {
      const res = await fetchBtc15mEvent(w.slug);
      if (!res.ok) return toMarketView(w, null, res.error);
      return toMarketView(w, res.data ?? null);
    }),
  );
  const gammaOk = results.some((m) => m.status === "live" || m.status === "closed");
  return {
    markets: results,
    fetchedAt: new Date().toISOString(),
    gammaOk,
  };
}

/**
 * Public BTC spot price via Coinbase exchange rates (free, no key).
 * Used as reference only — not for inventing Polymarket outcome prices.
 */
export async function fetchPublicBtcUsd(): Promise<FetchResult<number>> {
  try {
    const res = await fetch("https://api.coinbase.com/v2/exchange-rates?currency=BTC", {
      next: { revalidate: 30 },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      return { ok: false, status: res.status, error: `Coinbase ${res.status}` };
    }
    const json = (await res.json()) as { data?: { rates?: { USD?: string } } };
    const usd = Number(json.data?.rates?.USD);
    if (!Number.isFinite(usd)) {
      return { ok: false, error: "BTC/USD missing from Coinbase response" };
    }
    return { ok: true, data: usd, status: res.status };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "BTC price network error",
    };
  }
}

/**
 * CLOB order book (public read). Useful before signing orders.
 * Docs: https://docs.polymarket.com — GET {CLOB}/book?token_id=
 */
export async function fetchClobBook(tokenId: string): Promise<FetchResult<unknown>> {
  try {
    const res = await fetch(`${CLOB_BASE}/book?token_id=${encodeURIComponent(tokenId)}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 5 },
    });
    if (!res.ok) {
      return { ok: false, status: res.status, error: `CLOB book ${res.status}` };
    }
    return { ok: true, data: await res.json(), status: res.status };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "CLOB network error",
    };
  }
}

