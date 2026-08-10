/**
 * Emergency Traveller Rescue — Core TypeScript Types
 * 
 * All shared interfaces and types used across the application.
 */

// ─── GPS & Location ────────────────────────────────────────────

export interface GPSPosition {
  latitude: number;
  longitude: number;
  accuracy: number;          // meters
  altitude: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;    // degrees from north
  speed: number | null;      // m/s
  timestamp: number;
}

export interface LastKnownLocation {
  position: GPSPosition;
  source: 'gps' | 'cached' | 'manual';
  isStale: boolean;
}

// ─── Destinations & POI ────────────────────────────────────────

export type DestinationType =
  | 'hospital'
  | 'police'
  | 'fire_station'
  | 'school'
  | 'highway'
  | 'road'
  | 'settlement'
  | 'village'
  | 'hotel'
  | 'fuel_station'
  | 'shop'
  | 'rescue_center'
  | 'other';

export interface Destination {
  id: string;
  name: string;
  type: DestinationType;
  latitude: number;
  longitude: number;
  distance: number;           // km
  estimatedWalkTime: number;  // minutes
  estimatedDriveTime: number | null; // minutes
  direction: string;          // e.g. "Southeast"
  bearing: number;            // degrees
  roadAccess: boolean;
  confidence: 'high' | 'medium' | 'low';
  safetyScore: number;        // 0-100
  safetyRating: 'recommended' | 'possible' | 'not_recommended';
  source: 'osm' | 'cached' | 'mock';
  tags?: Record<string, string>;
}

export interface DestinationCategory {
  type: DestinationType;
  label: string;
  icon: string;
  enabled: boolean;
}

// ─── Ranking ───────────────────────────────────────────────────

export interface RankingFactors {
  destinationReliability: number;  // 0-100
  routeAccessibility: number;     // 0-100
  roadConnectivity: number;       // 0-100
  proximity: number;              // 0-100 (inverse of distance)
  populationDensity: number;      // 0-100
  terrainDifficulty: number;      // 0-100 (penalty)
  gpsUncertainty: number;         // 0-100 (penalty)
}

// ─── Routing ───────────────────────────────────────────────────

export interface RouteStep {
  instruction: string;
  distance: number;    // meters
  duration: number;    // seconds
  bearing: number;
  coordinates: [number, number]; // [lng, lat]
}

export interface Route {
  id: string;
  destination: Destination;
  geometry: [number, number][]; // Array of [lat, lng]
  distance: number;             // total km
  duration: number;             // total minutes
  steps: RouteStep[];
  profile: 'walking' | 'driving';
  source: 'osrm' | 'straight_line';
  warnings: SafetyAlert[];
}

// ─── Breadcrumb Tracking ───────────────────────────────────────

export interface BreadcrumbPoint {
  latitude: number;
  longitude: number;
  altitude: number | null;
  timestamp: number;
  accuracy: number;
}

export interface BreadcrumbTrack {
  id: string;
  name: string;
  points: BreadcrumbPoint[];
  startTime: number;
  endTime: number | null;
  totalDistance: number; // km
  status: 'recording' | 'paused' | 'stopped';
}

// ─── Emergency Contacts ───────────────────────────────────────

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  isPrimary: boolean;
}

// ─── Trip Planning ─────────────────────────────────────────────

export interface TripPlan {
  id: string;
  destination: string;
  plannedRoute: string;
  expectedReturnTime: string; // ISO datetime
  contacts: EmergencyContact[];
  groupMembers: string[];
  notes: string;
  startTime: string | null;
  status: 'planned' | 'active' | 'completed' | 'overdue';
}

// ─── SOS ───────────────────────────────────────────────────────

export interface SOSData {
  id: string;
  activatedAt: number;
  coordinates: GPSPosition | null;
  batteryLevel: number | null;
  lastMovement: string;
  selectedDestination: Destination | null;
  emergencyContacts: EmergencyContact[];
  status: 'not_activated' | 'activated' | 'message_sent' | 'delivered';
  message: string;
}

// ─── Emergency Profile ─────────────────────────────────────────

export interface EmergencyProfile {
  isInjured: 'yes' | 'no' | 'unsure' | null;
  isAlone: 'yes' | 'no' | null;
  hasWater: 'yes' | 'no' | 'unsure' | null;
  canWalk: 'yes' | 'with_difficulty' | 'no' | null;
  batteryLevel: number | null;
}

// ─── Safety Alerts ─────────────────────────────────────────────

export interface SafetyAlert {
  id: string;
  type: 'danger' | 'warning' | 'info';
  message: string;
  icon: string;
  isVerified: boolean;
}

// ─── Network Status ────────────────────────────────────────────

export type NetworkStatus = 'online' | 'limited' | 'offline';

// ─── App Settings ──────────────────────────────────────────────

export interface AppSettings {
  units: 'metric' | 'imperial';
  mapStyle: 'standard' | 'satellite' | 'terrain';
  theme: 'dark' | 'light' | 'auto';
  batteryMode: boolean;
  searchRadius: number; // km
  gpsUpdateInterval: number; // ms
  showSafetyAlerts: boolean;
  shareLocationConsent: boolean;
}

// ─── App State ─────────────────────────────────────────────────

export type Screen =
  | 'welcome'
  | 'home'
  | 'emergency'
  | 'nearby_exits'
  | 'route'
  | 'compass'
  | 'offline_maps'
  | 'contacts'
  | 'trip'
  | 'settings';

export interface AppState {
  currentScreen: Screen;
  isEmergencyMode: boolean;
  gpsPosition: GPSPosition | null;
  lastKnownLocation: LastKnownLocation | null;
  destinations: Destination[];
  selectedDestination: Destination | null;
  currentRoute: Route | null;
  breadcrumbTrack: BreadcrumbTrack | null;
  emergencyContacts: EmergencyContact[];
  activeTripPlan: TripPlan | null;
  sosData: SOSData | null;
  emergencyProfile: EmergencyProfile;
  networkStatus: NetworkStatus;
  batteryLevel: number | null;
  settings: AppSettings;
}
