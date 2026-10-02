import { Badge } from "@/components/ui/Badge";
import { GlassCard } from "@/components/ui/GlassCard";

export function StatusStrip({
  btcUsd,
  btcError,
  liveWindows,
  killSwitch,
  tierName,
  walletBalance,
  agentNote,
}: {
  btcUsd: number | null;
  btcError?: string;
  liveWindows: number;
  killSwitch: boolean;
  tierName: string;
  walletBalance: number;
  agentNote: string;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <GlassCard>
        <p className="text-[11px] uppercase tracking-wider text-[var(--tm-color-text-dim)]">BTC spot (Coinbase)</p>
        {btcUsd != null ? (
          <p className="mt-1 text-xl font-semibold tabular-nums text-[var(--tm-color-chrome-bright)]">
            ${btcUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
        ) : (
          <p className="mt-1 text-sm text-[var(--tm-color-warn)]">{btcError ?? "Unavailable"}</p>
        )}
      </GlassCard>
      <GlassCard>
        <p className="text-[11px] uppercase tracking-wider text-[var(--tm-color-text-dim)]">BTC 15m windows</p>
        <p className="mt-1 text-xl font-semibold text-[var(--tm-color-chrome-bright)]">{liveWindows} live</p>
        <p className="text-xs text-[var(--tm-color-text-muted)]">From Gamma public API</p>
      </GlassCard>
      <GlassCard>
        <p className="text-[11px] uppercase tracking-wider text-[var(--tm-color-text-dim)]">Risk · Wallet</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge variant="blue">{tierName}</Badge>
          <Badge variant={killSwitch ? "no" : "yes"}>{killSwitch ? "Kill ON" : "Kill OFF"}</Badge>
        </div>
        <p className="mt-2 text-sm tabular-nums text-[var(--tm-color-text-muted)]">
          Wallet ${walletBalance.toFixed(2)}
        </p>
      </GlassCard>
      <GlassCard>
        <p className="text-[11px] uppercase tracking-wider text-[var(--tm-color-text-dim)]">Agent roster</p>
        <p className="mt-1 text-sm text-[var(--tm-color-text-muted)]">{agentNote}</p>
      </GlassCard>
    </div>
  );
}
