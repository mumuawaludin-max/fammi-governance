# CLAUDE.md — Fammi Governance OS

Internal mission control untuk Fammi (social enterprise edu-health). Saat ini mengelola 55 sekolah, target 4.000. Dashboard ini BUKAN dashboard korporat yang kaku — harus terasa manusiawi, hangat, dan merepresentasikan semangat perubahan sosial.

Semua aturan di file ini adalah **kontrak** antara developer dan project. Jangan keluar dari pagar ini tanpa diskusi.

---

## FAMMI DESIGN SYSTEM

### Brand Colors

- **Primary**: `#6323DA` (Fammi Purple) — CTA, highlight, accent
- **Primary Light**: `#EDE5FF` — background cards, soft tint
- **Primary Dark**: `#4A0F99` — hover states, headings
- **Success**: `#00B894` — positive metrics, on-track status
- **Warning**: `#F39C12` — attention needed, medium risk
- **Danger**: `#E74C3C` — critical alerts, overdue
- **Background**: `#F8F5FF` — app background (sangat subtle purple tint)
- **Surface**: `#FFFFFF` — cards dan panels
- **Text Primary**: `#1E1B3A` — headings
- **Text Secondary**: `#636E72` — labels dan supporting text

### Typography

- **Display/UI**: `Plus Jakarta Sans`, fallback `system-ui`
- **Heading**: `font-bold`, `tracking-tight`, `text-text-primary`
- **Body**: `font-normal`, `text-text-secondary` untuk supporting content
- **Data/Numbers**: `font-mono` (JetBrains Mono atau Courier New fallback)
- **RULE**: TIDAK BOLEH pakai font selain yang di atas.

### Border Radius — WAJIB: Super Rounded

- **Cards**: `rounded-[40px]` (atau alias `rounded-card`)
- **Buttons**: `rounded-full`
- **Inputs**: `rounded-2xl`
- **Badges**: `rounded-full`
- **Modals/Panels**: `rounded-[32px]` (atau alias `rounded-4xl`)
- **RULE**: TIDAK BOLEH pakai radius `< rounded-xl` di komponen utama.

### Spacing & Layout

- Grid: 12-column, `gap-6` default
- Card padding: `p-6` (desktop), `p-4` (mobile)
- Section spacing: `gap-8` antar section
- Max content width: `max-w-7xl mx-auto`

### Shadows — Soft & Friendly

- Card default: `shadow-fammi` → `0 4px 24px rgba(99,35,218,0.08)`
- Card hover: `shadow-fammi-hover` + `scale-[1.01]` → `0 8px 40px rgba(99,35,218,0.16)`
- Elevated: `shadow-fammi-elevated` → `0 16px 64px rgba(99,35,218,0.20)`
- **RULE**: Hindari shadow hitam murni. Gunakan shadow ungu/warna untuk karakter.

### Component Rules

- SETIAP metric number: animasi count-up (framer-motion atau CSS animation)
- SETIAP status: badge berwarna (merah/kuning/hijau), BUKAN teks plain
- SETIAP card: hover effect (scale + shadow upgrade)
- Loading: skeleton dengan gradient ungu (`animate-pulse`, `bg-fammi-100`)
- Empty states: ilustrasi/emoji + encouraging message — TIDAK BOLEH "No data"
- Error states: friendly message + retry button — TIDAK BOLEH stack trace

### Naming Conventions

- **Components**: PascalCase — `RunwayMeter`, `SchoolCard`
- **Hooks**: camelCase dengan prefix `use` — `useFinanceData`
- **API routes**: kebab-case — `/api/finance/health`
- **Types/Interfaces**: PascalCase dengan prefix `I` untuk interfaces — `IFinanceHealth`
- **Constants**: SCREAMING_SNAKE_CASE — `SCHOOL_TARGET`
- **Files**: kebab-case untuk semua files kecuali components

### Do NOT

- Jangan hardcode hex colors di JSX/TSX. Gunakan Tailwind classes.
- Jangan pakai `border-radius < rounded-xl` di komponen utama.
- Jangan pakai tabel HTML untuk layout. Gunakan CSS Grid/Flexbox.
- Jangan buat komponen `> 200 baris`. Pecah menjadi sub-components.
- Jangan skip TypeScript types. Setiap function harus typed.
- Jangan pakai `any`. Gunakan `unknown` atau proper interface.

---

## DOMAIN CONTEXT (ringkas)

10 Google Sheets terfederasi (Zero-Trust — frontend tidak akses sheet langsung, selalu via API route):

1. `fammi_timelines` — Timeline & Ops
2. `fammi_weekly_board` — Weekly Work
3. `fammi_finance` — Keuangan (HIGH sensitivity, encrypted)
4. `fammi_requests` — Request Flow
5. `fammi_projects` — COGS
6. `fammi_rbac_config` — RBAC (CRITICAL)
7. `fammi_operations` — School × Product delivery tracker
8. `fammi_product` — Feature lifecycle + CSAT
9. `fammi_growth` — Sales funnel, partnership, marketing
10. `fammi_team` — Wellbeing, happiness, burnout (anonim)

**Produk Fammi**: `RAPOR_KARAKTER`, `SCREENING`, `RAPOR_PAUD`.
**Scale**: 55 sekolah aktif → target 4.000 sekolah.
