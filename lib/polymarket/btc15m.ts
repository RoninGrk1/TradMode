/**
 * BTC 15-minute incremental markets on Polymarket.
 * Slug pattern: btc-updown-15m-{unix} where unix is the ET window start.
 * Outcomes: Up / Down → TradeMode Yes (win/up) / No (lose/down).
 */

import type { Btc15mWindow } from "./types";

const WINDOW_SECONDS = 15 * 60;

/** Approximate America/New_York offset for window math (handles EST/EDT via Intl). */
export function getEtOffsetMinutes(date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    timeZoneName: "shortOffset",
  }).formatToParts(date);
  const tz = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT-4";
  const match = tz.match(/GMT([+-]\d+)(?::(\d+))?/);
  if (!match) return -240;
  const hours = Number(match[1]);
  const mins = Number(match[2] ?? "0");
  return hours * 60 + Math.sign(hours || 1) * mins;
}

/** Floor a Date to the current 15m ET window start (unix seconds). */
export function floorToEt15mUnix(date = new Date()): number {
  const etOffsetMin = getEtOffsetMinutes(date);
  const utcMs = date.getTime();
  // Shift to ET wall-clock ms, floor to 15m, shift back.
  const etMs = utcMs + etOffsetMin * 60_000;
  const flooredEt = Math.floor(etMs / (WINDOW_SECONDS * 1000)) * WINDOW_SECONDS * 1000;
  return Math.floor((flooredEt - etOffsetMin * 60_000) / 1000);
}

export function slugForWindow(windowStartUnix: number): string {
  return `btc-updown-15m-${windowStartUnix}`;
}

function formatEtRange(startUnix: number): string {
  const start = new Date(startUnix * 1000);
  const end = new Date((startUnix + WINDOW_SECONDS) * 1000);
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const fmtTime = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${fmt.format(start)} – ${fmtTime.format(end)} ET`;
}

export function buildWindow(windowStartUnix: number, nowUnix = Math.floor(Date.now() / 1000)): Btc15mWindow {
  const end = windowStartUnix + WINDOW_SECONDS;
  return {
    windowStartUnix,
    slug: slugForWindow(windowStartUnix),
    label: formatEtRange(windowStartUnix),
    startIso: new Date(windowStartUnix * 1000).toISOString(),
    endIso: new Date(end * 1000).toISOString(),
    isCurrent: nowUnix >= windowStartUnix && nowUnix < end,
    isPast: nowUnix >= end,
    isFuture: nowUnix < windowStartUnix,
  };
}

/** Nearby windows: past, current, upcoming. */
export function nearbyBtc15mWindows(countPast = 2, countFuture = 4, now = new Date()): Btc15mWindow[] {
  const current = floorToEt15mUnix(now);
  const nowUnix = Math.floor(now.getTime() / 1000);
  const windows: Btc15mWindow[] = [];
  for (let i = -countPast; i <= countFuture; i++) {
    windows.push(buildWindow(current + i * WINDOW_SECONDS, nowUnix));
  }
  return windows;
}

export { WINDOW_SECONDS };
