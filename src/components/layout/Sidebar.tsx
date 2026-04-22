import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/cn";
import {
  IconGlobe,
  IconWallet,
  IconBuilding,
  IconFlask,
  IconTrendingUp,
  IconHeart,
  IconSprout,
} from "@/components/ui/icons";
import type { SVGProps } from "react";

type IconComponent = (props: SVGProps<SVGSVGElement> & { size?: number }) => JSX.Element;

interface NavItem {
  href: string;
  label: string;
  Icon: IconComponent;
}

const NAV_ITEMS: ReadonlyArray<NavItem> = [
  { href: ROUTES.HOME, label: "Mission Control", Icon: IconGlobe },
  { href: ROUTES.FINANCE, label: "Finance", Icon: IconWallet },
  { href: ROUTES.OPERATIONS, label: "Operations", Icon: IconBuilding },
  { href: ROUTES.PRODUCT, label: "Product", Icon: IconFlask },
  { href: ROUTES.GROWTH, label: "Growth", Icon: IconTrendingUp },
  { href: ROUTES.TEAM, label: "Team", Icon: IconHeart },
  { href: ROUTES.IMPACT, label: "Impact", Icon: IconSprout },
];

export function Sidebar({ className }: { className?: string }) {
  return (
    <aside
      className={cn(
        "hidden md:flex md:flex-col gap-6 w-64 shrink-0 p-6",
        "sticky top-0 h-screen",
        className,
      )}
    >
      <Link
        href={ROUTES.HOME}
        className="flex items-center gap-3 px-2"
        aria-label="Fammi Governance OS"
      >
        <span
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-fammi text-white font-bold"
          aria-hidden
        >
          F
        </span>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-bold tracking-tight text-text-primary">
            Fammi
          </span>
          <span className="text-[11px] text-text-secondary">
            Governance OS
          </span>
        </div>
      </Link>

      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group flex items-center gap-3 rounded-2xl px-3 py-2.5",
              "text-sm font-medium text-text-secondary",
              "transition-all hover:bg-fammi-100 hover:text-fammi-dark",
            )}
          >
            <item.Icon
              size={17}
              className="shrink-0 text-text-secondary group-hover:text-fammi transition-colors"
            />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="mt-auto rounded-[32px] bg-gradient-fammi-soft p-4 text-xs text-text-secondary">
        <p className="font-semibold text-fammi-dark mb-1">
          55 dari 4.000 sekolah
        </p>
        <p className="leading-relaxed">
          Setiap angka di sini adalah anak yang terlayani.
        </p>
      </div>
    </aside>
  );
}
