"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { useOpsData } from "@/hooks/use-ops";
import { OpsStats } from "@/components/ops/OpsStats";
import { OpsPipeline } from "@/components/ops/OpsPipeline";
import { OpsFilters, type TrafficFilter, type ProdukFilter } from "@/components/ops/OpsFilters";
import { OpsSchoolCard } from "@/components/ops/OpsSchoolCard";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import type { DeliveryStage } from "@/types";

const section = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: "easeOut" as const },
  }),
};

export default function OpsPage() {
  const { data: deliveries, isLoading, refresh, lastUpdated } = useOpsData();

  // ── filter state ────────────────────────────────────────────────────────────
  const [traffic, setTraffic] = useState<TrafficFilter>("all");
  const [produk, setProduk] = useState<ProdukFilter>("all");
  const [search, setSearch] = useState("");
  const [showSelesai, setShowSelesai] = useState(false);
  const [activeStage, setActiveStage] = useState<DeliveryStage | null>(null);

  // ── derived list ────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return deliveries.filter((d) => {
      if (!showSelesai && d.deliveryStage === "SELESAI") return false;
      if (activeStage && d.deliveryStage !== activeStage) return false;
      if (traffic !== "all" && d.trafficLight !== traffic) return false;
      if (produk !== "all" && d.produk !== produk) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!d.schoolName.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [deliveries, showSelesai, activeStage, traffic, produk, search]);

  const merahFirst = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const order = { MERAH: 0, KUNING: 1, HIJAU: 2 };
      return order[a.trafficLight] - order[b.trafficLight];
    });
  }, [filtered]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <LoadingSkeleton key={i} variant="stat" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <motion.div custom={0} variants={section} initial="hidden" animate="visible"
        className="flex items-start justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Operasional Sekolah</h1>
          <p className="text-sm text-text-secondary mt-1">
            Pantau progress pengiriman produk ke semua sekolah aktif.
            {lastUpdated && (
              <span className="ml-2 opacity-60">
                Diperbarui {new Date(lastUpdated).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => refresh()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-2xl border border-fammi-100 text-xs text-text-secondary hover:bg-fammi-50 transition-colors shrink-0"
        >
          <RefreshCw size={13} />
          Refresh
        </button>
      </motion.div>

      {/* Stats overview */}
      <motion.div custom={1} variants={section} initial="hidden" animate="visible">
        <OpsStats deliveries={deliveries} />
      </motion.div>

      {/* Pipeline tracker */}
      <motion.div custom={2} variants={section} initial="hidden" animate="visible">
        <OpsPipeline
          deliveries={deliveries}
          activeStage={activeStage}
          onStageClick={setActiveStage}
        />
      </motion.div>

      {/* Filters */}
      <motion.div custom={3} variants={section} initial="hidden" animate="visible">
        <OpsFilters
          traffic={traffic}
          produk={produk}
          search={search}
          showSelesai={showSelesai}
          onTraffic={setTraffic}
          onProduk={setProduk}
          onSearch={setSearch}
          onToggleSelesai={() => setShowSelesai((v) => !v)}
        />
      </motion.div>

      {/* Results header */}
      <motion.div custom={4} variants={section} initial="hidden" animate="visible"
        className="flex items-center justify-between"
      >
        <p className="text-sm text-text-secondary">
          Menampilkan <span className="font-semibold text-text-primary">{merahFirst.length}</span> pengiriman
          {traffic !== "all" || produk !== "all" || search || activeStage
            ? " (difilter)"
            : ""}
        </p>
      </motion.div>

      {/* School cards grid */}
      {merahFirst.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-4xl mb-3">🎉</p>
          <p className="font-semibold text-text-primary">Tidak ada yang perlu dikhawatirkan</p>
          <p className="text-sm text-text-secondary mt-1">Semua sekolah aman dengan filter ini.</p>
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
        >
          {merahFirst.map((d) => (
            <motion.div
              key={d.schoolId}
              variants={{
                hidden: { opacity: 0, y: 10 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
              }}
            >
              <OpsSchoolCard delivery={d} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
