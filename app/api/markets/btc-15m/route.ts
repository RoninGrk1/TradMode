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

  const past = Number(req.nextUrl.searchParams.get("past") ?? "1");
  const future = Number(req.nextUrl.searchParams.get("future") ?? "3");
  const bundle = await fetchNearbyBtc15mMarkets(
    Number.isFinite(past) ? past : 1,
    Number.isFinite(future) ? future : 3,
  );
  return NextResponse.json({
    ok: true,
    ...bundle,
    source: "gamma",
  });
}
