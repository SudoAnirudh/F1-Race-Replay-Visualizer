# 📊 F1 Analytics Dashboard
### Product Requirements & Full Architecture Document

| Field | Value |
|---|---|
| **Version** | 1.0.0 |
| **Author** | Anirudh (SudoAnirudh) |
| **Date** | March 2026 |
| **Stack** | FastF1 + FastAPI + React + Recharts |
| **Status** | Draft — Ready for Implementation |
| **Companion Project** | [F1 Race Replay Visualizer PRD](./F1_Race_Replay_Visualizer_PRD.md) |

---

## ⚠️ Read This First — Relationship to Race Replay PRD

This project is the **analytical twin** of the [F1 Race Replay Visualizer](./F1_Race_Replay_Visualizer_PRD.md). They are designed to share infrastructure and eventually merge into a single unified F1 platform.

```
┌──────────────────────────────────────────────────────────────────┐
│                    F1 PLATFORM  (end state)                      │
│                                                                  │
│   ┌───────────────────────┐   ┌──────────────────────────────┐  │
│   │  F1 Analytics         │   │  F1 Race Replay              │  │
│   │  Dashboard  ◄─────────┼───┼──► Visualizer               │  │
│   │  (this PRD)           │   │  (companion PRD)             │  │
│   └──────────┬────────────┘   └──────────────┬───────────────┘  │
│              │                               │                  │
│              └──────────┬────────────────────┘                  │
│                         │  SHARED LAYER                         │
│              ┌──────────▼────────────────────┐                  │
│              │   FastAPI Backend (shared)    │                  │
│              │   FastF1 Cache (shared)       │                  │
│              │   Pydantic Models (shared)    │                  │
│              │   Deployment (shared)         │                  │
│              └───────────────────────────────┘                  │
└──────────────────────────────────────────────────────────────────┘
```

### Shared Components (build once, use in both)

| Component | Replay PRD File | Dashboard Reuse |
|---|---|---|
| FastAPI backend (`main.py`) | `backend/main.py` | Add new routes to the same app |
| FastF1 disk cache | `backend/cache/` | Same cache directory — no duplication |
| `data_loader.py` | `backend/data_loader.py` | Import `get_race_replay_data()` directly |
| `cache_manager.py` | `backend/cache_manager.py` | Same LRU cache instance |
| `models.py` (Pydantic) | `backend/models.py` | Extend with new response schemas |
| `RaceSelector.jsx` | `frontend/src/components/RaceSelector.jsx` | Identical component, same props |
| `teamColors.js` | `frontend/src/utils/teamColors.js` | Same utility |
| Dockerfile + Cloud Run config | Root `Dockerfile` | Same container, new routes included |

### Build Order Recommendation

```
Week 1–3   →  Build Race Replay Visualizer (backend + canvas)
Week 4     →  Extend the same backend with /analytics/* routes
Week 5–7   →  Build Dashboard frontend (React + Recharts)
Week 8     →  Unified deploy — single Cloud Run service, React Router tabs
```

The two apps ship as **one Cloud Run service** at the end. React Router handles `/replay` and `/dashboard` as separate pages inside the same React app.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Goals & Success Metrics](#2-product-goals--success-metrics)
3. [Scope](#3-scope)
4. [User Personas](#4-user-personas)
5. [Full System Architecture](#5-full-system-architecture)
6. [Project Folder Structure](#6-project-folder-structure)
7. [Dashboard Views & Features](#7-dashboard-views--features)
8. [Data Pipeline & FastF1 Integration](#8-data-pipeline--fastf1-integration)
9. [Backend API Specification](#9-backend-api-specification)
10. [Frontend Architecture](#10-frontend-architecture)
11. [Phased Implementation Plan](#11-phased-implementation-plan)
12. [Component Specifications](#12-component-specifications)
13. [Environment & Dependencies](#13-environment--dependencies)
14. [Unified Deployment](#14-unified-deployment)
15. [Risks & Mitigations](#15-risks--mitigations)
16. [Future Roadmap](#16-future-roadmap)

---

## 1. Executive Summary

F1 Analytics Dashboard is a data-driven web application that turns raw FastF1 telemetry into interactive analytical charts and tables. Users select any race or qualifying session from 2018–2025 and instantly get lap time distributions, head-to-head telemetry overlays, tyre strategy timelines, team pace comparisons, and sector breakdowns — all rendered as interactive React charts.

| The Problem | The Solution |
|---|---|
| Deep F1 analysis requires writing Python scripts, running Jupyter notebooks, and manually interpreting matplotlib charts. There's no interactive web interface to explore race data without coding. | A clean React dashboard backed by a FastAPI server that wraps FastF1 — users click, the backend fetches and processes, the frontend renders polished interactive charts instantly. |

### Connection to Race Replay Visualizer

> The Dashboard and the Replay Visualizer share the same FastAPI backend, the same FastF1 cache, and the same deployment. Building the Replay first (as recommended in its PRD) gives you the backend scaffolding, caching layer, and `data_loader.py` that this project extends — not rebuilds.

---

## 2. Product Goals & Success Metrics

### 2.1 Primary Goals

- Let users explore any race/qualifying session via a clean dropdown interface
- Display 6 distinct analytical views: lap times, telemetry, strategy, team pace, sector analysis, standings
- Support multi-driver selection for head-to-head comparisons
- All charts are interactive — hover tooltips, zoom, pan, click-to-highlight
- First chart render in under 3 seconds on a cached session
- Embed a "Watch Replay" button on any session that links to the Replay Visualizer for that race

### 2.2 Success Metrics

| Metric | Target | How Measured |
|---|---|---|
| Chart load time (cached) | < 3 seconds | Network tab timing |
| Supported sessions | Race + Qualifying + Sprint (2018–2025) | FastF1 session load rate |
| Charts per session | 6 interactive views | Manual feature count |
| Mobile responsive | Tablet and above (768px+) | Browser DevTools |
| Driver selector | Up to 5 simultaneous drivers | Manual QA |
| "Watch Replay" link | Present on all Race sessions | Manual QA |

---

## 3. Scope

### 3.1 In Scope (MVP)

- Session types: Race (`R`), Qualifying (`Q`), Sprint (`S`)
- Year range: 2018–2025 (all rounds available via FastF1)
- **View 1 — Lap Time Scatter**: All drivers' lap times plotted by lap number
- **View 2 — Telemetry Overlay**: Speed, throttle, brake, gear for up to 5 drivers on a single lap
- **View 3 — Tyre Strategy**: Visual pit stop and compound timeline per driver across the race
- **View 4 — Team Pace**: Median lap time per team, ranked as a bar chart
- **View 5 — Sector Analysis**: S1/S2/S3 breakdown for all drivers on their fastest lap
- **View 6 — Position Changes**: Race position per driver plotted lap by lap
- Driver selector component (multi-select, up to 5 drivers)
- "Watch Replay" deep-link button to `/replay?year=X&round=Y` (Race sessions only)
- FastAPI routes added to the Replay project's existing backend

### 3.2 Out of Scope

- Weather data overlay (Phase 2)
- Tyre degradation modeling / delta predictions (Phase 2)
- Live session data during a race weekend (Phase 3)
- Exporting charts as PNG or PDF (Phase 2)
- Comparing across multiple races / seasons in one view (Phase 3)

---

## 4. User Personas

| Persona | Goal | Key Features |
|---|---|---|
| **The F1 Fan** | Understand why their driver lost — where the time went | Strategy view, position changes, lap time scatter |
| **The Analyst** | Deep-dive into telemetry and sector performance | Telemetry overlay, sector analysis, driver multi-select |
| **The ML Engineer** | Explore data before building a model (e.g. Ballon d'Or style pipeline) | All views, raw JSON accessible via `/analytics/*` API |
| **The Recruiter / Reviewer** | Evaluate the developer's skill with a real-world project | Clean UI, working charts, documented API |

---

## 5. Full System Architecture

### 5.1 How Dashboard Extends the Replay Backend

```
┌───────────────────────────────────────────────────────────────┐
│                    UNIFIED FRONTEND  (React)                  │
│                                                               │
│   App.jsx  (React Router)                                     │
│   ├── /replay          → ReplayPage.jsx   (from Replay PRD)  │
│   └── /dashboard       → DashboardPage.jsx  (THIS project)   │
│       ├── SessionPicker.jsx    (year + round + session type)  │
│       ├── DriverSelector.jsx   (multi-select, up to 5)        │
│       ├── ViewTabs.jsx         (6 chart tabs)                 │
│       ├── charts/                                             │
│       │   ├── LapTimeScatter.jsx                              │
│       │   ├── TelemetryOverlay.jsx                            │
│       │   ├── StrategyTimeline.jsx                            │
│       │   ├── TeamPaceBar.jsx                                 │
│       │   ├── SectorBreakdown.jsx                             │
│       │   └── PositionChanges.jsx                             │
│       └── WatchReplayButton.jsx  (links to /replay)          │
└───────────────────────────┬───────────────────────────────────┘
                            │  HTTP / REST (JSON)
         ┌──────────────────▼──────────────────────────────────┐
         │          SHARED FASTAPI BACKEND                      │
         │                                                      │
         │   ── Replay routes (existing) ──                     │
         │   GET /schedule/{year}                               │
         │   GET /replay/{year}/{round}                         │
         │                                                      │
         │   ── Dashboard routes (new, this PRD) ──             │
         │   GET /analytics/lap-times/{year}/{round}/{session}  │
         │   GET /analytics/telemetry/{year}/{round}/{session}  │
         │   GET /analytics/strategy/{year}/{round}             │
         │   GET /analytics/team-pace/{year}/{round}            │
         │   GET /analytics/sectors/{year}/{round}/{session}    │
         │   GET /analytics/positions/{year}/{round}            │
         │                                                      │
         │   main.py           ← shared, extended              │
         │   data_loader.py    ← shared, extended              │
         │   analytics.py      ← NEW file (dashboard logic)    │
         │   cache_manager.py  ← shared, unchanged             │
         │   models.py         ← shared, extended              │
         └───────────────────────┬──────────────────────────────┘
                                 │
         ┌───────────────────────▼──────────────────────────────┐
         │          SHARED DATA LAYER (FastF1)                  │
         │                                                      │
         │   Same fastf1.Cache('./cache/')                      │
         │   Same session.load() calls                          │
         │   Additional: session.laps (full lap data)           │
         │   Additional: lap.get_car_data() (telemetry)         │
         │   Additional: session.get_circuit_info()             │
         └──────────────────────────────────────────────────────┘
```

### 5.2 New File: analytics.py

The only truly new backend file. Imports from the existing `data_loader.py` and adds dashboard-specific processing on top of the already-loaded session object.

```python
# backend/analytics.py
import fastf1
import pandas as pd
from data_loader import load_session  # reuses the cached session loader

def get_lap_times(year, round, session_type):
    session = load_session(year, round, session_type)
    laps = session.laps[['Driver', 'LapNumber', 'LapTime', 'Compound', 'TyreLife', 'IsPersonalBest']]
    laps = laps.dropna(subset=['LapTime'])
    laps['LapTimeSec'] = laps['LapTime'].dt.total_seconds()
    return laps.to_dict(orient='records')

def get_telemetry(year, round, session_type, drivers: list, lap: str = 'fastest'):
    session = load_session(year, round, session_type)
    result = {}
    for drv in drivers:
        if lap == 'fastest':
            l = session.laps.pick_drivers(drv).pick_fastest()
        else:
            l = session.laps.pick_drivers(drv).pick_laps(int(lap))
        car = l.get_car_data().add_distance()
        result[drv] = car[['Distance', 'Speed', 'Throttle', 'Brake', 'nGear', 'RPM']].to_dict(orient='records')
    return result

def get_strategy(year, round):
    session = load_session(year, round, 'R')
    laps = session.laps[['Driver', 'LapNumber', 'Stint', 'Compound', 'TyreLife', 'PitInTime', 'PitOutTime']]
    return laps.dropna(subset=['Compound']).to_dict(orient='records')

def get_team_pace(year, round):
    session = load_session(year, round, 'R')
    laps = session.laps.pick_quicklaps()
    laps['LapTimeSec'] = laps['LapTime'].dt.total_seconds()
    team_pace = laps.groupby('Team')['LapTimeSec'].median().reset_index()
    team_pace.columns = ['team', 'median_lap_sec']
    team_pace = team_pace.sort_values('median_lap_sec')
    return team_pace.to_dict(orient='records')

def get_sectors(year, round, session_type):
    session = load_session(year, round, session_type)
    fastest_laps = session.laps.groupby('Driver').apply(lambda x: x.pick_fastest())
    result = fastest_laps[['Driver', 'Sector1Time', 'Sector2Time', 'Sector3Time', 'LapTime']].copy()
    for col in ['Sector1Time', 'Sector2Time', 'Sector3Time', 'LapTime']:
        result[col + 'Sec'] = result[col].dt.total_seconds()
    return result.dropna().to_dict(orient='records')

def get_positions(year, round):
    session = load_session(year, round, 'R')
    pos = session.laps[['Driver', 'LapNumber', 'Position']].dropna()
    return pos.to_dict(orient='records')
```

---

## 6. Project Folder Structure

The Dashboard is added *inside* the existing Replay project — not a separate repo.

```
f1-race-replay/                         ← existing repo from Replay PRD
├── backend/
│   ├── main.py                         ← EXTENDED: add /analytics/* routes
│   ├── data_loader.py                  ← EXTENDED: add load_session() helper
│   ├── analytics.py                    ← NEW: all dashboard data processing
│   ├── processor.py                    ← unchanged
│   ├── cache_manager.py                ← unchanged
│   ├── models.py                       ← EXTENDED: add analytics response models
│   ├── requirements.txt                ← add: recharts (frontend only, no backend change)
│   ├── Dockerfile                      ← unchanged
│   └── cache/
├── frontend/
│   ├── src/
│   │   ├── App.jsx                     ← EXTENDED: add React Router, /dashboard route
│   │   ├── pages/
│   │   │   ├── ReplayPage.jsx          ← NEW wrapper: existing Replay components
│   │   │   └── DashboardPage.jsx       ← NEW: dashboard layout
│   │   ├── components/
│   │   │   ├── RaceSelector.jsx        ← unchanged (reused as-is)
│   │   │   ├── ReplayCanvas.jsx        ← unchanged
│   │   │   ├── Leaderboard.jsx         ← unchanged
│   │   │   ├── PlaybackBar.jsx         ← unchanged
│   │   │   ├── StatusBanner.jsx        ← unchanged
│   │   │   ├── SessionPicker.jsx       ← NEW: extends RaceSelector + session type
│   │   │   ├── DriverSelector.jsx      ← NEW: multi-select checkboxes
│   │   │   ├── ViewTabs.jsx            ← NEW: tab navigation for 6 views
│   │   │   ├── WatchReplayButton.jsx   ← NEW: deep-link to /replay
│   │   │   └── charts/
│   │   │       ├── LapTimeScatter.jsx  ← NEW
│   │   │       ├── TelemetryOverlay.jsx ← NEW
│   │   │       ├── StrategyTimeline.jsx ← NEW
│   │   │       ├── TeamPaceBar.jsx      ← NEW
│   │   │       ├── SectorBreakdown.jsx  ← NEW
│   │   │       └── PositionChanges.jsx  ← NEW
│   │   ├── hooks/
│   │   │   ├── useReplayEngine.js      ← unchanged
│   │   │   ├── useRaceData.js          ← unchanged
│   │   │   └── useAnalytics.js         ← NEW: fetch hook for dashboard data
│   │   └── utils/
│   │       ├── interpolate.js          ← unchanged
│   │       ├── normalize.js            ← unchanged
│   │       ├── teamColors.js           ← unchanged (reused by charts)
│   │       └── formatTime.js           ← NEW: seconds → MM:SS.mmm
│   ├── index.html
│   ├── package.json                    ← add: react-router-dom, recharts
│   └── vite.config.js
├── docker-compose.yml                  ← unchanged
└── README.md                           ← EXTENDED: add dashboard section
```

---

## 7. Dashboard Views & Features

### View 1 — Lap Time Scatter

**What it shows**: Every lap time for every driver plotted as a scatter chart. X-axis = lap number, Y-axis = lap time in seconds. Each driver is a different color (from `teamColors.js`). Pit laps are shown as hollow circles. Personal bests are marked with a star.

**User interactions**:
- Toggle individual drivers on/off by clicking the legend
- Hover tooltip showing: Driver, Lap, Lap Time, Compound, Tyre Age
- Zoom into any lap range using scroll

**FastF1 data**: `session.laps[['Driver', 'LapNumber', 'LapTime', 'Compound', 'TyreLife', 'IsPersonalBest']]`

---

### View 2 — Telemetry Overlay

**What it shows**: Four synchronized line charts stacked vertically — Speed (km/h), Throttle (%), Brake (on/off), Gear — plotted against distance (meters) around the circuit. Up to 5 drivers overlaid with their team colors.

**User interactions**:
- Driver selector above the chart to choose which drivers to compare
- Lap picker: fastest lap (default), or choose a specific lap number
- Hover crosshair that highlights the same distance point across all 4 panels simultaneously

**FastF1 data**: `lap.get_car_data().add_distance()` → `Distance, Speed, Throttle, Brake, nGear, RPM`

---

### View 3 — Tyre Strategy Timeline

**What it shows**: A horizontal bar chart — one row per driver, X-axis is lap number. Each stint is a colored block: Red = Soft, Yellow = Medium, White = Hard, Green = Intermediate, Blue = Wet. Pit stops are shown as vertical gaps between stints.

**User interactions**:
- Hover tooltip: compound, laps on tyre, stint start/end lap
- Click a driver row to highlight their lap times in View 1 simultaneously (shared state)

**FastF1 data**: `session.laps[['Driver', 'LapNumber', 'Stint', 'Compound', 'TyreLife']]`

---

### View 4 — Team Pace Comparison

**What it shows**: A horizontal bar chart of median representative lap time per team, sorted fastest to slowest. Uses only `pick_quicklaps()` (removes outliers, safety car laps, in/out laps).

**User interactions**:
- Hover tooltip: team name, median lap time, number of laps sampled
- Toggle between Race pace and Qualifying best (session picker)

**FastF1 data**: `session.laps.pick_quicklaps()` grouped by `Team`, median of `LapTime`

---

### View 5 — Sector Analysis

**What it shows**: A stacked bar chart — one bar per driver, divided into S1 / S2 / S3 times. Total bar height = lap time. Colored by sector (not by team) to immediately show where each driver is fast or slow.

**User interactions**:
- Sort by: total lap time (default), S1, S2, or S3
- Hover tooltip: driver, sector time, delta to sector leader (e.g. `+0.142s vs VER`)

**FastF1 data**: `session.laps.groupby('Driver').pick_fastest()` → `Sector1Time, Sector2Time, Sector3Time`

---

### View 6 — Position Changes

**What it shows**: A multi-line chart with lap number on X-axis and race position on Y-axis (inverted — P1 at top). Each driver is a colored line. Pit stops are shown as dots on the line.

**User interactions**:
- Toggle individual drivers on/off
- Hover tooltip: driver, lap, position, gap to leader
- Click any point to see detailed lap info in a side panel

**FastF1 data**: `session.laps[['Driver', 'LapNumber', 'Position']]`

---

### Watch Replay Button

On Race sessions, a persistent button in the top-right corner reads **"▶ Watch Race Replay"**. Clicking it navigates to `/replay?year={year}&round={round}` — deep-linking into the Race Replay Visualizer with the same race pre-selected.

This is the primary integration point between the two projects.

---

## 8. Data Pipeline & FastF1 Integration

### 8.1 Shared Session Loader

The `load_session()` helper in `data_loader.py` is the single entry point for both projects:

```python
# backend/data_loader.py  — EXTENDED
import fastf1
from cache_manager import session_cache

fastf1.Cache.enable_cache('cache/')

def load_session(year: int, round: int, session_type: str):
    """
    Shared session loader used by BOTH the Replay and Dashboard routes.
    Returns a fully loaded FastF1 Session object, cached by (year, round, type).
    """
    key = f"{year}_{round}_{session_type}"
    if key in session_cache:
        return session_cache[key]

    session = fastf1.get_session(year, round, session_type)
    session.load(telemetry=True, weather=False, messages=False)
    session_cache[key] = session
    return session
```

### 8.2 FastF1 Calls by View

| Dashboard View | FastF1 Call | Key Columns |
|---|---|---|
| Lap Time Scatter | `session.laps` | `Driver, LapNumber, LapTime, Compound, TyreLife, IsPersonalBest` |
| Telemetry Overlay | `lap.get_car_data().add_distance()` | `Distance, Speed, Throttle, Brake, nGear, RPM` |
| Strategy Timeline | `session.laps` | `Driver, LapNumber, Stint, Compound, TyreLife, PitInTime` |
| Team Pace | `session.laps.pick_quicklaps()` | `Team, LapTime` |
| Sector Analysis | `session.laps.pick_fastest()` per driver | `Sector1Time, Sector2Time, Sector3Time` |
| Position Changes | `session.laps` | `Driver, LapNumber, Position` |

### 8.3 Data Freshness

All data is historical (races already run). Sessions older than 2 hours after race end are considered final. The FastF1 disk cache means:
- **First call per session**: 15–30 seconds (API fetch + processing)
- **Subsequent calls**: < 1 second (disk cache hit)
- **Same server process**: < 50ms (in-memory LRU cache hit)

---

## 9. Backend API Specification

### 9.1 New Dashboard Endpoints (added to existing `main.py`)

| Method | Endpoint | Query Params | Description |
|---|---|---|---|
| `GET` | `/analytics/lap-times/{year}/{round}/{session}` | — | All lap times for all drivers |
| `GET` | `/analytics/telemetry/{year}/{round}/{session}` | `drivers` (comma-sep), `lap` (number or `fastest`) | Car telemetry for selected drivers |
| `GET` | `/analytics/strategy/{year}/{round}` | — | Tyre compound and stint data for full race |
| `GET` | `/analytics/team-pace/{year}/{round}` | — | Median representative pace per team |
| `GET` | `/analytics/sectors/{year}/{round}/{session}` | — | Sector times on fastest lap per driver |
| `GET` | `/analytics/positions/{year}/{round}` | — | Race position per driver per lap |

Session type values: `R` (Race), `Q` (Qualifying), `S` (Sprint)

### 9.2 Example Responses

**`GET /analytics/lap-times/2023/8/R`**
```json
[
  {
    "Driver": "VER",
    "LapNumber": 1,
    "LapTimeSec": 80.412,
    "Compound": "SOFT",
    "TyreLife": 1,
    "IsPersonalBest": false
  },
  ...
]
```

**`GET /analytics/telemetry/2023/8/Q?drivers=VER,LEC&lap=fastest`**
```json
{
  "VER": [
    { "Distance": 0.0, "Speed": 0, "Throttle": 0, "Brake": false, "nGear": 1, "RPM": 8500 },
    { "Distance": 5.2, "Speed": 42, "Throttle": 78, "Brake": false, "nGear": 2, "RPM": 9800 },
    ...
  ],
  "LEC": [ ... ]
}
```

**`GET /analytics/team-pace/2023/8`**
```json
[
  { "team": "Red Bull Racing", "median_lap_sec": 78.241 },
  { "team": "Ferrari",         "median_lap_sec": 78.619 },
  { "team": "Mercedes",        "median_lap_sec": 79.021 },
  ...
]
```

### 9.3 Route Addition to main.py

```python
# backend/main.py  — EXTENDED
from analytics import (
    get_lap_times, get_telemetry, get_strategy,
    get_team_pace, get_sectors, get_positions
)

@app.get("/analytics/lap-times/{year}/{round}/{session}")
def lap_times(year: int, round: int, session: str):
    return get_lap_times(year, round, session)

@app.get("/analytics/telemetry/{year}/{round}/{session}")
def telemetry(year: int, round: int, session: str, drivers: str = "VER", lap: str = "fastest"):
    driver_list = [d.strip() for d in drivers.split(",")]
    return get_telemetry(year, round, session, driver_list, lap)

@app.get("/analytics/strategy/{year}/{round}")
def strategy(year: int, round: int):
    return get_strategy(year, round)

@app.get("/analytics/team-pace/{year}/{round}")
def team_pace(year: int, round: int):
    return get_team_pace(year, round)

@app.get("/analytics/sectors/{year}/{round}/{session}")
def sectors(year: int, round: int, session: str):
    return get_sectors(year, round, session)

@app.get("/analytics/positions/{year}/{round}")
def positions(year: int, round: int):
    return get_positions(year, round)
```

---

## 10. Frontend Architecture

### 10.1 New Dependencies

Add to `frontend/package.json`:

```json
{
  "dependencies": {
    "recharts": "^2.12.0",
    "react-router-dom": "^6.23.0"
  }
}
```

`recharts` is chosen because:
- Built natively for React (no imperative DOM manipulation)
- Declarative SVG charts — easy to theme with team colors
- Built-in responsiveness via `ResponsiveContainer`
- Supports all chart types needed: `ScatterChart`, `LineChart`, `BarChart`, `ComposedChart`

### 10.2 App.jsx — React Router Setup

```jsx
// frontend/src/App.jsx  — EXTENDED
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import ReplayPage from './pages/ReplayPage';
import DashboardPage from './pages/DashboardPage';

export default function App() {
  return (
    <BrowserRouter>
      <nav className="flex gap-4 p-4 bg-[#15151E] border-b border-[#E8002D]">
        <NavLink to="/replay"    className="text-white font-bold">🏎️ Race Replay</NavLink>
        <NavLink to="/dashboard" className="text-white font-bold">📊 Analytics</NavLink>
      </nav>
      <Routes>
        <Route path="/replay"    element={<ReplayPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/"          element={<DashboardPage />} />
      </Routes>
    </BrowserRouter>
  );
}
```

### 10.3 useAnalytics.js — Data Fetch Hook

```javascript
// frontend/src/hooks/useAnalytics.js
import useSWR from 'swr';

const fetcher = (url) => fetch(url).then(r => r.json());
const BASE = import.meta.env.VITE_API_URL ?? '';

export function useLapTimes(year, round, session) {
  return useSWR(
    year && round && session ? `${BASE}/analytics/lap-times/${year}/${round}/${session}` : null,
    fetcher
  );
}

export function useTelemetry(year, round, session, drivers, lap = 'fastest') {
  const driverStr = drivers.join(',');
  return useSWR(
    year && round && drivers.length ? `${BASE}/analytics/telemetry/${year}/${round}/${session}?drivers=${driverStr}&lap=${lap}` : null,
    fetcher
  );
}

export function useStrategy(year, round) {
  return useSWR(year && round ? `${BASE}/analytics/strategy/${year}/${round}` : null, fetcher);
}

export function useTeamPace(year, round) {
  return useSWR(year && round ? `${BASE}/analytics/team-pace/${year}/${round}` : null, fetcher);
}

export function useSectors(year, round, session) {
  return useSWR(year && round && session ? `${BASE}/analytics/sectors/${year}/${round}/${session}` : null, fetcher);
}

export function usePositions(year, round) {
  return useSWR(year && round ? `${BASE}/analytics/positions/${year}/${round}` : null, fetcher);
}
```

### 10.4 Sample Chart — LapTimeScatter.jsx

```jsx
// frontend/src/components/charts/LapTimeScatter.jsx
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
         Legend, ResponsiveContainer } from 'recharts';
import { useLapTimes } from '../../hooks/useAnalytics';
import { TEAM_COLORS } from '../../utils/teamColors';

export default function LapTimeScatter({ year, round, session, selectedDrivers }) {
  const { data, error, isLoading } = useLapTimes(year, round, session);

  if (isLoading) return <div className="skeleton-chart" />;
  if (error)     return <div className="text-red-500">Failed to load lap times</div>;

  // Group laps by driver
  const byDriver = {};
  data.forEach(lap => {
    if (!byDriver[lap.Driver]) byDriver[lap.Driver] = [];
    byDriver[lap.Driver].push(lap);
  });

  const drivers = selectedDrivers.length ? selectedDrivers : Object.keys(byDriver);

  return (
    <ResponsiveContainer width="100%" height={400}>
      <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
        <XAxis dataKey="LapNumber" name="Lap" type="number" label={{ value: 'Lap', position: 'insideBottom' }} />
        <YAxis dataKey="LapTimeSec" name="Lap Time (s)" domain={['auto', 'auto']} />
        <Tooltip
          content={({ payload }) => {
            if (!payload?.length) return null;
            const d = payload[0].payload;
            return (
              <div className="bg-[#1E1E2E] p-2 rounded text-xs text-white border border-gray-700">
                <p>{d.Driver} — Lap {d.LapNumber}</p>
                <p>Time: {d.LapTimeSec?.toFixed(3)}s</p>
                <p>Tyre: {d.Compound} ({d.TyreLife} laps)</p>
              </div>
            );
          }}
        />
        <Legend />
        {drivers.map(drv => (
          <Scatter
            key={drv}
            name={drv}
            data={byDriver[drv]}
            fill={`#${TEAM_COLORS[drv] ?? 'AAAAAA'}`}
            opacity={0.8}
          />
        ))}
      </ScatterChart>
    </ResponsiveContainer>
  );
}
```

### 10.5 WatchReplayButton.jsx — The Integration Link

```jsx
// frontend/src/components/WatchReplayButton.jsx
import { useNavigate } from 'react-router-dom';

export default function WatchReplayButton({ year, round, sessionType }) {
  const navigate = useNavigate();
  if (sessionType !== 'R') return null;  // Only show for Race sessions

  return (
    <button
      onClick={() => navigate(`/replay?year=${year}&round=${round}`)}
      className="fixed top-4 right-4 bg-[#E8002D] text-white px-4 py-2 rounded font-bold
                 hover:bg-red-700 transition flex items-center gap-2 shadow-lg z-50"
    >
      ▶ Watch Race Replay
    </button>
  );
}
```

---

## 11. Phased Implementation Plan

> **Prerequisite**: Complete Weeks 1–3 of the Race Replay PRD first. The backend, caching layer, and `data_loader.py` must exist before this plan begins.

| Phase | Name | Deliverables | Timeline |
|---|---|---|---|
| **7** | Backend Analytics | Write `analytics.py`, extend `main.py` with 6 new routes, extend `models.py`, test all endpoints via Swagger at `/docs` | Days 22–24 |
| **8** | React Router + Layout | Add `react-router-dom`, create `ReplayPage.jsx` wrapper, `DashboardPage.jsx` shell, `ViewTabs.jsx`, nav bar | Days 25–26 |
| **9** | Session + Driver Selectors | `SessionPicker.jsx` (extends `RaceSelector` with session type toggle), `DriverSelector.jsx` (multi-select with team colors) | Days 27–28 |
| **10** | Charts — Batch 1 | `LapTimeScatter.jsx`, `PositionChanges.jsx`, `TeamPaceBar.jsx` — 3 simpler Recharts views | Days 29–31 |
| **11** | Charts — Batch 2 | `StrategyTimeline.jsx`, `SectorBreakdown.jsx`, `TelemetryOverlay.jsx` — 3 complex views | Days 32–35 |
| **12** | Integration & Polish | `WatchReplayButton.jsx`, loading skeletons, error states, mobile layout (768px+), end-to-end test all 6 views | Days 36–38 |
| **13** | Unified Deploy | Update Dockerfile, `docker-compose.yml`, Cloud Run re-deploy with both apps at `/replay` and `/dashboard`, update README | Days 39–42 |

**Total timeline: 6 weeks** (3 weeks Replay + 3 weeks Dashboard)

---

## 12. Component Specifications

### 12.1 SessionPicker.jsx

Extends `RaceSelector.jsx` with one additional control. Reuses the year + round dropdowns from the Replay PRD, adds a session type toggle.

| Prop | Type | Description |
|---|---|---|
| `onSelect` | `(year, round, sessionType) => void` | Called when any selection changes |
| `defaultSession` | `'R' \| 'Q' \| 'S'` | Default session type (default: `'R'`) |

Renders three controls in a row:
1. **Year** — dropdown 2018–2025 (same as Replay's `RaceSelector`)
2. **Round** — dropdown populated from `/schedule/{year}` (same API call)
3. **Session** — segmented button: `Race | Qualifying | Sprint`

### 12.2 DriverSelector.jsx

| Prop | Type | Description |
|---|---|---|
| `drivers` | `string[]` | All driver abbreviations for the session |
| `selected` | `string[]` | Currently selected drivers (max 5) |
| `onChange` | `(selected: string[]) => void` | Fires on toggle |

Renders each driver as a pill button colored by their team color. Clicking selects/deselects. Maxes out at 5 selected with a visual warning.

### 12.3 ViewTabs.jsx

Six tab buttons in a horizontal row. Active tab is highlighted red. Each tab maps to one chart component. Lazy-loaded: only fetches data when a tab is first activated.

| Tab Label | Chart Component | Session Types |
|---|---|---|
| Lap Times | `LapTimeScatter` | R, Q, S |
| Telemetry | `TelemetryOverlay` | R, Q, S |
| Strategy | `StrategyTimeline` | R only |
| Team Pace | `TeamPaceBar` | R only |
| Sectors | `SectorBreakdown` | R, Q, S |
| Positions | `PositionChanges` | R only |

Tabs disabled with a tooltip if the selected session type doesn't support them.

### 12.4 TelemetryOverlay.jsx

Most complex chart component. Four `LineChart` panels stacked vertically in a `div`, all sharing a synchronized hover crosshair via a shared `activeIndex` state in the parent.

| Panel | Y-Axis | Color |
|---|---|---|
| Speed | 0–380 km/h | Team color per driver |
| Throttle | 0–100 % | Team color per driver |
| Brake | Boolean (0 or 1) | Red |
| Gear | 1–8 | Team color per driver |

---

## 13. Environment & Dependencies

### 13.1 Backend — No New Dependencies

The dashboard routes use only packages already in `requirements.txt` from the Replay PRD. No additions needed.

### 13.2 Frontend — Additions Only

```diff
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "swr": "^2.2.0",
+   "recharts": "^2.12.0",
+   "react-router-dom": "^6.23.0"
  }
```

### 13.3 New Utility: formatTime.js

```javascript
// frontend/src/utils/formatTime.js
export function secToLapTime(totalSec) {
  if (!totalSec) return '--:--.---';
  const mins = Math.floor(totalSec / 60);
  const secs = (totalSec % 60).toFixed(3).padStart(6, '0');
  return `${mins}:${secs}`;
}

export function secToDelta(deltaSec) {
  const sign = deltaSec >= 0 ? '+' : '-';
  return `${sign}${Math.abs(deltaSec).toFixed(3)}s`;
}
```

---

## 14. Unified Deployment

Both projects deploy as a **single Cloud Run service**. No separate URLs, no CORS complications.

### 14.1 Final Dockerfile (unchanged from Replay PRD)

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ ./backend/
COPY frontend/dist/ ./static/
EXPOSE 8080
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8080"]
```

### 14.2 Build & Deploy Script

```bash
# Build frontend (includes both Replay and Dashboard)
cd frontend && npm run build && cd ..

# Rebuild and push image
docker build -t gcr.io/YOUR_PROJECT/f1-platform .
docker push gcr.io/YOUR_PROJECT/f1-platform

# Deploy (same Cloud Run service, just updated image)
gcloud run deploy f1-platform \
  --image gcr.io/YOUR_PROJECT/f1-platform \
  --memory 2Gi --cpu 2 --min-instances 1

# Result:
# https://f1-platform-xxxx.run.app/          → Dashboard (default)
# https://f1-platform-xxxx.run.app/replay    → Race Replay Visualizer
# https://f1-platform-xxxx.run.app/dashboard → Analytics Dashboard
# https://f1-platform-xxxx.run.app/docs      → FastAPI Swagger UI
```

### 14.3 Environment Variables

```bash
# frontend/.env
VITE_API_URL=https://f1-platform-xxxx.run.app

# backend — no new env vars needed
```

---

## 15. Risks & Mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| Telemetry data size — `get_car_data()` returns thousands of rows per driver | 🟡 Medium | Downsample to every 10th point (10Hz → 1Hz) for API response; full resolution only on demand |
| Race sessions missing sector times for some drivers (DNF) | 🟡 Medium | Drop null rows before serialization; show "No Data" placeholder in chart |
| Multiple simultaneous tab switches triggering redundant FastF1 loads | 🟡 Medium | SWR deduplicates identical requests automatically; in-memory LRU handles the rest |
| Recharts performance with 20 drivers × 70 laps (1,400 data points) | 🟢 Low | Scatter chart handles this easily; aggregate before rendering for team pace view |
| Session types vary by year (Sprint format changed) | 🟡 Medium | FastF1 handles this; show "Not available" for sessions that don't exist for a given round |
| Deep-link `/replay?year=X&round=Y` requires Replay to read URL params | 🟢 Low | Add `useSearchParams()` to `ReplayPage.jsx`; 30-minute fix |

---

## 16. Future Roadmap

### Phase A — Cross-Race Comparison (post both MVPs)
- Select the same circuit across different years and overlay lap time distributions
- "How did the 2021 Monaco race pace compare to 2023?"

### Phase B — Weather Overlay
- Overlay weather data (track temp, air temp, rainfall flag) on the lap time scatter
- Explain performance changes due to track conditions

### Phase C — AI Race Summary
- After loading any session, send structured data (positions, gaps, pit windows, sector times, SC events) to the Claude API
- Render a natural-language analytical summary below the charts
- Example: *"Leclerc's S2 deficit of 0.3s per lap relative to Verstappen proved decisive — he could not defend against the undercut."*
- This phase connects directly to the **Phase 5 AI Race Analyst** described in the Race Replay PRD. Both projects converge on the same LLM integration.

### Phase D — Unified F1 Platform
- Single landing page with cards for: Race Replay, Analytics Dashboard, AI Analyst
- Shared user session (no login, just localStorage preferences: default year, favorite team)
- Single domain, single Cloud Run service, single repo

---

## Appendix A — Summary of Changes to Race Replay PRD Files

| File | Change Type | What Changes |
|---|---|---|
| `backend/main.py` | Extended | 6 new route functions added |
| `backend/data_loader.py` | Extended | `load_session()` helper extracted and exported |
| `backend/analytics.py` | **New file** | All 6 analytics processing functions |
| `backend/models.py` | Extended | 6 new Pydantic response models |
| `frontend/src/App.jsx` | Extended | React Router added, 2 routes defined |
| `frontend/src/pages/ReplayPage.jsx` | **New file** | Thin wrapper around existing Replay components |
| `frontend/src/pages/DashboardPage.jsx` | **New file** | Dashboard layout orchestrator |
| `frontend/package.json` | Extended | `recharts` and `react-router-dom` added |
| `README.md` | Extended | Dashboard section added |
| `Dockerfile` | Unchanged | No changes needed |
| `docker-compose.yml` | Unchanged | No changes needed |

---

## Appendix B — Quick Start (Dashboard Only, assuming Replay is already running)

```bash
# Backend already running from Replay PRD?
# Just add analytics.py and restart:
cp analytics.py backend/
uvicorn backend.main:app --reload --port 8000

# Test the new endpoints:
curl http://localhost:8000/analytics/team-pace/2023/8
curl "http://localhost:8000/analytics/telemetry/2023/8/Q?drivers=VER,LEC&lap=fastest"

# Frontend — add recharts and router, then run:
cd frontend
npm install recharts react-router-dom
npm run dev

# Navigate to:
# http://localhost:5173/dashboard   → Analytics Dashboard
# http://localhost:5173/replay      → Race Replay Visualizer
```

---

*FastF1 and this project are unofficial and not associated with Formula One Licensing B.V. F1, FORMULA ONE, FORMULA 1, FIA FORMULA ONE WORLD CHAMPIONSHIP, GRAND PRIX and related marks are trademarks of Formula One Licensing B.V.*
