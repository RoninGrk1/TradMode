# TradeMode

Glass-chrome trading terminal for **Polymarket BTC 15-minute** Up/Down markets (mapped to **Yes / No**), with risk tiers, safeguarding rails, an in-app wallet, and a **23-agent** orchestration roster.

**Repo:** https://github.com/RoninGrk1/TradeMode  
**Owner:** Jazz Forbes-Browne (GitHub: RoninGrk1)

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind CSS v4
- Vercel-ready (zero special config)
- Free public APIs only in production paths: Polymarket **Gamma**, optional **CLOB** reads, Coinbase BTC spot

## Quick start (local)

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build && npm start   # production check
```

Optional: copy `.env.example` → `.env.local` (no keys required for live market reads).

## Pages

| Route | Purpose |
|-------|---------|
| `/` | Dashboard — spot BTC, nearby 15m windows, checklist |
| `/markets` | BTC 15m market list (live Gamma) |
| `/trade` | Yes/No trade ticket + rails |
| `/risk` | Conservative / Balanced / Aggressive + kill switch |
| `/wallet` | Deposit / withdraw (no fees, no min, no max beyond balance) |
| `/agents` | 23-agent roster |

API routes: `/api/markets/btc-15m`, `/api/btc-price`.

## Deploy on Vercel

1. Import `RoninGrk1/TradeMode` in the Vercel dashboard (or `vercel` CLI).
2. Framework preset: **Next.js** (auto-detected).
3. Build command: `next build` · Output: default `.next`.
4. No special config required. Env vars from `.env.example` are optional.
5. Deploy. Markets page will call Gamma from the server at request time.

## Polymarket free APIs

| API | Base | Use in TradeMode |
|-----|------|------------------|
| Gamma | `https://gamma-api.polymarket.com` | Events/markets discovery, `outcomePrices` |
| CLOB | `https://clob.polymarket.com` | Public book reads; **order placement needs keys** |
| BTC spot | Coinbase `api.coinbase.com/v2/exchange-rates?currency=BTC` | Reference only |

BTC 15m slug pattern: `btc-updown-15m-{unix}` (ET-aligned 15-minute window start).  
Outcomes on Polymarket: **Up / Down** → TradeMode **Yes / No**.

**Honesty policy:** production paths never invent prices. Missing windows show empty/error states. Trade ticket records safeguarded **intents** against the in-app wallet; live CLOB orders require `POLYMARKET_PRIVATE_KEY` (not wired as fake fills).

Geographic restrictions may apply — see [Polymarket docs](https://docs.polymarket.com).

## Risk tiers & rails

- **Conservative / Balanced / Aggressive** — order size, position, daily loss, rate limit, confirmation gate, balance fraction.
- **Kill switch**, position caps, max loss, rate limits, confirmation gates — `lib/risk/`.

## Wallet policy

Documented in `lib/wallet/policy.ts` and the Wallet UI:

- No deposit or withdrawal fees  
- No minimum deposit  
- No maximum withdrawal (up to available balance)  
- Local ledger (browser `localStorage`) for terminal UX  

## Agent roster (23)

Scaffolding in `lib/agents/` — named roles for research, risk, execution, monitoring, compliance, wallet, UX, ops. Live Grok calls are **not** claimed unless env keys exist (`GROK_API_KEY`, etc.).

## Figma sync (design tokens)

1. Open `styles/tokens.css` (source of truth for CSS variables) and `styles/tokens.ts` (TS mirror).
2. In Figma, create Variable collections: **Color / TradeMode**, **Radius**, **Blur**, **Spacing**.
3. Map `--tm-color-*`, `--tm-radius-*`, `--tm-blur-*`, `--tm-space-*` 1:1 (convention: Figma `tm/color/blue-400` ↔ `--tm-color-blue-400`).
4. Components under `components/` are structured for handoff (GlassCard, Badge, Button, shells).
5. Chrome accents + glass blur tokens support glassmorphism inspection in Dev Mode.

## Project structure

```
app/                 # App Router pages + API
components/          # UI, markets, trade, risk, wallet, agents
lib/polymarket/      # Gamma/CLOB client, BTC 15m windows
lib/risk/            # Tiers + rails
lib/wallet/          # Ledger + policy
lib/agents/          # 23-agent roster + orchestrator
styles/tokens.css    # Figma-friendly design tokens
styles/tokens.ts
```

## License

Private / as decided by RoninGrk1.
