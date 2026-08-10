/**
 * Home Screen — Main Dashboard
 * 
 * Shows current location, GPS accuracy, battery, network status.
 * Primary "I'M LOST — HELP ME" and SOS buttons.
 */

import { useState, useEffect } from 'react';
import type { GPSPosition, Destination, NetworkStatus, BreadcrumbTrack, Screen } from '../types';
import { formatCoordinates, getAccuracyDescription } from '../services/gpsService';
import { getBatteryIcon, getBatteryColor } from '../services/batteryService';
import { getRealtimeGeoDetails, type GeoLocationDetails } from '../services/geoImagingService';
import LiveMapView from '../components/LiveMapView';

interface HomeScreenProps {
  position: GPSPosition | null;
  gpsError: string | null;
  isTracking: boolean;
  batteryLevel: number | null;
  batteryCharging: boolean;
  networkStatus: NetworkStatus;
  bestExit: Destination | null;
  onImLost: () => void;
  onSOS: () => void;
  onNavigate: (screen: Screen) => void;
  breadcrumbTrack: BreadcrumbTrack | null;
}

export default function HomeScreen({
  position,
  gpsError,
  isTracking,
  batteryLevel,
  batteryCharging,
  networkStatus,
  bestExit,
  onImLost,
  onSOS,
  onNavigate,
  breadcrumbTrack,
}: HomeScreenProps) {
  const networkLabel = networkStatus === 'online' ? 'Online' : networkStatus === 'limited' ? 'Limited' : 'Offline';
  const networkClass = `status-dot--${networkStatus}`;

  const [geoDetails, setGeoDetails] = useState<GeoLocationDetails | null>(null);

  useEffect(() => {
    if (!position) return;
    getRealtimeGeoDetails(position.latitude, position.longitude).then((details) => {
      if (details) setGeoDetails(details);
    });
  }, [position?.latitude, position?.longitude]);

  return (
    <div className="screen">
      {/* Status Bar */}
      <div className="status-bar" style={{ marginBottom: 'var(--space-4)' }}>
        <div className="status-bar__item">
          <span className={`status-dot ${networkClass}`} />
          <span>{networkLabel}</span>
        </div>
        <div className="status-bar__item">
          <span>{isTracking ? '📡' : '❌'}</span>
          <span>GPS {isTracking ? (position ? getAccuracyDescription(position.accuracy) : 'Acquiring') : 'Off'}</span>
        </div>
        <div className="status-bar__item">
          <span>{getBatteryIcon(batteryLevel || 0, batteryCharging)}</span>
          <span style={{ color: getBatteryColor(batteryLevel || 100) }}>
            {batteryLevel !== null ? `${batteryLevel}%` : '—'}
          </span>
        </div>
      </div>

      {/* GPS Coordinates & Realtime Geographical Landmark */}
      <div className="coordinates" style={{ marginBottom: 'var(--space-4)' }}>
        <div className="coordinates__label">Current Location</div>
        {position ? (
          <div>{formatCoordinates(position.latitude, position.longitude, 5)}</div>
        ) : (
          <div style={{ color: 'var(--text-tertiary)' }}>
            {gpsError || 'Acquiring GPS signal...'}
          </div>
        )}
        {geoDetails && (
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-forest-300)', fontWeight: 600, marginTop: 'var(--space-2)' }}>
            🗺️ {geoDetails.naturalLandmark || geoDetails.village || geoDetails.county || geoDetails.displayName}
          </div>
        )}
        {position && (
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 'var(--space-1)' }}>
            Accuracy: ±{Math.round(position.accuracy)}m ({getAccuracyDescription(position.accuracy)})
          </div>
        )}
      </div>

      {/* Live Map View for Current User */}
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <LiveMapView
          position={position}
          destinations={bestExit ? [bestExit] : []}
          selectedDestination={bestExit}
          breadcrumbTrack={breadcrumbTrack}
          height="220px"
        />
      </div>

      {/* Main Emergency Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
        <button className="mega-btn mega-btn--lost" onClick={onImLost}>
          <span className="mega-btn__icon">🆘</span>
          I'M LOST — HELP ME
          <span className="mega-btn__subtitle">Activate emergency mode & find your way out</span>
        </button>

        <button className="mega-btn mega-btn--sos" onClick={onSOS}>
          SOS
          <span className="mega-btn__subtitle">Send emergency alert</span>
        </button>
      </div>

      {/* Quick Info Dashboard */}
      <div className="dashboard" style={{ marginBottom: 'var(--space-4)' }}>
        <div className="dashboard__item" onClick={() => onNavigate('compass')} style={{ cursor: 'pointer' }}>
          <div className="dashboard__label">Compass</div>
          <div className="dashboard__value">🧭</div>
        </div>
        <div className="dashboard__item" onClick={() => onNavigate('trip')} style={{ cursor: 'pointer' }}>
          <div className="dashboard__label">Trip</div>
          <div className="dashboard__value">🗺️</div>
        </div>
        <div className="dashboard__item" onClick={() => onNavigate('contacts')} style={{ cursor: 'pointer' }}>
          <div className="dashboard__label">Contacts</div>
          <div className="dashboard__value">👥</div>
        </div>
        <div className="dashboard__item" onClick={() => onNavigate('offline_maps')} style={{ cursor: 'pointer' }}>
          <div className="dashboard__label">Offline Maps</div>
          <div className="dashboard__value">📥</div>
        </div>
      </div>

      {/* Nearest Safe Exit (if available) */}
      {bestExit && (
        <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
          <div className="dashboard__label">Nearest Safe Exit</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
            <span style={{ fontSize: 'var(--text-2xl)' }}>
              {bestExit.type === 'hospital' ? '🏥' : bestExit.type === 'highway' ? '🛣️' : '📍'}
            </span>
            <div>
              <div style={{ fontWeight: 700 }}>{bestExit.name}</div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                {bestExit.distance.toFixed(1)} km • {bestExit.direction}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Breadcrumb Status */}
      {breadcrumbTrack && (
        <div className="card" style={{ background: 'rgba(22, 163, 74, 0.1)', borderColor: 'rgba(22, 163, 74, 0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span className={`status-dot ${breadcrumbTrack.status === 'recording' ? 'status-dot--online' : 'status-dot--limited'}`} />
            <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>
              {breadcrumbTrack.status === 'recording' ? 'Recording Trail' : 'Trail Paused'}
            </span>
            <span style={{ marginLeft: 'auto', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              {breadcrumbTrack.points.length} pts • {breadcrumbTrack.totalDistance.toFixed(1)} km
            </span>
          </div>
        </div>
      )}

      {/* Safety Disclaimer */}
      <div style={{ marginTop: 'auto', paddingTop: 'var(--space-4)' }}>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', textAlign: 'center' }}>
          Emergency assistance tool — not a guaranteed rescue system.
          <br />Always contact local emergency services when in danger.
        </p>
      </div>
    </div>
  );
}
