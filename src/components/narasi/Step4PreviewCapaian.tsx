"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import type { ICapaianFormState, ICapaianOutputRow, ICapaianPembukaRow, ICapaian100Row, ICapaianTKB100Row, ICapaian0Row } from "@/types/narasi";

interface Step4PreviewCapaianProps {
  state: ICapaianFormState;
  onApprove: () => void;
  onRegenerate: () => void;
  onBack: () => void;
}

type TabKey = string;

function SearchInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative max-w-xs">
      <svg viewBox="0 0 24 24" fill="none" className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary" stroke="currentColor" strokeWidth={2}>
        <path d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Cari..."
        className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-fammi-100 bg-white focus:outline-none focus:ring-2 focus:ring-fammi/20 focus:border-fammi transition-all"
      />
    </div>
  );
}

function CapaianTable({ rows, search }: { rows: ICapaianOutputRow[]; search: string }) {
  const filtered = rows.filter((r) =>
    !search || Object.values(r).some((v) => v.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="overflow-x-auto rounded-2xl border border-fammi-100">
      <table className="w-full text-xs border-collapse min-w-[900px]">
        <thead>
          <tr className="bg-fammi-50">
            {["Elemen", "Tujuan Pembelajaran", "Indikator", "Deskripsi BSB/BSH", "Deskripsi MB/BB", "Solusi di Rumah"].map((h) => (
              <th key={h} className="text-left px-3 py-2.5 font-semibold text-text-primary border-b border-fammi-100 whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-3 py-6 text-center text-text-secondary">Tidak ada data yang cocok</td>
            </tr>
          ) : (
            filtered.map((row, i) => (
              <tr key={i} className="border-b border-fammi-50 hover:bg-fammi-50/30 transition-colors">
                <td className="px-3 py-2.5 font-medium text-fammi-dark whitespace-nowrap">{row.elemen}</td>
                <td className="px-3 py-2.5 text-text-secondary max-w-[200px]">{row.tujuanPembelajaran || "-"}</td>
                <td className="px-3 py-2.5 text-text-secondary max-w-[200px]">{row.indikator}</td>
                <td className="px-3 py-2.5 text-text-secondary max-w-[250px]">{row.deskripsiBSBBSH}</td>
                <td className="px-3 py-2.5 text-text-secondary max-w-[250px]">{row.deskripsiMBBB}</td>
                <td className="px-3 py-2.5 text-text-secondary max-w-[250px]">{row.solusiRumah}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <div className="px-3 py-2 border-t border-fammi-50 text-[10px] text-text-secondary">
        {filtered.length} baris{search ? ` (dari ${rows.length})` : ""}
      </div>
    </div>
  );
}

function PembukaTable({ rows, search }: { rows: ICapaianPembukaRow[]; search: string }) {
  const filtered = rows.filter((r) =>
    !search || Object.values(r).some((v) => v.toLowerCase().includes(search.toLowerCase()))
  );
  return (
    <div className="overflow-x-auto rounded-2xl border border-fammi-100">
      <table className="w-full text-xs border-collapse min-w-[700px]">
        <thead>
          <tr className="bg-fammi-50">
            {["Nama Elemen", "Rentang Skor", "Kalimat Pembuka", "Kalimat Penutup"].map((h) => (
              <th key={h} className="text-left px-3 py-2.5 font-semibold text-text-primary border-b border-fammi-100">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map((row, i) => (
            <tr key={i} className="border-b border-fammi-50 hover:bg-fammi-50/30 transition-colors">
              <td className="px-3 py-2.5 font-medium text-fammi-dark whitespace-nowrap">{row.namaElemen}</td>
              <td className="px-3 py-2.5 whitespace-nowrap">
                <span className="px-2 py-0.5 rounded-full bg-fammi-100 text-fammi text-[10px] font-semibold">{row.rentangSkor}</span>
              </td>
              <td className="px-3 py-2.5 text-text-secondary max-w-[280px]">{row.kalimatPembuka}</td>
              <td className="px-3 py-2.5 text-text-secondary max-w-[280px]">{row.kalimatPenutup}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="px-3 py-2 border-t border-fammi-50 text-[10px] text-text-secondary">
        {filtered.length} baris
      </div>
    </div>
  );
}

function Narasi100Table({ rows, search }: { rows: ICapaian100Row[]; search: string }) {
  const filtered = rows.filter((r) =>
    !search || Object.values(r).some((v) => v.toLowerCase().includes(search.toLowerCase()))
  );
  return (
    <div className="overflow-x-auto rounded-2xl border border-fammi-100">
      <table className="w-full text-xs border-collapse min-w-[700px]">
        <thead>
          <tr className="bg-success/5">
            {["Name", "Ganti dilatih pelan-pelan jadi:", "Ide sederhana di rumah:"].map((h) => (
              <th key={h} className="text-left px-3 py-2.5 font-semibold text-text-primary border-b border-fammi-100">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map((row, i) => (
            <tr key={i} className="border-b border-fammi-50 hover:bg-success/5 transition-colors">
              <td className="px-3 py-2.5 font-medium text-success whitespace-nowrap">{row.namaElemen}</td>
              <td className="px-3 py-2.5 text-text-secondary max-w-[280px]">{row.narasiCapaian}</td>
              <td className="px-3 py-2.5 text-text-secondary max-w-[280px]">{row.ideSederhana}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="px-3 py-2 border-t border-fammi-50 text-[10px] text-text-secondary">{filtered.length} baris</div>
    </div>
  );
}

function NarasiTKB100Table({ rows, search }: { rows: ICapaianTKB100Row[]; search: string }) {
  const filtered = rows.filter((r) =>
    !search || Object.values(r).some((v) => v.toLowerCase().includes(search.toLowerCase()))
  );
  return (
    <div className="overflow-x-auto rounded-2xl border border-fammi-100">
      <table className="w-full text-xs border-collapse min-w-[700px]">
        <thead>
          <tr className="bg-fammi-50">
            {["Name", "Perlu dilatih pelan2", "Fokus pendampingan"].map((h) => (
              <th key={h} className="text-left px-3 py-2.5 font-semibold text-text-primary border-b border-fammi-100">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map((row, i) => (
            <tr key={i} className="border-b border-fammi-50 hover:bg-fammi-50/30 transition-colors">
              <td className="px-3 py-2.5 font-medium text-fammi whitespace-nowrap">{row.namaElemen}</td>
              <td className="px-3 py-2.5 text-text-secondary max-w-[280px]">{row.perluDilatih}</td>
              <td className="px-3 py-2.5 text-text-secondary max-w-[280px]">{row.fokusEndampingan}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="px-3 py-2 border-t border-fammi-50 text-[10px] text-text-secondary">{filtered.length} baris</div>
    </div>
  );
}

function Narasi0Table({ rows, search }: { rows: ICapaian0Row[]; search: string }) {
  const filtered = rows.filter((r) =>
    !search || Object.values(r).some((v) => v.toLowerCase().includes(search.toLowerCase()))
  );
  return (
    <div className="overflow-x-auto rounded-2xl border border-fammi-100">
      <table className="w-full text-xs border-collapse min-w-[700px]">
        <thead>
          <tr className="bg-warning/5">
            {["Elemen", "Total", "Masih", "Hal-hal baik yang sudah terlihat"].map((h) => (
              <th key={h} className="text-left px-3 py-2.5 font-semibold text-text-primary border-b border-fammi-100">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map((row, i) => (
            <tr key={i} className="border-b border-fammi-50 hover:bg-warning/5 transition-colors">
              <td className="px-3 py-2.5 font-medium text-warning whitespace-nowrap">{row.elemen}</td>
              <td className="px-3 py-2.5 whitespace-nowrap">
                <span className="px-2 py-0.5 rounded-full bg-warning/10 text-warning text-[10px] font-semibold">{row.total}</span>
              </td>
              <td className="px-3 py-2.5 text-text-secondary whitespace-nowrap">{row.masih}</td>
              <td className="px-3 py-2.5 text-text-secondary">{row.halHalBaik}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="px-3 py-2 border-t border-fammi-50 text-[10px] text-text-secondary">{filtered.length} baris</div>
    </div>
  );
}

export function Step4PreviewCapaian({ state, onApprove, onRegenerate, onBack }: Step4PreviewCapaianProps) {
  const data = state.previewData!;
  const [search, setSearch] = useState("");

  const allTabs: { key: TabKey; label: string }[] = [
    ...data.levelSections.map((s) => ({ key: s.levelName, label: s.levelName })),
    { key: "NARASI PEMBUKA PENUTUP", label: "NARASI PEMBUKA PENUTUP" },
    { key: "NARASI 100% TERCAPAI", label: "NARASI 100% TERCAPAI" },
    ...(data.narasiTKB100Data && data.narasiTKB100Data.length > 0
      ? [{ key: "NARASI CAPAIAN TK B 100%", label: "NARASI CAPAIAN TK B 100%" }]
      : []),
    { key: "NARASI SEMUA 0%", label: "NARASI SEMUA 0%" },
  ];

  const [activeTab, setActiveTab] = useState<TabKey>(allTabs[0]?.key ?? "");

  return (
    <div className="flex flex-col gap-6">
      {/* Header info */}
      <div>
        <h2 className="text-base font-bold text-text-primary">Preview Narasi</h2>
        <p className="text-xs text-text-secondary mt-1">
          Review hasil generate sebelum export. Pastikan narasi sudah sesuai sebelum klik Approve.
        </p>
      </div>

      {/* Metadata summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label: "Sekolah", value: state.namaSekolah || "-" },
          { label: "Jenjang", value: state.jenjang || "-" },
          { label: "Level / Kelas", value: (state.jenjang === "DAYCARE" ? ["Daycare"] : state.levelList).join(", ") || "-" },
          { label: "Nada Narasi", value: state.narrativeTone === "islami" ? "Islami" : "General" },
          { label: "Total Elemen", value: `${state.parsedWorkbook?.elemenList.length ?? 0} elemen` },
          { label: "Total Indikator", value: `${state.parsedWorkbook?.rowCount ?? 0} indikator` },
        ].map((item) => (
          <div key={item.label} className="bg-fammi-50 rounded-2xl p-3 border border-fammi-100">
            <p className="text-[10px] text-text-secondary">{item.label}</p>
            <p className="text-xs font-semibold text-text-primary mt-0.5 truncate">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {allTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "px-3 py-1.5 rounded-full text-[10px] font-semibold border transition-all whitespace-nowrap",
              activeTab === tab.key
                ? "bg-fammi text-white border-fammi"
                : "border-fammi-100 text-text-secondary hover:border-fammi-200 bg-white",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs font-semibold text-text-primary">{activeTab}</p>
        <SearchInput value={search} onChange={setSearch} />
      </div>

      {/* Table content */}
      {data.levelSections.map((section) =>
        activeTab === section.levelName ? (
          <CapaianTable key={section.levelName} rows={section.rows} search={search} />
        ) : null
      )}

      {activeTab === "NARASI PEMBUKA PENUTUP" && (
        <PembukaTable rows={data.narasiPembukaData} search={search} />
      )}
      {activeTab === "NARASI 100% TERCAPAI" && (
        <Narasi100Table rows={data.narasi100Data} search={search} />
      )}
      {activeTab === "NARASI CAPAIAN TK B 100%" && data.narasiTKB100Data && (
        <NarasiTKB100Table rows={data.narasiTKB100Data} search={search} />
      )}
      {activeTab === "NARASI SEMUA 0%" && (
        <Narasi0Table rows={data.narasi0Data} search={search} />
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-fammi-100 text-xs font-medium text-text-secondary hover:bg-fammi-50 transition-all"
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth={2.5}>
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Kembali
          </button>
          <button
            type="button"
            onClick={onRegenerate}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-fammi-200 text-xs font-semibold text-fammi hover:bg-fammi-50 transition-all"
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth={2}>
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Regenerate
          </button>
        </div>
        <button
          type="button"
          onClick={onApprove}
          className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-success text-white text-sm font-semibold shadow-md hover:bg-success/90 transition-all"
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2.5}>
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Approve &amp; Lanjut Export
        </button>
      </div>
    </div>
  );
}
