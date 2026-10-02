import { AppShell } from "@/components/layout/AppShell";
import { RiskPanel } from "@/components/risk/RiskPanel";

export default function RiskPage() {
  return (
    <AppShell
      title="Risk panel"
      subtitle="Three tiers with clear caps: position limits, max daily loss, rate limits, confirmation gates, and kill switch."
    >
      <RiskPanel />
    </AppShell>
  );
}
