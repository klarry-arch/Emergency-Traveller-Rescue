/**
 * Emergency Traveller Rescue — Main App Component
 * 
 * Handles screen routing, global state management,
 * and emergency mode orchestration.
 */

import { useState, useEffect, useCallback } from 'react';
import type {
  Screen, Destination, Route, BreadcrumbTrack,
  EmergencyContact, EmergencyProfile, SOSData, TripPlan
} from './types';
import { useGPS, useBattery, useNetwork, useSettings, useCompass } from './hooks';
import { searchNearbyPOIs, getDefaultCategories } from './services/poiService';
import { rankDestinations, findBestExit } from './services/rankingService';
import { getRoute } from './services/routingService';
import { createSOSData, generateEmergencyMessage, shareLocation } from './services/sosService';
import {
  createTrack, addPoint, pauseTrack, resumeTrack, stopTrack
} from './services/breadcrumbService';
import { getContacts, saveContacts, isFirstLaunch, markLaunched } from './services/storageService';

// Screens
import WelcomeScreen from './screens/WelcomeScreen';
import HomeScreen from './screens/HomeScreen';
import EmergencyScreen from './screens/EmergencyScreen';
import NearbyExitsScreen from './screens/NearbyExitsScreen';
import RouteScreen from './screens/RouteScreen';
import CompassScreen from './screens/CompassScreen';
import OfflineMapsScreen from './screens/OfflineMapsScreen';
import ContactsScreen from './screens/ContactsScreen';
import TripScreen from './screens/TripScreen';
import SettingsScreen from './screens/SettingsScreen';

import './App.css';

export default function App() {
  // ─── Navigation ─────────────────────────────────────────
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [screenHistory, setScreenHistory] = useState<Screen[]>([]);
  const [showFirstLaunch, setShowFirstLaunch] = useState(false);

  // ─── Core Hooks ─────────────────────────────────────────
  const { settings, updateSettings } = useSettings();
  const { position, error: gpsError, isTracking } = useGPS(true, settings.batteryMode);
  const { level: batteryLevel, charging: batteryCharging } = useBattery();
  const networkStatus = useNetwork();
  const { heading: compassHeading } = useCompass();

  // ─── Emergency State ────────────────────────────────────
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const [emergencyProfile, setEmergencyProfile] = useState<EmergencyProfile>({
    isInjured: null, isAlone: null, hasWater: null, canWalk: null, batteryLevel: null,
  });

  // ─── Destinations & Routing ─────────────────────────────
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [currentRoute, setCurrentRoute] = useState<Route | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchRadius, setSearchRadius] = useState(10);
  const [categories, setCategories] = useState(getDefaultCategories());

  // ─── Breadcrumb ─────────────────────────────────────────
  const [breadcrumbTrack, setBreadcrumbTrack] = useState<BreadcrumbTrack | null>(null);

  // ─── Contacts ───────────────────────────────────────────
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);

  // ─── SOS ────────────────────────────────────────────────
  const [sosData, setSOSData] = useState<SOSData | null>(null);
  const [showSOSConfirm, setShowSOSConfirm] = useState(false);

  // ─── Trip ───────────────────────────────────────────────
  const [activeTripPlan, setActiveTripPlan] = useState<TripPlan | null>(null);

  // ─── First Launch Check ─────────────────────────────────
  useEffect(() => {
    isFirstLaunch().then((first) => {
      if (first) {
        setShowFirstLaunch(true);
        setCurrentScreen('welcome');
      }
    });
    getContacts().then(setContacts);
  }, []);

  // ─── Theme Management ──────────────────────────────────
  useEffect(() => {
    const theme = settings.theme === 'auto'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : settings.theme;
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-battery-mode', String(settings.batteryMode));
  }, [settings.theme, settings.batteryMode]);

  // ─── Battery Level Sync ─────────────────────────────────
  useEffect(() => {
    if (batteryLevel !== null) {
      setEmergencyProfile((p) => ({ ...p, batteryLevel }));
    }
  }, [batteryLevel]);

  // ─── Breadcrumb Recording ──────────────────────────────
  useEffect(() => {
    if (breadcrumbTrack && breadcrumbTrack.status === 'recording' && position) {
      setBreadcrumbTrack((track) => track ? addPoint(track, position) : null);
    }
  }, [position, breadcrumbTrack?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Navigation Helpers ─────────────────────────────────
  const navigate = useCallback((screen: Screen) => {
    setScreenHistory((h) => [...h, currentScreen]);
    setCurrentScreen(screen);
  }, [currentScreen]);

  const goBack = useCallback(() => {
    const prev = screenHistory[screenHistory.length - 1] || 'home';
    setScreenHistory((h) => h.slice(0, -1));
    setCurrentScreen(prev);
  }, [screenHistory]);

  // ─── Search for Exits ──────────────────────────────────
  const searchExits = useCallback(async (radius?: number) => {
    if (!position) return;
    
    setIsSearching(true);
    const r = radius || searchRadius;
    const enabledTypes = categories.filter((c) => c.enabled).map((c) => c.type);

    try {
      const pois = await searchNearbyPOIs(position.latitude, position.longitude, r, enabledTypes);
      const ranked = rankDestinations(pois, position.accuracy, emergencyProfile);
      setDestinations(ranked);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  }, [position, searchRadius, categories, emergencyProfile]);

  // ─── Select Destination & Get Route ────────────────────
  const selectDestination = useCallback(async (dest: Destination) => {
    setSelectedDestination(dest);
    if (position) {
      try {
        const route = await getRoute(position.latitude, position.longitude, dest);
        setCurrentRoute(route);
      } catch {
        setCurrentRoute(null);
      }
    }
    navigate('route');
  }, [position, navigate]);

  // ─── Emergency Mode ────────────────────────────────────
  const activateEmergencyMode = useCallback(() => {
    setIsEmergencyMode(true);
    navigate('emergency');
  }, [navigate]);

  const findMyWayOut = useCallback(async () => {
    if (!position) return;
    await searchExits();
    navigate('nearby_exits');
  }, [position, searchExits, navigate]);

  // ─── SOS ────────────────────────────────────────────────
  const activateSOS = useCallback(() => {
    setShowSOSConfirm(true);
  }, []);

  const confirmSOS = useCallback(() => {
    const sos = createSOSData(position, batteryLevel, selectedDestination, contacts);
    setSOSData(sos);
    setShowSOSConfirm(false);
  }, [position, batteryLevel, selectedDestination, contacts]);

  const cancelSOS = useCallback(() => {
    setShowSOSConfirm(false);
  }, []);

  // ─── Location Sharing ──────────────────────────────────
  const shareMyLocation = useCallback(async () => {
    const message = generateEmergencyMessage(position, batteryLevel, selectedDestination);
    await shareLocation(message);
  }, [position, batteryLevel, selectedDestination]);

  // ─── Breadcrumb ─────────────────────────────────────────
  const startTracking = useCallback(() => {
    const track = createTrack();
    setBreadcrumbTrack(track);
  }, []);

  const toggleTracking = useCallback(() => {
    if (!breadcrumbTrack) {
      startTracking();
    } else if (breadcrumbTrack.status === 'recording') {
      setBreadcrumbTrack(pauseTrack(breadcrumbTrack));
    } else if (breadcrumbTrack.status === 'paused') {
      setBreadcrumbTrack(resumeTrack(breadcrumbTrack));
    }
  }, [breadcrumbTrack, startTracking]);

  const stopTrackingAction = useCallback(() => {
    if (breadcrumbTrack) {
      setBreadcrumbTrack(stopTrack(breadcrumbTrack));
    }
  }, [breadcrumbTrack]);

  // ─── Contacts ───────────────────────────────────────────
  const updateContacts = useCallback(async (newContacts: EmergencyContact[]) => {
    setContacts(newContacts);
    await saveContacts(newContacts);
  }, []);

  // ─── Welcome Complete ──────────────────────────────────
  const completeWelcome = useCallback(async () => {
    await markLaunched();
    setShowFirstLaunch(false);
    setCurrentScreen('home');
  }, []);

  // ─── Best Exit ──────────────────────────────────────────
  const bestExit = findBestExit(destinations);

  // ─── Render Current Screen ─────────────────────────────

  const renderScreen = () => {
    switch (currentScreen) {
      case 'welcome':
        return (
          <WelcomeScreen
            onComplete={completeWelcome}
            onSetupContacts={() => navigate('contacts')}
            onDownloadMaps={() => navigate('offline_maps')}
          />
        );

      case 'home':
        return (
          <HomeScreen
            position={position}
            gpsError={gpsError}
            isTracking={isTracking}
            batteryLevel={batteryLevel}
            batteryCharging={batteryCharging}
            networkStatus={networkStatus}
            bestExit={bestExit}
            onImLost={activateEmergencyMode}
            onSOS={activateSOS}
            onNavigate={navigate}
            breadcrumbTrack={breadcrumbTrack}
          />
        );

      case 'emergency':
        return (
          <EmergencyScreen
            position={position}
            batteryLevel={batteryLevel}
            networkStatus={networkStatus}
            emergencyProfile={emergencyProfile}
            sosData={sosData}
            compassHeading={compassHeading}
            selectedDestination={selectedDestination}
            breadcrumbTrack={breadcrumbTrack}
            onUpdateProfile={setEmergencyProfile}
            onFindMyWayOut={findMyWayOut}
            onSOS={activateSOS}
            onShareLocation={shareMyLocation}
            onToggleTracking={toggleTracking}
            onStopTracking={stopTrackingAction}
            onNavigate={navigate}
            onBack={goBack}
            isSearching={isSearching}
          />
        );

      case 'nearby_exits':
        return (
          <NearbyExitsScreen
            position={position}
            destinations={destinations}
            categories={categories}
            searchRadius={searchRadius}
            isSearching={isSearching}
            onSelectDestination={selectDestination}
            onSearch={searchExits}
            onChangeRadius={setSearchRadius}
            onToggleCategory={(type) => {
              setCategories((cats) =>
                cats.map((c) => c.type === type ? { ...c, enabled: !c.enabled } : c)
              );
            }}
            onBack={goBack}
          />
        );

      case 'route':
        return (
          <RouteScreen
            position={position}
            destination={selectedDestination}
            route={currentRoute}
            compassHeading={compassHeading}
            onBack={goBack}
            onSOS={activateSOS}
          />
        );

      case 'compass':
        return (
          <CompassScreen
            heading={compassHeading}
            position={position}
            destination={selectedDestination}
            onBack={goBack}
          />
        );

      case 'offline_maps':
        return (
          <OfflineMapsScreen
            onBack={goBack}
          />
        );

      case 'contacts':
        return (
          <ContactsScreen
            contacts={contacts}
            onUpdateContacts={updateContacts}
            onBack={goBack}
            fromWelcome={showFirstLaunch}
          />
        );

      case 'trip':
        return (
          <TripScreen
            contacts={contacts}
            activeTripPlan={activeTripPlan}
            onSaveTripPlan={setActiveTripPlan}
            onBack={goBack}
            position={position}
            breadcrumbTrack={breadcrumbTrack}
            onStartTracking={startTracking}
            onStopTracking={stopTrackingAction}
          />
        );

      case 'settings':
        return (
          <SettingsScreen
            settings={settings}
            onUpdateSettings={updateSettings}
            onBack={goBack}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="mobile-shell-wrapper">
      <div className="device-frame">
        <div className="device-notch">
          <div className="device-notch__camera" />
        </div>

        <div className="app" data-emergency={isEmergencyMode}>
          {renderScreen()}

          {/* SOS Confirmation Modal */}
          {showSOSConfirm && (
            <div className="modal-overlay" onClick={cancelSOS}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-content__title" style={{ color: 'var(--color-emergency-red)' }}>
                  🆘 Activate SOS?
                </div>
                <div className="modal-content__body">
                  This will prepare an emergency alert with your current location and contact information.
                  <br /><br />
                  <strong>This is NOT a direct call to emergency services.</strong> You will be able to call 
                  emergency services or your emergency contacts from the next screen.
                </div>
                <div className="modal-content__actions">
                  <button className="btn btn--danger btn--lg btn--full" onClick={confirmSOS}>
                    🆘 YES — ACTIVATE SOS
                  </button>
                  <button className="btn btn--outline btn--lg btn--full" onClick={cancelSOS}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SOS Active Overlay */}
          {sosData && (
            <div className="sos-active-bar" onClick={() => navigate('emergency')}>
              <span className="sos-active-bar__pulse" />
              <span>🆘 SOS ACTIVE — Tap for details</span>
            </div>
          )}

          {/* Bottom Tab Bar (except welcome screen) */}
          {currentScreen !== 'welcome' && (
            <nav className="tab-bar">
              <button
                className={`tab-bar__item ${currentScreen === 'home' ? 'tab-bar__item--active' : ''}`}
                onClick={() => setCurrentScreen('home')}
              >
                <span className="tab-bar__item-icon">🏠</span>
                <span>Home</span>
              </button>
              <button
                className={`tab-bar__item ${currentScreen === 'compass' ? 'tab-bar__item--active' : ''}`}
                onClick={() => navigate('compass')}
              >
                <span className="tab-bar__item-icon">🧭</span>
                <span>Compass</span>
              </button>
              <button
                className="tab-bar__item tab-bar__item--sos"
                onClick={activateSOS}
              >
                <span className="tab-bar__item-icon">SOS</span>
                <span>SOS</span>
              </button>
              <button
                className={`tab-bar__item ${currentScreen === 'trip' ? 'tab-bar__item--active' : ''}`}
                onClick={() => navigate('trip')}
              >
                <span className="tab-bar__item-icon">🗺️</span>
                <span>Trip</span>
              </button>
              <button
                className={`tab-bar__item ${currentScreen === 'settings' ? 'tab-bar__item--active' : ''}`}
                onClick={() => navigate('settings')}
              >
                <span className="tab-bar__item-icon">⚙️</span>
                <span>Settings</span>
              </button>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
