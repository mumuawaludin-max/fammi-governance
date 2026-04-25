"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppStore } from "@/stores/app-store";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { BottomNav } from "./BottomNav";
import { LoginView } from "@/components/auth/LoginView";
import { ROUTES } from "@/lib/constants";
import type { MenuKey, IAuthUser } from "@/types";

const PERM_TO_ROUTE: Array<{ key: MenuKey; route: string }> = [
  { key: "missionControl", route: ROUTES.HOME },
  { key: "operasional",    route: ROUTES.OPS },
  { key: "keuangan",       route: ROUTES.FINANCE },
  { key: "produk",         route: ROUTES.PRODUCT },
  { key: "salesGrowth",    route: ROUTES.GROWTH },
  { key: "tim",            route: ROUTES.TEAM },
  { key: "impact",         route: ROUTES.IMPACT },
];

function isRouteAllowed(user: IAuthUser, pathname: string): boolean {
  const match = PERM_TO_ROUTE.find((p) =>
    p.route === "/" ? pathname === "/" : pathname.startsWith(p.route),
  );
  // Route tidak dikenali (mis. /settings) — biarkan lewat
  if (!match) return true;
  return user.permissions[match.key] === true;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { sidebarOpen, setSidebarOpen, user } = useAppStore();
  const router   = useRouter();
  const pathname = usePathname();

  // Hindari hydration mismatch: Zustand persist baru tersedia setelah mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Close drawer on resize to desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setSidebarOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [setSidebarOpen]);

  // Redirect ke halaman pertama yang diizinkan (pakai useEffect hanya untuk trigger navigate)
  useEffect(() => {
    if (!user || !mounted) return;
    if (isRouteAllowed(user, pathname)) return;
    const firstAllowed = PERM_TO_ROUTE.find((p) => user.permissions[p.key]);
    if (firstAllowed) router.replace(firstAllowed.route);
  }, [user, pathname, mounted, router]);

  // Belum hydrate — tampilkan layar kosong sebentar
  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-fammi-100 animate-pulse">
          <span className="text-fammi font-bold text-2xl">f</span>
        </div>
      </div>
    );
  }

  // Belum login — tampilkan login view
  if (!user) return <LoginView />;

  // Route tidak diizinkan — tampilkan blank saat router.replace() bekerja
  if (!isRouteAllowed(user, pathname)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-fammi-100 animate-pulse">
          <span className="text-fammi font-bold text-2xl">f</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <button
          className="fixed inset-0 z-30 bg-black/25 backdrop-blur-sm md:hidden cursor-default"
          aria-label="Tutup sidebar"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — fixed on desktop, drawer on mobile */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main column */}
      <div className="flex flex-1 flex-col md:ml-[260px]">
        <TopBar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 px-4 py-6 pb-24 md:px-8 md:py-10 md:pb-10 scrollbar-fammi overflow-x-hidden">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
