"use client";

import { usePathname } from "next/navigation";
import { Menu, RefreshCw, Bell } from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/cn";

const PAGE_TITLES: Record<string, string> = {
  [ROUTES.HOME]: "Mission Control",
  [ROUTES.FINANCE]: "Keuangan",
  [ROUTES.OPS]: "Operasional",
  [ROUTES.PRODUCT]: "Produk",
  [ROUTES.GROWTH]: "Sales & Growth",
  [ROUTES.TEAM]: "Tim",
  [ROUTES.IMPACT]: "Impact",
  [ROUTES.AI_BRIEF]: "AI Brief",
};

function getPageTitle(pathname: string): string {
  return (
    Object.entries(PAGE_TITLES).find(([route]) =>
      route === "/" ? pathname === "/" : pathname.startsWith(route),
    )?.[1] ?? "Fammi OS"
  );
}

interface TopBarProps {
  onMenuClick: () => void;
  lastUpdated?: string;
  onRefresh?: () => void;
}

export function TopBar({ onMenuClick, lastUpdated, onRefresh }: TopBarProps) {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-fammi-100 bg-white/90 backdrop-blur-sm px-4 md:px-6">
      {/* Left: hamburger (mobile) / breadcrumb (desktop) */}
      <button
        onClick={onMenuClick}
        className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-fammi-50 text-text-secondary transition-colors md:hidden"
        aria-label="Toggle sidebar"
      >
        <Menu size={18} />
      </button>
      <div className="hidden md:flex items-center gap-2 text-xs text-text-secondary">
        <span className="text-fammi font-semibold">Fammi OS</span>
        <span>/</span>
        <span className="text-text-primary font-medium">{title}</span>
      </div>

      {/* Center: page title (mobile) */}
      <span className="flex-1 text-center text-sm font-semibold text-text-primary md:hidden">
        {title}
      </span>

      {/* Right: refresh + timestamp + bell */}
      <div className="ml-auto flex items-center gap-1">
        {lastUpdated && (
          <span className="hidden md:block text-[11px] text-text-secondary mr-2">
            {lastUpdated}
          </span>
        )}
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-fammi-50 text-text-secondary transition-colors"
            aria-label="Refresh data"
          >
            <RefreshCw size={15} />
          </button>
        )}
        <button
          className={cn(
            "relative flex h-8 w-8 items-center justify-center rounded-xl",
            "hover:bg-fammi-50 text-text-secondary transition-colors",
          )}
          aria-label="Notifikasi"
        >
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-danger" />
        </button>
      </div>
    </header>
  );
}
