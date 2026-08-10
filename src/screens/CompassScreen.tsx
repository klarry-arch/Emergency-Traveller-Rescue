/**
 * Compass Screen — Emergency compass with bearing
 * 
 * Large compass rose, heading, direction to destination,
 * readable in sunlight and at night.
 */

import type { GPSPosition, Destination } from '../types';
import { calculateBearing, calculateDistance, bearingToDescriptiveDirection, formatTime, estimateWalkingTime } from '../services/gpsService';
import { headingToDirection } from '../services/compassService';

interface CompassScreenProps {
  heading: number | null;
  position: GPSPosition | null;
  destination: Destination | null;
  onBack: () => void;
}

export default function CompassScreen({ heading, position, destination, onBack }: CompassScreenProps) {
  const currentHeading = heading ?? 0;
  const hasCompass = heading !== null;

  let destBearing: number | null = null;
  let destDistance: number | null = null;

  if (position && destination) {
    destBearing = calculateBearing(
      position.latitude, position.longitude,
      destination.latitude, destination.longitude
    );
    destDistance = calculateDistance(
      position.latitude, position.longitude,
      destination.latitude, destination.longitude
    );
  }

  return (
    <div className="screen" style={{ justifyContent: 'center' }}>
      {/* Back Button */}
      <div style={{ position: 'absolute', top: 'var(--space-4)', left: 'var(--space-4)' }}>
        <button className="nav-bar__back" onClick={onBack}>← Back</button>
      </div>

      <div className="compass-container">
        {/* Compass Rose */}
        <div className="compass-rose" style={{
          transform: `rotate(${-currentHeading}deg)`,
          transition: hasCompass ? 'transform 0.3s ease' : 'none',
        }}>
          <div className="compass-rose__ring" />
          
          {/* Cardinal Directions */}
          <span className="compass-rose__direction compass-rose__direction--n" style={{ left: '50%', transform: 'translateX(-50%)' }}>N</span>
          <span className="compass-rose__direction compass-rose__direction--s" style={{ left: '50%', transform: 'translateX(-50%)' }}>S</span>
          <span className="compass-rose__direction compass-rose__direction--e">E</span>
          <span className="compass-rose__direction compass-rose__direction--w">W</span>

          {/* North Needle (points to magnetic north, but compass rotates so it's always "up" in device frame) */}
          <div className="compass-rose__needle" style={{ transform: 'rotate(0deg)' }} />

          {/* Destination Arrow */}
          {destBearing !== null && (
            <div
              className="compass-rose__destination-arrow"
              style={{ transform: `rotate(${destBearing}deg)` }}
            />
          )}

          <div className="compass-rose__center" />
        </div>

        {/* Heading Info */}
        <div className="compass-info">
          <div className="compass-info__heading">
            {hasCompass ? `${Math.round(currentHeading)}°` : '—'}
          </div>
          <div className="compass-info__label">
            {hasCompass ? headingToDirection(currentHeading) : 'Compass unavailable'}
          </div>
        </div>

        {/* Destination Info */}
        {destination && destDistance !== null && destBearing !== null && (
          <div className="card" style={{ width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 'var(--space-2)' }}>
              Destination
            </div>
            <div style={{ fontWeight: 700, fontSize: 'var(--text-lg)', marginBottom: 'var(--space-1)' }}>
              {destination.name}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-6)', marginTop: 'var(--space-3)' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 'var(--text-2xl)', fontFamily: 'var(--font-mono)' }}>
                  {destDistance.toFixed(1)}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>km</div>
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 'var(--text-2xl)' }}>
                  {bearingToDescriptiveDirection(destBearing)}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>direction</div>
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 'var(--text-2xl)', fontFamily: 'var(--font-mono)' }}>
                  {Math.round(destBearing)}°
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>bearing</div>
              </div>
            </div>
            <div style={{ marginTop: 'var(--space-3)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              ~{formatTime(estimateWalkingTime(destDistance))} walking
            </div>
          </div>
        )}

        {/* No compass fallback */}
        {!hasCompass && (
          <div className="safety-alert safety-alert--warning" style={{ width: '100%' }}>
            <span className="safety-alert__icon">⚠️</span>
            <span className="safety-alert__text">
              Device compass is not available. Heading information cannot be displayed. 
              Use the bearing and GPS direction for navigation.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
