/**
 * GPS Service — Browser Geolocation API Wrapper
 * 
 * Provides location tracking with configurable update intervals,
 * accuracy monitoring, and battery-saving mode support.
 */

import type { GPSPosition, LastKnownLocation } from '../types';

const STORAGE_KEY = 'etr_last_known_location';

/** Convert browser GeolocationPosition to our GPSPosition type */
function toGPSPosition(pos: GeolocationPosition): GPSPosition {
  return {
    latitude: pos.coords.latitude,
    longitude: pos.coords.longitude,
    accuracy: pos.coords.accuracy,
    altitude: pos.coords.altitude,
    altitudeAccuracy: pos.coords.altitudeAccuracy,
    heading: pos.coords.heading,
    speed: pos.coords.speed,
    timestamp: pos.timestamp,
  };
}

/** Check if the Geolocation API is available */
export function isGeolocationAvailable(): boolean {
  return 'geolocation' in navigator;
}

/** Get a single GPS position */
export function getCurrentPosition(
  highAccuracy: boolean = true,
  timeoutMs: number = 15000
): Promise<GPSPosition> {
  return new Promise((resolve, reject) => {
    if (!isGeolocationAvailable()) {
      reject(new Error('Geolocation is not available on this device'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const gpsPos = toGPSPosition(pos);
        saveLastKnownLocation(gpsPos);
        resolve(gpsPos);
      },
      (err) => {
        reject(new Error(`GPS Error: ${err.message} (code: ${err.code})`));
      },
      {
        enableHighAccuracy: highAccuracy,
        timeout: timeoutMs,
        maximumAge: 0,
      }
    );
  });
}

/** Watch GPS position with continuous updates */
export function watchPosition(
  onUpdate: (pos: GPSPosition) => void,
  onError: (err: Error) => void,
  options?: {
    highAccuracy?: boolean;
    maxAge?: number;
    timeout?: number;
  }
): number {
  if (!isGeolocationAvailable()) {
    onError(new Error('Geolocation is not available'));
    return -1;
  }

  const watchId = navigator.geolocation.watchPosition(
    (pos) => {
      const gpsPos = toGPSPosition(pos);
      saveLastKnownLocation(gpsPos);
      onUpdate(gpsPos);
    },
    (err) => {
      onError(new Error(`GPS Error: ${err.message} (code: ${err.code})`));
    },
    {
      enableHighAccuracy: options?.highAccuracy ?? true,
      maximumAge: options?.maxAge ?? 5000,
      timeout: options?.timeout ?? 15000,
    }
  );

  return watchId;
}

/** Stop watching GPS position */
export function clearWatch(watchId: number): void {
  if (watchId >= 0) {
    navigator.geolocation.clearWatch(watchId);
  }
}

/** Save last known location to localStorage */
function saveLastKnownLocation(pos: GPSPosition): void {
  try {
    const data: LastKnownLocation = {
      position: pos,
      source: 'gps',
      isStale: false,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage may be full or unavailable
  }
}

/** Get last known location from localStorage */
export function getLastKnownLocation(): LastKnownLocation | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const data: LastKnownLocation = JSON.parse(raw);
    // Mark as stale if older than 10 minutes
    const age = Date.now() - data.position.timestamp;
    data.isStale = age > 10 * 60 * 1000;
    return data;
  } catch {
    return null;
  }
}

/** Get GPS accuracy description */
export function getAccuracyDescription(accuracy: number): string {
  if (accuracy <= 5) return 'Excellent';
  if (accuracy <= 15) return 'Good';
  if (accuracy <= 30) return 'Fair';
  if (accuracy <= 100) return 'Poor';
  return 'Very Poor';
}

/** Format coordinates for display */
export function formatCoordinates(lat: number, lng: number, precision: number = 6): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(precision)}° ${latDir}, ${Math.abs(lng).toFixed(precision)}° ${lngDir}`;
}

/** Calculate distance between two GPS points using Haversine formula (in km) */
export function calculateDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Calculate bearing from point A to point B (in degrees) */
export function calculateBearing(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const dLng = toRadians(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(toRadians(lat2));
  const x =
    Math.cos(toRadians(lat1)) * Math.sin(toRadians(lat2)) -
    Math.sin(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.cos(dLng);
  let bearing = Math.atan2(y, x) * (180 / Math.PI);
  return (bearing + 360) % 360;
}

/** Convert bearing to compass direction label */
export function bearingToDirection(bearing: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                       'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(bearing / 22.5) % 16;
  return directions[index];
}

/** Convert bearing to descriptive direction */
export function bearingToDescriptiveDirection(bearing: number): string {
  if (bearing >= 337.5 || bearing < 22.5) return 'North';
  if (bearing >= 22.5 && bearing < 67.5) return 'Northeast';
  if (bearing >= 67.5 && bearing < 112.5) return 'East';
  if (bearing >= 112.5 && bearing < 157.5) return 'Southeast';
  if (bearing >= 157.5 && bearing < 202.5) return 'South';
  if (bearing >= 202.5 && bearing < 247.5) return 'Southwest';
  if (bearing >= 247.5 && bearing < 292.5) return 'West';
  return 'Northwest';
}

/** Convert bearing to arrow emoji */
export function bearingToArrow(bearing: number): string {
  const arrows = ['↑', '↗', '→', '↘', '↓', '↙', '←', '↖'];
  const index = Math.round(bearing / 45) % 8;
  return arrows[index];
}

/** Estimate walking time in minutes */
export function estimateWalkingTime(distanceKm: number, terrainFactor: number = 1.0): number {
  // Average walking speed: ~4-5 km/h on flat terrain
  const baseSpeed = 4.5; // km/h
  const adjustedSpeed = baseSpeed / terrainFactor;
  return Math.round((distanceKm / adjustedSpeed) * 60);
}

/** Estimate driving time in minutes */
export function estimateDrivingTime(distanceKm: number): number {
  // Average speed on rural/remote roads: ~40 km/h
  const avgSpeed = 40;
  return Math.round((distanceKm / avgSpeed) * 60);
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/** Format time in human-readable format */
export function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours} hr`;
  return `${hours} hr ${mins} min`;
}
