"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, ArrowRight, Clock } from "lucide-react";
import { ROUTES } from "@/lib/constants";

const section = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: "easeOut" as const },
  }),
};

const GENERATORS = [
  {
    id: "rapor-karakter",
    title: "Generate Narasi Rapor Karakter",
    description:
      "Membuat bank narasi karakter berdasarkan indikator guru dan rubrik orang tua, dengan tone yang hangat, Islami, apresiatif, dan sesuai jenjang perkembangan anak.",
    href: ROUTES.OPS_NARASI_RAPOR_KARAKTER,
    available: true,
    badge: "Tersedia",
    badgeColor: "bg-success/10 text-success",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth={1.5}>
        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    accentColor: "text-fammi",
    bgAccent: "bg-fammi-50",
  },
  {
    id: "capaian-pembelajaran",
    title: "Generate Narasi Capaian Pembelajaran",
    description:
      "Membuat bank narasi capaian pembelajaran berdasarkan elemen, tujuan pembelajaran, indikator, jenjang, dan pendekatan bahasa Fammi yang hangat, apresiatif, serta sesuai tahap perkembangan anak.",
    href: ROUTES.OPS_NARASI_CAPAIAN_PEMBELAJARAN,
    available: true,
    badge: "Tersedia",
    badgeColor: "bg-success/10 text-success",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth={1.5}>
        <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    accentColor: "text-fammi",
    bgAccent: "bg-fammi-50",
  },
  {
    id: "kompetensi-unggulan",
    title: "Generate Narasi Kompetensi Unggulan",
    description:
      "Membuat narasi kompetensi unggulan sekolah seperti Al-Qur'an, Bahasa Inggris, Matematika, TIK, Membaca, Menulis, dan aspek unggulan lain.",
    href: "#",
    available: false,
    badge: "Coming Soon",
    badgeColor: "bg-text-secondary/10 text-text-secondary",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth={1.5}>
        <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    accentColor: "text-text-secondary",
    bgAccent: "bg-fammi-50/50",
  },
] as const;

export default function NarasiGeneratorPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb */}
      <motion.nav
        custom={0} variants={section} initial="hidden" animate="visible"
        className="flex items-center gap-1.5 text-xs text-text-secondary"
        aria-label="Breadcrumb"
      >
        <Link href={ROUTES.HOME} className="hover:text-fammi transition-colors">Fammi Performance</Link>
        <ChevronRight size={12} className="opacity-40" />
        <Link href={ROUTES.OPS} className="hover:text-fammi transition-colors">Operasional</Link>
        <ChevronRight size={12} className="opacity-40" />
        <span className="text-text-primary font-medium">Narasi Generator</span>
      </motion.nav>

      {/* Page header */}
      <motion.div custom={1} variants={section} initial="hidden" animate="visible">
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">Narasi Generator</h1>
        <p className="text-sm text-text-secondary mt-1.5 max-w-xl">
          Kelola dan buat bank narasi rapor sekolah secara otomatis berdasarkan indikator, rubrik, jenjang, dan tone komunikasi Fammi.
        </p>
      </motion.div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {GENERATORS.map((gen, i) => (
          <motion.div key={gen.id} custom={i + 2} variants={section} initial="hidden" animate="visible">
            {gen.available ? (
              <Link
                href={gen.href}
                className="group flex flex-col h-full bg-white border border-fammi-100 rounded-card p-6 transition-all duration-200 hover:shadow-neon hover:scale-[1.015] hover:border-fammi-200 cursor-pointer"
              >
                <GeneratorCardContent gen={gen} />
                <div className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-fammi group-hover:gap-2.5 transition-all">
                  Mulai Generate
                  <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            ) : (
              <div className="flex flex-col h-full bg-white border border-fammi-50 rounded-card p-6 opacity-60 cursor-not-allowed select-none">
                <GeneratorCardContent gen={gen} />
                <div className="mt-6 flex items-center gap-1.5 text-xs font-medium text-text-secondary">
                  <Clock size={12} />
                  Segera hadir
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Info footer */}
      <motion.div custom={5} variants={section} initial="hidden" animate="visible"
        className="flex items-start gap-3 bg-fammi-50 rounded-2xl p-4 border border-fammi-100"
      >
        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 shrink-0 mt-0.5 text-fammi" stroke="currentColor" strokeWidth={2}>
          <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p className="text-xs text-text-secondary leading-relaxed">
          Narasi yang dihasilkan menggunakan tone komunikasi Fammi: apresiatif, Islami, tidak menghakimi, dan berbasis kemitraan sekolah dan orang tua.
          Admin dapat mereview dan menyesuaikan hasil sebelum export ke Excel.
        </p>
      </motion.div>
    </div>
  );
}

function GeneratorCardContent({ gen }: { gen: typeof GENERATORS[number] }) {
  return (
    <>
      {/* Icon + badge */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${gen.bgAccent} ${gen.accentColor}`}>
          {gen.icon}
        </div>
        <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${gen.badgeColor}`}>
          {gen.badge}
        </span>
      </div>

      {/* Title */}
      <h2 className="text-sm font-bold text-text-primary leading-snug mb-2">{gen.title}</h2>

      {/* Description */}
      <p className="text-xs text-text-secondary leading-relaxed flex-1">{gen.description}</p>
    </>
  );
}
