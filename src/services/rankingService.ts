/**
 * Exit Ranking Service — Intelligent Safety Scoring
 * 
 * Ranks destinations by safety rather than just proximity.
 * Uses weighted factors to determine which exits are truly safest.
 * 
 * SAFETY DISCLAIMER: This ranking is an estimation tool, not a guarantee.
 * Route conditions may differ from available data.
 */

import type { Destination, DestinationType, EmergencyProfile, RankingFactors } from '../types';

/** Reliability scores by destination type (0-100) */
const TYPE_RELIABILITY: Record<DestinationType, number> = {
  hospital: 95,
  police: 90,
  fire_station: 90,
  settlement: 85,
  highway: 80,
  rescue_center: 85,
  village: 70,
  hotel: 65,
  fuel_station: 70,
  school: 60,
  road: 55,
  shop: 50,
  other: 30,
};

/** Ranking weight configuration */
const WEIGHTS = {
  destinationReliability: 0.25,
  routeAccessibility: 0.20,
  roadConnectivity: 0.15,
  proximity: 0.15,
  populationDensity: 0.10,
  terrainDifficulty: -0.10,
  gpsUncertainty: -0.05,
};

/**
 * Rank a list of destinations by safety score.
 * Returns a new array sorted by score descending.
 */
export function rankDestinations(
  destinations: Destination[],
  gpsAccuracy: number,
  profile?: EmergencyProfile | null
): Destination[] {
  const ranked = destinations.map((dest) => {
    const factors = calculateFactors(dest, gpsAccuracy, profile);
    const score = calculateSafetyScore(factors);
    const rating = scoreToRating(score);

    return {
      ...dest,
      safetyScore: Math.round(score),
      safetyRating: rating,
    };
  });

  // Sort by safety score descending (safest first)
  ranked.sort((a, b) => b.safetyScore - a.safetyScore);

  return ranked;
}

/** Calculate individual ranking factors for a destination */
function calculateFactors(
  dest: Destination,
  gpsAccuracy: number,
  profile?: EmergencyProfile | null
): RankingFactors {
  // 1. Destination Reliability (based on type)
  let destinationReliability = TYPE_RELIABILITY[dest.type] || 30;
  
  // Boost hospitals if user is injured
  if (profile?.isInjured === 'yes' && dest.type === 'hospital') {
    destinationReliability = Math.min(100, destinationReliability + 10);
  }
  
  // Boost populated areas if user can't walk far
  if (profile?.canWalk === 'no' || profile?.canWalk === 'with_difficulty') {
    if (['settlement', 'village', 'hotel'].includes(dest.type)) {
      destinationReliability = Math.min(100, destinationReliability + 10);
    }
  }

  // 2. Route Accessibility (road access is a major factor)
  let routeAccessibility = 40; // Base: off-trail
  if (dest.roadAccess) {
    routeAccessibility = 85;
  }
  // Confidence boosts
  if (dest.confidence === 'high') routeAccessibility = Math.min(100, routeAccessibility + 10);
  if (dest.confidence === 'low') routeAccessibility = Math.max(0, routeAccessibility - 15);

  // 3. Road Connectivity (highways & settlements are connected)
  let roadConnectivity = 30;
  if (['highway', 'road'].includes(dest.type)) roadConnectivity = 95;
  if (['settlement', 'fuel_station'].includes(dest.type)) roadConnectivity = 85;
  if (['village', 'hotel', 'hospital'].includes(dest.type)) roadConnectivity = 70;
  if (['school', 'police', 'fire_station'].includes(dest.type)) roadConnectivity = 65;

  // 4. Proximity (inverse distance, normalized to 0-100)
  // Closer = higher score. Max score at 0.5km, 0 score at 50km+
  const proximity = Math.max(0, Math.min(100, 100 - (dest.distance / 50) * 100));

  // 5. Population Density (settlements > isolated facilities)
  let populationDensity = 20;
  if (['settlement'].includes(dest.type)) populationDensity = 95;
  if (['village'].includes(dest.type)) populationDensity = 70;
  if (['highway', 'road'].includes(dest.type)) populationDensity = 50;
  if (['hotel', 'fuel_station', 'shop'].includes(dest.type)) populationDensity = 60;
  if (['hospital', 'police', 'school'].includes(dest.type)) populationDensity = 55;

  // 6. Terrain Difficulty (estimated — no elevation data in basic search)
  // Use distance as a rough proxy: further = harder
  const terrainDifficulty = Math.min(100, dest.distance * 5);

  // 7. GPS Uncertainty (penalize when GPS accuracy is poor)
  const gpsUncertainty = Math.min(100, gpsAccuracy / 5);

  return {
    destinationReliability,
    routeAccessibility,
    roadConnectivity,
    proximity,
    populationDensity,
    terrainDifficulty,
    gpsUncertainty,
  };
}

/** Calculate weighted safety score from factors */
function calculateSafetyScore(factors: RankingFactors): number {
  const score =
    factors.destinationReliability * WEIGHTS.destinationReliability +
    factors.routeAccessibility * WEIGHTS.routeAccessibility +
    factors.roadConnectivity * WEIGHTS.roadConnectivity +
    factors.proximity * WEIGHTS.proximity +
    factors.populationDensity * WEIGHTS.populationDensity +
    factors.terrainDifficulty * Math.abs(WEIGHTS.terrainDifficulty) * -1 +
    factors.gpsUncertainty * Math.abs(WEIGHTS.gpsUncertainty) * -1;

  // Clamp between 0-100
  return Math.max(0, Math.min(100, score));
}

/** Convert score to safety rating */
function scoreToRating(score: number): 'recommended' | 'possible' | 'not_recommended' {
  if (score >= 60) return 'recommended';
  if (score >= 35) return 'possible';
  return 'not_recommended';
}

/** Get the best "ANY SAFE EXIT" destination */
export function findBestExit(destinations: Destination[]): Destination | null {
  if (destinations.length === 0) return null;
  
  // Already sorted by safety score from rankDestinations
  const recommended = destinations.filter((d) => d.safetyRating === 'recommended');
  if (recommended.length > 0) return recommended[0];
  
  const possible = destinations.filter((d) => d.safetyRating === 'possible');
  if (possible.length > 0) return possible[0];
  
  return destinations[0];
}

/** Get rating color class */
export function getRatingColor(rating: 'recommended' | 'possible' | 'not_recommended'): string {
  switch (rating) {
    case 'recommended': return 'var(--color-safety-green)';
    case 'possible': return 'var(--color-warning-amber)';
    case 'not_recommended': return 'var(--color-emergency-red)';
  }
}

/** Get rating label */
export function getRatingLabel(rating: 'recommended' | 'possible' | 'not_recommended'): string {
  switch (rating) {
    case 'recommended': return '🟢 Recommended';
    case 'possible': return '🟡 Possible';
    case 'not_recommended': return '🔴 Not Recommended';
  }
}
