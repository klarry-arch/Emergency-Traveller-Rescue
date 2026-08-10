/**
 * Route Screen — Navigation to selected destination
 * 
 * Shows route on a map with distance, ETA, safety alerts,
 * and compass bearing overlay.
 */

import type { GPSPosition, Destination, Route } from '../types';
import { formatCoordinates, formatTime, bearingToArrow, bearingToDescriptiveDirection, calculateBearing, calculateDistance } from '../services/gpsService';
import { getRatingLabel } from '../services/rankingService';
import { DESTINATION_ICONS } from '../services/poiService';
import LiveMapView from '../components/LiveMapView';

interface RouteScreenProps {
  position: GPSPosition | null;
  destination: Destination | null;
  route: Route | null;
  compassHeading: number | null;
  onBack: () => void;
  onSOS: () => void;
}

export default function RouteScreen({
  position,
  destination,
  route,
  compassHeading,
  onBack,
  onSOS,
}: RouteScreenProps) {
  if (!destination) {
    return (
      <div className="screen" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <p>No destination selected.</p>
        <button className="btn btn--primary" onClick={onBack}>Go Back</button>
      </div>
    );
  }

  const icon = DESTINATION_ICONS[destination.type] || '📍';
  const currentDistance = position
    ? calculateDistance(position.latitude, position.longitude, destination.latitude, destination.longitude)
    : destination.distance;
  const currentBearing = position
    ? calculateBearing(position.latitude, position.longitude, destination.latitude, destination.longitude)
    : destination.bearing;

  return (
    <div className="screen">
      {/* Header */}
      <div className="nav-bar" style={{ margin: 'calc(-1 * var(--space-4))', marginBottom: 'var(--space-4)', position: 'static' }}>
        <button className="nav-bar__back" onClick={onBack}>← Back</button>
        <span className="nav-bar__title">🧭 Navigation</span>
        <button className="btn btn--danger btn--icon" onClick={onSOS} style={{ fontSize: 'var(--text-xs)', fontWeight: 800 }}>
          SOS
        </button>
      </div>

      {/* Interactive Navigation Map View */}
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <LiveMapView
          position={position}
          destinations={[destination]}
          selectedDestination={destination}
          route={route}
          compassHeading={compassHeading}
          height="280px"
        />
      </div>

      {/* Destination Header */}
      <div className="card" style={{ marginBottom: 'var(--space-4)', textAlign: 'center' }}>
        <div style={{ fontSize: 'var(--text-4xl)' }}>{icon}</div>
        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, margin: 'var(--space-2) 0' }}>
          {destination.name}
        </h2>
        <div className={`status-badge status-badge--${destination.safetyRating.replace('_', '-')}`}
             style={{ margin: '0 auto' }}>
          {getRatingLabel(destination.safetyRating)}
        </div>
      </div>

      {/* Live Navigation Stats */}
      <div className="dashboard" style={{ marginBottom: 'var(--space-4)' }}>
        <div className="dashboard__item">
          <div className="dashboard__label">Distance</div>
          <div className="dashboard__value dashboard__value--lg">
            {currentDistance.toFixed(1)}
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 400 }}> km</span>
          </div>
        </div>
        <div className="dashboard__item">
          <div className="dashboard__label">Direction</div>
          <div className="dashboard__value dashboard__value--lg">
            {bearingToArrow(currentBearing)} {bearingToDescriptiveDirection(currentBearing)}
          </div>
        </div>
        <div className="dashboard__item">
          <div className="dashboard__label">Est. Walking</div>
          <div className="dashboard__value">
            ~{formatTime(route?.duration || destination.estimatedWalkTime)}
          </div>
        </div>
        <div className="dashboard__item">
          <div className="dashboard__label">Bearing</div>
          <div className="dashboard__value font-mono">
            {Math.round(currentBearing)}°
          </div>
        </div>
        {route && (
          <div className="dashboard__item">
            <div className="dashboard__label">Route Type</div>
            <div className="dashboard__value dashboard__value--sm">
              {route.source === 'osrm' ? '🛤️ Routed' : '📐 Straight Line'}
            </div>
          </div>
        )}
        <div className="dashboard__item">
          <div className="dashboard__label">Road Access</div>
          <div className="dashboard__value dashboard__value--sm">
            {destination.roadAccess ? '✅ Yes' : '❌ No'}
          </div>
        </div>
      </div>

      {/* Large Compass Direction */}
      <div style={{
        textAlign: 'center',
        padding: 'var(--space-8)',
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border-primary)',
        marginBottom: 'var(--space-4)',
      }}>
        <div style={{ fontSize: '80px', lineHeight: 1 }}>
          {bearingToArrow(currentBearing)}
        </div>
        <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, marginTop: 'var(--space-3)' }}>
          Head {bearingToDescriptiveDirection(currentBearing)}
        </div>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>
          {Math.round(currentBearing)}° • {currentDistance.toFixed(1)} km remaining
        </div>
        {compassHeading !== null && (
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 'var(--space-2)' }}>
            Your heading: {Math.round(compassHeading)}°
            {Math.abs(compassHeading - currentBearing) < 20 && (
              <span style={{ color: 'var(--color-safety-green)', fontWeight: 600 }}> ✅ On track</span>
            )}
          </div>
        )}
      </div>

      {/* Route Steps */}
      {route && route.steps.length > 0 && (
        <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
          <div style={{ fontWeight: 700, marginBottom: 'var(--space-3)', fontSize: 'var(--text-sm)' }}>
            Route Steps
          </div>
          {route.steps.map((step, idx) => (
            <div key={idx} style={{
              display: 'flex',
              gap: 'var(--space-3)',
              padding: 'var(--space-2) 0',
              borderBottom: idx < route.steps.length - 1 ? '1px solid var(--border-secondary)' : 'none',
            }}>
              <span style={{ color: 'var(--color-forest-400)', fontWeight: 600, minWidth: 24 }}>
                {idx + 1}
              </span>
              <div>
                <div style={{ fontSize: 'var(--text-sm)' }}>{step.instruction}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                  {(step.distance / 1000).toFixed(1)} km • {formatTime(Math.round(step.duration / 60))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Safety Warnings */}
      {route && route.warnings.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
          {route.warnings.map((warn) => (
            <div key={warn.id} className={`safety-alert safety-alert--${warn.type}`}>
              <span className="safety-alert__icon">{warn.icon}</span>
              <span className="safety-alert__text">{warn.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Coordinates */}
      {position && (
        <div className="coordinates" style={{ marginBottom: 'var(--space-4)' }}>
          <div className="coordinates__label">Your Position</div>
          <div style={{ fontSize: 'var(--text-sm)' }}>{formatCoordinates(position.latitude, position.longitude, 5)}</div>
        </div>
      )}

      {/* Safety Notice */}
      <div className="safety-alert safety-alert--info">
        <span className="safety-alert__icon">ℹ️</span>
        <span className="safety-alert__text">
          Route information may be incomplete. Conditions may differ from available data. 
          Exercise caution and contact emergency services if in danger.
        </span>
      </div>
    </div>
  );
}
