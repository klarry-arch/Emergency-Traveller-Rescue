/**
 * Settings Screen — App configuration
 * 
 * Units, map style, theme, battery mode, emergency settings.
 */

import type { AppSettings } from '../types';

interface SettingsScreenProps {
  settings: AppSettings;
  onUpdateSettings: (updates: Partial<AppSettings>) => void;
  onBack: () => void;
}

export default function SettingsScreen({ settings, onUpdateSettings, onBack }: SettingsScreenProps) {
  return (
    <div className="screen">
      {/* Header */}
      <div className="nav-bar" style={{ margin: 'calc(-1 * var(--space-4))', marginBottom: 'var(--space-4)', position: 'static' }}>
        <button className="nav-bar__back" onClick={onBack}>← Back</button>
        <span className="nav-bar__title">⚙️ Settings</span>
        <div />
      </div>

      {/* Units */}
      <div className="card" style={{ marginBottom: 'var(--space-3)' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-group__label">Distance Units</label>
          <div className="radio-group">
            <button
              className={`radio-option ${settings.units === 'metric' ? 'radio-option--selected' : ''}`}
              onClick={() => onUpdateSettings({ units: 'metric' })}
            >
              Metric (km)
            </button>
            <button
              className={`radio-option ${settings.units === 'imperial' ? 'radio-option--selected' : ''}`}
              onClick={() => onUpdateSettings({ units: 'imperial' })}
            >
              Imperial (mi)
            </button>
          </div>
        </div>
      </div>

      {/* Theme */}
      <div className="card" style={{ marginBottom: 'var(--space-3)' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-group__label">Theme</label>
          <div className="radio-group">
            {(['dark', 'light', 'auto'] as const).map((theme) => (
              <button
                key={theme}
                className={`radio-option ${settings.theme === theme ? 'radio-option--selected' : ''}`}
                onClick={() => onUpdateSettings({ theme })}
              >
                {theme === 'dark' ? '🌙 Dark' : theme === 'light' ? '☀️ Light' : '🔄 Auto'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Map Style */}
      <div className="card" style={{ marginBottom: 'var(--space-3)' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-group__label">Map Style</label>
          <div className="radio-group">
            {(['standard', 'satellite', 'terrain'] as const).map((style) => (
              <button
                key={style}
                className={`radio-option ${settings.mapStyle === style ? 'radio-option--selected' : ''}`}
                onClick={() => onUpdateSettings({ mapStyle: style })}
              >
                {style === 'standard' ? '🗺️ Standard' : style === 'satellite' ? '🛰️ Satellite' : '⛰️ Terrain'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search Radius */}
      <div className="card" style={{ marginBottom: 'var(--space-3)' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-group__label">Default Search Radius</label>
          <div className="radio-group">
            {[5, 10, 25, 50].map((r) => (
              <button
                key={r}
                className={`radio-option ${settings.searchRadius === r ? 'radio-option--selected' : ''}`}
                onClick={() => onUpdateSettings({ searchRadius: r })}
              >
                {r} km
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Battery Mode */}
      <div className="card" style={{ marginBottom: 'var(--space-3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 600 }}>🔋 Ultra Low Power Mode</div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>
              Reduces GPS frequency, disables animations, simplifies UI
            </div>
          </div>
          <button
            className={`radio-option ${settings.batteryMode ? 'radio-option--selected' : ''}`}
            onClick={() => onUpdateSettings({ batteryMode: !settings.batteryMode })}
            style={{ minWidth: 60 }}
          >
            {settings.batteryMode ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Safety Alerts */}
      <div className="card" style={{ marginBottom: 'var(--space-3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 600 }}>⚠️ Safety Alerts</div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>
              Show hazard warnings along routes
            </div>
          </div>
          <button
            className={`radio-option ${settings.showSafetyAlerts ? 'radio-option--selected' : ''}`}
            onClick={() => onUpdateSettings({ showSafetyAlerts: !settings.showSafetyAlerts })}
            style={{ minWidth: 60 }}
          >
            {settings.showSafetyAlerts ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* GPS Update Interval */}
      <div className="card" style={{ marginBottom: 'var(--space-3)' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-group__label">GPS Update Frequency</label>
          <div className="radio-group">
            {([1000, 5000, 15000, 30000] as const).map((interval) => (
              <button
                key={interval}
                className={`radio-option ${settings.gpsUpdateInterval === interval ? 'radio-option--selected' : ''}`}
                onClick={() => onUpdateSettings({ gpsUpdateInterval: interval })}
              >
                {interval < 5000 ? 'Fast (1s)' : interval < 15000 ? 'Normal (5s)' : interval < 30000 ? 'Slow (15s)' : 'Eco (30s)'}
              </button>
            ))}
          </div>
          <div className="form-group__hint">Faster updates use more battery</div>
        </div>
      </div>

      {/* Privacy */}
      <div className="card" style={{ marginBottom: 'var(--space-3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 600 }}>🔒 Location Sharing Consent</div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>
              Allow sharing your location with contacts
            </div>
          </div>
          <button
            className={`radio-option ${settings.shareLocationConsent ? 'radio-option--selected' : ''}`}
            onClick={() => onUpdateSettings({ shareLocationConsent: !settings.shareLocationConsent })}
            style={{ minWidth: 60 }}
          >
            {settings.shareLocationConsent ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* About */}
      <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
        <div style={{ fontWeight: 700, marginBottom: 'var(--space-3)' }}>About</div>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <p><strong>Emergency Traveller Rescue</strong></p>
          <p style={{ marginTop: 'var(--space-2)' }}>
            An emergency assistance and navigation tool for travellers in remote areas. 
            This application uses GPS, OpenStreetMap data, and intelligent routing to help 
            users find their way to safety.
          </p>
          <p style={{ marginTop: 'var(--space-2)', color: 'var(--color-warning-amber)' }}>
            ⚠️ This is NOT a guaranteed rescue system. Always contact local emergency 
            services when in danger. Route data may be incomplete or outdated.
          </p>
          <p style={{ marginTop: 'var(--space-2)' }}>
            Version 1.0.0 (MVP)
          </p>
        </div>
      </div>
    </div>
  );
}
