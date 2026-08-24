export type Role = 'anonymous_reporter' | 'reporter' | 'analyst' | 'responder' | 'admin';
export type CrisisType = 'flood' | 'earthquake' | 'conflict' | 'wildfire' | 'other';
export type InfrastructureType = 'residential' | 'commercial' | 'government' | 'utilities' | 'transport' | 'community';
export type DamageSeverity = 'minimal' | 'partial' | 'destroyed';
export type ReportStatus = 'pending' | 'verified' | 'rejected' | 'duplicate' | 'pending_merge_review';
export type PhotoStatus = 'pending' | 'processing' | 'accepted' | 'rejected' | 'insufficient_quality' | 'ai_processing_failed';
export type ElectricityStatus = 'functional' | 'non_functional' | 'unknown';
export type HealthServicesStatus = 'accessible' | 'inaccessible' | 'unknown';
export type ReviewPriority = 'critical' | 'high' | 'normal' | 'low';

export interface AuthTokens {
  token: string;
  refresh_token?: string;
  role: Role;
}

export interface Report {
  id: string;
  building_id: string | null;
  crisis_type: CrisisType;
  infrastructure_type: InfrastructureType;
  damage_severity: DamageSeverity;
  status: ReportStatus;
  photo_status: PhotoStatus;
  lat: number | null;
  lng: number | null;
  gps_accuracy_m: number | null;
  landmark_description: string | null;
  electricity_status: ElectricityStatus | null;
  health_services_status: HealthServicesStatus | null;
  most_pressing_needs: string | null;
  debris_clearing_needed: boolean | null;
  photo_url: string | null;
  reporter_trust_tier: number;
  ai_severity_prediction: DamageSeverity | null;
  ai_confidence: number | null;
  ai_quality_score: number | null;
  ai_divergence?: boolean;
  analyst_severity_override?: DamageSeverity | null;
  review_priority?: ReviewPriority;
  created_at: string;
  updated_at: string;
}

export interface ReportListItem extends Report {
  review_priority: ReviewPriority;
  ai_divergence: boolean;
  analyst_severity_override: DamageSeverity | null;
}

export interface AnalystNote {
  id: string;
  body: string;
  created_at: string;
}

export interface ReportSubmitMetadata {
  crisis_type: CrisisType;
  infrastructure_type: InfrastructureType;
  damage_severity: DamageSeverity;
  lat?: number;
  lng?: number;
  gps_accuracy_m?: number;
  landmark_description?: string;
  electricity_status?: ElectricityStatus;
  health_services_status?: HealthServicesStatus;
  most_pressing_needs?: string;
  debris_clearing_needed?: boolean;
  offline_queued_at?: string;
}

/** One entry in a building's damage history — every report ever filed against it. */
export interface TimelineReportItem {
  id: string;
  damage_severity: DamageSeverity;
  status: ReportStatus;
  ai_severity_prediction: DamageSeverity | null;
  created_at: string;
}

export interface AnalystReportDetail extends ReportListItem {
  footprint_geojson: string | null;
  notes: AnalystNote[];
  building_timeline?: TimelineReportItem[];
}

export interface PaginatedReports {
  total: number;
  page: number;
  limit: number;
  items: ReportListItem[];
}

// ---------------------------------------------------------------------------
// Reporter's own report history — GET /reports (list own)
// ---------------------------------------------------------------------------

export interface PaginatedOwnReports {
  total: number;
  page: number;
  limit: number;
  items: Report[];
}

export interface NearbyReport {
  id: string;
  lat: number;
  lng: number;
  status: ReportStatus;
  damage_severity: DamageSeverity;
  created_at: string;
  similarity_score: number;
}

/** Filters accepted by GET /analyst/reports — mirrors analyst.py query params. */
export interface ReportListParams {
  page?: number;
  limit?: number;
  crisis_type?: string;
  damage_severity?: string;
  infrastructure_type?: string;
  status?: string;
  time_from?: string;
  time_to?: string;
  min_ai_confidence?: number;
  review_priority?: string;
  divergence_only?: boolean;
  sort_by?: 'severity' | 'created_at';
}

// ---------------------------------------------------------------------------
// Feature 2 — pending duplicate-merge review
// ---------------------------------------------------------------------------

export interface ConfirmMergeResponse {
  id: string;
  status: 'duplicate';
  merged_into: string;
}

export interface RejectMergeResponse {
  id: string;
  status: 'pending';
}

export interface MergeResponse {
  primary_id: string;
  merged_count: number;
}

// ---------------------------------------------------------------------------
// Feature 3 — AI accuracy / active-learning calibration
// ---------------------------------------------------------------------------

export interface FeedbackTypeBreakdown {
  count: number;
  agreement_rate: number | null;
}

export type AIFeedbackType = 'verify' | 'reject' | 'severity_override';

export interface AIAccuracyResponse {
  total_feedback: number;
  agreement_rate: number | null;
  high_confidence_agreement_rate: number | null;
  avg_ai_confidence: number | null;
  by_feedback_type: Record<AIFeedbackType, FeedbackTypeBreakdown>;
  recommended_divergence_threshold: number | null;
  high_confidence_feedback_count: number;
  min_sample_for_calibration: number;
  threshold_updated_at: string | null;
  threshold_is_stale: boolean;
}

// ---------------------------------------------------------------------------
// Public statistics — GET /stats/summary, GET /stats/heatmap
// ---------------------------------------------------------------------------

export interface StatsSummaryResponse {
  total: number;
  by_severity: Record<DamageSeverity, number>;
  by_crisis_type: Record<CrisisType, number>;
  pending_duplicate_count: number;
  last_updated: string;
}

export interface HeatmapFeature {
  type: 'Feature';
  geometry: { type: 'Point'; coordinates: [number, number] };
  properties: { weight: number };
}

export interface HeatmapFeatureCollection {
  type: 'FeatureCollection';
  features: HeatmapFeature[];
}

// ---------------------------------------------------------------------------
// Export jobs — async export polling
// ---------------------------------------------------------------------------

export type ExportFormat = 'geojson' | 'csv' | 'shapefile';
export type ExportJobStatus = 'processing' | 'complete' | 'failed';

export interface ExportJobResponse {
  job_id: string;
  status: 'processing';
}

export interface ExportJobStatusResponse {
  status: ExportJobStatus;
  download_url: string | null;
  expires_at: string | null;
}

// ---------------------------------------------------------------------------
// Server-Sent Events — GET /analyst/stream
// ---------------------------------------------------------------------------

export type AnalystEventType = 'report.created' | 'report.updated' | 'report.critical' | 'report.ai_divergence';

export interface AnalystStreamEvent {
  event: AnalystEventType;
  report_id?: string;
  ai_severity_prediction?: DamageSeverity;
  reporter_severity?: DamageSeverity;
  ai_confidence?: number;
  review_priority?: ReviewPriority;
  lat?: number | null;
  lng?: number | null;
  [key: string]: unknown;
}