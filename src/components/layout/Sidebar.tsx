"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Wallet,
  Layers,
  TrendingUp,
  Heart,
  Globe,
  X,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { ROUTES } from "@/lib/constants";
import { useAppStore } from "@/stores/app-store";
import type { MenuKey } from "@/types";

// permKey harus match MenuKey → IUserPermissions keys
const NAV_ITEMS: {
  href: string;
  label: string;
  Icon: React.ElementType;
  permKey: MenuKey;
}[] = [
  { href: ROUTES.HOME,    label: "Mission Control", Icon: LayoutDashboard, permKey: "missionControl" },
  { href: ROUTES.OPS,     label: "Operasional",     Icon: Building2,       permKey: "operasional"    },
  { href: ROUTES.FINANCE, label: "Keuangan",         Icon: Wallet,          permKey: "keuangan"       },
  { href: ROUTES.PRODUCT, label: "Produk",           Icon: Layers,          permKey: "produk"         },
  { href: ROUTES.GROWTH,  label: "Sales & Growth",   Icon: TrendingUp,      permKey: "salesGrowth"    },
  { href: ROUTES.TEAM,    label: "Tim",              Icon: Heart,           permKey: "tim"            },
  { href: ROUTES.IMPACT,  label: "Impact",           Icon: Globe,           permKey: "impact"         },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname  = usePathname();
  const user      = useAppStore((s) => s.user);
  const logout    = useAppStore((s) => s.logout);

  // Hanya tampilkan menu yang di-checklist TRUE di RBAC config
  const visibleNav = user
    ? NAV_ITEMS.filter((item) => user.permissions[item.permKey] === true)
    : [];

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 z-40 h-screen w-[260px] flex flex-col",
        "bg-white border-r border-fammi-100",
        "transition-transform duration-300 ease-in-out",
        "md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full",
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-fammi-50">
        <Link href={ROUTES.HOME} className="flex items-center gap-3" onClick={onClose}>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-wallet text-white font-bold text-lg">
            f
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-bold tracking-tight text-text-primary">
              fammi<span className="text-fammi">.</span>
            </span>
            <span className="text-[10px] text-text-secondary">Governance OS</span>
          </div>
        </Link>
        <button
          onClick={onClose}
          className="md:hidden p-1.5 rounded-lg hover:bg-fammi-50 text-text-secondary transition-colors"
          aria-label="Tutup sidebar"
        >
          <X size={16} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-0.5">
        {visibleNav.map(({ href, label, Icon }) => {
          const isActive = href === ROUTES.HOME
            ? pathname === "/"
            : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all",
                isActive
                  ? "bg-fammi text-white shadow-fammi"
                  : "text-text-secondary hover:bg-fammi-100 hover:text-fammi-dark",
              )}
            >
              <Icon
                size={17}
                className={cn(
                  "shrink-0 transition-colors",
                  isActive ? "text-white" : "text-text-secondary",
                )}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Mission callout */}
      <div className="mx-3 mb-3 rounded-[20px] bg-gradient-fammi-soft p-4 text-xs">
        <p className="font-semibold text-fammi-dark mb-0.5">55 dari 4.000 sekolah</p>
        <p className="text-text-secondary leading-relaxed">
          Setiap angka di sini adalah anak yang terlayani.
        </p>
      </div>

      {/* User footer */}
      <div className="px-4 py-4 border-t border-fammi-50 flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-fammi-200 text-fammi text-xs font-bold">
          {user?.name?.[0]?.toUpperCase() ?? "?"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-text-primary truncate">
            {user?.name ?? "—"}
          </p>
          <p className="text-[10px] text-text-secondary truncate">
            {user?.role ?? "—"}
          </p>
        </div>
        <button
          onClick={logout}
          className="p-1.5 rounded-lg text-text-secondary hover:bg-danger/10 hover:text-danger transition-colors"
          aria-label="Logout"
          title="Keluar"
        >
          <LogOut size={14} />
        </button>
      </div>
    </aside>
  );
}
