import Link from "next/link";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/cn";

interface NavItem {
  href: string;
  label: string;
  emoji: string;
}

const NAV_ITEMS: ReadonlyArray<NavItem> = [
  { href: ROUTES.HOME, label: "Mission Control", emoji: "🌍" },
  { href: ROUTES.FINANCE, label: "Finance", emoji: "💸" },
  { href: ROUTES.OPERATIONS, label: "Operations", emoji: "🏫" },
  { href: ROUTES.PRODUCT, label: "Product", emoji: "🧪" },
  { href: ROUTES.GROWTH, label: "Growth", emoji: "📈" },
  { href: ROUTES.TEAM, label: "Team", emoji: "💜" },
  { href: ROUTES.IMPACT, label: "Impact", emoji: "🌱" },
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
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-fammi text-white font-bold shadow-fammi"
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
            <span className="text-lg" aria-hidden>
              {item.emoji}
            </span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="mt-auto rounded-[32px] bg-gradient-fammi-soft p-4 text-xs text-text-secondary">
        <p className="font-semibold text-fammi-dark mb-1">
          55 → 4.000 sekolah
        </p>
        <p className="leading-relaxed">
          Setiap angka di sini adalah anak yang terlayani. Mari rawat
          baik-baik.
        </p>
      </div>
    </aside>
  );
}
