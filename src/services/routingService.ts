/**
 * Routing Service — OSRM Integration
 * 
 * Calculates routes between user position and destinations.
 * Falls back to straight-line bearing when offline.
 */

import type { Route, Destination, SafetyAlert } from '../types';

const OSRM_API = 'https://router.project-osrm.org';

/**
 * Get a route from user position to a destination.
 * Uses OSRM for online routing, falls back to straight-line when offline.
 */
export async function getRoute(
  fromLat: number,
  fromLng: number,
  destination: Destination,
  profile: 'walking' | 'driving' = 'walking'
): Promise<Route> {
  try {
    return await getOSRMRoute(fromLat, fromLng, destination, profile);
  } catch (error) {
    console.warn('OSRM routing failed, using straight-line fallback:', error);
    return getStraightLineRoute(fromLat, fromLng, destination, profile);
  }
}

/** Get route via OSRM public API */
async function getOSRMRoute(
  fromLat: number,
  fromLng: number,
  destination: Destination,
  profile: 'walking' | 'driving'
): Promise<Route> {
  const osrmProfile = profile === 'walking' ? 'foot' : 'car';
  const url = `${OSRM_API}/route/v1/${osrmProfile}/${fromLng},${fromLat};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson&steps=true`;

  const response = await fetch(url, {
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`OSRM error: ${response.status}`);
  }

  const data = await response.json();

  if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
    throw new Error('No route found');
  }

  const osrmRoute = data.routes[0];
  const coordinates: [number, number][] = osrmRoute.geometry.coordinates.map(
    (coord: [number, number]) => [coord[1], coord[0]] // GeoJSON [lng, lat] → [lat, lng]
  );

  const steps = osrmRoute.legs[0]?.steps?.map((step: {
    maneuver: { instruction: string; bearing_after: number; location: [number, number] };
    distance: number;
    duration: number;
  }) => ({
    instruction: step.maneuver.instruction || 'Continue',
    distance: step.distance,
    duration: step.duration,
    bearing: step.maneuver.bearing_after,
    coordinates: [step.maneuver.location[1], step.maneuver.location[0]] as [number, number],
  })) || [];

  const warnings = generateRouteWarnings(destination, osrmRoute.distance / 1000);

  return {
    id: `route-${Date.now()}`,
    destination,
    geometry: coordinates,
    distance: Math.round((osrmRoute.distance / 1000) * 100) / 100,
    duration: Math.round(osrmRoute.duration / 60),
    steps,
    profile,
    source: 'osrm',
    warnings,
  };
}

/** Generate a straight-line fallback route when routing API is unavailable */
function getStraightLineRoute(
  fromLat: number,
  fromLng: number,
  destination: Destination,
  profile: 'walking' | 'driving'
): Route {
  const warnings: SafetyAlert[] = [
    {
      id: 'warn-straight-line',
      type: 'warning',
      message: 'This is a straight-line direction only. Actual route may differ significantly. Route data is unavailable offline.',
      icon: '⚠️',
      isVerified: true,
    },
    ...generateRouteWarnings(destination, destination.distance),
  ];

  return {
    id: `route-sl-${Date.now()}`,
    destination,
    geometry: [
      [fromLat, fromLng],
      [destination.latitude, destination.longitude],
    ],
    distance: destination.distance,
    duration: profile === 'walking' ? destination.estimatedWalkTime : (destination.estimatedDriveTime || destination.estimatedWalkTime),
    steps: [
      {
        instruction: `Head ${destination.direction} toward ${destination.name}`,
        distance: destination.distance * 1000,
        duration: (profile === 'walking' ? destination.estimatedWalkTime : (destination.estimatedDriveTime || destination.estimatedWalkTime)) * 60,
        bearing: destination.bearing,
        coordinates: [fromLng, fromLat],
      },
    ],
    profile,
    source: 'straight_line',
    warnings,
  };
}

/** Generate safety warnings for a route */
function generateRouteWarnings(destination: Destination, distanceKm: number): SafetyAlert[] {
  const warnings: SafetyAlert[] = [];

  if (!destination.roadAccess) {
    warnings.push({
      id: 'warn-no-road',
      type: 'warning',
      message: 'No known road access to this destination. Off-trail travel may be required.',
      icon: '⚠️',
      isVerified: false,
    });
  }

  if (distanceKm > 20) {
    warnings.push({
      id: 'warn-long-distance',
      type: 'warning',
      message: `This destination is ${distanceKm.toFixed(1)} km away. Consider resting and rationing water.`,
      icon: '⚠️',
      isVerified: true,
    });
  }

  if (destination.confidence === 'low') {
    warnings.push({
      id: 'warn-low-confidence',
      type: 'info',
      message: 'Location data for this destination has low confidence. It may not be accurate.',
      icon: 'ℹ️',
      isVerified: true,
    });
  }

  if (destination.source === 'mock') {
    warnings.push({
      id: 'warn-mock-data',
      type: 'danger',
      message: 'This is simulated data for demonstration purposes. Do NOT rely on this for actual navigation.',
      icon: '🚫',
      isVerified: true,
    });
  }

  return warnings;
}
