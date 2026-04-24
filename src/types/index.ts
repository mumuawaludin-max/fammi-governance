// ============================================================================
// User Accounts (fammi_users)
// ============================================================================

/**
 * Spreadsheet: fammi_users
 * Kolom: userId | email | name | role | isActive | createdAt | lastLogin | notes
 *
 * Contoh baris:
 *   USR001 | mumu@fammi.id | Mumu | FOUNDER | TRUE | 2024-01-01 | 2026-04-24 | Founder
 *   USR002 | rizki@fammi.id | Rizki | OPS_LEAD | TRUE | 2024-03-15 | | Ops lead Jabodetabek
 */

export type UserRole =
  | "FOUNDER"      // akses penuh semua modul termasuk RBAC
  | "ADMIN"        // akses penuh kecuali RBAC
  | "FINANCE_VIEW" // hanya baca modul Keuangan
  | "OPS_LEAD"     // baca + edit Operasional
  | "PRODUCT_LEAD" // baca + edit Produk
  | "GROWTH_LEAD"  // baca + edit Growth
  | "VIEWER";      // read-only semua modul

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
// Finance Domain (fammi_finance)
// ============================================================================
export interface IFinanceHealth {
  runway: number;
  cashflowPct: number;
  burnRateChange: number;
  rps: number;
  dcr: number;
  ccc: number;
}

// ============================================================================
// Operations Domain (fammi_operations)
// ============================================================================
export type DeliveryStage =
  | "BELUM_MULAI"
  | "PERSIAPAN"
  | "PENGERJAAN"
  | "LAPORAN"
  | "PAPARAN"
  | "SELESAI";

export type TrafficLight = "HIJAU" | "KUNING" | "MERAH";

export type ProductKind = "RAPOR_KARAKTER" | "SCREENING" | "RAPOR_PAUD";

export interface ISchoolDelivery {
  schoolId: string;
  schoolName: string;
  produk: ProductKind;
  deliveryStage: DeliveryStage;
  hariTersisa: number;
  progressPct: number;
  trafficLight: TrafficLight;
  bottleneckFlag: boolean;
  bottleneckDesc?: string;
  csatScore?: number;
}

export type BottleneckType =
  | "ENUMERATOR"
  | "LAPORAN"
  | "PAPARAN"
  | "PEMBAYARAN"
  | "KOORDINASI_SEKOLAH"
  | "LAINNYA";

export interface IBottleneckLog {
  logId: string;
  deliveryId: string;
  schoolName: string;
  produk: ProductKind;
  bottleneckType: BottleneckType;
  bottleneckDesc: string;
  flaggedAt: string;
  resolvedAt?: string;
  durationDays: number;
  resolvedBy?: string;
  resolutionNotes?: string;
}

// ============================================================================
// Product Domain (fammi_product)
// ============================================================================
export type DevState =
  | "BACKLOG"
  | "GROOMING"
  | "DESIGN"
  | "DEV"
  | "UAT"
  | "RELEASED"
  | "ON_HOLD"
  | "DEPRECATED";

export type PriorityLabel =
  | "MUST_HAVE"
  | "SHOULD_HAVE"
  | "NICE_TO_HAVE"
  | "FUTURE";

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
// Growth Domain (fammi_growth)
// ============================================================================
export type SalesStage =
  | "COLD"
  | "CONTACTED"
  | "INTERESTED"
  | "DEMO"
  | "PROPOSAL"
  | "NEGOTIATION"
  | "CLOSED_WON"
  | "CLOSED_LOST";

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
  | "IDENTIFIED"
  | "OUTREACH"
  | "DISCUSSION"
  | "MOU_PKS"
  | "ACTIVE"
  | "EVALUASI";

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
  | "INSTAGRAM"
  | "TIKTOK"
  | "LINKEDIN"
  | "EMAIL"
  | "WA_BLAST"
  | "WEBINAR"
  | "EVENT_OFFLINE"
  | "COLD_CALL"
  | "BLOG"
  | "PODCAST";

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
// Team Wellbeing Domain (fammi_team)
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
// Impact Domain (aggregated / cross-sheet)
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
// Timeline Domain (fammi_timelines)
// ============================================================================
export type ItemStatus =
  | "ON_TRACK"
  | "AT_RISK"
  | "OVERDUE"
  | "DONE"
  | "BLOCKED";

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
