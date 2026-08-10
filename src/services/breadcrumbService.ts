/**
 * Breadcrumb Service — Movement Trail Recorder
 * 
 * Records the user's path as a breadcrumb trail on the map.
 * Supports start/pause/resume/stop and "follow my track back" navigation.
 */

import type { BreadcrumbTrack, BreadcrumbPoint, GPSPosition } from '../types';
import { calculateDistance } from './gpsService';
import { saveTrack } from './storageService';

const MIN_DISTANCE_METERS = 10; // Minimum distance between breadcrumb points

/** Create a new breadcrumb track */
export function createTrack(name?: string): BreadcrumbTrack {
  return {
    id: `track-${Date.now()}`,
    name: name || `Track ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
    points: [],
    startTime: Date.now(),
    endTime: null,
    totalDistance: 0,
    status: 'recording',
  };
}

/** Add a point to the breadcrumb track */
export function addPoint(track: BreadcrumbTrack, position: GPSPosition): BreadcrumbTrack {
  const newPoint: BreadcrumbPoint = {
    latitude: position.latitude,
    longitude: position.longitude,
    altitude: position.altitude,
    timestamp: position.timestamp,
    accuracy: position.accuracy,
  };

  // Check minimum distance from last point
  if (track.points.length > 0) {
    const lastPoint = track.points[track.points.length - 1];
    const distanceKm = calculateDistance(
      lastPoint.latitude, lastPoint.longitude,
      newPoint.latitude, newPoint.longitude
    );
    const distanceMeters = distanceKm * 1000;

    if (distanceMeters < MIN_DISTANCE_METERS) {
      return track; // Too close, skip
    }

    return {
      ...track,
      points: [...track.points, newPoint],
      totalDistance: track.totalDistance + distanceKm,
    };
  }

  return {
    ...track,
    points: [newPoint],
  };
}

/** Pause tracking */
export function pauseTrack(track: BreadcrumbTrack): BreadcrumbTrack {
  return { ...track, status: 'paused' };
}

/** Resume tracking */
export function resumeTrack(track: BreadcrumbTrack): BreadcrumbTrack {
  return { ...track, status: 'recording' };
}

/** Stop and finalize tracking */
export function stopTrack(track: BreadcrumbTrack): BreadcrumbTrack {
  const stopped = {
    ...track,
    status: 'stopped' as const,
    endTime: Date.now(),
  };
  
  // Persist to storage
  saveTrack(stopped).catch(console.error);
  
  return stopped;
}

/** Get the reversed track for "Follow My Track Back" */
export function reverseTrack(track: BreadcrumbTrack): BreadcrumbPoint[] {
  return [...track.points].reverse();
}

/** Check if backtracking might be dangerous (basic heuristic) */
export function isBacktrackRisky(track: BreadcrumbTrack): { risky: boolean; reason: string | null } {
  if (track.points.length < 3) {
    return { risky: false, reason: null };
  }

  // Check if the track involves significant elevation changes (if data available)
  const altitudes = track.points
    .map((p) => p.altitude)
    .filter((a): a is number => a !== null);

  if (altitudes.length >= 2) {
    const maxAlt = Math.max(...altitudes);
    const minAlt = Math.min(...altitudes);
    if (maxAlt - minAlt > 500) {
      return {
        risky: true,
        reason: 'This track involves significant elevation changes (>500m). Backtracking may be strenuous.',
      };
    }
  }

  // Check if track is very long
  if (track.totalDistance > 15) {
    return {
      risky: true,
      reason: `This track is ${track.totalDistance.toFixed(1)} km long. Ensure you have sufficient water and energy before backtracking.`,
    };
  }

  // Check track age
  const trackDuration = (track.endTime || Date.now()) - track.startTime;
  const hoursElapsed = trackDuration / (1000 * 60 * 60);
  if (hoursElapsed > 6) {
    return {
      risky: true,
      reason: 'This track was recorded over 6 hours ago. Conditions may have changed.',
    };
  }

  return { risky: false, reason: null };
}

/** Get track as Leaflet-compatible coordinates [[lat, lng], ...] */
export function getTrackCoordinates(track: BreadcrumbTrack): [number, number][] {
  return track.points.map((p) => [p.latitude, p.longitude]);
}

/** Get track duration in a human-readable format */
export function getTrackDuration(track: BreadcrumbTrack): string {
  const end = track.endTime || Date.now();
  const durationMs = end - track.startTime;
  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
