export type AgentDomain =
  | "research"
  | "risk"
  | "execution"
  | "monitoring"
  | "orchestration"
  | "market-data"
  | "compliance"
  | "wallet"
  | "ux"
  | "ops";

export type AgentStatus = "idle" | "ready" | "scaffolded" | "needs_key" | "disabled";

export interface AgentRole {
  id: string;
  index: number; // 1–23
  name: string;
  codename: string;
  domain: AgentDomain;
  summary: string;
  responsibilities: string[];
  /** Optional env key that enables live Grok / tool calls for this role. */
  envKey?: string;
  status: AgentStatus;
}

export interface AgentOrchestratorSnapshot {
  total: number;
  byDomain: Record<AgentDomain, number>;
  liveCapable: number;
  note: string;
}
