/**
 * Welcome Screen — First launch onboarding
 * "Stay found. Get home."
 */

interface WelcomeScreenProps {
  onComplete: () => void;
  onSetupContacts: () => void;
  onDownloadMaps: () => void;
}

export default function WelcomeScreen({ onComplete, onSetupContacts, onDownloadMaps }: WelcomeScreenProps) {
  return (
    <div className="welcome">
      <div className="welcome__logo">🏔️</div>
      
      <div>
        <h1 className="welcome__title">
          Emergency<br />Traveller Rescue
        </h1>
        <p className="welcome__tagline">
          Stay found. Get home.
        </p>
      </div>

      <div style={{ maxWidth: 320, width: '100%' }}>
        <div className="safety-alert safety-alert--info" style={{ marginBottom: 'var(--space-4)', textAlign: 'left' }}>
          <span className="safety-alert__icon">ℹ️</span>
          <span className="safety-alert__text">
            This app is an emergency assistance tool, <strong>not a guaranteed rescue system</strong>. 
            Always inform someone of your travel plans and carry appropriate equipment.
          </span>
        </div>
      </div>

      <div className="welcome__actions">
        <button className="btn btn--primary btn--xl btn--full" onClick={onComplete}>
          🚀 Get Started
        </button>
        <button className="btn btn--outline btn--lg btn--full" onClick={onSetupContacts}>
          👥 Setup Emergency Contacts
        </button>
        <button className="btn btn--outline btn--lg btn--full" onClick={onDownloadMaps}>
          📥 Download Offline Maps
        </button>
      </div>

      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', maxWidth: 280 }}>
        By continuing, you acknowledge that route data may be incomplete 
        and should not be solely relied upon in life-threatening situations.
      </p>
    </div>
  );
}
