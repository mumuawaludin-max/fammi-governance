"use client";

import { useState, useRef } from "react";
import { cn } from "@/lib/cn";
import type {
  ICapaianFormState,
  ICapaianOutputRow,
  ICapaianPembukaRow,
  ICapaian100Row,
  ICapaian0Row,
} from "@/types/narasi";

export interface CellUpdateHandler {
  updateCapaian: (levelName: string, rowIdx: number, field: keyof ICapaianOutputRow, val: string) => void;
  regenCapaian: (levelName: string, rowIdx: number) => Promise<void>;
  updatePembuka: (rowIdx: number, field: "kalimatPembuka" | "kalimatPenutup", val: string) => void;
  regenPembuka: (rowIdx: number) => Promise<void>;
  update100: (levelName: string, rowIdx: number, field: "narasiCapaian" | "ideSederhana", val: string) => void;
  regen100: (levelName: string, rowIdx: number) => Promise<void>;
  update0: (levelName: string, rowIdx: number, val: string) => void;
  regen0: (levelName: string, rowIdx: number) => Promise<void>;
}

interface Step4PreviewCapaianProps {
  state: ICapaianFormState;
  onApprove: () => void;
  onRegenerate: () => void;
  onBack: () => void;
  handlers: CellUpdateHandler;
}

type TabKey = string;

// ── Shared primitives ────────────────────────────────────────

function SearchInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative max-w-xs">
      <svg viewBox="0 0 24 24" fill="none" className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary" stroke="currentColor" strokeWidth={2}>
        <path d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder="Cari..."
        className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-fammi-100 bg-white focus:outline-none focus:ring-2 focus:ring-fammi/20 focus:border-fammi transition-all"
      />
    </div>
  );
}

function EditableCell({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  function open() { setEditing(true); setTimeout(() => ref.current?.focus(), 0); }
  function commit(e: React.FocusEvent<HTMLTextAreaElement>) { onChange(e.target.value); setEditing(false); }

  if (editing) {
    return (
      <textarea ref={ref} defaultValue={value} onBlur={commit} rows={4}
        className="w-full min-w-[180px] text-xs text-text-secondary p-1.5 rounded-xl border border-fammi focus:outline-none focus:ring-2 focus:ring-fammi/20 resize-y bg-fammi-50"
      />
    );
  }
  return (
    <div onClick={open} title="Klik untuk edit"
      className="cursor-text group relative min-h-[36px] rounded-xl px-1.5 py-1 hover:bg-fammi-50 transition-colors"
    >
      <span className="text-text-secondary text-xs">{value || "-"}</span>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
        className="absolute top-1 right-1 w-3 h-3 text-fammi opacity-0 group-hover:opacity-60 transition-opacity"
      >
        <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function RegenBtn({ loading, disabled, onClick }: { loading: boolean; disabled: boolean; onClick: () => void }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick} title="Regenerate baris ini"
      className={cn(
        "inline-flex items-center justify-center w-7 h-7 rounded-full border border-fammi-100 text-fammi hover:bg-fammi-50 transition-all shrink-0",
        loading && "animate-spin border-fammi",
        disabled && !loading && "opacity-40 cursor-not-allowed",
      )}
    >
      <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth={2}>
        <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

// ── Tables ───────────────────────────────────────────────────

const CAPAIAN_FIELDS: (keyof ICapaianOutputRow)[] = ["deskripsiBSBBSH", "deskripsiMBBB", "solusiRumah"];

function CapaianTable({
  rows, search,
  onUpdateCell, onRegenerateRow,
}: {
  rows: ICapaianOutputRow[];
  search: string;
  onUpdateCell: (rowIdx: number, field: keyof ICapaianOutputRow, val: string) => void;
  onRegenerateRow: (rowIdx: number) => Promise<void>;
}) {
  const [regeningIdx, setRegeningIdx] = useState<number | null>(null);

  const shown = rows.map((r, i) => ({ r, i })).filter(
    ({ r }) => !search || Object.values(r).some((v) => v.toLowerCase().includes(search.toLowerCase()))
  );

  async function handleRegen(i: number) {
    setRegeningIdx(i);
    try { await onRegenerateRow(i); } finally { setRegeningIdx(null); }
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-fammi-100">
      <table className="w-full text-xs border-collapse min-w-[1000px]">
        <thead>
          <tr className="bg-fammi-50">
            {["Elemen", "Tujuan Pembelajaran", "Indikator", "Deskripsi BSB/BSH", "Deskripsi MB/BB", "Solusi di Rumah", ""].map((h) => (
              <th key={h} className="text-left px-3 py-2.5 font-semibold text-text-primary border-b border-fammi-100 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {shown.length === 0 ? (
            <tr><td colSpan={7} className="px-3 py-6 text-center text-text-secondary">Tidak ada data yang cocok</td></tr>
          ) : shown.map(({ r: row, i }) => (
            <tr key={i} className={cn("border-b border-fammi-50 transition-colors", regeningIdx === i ? "opacity-50 bg-fammi-50/60" : "hover:bg-fammi-50/30")}>
              <td className="px-3 py-2.5 font-medium text-fammi-dark whitespace-nowrap">{row.elemen}</td>
              <td className="px-3 py-2.5 text-text-secondary max-w-[160px]">{row.tujuanPembelajaran || "-"}</td>
              <td className="px-3 py-2.5 text-text-secondary max-w-[160px]">{row.indikator}</td>
              {CAPAIAN_FIELDS.map((field) => (
                <td key={field} className="px-1.5 py-1.5 max-w-[220px]">
                  <EditableCell value={row[field] as string} onChange={(v) => onUpdateCell(i, field, v)} />
                </td>
              ))}
              <td className="px-3 py-2.5 text-center">
                <RegenBtn loading={regeningIdx === i} disabled={regeningIdx !== null} onClick={() => handleRegen(i)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="px-3 py-2 border-t border-fammi-50 text-[10px] text-text-secondary">
        {shown.length} baris{search ? ` (dari ${rows.length})` : ""}
      </div>
    </div>
  );
}

function PembukaTable({
  rows, search,
  onUpdateCell, onRegenerateRow,
}: {
  rows: ICapaianPembukaRow[];
  search: string;
  onUpdateCell: (rowIdx: number, field: "kalimatPembuka" | "kalimatPenutup", val: string) => void;
  onRegenerateRow: (rowIdx: number) => Promise<void>;
}) {
  const [regeningIdx, setRegeningIdx] = useState<number | null>(null);

  const shown = rows.map((r, i) => ({ r, i })).filter(
    ({ r }) => !search || Object.values(r).some((v) => v.toLowerCase().includes(search.toLowerCase()))
  );

  async function handleRegen(i: number) {
    setRegeningIdx(i);
    try { await onRegenerateRow(i); } finally { setRegeningIdx(null); }
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-fammi-100">
      <table className="w-full text-xs border-collapse min-w-[700px]">
        <thead>
          <tr className="bg-fammi-50">
            {["Nama Elemen", "Rentang Skor", "Kalimat Pembuka", "Kalimat Penutup", ""].map((h) => (
              <th key={h} className="text-left px-3 py-2.5 font-semibold text-text-primary border-b border-fammi-100 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {shown.map(({ r: row, i }) => (
            <tr key={i} className={cn("border-b border-fammi-50 transition-colors", regeningIdx === i ? "opacity-50 bg-fammi-50/60" : "hover:bg-fammi-50/30")}>
              <td className="px-3 py-2.5 font-medium text-fammi-dark whitespace-nowrap">{row.namaElemen}</td>
              <td className="px-3 py-2.5 whitespace-nowrap">
                <span className="px-2 py-0.5 rounded-full bg-fammi-100 text-fammi text-[10px] font-semibold">{row.rentangSkor}</span>
              </td>
              <td className="px-1.5 py-1.5 max-w-[260px]">
                <EditableCell value={row.kalimatPembuka} onChange={(v) => onUpdateCell(i, "kalimatPembuka", v)} />
              </td>
              <td className="px-1.5 py-1.5 max-w-[260px]">
                <EditableCell value={row.kalimatPenutup} onChange={(v) => onUpdateCell(i, "kalimatPenutup", v)} />
              </td>
              <td className="px-3 py-2.5 text-center">
                <RegenBtn loading={regeningIdx === i} disabled={regeningIdx !== null} onClick={() => handleRegen(i)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="px-3 py-2 border-t border-fammi-50 text-[10px] text-text-secondary">{shown.length} baris</div>
    </div>
  );
}

function Narasi100Table({
  rows, search,
  onUpdateCell, onRegenerateRow,
}: {
  rows: ICapaian100Row[];
  search: string;
  onUpdateCell: (rowIdx: number, field: "narasiCapaian" | "ideSederhana", val: string) => void;
  onRegenerateRow: (rowIdx: number) => Promise<void>;
}) {
  const [regeningIdx, setRegeningIdx] = useState<number | null>(null);

  const shown = rows.map((r, i) => ({ r, i })).filter(
    ({ r }) => !search || Object.values(r).some((v) => v.toLowerCase().includes(search.toLowerCase()))
  );

  async function handleRegen(i: number) {
    setRegeningIdx(i);
    try { await onRegenerateRow(i); } finally { setRegeningIdx(null); }
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-fammi-100">
      <table className="w-full text-xs border-collapse min-w-[700px]">
        <thead>
          <tr className="bg-success/5">
            {["Elemen", "Narasi Capaian Optimal", "Ide Pendampingan di Rumah", ""].map((h) => (
              <th key={h} className="text-left px-3 py-2.5 font-semibold text-text-primary border-b border-fammi-100 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {shown.map(({ r: row, i }) => (
            <tr key={i} className={cn("border-b border-fammi-50 transition-colors", regeningIdx === i ? "opacity-50 bg-success/10" : "hover:bg-success/5")}>
              <td className="px-3 py-2.5 font-medium text-success whitespace-nowrap">{row.namaElemen}</td>
              <td className="px-1.5 py-1.5 max-w-[280px]">
                <EditableCell value={row.narasiCapaian} onChange={(v) => onUpdateCell(i, "narasiCapaian", v)} />
              </td>
              <td className="px-1.5 py-1.5 max-w-[280px]">
                <EditableCell value={row.ideSederhana} onChange={(v) => onUpdateCell(i, "ideSederhana", v)} />
              </td>
              <td className="px-3 py-2.5 text-center">
                <RegenBtn loading={regeningIdx === i} disabled={regeningIdx !== null} onClick={() => handleRegen(i)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="px-3 py-2 border-t border-fammi-50 text-[10px] text-text-secondary">{shown.length} baris</div>
    </div>
  );
}

function Narasi0Table({
  rows, search,
  onUpdateCell, onRegenerateRow,
}: {
  rows: ICapaian0Row[];
  search: string;
  onUpdateCell: (rowIdx: number, val: string) => void;
  onRegenerateRow: (rowIdx: number) => Promise<void>;
}) {
  const [regeningIdx, setRegeningIdx] = useState<number | null>(null);

  const shown = rows.map((r, i) => ({ r, i })).filter(
    ({ r }) => !search || Object.values(r).some((v) => v.toLowerCase().includes(search.toLowerCase()))
  );

  async function handleRegen(i: number) {
    setRegeningIdx(i);
    try { await onRegenerateRow(i); } finally { setRegeningIdx(null); }
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-fammi-100">
      <table className="w-full text-xs border-collapse min-w-[700px]">
        <thead>
          <tr className="bg-warning/5">
            {["Elemen", "Total", "Masih", "Hal-hal baik yang sudah terlihat", ""].map((h) => (
              <th key={h} className="text-left px-3 py-2.5 font-semibold text-text-primary border-b border-fammi-100 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {shown.map(({ r: row, i }) => (
            <tr key={i} className={cn("border-b border-fammi-50 transition-colors", regeningIdx === i ? "opacity-50 bg-warning/10" : "hover:bg-warning/5")}>
              <td className="px-3 py-2.5 font-medium text-warning whitespace-nowrap">{row.elemen}</td>
              <td className="px-3 py-2.5 whitespace-nowrap">
                <span className="px-2 py-0.5 rounded-full bg-warning/10 text-warning text-[10px] font-semibold">{row.total}</span>
              </td>
              <td className="px-3 py-2.5 text-text-secondary whitespace-nowrap">{row.masih}</td>
              <td className="px-1.5 py-1.5 max-w-[280px]">
                <EditableCell value={row.halHalBaik} onChange={(v) => onUpdateCell(i, v)} />
              </td>
              <td className="px-3 py-2.5 text-center">
                <RegenBtn loading={regeningIdx === i} disabled={regeningIdx !== null} onClick={() => handleRegen(i)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="px-3 py-2 border-t border-fammi-50 text-[10px] text-text-secondary">{shown.length} baris</div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────

export function Step4PreviewCapaian({ state, onApprove, onRegenerate, onBack, handlers }: Step4PreviewCapaianProps) {
  const data = state.previewData!;
  const [search, setSearch] = useState("");

  const allTabs: { key: TabKey; label: string }[] = [
    ...data.levelSections.map((s) => ({ key: s.levelName, label: s.levelName })),
    { key: "NARASI PEMBUKA PENUTUP", label: "NARASI PEMBUKA PENUTUP" },
    ...data.narasi100Sections.map((s) => ({ key: s.levelName, label: s.levelName })),
    ...data.narasi0Sections.map((s) => ({ key: s.levelName, label: s.levelName })),
  ];

  const [activeTab, setActiveTab] = useState<TabKey>(allTabs[0]?.key ?? "");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-base font-bold text-text-primary">Preview Narasi</h2>
        <p className="text-xs text-text-secondary mt-1">
          Klik sel untuk edit manual, atau klik ikon regenerate per baris. Pastikan semua narasi sudah sesuai sebelum Approve.
        </p>
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label: "Sekolah", value: state.namaSekolah || "-" },
          { label: "Jenjang", value: state.jenjang || "-" },
          { label: "Level / Kelas", value: state.levelList.join(", ") || "-" },
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
          <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)}
            className={cn(
              "px-3 py-1.5 rounded-full text-[10px] font-semibold border transition-all whitespace-nowrap",
              activeTab === tab.key ? "bg-fammi text-white border-fammi" : "border-fammi-100 text-text-secondary hover:border-fammi-200 bg-white",
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
          <CapaianTable
            key={section.levelName}
            rows={section.rows}
            search={search}
            onUpdateCell={(rowIdx, field, val) => handlers.updateCapaian(section.levelName, rowIdx, field, val)}
            onRegenerateRow={(rowIdx) => handlers.regenCapaian(section.levelName, rowIdx)}
          />
        ) : null
      )}

      {activeTab === "NARASI PEMBUKA PENUTUP" && (
        <PembukaTable
          rows={data.narasiPembukaData}
          search={search}
          onUpdateCell={(rowIdx, field, val) => handlers.updatePembuka(rowIdx, field, val)}
          onRegenerateRow={(rowIdx) => handlers.regenPembuka(rowIdx)}
        />
      )}

      {data.narasi100Sections.map((section) =>
        activeTab === section.levelName ? (
          <Narasi100Table
            key={section.levelName}
            rows={section.rows}
            search={search}
            onUpdateCell={(rowIdx, field, val) => handlers.update100(section.levelName, rowIdx, field, val)}
            onRegenerateRow={(rowIdx) => handlers.regen100(section.levelName, rowIdx)}
          />
        ) : null
      )}

      {data.narasi0Sections.map((section) =>
        activeTab === section.levelName ? (
          <Narasi0Table
            key={section.levelName}
            rows={section.rows}
            search={search}
            onUpdateCell={(rowIdx, val) => handlers.update0(section.levelName, rowIdx, val)}
            onRegenerateRow={(rowIdx) => handlers.regen0(section.levelName, rowIdx)}
          />
        ) : null
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button type="button" onClick={onBack}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-fammi-100 text-xs font-medium text-text-secondary hover:bg-fammi-50 transition-all"
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth={2.5}>
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Kembali
          </button>
          <button type="button" onClick={onRegenerate}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-fammi-200 text-xs font-semibold text-fammi hover:bg-fammi-50 transition-all"
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth={2}>
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Regenerate Semua
          </button>
        </div>
        <button type="button" onClick={onApprove}
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
