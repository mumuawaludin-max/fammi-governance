import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { IAuthUser } from "@/types";

interface AppStore {
  // ── Auth ────────────────────────────────────────────────────────────────────
  user: IAuthUser | null;
  setUser: (user: IAuthUser) => void;
  logout: () => void;

  // ── UI State ─────────────────────────────────────────────────────────────────
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  activeModule: string;
  setActiveModule: (module: string) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      logout: () => set({ user: null }),

      sidebarOpen: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      activeModule: "home",
      setActiveModule: (module) => set({ activeModule: module }),
    }),
    {
      name: "fammi-app-store",
      // Hanya persist user — UI state selalu reset setelah refresh
      partialize: (s) => ({ user: s.user }),
    }
  )
);
