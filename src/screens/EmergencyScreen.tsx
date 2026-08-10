/**
 * Emergency Screen — Active Emergency Mode
 * 
 * Emergency situation profile, FIND MY WAY OUT,
 * SOS, share location, compass, follow track.
 */

import { useState } from 'react';
import type {
  GPSPosition, NetworkStatus, EmergencyProfile,
  SOSData, Destination, BreadcrumbTrack, Screen
} from '../types';
import { formatCoordinates, getAccuracyDescription, formatTime, calculateBearing, bearingToArrow } from '../services/gpsService';
import { getBatteryColor } from '../services/batteryService';
import { getRatingLabel } from '../services/rankingService';
import { callEmergencyServices, callContact, sendSMSToContact } from '../services/sosService';

interface EmergencyScreenProps {
  position: GPSPosition | null;
  batteryLevel: number | null;
  networkStatus: NetworkStatus;
  emergencyProfile: EmergencyProfile;
  sosData: SOSData | null;
  compassHeading: number | null;
  selectedDestination: Destination | null;
  breadcrumbTrack: BreadcrumbTrack | null;
  onUpdateProfile: (profile: EmergencyProfile) => void;
  onFindMyWayOut: () => void;
  onSOS: () => void;
  onShareLocation: () => void;
  onToggleTracking: () => void;
  onStopTracking: () => void;
  onNavigate: (screen: Screen) => void;
  onBack: () => void;
  isSearching: boolean;
}

export default function EmergencyScreen({
  position,
  batteryLevel,
  networkStatus,
  emergencyProfile,
  sosData,
  compassHeading: _compassHeading,
  selectedDestination,
  breadcrumbTrack,
  onUpdateProfile,
  onFindMyWayOut,
  onSOS,
  onShareLocation,
  onToggleTracking,
  onStopTracking,
  onNavigate,
  onBack,
  isSearching,
}: EmergencyScreenProps) {
  const [showProfile, setShowProfile] = useState(true);

  return (
    <div className="screen">
      {/* Header */}
      <div className="nav-bar" style={{ margin: 'calc(-1 * var(--space-4))', marginBottom: 'var(--space-4)', position: 'static' }}>
        <button className="nav-bar__back" onClick={onBack}>← Back</button>
        <span className="nav-bar__title">
          <span style={{ color: 'var(--color-emergency-red)' }}>⚠️</span>
          Emergency Mode
        </span>
        <div />
      </div>

      {/* Emergency Dashboard */}
      <div className="dashboard" style={{ marginBottom: 'var(--space-4)' }}>
        <div className="dashboard__item dashboard__item--full">
          <div className="coordinates__label">Current Location</div>
          <div className="dashboard__value" style={{ fontSize: 'var(--text-base)' }}>
            {position ? formatCoordinates(position.latitude, position.longitude, 5) : 'Acquiring...'}
          </div>
          {position && (
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 2 }}>
              GPS: ±{Math.round(position.accuracy)}m ({getAccuracyDescription(position.accuracy)})
            </div>
          )}
        </div>
        <div className="dashboard__item">
          <div className="dashboard__label">Battery</div>
          <div className="dashboard__value" style={{ color: getBatteryColor(batteryLevel || 100) }}>
            {batteryLevel !== null ? `${batteryLevel}%` : '—'}
          </div>
        </div>
        <div className="dashboard__item">
          <div className="dashboard__label">Network</div>
          <div className="dashboard__value">
            <span className={`status-dot status-dot--${networkStatus}`} />
            {networkStatus === 'online' ? '🟢' : networkStatus === 'limited' ? '🟡' : '🔴'}
            {' '}{networkStatus.charAt(0).toUpperCase() + networkStatus.slice(1)}
          </div>
        </div>
        {selectedDestination && (
          <>
            <div className="dashboard__item">
              <div className="dashboard__label">Nearest Exit</div>
              <div className="dashboard__value dashboard__value--sm">{selectedDestination.name}</div>
            </div>
            <div className="dashboard__item">
              <div className="dashboard__label">Distance</div>
              <div className="dashboard__value">{selectedDestination.distance.toFixed(1)} km</div>
            </div>
            <div className="dashboard__item">
              <div className="dashboard__label">Direction</div>
              <div className="dashboard__value">
                {position ? bearingToArrow(calculateBearing(position.latitude, position.longitude, selectedDestination.latitude, selectedDestination.longitude)) : '—'}
                {' '}{selectedDestination.direction}
              </div>
            </div>
            <div className="dashboard__item">
              <div className="dashboard__label">Walk Time</div>
              <div className="dashboard__value dashboard__value--sm">
                ~{formatTime(selectedDestination.estimatedWalkTime)}
              </div>
            </div>
            <div className="dashboard__item">
              <div className="dashboard__label">Safety</div>
              <div className="dashboard__value dashboard__value--sm">
                {getRatingLabel(selectedDestination.safetyRating)}
              </div>
            </div>
          </>
        )}
        {sosData && (
          <div className="dashboard__item dashboard__item--full" style={{ borderColor: 'rgba(220, 38, 38, 0.5)' }}>
            <div className="dashboard__label" style={{ color: 'var(--color-emergency-red)' }}>SOS Status</div>
            <div className="dashboard__value" style={{ color: 'var(--color-emergency-red)' }}>
              🆘 {sosData.status.replace(/_/g, ' ').toUpperCase()}
            </div>
          </div>
        )}
      </div>

      {/* Emergency Profile (collapsible) */}
      {showProfile && (
        <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
            <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>Quick Assessment</span>
            <button className="btn btn--ghost" style={{ fontSize: 'var(--text-xs)' }} onClick={() => setShowProfile(false)}>
              Hide
            </button>
          </div>
          
          <div className="form-group">
            <label className="form-group__label">Are you injured?</label>
            <div className="radio-group">
              {(['yes', 'no', 'unsure'] as const).map((val) => (
                <button
                  key={val}
                  className={`radio-option ${emergencyProfile.isInjured === val ? 'radio-option--selected' : ''}`}
                  onClick={() => onUpdateProfile({ ...emergencyProfile, isInjured: val })}
                >
                  {val === 'yes' ? '🤕 Yes' : val === 'no' ? '✅ No' : '❓ Unsure'}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-group__label">Are you alone?</label>
            <div className="radio-group">
              {(['yes', 'no'] as const).map((val) => (
                <button
                  key={val}
                  className={`radio-option ${emergencyProfile.isAlone === val ? 'radio-option--selected' : ''}`}
                  onClick={() => onUpdateProfile({ ...emergencyProfile, isAlone: val })}
                >
                  {val === 'yes' ? '🧑 Yes' : '👥 No'}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-group__label">Do you have water?</label>
            <div className="radio-group">
              {(['yes', 'no', 'unsure'] as const).map((val) => (
                <button
                  key={val}
                  className={`radio-option ${emergencyProfile.hasWater === val ? 'radio-option--selected' : ''}`}
                  onClick={() => onUpdateProfile({ ...emergencyProfile, hasWater: val })}
                >
                  {val === 'yes' ? '💧 Yes' : val === 'no' ? '🚫 No' : '❓ Unsure'}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-group__label">Can you walk?</label>
            <div className="radio-group">
              {(['yes', 'with_difficulty', 'no'] as const).map((val) => (
                <button
                  key={val}
                  className={`radio-option ${emergencyProfile.canWalk === val ? 'radio-option--selected' : ''}`}
                  onClick={() => onUpdateProfile({ ...emergencyProfile, canWalk: val })}
                >
                  {val === 'yes' ? '🚶 Yes' : val === 'with_difficulty' ? '🩼 With Difficulty' : '❌ No'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Primary Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <button 
          className="mega-btn mega-btn--find" 
          onClick={onFindMyWayOut}
          disabled={isSearching || !position}
        >
          {isSearching ? (
            <>
              <div className="loading-spinner" style={{ width: 32, height: 32, borderTopColor: 'white' }} />
              Searching...
            </>
          ) : (
            <>
              <span className="mega-btn__icon">🧭</span>
              FIND MY WAY OUT
              <span className="mega-btn__subtitle">Search for nearby safe exits</span>
            </>
          )}
        </button>

        <button className="mega-btn mega-btn--sos" onClick={onSOS} style={{ minHeight: 72 }}>
          🆘 SOS
          <span className="mega-btn__subtitle">Emergency alert</span>
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
          <button className="btn btn--primary btn--lg btn--full" onClick={onShareLocation}>
            📤 Share Location
          </button>
          <button className="btn btn--outline btn--lg btn--full" onClick={() => onNavigate('compass')}>
            🧭 Compass
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
          <button className="btn btn--outline btn--lg btn--full" onClick={onToggleTracking}>
            {!breadcrumbTrack ? '📍 Start Tracking' :
             breadcrumbTrack.status === 'recording' ? '⏸️ Pause Trail' : '▶️ Resume Trail'}
          </button>
          {breadcrumbTrack && breadcrumbTrack.points.length > 1 && (
            <button className="btn btn--warning btn--lg btn--full" onClick={() => {
              onStopTracking();
              // Navigate to route with backtrack
            }}>
              🔙 Follow Back
            </button>
          )}
        </div>

        {/* SOS Quick Actions */}
        {sosData && (
          <div className="card" style={{ borderColor: 'rgba(220, 38, 38, 0.3)', marginTop: 'var(--space-2)' }}>
            <div style={{ fontWeight: 700, marginBottom: 'var(--space-3)', color: 'var(--color-emergency-red)' }}>
              🆘 SOS Active
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <button className="btn btn--danger btn--full" onClick={() => callEmergencyServices('112')}>
                📞 Call Emergency Services (112)
              </button>
              <button className="btn btn--danger btn--full" onClick={() => callEmergencyServices('911')}>
                📞 Call 911
              </button>
              {sosData.emergencyContacts.map((c) => (
                <div key={c.id} style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <button className="btn btn--outline btn--full" onClick={() => callContact(c.phone)}>
                    📞 {c.name}
                  </button>
                  <button className="btn btn--outline" onClick={() => sendSMSToContact(c.phone, sosData.message)}>
                    💬
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
