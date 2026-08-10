/**
 * Battery Service — Battery Status API
 * 
 * Monitors device battery level and provides estimated remaining time.
 * Triggers Ultra Low Power Mode when battery is critically low.
 */

interface BatteryManager {
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  level: number;
  addEventListener(type: string, listener: () => void): void;
  removeEventListener(type: string, listener: () => void): void;
}

/** Check if Battery API is available */
export function isBatteryAPIAvailable(): boolean {
  return 'getBattery' in navigator;
}

/** Get current battery level (0-100) */
export async function getBatteryLevel(): Promise<number | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const battery: BatteryManager = await (navigator as any).getBattery();
    return Math.round(battery.level * 100);
  } catch {
    return null;
  }
}

/** Get battery info including charging status */
export async function getBatteryInfo(): Promise<{
  level: number;
  charging: boolean;
  estimatedHours: number | null;
} | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const battery: BatteryManager = await (navigator as any).getBattery();
    const level = Math.round(battery.level * 100);
    const charging = battery.charging;

    let estimatedHours: number | null = null;
    if (!charging && battery.dischargingTime !== Infinity) {
      estimatedHours = Math.round((battery.dischargingTime / 3600) * 10) / 10;
    }

    return { level, charging, estimatedHours };
  } catch {
    return null;
  }
}

/** Watch battery level changes */
export async function watchBattery(
  onUpdate: (level: number, charging: boolean) => void
): Promise<(() => void) | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const battery: BatteryManager = await (navigator as any).getBattery();

    const handler = () => {
      onUpdate(Math.round(battery.level * 100), battery.charging);
    };

    battery.addEventListener('levelchange', handler);
    battery.addEventListener('chargingchange', handler);

    // Initial update
    handler();

    return () => {
      battery.removeEventListener('levelchange', handler);
      battery.removeEventListener('chargingchange', handler);
    };
  } catch {
    return null;
  }
}

/** Check if battery is critically low */
export function isCriticallyLow(level: number): boolean {
  return level <= 10;
}

/** Check if battery saving mode should be recommended */
export function shouldRecommendBatterySaving(level: number): boolean {
  return level <= 25;
}

/** Get battery icon based on level */
export function getBatteryIcon(level: number, charging: boolean): string {
  if (charging) return '🔌';
  if (level > 75) return '🔋';
  if (level > 50) return '🔋';
  if (level > 25) return '🪫';
  return '🪫';
}

/** Get battery color based on level */
export function getBatteryColor(level: number): string {
  if (level > 50) return 'var(--color-safety-green)';
  if (level > 25) return 'var(--color-warning-amber)';
  return 'var(--color-emergency-red)';
}
