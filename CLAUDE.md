# CLAUDE.md - Fammi Governance OS

Internal mission control untuk Fammi (social enterprise edu-health). Saat ini mengelola 55 sekolah, target 4.000. Dashboard ini bukan dashboard korporat yang kaku, harus terasa manusiawi, hangat, dan mencerminkan semangat perubahan sosial yang sesungguhnya.

Semua aturan di file ini adalah **kontrak** antara developer dan project. Jangan keluar dari pagar ini tanpa diskusi.

---

## FAMMI DESIGN SYSTEM

### Brand Colors

- **Primary**: `#6323DA` (Fammi Purple) - CTA, highlight, accent
- **Primary Light**: `#EDE5FF` - background cards, soft tint
- **Primary Dark**: `#4A0F99` - hover states, headings
- **Success**: `#00B894` - metrik positif, status on-track
- **Warning**: `#F39C12` - perlu perhatian, risiko sedang
- **Danger**: `#E74C3C` - alert kritis, overdue
- **Background**: `#F8F5FF` - background app (tint ungu sangat subtle)
- **Surface**: `#FFFFFF` - card dan panel
- **Text Primary**: `#1E1B3A` - heading
- **Text Secondary**: `#636E72` - label dan supporting text

### Typography

- **Display/UI**: `Plus Jakarta Sans`, fallback `system-ui`
- **Heading**: `font-bold`, `tracking-tight`, `text-text-primary`
- **Body**: `font-normal`, `text-text-secondary` untuk supporting content
- **Data/Numbers**: `font-mono` (JetBrains Mono atau Courier New fallback)
- **RULE**: TIDAK BOLEH pakai font selain yang di atas.

### Border Radius - WAJIB: Super Rounded

- **Cards**: `rounded-[40px]` (alias `rounded-card`)
- **Buttons**: `rounded-full`
- **Inputs**: `rounded-2xl`
- **Badges**: `rounded-full`
- **Modals/Panels**: `rounded-[32px]` (alias `rounded-4xl`)
- **RULE**: TIDAK BOLEH pakai radius `< rounded-xl` di komponen utama.

### Shadows - Card Default KOSONG, Neon Hanya saat Hover

- **Card default**: TIDAK ADA shadow. Bersih. Flat.
- **Card hover**: `shadow-neon` - efek glow ungu saat kursor di atas card
- **Card hover transform**: `scale-[1.015]`
- **Elevated (modal, popover)**: `shadow-fammi-elevated`
- **RULE**: Jangan taruh shadow apapun di card secara default. Shadow hanya muncul saat hover sebagai neon glow.

### Icons

- **GUNAKAN SVG**, bukan emoji WhatsApp. Setiap icon di UI harus SVG inline atau dari icon library (misalnya Lucide React).
- **JANGAN** pakai emoji (🌍, 💸, 🏫, dll) sebagai icon navigasi atau UI element.
- Emoji hanya boleh di empty states dan copy yang sifatnya ekspresif.

### Bahasa dan Copy

- Tulis dalam **Bahasa Indonesia yang natural** - seperti ngobrol sama kolega, bukan seperti press release.
- **JANGAN** pakai karakter dash "---" atau arrow "->". Kalau mau pisah kalimat, pakai koma atau buat kalimat baru.
- **JANGAN** pakai bahasa yang terasa lebay atau AI-generated: hindari frasa seperti "Fondasi yang kokoh telah dibangun", "Semangat perubahan sosial yang membara", "Kami siap menjemput masa depan".
- Gunakan kalimat pendek. Langsung ke poin.
- **BOLEH** pakai angka dan data di copy. Itu lebih jujur dari metafora.

### Spacing & Layout

- Grid: 12-column, `gap-6` default
- Card padding: `p-6` (desktop), `p-4` (mobile)
- Section spacing: `gap-8` antar section
- Max content width: `max-w-7xl mx-auto`

### Component Rules

- SETIAP metric number: animasi count-up (framer-motion atau CSS animation)
- SETIAP status: badge berwarna (merah/kuning/hijau), BUKAN teks plain
- SETIAP card: NO shadow default, neon glow HANYA saat hover
- Loading: skeleton dengan gradient ungu (`animate-pulse`, `bg-fammi-100`)
- Empty states: ilustrasi/emoji + teks yang masuk akal, JANGAN tulis "No data"
- Error states: pesan yang bisa dipahami + tombol retry, JANGAN tampilkan stack trace

### Naming Conventions

- **Components**: PascalCase - `RunwayCard`, `SchoolCard`
- **Hooks**: camelCase dengan prefix `use` - `useFinanceData`
- **API routes**: kebab-case - `/api/finance/health`
- **Types/Interfaces**: PascalCase dengan prefix `I` untuk interfaces - `IFinanceHealth`
- **Constants**: SCREAMING_SNAKE_CASE - `SCHOOL_TARGET`
- **Files**: kebab-case untuk semua files kecuali components

### Do NOT

- Jangan hardcode hex colors di JSX/TSX. Pakai Tailwind classes.
- Jangan pakai `border-radius < rounded-xl` di komponen utama.
- Jangan pakai tabel HTML untuk layout. Pakai CSS Grid/Flexbox.
- Jangan buat komponen `> 200 baris`. Pecah jadi sub-components.
- Jangan skip TypeScript types. Setiap function harus typed.
- Jangan pakai `any`. Pakai `unknown` atau proper interface.
- Jangan taruh shadow di card secara default.
- Jangan pakai emoji sebagai icon navigasi.
- Jangan pakai dash "---" atau arrow "->" di copy.

---

## DOMAIN CONTEXT (ringkas)

10 Google Sheets terfederasi (Zero-Trust: frontend tidak akses sheet langsung, selalu lewat API route):

1. `fammi_timelines` - Timeline dan Ops
2. `fammi_weekly_board` - Weekly Work
3. `fammi_finance` - Keuangan (HIGH sensitivity, encrypted)
4. `fammi_requests` - Request Flow
5. `fammi_projects` - COGS
6. `fammi_rbac_config` - RBAC (CRITICAL)
7. `fammi_operations` - School x Product delivery tracker
8. `fammi_product` - Feature lifecycle dan CSAT
9. `fammi_growth` - Sales funnel, partnership, marketing
10. `fammi_team` - Wellbeing, happiness, burnout (anonim)

**Produk Fammi**: `RAPOR_KARAKTER`, `SCREENING`, `RAPOR_PAUD`.
**Skala**: 55 sekolah aktif, target 4.000 sekolah.
