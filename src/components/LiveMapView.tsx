/**
 * LiveMapView Component — Interactive Leaflet Map for Live Location & Route
 * 
 * Features:
 * - Live user position marker with pulsing accuracy circle
 * - Breadcrumb path polyline (history of movement)
 * - Ranked destination markers with safety color badges
 * - Selected destination marker & route polyline
 * - Tile layer switcher (Standard OSM, Satellite, Terrain)
 * - "Center on Me" live tracking control
 */

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { GPSPosition, Destination, Route, BreadcrumbTrack } from '../types';
import { getRatingColor } from '../services/rankingService';
import { DESTINATION_ICONS } from '../services/poiService';

interface LiveMapViewProps {
  position: GPSPosition | null;
  destinations?: Destination[];
  selectedDestination?: Destination | null;
  route?: Route | null;
  breadcrumbTrack?: BreadcrumbTrack | null;
  compassHeading?: number | null;
  mapStyle?: 'standard' | 'satellite' | 'terrain';
  height?: string | number;
  className?: string;
  onSelectDestination?: (dest: Destination) => void;
}

const TILE_LAYERS = {
  standard: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; High-Res Satellite Imagery',
  },
  terrain: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Map data &copy; OpenTopoMap SRTM Elevation',
  },
  night_vision: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CARTO Emergency Dark Base Map',
  },
};

export default function LiveMapView({
  position,
  destinations = [],
  selectedDestination = null,
  route = null,
  breadcrumbTrack = null,
  compassHeading = null,
  mapStyle = 'standard',
  height = '350px',
  className = '',
  onSelectDestination,
}: LiveMapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);
  const destinationMarkersRef = useRef<L.Marker[]>([]);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const breadcrumbPolylineRef = useRef<L.Polyline | null>(null);

  const [currentStyle, setCurrentStyle] = useState<'standard' | 'satellite' | 'terrain' | 'night_vision'>(mapStyle);
  const [isCentering, setIsCentering] = useState(true);

  // Default initial center (Fallback: Kenya / Mount Kenya remote hiking region or current GPS)
  const defaultLat = position?.latitude ?? -0.15;
  const defaultLng = position?.longitude ?? 37.3;

  // 1. Initialize Map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [defaultLat, defaultLng],
      zoom: position ? 14 : 12,
      zoomControl: false,
    });

    const tile = L.tileLayer(TILE_LAYERS[currentStyle].url, {
      attribution: TILE_LAYERS[currentStyle].attribution,
      maxZoom: 19,
    }).addTo(map);

    tileLayerRef.current = tile;
    mapRef.current = map;

    // User drag unsets auto-centering
    map.on('dragstart', () => setIsCentering(false));

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 2. Handle Tile Layer Switch
  useEffect(() => {
    if (!mapRef.current) return;
    if (tileLayerRef.current) {
      mapRef.current.removeLayer(tileLayerRef.current);
    }
    const tile = L.tileLayer(TILE_LAYERS[currentStyle].url, {
      attribution: TILE_LAYERS[currentStyle].attribution,
      maxZoom: 19,
    }).addTo(mapRef.current);
    tileLayerRef.current = tile;
  }, [currentStyle]);

  // 3. Update User Location Marker & Accuracy Circle
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !position) return;

    const latLng: [number, number] = [position.latitude, position.longitude];

    // Auto-center map if tracking
    if (isCentering) {
      map.panTo(latLng);
    }

    // User Position Icon with Heading & Pulse
    const headingRotation = compassHeading !== null ? compassHeading : position.heading ?? 0;
    const userHtml = `
      <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; inset: 0; background: rgba(59, 130, 246, 0.4); border-radius: 50%; animation: pulse-ring 1.5s infinite;"></div>
        <div style="width: 16px; height: 16px; background: #2563EB; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(37,99,235,0.8); z-index: 2;"></div>
        ${compassHeading !== null ? `<div style="position: absolute; top: -6px; width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-bottom: 10px solid #DC2626; transform: rotate(${headingRotation}deg); transform-origin: bottom center;"></div>` : ''}
      </div>
    `;

    const userIcon = L.divIcon({
      html: userHtml,
      className: '',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng(latLng);
      userMarkerRef.current.setIcon(userIcon);
    } else {
      userMarkerRef.current = L.marker(latLng, { icon: userIcon, zIndexOffset: 1000 })
        .addTo(map)
        .bindPopup('<b>📍 Your Current Location</b><br>Accuracy: ±' + Math.round(position.accuracy) + 'm');
    }

    // Accuracy Circle
    if (accuracyCircleRef.current) {
      accuracyCircleRef.current.setLatLng(latLng);
      accuracyCircleRef.current.setRadius(position.accuracy);
    } else {
      accuracyCircleRef.current = L.circle(latLng, {
        radius: position.accuracy,
        color: '#2563EB',
        fillColor: '#3B82F6',
        fillOpacity: 0.15,
        weight: 1,
      }).addTo(map);
    }
  }, [position, compassHeading, isCentering]);

  // 4. Update Destinations Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing destination markers
    destinationMarkersRef.current.forEach((m) => map.removeLayer(m));
    destinationMarkersRef.current = [];

    destinations.forEach((dest) => {
      const isSelected = selectedDestination?.id === dest.id;
      const ratingColor = getRatingColor(dest.safetyRating);
      const iconEmoji = DESTINATION_ICONS[dest.type] || '📍';

      const markerHtml = `
        <div style="
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          background: ${isSelected ? '#052E16' : '#171717'};
          border: 2px solid ${isSelected ? '#22C55E' : ratingColor};
          border-radius: 20px;
          color: white;
          font-size: 12px;
          font-weight: bold;
          box-shadow: 0 4px 10px rgba(0,0,0,0.6);
          white-space: nowrap;
          transform: scale(${isSelected ? 1.15 : 1});
          transition: transform 0.2s;
        ">
          <span>${iconEmoji}</span>
          <span>${dest.name}</span>
        </div>
      `;

      const markerIcon = L.divIcon({
        html: markerHtml,
        className: '',
        iconAnchor: [30, 15],
      });

      const marker = L.marker([dest.latitude, dest.longitude], { icon: markerIcon })
        .addTo(map)
        .on('click', () => {
          if (onSelectDestination) onSelectDestination(dest);
        });

      destinationMarkersRef.current.push(marker);
    });
  }, [destinations, selectedDestination, onSelectDestination]);

  // 5. Update Route Polyline
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (routePolylineRef.current) {
      map.removeLayer(routePolylineRef.current);
      routePolylineRef.current = null;
    }

    if (route && route.geometry.length > 0) {
      const polyline = L.polyline(route.geometry, {
        color: route.source === 'osrm' ? '#16A34A' : '#F59E0B',
        weight: 5,
        opacity: 0.8,
        dashArray: route.source === 'straight_line' ? '8, 8' : undefined,
      }).addTo(map);

      routePolylineRef.current = polyline;

      // Fit bounds to show both user & destination
      map.fitBounds(polyline.getBounds(), { padding: [40, 40] });
    }
  }, [route]);

  // 6. Update Breadcrumb Track Polyline
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (breadcrumbPolylineRef.current) {
      map.removeLayer(breadcrumbPolylineRef.current);
      breadcrumbPolylineRef.current = null;
    }

    if (breadcrumbTrack && breadcrumbTrack.points.length > 1) {
      const points: [number, number][] = breadcrumbTrack.points.map((p) => [p.latitude, p.longitude]);
      const polyline = L.polyline(points, {
        color: '#22C55E',
        weight: 4,
        opacity: 0.9,
      }).addTo(map);

      breadcrumbPolylineRef.current = polyline;
    }
  }, [breadcrumbTrack]);

  const handleCenterOnMe = () => {
    setIsCentering(true);
    if (mapRef.current && position) {
      mapRef.current.setView([position.latitude, position.longitude], 15);
    }
  };

  return (
    <div className={`map-wrapper ${className}`} style={{ height, position: 'relative', overflow: 'hidden', borderRadius: 'var(--radius-xl)' }}>
      {/* Leaflet Map Div */}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* Floating Controls */}
      <div className="map-controls">
        <button
          className="map-control-btn"
          onClick={handleCenterOnMe}
          title="Center on my location"
          style={{ color: isCentering ? 'var(--color-forest-400)' : 'var(--text-primary)' }}
        >
          🎯
        </button>

        <button
          className="map-control-btn"
          onClick={() => {
            const styles: Array<'standard' | 'satellite' | 'terrain' | 'night_vision'> = ['standard', 'satellite', 'terrain', 'night_vision'];
            const nextIndex = (styles.indexOf(currentStyle) + 1) % styles.length;
            setCurrentStyle(styles[nextIndex]);
          }}
          title={`Layer: ${currentStyle.replace('_', ' ').toUpperCase()}`}
        >
          {currentStyle === 'standard' ? '🛰️' : currentStyle === 'satellite' ? '⛰️' : currentStyle === 'terrain' ? '🌙' : '🗺️'}
        </button>
      </div>

      {/* Live Badge */}
      <div style={{
        position: 'absolute',
        bottom: 12,
        left: 12,
        zIndex: 400,
        background: 'rgba(10, 10, 10, 0.85)',
        backdropFilter: 'blur(8px)',
        border: '1px solid var(--border-primary)',
        borderRadius: 'var(--radius-full)',
        padding: '4px 12px',
        fontSize: 'var(--text-xs)',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        color: 'var(--text-primary)',
      }}>
        <span className={`status-dot ${position ? 'status-dot--online' : 'status-dot--offline'}`} />
        <span>{position ? `LIVE GPS • ±${Math.round(position.accuracy)}m` : 'SEARCHING GPS...'}</span>
      </div>
    </div>
  );
}
