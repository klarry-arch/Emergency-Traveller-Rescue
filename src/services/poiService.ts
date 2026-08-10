/**
 * POI Search Service — Overpass API Integration
 * 
 * Searches for nearby points of interest using the OpenStreetMap Overpass API.
 * Falls back to cached results when offline.
 */

import type { Destination, DestinationType } from '../types';
import { calculateDistance, calculateBearing, bearingToDescriptiveDirection, estimateWalkingTime, estimateDrivingTime } from './gpsService';
import localforage from 'localforage';

const OVERPASS_API = 'https://overpass-api.de/api/interpreter';
const CACHE_KEY = 'etr_poi_cache';

/** OSM tag mappings for each destination type */
const OSM_TAGS: Record<DestinationType, string[]> = {
  hospital: ['"amenity"="hospital"', '"amenity"="clinic"', '"amenity"="doctors"'],
  police: ['"amenity"="police"'],
  fire_station: ['"amenity"="fire_station"'],
  school: ['"amenity"="school"', '"amenity"="university"', '"amenity"="college"'],
  highway: ['"highway"="motorway"', '"highway"="trunk"', '"highway"="primary"'],
  road: ['"highway"="secondary"', '"highway"="tertiary"', '"highway"="residential"'],
  settlement: ['"place"="town"', '"place"="city"'],
  village: ['"place"="village"', '"place"="hamlet"'],
  hotel: ['"tourism"="hotel"', '"tourism"="motel"', '"tourism"="guest_house"', '"tourism"="hostel"'],
  fuel_station: ['"amenity"="fuel"'],
  shop: ['"shop"~".*"'],
  rescue_center: ['"emergency"="assembly_point"', '"amenity"="ranger_station"'],
  other: [],
};

/** Icon mapping for destination types */
export const DESTINATION_ICONS: Record<DestinationType, string> = {
  hospital: '🏥',
  police: '🚓',
  fire_station: '🚒',
  school: '🏫',
  highway: '🛣️',
  road: '🛤️',
  settlement: '🏘️',
  village: '🏘️',
  hotel: '🏨',
  fuel_station: '⛽',
  shop: '🏪',
  rescue_center: '🆘',
  other: '📍',
};

/** Human-readable labels for destination types */
export const DESTINATION_LABELS: Record<DestinationType, string> = {
  hospital: 'Hospital / Clinic',
  police: 'Police Station',
  fire_station: 'Fire / Rescue Station',
  school: 'School',
  highway: 'Highway',
  road: 'Road',
  settlement: 'Town / City',
  village: 'Village',
  hotel: 'Hotel / Lodge',
  fuel_station: 'Fuel Station',
  shop: 'Shop',
  rescue_center: 'Rescue Center',
  other: 'Other',
};

/** Default destination categories with enabled state */
export function getDefaultCategories() {
  return [
    { type: 'hospital' as DestinationType, label: 'Hospitals', icon: '🏥', enabled: true },
    { type: 'police' as DestinationType, label: 'Police', icon: '🚓', enabled: true },
    { type: 'fire_station' as DestinationType, label: 'Fire/Rescue', icon: '🚒', enabled: true },
    { type: 'highway' as DestinationType, label: 'Highways', icon: '🛣️', enabled: true },
    { type: 'road' as DestinationType, label: 'Roads', icon: '🛤️', enabled: true },
    { type: 'settlement' as DestinationType, label: 'Towns', icon: '🏘️', enabled: true },
    { type: 'village' as DestinationType, label: 'Villages', icon: '🏘️', enabled: true },
    { type: 'school' as DestinationType, label: 'Schools', icon: '🏫', enabled: true },
    { type: 'hotel' as DestinationType, label: 'Hotels', icon: '🏨', enabled: true },
    { type: 'fuel_station' as DestinationType, label: 'Fuel', icon: '⛽', enabled: true },
    { type: 'shop' as DestinationType, label: 'Shops', icon: '🏪', enabled: true },
    { type: 'rescue_center' as DestinationType, label: 'Rescue', icon: '🆘', enabled: true },
  ];
}

/** Build Overpass query for multiple POI types */
function buildOverpassQuery(
  lat: number,
  lng: number,
  radiusMeters: number,
  types: DestinationType[]
): string {
  const tagQueries = types
    .flatMap((type) =>
      OSM_TAGS[type].map(
        (tag) => `  nwr[${tag}](around:${radiusMeters},${lat},${lng});`
      )
    )
    .join('\n');

  return `
[out:json][timeout:30];
(
${tagQueries}
);
out center body qt 100;
  `.trim();
}

/** Search for nearby POIs via Overpass API */
export async function searchNearbyPOIs(
  lat: number,
  lng: number,
  radiusKm: number,
  types: DestinationType[]
): Promise<Destination[]> {
  const radiusMeters = radiusKm * 1000;

  // Try online search first
  try {
    const query = buildOverpassQuery(lat, lng, radiusMeters, types);
    const response = await fetch(OVERPASS_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status}`);
    }

    const data = await response.json();
    const destinations = parseOverpassResults(data, lat, lng);

    // Cache results
    await cachePOIs(lat, lng, radiusKm, destinations);

    return destinations;
  } catch (error) {
    console.warn('Online POI search failed, trying cache:', error);

    // Fall back to cache
    const cached = await getCachedPOIs(lat, lng, radiusKm);
    if (cached && cached.length > 0) {
      return cached.map((d) => ({ ...d, source: 'cached' as const }));
    }

    // Fall back to mock data
    return generateMockDestinations(lat, lng, radiusKm, types);
  }
}

/** Parse Overpass API JSON results into Destination objects */
function parseOverpassResults(
  data: { elements: Array<Record<string, unknown>> },
  userLat: number,
  userLng: number
): Destination[] {
  const destinations: Destination[] = [];

  for (const element of data.elements) {
    const tags = (element.tags || {}) as Record<string, string>;
    const elLat = (element.lat ?? (element.center as { lat: number })?.lat) as number;
    const elLng = (element.lon ?? (element.center as { lon: number })?.lon) as number;

    if (!elLat || !elLng) continue;

    const type = determineType(tags);
    const name = tags.name || tags['name:en'] || DESTINATION_LABELS[type];
    const distance = calculateDistance(userLat, userLng, elLat, elLng);
    const bearing = calculateBearing(userLat, userLng, elLat, elLng);
    const hasRoad = tags.highway !== undefined || type === 'highway' || type === 'road';

    destinations.push({
      id: `osm-${element.id}`,
      name,
      type,
      latitude: elLat,
      longitude: elLng,
      distance: Math.round(distance * 100) / 100,
      estimatedWalkTime: estimateWalkingTime(distance),
      estimatedDriveTime: hasRoad ? estimateDrivingTime(distance) : null,
      direction: bearingToDescriptiveDirection(bearing),
      bearing,
      roadAccess: hasRoad,
      confidence: distance < 5 ? 'high' : distance < 20 ? 'medium' : 'low',
      safetyScore: 0, // Calculated by ranking service
      safetyRating: 'possible',
      source: 'osm',
      tags,
    });
  }

  return destinations;
}

/** Determine destination type from OSM tags */
function determineType(tags: Record<string, string>): DestinationType {
  if (tags.amenity === 'hospital' || tags.amenity === 'clinic' || tags.amenity === 'doctors') return 'hospital';
  if (tags.amenity === 'police') return 'police';
  if (tags.amenity === 'fire_station') return 'fire_station';
  if (tags.amenity === 'school' || tags.amenity === 'university' || tags.amenity === 'college') return 'school';
  if (tags.amenity === 'fuel') return 'fuel_station';
  if (tags.amenity === 'ranger_station' || tags.emergency === 'assembly_point') return 'rescue_center';
  if (tags.highway === 'motorway' || tags.highway === 'trunk' || tags.highway === 'primary') return 'highway';
  if (tags.highway) return 'road';
  if (tags.place === 'town' || tags.place === 'city') return 'settlement';
  if (tags.place === 'village' || tags.place === 'hamlet') return 'village';
  if (tags.tourism === 'hotel' || tags.tourism === 'motel' || tags.tourism === 'guest_house' || tags.tourism === 'hostel') return 'hotel';
  if (tags.shop) return 'shop';
  return 'other';
}

/** Cache POIs to IndexedDB */
async function cachePOIs(lat: number, lng: number, radius: number, pois: Destination[]): Promise<void> {
  try {
    const cacheKey = `${CACHE_KEY}_${lat.toFixed(2)}_${lng.toFixed(2)}_${radius}`;
    await localforage.setItem(cacheKey, {
      timestamp: Date.now(),
      pois,
    });
  } catch {
    // Cache write failure is non-critical
  }
}

/** Retrieve cached POIs from IndexedDB */
async function getCachedPOIs(lat: number, lng: number, radius: number): Promise<Destination[] | null> {
  try {
    const cacheKey = `${CACHE_KEY}_${lat.toFixed(2)}_${lng.toFixed(2)}_${radius}`;
    const cached = await localforage.getItem<{ timestamp: number; pois: Destination[] }>(cacheKey);
    if (cached) {
      return cached.pois;
    }
  } catch {
    // Cache read failure
  }
  return null;
}

/** Generate mock destinations when offline with no cache — clearly labeled as mock data */
function generateMockDestinations(
  lat: number,
  lng: number,
  radiusKm: number,
  types: DestinationType[]
): Destination[] {
  const mockData: Destination[] = [];
  const mockPoints = [
    { offset: [0.01, 0.02], name: 'Local Health Centre', type: 'hospital' as DestinationType },
    { offset: [-0.015, 0.01], name: 'Main Highway', type: 'highway' as DestinationType },
    { offset: [0.025, -0.01], name: 'Nearby Village', type: 'village' as DestinationType },
    { offset: [-0.005, -0.02], name: 'Rural Police Post', type: 'police' as DestinationType },
    { offset: [0.03, 0.015], name: 'Trading Centre', type: 'shop' as DestinationType },
    { offset: [-0.02, 0.025], name: 'Secondary School', type: 'school' as DestinationType },
    { offset: [0.008, -0.03], name: 'Guest House', type: 'hotel' as DestinationType },
    { offset: [-0.035, -0.005], name: 'Fuel Station', type: 'fuel_station' as DestinationType },
  ];

  for (const mock of mockPoints) {
    if (!types.includes(mock.type)) continue;

    const destLat = lat + mock.offset[0];
    const destLng = lng + mock.offset[1];
    const distance = calculateDistance(lat, lng, destLat, destLng);

    if (distance > radiusKm) continue;

    const bearing = calculateBearing(lat, lng, destLat, destLng);

    mockData.push({
      id: `mock-${mock.name.replace(/\s+/g, '-').toLowerCase()}`,
      name: `[Mock] ${mock.name}`,
      type: mock.type,
      latitude: destLat,
      longitude: destLng,
      distance: Math.round(distance * 100) / 100,
      estimatedWalkTime: estimateWalkingTime(distance),
      estimatedDriveTime: estimateDrivingTime(distance),
      direction: bearingToDescriptiveDirection(bearing),
      bearing,
      roadAccess: ['highway', 'road', 'fuel_station'].includes(mock.type),
      confidence: 'low',
      safetyScore: 0,
      safetyRating: 'possible',
      source: 'mock',
    });
  }

  return mockData;
}
