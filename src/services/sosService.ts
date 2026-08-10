/**
 * SOS Service — Emergency Alert System
 * 
 * Handles SOS activation, emergency message generation,
 * and location sharing via native device capabilities.
 * 
 * NOTE: Web browsers cannot send SMS directly. This service
 * uses tel: and sms: URI schemes to open native apps.
 */

import type { SOSData, GPSPosition, Destination, EmergencyContact } from '../types';
import { formatCoordinates } from './gpsService';

/** Generate a unique SOS ID */
function generateSOSId(): string {
  return `sos-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}

/** Create an SOS data object */
export function createSOSData(
  coordinates: GPSPosition | null,
  batteryLevel: number | null,
  selectedDestination: Destination | null,
  emergencyContacts: EmergencyContact[]
): SOSData {
  return {
    id: generateSOSId(),
    activatedAt: Date.now(),
    coordinates,
    batteryLevel,
    lastMovement: coordinates?.heading
      ? `Heading ${Math.round(coordinates.heading)}° at ${coordinates.speed?.toFixed(1) || '0'} m/s`
      : 'Stationary / Unknown',
    selectedDestination,
    emergencyContacts,
    status: 'activated',
    message: generateEmergencyMessage(coordinates, batteryLevel, selectedDestination),
  };
}

/** Generate a human-readable emergency message */
export function generateEmergencyMessage(
  coordinates: GPSPosition | null,
  batteryLevel: number | null,
  destination: Destination | null
): string {
  let message = '🆘 EMERGENCY — I may be lost and need assistance.\n\n';

  if (coordinates) {
    const coordStr = formatCoordinates(coordinates.latitude, coordinates.longitude);
    message += `📍 My location: ${coordStr}\n`;
    message += `📎 Map: https://www.google.com/maps?q=${coordinates.latitude},${coordinates.longitude}\n`;
    message += `📏 GPS Accuracy: ±${Math.round(coordinates.accuracy)}m\n`;
  } else {
    message += '📍 Location: Unable to determine\n';
  }

  if (batteryLevel !== null) {
    message += `🔋 Battery: ${batteryLevel}%\n`;
  }

  if (destination) {
    message += `\n🎯 Heading toward: ${destination.name} (${destination.distance.toFixed(1)} km ${destination.direction})\n`;
  }

  message += `\n⏰ Time: ${new Date().toLocaleString()}\n`;
  message += '\nPlease send help or contact local emergency services.';

  return message;
}

/** Generate a Google Maps link for coordinates */
export function generateMapLink(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

/** Open native phone dialer to call emergency services */
export function callEmergencyServices(number: string = '112'): void {
  window.location.href = `tel:${number}`;
}

/** Open native phone dialer to call a specific contact */
export function callContact(phone: string): void {
  window.location.href = `tel:${phone}`;
}

/** Open native SMS app with pre-filled emergency message */
export function sendSMSToContact(phone: string, message: string): void {
  // Use sms: URI scheme — works on most mobile devices
  const encodedMessage = encodeURIComponent(message);
  window.location.href = `sms:${phone}?body=${encodedMessage}`;
}

/** Share location using Web Share API */
export async function shareLocation(message: string): Promise<boolean> {
  if ('share' in navigator) {
    try {
      await navigator.share({
        title: '🆘 Emergency Location',
        text: message,
      });
      return true;
    } catch (err) {
      // User cancelled or share failed
      if ((err as Error).name !== 'AbortError') {
        console.error('Share failed:', err);
      }
      return false;
    }
  }

  // Fallback: copy to clipboard
  try {
    if (typeof navigator !== 'undefined' && 'clipboard' in navigator && (navigator as Navigator).clipboard) {
      await (navigator as Navigator).clipboard.writeText(message);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/** Check if Web Share API is available */
export function isShareAvailable(): boolean {
  return 'share' in navigator;
}

/** Generate a short emergency location message for quick sharing */
export function generateShortMessage(coordinates: GPSPosition | null): string {
  if (!coordinates) return '🆘 I need help! Unable to determine my location.';
  
  return `🆘 Help! My location: ${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)} — https://www.google.com/maps?q=${coordinates.latitude},${coordinates.longitude}`;
}
