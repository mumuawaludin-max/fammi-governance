"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { RefreshCw, WifiOff, List, CalendarDays, BellRing } from "lucide-react";
import { useOpsData } from "@/hooks/use-ops";
import { OpsStats, type StatsFilter } from "@/components/ops/OpsStats";
import { OpsPipeline } from "@/components/ops/OpsPipeline";
import { OpsFilters, type TrafficFilter, type ProdukFilter } from "@/components/ops/OpsFilters";
import { OpsSchoolTable } from "@/components/ops/OpsSchoolTable";
import { OpsCalendar } from "@/components/ops/OpsCalendar";
import { OpsUrgencySection } from "@/components/ops/OpsUrgencySection";
import { OpsSchoolModal } from "@/components/ops/OpsSchoolModal";
import { OpsProductionPanel } from "@/components/ops/OpsProductionPanel";
import { cn } from "@/lib/cn";
import type { DeliveryStage, ISchoolDelivery } from "@/types";

const section = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: "easeOut" as const },
  }),
};

function OpsPageSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="h-14 w-64 rounded-2xl bg-fammi-100" />
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 rounded-[24px] bg-fammi-100" />
        ))}
      </div>
      <div className="h-28 rounded-[32px] bg-fammi-100" />
      <div className="h-48 rounded-[32px] bg-fammi-100" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-48 rounded-card bg-fammi-100" />
        ))}
      </div>
    </div>
  );
}

type TabId = "urgensi" | "daftar" | "kalender";

export default function OpsPage() {
  const { deliveries, summary, source, isLoading, refresh, lastUpdated, hasSiswaData } = useOpsData();

  const [tab, setTab]                   = useState<TabId>("urgensi");
  const [statsFilter, setStatsFilter]   = useState<StatsFilter>("all");
  const [traffic, setTraffic]           = useState<TrafficFilter>("all");
  const [produk, setProduk]             = useState<ProdukFilter>("all");
  const [search, setSearch]             = useState("");
  const [showSelesai, setShowSelesai]   = useState(false);
  const [activeStage, setActiveStage]   = useState<DeliveryStage | null>(null);
  const [refreshing, setRefreshing]     = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<ISchoolDelivery | null>(null);

  // ── Filter derivations ─────────────────────────────────────────────────────

  // Deliveries filtered for the Daftar tab
  const filteredList = useMemo(() => {
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

  // Deliveries filtered for Urgensi tab (stats chip filter)
  const filteredUrgency = useMemo(() => {
    if (statsFilter === "all")     return deliveries;
    if (statsFilter === "merah")   return deliveries.filter((d) => d.trafficLight === "MERAH");
    if (statsFilter === "kuning")  return deliveries.filter((d) => d.trafficLight === "KUNING");
    if (statsFilter === "hijau")   return deliveries.filter((d) => d.trafficLight === "HIJAU" && !d.isComplete);
    if (statsFilter === "selesai") return deliveries.filter((d) => d.isComplete);
    return deliveries;
  }, [deliveries, statsFilter]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function handleRefresh() {
    setRefreshing(true);
    await refresh();
    setTimeout(() => setRefreshing(false), 600);
  }

  function handleStatsFilter(f: StatsFilter) {
    setStatsFilter(f);
    if (tab !== "urgensi") setTab("urgensi");
  }

  const isSeed  = source === "seed";
  const isStale = source === "fammi_operations_stale";

  if (isLoading) return <OpsPageSkeleton />;

  return (
    <>
      <div className="flex flex-col gap-6">

        {/* Seed / stale banner */}
        {(isSeed || isStale) && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "flex items-start gap-3 rounded-2xl border p-4",
              isSeed
                ? "bg-warning/5 border-warning/25 text-warning"
                : "bg-blue-50 border-blue-200 text-blue-600",
            )}
          >
            <WifiOff size={16} className="shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold">
                {isSeed ? "Menampilkan contoh data" : "Data mungkin sudah usang"}
              </p>
              <p className="text-xs opacity-70 mt-0.5">
                {isSeed
                  ? "Belum terhubung ke Google Sheets. Update ID spreadsheet di Apps Script lalu redeploy."
                  : "Tidak bisa refresh dari server. Menampilkan data terakhir yang tersimpan."}
              </p>
            </div>
          </motion.div>
        )}

        {/* Page header */}
        <motion.div
          custom={0} variants={section} initial="hidden" animate="visible"
          className="flex items-start justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Operasional Sekolah</h1>
            <p className="text-sm text-text-secondary mt-1">
              Progress pengiriman produk ke semua sekolah aktif.
              {lastUpdated && (
                <span className="ml-2 opacity-50">
                  Diperbarui {new Date(lastUpdated).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-fammi-100 text-xs font-medium text-text-secondary hover:bg-fammi-50 hover:border-fammi-200 transition-colors shrink-0 disabled:opacity-50"
          >
            <RefreshCw size={13} className={cn(refreshing && "animate-spin")} />
            Refresh
          </button>
        </motion.div>

        {/* Stats – clickable chips */}
        {summary && (
          <motion.div custom={1} variants={section} initial="hidden" animate="visible">
            <OpsStats
              summary={summary}
              activeFilter={statsFilter}
              onFilter={handleStatsFilter}
            />
          </motion.div>
        )}

        {/* Production Panel */}
        <motion.div custom={2} variants={section} initial="hidden" animate="visible">
          <OpsProductionPanel
            deliveries={deliveries}
            hasSiswaData={hasSiswaData}
          />
        </motion.div>

        {/* Pipeline */}
        <motion.div custom={3} variants={section} initial="hidden" animate="visible">
          <OpsPipeline
            deliveries={deliveries}
            activeStage={activeStage}
            onStageClick={(stage) => {
              setActiveStage(stage);
              setTab("daftar"); // pindah ke tab Semua agar filter terlihat
              // SELESAI stage butuh showSelesai=true supaya tidak langsung difilter
              if (stage === "SELESAI") setShowSelesai(true);
            }}
          />
        </motion.div>

        {/* Tabs */}
        <motion.div custom={4} variants={section} initial="hidden" animate="visible">
          <div className="flex items-center gap-1 p-1 bg-fammi-50 rounded-2xl w-fit">
            {([
              { id: "urgensi",  label: "Urgensi",   icon: BellRing },
              { id: "daftar",   label: "Semua",      icon: List },
              { id: "kalender", label: "Kalender",   icon: CalendarDays },
            ] as { id: TabId; label: string; icon: React.ElementType }[]).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all",
                  tab === id
                    ? "bg-white text-fammi shadow-sm"
                    : "text-text-secondary hover:text-text-primary",
                )}
              >
                <Icon size={13} />
                {label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Tab content */}
        {tab === "kalender" ? (
          <motion.div custom={4} variants={section} initial="hidden" animate="visible">
            <OpsCalendar deliveries={deliveries} />
          </motion.div>
        ) : tab === "urgensi" ? (
          <motion.div custom={4} variants={section} initial="hidden" animate="visible">
            {statsFilter !== "all" && (
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-text-secondary">
                  Filter aktif:{" "}
                  <span className="font-semibold text-text-primary">
                    {statsFilter === "merah"   ? "Butuh Perhatian" :
                     statsFilter === "kuning"  ? "Perlu Dipantau"  :
                     statsFilter === "hijau"   ? "Tepat Jadwal"    : "Selesai"}
                  </span>
                  {" "}· {filteredUrgency.length} sekolah
                </p>
                <button
                  onClick={() => setStatsFilter("all")}
                  className="text-xs text-fammi underline underline-offset-2"
                >
                  Hapus filter
                </button>
              </div>
            )}
            <OpsUrgencySection
              deliveries={filteredUrgency}
              onSchoolClick={setSelectedSchool}
            />
          </motion.div>
        ) : (
          <>
            {/* Filters */}
            <motion.div custom={4} variants={section} initial="hidden" animate="visible">
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

            {/* Results count */}
            <motion.div custom={5} variants={section} initial="hidden" animate="visible"
              className="flex items-center justify-between"
            >
              <p className="text-sm text-text-secondary">
                Menampilkan{" "}
                <span className="font-semibold text-text-primary">{filteredList.length}</span> pengiriman
                {(traffic !== "all" || produk !== "all" || search || activeStage) && " (difilter)"}
              </p>
              {activeStage && (
                <button
                  onClick={() => setActiveStage(null)}
                  className="text-xs text-fammi underline underline-offset-2"
                >
                  Hapus filter tahap
                </button>
              )}
            </motion.div>

            {/* Table */}
            {filteredList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-4xl mb-3">🎉</p>
                <p className="font-semibold text-text-primary">Tidak ada yang perlu dikhawatirkan</p>
                <p className="text-sm text-text-secondary mt-1">Semua sekolah aman dengan filter ini.</p>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <OpsSchoolTable
                  deliveries={filteredList}
                  onSchoolClick={setSelectedSchool}
                />
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* School detail modal */}
      <OpsSchoolModal
        delivery={selectedSchool}
        onClose={() => setSelectedSchool(null)}
      />
    </>
  );
}
