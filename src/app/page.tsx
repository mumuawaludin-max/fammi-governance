"use client";

import { motion } from "framer-motion";
import {
  Building2,
  TrendingUp,
  Layers,
  Heart,
  AlertTriangle,
  Sparkles,
  Plus,
  RefreshCw,
  Send,
} from "lucide-react";
import { DompetCard } from "@/components/ui/DompetCard";
import { ImpactCard } from "@/components/ui/ImpactCard";
import { BentoCard } from "@/components/ui/BentoCard";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/cn";

// ─── Animation variants ──────────────────────────────────────────────────────

const page = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

const section = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

const bentoItem = (i: number) => ({
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: i * 0.05, duration: 0.4, ease: "easeOut" as const },
  },
});

// ─── Greeting ─────────────────────────────────────────────────────────────────

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Selamat pagi";
  if (h < 17) return "Selamat siang";
  return "Selamat malam";
}

// ─── Bento data (mock — wired saat API live) ──────────────────────────────────

const BENTO_CARDS = [
  {
    href: ROUTES.OPS,
    icon: Building2,
    iconColor: "text-orange-500",
    bg: "bg-orange-50",
    border: "border-orange-200",
    heroValue: "3",
    heroLabel: "sekolah butuh perhatian hari ini",
    sub1: "5 at risk",
    sub2: "55 aktif",
  },
  {
    href: ROUTES.GROWTH,
    icon: TrendingUp,
    iconColor: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-200",
    heroValue: "Rp 420Jt",
    heroLabel: "Weighted Pipeline Value",
    sub1: "12 deals aktif",
    sub2: "3 perlu follow-up",
  },
  {
    href: ROUTES.PRODUCT,
    icon: Layers,
    iconColor: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    heroValue: "7 fitur",
    heroLabel: "sedang dalam development",
    sub1: "2 di UAT",
    sub2: "4 rilis bulan ini",
  },
  {
    href: ROUTES.TEAM,
    icon: Heart,
    iconColor: "text-pink-500",
    bg: "bg-pink-50",
    border: "border-pink-200",
    heroValue: "7.8/10",
    heroLabel: "happiness score tim",
    sub1: "1 high burnout",
    sub2: "92% participation",
  },
  {
    href: ROUTES.OPS,
    icon: AlertTriangle,
    iconColor: "text-red-500",
    bg: "bg-red-50",
    border: "border-red-200",
    heroValue: "4 item",
    heroLabel: "overdue atau at risk",
    sub1: "deadline < 48 jam: 2",
  },
  {
    href: ROUTES.AI_BRIEF,
    icon: Sparkles,
    iconColor: "text-fammi",
    bg: "bg-fammi-50",
    border: "border-fammi-200",
    heroValue: "Senin, 06:00",
    heroLabel: "Brief minggu ini",
    sub1: "Klik untuk baca brief",
    badge: { label: "Siap", color: "text-success border-success/30 bg-success/10" },
  },
] as const;

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <motion.div
      variants={page}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-8"
    >
      {/* 1. Greeting */}
      <motion.section variants={section}>
        <p className="text-2xl font-bold text-text-primary">
          {greeting()}, Mumu!{" "}
          <span className="text-text-secondary font-normal">Fammi hari ini...</span>
        </p>
        <p className="text-sm text-text-secondary mt-1">
          {new Date().toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}{" "}
          <span className="text-danger font-medium">· 2 sekolah butuh perhatian segera</span>
        </p>
      </motion.section>

      {/* 2. The Power Duo */}
      <motion.section variants={section}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DompetCard />
          <ImpactCard />
        </div>
      </motion.section>

      {/* 3. Bento Grid */}
      <motion.section variants={section}>
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-text-primary">Kamu mau lihat apa?</h2>
          <p className="text-sm text-text-secondary mt-0.5">Ketuk kartu untuk dive deeper</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {BENTO_CARDS.map((card, i) => (
            <motion.div key={card.href + i} custom={i} variants={bentoItem(i)}>
              <BentoCard {...card} index={i} />
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* 4. Quick Actions */}
      <motion.section variants={section}>
        <div className="flex flex-wrap gap-3">
          <QuickAction icon={Plus} label="Input Data Baru" />
          <QuickAction icon={RefreshCw} label="Update Progress" />
          <QuickAction icon={Send} label="Submit Request" />
        </div>
      </motion.section>
    </motion.div>
  );
}

function QuickAction({ icon: Icon, label }: { icon: typeof Plus; label: string }) {
  return (
    <button
      className={cn(
        "flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium",
        "bg-fammi-100 text-fammi",
        "hover:bg-fammi hover:text-white",
        "transition-all duration-200",
      )}
    >
      <Icon size={15} />
      {label}
    </button>
  );
}
