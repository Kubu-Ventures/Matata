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
  content: string;
  created_by: string;
  created_at: string;
}

export interface AnalystReportDetail extends ReportListItem {
  footprint_geojson: string | null;
  notes: AnalystNote[];
}

export interface PaginatedReports {
  total: number;
  page: number;
  limit: number;
  items: ReportListItem[];
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
