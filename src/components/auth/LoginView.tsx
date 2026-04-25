"use client";

import { useState, useRef, useEffect } from "react";
import { Delete, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAppStore } from "@/stores/app-store";
import type { IAuthUser } from "@/types";

const DIGITS = ["1","2","3","4","5","6","7","8","9","","0","⌫"] as const;
const PIN_LENGTH = 5;

export function LoginView() {
  const setUser = useAppStore((s) => s.setUser);
  const [pin, setPin]       = useState("");
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  // Auto-submit when 5 digits entered
  useEffect(() => {
    if (pin.length === PIN_LENGTH) handleSubmit(pin);
  }, [pin]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(passcode: string) {
    setError("");
    setLoading(true);
    try {
      const res  = await fetch("/api/auth/login", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ passcode }),
      });
      const json = await res.json() as { user?: IAuthUser; error?: string };
      if (!res.ok || !json.user) {
        setError(json.error ?? "Passcode tidak dikenali.");
        setPin("");
      } else {
        setUser(json.user);
      }
    } catch {
      setError("Tidak bisa terhubung ke server.");
      setPin("");
    } finally {
      setLoading(false);
    }
  }

  function pressDigit(d: string) {
    if (loading) return;
    if (d === "⌫") { setPin((p) => p.slice(0, -1)); setError(""); return; }
    if (!d) return;
    if (pin.length < PIN_LENGTH) setPin((p) => p + d);
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">

        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-fammi text-white font-bold text-2xl shadow-neon">
            f
          </div>
          <div className="text-center">
            <p className="font-bold text-xl text-text-primary tracking-tight">
              fammi<span className="text-fammi">.</span>
            </p>
            <p className="text-xs text-text-secondary mt-0.5">Governance OS</p>
          </div>
        </div>

        {/* PIN display */}
        <div className="flex flex-col items-center gap-4 w-full">
          <p className="text-sm font-semibold text-text-primary">Masukkan passcode kamu</p>

          {/* Dots */}
          <div className="flex items-center gap-3">
            {Array.from({ length: PIN_LENGTH }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-3.5 w-3.5 rounded-full border-2 transition-all duration-150",
                  i < pin.length
                    ? "bg-fammi border-fammi scale-110"
                    : "bg-transparent border-fammi-200",
                  error && "border-danger bg-danger/20",
                )}
              />
            ))}
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-danger font-medium text-center animate-pulse">
              {error}
            </p>
          )}

          {/* Loading */}
          {loading && (
            <Loader2 size={18} className="text-fammi animate-spin" />
          )}
        </div>

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
          {DIGITS.map((d, i) => {
            const isEmpty = d === "";
            const isBack  = d === "⌫";
            return (
              <button
                key={i}
                onClick={() => pressDigit(d)}
                disabled={isEmpty || loading}
                className={cn(
                  "h-16 rounded-2xl text-xl font-semibold transition-all duration-150",
                  "flex items-center justify-center",
                  isEmpty
                    ? "invisible"
                    : isBack
                      ? "bg-fammi-50 text-text-secondary hover:bg-fammi-100 active:scale-95"
                      : "bg-white border border-fammi-100 text-text-primary hover:bg-fammi-50 hover:border-fammi-200 active:scale-95 active:bg-fammi-100",
                  loading && "opacity-50 pointer-events-none",
                )}
                aria-label={isBack ? "Hapus" : d}
              >
                {isBack ? <Delete size={18} /> : d}
              </button>
            );
          })}
        </div>

        <p className="text-[11px] text-text-secondary text-center">
          Hubungi admin jika lupa passcode.
        </p>
      </div>
    </div>
  );
}
