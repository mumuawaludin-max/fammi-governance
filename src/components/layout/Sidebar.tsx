"use client";

import Image from "next/image";
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
  ChevronRight,
  Truck,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { ROUTES } from "@/lib/constants";
import { useAppStore } from "@/stores/app-store";
import type { MenuKey } from "@/types";

// Sub-menu items per parent route
const OPS_SUB_ITEMS: { href: string; label: string; Icon: React.ElementType; exact?: boolean }[] = [
  { href: ROUTES.OPS, label: "Pengiriman Rapor Sekolah", Icon: Truck, exact: true },
  { href: ROUTES.OPS_NARASI_GENERATOR, label: "Narasi Generator", Icon: Sparkles },
];

// permKey harus match MenuKey → IUserPermissions keys
const NAV_ITEMS: {
  href: string;
  label: string;
  Icon: React.ElementType;
  permKey: MenuKey;
  subItems?: { href: string; label: string; Icon: React.ElementType; exact?: boolean }[];
}[] = [
  { href: ROUTES.HOME,    label: "Mission Control", Icon: LayoutDashboard, permKey: "missionControl" },
  { href: ROUTES.OPS,     label: "Operasional",     Icon: Building2,       permKey: "operasional", subItems: OPS_SUB_ITEMS },
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
          <Image
            src="/logo-fammi.png"
            alt="Fammi"
            width={36}
            height={36}
            className="rounded-xl"
            priority
          />
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-bold tracking-tight text-text-primary">
              Fammi
            </span>
            <span className="text-[10px] text-text-secondary">Fammi Performance</span>
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
        {visibleNav.map(({ href, label, Icon, subItems }) => {
          const isParentActive = href === ROUTES.HOME
            ? pathname === "/"
            : pathname.startsWith(href);

          // Show sub-items when parent is active and has sub-items
          const showSub = isParentActive && subItems && subItems.length > 0;

          return (
            <div key={href}>
              <Link
                href={href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all",
                  isParentActive
                    ? "bg-fammi text-white shadow-fammi"
                    : "text-text-secondary hover:bg-fammi-100 hover:text-fammi-dark",
                )}
              >
                <Icon
                  size={17}
                  className={cn(
                    "shrink-0 transition-colors",
                    isParentActive ? "text-white" : "text-text-secondary",
                  )}
                />
                <span className="flex-1">{label}</span>
                {subItems && (
                  <ChevronRight
                    size={13}
                    className={cn(
                      "transition-transform duration-200",
                      isParentActive ? "text-white/70 rotate-90" : "text-text-secondary/50",
                    )}
                  />
                )}
              </Link>

              {/* Sub-menu */}
              {showSub && (
                <div className="mt-0.5 ml-4 pl-3 border-l-2 border-fammi-200 flex flex-col gap-0.5">
                  {subItems.map(({ href: subHref, label: subLabel, Icon: SubIcon, exact }) => {
                    const isSubActive = exact ? pathname === subHref : pathname.startsWith(subHref);
                    return (
                      <Link
                        key={subHref}
                        href={subHref}
                        onClick={onClose}
                        className={cn(
                          "flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all",
                          isSubActive
                            ? "bg-fammi-100 text-fammi font-semibold"
                            : "text-text-secondary hover:bg-fammi-50 hover:text-fammi-dark",
                        )}
                      >
                        <SubIcon
                          size={14}
                          className={cn(
                            "shrink-0",
                            isSubActive ? "text-fammi" : "text-text-secondary",
                          )}
                        />
                        {subLabel}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

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
