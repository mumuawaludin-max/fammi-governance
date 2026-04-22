import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { IFinanceHealth, ISocialImpact, ITeamCheckin } from "@/types";

interface IExecutiveSummary {
  finance: IFinanceHealth;
  impact: ISocialImpact;
  ops: { merahCount: number; kuningCount: number };
  team: ITeamCheckin;
  growth: { wpv: number; staleLeads: number };
}

interface AppStore {
  // Auth
  user: { email: string; name: string; role: string } | null;
  setUser: (user: AppStore["user"]) => void;

  // Executive Summary
  executiveSummary: IExecutiveSummary | null;
  fetchExecutiveSummary: () => Promise<void>;
  isLoadingExecutive: boolean;
  lastFetchTime: number | null;

  // UI State
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  activeModule: string;
  setActiveModule: (module: string) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      user: null,
      setUser: (user) => set({ user }),

      executiveSummary: null,
      isLoadingExecutive: false,
      lastFetchTime: null,

      fetchExecutiveSummary: async () => {
        const { lastFetchTime } = get();
        if (lastFetchTime && Date.now() - lastFetchTime < 15 * 60 * 1000) return;
        set({ isLoadingExecutive: true });
        try {
          const res = await fetch("/api/executive");
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const json = await res.json();
          set({ executiveSummary: json.data, lastFetchTime: Date.now() });
        } catch (e) {
          console.error("[AppStore] fetchExecutiveSummary:", e);
        } finally {
          set({ isLoadingExecutive: false });
        }
      },

      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      activeModule: "home",
      setActiveModule: (module) => set({ activeModule: module }),
    }),
    {
      name: "fammi-app-store",
      partialize: (s) => ({ user: s.user }),
    }
  )
);
