/**
 * Storage Service — IndexedDB via localforage
 * 
 * Persistent storage for emergency contacts, trip plans,
 * breadcrumb tracks, cached POIs, and user settings.
 */

import localforage from 'localforage';
import type { EmergencyContact, TripPlan, BreadcrumbTrack, AppSettings } from '../types';

// Configure localforage
localforage.config({
  name: 'EmergencyTravellerRescue',
  storeName: 'etr_store',
  description: 'Emergency Traveller Rescue App Data',
});

const KEYS = {
  CONTACTS: 'etr_contacts',
  TRIP_PLANS: 'etr_trip_plans',
  TRACKS: 'etr_tracks',
  SETTINGS: 'etr_settings',
  FIRST_LAUNCH: 'etr_first_launch',
};

// ─── Emergency Contacts ─────────────────────────────────────

export async function getContacts(): Promise<EmergencyContact[]> {
  const contacts = await localforage.getItem<EmergencyContact[]>(KEYS.CONTACTS);
  return contacts || [];
}

export async function saveContacts(contacts: EmergencyContact[]): Promise<void> {
  await localforage.setItem(KEYS.CONTACTS, contacts);
}

export async function addContact(contact: EmergencyContact): Promise<EmergencyContact[]> {
  const contacts = await getContacts();
  contacts.push(contact);
  await saveContacts(contacts);
  return contacts;
}

export async function removeContact(id: string): Promise<EmergencyContact[]> {
  let contacts = await getContacts();
  contacts = contacts.filter((c) => c.id !== id);
  await saveContacts(contacts);
  return contacts;
}

export async function updateContact(updated: EmergencyContact): Promise<EmergencyContact[]> {
  const contacts = await getContacts();
  const index = contacts.findIndex((c) => c.id === updated.id);
  if (index >= 0) {
    contacts[index] = updated;
    await saveContacts(contacts);
  }
  return contacts;
}

// ─── Trip Plans ─────────────────────────────────────────────

export async function getTripPlans(): Promise<TripPlan[]> {
  const plans = await localforage.getItem<TripPlan[]>(KEYS.TRIP_PLANS);
  return plans || [];
}

export async function saveTripPlan(plan: TripPlan): Promise<void> {
  const plans = await getTripPlans();
  const index = plans.findIndex((p) => p.id === plan.id);
  if (index >= 0) {
    plans[index] = plan;
  } else {
    plans.push(plan);
  }
  await localforage.setItem(KEYS.TRIP_PLANS, plans);
}

export async function deleteTripPlan(id: string): Promise<void> {
  let plans = await getTripPlans();
  plans = plans.filter((p) => p.id !== id);
  await localforage.setItem(KEYS.TRIP_PLANS, plans);
}

// ─── Breadcrumb Tracks ──────────────────────────────────────

export async function getTracks(): Promise<BreadcrumbTrack[]> {
  const tracks = await localforage.getItem<BreadcrumbTrack[]>(KEYS.TRACKS);
  return tracks || [];
}

export async function saveTrack(track: BreadcrumbTrack): Promise<void> {
  const tracks = await getTracks();
  const index = tracks.findIndex((t) => t.id === track.id);
  if (index >= 0) {
    tracks[index] = track;
  } else {
    tracks.push(track);
  }
  await localforage.setItem(KEYS.TRACKS, tracks);
}

export async function deleteTrack(id: string): Promise<void> {
  let tracks = await getTracks();
  tracks = tracks.filter((t) => t.id !== id);
  await localforage.setItem(KEYS.TRACKS, tracks);
}

// ─── App Settings ───────────────────────────────────────────

export const DEFAULT_SETTINGS: AppSettings = {
  units: 'metric',
  mapStyle: 'standard',
  theme: 'dark',
  batteryMode: false,
  searchRadius: 10,
  gpsUpdateInterval: 5000,
  showSafetyAlerts: true,
  shareLocationConsent: false,
};

export async function getSettings(): Promise<AppSettings> {
  const settings = await localforage.getItem<AppSettings>(KEYS.SETTINGS);
  return { ...DEFAULT_SETTINGS, ...settings };
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await localforage.setItem(KEYS.SETTINGS, settings);
}

// ─── First Launch ───────────────────────────────────────────

export async function isFirstLaunch(): Promise<boolean> {
  const launched = await localforage.getItem<boolean>(KEYS.FIRST_LAUNCH);
  return !launched;
}

export async function markLaunched(): Promise<void> {
  await localforage.setItem(KEYS.FIRST_LAUNCH, true);
}

// ─── Utility ────────────────────────────────────────────────

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
