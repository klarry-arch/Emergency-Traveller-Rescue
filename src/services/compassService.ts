/**
 * Compass Service — Device Orientation API
 * 
 * Provides compass heading from device sensors.
 * Falls back gracefully when not supported.
 */

/** Check if device orientation is available */
export function isCompassAvailable(): boolean {
  return 'DeviceOrientationEvent' in window;
}

/** Request permission for compass on iOS 13+ */
export async function requestCompassPermission(): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const DeviceOrientationEvent = window.DeviceOrientationEvent as any;
  if (typeof DeviceOrientationEvent?.requestPermission === 'function') {
    try {
      const permission = await DeviceOrientationEvent.requestPermission();
      return permission === 'granted';
    } catch {
      return false;
    }
  }
  // Non-iOS or older versions don't need permission
  return true;
}

/** Watch compass heading with continuous updates */
export function watchCompass(
  onUpdate: (heading: number) => void,
  onError: (err: Error) => void
): () => void {
  if (!isCompassAvailable()) {
    onError(new Error('Compass not available on this device'));
    return () => {};
  }

  const handler = (event: DeviceOrientationEvent) => {
    // Use webkitCompassHeading for iOS, alpha for Android
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const heading = (event as any).webkitCompassHeading ?? 
                    (event.alpha !== null ? (360 - event.alpha) % 360 : null);

    if (heading !== null && heading !== undefined) {
      onUpdate(heading);
    }
  };

  window.addEventListener('deviceorientation', handler, true);

  return () => {
    window.removeEventListener('deviceorientation', handler, true);
  };
}

/** Format heading as compass direction */
export function headingToDirection(heading: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(heading / 45) % 8;
  return directions[index];
}

/** Format heading as degrees display */
export function formatHeading(heading: number): string {
  return `${Math.round(heading)}°`;
}
