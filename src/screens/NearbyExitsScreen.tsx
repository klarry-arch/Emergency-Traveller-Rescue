/**
 * Nearby Exits Screen — List and Map view of nearby safe destinations
 * 
 * Shows ranked destinations with category filtering and radius selection.
 */

import { useState } from 'react';
import type { GPSPosition, Destination, DestinationCategory, DestinationType } from '../types';
import { DESTINATION_ICONS, DESTINATION_LABELS } from '../services/poiService';
import { getRatingLabel } from '../services/rankingService';
import { formatTime, bearingToArrow } from '../services/gpsService';
import LiveMapView from '../components/LiveMapView';

interface NearbyExitsScreenProps {
  position: GPSPosition | null;
  destinations: Destination[];
  categories: DestinationCategory[];
  searchRadius: number;
  isSearching: boolean;
  onSelectDestination: (dest: Destination) => void;
  onSearch: (radius?: number) => void;
  onChangeRadius: (radius: number) => void;
  onToggleCategory: (type: DestinationType) => void;
  onBack: () => void;
}

const RADIUS_OPTIONS = [1, 5, 10, 25, 50];

export default function NearbyExitsScreen({
  position,
  destinations,
  categories,
  searchRadius,
  isSearching,
  onSelectDestination,
  onSearch,
  onChangeRadius,
  onToggleCategory,
  onBack,
}: NearbyExitsScreenProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  const handleRadiusChange = (r: number) => {
    onChangeRadius(r);
    onSearch(r);
  };

  const recommended = destinations.filter((d) => d.safetyRating === 'recommended');
  const possible = destinations.filter((d) => d.safetyRating === 'possible');
  const notRecommended = destinations.filter((d) => d.safetyRating === 'not_recommended');

  return (
    <div className="screen">
      {/* Header */}
      <div className="nav-bar" style={{ margin: 'calc(-1 * var(--space-4))', marginBottom: 'var(--space-4)', position: 'static' }}>
        <button className="nav-bar__back" onClick={onBack}>← Back</button>
        <span className="nav-bar__title">Nearby Exits</span>
        <div className="nav-bar__actions">
          <button
            className="btn btn--ghost btn--icon"
            onClick={() => setShowFilters(!showFilters)}
          >
            🔍
          </button>
        </div>
      </div>

      {/* Radius Selector */}
      <div className="radius-selector" style={{ marginBottom: 'var(--space-3)' }}>
        {RADIUS_OPTIONS.map((r) => (
          <button
            key={r}
            className={`radius-option ${searchRadius === r ? 'radius-option--active' : ''}`}
            onClick={() => handleRadiusChange(r)}
          >
            {r} km
          </button>
        ))}
      </div>

      {/* View Toggle */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
        <button
          className={`btn ${viewMode === 'list' ? 'btn--primary' : 'btn--outline'}`}
          style={{ flex: 1 }}
          onClick={() => setViewMode('list')}
        >
          📋 List
        </button>
        <button
          className={`btn ${viewMode === 'map' ? 'btn--primary' : 'btn--outline'}`}
          style={{ flex: 1 }}
          onClick={() => setViewMode('map')}
        >
          🗺️ Map
        </button>
        <button
          className="btn btn--outline"
          onClick={() => onSearch()}
          disabled={isSearching || !position}
        >
          🔄
        </button>
      </div>

      {/* Category Filters */}
      {showFilters && (
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', marginBottom: 'var(--space-2)' }}>
            Filter Categories
          </div>
          <div className="category-grid">
            {categories.map((cat) => (
              <button
                key={cat.type}
                className={`category-item ${cat.enabled ? 'category-item--active' : ''}`}
                onClick={() => onToggleCategory(cat.type)}
              >
                <span className="category-item__icon">{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
          <button
            className="btn btn--primary btn--full"
            style={{ marginTop: 'var(--space-3)' }}
            onClick={() => { setShowFilters(false); onSearch(); }}
          >
            Apply & Search
          </button>
        </div>
      )}

      {/* "Any Safe Exit" Button */}
      {destinations.length > 0 && (
        <button
          className="btn btn--primary btn--lg btn--full"
          style={{ marginBottom: 'var(--space-4)' }}
          onClick={() => {
            const best = recommended[0] || possible[0] || destinations[0];
            if (best) onSelectDestination(best);
          }}
        >
          🎯 ANY SAFE EXIT — Go to Best Option
        </button>
      )}

      {/* Loading State */}
      {isSearching && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-8)' }}>
          <div className="loading-spinner" />
          <span style={{ color: 'var(--text-secondary)' }}>Searching for nearby exits...</span>
        </div>
      )}

      {/* Empty State */}
      {!isSearching && destinations.length === 0 && (
        <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: 'var(--text-4xl)', marginBottom: 'var(--space-4)' }}>🔍</div>
          <p style={{ marginBottom: 'var(--space-4)' }}>
            No destinations found yet.
          </p>
          <button className="btn btn--primary btn--lg" onClick={() => onSearch()}>
            Search Nearby
          </button>
        </div>
      )}

      {/* Destination List */}
      {!isSearching && viewMode === 'list' && destinations.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {/* Stats */}
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            {destinations.length} destinations found • {recommended.length} recommended
          </div>

          {/* Recommended */}
          {recommended.length > 0 && (
            <>
              <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--color-safety-green)' }}>
                🟢 Recommended
              </div>
              {recommended.map((dest) => (
                <DestinationCard key={dest.id} dest={dest} onClick={() => onSelectDestination(dest)} />
              ))}
            </>
          )}

          {/* Possible */}
          {possible.length > 0 && (
            <>
              <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--color-warning-amber)', marginTop: 'var(--space-2)' }}>
                🟡 Possible
              </div>
              {possible.map((dest) => (
                <DestinationCard key={dest.id} dest={dest} onClick={() => onSelectDestination(dest)} />
              ))}
            </>
          )}

          {/* Not Recommended */}
          {notRecommended.length > 0 && (
            <>
              <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--color-emergency-red)', marginTop: 'var(--space-2)' }}>
                🔴 Not Recommended
              </div>
              {notRecommended.map((dest) => (
                <DestinationCard key={dest.id} dest={dest} onClick={() => onSelectDestination(dest)} />
              ))}
            </>
          )}
        </div>
      )}

      {/* Map View */}
      {!isSearching && viewMode === 'map' && destinations.length > 0 && (
        <div style={{ flex: 1, minHeight: 450, display: 'flex', flexDirection: 'column' }}>
          <LiveMapView
            position={position}
            destinations={destinations}
            onSelectDestination={onSelectDestination}
            height="450px"
          />
        </div>
      )}

      {/* Safety Warning */}
      {destinations.some((d) => d.source === 'mock') && (
        <div className="safety-alert safety-alert--danger" style={{ marginTop: 'var(--space-4)' }}>
          <span className="safety-alert__icon">🚫</span>
          <span className="safety-alert__text">
            Some destinations are simulated data for demonstration. Do NOT rely on these for actual navigation.
          </span>
        </div>
      )}
    </div>
  );
}

/** Individual destination card */
function DestinationCard({ dest, onClick }: { dest: Destination; onClick: () => void }) {
  const icon = DESTINATION_ICONS[dest.type] || '📍';
  const typeLabel = DESTINATION_LABELS[dest.type] || 'Unknown';

  return (
    <div
      className={`destination-card destination-card--${dest.safetyRating.replace('_', '-')}`}
      onClick={onClick}
    >
      <div className="destination-card__header">
        <span className="destination-card__icon">{icon}</span>
        <div style={{ flex: 1 }}>
          <div className="destination-card__name">{dest.name}</div>
          <div className="destination-card__type">{typeLabel}</div>
        </div>
        <div className={`status-badge status-badge--${dest.safetyRating.replace('_', '-')}`}>
          {dest.safetyScore}
        </div>
      </div>

      <div className="destination-card__stats">
        <div className="destination-card__stat">
          <span className="destination-card__stat-icon">📏</span>
          <span>{dest.distance.toFixed(1)} km</span>
        </div>
        <div className="destination-card__stat">
          <span className="destination-card__stat-icon">🚶</span>
          <span>~{formatTime(dest.estimatedWalkTime)}</span>
        </div>
        <div className="destination-card__stat">
          <span className="destination-card__stat-icon">{bearingToArrow(dest.bearing)}</span>
          <span>{dest.direction}</span>
        </div>
        <div className="destination-card__stat">
          <span className="destination-card__stat-icon">{dest.roadAccess ? '🛣️' : '🥾'}</span>
          <span>{dest.roadAccess ? 'Road access' : 'Off-road'}</span>
        </div>
      </div>

      <div className="destination-card__confidence">
        Route confidence: {dest.confidence} • {getRatingLabel(dest.safetyRating)}
      </div>
    </div>
  );
}
