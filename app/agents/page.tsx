import { AppShell } from "@/components/layout/AppShell";
import { AgentRoster } from "@/components/agents/AgentRoster";
import { listAgents, orchestratorSnapshot } from "@/lib/agents/orchestrator";

export default function AgentsPage() {
  const agents = listAgents();
  const snapshot = orchestratorSnapshot();

  return (
    <AppShell
      title="Agent roster"
      subtitle="23 named Grok-agent roles for research, risk, execution, monitoring, and ops. Scaffolding + interfaces — live calls only when env keys exist."
    >
      <AgentRoster agents={agents} snapshot={snapshot} />
    </AppShell>
  );
}
