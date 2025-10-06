export interface SimulationEvent {
  entity_id: string;
  action: 'enter' | 'exit' | 'move' | 'drop_package' | 'pickup_package';
  timestamp_offset_seconds: number;
  coords: [number, number];
  path?: [number, number][];
  metadata: {
    detection_status?: 'PENDING' | 'DETECTED' | 'BYPASSED';
    [key: string]: any;
  };
}

export interface RedTeamScenario {
  id: string;
  name: string;
  description: string;
  event_sequence: SimulationEvent[];
}

export interface LogEntry {
  timestamp: string;
  entity: string;
  action: string;
  details: string;
  status: 'info' | 'bypass' | 'detected' | 'pending';
}

export interface AttackLog {
  id: string;
  scenarioId: string;
  events: LogEntry[];
  outcome: 'Bypassed' | 'Detected';
}

export interface BluePatch {
  patch_id: string;
  patch_text: string;
  patch_json: Record<string, any>;
}

export interface Metrics {
  iterations: number;
  bypassRate: number;
  detectionRate: number;
  avgTimeToDetect: number | null;
}

export interface SocialFeedPost {
  post_id: string;
  source: 'twitter' | 'reddit' | 'telegram' | 'news';
  text: string;
  timestamp: string;
  user: string;
  raw_location: string;
  lang: 'en' | 'hi' | 'pa';
}

export interface AnalysisResultItem {
  post_id: string;
  threat_level: 'none' | 'warning' | 'critical';
  confidence: number;
  locations: string[];
  summary: string;
}

export interface MapPoint {
    coords: [number, number];
    intensity: number;
    label: string;
}

export interface AnalysisResult {
    results: AnalysisResultItem[];
    map_points: MapPoint[];
}

export interface GeoCodeResult {
    lat: number;
    lon: number;
}