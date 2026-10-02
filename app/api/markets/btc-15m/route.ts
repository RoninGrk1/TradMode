import { NextRequest, NextResponse } from "next/server";
import { buildWindow, floorToEt15mUnix, slugForWindow } from "@/lib/polymarket/btc15m";
import { fetchBtc15mEvent, fetchNearbyBtc15mMarkets, toMarketView } from "@/lib/polymarket/client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");

  if (slug) {
    const windowUnix = Number(slug.replace(/^btc-updown-15m-/, ""));
    const window = Number.isFinite(windowUnix)
      ? buildWindow(windowUnix)
      : buildWindow(floorToEt15mUnix(), Math.floor(Date.now() / 1000));
    // If slug doesn't parse, still try fetch by provided slug with synthetic window meta
    const effectiveSlug = slug.startsWith("btc-updown-15m-") ? slug : slugForWindow(floorToEt15mUnix());
    const res = await fetchBtc15mEvent(effectiveSlug);
    if (!res.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: res.error,
          market: toMarketView({ ...window, slug: effectiveSlug }, null, res.error),
        },
        { status: 502 },
      );
    }
    const market = toMarketView(
      { ...window, slug: effectiveSlug, label: window.label },
      res.data ?? null,
    );
    return NextResponse.json({ ok: true, market, source: "gamma" });
  }

  const pastRaw = Number(req.nextUrl.searchParams.get("past") ?? "1");
  const futureRaw = Number(req.nextUrl.searchParams.get("future") ?? "3");
  // Clamp to avoid unbounded fan-out of Gamma requests (DoS / rate-limit burn).
  const past = Number.isFinite(pastRaw) ? Math.min(Math.max(Math.floor(pastRaw), 0), 12) : 1;
  const future = Number.isFinite(futureRaw) ? Math.min(Math.max(Math.floor(futureRaw), 0), 24) : 3;
  const bundle = await fetchNearbyBtc15mMarkets(past, future);
  return NextResponse.json({
    ok: true,
    ...bundle,
    source: "gamma",
  });
}
