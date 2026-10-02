import { NextResponse } from "next/server";
import { fetchPublicBtcUsd } from "@/lib/polymarket/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const res = await fetchPublicBtcUsd();
  if (!res.ok) {
    return NextResponse.json(
      { ok: false, error: res.error, usd: null, source: "coinbase" },
      { status: 502 },
    );
  }
  return NextResponse.json({
    ok: true,
    usd: res.data,
    source: "coinbase",
    fetchedAt: new Date().toISOString(),
  });
}
