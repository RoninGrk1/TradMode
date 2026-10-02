import { AGENT_ROSTER, resolveAgentLiveStatus } from "./roster";
import type { AgentDomain, AgentOrchestratorSnapshot, AgentRole } from "./types";

export function listAgents(): AgentRole[] {
  return AGENT_ROSTER.map(resolveAgentLiveStatus);
}

export function orchestratorSnapshot(): AgentOrchestratorSnapshot {
  const agents = listAgents();
  const byDomain = agents.reduce(
    (acc, a) => {
      acc[a.domain] = (acc[a.domain] ?? 0) + 1;
      return acc;
    },
    {} as Record<AgentDomain, number>,
  );
  const liveCapable = agents.filter((a) => a.status === "ready").length;
  return {
    total: agents.length,
    byDomain,
    liveCapable,
    note:
      liveCapable === 0
        ? "No live Grok/CLOB keys detected. Roster is scaffolding — interfaces only."
        : `${liveCapable} agent(s) report ready via env keys.`,
  };
}

/** Interface for future live Grok calls — no network unless key exists. */
export interface AgentInvokeRequest {
  agentId: string;
  prompt: string;
}

export interface AgentInvokeResult {
  ok: boolean;
  agentId: string;
  mode: "scaffold" | "live";
  message: string;
}

export async function invokeAgent(req: AgentInvokeRequest): Promise<AgentInvokeResult> {
  const agent = listAgents().find((a) => a.id === req.agentId);
  if (!agent) {
    return { ok: false, agentId: req.agentId, mode: "scaffold", message: "Unknown agent." };
  }
  if (agent.status !== "ready" || !agent.envKey) {
    return {
      ok: false,
      agentId: agent.id,
      mode: "scaffold",
      message: `${agent.codename} is scaffolded only. Set ${agent.envKey ?? "required env"} for live calls.`,
    };
  }
  // Live path intentionally not implemented in first commit without claiming fake responses.
  return {
    ok: false,
    agentId: agent.id,
    mode: "live",
    message: `${agent.codename}: env key present, but live Grok invoke is not wired in this scaffold commit.`,
  };
}
