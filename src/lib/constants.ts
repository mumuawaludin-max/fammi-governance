export const FAMMI_COLORS = {
  primary: "#6323DA",
  primaryLight: "#EDE5FF",
  primaryDark: "#4A0F99",
  success: "#00B894",
  warning: "#F39C12",
  danger: "#E74C3C",
  background: "#F8F5FF",
  surface: "#FFFFFF",
  textPrimary: "#1E1B3A",
  textSecondary: "#636E72",
} as const;

export const SHEET_NAMES = {
  FINANCE: "fammi_finance",
  WEEKLY: "fammi_weekly_board",
  TIMELINES: "fammi_timelines",
  REQUESTS: "fammi_requests",
  PROJECTS: "fammi_projects",
  RBAC: "fammi_rbac_config",
  OPERATIONS: "fammi_operations",
  PRODUCT: "fammi_product",
  GROWTH: "fammi_growth",
  TEAM: "fammi_team",
} as const;

export type SheetName = (typeof SHEET_NAMES)[keyof typeof SHEET_NAMES];

export const ROUTES = {
  HOME: "/",
  FINANCE: "/finance",
  OPERATIONS: "/operations",
  PRODUCT: "/product",
  GROWTH: "/growth",
  TEAM: "/team",
  IMPACT: "/impact",
  TIMELINE: "/timeline",
  WEEKLY: "/weekly",
  REQUESTS: "/requests",
  SETTINGS: "/settings",
} as const;

export const THRESHOLDS = {
  RUNWAY_CRITICAL: 3,
  RUNWAY_WARNING: 6,
  BURNOUT_MEDIUM: 5,
  BURNOUT_HIGH: 7,
  CSAT_GOOD: 4,
  CSAT_WARNING: 3,
  HAPPINESS_ALERT: 6,
  ENERGY_ALERT: 5,
  STALE_LEAD_DAYS: 14,
  DELIVERY_DAYS_CRITICAL: 3,
  DELIVERY_DAYS_WARNING: 7,
  MOU_EXPIRY_WARNING: 30,
} as const;

export const PRODUCTS = [
  {
    id: "RAPOR_KARAKTER",
    name: "Rapor Karakter",
    description: "Asesmen karakter siswa berbasis data longitudinal.",
    emoji: "🌱",
  },
  {
    id: "SCREENING",
    name: "Screening",
    description: "Multiple intelligence, mental health, dan screening lanjutan.",
    emoji: "🧭",
  },
  {
    id: "RAPOR_PAUD",
    name: "Rapor PAUD",
    description: "Rapor perkembangan untuk jenjang PAUD/KB.",
    emoji: "🌈",
  },
] as const;

export type ProductId = (typeof PRODUCTS)[number]["id"];

export const SCHOOL_TARGET = 4000;
export const SCHOOL_CURRENT = 55;

export const DELIVERY_STAGES = [
  "BELUM_MULAI",
  "PERSIAPAN",
  "PENGERJAAN",
  "LAPORAN",
  "PAPARAN",
  "SELESAI",
] as const;

export const TRAFFIC_LIGHTS = ["HIJAU", "KUNING", "MERAH"] as const;

export const SALES_STAGES = [
  "COLD",
  "CONTACTED",
  "INTERESTED",
  "DEMO",
  "PROPOSAL",
  "NEGOTIATION",
  "CLOSED_WON",
  "CLOSED_LOST",
] as const;

export const PARTNER_STEPS = [
  "IDENTIFIED",
  "OUTREACH",
  "DISCUSSION",
  "MOU_PKS",
  "ACTIVE",
  "EVALUASI",
] as const;

export const DEV_STATES = [
  "BACKLOG",
  "GROOMING",
  "DESIGN",
  "DEV",
  "UAT",
  "RELEASED",
  "ON_HOLD",
  "DEPRECATED",
] as const;

export const ITEM_STATUSES = [
  "ON_TRACK",
  "AT_RISK",
  "OVERDUE",
  "DONE",
  "BLOCKED",
] as const;
