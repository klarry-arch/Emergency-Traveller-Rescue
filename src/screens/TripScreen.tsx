/**
 * Trip Setup Screen — Plan trip, set contacts, expected return time
 */

import { useState } from 'react';
import type { EmergencyContact, TripPlan, GPSPosition, BreadcrumbTrack } from '../types';
import { generateId } from '../services/storageService';
import { getTrackDuration } from '../services/breadcrumbService';

interface TripScreenProps {
  contacts: EmergencyContact[];
  activeTripPlan: TripPlan | null;
  onSaveTripPlan: (plan: TripPlan | null) => void;
  onBack: () => void;
  position: GPSPosition | null;
  breadcrumbTrack: BreadcrumbTrack | null;
  onStartTracking: () => void;
  onStopTracking: () => void;
}

export default function TripScreen({
  contacts,
  activeTripPlan,
  onSaveTripPlan,
  onBack,
  position: _position,
  breadcrumbTrack,
  onStartTracking,
  onStopTracking,
}: TripScreenProps) {
  const [destination, setDestination] = useState(activeTripPlan?.destination || '');
  const [plannedRoute, setPlannedRoute] = useState(activeTripPlan?.plannedRoute || '');
  const [expectedReturn, setExpectedReturn] = useState(activeTripPlan?.expectedReturnTime || '');
  const [groupMembers, setGroupMembers] = useState(activeTripPlan?.groupMembers.join(', ') || '');
  const [notes, setNotes] = useState(activeTripPlan?.notes || '');

  const handleStartTrip = () => {
    const plan: TripPlan = {
      id: generateId(),
      destination: destination.trim(),
      plannedRoute: plannedRoute.trim(),
      expectedReturnTime: expectedReturn,
      contacts,
      groupMembers: groupMembers.split(',').map((m) => m.trim()).filter(Boolean),
      notes: notes.trim(),
      startTime: new Date().toISOString(),
      status: 'active',
    };
    onSaveTripPlan(plan);
    onStartTracking();
  };

  const handleEndTrip = () => {
    if (activeTripPlan) {
      onSaveTripPlan({ ...activeTripPlan, status: 'completed' });
    }
    onStopTracking();
    onSaveTripPlan(null);
  };

  // Check if trip is overdue
  const isOverdue = activeTripPlan?.expectedReturnTime
    ? new Date(activeTripPlan.expectedReturnTime) < new Date()
    : false;

  return (
    <div className="screen">
      {/* Header */}
      <div className="nav-bar" style={{ margin: 'calc(-1 * var(--space-4))', marginBottom: 'var(--space-4)', position: 'static' }}>
        <button className="nav-bar__back" onClick={onBack}>← Back</button>
        <span className="nav-bar__title">🗺️ Trip Plan</span>
        <div />
      </div>

      {/* Active Trip Status */}
      {activeTripPlan && (
        <div className={`trip-status ${isOverdue ? 'trip-status--overdue' : 'trip-status--active'}`}
             style={{ marginBottom: 'var(--space-4)' }}>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
            {isOverdue ? '⚠️ TRIP OVERDUE' : '✅ Trip Active'}
          </div>
          <div style={{ fontWeight: 700, fontSize: 'var(--text-lg)', marginTop: 'var(--space-2)' }}>
            {activeTripPlan.destination}
          </div>
          {activeTripPlan.expectedReturnTime && (
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>
              Expected return: {new Date(activeTripPlan.expectedReturnTime).toLocaleString()}
            </div>
          )}
          {breadcrumbTrack && (
            <div style={{ fontSize: 'var(--text-sm)', marginTop: 'var(--space-2)' }}>
              📍 {breadcrumbTrack.points.length} points tracked • {breadcrumbTrack.totalDistance.toFixed(1)} km • {getTrackDuration(breadcrumbTrack)}
            </div>
          )}
          
          {isOverdue && (
            <div className="safety-alert safety-alert--warning" style={{ marginTop: 'var(--space-3)', textAlign: 'left' }}>
              <span className="safety-alert__icon">⚠️</span>
              <span className="safety-alert__text">
                You have passed your expected return time. Consider notifying your emergency contacts.
              </span>
            </div>
          )}

          <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
            <button className="btn btn--primary btn--full" onClick={handleEndTrip}>
              ✅ End Trip
            </button>
            {isOverdue && (
              <button className="btn btn--warning btn--full">
                📤 Notify Contacts
              </button>
            )}
          </div>
        </div>
      )}

      {/* Trip Planning Form */}
      {!activeTripPlan && (
        <>
          <div className="safety-alert safety-alert--info" style={{ marginBottom: 'var(--space-4)' }}>
            <span className="safety-alert__icon">ℹ️</span>
            <span className="safety-alert__text">
              Create a trip plan before entering a remote area. 
              If you don't check in by your expected return time, you'll be reminded to notify contacts.
            </span>
          </div>

          <div className="form-group">
            <label className="form-group__label">Destination *</label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Where are you going?"
            />
          </div>

          <div className="form-group">
            <label className="form-group__label">Planned Route</label>
            <textarea
              value={plannedRoute}
              onChange={(e) => setPlannedRoute(e.target.value)}
              placeholder="Describe your planned route..."
              rows={3}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className="form-group">
            <label className="form-group__label">Expected Return Time</label>
            <input
              type="datetime-local"
              value={expectedReturn}
              onChange={(e) => setExpectedReturn(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-group__label">Group Members</label>
            <input
              type="text"
              value={groupMembers}
              onChange={(e) => setGroupMembers(e.target.value)}
              placeholder="Comma-separated names"
            />
            <div className="form-group__hint">Names of people traveling with you</div>
          </div>

          <div className="form-group">
            <label className="form-group__label">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes..."
              rows={2}
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Emergency Contacts Summary */}
          <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
            <div className="dashboard__label">Emergency Contacts ({contacts.length})</div>
            {contacts.length > 0 ? (
              <div style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
                {contacts.map((c) => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-1) 0' }}>
                    <span>{c.name}</span>
                    <span style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{c.phone}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', marginTop: 'var(--space-2)' }}>
                No emergency contacts set. Add contacts in the Emergency Contacts screen.
              </div>
            )}
          </div>

          {/* Start Trip */}
          <button
            className="mega-btn mega-btn--find"
            onClick={handleStartTrip}
            disabled={!destination.trim()}
            style={{ minHeight: 72 }}
          >
            🚀 Start Trip
            <span className="mega-btn__subtitle">Begin location tracking</span>
          </button>
        </>
      )}
    </div>
  );
}
