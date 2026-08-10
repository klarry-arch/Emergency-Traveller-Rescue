/**
 * Offline Maps Screen — Download and manage offline map areas
 */

import { useState } from 'react';

interface OfflineMapsScreenProps {
  onBack: () => void;
}

interface OfflineArea {
  id: string;
  name: string;
  sizeMB: number;
  downloadDate: string;
  zoomLevels: string;
}

export default function OfflineMapsScreen({ onBack }: OfflineMapsScreenProps) {
  const [downloadedAreas] = useState<OfflineArea[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const handleDownloadArea = () => {
    setIsDownloading(true);
    setDownloadProgress(0);
    
    // Simulate download progress
    const interval = setInterval(() => {
      setDownloadProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setIsDownloading(false);
          return 100;
        }
        return p + 10;
      });
    }, 500);
  };

  return (
    <div className="screen">
      {/* Header */}
      <div className="nav-bar" style={{ margin: 'calc(-1 * var(--space-4))', marginBottom: 'var(--space-4)', position: 'static' }}>
        <button className="nav-bar__back" onClick={onBack}>← Back</button>
        <span className="nav-bar__title">📥 Offline Maps</span>
        <div />
      </div>

      {/* Info */}
      <div className="safety-alert safety-alert--info" style={{ marginBottom: 'var(--space-4)' }}>
        <span className="safety-alert__icon">ℹ️</span>
        <span className="safety-alert__text">
          Download map areas while you have internet. 
          Offline maps allow basic navigation when you're out of signal range.
        </span>
      </div>

      {/* Download New Area */}
      <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
        <h3 style={{ fontWeight: 700, marginBottom: 'var(--space-3)' }}>Download New Area</h3>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>
          Center the map on the area you want to download, then tap the download button.
        </p>

        {/* Map placeholder */}
        <div style={{
          height: 200,
          background: 'var(--bg-tertiary)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 'var(--space-3)',
          border: '1px solid var(--border-primary)',
        }}>
          <span style={{ color: 'var(--text-tertiary)' }}>🗺️ Map area selector</span>
        </div>

        {isDownloading && (
          <div style={{ marginBottom: 'var(--space-3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-1)' }}>
              <span>Downloading tiles...</span>
              <span>{downloadProgress}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-bar__fill" style={{ width: `${downloadProgress}%` }} />
            </div>
          </div>
        )}

        <button
          className="btn btn--primary btn--full"
          onClick={handleDownloadArea}
          disabled={isDownloading}
        >
          {isDownloading ? 'Downloading...' : '📥 Download This Area'}
        </button>
      </div>

      {/* Downloaded Areas */}
      <div>
        <h3 style={{ fontWeight: 700, marginBottom: 'var(--space-3)' }}>Downloaded Areas</h3>
        
        {downloadedAreas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: 'var(--text-4xl)', marginBottom: 'var(--space-3)' }}>📂</div>
            <p>No offline areas downloaded yet.</p>
            <p style={{ fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>
              Download areas before your trip for offline navigation.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {downloadedAreas.map((area) => (
              <div key={area.id} className="offline-area">
                <div className="offline-area__info">
                  <div className="offline-area__name">{area.name}</div>
                  <div className="offline-area__size">
                    {area.sizeMB} MB • Zoom {area.zoomLevels} • {area.downloadDate}
                  </div>
                </div>
                <button className="btn btn--ghost btn--icon" title="Delete">🗑️</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Storage Info */}
      <div className="card" style={{ marginTop: 'var(--space-4)' }}>
        <div className="dashboard__label">Storage Used</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
          <div className="progress-bar" style={{ flex: 1 }}>
            <div className="progress-bar__fill" style={{ width: '5%' }} />
          </div>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
            ~0 MB
          </span>
        </div>
      </div>
    </div>
  );
}
