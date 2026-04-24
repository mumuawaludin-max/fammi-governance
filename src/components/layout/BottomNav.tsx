"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  Building2,
  Globe,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { ROUTES } from "@/lib/constants";

const BOTTOM_ITEMS = [
  { href: ROUTES.HOME, label: "Home", Icon: LayoutDashboard },
  { href: ROUTES.FINANCE, label: "Keuangan", Icon: Wallet },
  { href: ROUTES.OPS, label: "Ops", Icon: Building2 },
  { href: ROUTES.IMPACT, label: "Impact", Icon: Globe },
  { href: ROUTES.AI_BRIEF, label: "AI Brief", Icon: Sparkles },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 flex items-center justify-around border-t border-fammi-100 bg-white/95 backdrop-blur-sm h-16 px-2 md:hidden">
      {BOTTOM_ITEMS.map(({ href, label, Icon }) => {
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
