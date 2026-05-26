"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/cn";
import { PreviewTable } from "./PreviewTable";
import { EditableNarasiTable, type EditableRow } from "./EditableNarasiTable";
import type { INarasiFormState, IPreviewData } from "@/types/narasi";
import { JENJANG_LABELS } from "@/types/narasi";

interface TargetRow {
  karakter: string;
  rentangSkorIndikator: string;
  type: "karakter" | "keselarasan";
}

interface Step4PreviewProps {
  state: INarasiFormState;
  onApprove: () => void;
  onRegenerate: () => void;
  onRegeneratePartial: (targetRows: TargetRow[]) => void;
  onUpdatePreviewData: (data: IPreviewData) => void;
  onBack: () => void;
  recentChanges?: TargetRow[];
}

type TabId = "indikator-guru" | "rubrik-orangtua" | "narasi-umum" | "narasi-karakter" | "narasi-keselarasan";

const TABS: { id: TabId; label: string }[] = [
  { id: "indikator-guru",      label: "1. Indikator Guru" },
  { id: "rubrik-orangtua",     label: "2. Rubrik Orangtua" },
  { id: "narasi-umum",         label: "3. Narasi Umum" },
  { id: "narasi-karakter",     label: "4. Narasi Karakter" },
  { id: "narasi-keselarasan",  label: "5. Narasi Keselarasan" },
];

const NARASI_EDITABLE_COLS: Record<string, string[]> = {
  "narasi-umum":        ["Catatan Umum Perkembangan"],
  "narasi-karakter":    ["Narasi"],
  "narasi-keselarasan": ["Narasi Hasil dari Sekolah", "Narasi Hasil dari Orangtua"],
};

export function Step4Preview({
  state,
  onApprove,
  onRegenerate,
  onRegeneratePartial,
  onUpdatePreviewData,
  onBack,
  recentChanges = [],
}: Step4PreviewProps) {
  const [activeTab, setActiveTab] = useState<TabId>("indikator-guru");

  // edits[tab][rowIndex][col] = edited value
  const [edits, setEdits] = useState<Record<TabId, Record<number, Record<string, string>>>>({
    "indikator-guru": {}, "rubrik-orangtua": {}, "narasi-umum": {},
    "narasi-karakter": {}, "narasi-keselarasan": {},
  });

  // selected rows per tab
  const [selected, setSelected] = useState<Record<TabId, Set<number>>>({
    "indikator-guru": new Set(), "rubrik-orangtua": new Set(), "narasi-umum": new Set(),
    "narasi-karakter": new Set(), "narasi-keselarasan": new Set(),
  });

  const preview = state.previewData;
  const wb = state.parsedWorkbook;

  // Semua derived values harus dihitung SEBELUM early return (Rules of Hooks)
  const narasiKarakterBase = useMemo<EditableRow[]>(() =>
    (preview?.narasiKarakter ?? []).map((r) => ({
      Karakter: r.karakter,
      "Rentang Skor Indikator": r.rentangSkorIndikator,
      Narasi: r.narasi,
      "Nilai Awal": r.nilaiAwal,
      "Nilai Akhir": r.nilaiAkhir,
    })), [preview]);

  const narasiKeselarasanBase = useMemo<EditableRow[]>(() =>
    (preview?.narasiKeselarasan ?? []).map((r) => ({
      Karakter: r.karakter,
      "Rentang Skor Indikator": r.rentangSkorIndikator,
      "Narasi Hasil dari Sekolah": r.narasiHasilDariSekolah,
      "Narasi Hasil dari Orangtua": r.narasiHasilDariOrangtua,
      "Nilai Awal": r.nilaiAwal,
      "Nilai Akhir": r.nilaiAkhir,
      BGCOLOR: r.bgcolor,
      TEXTCOLOR: r.textcolor,
    })), [preview]);

  const narasiUmumBase = useMemo<EditableRow[]>(() =>
    (preview?.narasiUmum ?? []).map((r) => ({
      "Hasil Predikat": r.hasilPredikat,
      "Nilai Awal": r.nilaiAwal,
      "Nilai Akhir": r.nilaiAkhir,
      "Catatan Umum Perkembangan": r.catatanUmumPerkembangan,
    })), [preview]);

  const narasiKarakterRows = useMemo(() =>
    narasiKarakterBase.map((row, i) => ({ ...row, ...(edits["narasi-karakter"][i] ?? {}) })),
    [narasiKarakterBase, edits]);

  const narasiKeselarasanRows = useMemo(() =>
    narasiKeselarasanBase.map((row, i) => ({ ...row, ...(edits["narasi-keselarasan"][i] ?? {}) })),
    [narasiKeselarasanBase, edits]);

  const narasiUmumRows = useMemo(() =>
    narasiUmumBase.map((row, i) => ({ ...row, ...(edits["narasi-umum"][i] ?? {}) })),
    [narasiUmumBase, edits]);

  // Derive row indices yang baru saja di-regenerate untuk visual diff
  const changedKarIndices = useMemo(() => {
    const s = new Set<number>();
    recentChanges.filter((r) => r.type === "karakter").forEach((r) => {
      const idx = narasiKarakterBase.findIndex(
        (row) => row.Karakter === r.karakter && row["Rentang Skor Indikator"] === r.rentangSkorIndikator,
      );
      if (idx >= 0) s.add(idx);
    });
    return s;
  }, [recentChanges, narasiKarakterBase]);

  const changedKesIndices = useMemo(() => {
    const s = new Set<number>();
    recentChanges.filter((r) => r.type === "keselarasan").forEach((r) => {
      const idx = narasiKeselarasanBase.findIndex(
        (row) => row.Karakter === r.karakter && row["Rentang Skor Indikator"] === r.rentangSkorIndikator,
      );
      if (idx >= 0) s.add(idx);
    });
    return s;
  }, [recentChanges, narasiKeselarasanBase]);

  if (!preview || !wb) {
    return <div className="text-sm text-text-secondary">Preview belum tersedia. Kembali ke langkah sebelumnya.</div>;
  }

  const totalNarasi = preview.narasiKarakter.length + preview.narasiKeselarasan.length + preview.narasiUmum.length;

  function handleRowEdit(tab: TabId) {
    return (rowIndex: number, col: string, value: string) => {
      setEdits((prev) => ({
        ...prev,
        [tab]: {
          ...prev[tab],
          [rowIndex]: { ...(prev[tab][rowIndex] ?? {}), [col]: value },
        },
      }));
    };
  }

  function handleSelectionChange(tab: TabId) {
    return (next: Set<number>) => {
      setSelected((prev) => ({ ...prev, [tab]: next }));
    };
  }

  // Commit all edits into previewData before approving
  function commitAndApprove() {
    if (!preview) return;
    const updated: IPreviewData = {
      indikatorGuru: preview.indikatorGuru,
      rubrikOrangtua: preview.rubrikOrangtua,
      indikatorGuruColumns: preview.indikatorGuruColumns,
      rubrikOrangtuaColumns: preview.rubrikOrangtuaColumns,
      narasiUmum: preview.narasiUmum.map((r, i) => ({
        ...r,
        catatanUmumPerkembangan: (edits["narasi-umum"][i]?.["Catatan Umum Perkembangan"] ?? r.catatanUmumPerkembangan),
      })),
      narasiKarakter: preview.narasiKarakter.map((r, i) => ({
        ...r,
        narasi: (edits["narasi-karakter"][i]?.["Narasi"] ?? r.narasi),
      })),
      narasiKeselarasan: preview.narasiKeselarasan.map((r, i) => ({
        ...r,
        narasiHasilDariSekolah: (edits["narasi-keselarasan"][i]?.["Narasi Hasil dari Sekolah"] ?? r.narasiHasilDariSekolah),
        narasiHasilDariOrangtua: (edits["narasi-keselarasan"][i]?.["Narasi Hasil dari Orangtua"] ?? r.narasiHasilDariOrangtua),
      })),
    };
    onUpdatePreviewData(updated);
    onApprove();
  }

  // Derive target rows (karakter × tier) dari baris yang dipilih
  const selectedTargetRows = useMemo<TargetRow[]>(() => {
    const targets: TargetRow[] = [];
    selected["narasi-karakter"].forEach((i) => {
      const row = narasiKarakterBase[i];
      if (row?.Karakter && row?.["Rentang Skor Indikator"]) {
        targets.push({ karakter: String(row.Karakter), rentangSkorIndikator: String(row["Rentang Skor Indikator"]), type: "karakter" });
      }
    });
    selected["narasi-keselarasan"].forEach((i) => {
      const row = narasiKeselarasanBase[i];
      if (row?.Karakter && row?.["Rentang Skor Indikator"]) {
        targets.push({ karakter: String(row.Karakter), rentangSkorIndikator: String(row["Rentang Skor Indikator"]), type: "keselarasan" });
      }
    });
    return targets;
  }, [selected, narasiKarakterBase, narasiKeselarasanBase]);

  const hasAnySelected =
    selected["narasi-karakter"].size > 0 ||
    selected["narasi-keselarasan"].size > 0 ||
    selected["narasi-umum"].size > 0;

  function handleRegenerateSelected() {
    if (selectedTargetRows.length > 0) {
      // Clear edits hanya untuk baris terpilih
      const nextEditsKar = { ...edits["narasi-karakter"] };
      selected["narasi-karakter"].forEach((i) => delete nextEditsKar[i]);
      const nextEditsKes = { ...edits["narasi-keselarasan"] };
      selected["narasi-keselarasan"].forEach((i) => delete nextEditsKes[i]);
      setEdits((prev) => ({ ...prev, "narasi-karakter": nextEditsKar, "narasi-keselarasan": nextEditsKes }));
      setSelected((prev) => ({ ...prev, "narasi-karakter": new Set(), "narasi-keselarasan": new Set() }));
      onRegeneratePartial(selectedTargetRows);
    } else {
      // Hanya narasi umum terpilih — regenerate semua
      setEdits((prev) => ({ ...prev, "narasi-umum": {} }));
      setSelected((prev) => ({ ...prev, "narasi-umum": new Set() }));
      onRegenerate();
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-base font-bold text-text-primary">Preview 5 Bagian Narasi</h2>
        <p className="text-xs text-text-secondary mt-1">
          Klik sel narasi untuk edit manual. Centang baris lalu klik <strong>Regenerate Terpilih</strong> untuk generate ulang baris tertentu saja.
        </p>
      </div>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: "Sekolah", value: state.namaSekolah || "—" },
          { label: "Jenjang", value: state.jenjang ? JENJANG_LABELS[state.jenjang] : "—" },
          { label: "Level", value: state.levelList.join(", ") || "—" },
          { label: "File", value: state.file?.name ?? "—" },
          { label: "Karakter", value: `${wb.karakterList.length} karakter` },
          { label: "Indikator", value: `${wb.indikatorCount} baris` },
          { label: "Rubrik", value: `${wb.rubrikCount} baris` },
          { label: "Total Narasi", value: `${totalNarasi} baris` },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center gap-1.5 bg-fammi-50 rounded-full px-3 py-1.5 border border-fammi-100">
            <span className="text-[10px] text-text-secondary">{label}:</span>
            <span className="text-[10px] font-semibold text-text-primary truncate max-w-[180px]">{value}</span>
          </div>
        ))}
      </div>

      {/* Tab navigation */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        <div className="flex items-center gap-1 p-1 bg-fammi-50 rounded-2xl min-w-max">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                "px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap",
                activeTab === id ? "bg-white text-fammi shadow-sm" : "text-text-secondary hover:text-text-primary",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="min-h-[300px]">
        {activeTab === "indikator-guru" && (
          <PreviewTable columns={preview.indikatorGuruColumns} rows={preview.indikatorGuru as Record<string, string>[]} />
        )}
        {activeTab === "rubrik-orangtua" && (
          <PreviewTable columns={preview.rubrikOrangtuaColumns} rows={preview.rubrikOrangtua as Record<string, string>[]} />
        )}
        {activeTab === "narasi-umum" && (
          <EditableNarasiTable
            columns={["Hasil Predikat", "Nilai Awal", "Nilai Akhir", "Catatan Umum Perkembangan"]}
            rows={narasiUmumRows}
            editableColumns={NARASI_EDITABLE_COLS["narasi-umum"]}
            selectedRows={selected["narasi-umum"]}
            onSelectionChange={handleSelectionChange("narasi-umum")}
            onRowEdit={handleRowEdit("narasi-umum")}
          />
        )}
        {activeTab === "narasi-karakter" && (
          <EditableNarasiTable
            columns={["Karakter", "Rentang Skor Indikator", "Narasi", "Nilai Awal", "Nilai Akhir"]}
            rows={narasiKarakterRows}
            editableColumns={NARASI_EDITABLE_COLS["narasi-karakter"]}
            selectedRows={selected["narasi-karakter"]}
            onSelectionChange={handleSelectionChange("narasi-karakter")}
            onRowEdit={handleRowEdit("narasi-karakter")}
            changedRowIndices={changedKarIndices}
          />
        )}
        {activeTab === "narasi-keselarasan" && (
          <EditableNarasiTable
            columns={["Karakter", "Rentang Skor Indikator", "Narasi Hasil dari Sekolah", "Narasi Hasil dari Orangtua", "Nilai Awal", "Nilai Akhir", "BGCOLOR", "TEXTCOLOR"]}
            rows={narasiKeselarasanRows}
            editableColumns={NARASI_EDITABLE_COLS["narasi-keselarasan"]}
            colorColBg="BGCOLOR"
            colorColText="TEXTCOLOR"
            selectedRows={selected["narasi-keselarasan"]}
            onSelectionChange={handleSelectionChange("narasi-keselarasan")}
            onRowEdit={handleRowEdit("narasi-keselarasan")}
            changedRowIndices={changedKesIndices}
          />
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-fammi-50">
        <div className="flex items-center gap-2">
          <button type="button" onClick={onBack}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-fammi-100 text-xs font-medium text-text-secondary hover:bg-fammi-50 transition-all"
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth={2.5}>
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Kembali
          </button>

          {hasAnySelected ? (
            <button type="button" onClick={handleRegenerateSelected}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-fammi-50 border border-fammi text-xs font-semibold text-fammi hover:bg-fammi-100 transition-all"
            >
              <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth={2}>
                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Regenerate Terpilih ({selectedTargetRows.length > 0 ? `${selectedTargetRows.length} baris` : `${selected["narasi-umum"].size} baris narasi umum`})
            </button>
          ) : (
            <button type="button" onClick={onRegenerate}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-fammi-200 text-xs font-medium text-fammi hover:bg-fammi-50 transition-all"
            >
              <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth={2}>
                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Regenerate Semua
            </button>
          )}
        </div>

        <button type="button" onClick={commitAndApprove} disabled={state.isApproved}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold transition-all",
            state.isApproved
              ? "bg-success text-white cursor-default"
              : "bg-fammi text-white shadow-fammi hover:bg-fammi-dark",
          )}
        >
          {state.isApproved ? (
            <>
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2.5}>
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Disetujui
            </>
          ) : (
            <>
              Approve Hasil
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2.5}>
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
