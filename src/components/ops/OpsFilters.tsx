import { Search, X } from "lucide-react";
import { cn } from "@/lib/cn";
import type { TrafficLight, ProductKind } from "@/types";

export type TrafficFilter = "all" | TrafficLight;
export type ProdukFilter = "all" | ProductKind;

const TRAFFIC_CHIPS: { key: TrafficFilter; label: string; color: string; active: string }[] = [
  { key: "all", label: "Semua", color: "text-text-secondary", active: "bg-fammi text-white" },
  { key: "MERAH", label: "Butuh Perhatian", color: "text-danger", active: "bg-danger text-white" },
  { key: "KUNING", label: "At Risk", color: "text-warning", active: "bg-warning text-white" },
  { key: "HIJAU", label: "On Track", color: "text-success", active: "bg-success text-white" },
];

const PRODUK_CHIPS: { key: ProdukFilter; label: string }[] = [
  { key: "all", label: "Semua Produk" },
  { key: "RAPOR_KARAKTER", label: "Rapor Karakter" },
  { key: "SCREENING", label: "Screening" },
  { key: "RAPOR_PAUD", label: "Rapor PAUD" },
];

interface OpsFiltersProps {
  traffic: TrafficFilter;
  produk: ProdukFilter;
  search: string;
  showSelesai: boolean;
  onTraffic: (v: TrafficFilter) => void;
  onProduk: (v: ProdukFilter) => void;
  onSearch: (v: string) => void;
  onToggleSelesai: () => void;
}

export function OpsFilters({
  traffic, produk, search, showSelesai,
  onTraffic, onProduk, onSearch, onToggleSelesai,
}: OpsFiltersProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
        <input
          type="text"
          placeholder="Cari nama sekolah..."
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          className={cn(
            "w-full rounded-2xl border border-fammi-100 bg-white",
            "pl-9 pr-9 py-2.5 text-sm text-text-primary",
            "placeholder:text-text-secondary/60",
            "focus:outline-none focus:ring-2 focus:ring-fammi/30 focus:border-fammi",
            "transition-all",
          )}
        />
        {search && (
          <button
            onClick={() => onSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Traffic light chips */}
      <div className="flex flex-wrap gap-2">
        {TRAFFIC_CHIPS.map((chip) => (
          <button
            key={chip.key}
            onClick={() => onTraffic(chip.key)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
              traffic === chip.key
                ? chip.active
                : cn("bg-white border-fammi-100", chip.color, "hover:border-fammi-200"),
            )}
          >
            {chip.label}
          </button>
        ))}
        <button
          onClick={onToggleSelesai}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
            showSelesai
              ? "bg-text-primary text-white border-text-primary"
              : "bg-white border-fammi-100 text-text-secondary hover:border-fammi-200",
          )}
        >
          Tampilkan Selesai
        </button>
      </div>

      {/* Produk chips */}
      <div className="flex flex-wrap gap-2">
        {PRODUK_CHIPS.map((chip) => (
          <button
            key={chip.key}
            onClick={() => onProduk(chip.key)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
              produk === chip.key
                ? "bg-fammi-100 text-fammi border-fammi-200"
                : "bg-white border-fammi-100 text-text-secondary hover:border-fammi-200",
            )}
          >
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  );
}
