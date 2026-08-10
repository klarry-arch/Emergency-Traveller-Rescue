# 🏔️ Emergency Traveller Rescue & Navigation App

A mobile-first **Progressive Web App (PWA)** engineered for travellers, hikers, tourists, campers, and humanitarian workers lost or stranded in remote locations (**jungles, forests, mountains, deserts, rural areas**) to find the safest and fastest route back to civilization.

![License](https://img.shields.io/badge/License-MIT-green.svg)
![React](https://img.shields.io/badge/React-18-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)
![Vite](https://img.shields.io/badge/Vite-6.0-purple.svg)
![PWA](https://img.shields.io/badge/PWA-Offline%20Ready-brightgreen.svg)

---

## 🚀 Live Demo & Screenshots

- **Local Host URL**: `http://localhost:5173/`

---

## 🌟 Key Features

### 1. 🆘 Emergency Home Screen & Quick Response
- **"I'M LOST — HELP ME" & SOS Buttons**: High-contrast, stress-optimized emergency action buttons with pulsating visual indicators.
- **Real-Time Telemetry Bar**: Live status display for **GPS accuracy ($\pm X\text{m}$)**, **battery level**, and **network state (`Online 🟢 / Limited 🟡 / Offline 🔴`)**.
- **Instant Location Readout**: Latitude/Longitude coordinates display with real-time reverse geocoded landmark name (e.g. *"Mount Kenya National Park, Sector 4"*).

### 2. 🧭 "FIND MY WAY OUT" & Intelligent Exit Ranking
- **Weighted Safety Scoring Algorithm**:
  $$\text{Safety Score} = \text{Reliability} + \text{Accessibility} + \text{Connectivity} + \text{Proximity} - \text{Terrain Penalty} - \text{GPS Uncertainty}$$
- **Multi-Factor Evaluation**: Ranks nearby exits (hospitals 🏥, police posts 🚓, settlements 🏘️, highways 🛣️, schools 🏫, fuel stations ⛽, hotels 🏨) based on road access, trail availability, walking time, distance, and user emergency profile (Injured? Alone? Water? Walking ability?).
- **Safety Categories**:
  - 🟢 **Recommended** ($\text{Score} \ge 60$)
  - 🟡 **Possible** ($\text{Score } 35 - 59$)
  - 🔴 **Not Recommended** ($\text{Score} < 35$)

### 3. 🛰️ Realtime Geographical Imaging & Interactive Maps
- **Leaflet & OpenStreetMap Integration**: Interactive live map view with user pulse position marker, compass heading arrow, and accuracy uncertainty ring.
- **Multi-Provider Tile Layer Switcher**:
  - 🛰️ **Esri World High-Resolution Satellite Imagery**
  - ⛰️ **OpenTopoMap SRTM Elevation Terrain**
  - 🌙 **Emergency Night-Vision Dark Base Map** (CartoDB Dark Matter)
  - 🗺️ **Standard OpenStreetMap**
- **Live Polyline Overlays**: Solid green for OSRM calculated routes, dashed amber for straight-line emergency bearings, and green trail for breadcrumbs.

### 4. 📴 Offline-First PWA Architecture
- **Workbox Service Worker**: Caches app shell, static assets, Google Fonts, and runtime OSM tile caches.
- **IndexedDB Storage (`localforage`)**: Persists emergency contacts, trip plans, breadcrumb tracks, user settings, and cached POIs.
- **Straight-Line Emergency Routing**: Provides compass direction & distance calculation when internet connection is lost.

### 5. 🆘 Emergency SOS & Location Sharing
- **Safety Confirmation Modal**: Prevents accidental activation.
- **Direct Calling & SMS Links**: Integrated `tel:` and `sms:` URI handlers pre-fill emergency coordinates, battery state, and destination into native device apps.
- **Web Share API**: One-tap location sharing with Google Maps coordinate links.

### 6. 📍 Breadcrumb Trail & "Follow My Track Back"
- **Movement Recording**: Automatically drops breadcrumb points along the user's path.
- **Backtrack Risk Protection**: Warns users when retracing their steps involves extreme elevation changes ($>500\text{m}$), long distances ($>15\text{km}$), or old tracks ($>6\text{h}$).

### 7. 🔋 Ultra Low Power & Battery Emergency Mode
- **Battery Status API Integration**: Monitors battery level and discharging time.
- **Ultra Low Power Mode**: Reduces GPS update frequency, disables non-essential UI animations, and applies high-contrast OLED black themes to preserve battery.

---

## 🛠️ Technology Stack

| Component | Technology | Description |
|-----------|------------|-------------|
| **Frontend** | React 18 + TypeScript | UI framework & type safety |
| **Build Tool** | Vite | Lightning-fast build & HMR |
| **Styling** | Vanilla CSS | Custom properties, dark/light themes, outdoor high contrast |
| **PWA** | `vite-plugin-pwa` + Workbox | Offline service worker & asset caching |
| **Maps** | Leaflet + OpenStreetMap | Interactive mapping, satellite layers & markers |
| **POI Search** | Overpass API | OpenStreetMap point-of-interest query engine |
| **Routing** | OSRM API | Walking & driving pathfinding engine |
| **Geocoding** | Nominatim API | Real-time coordinate landmark resolution |
| **Elevation** | Open-Elevation API | Terrain elevation profile & slope calculation |
| **Storage** | IndexedDB via `localforage` | Offline data persistence |

---

## 💻 Getting Started Locally

### Prerequisites
- Node.js 18+ and npm installed

### Installation & Run

```bash
# 1. Clone the repository
git clone https://github.com/klarry-arch/Emergency-Traveller-Rescue.git
cd Emergency-Traveller-Rescue

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# 4. Open in browser
# Navigate to http://localhost:5173/
```

### Production Build & PWA Preview

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview
```

---

## 📁 Repository Structure

```
.
├── index.html                    # PWA metadata & mobile viewport settings
├── vite.config.ts                # Vite configuration & Workbox PWA caching rules
├── package.json                  # Dependencies and build scripts
├── README.md                     # Project documentation
├── public/                       # Favicons, icons, PWA assets
└── src/
    ├── App.tsx                   # App shell, mobile device mockup frame, SOS modal
    ├── App.css                   # Mobile device shell styling
    ├── index.css                 # Design system tokens & utility classes
    ├── main.tsx                  # React entry point
    ├── components/
    │   └── LiveMapView.tsx       # Leaflet map with live tracking & 4 imaging layers
    ├── hooks/                    # useGPS, useBattery, useCompass, useNetwork, useSettings
    ├── services/                 # GPS, POI, Ranking, Routing, Compass, SOS, Breadcrumb, GeoImaging
    ├── screens/                  # 10 dedicated emergency screens
    └── types/                    # TypeScript interfaces
```

---

## ⚖️ Safety Disclaimer

> [!IMPORTANT]
> **Emergency Traveller Rescue** is an emergency assistance and navigation tool, **not a guaranteed rescue system**. Route data and location predictions depend on available device sensors and OpenStreetMap data which may be incomplete or outdated in certain remote areas. Always notify family/guides before traveling and contact local emergency services when in danger.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
