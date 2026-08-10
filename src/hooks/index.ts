/**
 * React Hooks — Custom hooks connecting services to components
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { GPSPosition, NetworkStatus, AppSettings } from '../types';
import { watchPosition, clearWatch, getLastKnownLocation } from '../services/gpsService';
import { getBatteryLevel, watchBattery } from '../services/batteryService';
import { watchCompass, requestCompassPermission } from '../services/compassService';
import { getSettings, saveSettings, DEFAULT_SETTINGS } from '../services/storageService';

// ─── useGPS ─────────────────────────────────────────────────

export function useGPS(enabled: boolean = true, batteryMode: boolean = false) {
  const [position, setPosition] = useState<GPSPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const watchIdRef = useRef<number>(-1);

  useEffect(() => {
    if (!enabled) return;

    // Try last known location first
    const lastKnown = getLastKnownLocation();
    if (lastKnown) {
      setPosition(lastKnown.position);
    }

    const watchId = watchPosition(
      (pos) => {
        setPosition(pos);
        setError(null);
        setIsTracking(true);
      },
      (err) => {
        setError(err.message);
        setIsTracking(false);
      },
      {
        highAccuracy: !batteryMode,
        maxAge: batteryMode ? 30000 : 5000,
        timeout: batteryMode ? 30000 : 15000,
      }
    );

    watchIdRef.current = watchId;

    return () => {
      clearWatch(watchId);
      setIsTracking(false);
    };
  }, [enabled, batteryMode]);

  const refresh = useCallback(() => {
    if (watchIdRef.current >= 0) {
      clearWatch(watchIdRef.current);
    }
    const watchId = watchPosition(
      (pos) => {
        setPosition(pos);
        setError(null);
        setIsTracking(true);
      },
      (err) => setError(err.message),
      { highAccuracy: true }
    );
    watchIdRef.current = watchId;
  }, []);

  return { position, error, isTracking, refresh };
}

// ─── useBattery ─────────────────────────────────────────────

export function useBattery() {
  const [level, setLevel] = useState<number | null>(null);
  const [charging, setCharging] = useState(false);

  useEffect(() => {
    // Initial level
    getBatteryLevel().then((l) => {
      if (l !== null) setLevel(l);
    });

    // Watch for changes
    let cleanup: (() => void) | null = null;
    watchBattery((l, c) => {
      setLevel(l);
      setCharging(c);
    }).then((unsub) => {
      cleanup = unsub;
    });

    return () => {
      cleanup?.();
    };
  }, []);

  return { level, charging };
}

// ─── useCompass ─────────────────────────────────────────────

export function useCompass(enabled: boolean = true) {
  const [heading, setHeading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let cleanup: (() => void) | undefined;

    (async () => {
      const granted = await requestCompassPermission();
      if (!granted) {
        setError('Compass permission denied');
        return;
      }

      cleanup = watchCompass(
        (h) => {
          setHeading(h);
          setError(null);
        },
        (err) => setError(err.message)
      );
    })();

    return () => {
      cleanup?.();
    };
  }, [enabled]);

  return { heading, error };
}

// ─── useNetwork ─────────────────────────────────────────────

export function useNetwork() {
  const [status, setStatus] = useState<NetworkStatus>(() => {
    if (typeof navigator !== 'undefined') {
      return navigator.onLine ? 'online' : 'offline';
    }
    return 'online';
  });

  useEffect(() => {
    const handleOnline = () => setStatus('online');
    const handleOffline = () => setStatus('offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check connection quality if available
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const connection = (navigator as any).connection;
    if (connection) {
      const checkQuality = () => {
        if (!navigator.onLine) {
          setStatus('offline');
        } else if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
          setStatus('limited');
        } else {
          setStatus('online');
        }
      };
      connection.addEventListener('change', checkQuality);
      checkQuality();
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        connection.removeEventListener('change', checkQuality);
      };
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return status;
}

// ─── useSettings ─────────────────────────────────────────────

export function useSettings() {
  const [settings, setSettingsState] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getSettings().then((s) => {
      setSettingsState(s);
      setLoaded(true);
    });
  }, []);

  const updateSettings = useCallback(async (updates: Partial<AppSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettingsState(newSettings);
    await saveSettings(newSettings);
  }, [settings]);

  return { settings, updateSettings, loaded };
}
