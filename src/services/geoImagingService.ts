/**
 * Realtime Geographical Imaging & Terrain Elevation Service
 * 
 * Provides:
 * 1. High-precision Reverse Geocoding (Nominatim API) for real-time land identification.
 * 2. Open-Elevation API integration for terrain profile, elevation delta, & slope analysis.
 * 3. Satellite & Orthophoto tile layer providers (Esri High-Res, NASA GIBS, OpenTopo, CartoDB).
 */

export interface GeoLocationDetails {
  displayName: string;
  road?: string;
  village?: string;
  suburb?: string;
  county?: string;
  state?: string;
  country?: string;
  naturalLandmark?: string;
}

export interface TerrainElevationProfile {
  elevationMeters: number;
  elevationDelta?: number; // relative to user position
  slopePercentage?: number; // steepness
  terrainDifficulty: 'flat' | 'moderate' | 'steep' | 'extreme';
}

const NOMINATIM_REVERSE_API = 'https://nominatim.openstreetmap.org/reverse';
const ELEVATION_API = 'https://api.open-elevation.com/api/v1/lookup';

/**
 * Fetch real-time reverse geocoding details for GPS location
 */
export async function getRealtimeGeoDetails(lat: number, lng: number): Promise<GeoLocationDetails | null> {
  try {
    const url = `${NOMINATIM_REVERSE_API}?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'EmergencyTravellerRescueApp/1.0',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const addr = data.address || {};

    return {
      displayName: data.display_name || `${lat.toFixed(4)}°, ${lng.toFixed(4)}°`,
      road: addr.road || addr.track || addr.path,
      village: addr.village || addr.hamlet || addr.town || addr.city,
      suburb: addr.suburb || addr.neighbourhood,
      county: addr.county || addr.district,
      state: addr.state || addr.region,
      country: addr.country,
      naturalLandmark: addr.natural || addr.water || addr.reserve || addr.park,
    };
  } catch (err) {
    console.warn('Realtime reverse geocoding unavailable offline:', err);
    return null;
  }
}

/**
 * Fetch real-time elevation profile for coordinates
 */
export async function getTerrainElevation(
  userLat: number,
  userLng: number,
  targetLat?: number,
  targetLng?: number
): Promise<TerrainElevationProfile> {
  try {
    const locations = targetLat && targetLng
      ? [{ latitude: userLat, longitude: userLng }, { latitude: targetLat, longitude: targetLng }]
      : [{ latitude: userLat, longitude: userLng }];

    const res = await fetch(ELEVATION_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locations }),
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) throw new Error(`Elevation API status ${res.status}`);

    const data = await res.json();
    const results = data.results as Array<{ elevation: number }>;

    const userElev = results[0]?.elevation ?? 0;

    if (results.length > 1 && targetLat && targetLng) {
      const targetElev = results[1].elevation;
      const elevDelta = targetElev - userElev;
      
      // Compute slope
      const dLat = (targetLat - userLat) * 111000;
      const dLng = (targetLng - userLng) * 111000 * Math.cos(userLat * Math.PI / 180);
      const horizontalDist = Math.sqrt(dLat * dLat + dLng * dLng);
      const slope = horizontalDist > 0 ? (Math.abs(elevDelta) / horizontalDist) * 100 : 0;

      let difficulty: 'flat' | 'moderate' | 'steep' | 'extreme' = 'flat';
      if (slope > 25) difficulty = 'extreme';
      else if (slope > 15) difficulty = 'steep';
      else if (slope > 7) difficulty = 'moderate';

      return {
        elevationMeters: userElev,
        elevationDelta: elevDelta,
        slopePercentage: Math.round(slope * 10) / 10,
        terrainDifficulty: difficulty,
      };
    }

    return {
      elevationMeters: userElev,
      terrainDifficulty: 'flat',
    };
  } catch (err) {
    console.warn('Realtime elevation API fallback:', err);
    return {
      elevationMeters: 0,
      terrainDifficulty: 'moderate',
    };
  }
}

/**
 * Realtime Satellite & Orthophoto Tile Layer Configurations
 */
export const SATELLITE_IMAGERY_PROVIDERS = {
  esri_satellite: {
    name: 'Esri World High-Res Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Esri, Maxar, Earthstar Geographics, USDA, USGS',
  },
  topo_terrain: {
    name: 'OpenTopo High-Contour Elevation Terrain',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'OpenTopoMap, SRTM Elevation Data',
  },
  osm_standard: {
    name: 'OpenStreetMap Standard',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
  },
  night_vision: {
    name: 'Emergency Night-Vision Dark',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CARTO &copy; OpenStreetMap',
  },
};
