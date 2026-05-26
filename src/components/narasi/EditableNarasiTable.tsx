"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/cn";

export interface EditableRow {
  [key: string]: string | undefined;
}

interface EditableNarasiTableProps {
  columns: string[];
  rows: EditableRow[];
  editableColumns?: string[];
  colorColBg?: string;
  colorColText?: string;
  searchable?: boolean;
  selectedRows: Set<number>;
  onSelectionChange: (selected: Set<number>) => void;
  onRowEdit: (rowIndex: number, col: string, value: string) => void;
  changedRowIndices?: Set<number>;
}

function isColorCol(col: string): boolean {
  const n = col.toLowerCase();
  return n === "bgcolor" || n === "textcolor";
}

function PlaceholderText({ text, textColor }: { text: string; textColor: string }) {
  const parts = text.split(/(\{[^}]+\})/g);
  return (
    <span style={textColor ? { color: textColor } : undefined}>
      {parts.map((part, i) => {
        if (/^\{[^}]+\}$/.test(part)) {
          return (
            <span key={i} className="inline-block bg-fammi-100 text-fammi font-mono text-[10px] px-1 py-0.5 rounded mx-0.5">
              {part}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

export function EditableNarasiTable({
  columns,
  rows,
  editableColumns = [],
  colorColBg = "BGCOLOR",
  colorColText = "TEXTCOLOR",
  searchable = true,
  selectedRows,
  onSelectionChange,
  onRowEdit,
  changedRowIndices = new Set(),
}: EditableNarasiTableProps) {
  const [search, setSearch] = useState("");
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; col: string } | null>(null);
  const [editValue, setEditValue] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return rows.map((r, i) => ({ row: r, originalIndex: i }));
    const q = search.toLowerCase();
    return rows
      .map((r, i) => ({ row: r, originalIndex: i }))
      .filter(({ row }) => Object.values(row).some((v) => String(v ?? "").toLowerCase().includes(q)));
  }, [rows, search]);

  const visibleColumns = columns.filter((c) => !isColorCol(c));
  const hasBgCol = columns.includes(colorColBg);
  const hasTextCol = columns.includes(colorColText);
  const hasColorCols = hasBgCol || hasTextCol;

  const allFilteredSelected = filtered.length > 0 && filtered.every(({ originalIndex }) => selectedRows.has(originalIndex));

  function toggleAll() {
    const next = new Set(selectedRows);
    if (allFilteredSelected) {
      filtered.forEach(({ originalIndex }) => next.delete(originalIndex));
    } else {
      filtered.forEach(({ originalIndex }) => next.add(originalIndex));
    }
    onSelectionChange(next);
  }

  function toggleRow(originalIndex: number) {
    const next = new Set(selectedRows);
    if (next.has(originalIndex)) next.delete(originalIndex);
    else next.add(originalIndex);
    onSelectionChange(next);
  }

  function startEdit(rowIndex: number, col: string, value: string) {
    setEditingCell({ rowIndex, col });
    setEditValue(value);
  }

  function commitEdit() {
    if (!editingCell) return;
    onRowEdit(editingCell.rowIndex, editingCell.col, editValue);
    setEditingCell(null);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        {searchable && (
          <div className="relative flex-1 max-w-xs">
            <svg viewBox="0 0 24 24" fill="none" className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary" stroke="currentColor" strokeWidth={2}>
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-fammi-100 bg-white text-xs text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-fammi/20 focus:border-fammi"
            />
          </div>
        )}
        <div className="flex items-center gap-2 ml-auto">
          {selectedRows.size > 0 && (
            <span className="text-xs text-fammi font-semibold">
              {selectedRows.size} dipilih
            </span>
          )}
          <p className="text-xs text-text-secondary">
            <span className="font-semibold text-text-primary">{filtered.length}</span> baris
            {filtered.length !== rows.length && ` dari ${rows.length}`}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-fammi-100">
        <table className="w-full min-w-max text-xs border-collapse">
          <thead>
            <tr className="bg-fammi-50 sticky top-0 z-10">
              <th className="px-3 py-2.5 w-8">
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={toggleAll}
                  className="rounded border-fammi-200 text-fammi focus:ring-fammi/30 cursor-pointer"
                />
              </th>
              {hasColorCols && (
                <th className="px-3 py-2.5 text-left font-semibold text-text-secondary whitespace-nowrap w-16">
                  Warna
                </th>
              )}
              {visibleColumns.map((col) => (
                <th key={col} className="px-3 py-2.5 text-left font-semibold text-text-secondary whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleColumns.length + 1 + (hasColorCols ? 1 : 0)}
                  className="px-4 py-8 text-center text-text-secondary"
                >
                  Tidak ada data yang cocok
                </td>
              </tr>
            ) : (
              filtered.map(({ row, originalIndex }) => {
                const bgColor = hasBgCol ? (row[colorColBg] ?? "") : "";
                const textColor = hasTextCol ? (row[colorColText] ?? "") : "";
                const isSelected = selectedRows.has(originalIndex);
                const isChanged = changedRowIndices.has(originalIndex);

                return (
                  <tr
                    key={originalIndex}
                    className={cn(
                      "border-t border-fammi-50 transition-colors",
                      isChanged ? "bg-green-50" : isSelected ? "bg-fammi-50/70" : "hover:bg-fammi-50/30",
                    )}
                  >
                    <td className="px-3 py-2.5">
                      <div className="flex flex-col items-center gap-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRow(originalIndex)}
                          className="rounded border-fammi-200 text-fammi focus:ring-fammi/30 cursor-pointer"
                        />
                        {isChanged && (
                          <span className="text-[9px] font-semibold text-green-700 bg-green-100 rounded-full px-1.5 py-0.5 leading-none whitespace-nowrap">
                            Baru
                          </span>
                        )}
                      </div>
                    </td>
                    {hasColorCols && (
                      <td className="px-3 py-2.5">
                        <div
                          className="w-6 h-6 rounded-lg border border-black/10"
                          style={{ backgroundColor: bgColor || "#F8F5FF" }}
                          title={`BG: ${bgColor || "default"} | Text: ${textColor || "default"}`}
                        />
                      </td>
                    )}
                    {visibleColumns.map((col) => {
                      const val = row[col] ?? "";
                      const isEditable = editableColumns.includes(col);
                      const isEditingThis = editingCell?.rowIndex === originalIndex && editingCell.col === col;
                      const hasBrace = typeof val === "string" && val.includes("{");

                      return (
                        <td
                          key={col}
                          className={cn(
                            "px-3 py-2.5 text-text-primary align-top max-w-[320px]",
                            isEditable && "cursor-pointer hover:bg-fammi-100/40 group relative",
                          )}
                          style={bgColor && col.toLowerCase().includes("narasi") ? { backgroundColor: bgColor + "22" } : undefined}
                          onClick={() => isEditable && !isEditingThis && startEdit(originalIndex, col, String(val))}
                        >
                          {isEditingThis ? (
                            <textarea
                              autoFocus
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={commitEdit}
                              onKeyDown={(e) => {
                                if (e.key === "Escape") setEditingCell(null);
                                if (e.key === "Enter" && e.metaKey) commitEdit();
                              }}
                              className="w-full min-h-[80px] text-xs text-text-primary bg-white border border-fammi rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-fammi/30 resize-y"
                            />
                          ) : (
                            <>
                              {hasBrace ? (
                                <PlaceholderText text={String(val)} textColor={textColor} />
                              ) : (
                                <span>{String(val)}</span>
                              )}
                              {isEditable && (
                                <span className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3 text-fammi" stroke="currentColor" strokeWidth={2}>
                                    <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                </span>
                              )}
                            </>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
