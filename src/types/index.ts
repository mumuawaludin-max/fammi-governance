// ============================================================================
// Auth & RBAC (fammi_rbac_config)
// ============================================================================

/** Kunci permission — 1:1 dengan kolom di sheet RBAC */
export type MenuKey =
  | "missionControl"
  | "operasional"
  | "keuangan"
  | "produk"
  | "salesGrowth"
  | "tim"
  | "impact";

export interface IUserPermissions {
  missionControl: boolean;
  operasional:    boolean;
  keuangan:       boolean;
  produk:         boolean;
  salesGrowth:    boolean;
  tim:            boolean;
  impact:         boolean;
}

/** User yang sudah login — disimpan di Zustand + localStorage */
export interface IAuthUser {
  userId:      string;
  name:        string;
  email:       string;
  role:        string;
  permissions: IUserPermissions;
}

// ============================================================================
// User Accounts (fammi_users) — legacy, tidak dipakai untuk auth
// ============================================================================
export type UserRole =
  | "FOUNDER"
  | "ADMIN"
  | "Management"
  | "FINANCE_VIEW"
  | "OPS_LEAD"
  | "PRODUCT_LEAD"
  | "GROWTH_LEAD"
  | "VIEWER";

export interface IUserAccount {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  notes?: string;
}

// ============================================================================
// Finance Domain
// ============================================================================
export interface IFinanceHealth {
  bulan?: string;
  runway: number;
  runwayStatus?: "KRITIS" | "PERHATIAN" | "AMAN";
  cashflowPct: number;
  opexRatio?: number;
  overBudgetCount?: number;
  wpvTotal?: number;
  activeDeals?: number;
  catatan?: string;
}

// ============================================================================
// Operations Domain — fammi_operations (3 sheets)
// Sheet: "Rapor Karakter" (RK), "Capaian Pembelajaran PAUD" (CP), "Screening Psikologi" (SP)
// ============================================================================

/** RK = Rapor Karakter | CP = Capaian Pembelajaran PAUD | SP = Screening Psikologi */
export type ProductKind = "RK" | "CP" | "SP";

export type TrafficLight = "HIJAU" | "KUNING" | "MERAH";

/**
 * Stage derived from completed milestones.
 * PERSIAPAN → PENGISIAN → PEMBUATAN → PENGIRIMAN → DISTRIBUSI → SELESAI
 */
export type DeliveryStage =
  | "PERSIAPAN"    // checklist setup (data siswa, guru/ortu/siswa online) belum semua selesai
  | "PENGISIAN"    // persiapan done, STATUS_PENGISIAN belum terceklis
  | "PEMBUATAN"    // pengisian done, checklist pembuatan rapor belum selesai
  | "PENGIRIMAN"   // pembuatan done, status pengiriman laporan belum selesai
  | "DISTRIBUSI"   // pengiriman done, paparan ke stakeholder belum selesai
  | "SELESAI";     // semua milestone selesai (polling = true)

export interface ISchoolDelivery {
  // ── Identity ────────────────────────────────────────────────────────────────
  no: number;
  produk: ProductKind;
  schoolName: string;
  kode?: string;
  jumlahKelas: number;
  jumlahSiswa?: number;         // 0 = kolom ada tapi kosong; undefined = kolom tidak ada
  jumlahGuru?: number;
  tipeInput?: string;           // "" = kolom ada tapi kosong (persiapan belum done)

  // ── Milestones: Persiapan ────────────────────────────────────────────────────
  dataSiswa: boolean;           // DATA_SISWA
  dataGuru?: boolean;           // DATA_GURU (jika ada di sheet)
  sosialisasi?: boolean;        // SOSIALISASI
  setupGuru?: boolean;          // GURU_RUMAH_ONLINE
  setupOrtu?: boolean;          // ORTU_RUMAH_ONLINE
  setupSiswa?: boolean;         // SISWA_RUMAH_ONLINE

  // ── Milestones: Pengisian ────────────────────────────────────────────────────
  mulaiInput?: string;          // MULAI_PENGISIAN — ISO date
  batasInput?: string;          // BATAS_AKHIR_PENGISIAN — ISO date, deadline utama
  selesaiInput?: boolean;       // STATUS_PENGISIAN

  // ── Milestones: Pembuatan ────────────────────────────────────────────────────
  approval?: boolean;           // WALAS_APPROVAL
  coda?: boolean;               // PEMBUATAN_CODA
  excel?: boolean;              // PEMBUATAN_EXCEL
  foto?: boolean;               // FOTO
  excelApproval?: boolean;      // EXCEL_APPROVAL (jika ada)
  codaPembuatanRapor?: boolean; // CODA_PEMBUATAN_RAPOR (jika ada)
  pluginPembuatanRapor?: boolean; // PLUGIN_PEMBUATAN_RAPOR (jika ada)

  // ── Pengiriman: deadline tanggal (per penerima) ──────────────────────────────
  // RK / SP — setiap penerima punya kolom sendiri, multi-alias antar sheet
  deliverWalas?: string;        // WALAS_DEADLINE_PENGIRIMAN_LAPORAN | DEADLINE_WALAS_KIRIM_RAPOR
  deliverIndividu?: string;     // INDIIVDU_DEADLINE_PENGIRIMAN_LAPORAN | DEADLINE_INDIVIDU_KIRIM_RAPOR | DEADLINE_KIRIM_RAPOR
  deliverKepsek?: string;       // KEPSEK_DEADLINE_PENGIRIMAN_LAPORAN  | DEADLINE_KEPSEK_KIRIM_RAPOR
  // CP — satu kolom untuk orang tua
  deliverOrtu?: string;         // DEADLINE_KIRIM_RAPOR

  // ── Pengiriman: status boolean ───────────────────────────────────────────────
  rWalas?: boolean;             // WALAS_STATUS_PENGIRIMAN_LAPORAN
  rIndividu?: boolean;          // INDIVIDU_STATUS_PENGIRIMAN_LAPORAN
  rKepsek?: boolean;            // KEPSEK_STATUS_PENGIRIMAN_LAPORAN
  rOrtu?: boolean;              // STATUS_PENGIRIMAN_LAPORAN_ORTU (CP)

  // ── Milestones: Distribusi / Paparan ────────────────────────────────────────
  deadlinePaparanKepsek?: string;   // DEADLINE PAPARAN_KEPSEK — ISO date
  statusPaparanKepsek?: boolean;    // STATUS_PAPARAN_KEPSEK
  deadlinePaparanWalas?: string;    // DEADLINE PAPARAN_WALAS — ISO date
  statusPaparanWalas?: boolean;     // STATUS_PAPARAN_WALAS
  deadlinePaparanOrtu?: string;     // DEADLINE PAPARAN_ORTU — ISO date
  statusPaparanOrtu?: boolean;      // STATUS_PAPARAN_ORTU

  // ── Status & Testimoni ───────────────────────────────────────────────────────
  statusCatatan?: string;           // KETERANGAN
  polling: boolean;
  detailTestimoni?: string;         // TESTIMONI

  // ── Computed ─────────────────────────────────────────────────────────────────
  deliveryStage: DeliveryStage;
  trafficLight: TrafficLight;
  progressPct: number;
  daysUntilBatasInput?: number;
  isComplete: boolean;
}

/** Full ops API response */
export interface IOpsData {
  totalActive: number;          // sekolah belum selesai
  merahCount: number;
  kuningCount: number;
  hijauCount: number;
  selesaiCount: number;
  hasSiswaData?: boolean;       // true jika ada data jumlahSiswa di spreadsheet
  deliveries: ISchoolDelivery[];
}

// ============================================================================
// Product Domain
// ============================================================================
export type DevState =
  | "BACKLOG" | "GROOMING" | "DESIGN" | "DEV"
  | "UAT" | "RELEASED" | "ON_HOLD" | "DEPRECATED";

export type PriorityLabel =
  | "MUST_HAVE" | "SHOULD_HAVE" | "NICE_TO_HAVE" | "FUTURE";

export interface IFeature {
  featureId: string;
  featureName: string;
  productArea: string;
  devState: DevState;
  isRevenueDriver: boolean;
  avgCsatScore: number;
  currentUsagePct: number;
  priorityLabel: PriorityLabel | string;
}

export type NpsCategory = "PROMOTER" | "PASSIVE" | "DETRACTOR";

export interface ICsatEntry {
  csatId: string;
  featureId: string;
  schoolId: string;
  score: number;
  npsCategory: NpsCategory;
  verbatimFeedback?: string;
  collectedAt: string;
}

// ============================================================================
// Growth Domain
// ============================================================================
export type SalesStage =
  | "COLD" | "CONTACTED" | "INTERESTED" | "DEMO"
  | "PROPOSAL" | "NEGOTIATION" | "CLOSED_WON" | "CLOSED_LOST";

export interface ISalesLead {
  leadId: string;
  schoolName: string;
  stage: SalesStage;
  estDealValue: number;
  weightedValue: number;
  daysInStage: number;
  staleFlag: boolean;
  picSales: string;
}

export type PartnerStep =
  | "IDENTIFIED" | "OUTREACH" | "DISCUSSION"
  | "MOU_PKS" | "ACTIVE" | "EVALUASI";

export type PartnershipHealth = "HEALTHY" | "AT_RISK" | "STALLED";

export interface IPartnership {
  partnerId: string;
  partnerName: string;
  partnerType: string;
  currentStep: PartnerStep;
  healthScore: PartnershipHealth;
  nextMilestone: string;
  nextMilestoneDate: string;
}

export type MarketingChannel =
  | "INSTAGRAM" | "TIKTOK" | "LINKEDIN" | "EMAIL" | "WA_BLAST"
  | "WEBINAR" | "EVENT_OFFLINE" | "COLD_CALL" | "BLOG" | "PODCAST";

export interface IMarketingOutreach {
  outreachId: string;
  campaignName: string;
  channel: MarketingChannel;
  reachCount: number;
  engagementRate: number;
  leadsGenerated: number;
  conversionRate: number;
  costPerLead: number;
}

// ============================================================================
// Team Wellbeing Domain
// ============================================================================
export interface ITeamCheckin {
  sprintId: string;
  avgHappiness: number;
  avgEnergy: number;
  burnoutHighCount: number;
  burnoutMediumCount: number;
  topStressor: string;
  participationRate: number;
  supportRequestsCount: number;
}

export type BurnoutLevel = "LOW" | "MEDIUM" | "HIGH";

// ============================================================================
// Impact Domain
// ============================================================================
export interface ISocialImpact {
  schoolsActive: number;
  schoolsTarget: number;
  studentsServed: number;
  familiesReached: number;
  csatAvg: number;
  impactScore: number;
  progressToTarget: number;
}

// ============================================================================
// Timeline Domain
// ============================================================================
export type ItemStatus = "ON_TRACK" | "AT_RISK" | "OVERDUE" | "DONE" | "BLOCKED";

export interface ITimelineItem {
  itemId: string;
  title: string;
  picPrimary: string;
  categoryTag: string;
  deadlineCurrent: string;
  progressPct: number;
  urgencyScore: number;
  status: ItemStatus;
}

// ============================================================================
// API Response Wrapper
// ============================================================================
export interface IApiResponse<T> {
  data: T;
  lastUpdated: string;
  source: string;
  error?: string;
}

// ============================================================================
// Shared UI helper types
// ============================================================================
export type StatusKey = "merah" | "kuning" | "hijau" | "info" | "purple";
export type TrendDirection = "up" | "down" | "neutral";
