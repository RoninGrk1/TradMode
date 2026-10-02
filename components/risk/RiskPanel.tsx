"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { defaultRailsState } from "@/lib/risk/rails";
import { RISK_TIERS, DEFAULT_TIER_ID, getTier } from "@/lib/risk/tiers";
import type { RiskRailsState, RiskTierId } from "@/lib/risk/types";

const RAILS_KEY = "trademode.rails.v1";

export function RiskPanel() {
  const [rails, setRails] = useState<RiskRailsState>(defaultRailsState(DEFAULT_TIER_ID));
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RAILS_KEY);
      if (raw) setRails(JSON.parse(raw) as RiskRailsState);
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  function persist(next: RiskRailsState) {
    setRails(next);
    localStorage.setItem(RAILS_KEY, JSON.stringify(next));
  }

  const active = getTier(rails.tierId);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        {(Object.keys(RISK_TIERS) as RiskTierId[]).map((id) => {
          const t = RISK_TIERS[id];
          const selected = rails.tierId === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => persist({ ...rails, tierId: id })}
              className={`text-left transition ${selected ? "ring-2 ring-[var(--tm-color-blue-400)] rounded-[var(--tm-radius-md)]" : ""}`}
            >
              <GlassCard className="h-full space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-[var(--tm-color-chrome-bright)]">{t.name}</h3>
                  {selected ? <Badge variant="blue">Active</Badge> : <Badge variant="muted">Select</Badge>}
                </div>
                <p className="text-xs text-[var(--tm-color-text-muted)]">{t.description}</p>
                <ul className="space-y-1 text-xs text-[var(--tm-color-text-dim)]">
                  <li>Max order ${t.maxOrderUsd}</li>
                  <li>Max position ${t.maxPositionUsd}</li>
                  <li>Max daily loss ${t.maxDailyLossUsd}</li>
                  <li>Rate {t.rateLimitPerMinute}/min</li>
                  <li>Confirm ≥ ${t.confirmAboveUsd}</li>
                  <li>Balance fraction {(t.maxBalanceFraction * 100).toFixed(0)}%</li>
                </ul>
              </GlassCard>
            </button>
          );
        })}
      </div>

      <GlassCard className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold text-[var(--tm-color-chrome-bright)]">Safeguarding rails</h3>
          <Badge variant={rails.killSwitch ? "no" : "yes"}>
            Kill switch {rails.killSwitch ? "ARMED" : "disarmed"}
          </Badge>
        </div>
        <p className="text-sm text-[var(--tm-color-text-muted)]">
          Active tier <strong className="text-[var(--tm-color-chrome-bright)]">{active.name}</strong>.
          Rails block oversized orders, over-exposure, max daily loss, and rate spikes. Confirmation gate
          above ${active.confirmAboveUsd}.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="danger"
            disabled={!hydrated}
            onClick={() => persist({ ...rails, killSwitch: !rails.killSwitch })}
          >
            {rails.killSwitch ? "Disarm kill switch" : "Arm kill switch"}
          </Button>
          <Button
            type="button"
            variant="chrome"
            disabled={!hydrated}
            onClick={() =>
              persist({
                ...rails,
                dailyLossUsd: 0,
                openExposureUsd: 0,
                ordersInLastMinute: 0,
                lastOrderAt: null,
              })
            }
          >
            Reset session counters
          </Button>
        </div>
        <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-[var(--tm-color-text-dim)]">Daily loss</dt>
            <dd className="tabular-nums text-[var(--tm-color-chrome-bright)]">
              ${rails.dailyLossUsd.toFixed(2)}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--tm-color-text-dim)]">Open exposure</dt>
            <dd className="tabular-nums text-[var(--tm-color-chrome-bright)]">
              ${rails.openExposureUsd.toFixed(2)}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--tm-color-text-dim)]">Orders / min</dt>
            <dd className="tabular-nums text-[var(--tm-color-chrome-bright)]">
              {rails.ordersInLastMinute}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--tm-color-text-dim)]">Last order</dt>
            <dd className="text-[var(--tm-color-chrome-bright)]">
              {rails.lastOrderAt ? new Date(rails.lastOrderAt).toLocaleTimeString() : "—"}
            </dd>
          </div>
        </dl>
      </GlassCard>
    </div>
  );
}
