"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/cn";

interface PreviewTableProps {
  columns: string[];
  rows: Record<string, string | undefined>[];
  colorColBg?: string;
  colorColText?: string;
  searchable?: boolean;
}

function isColorCol(col: string): boolean {
  const n = col.toLowerCase();
  return n === "bgcolor" || n === "textcolor";
}

export function PreviewTable({
  columns,
  rows,
  colorColBg = "BGCOLOR",
  colorColText = "TEXTCOLOR",
  searchable = true,
}: PreviewTableProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((row) =>
      Object.values(row).some((v) => String(v ?? "").toLowerCase().includes(q))
    );
  }, [rows, search]);

  // Visible columns: hide pure color cols from header (but render as swatch)
  const visibleColumns = columns.filter((c) => !isColorCol(c));
  const hasBgCol = columns.includes(colorColBg);
  const hasTextCol = columns.includes(colorColText);
  const hasColorCols = hasBgCol || hasTextCol;

  return (
    <div className="flex flex-col gap-3">
      {/* Search + count */}
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
        <p className="text-xs text-text-secondary ml-auto">
          <span className="font-semibold text-text-primary">{filtered.length}</span> baris
          {filtered.length !== rows.length && ` dari ${rows.length}`}
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-fammi-100">
        <table className="w-full min-w-max text-xs border-collapse">
          <thead>
            <tr className="bg-fammi-50 sticky top-0 z-10">
              {hasColorCols && (
                <th className="px-3 py-2.5 text-left font-semibold text-text-secondary whitespace-nowrap w-16">
                  Warna
                </th>
              )}
              {visibleColumns.map((col) => (
                <th
                  key={col}
                  className="px-3 py-2.5 text-left font-semibold text-text-secondary whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleColumns.length + (hasColorCols ? 1 : 0)}
                  className="px-4 py-8 text-center text-text-secondary"
                >
                  Tidak ada data yang cocok
                </td>
              </tr>
            ) : (
              filtered.map((row, i) => {
                const bgColor = hasBgCol ? (row[colorColBg] ?? "") : "";
                const textColor = hasTextCol ? (row[colorColText] ?? "") : "";

                return (
                  <tr
                    key={i}
                    className={cn(
                      "border-t border-fammi-50 hover:bg-fammi-50/50 transition-colors",
                    )}
                  >
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
                      // Highlight placeholder tokens
                      const hasBrace = typeof val === "string" && val.includes("{");

                      return (
                        <td
                          key={col}
                          className="px-3 py-2.5 text-text-primary align-top max-w-[300px]"
                          style={
                            bgColor && col.toLowerCase().includes("narasi")
                              ? { backgroundColor: bgColor + "22" }
                              : undefined
                          }
                        >
                          {hasBrace ? (
                            <PlaceholderText text={String(val)} textColor={textColor} />
                          ) : (
                            <span>{String(val)}</span>
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

function PlaceholderText({ text, textColor }: { text: string; textColor: string }) {
  // Split text on {placeholder} tokens and render highlighted
  const parts = text.split(/(\{[^}]+\})/g);
  return (
    <span style={textColor ? { color: textColor } : undefined}>
      {parts.map((part, i) => {
        if (/^\{[^}]+\}$/.test(part)) {
          return (
            <span
              key={i}
              className="inline-block bg-fammi-100 text-fammi font-mono text-[10px] px-1 py-0.5 rounded mx-0.5"
            >
              {part}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}
