"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Wallet,
  Globe,
  Heart,
  Layers,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { ROUTES } from "@/lib/constants";
import { useAppStore } from "@/stores/app-store";
import type { MenuKey } from "@/types";

const ALL_BOTTOM_ITEMS: {
  href: string;
  label: string;
  Icon: React.ElementType;
  permKey: MenuKey;
}[] = [
  { href: ROUTES.HOME,    label: "Home",     Icon: LayoutDashboard, permKey: "missionControl" },
  { href: ROUTES.OPS,     label: "Ops",      Icon: Building2,       permKey: "operasional"    },
  { href: ROUTES.FINANCE, label: "Keuangan", Icon: Wallet,          permKey: "keuangan"       },
  { href: ROUTES.PRODUCT, label: "Produk",   Icon: Layers,          permKey: "produk"         },
  { href: ROUTES.GROWTH,  label: "Growth",   Icon: TrendingUp,      permKey: "salesGrowth"    },
  { href: ROUTES.TEAM,    label: "Tim",      Icon: Heart,           permKey: "tim"            },
  { href: ROUTES.IMPACT,  label: "Impact",   Icon: Globe,           permKey: "impact"         },
];

export function BottomNav() {
  const pathname = usePathname();
  const user     = useAppStore((s) => s.user);

  // Filter sesuai permission, maks 5 item supaya tidak penuh
  const items = (
    user
      ? ALL_BOTTOM_ITEMS.filter((i) => user.permissions[i.permKey] === true)
      : []
  ).slice(0, 5);

  if (items.length === 0) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 flex items-center justify-around border-t border-fammi-100 bg-white/95 backdrop-blur-sm h-16 px-2 md:hidden">
      {items.map(({ href, label, Icon }) => {
        const isActive = href === ROUTES.HOME ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors"
          >
            <Icon
              size={20}
              className={cn(
                "transition-colors",
                isActive ? "text-fammi" : "text-text-secondary",
              )}
            />
            <span
              className={cn(
                "text-[10px] font-medium",
                isActive ? "text-fammi" : "text-text-secondary",
              )}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
