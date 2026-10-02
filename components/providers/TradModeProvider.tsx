"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  bumpOrderCounters,
  defaultRailsState,
  recordRealizedLoss,
  reduceExposure,
} from "@/lib/risk/rails";
import { loadRailsFromStorage, RAILS_KEY, saveRailsToStorage } from "@/lib/risk/storage";
import { DEFAULT_TIER_ID } from "@/lib/risk/tiers";
import type { RiskRailsState, RiskTierId } from "@/lib/risk/types";
import type { Btc15mMarketView, OutcomeSide } from "@/lib/polymarket/types";
import {
  createEmptyPositions,
  loadPositionsFromStorage,
  openPosition,
  openPositionsOnly,
  POSITIONS_KEY,
  replacePosition,
  savePositionsToStorage,
  settlePositionAgainstMarket,
  type OpenPosition,
  type PositionsState,
} from "@/lib/tradmode/positions";
import {
  applyTx,
  createEmptyWallet,
  loadWalletFromStorage,
  saveWalletToStorage,
  STORAGE_KEY as WALLET_KEY,
} from "@/lib/wallet/store";
import type { WalletState } from "@/lib/wallet/types";

type TradModeContextValue = {
  hydrated: boolean;
  wallet: WalletState;
  rails: RiskRailsState;
  positions: PositionsState;
  openPositions: OpenPosition[];
  setWalletPersisted: (next: WalletState) => void;
  setRailsPersisted: (next: RiskRailsState) => void;
  setTier: (id: RiskTierId) => void;
  toggleKillSwitch: () => void;
  resetSessionCounters: () => void;
  deposit: (amountUsd: number, note?: string) => { ok: true } | { ok: false; error: string };
  withdraw: (amountUsd: number, note?: string) => { ok: true } | { ok: false; error: string };
  /** Debit wallet, bump rails, open a demo position. */
  recordTradeIntent: (input: {
    side: OutcomeSide;
    sizeUsd: number;
    slug: string;
    label: string;
    entryPrice: number | null;
    note: string;
  }) => { ok: true; position: OpenPosition } | { ok: false; error: string };
  /** Settle against Gamma market view; credits wallet + reduces exposure / records loss. */
  settlePosition: (
    positionId: string,
    market: Btc15mMarketView,
  ) => { ok: true; note: string; kind: "win" | "loss" | "void" } | { ok: false; error: string };
  reloadFromStorage: () => void;
};

const TradModeContext = createContext<TradModeContextValue | null>(null);

export function TradModeProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<WalletState>(() => createEmptyWallet(0));
  const [rails, setRails] = useState<RiskRailsState>(() => defaultRailsState(DEFAULT_TIER_ID));
  const [positions, setPositions] = useState<PositionsState>(() => createEmptyPositions());
  const [hydrated, setHydrated] = useState(false);

  const reloadFromStorage = useCallback(() => {
    setWallet(loadWalletFromStorage() ?? createEmptyWallet(0));
    setRails(loadRailsFromStorage());
    setPositions(loadPositionsFromStorage());
  }, []);

  useEffect(() => {
    reloadFromStorage();
    setHydrated(true);

    function onStorage(e: StorageEvent) {
      if (!e.key) {
        reloadFromStorage();
        return;
      }
      if (e.key === WALLET_KEY) {
        setWallet(loadWalletFromStorage() ?? createEmptyWallet(0));
      }
      if (e.key === RAILS_KEY) {
        setRails(loadRailsFromStorage());
      }
      if (e.key === POSITIONS_KEY) {
        setPositions(loadPositionsFromStorage());
      }
    }

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [reloadFromStorage]);

  const setWalletPersisted = useCallback((next: WalletState) => {
    setWallet(next);
    saveWalletToStorage(next);
  }, []);

  const setRailsPersisted = useCallback((next: RiskRailsState) => {
    setRails(next);
    saveRailsToStorage(next);
  }, []);

  const setPositionsPersisted = useCallback((next: PositionsState) => {
    setPositions(next);
    savePositionsToStorage(next);
  }, []);

  const setTier = useCallback(
    (id: RiskTierId) => {
      setRailsPersisted({ ...rails, tierId: id });
    },
    [rails, setRailsPersisted],
  );

  const toggleKillSwitch = useCallback(() => {
    setRailsPersisted({ ...rails, killSwitch: !rails.killSwitch });
  }, [rails, setRailsPersisted]);

  const resetSessionCounters = useCallback(() => {
    setRailsPersisted({
      ...rails,
      dailyLossUsd: 0,
      openExposureUsd: 0,
      ordersInLastMinute: 0,
      lastOrderAt: null,
    });
  }, [rails, setRailsPersisted]);

  const deposit = useCallback(
    (amountUsd: number, note = "Deposit (no fee, no minimum)") => {
      const res = applyTx(wallet, "deposit", amountUsd, note);
      if (!res.ok) return res;
      setWalletPersisted(res.state);
      return { ok: true as const };
    },
    [wallet, setWalletPersisted],
  );

  const withdraw = useCallback(
    (amountUsd: number, note = "Withdrawal (no fee, no max beyond balance)") => {
      const res = applyTx(wallet, "withdraw", amountUsd, note);
      if (!res.ok) return res;
      setWalletPersisted(res.state);
      return { ok: true as const };
    },
    [wallet, setWalletPersisted],
  );

  const recordTradeIntent = useCallback(
    (input: {
      side: OutcomeSide;
      sizeUsd: number;
      slug: string;
      label: string;
      entryPrice: number | null;
      note: string;
    }) => {
      const debited = applyTx(wallet, "trade_debit", input.sizeUsd, input.note);
      if (!debited.ok) return debited;

      const nextPositions = openPosition(positions, {
        slug: input.slug,
        side: input.side,
        sizeUsd: input.sizeUsd,
        entryPrice: input.entryPrice,
        label: input.label,
      });
      const nextRails = bumpOrderCounters(rails, input.sizeUsd);

      setWalletPersisted(debited.state);
      setPositionsPersisted(nextPositions);
      setRailsPersisted(nextRails);

      const created = nextPositions.positions[0];
      return { ok: true as const, position: created };
    },
    [wallet, positions, rails, setWalletPersisted, setPositionsPersisted, setRailsPersisted],
  );

  const settlePosition = useCallback(
    (positionId: string, market: Btc15mMarketView) => {
      const pos = positions.positions.find((p) => p.id === positionId);
      if (!pos) return { ok: false as const, error: "Position not found." };

      const outcome = settlePositionAgainstMarket(pos, market);
      if (!outcome.ok) return outcome;

      let nextWallet = wallet;
      if (outcome.creditUsd > 0) {
        const credited = applyTx(
          wallet,
          outcome.kind === "void" ? "adjustment" : "trade_credit",
          outcome.creditUsd,
          outcome.note,
        );
        if (!credited.ok) return credited;
        nextWallet = credited.state;
      }

      let nextRails = reduceExposure(rails, pos.sizeUsd);
      if (outcome.realizedLossUsd > 0) {
        nextRails = recordRealizedLoss(nextRails, outcome.realizedLossUsd);
      }

      const nextPositions = replacePosition(positions, outcome.position);

      setWalletPersisted(nextWallet);
      setRailsPersisted(nextRails);
      setPositionsPersisted(nextPositions);

      return { ok: true as const, note: outcome.note, kind: outcome.kind };
    },
    [positions, wallet, rails, setWalletPersisted, setRailsPersisted, setPositionsPersisted],
  );

  const value = useMemo<TradModeContextValue>(
    () => ({
      hydrated,
      wallet,
      rails,
      positions,
      openPositions: openPositionsOnly(positions),
      setWalletPersisted,
      setRailsPersisted,
      setTier,
      toggleKillSwitch,
      resetSessionCounters,
      deposit,
      withdraw,
      recordTradeIntent,
      settlePosition,
      reloadFromStorage,
    }),
    [
      hydrated,
      wallet,
      rails,
      positions,
      setWalletPersisted,
      setRailsPersisted,
      setTier,
      toggleKillSwitch,
      resetSessionCounters,
      deposit,
      withdraw,
      recordTradeIntent,
      settlePosition,
      reloadFromStorage,
    ],
  );

  return <TradModeContext.Provider value={value}>{children}</TradModeContext.Provider>;
}

export function useTradMode(): TradModeContextValue {
  const ctx = useContext(TradModeContext);
  if (!ctx) {
    throw new Error("useTradMode must be used within TradModeProvider");
  }
  return ctx;
}
