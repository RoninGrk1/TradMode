import { Badge } from "@/components/ui/Badge";
import { GlassCard } from "@/components/ui/GlassCard";
import type { AgentOrchestratorSnapshot, AgentRole } from "@/lib/agents/types";

const statusVariant: Record<string, "muted" | "blue" | "yes" | "warn" | "no"> = {
  scaffolded: "muted",
  ready: "yes",
  needs_key: "warn",
  idle: "blue",
  disabled: "no",
};

export function AgentRoster({
  agents,
  snapshot,
}: {
  agents: AgentRole[];
  snapshot: AgentOrchestratorSnapshot;
}) {
  return (
    <div className="space-y-4">
      <GlassCard className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-[var(--tm-color-text-muted)]">Orchestration layer</p>
          <p className="text-lg font-semibold text-[var(--tm-color-chrome-bright)]">
            {snapshot.total} agents · {snapshot.liveCapable} live-capable
          </p>
          <p className="mt-1 text-xs text-[var(--tm-color-text-dim)]">{snapshot.note}</p>
        </div>
        <div className="flex flex-wrap gap-1">
          {Object.entries(snapshot.byDomain).map(([domain, n]) => (
            <Badge key={domain} variant="blue">
              {domain}: {n}
            </Badge>
          ))}
        </div>
      </GlassCard>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {agents.map((a) => (
          <GlassCard key={a.id} className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] text-[var(--tm-color-text-dim)]">
                  #{String(a.index).padStart(2, "0")} · {a.domain}
                </p>
                <h3 className="font-semibold text-[var(--tm-color-chrome-bright)]">{a.name}</h3>
                <p className="text-xs text-[var(--tm-color-blue-200)]">{a.codename}</p>
              </div>
              <Badge variant={statusVariant[a.status] ?? "muted"}>{a.status}</Badge>
            </div>
            <p className="text-xs text-[var(--tm-color-text-muted)]">{a.summary}</p>
            <ul className="list-inside list-disc text-[11px] text-[var(--tm-color-text-dim)]">
              {a.responsibilities.slice(0, 3).map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            {a.envKey ? (
              <p className="font-mono text-[10px] text-[var(--tm-color-text-dim)]">env: {a.envKey}</p>
            ) : null}
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
