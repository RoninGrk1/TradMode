import { AppShell } from "@/components/layout/AppShell";
import { WalletPanel } from "@/components/wallet/WalletPanel";

export default function WalletPage() {
  return (
    <AppShell
      title="Wallet"
      subtitle="Simple in-website wallet: deposit and withdraw with no fees, no minimum deposit, and no maximum withdrawal beyond available balance."
    >
      <WalletPanel />
    </AppShell>
  );
}
