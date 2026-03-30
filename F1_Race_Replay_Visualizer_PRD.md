# 🏎️ F1 Race Replay Visualizer
### Product Requirements & Full Architecture Document

| Field | Value |
|---|---|
| **Version** | 1.0.0 |
| **Author** | Anirudh (SudoAnirudh) |
| **Date** | March 2026 |
| **Stack** | FastF1 + FastAPI + React Canvas |
| **Status** | Draft — Ready for Implementation |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Goals & Success Metrics](#2-product-goals--success-metrics)
3. [Scope](#3-scope)
4. [User Personas](#4-user-personas)
5. [Full System Architecture](#5-full-system-architecture)
6. [Project Folder Structure](#6-project-folder-structure)
7. [Data Pipeline & FastF1 Integration](#7-data-pipeline--fastf1-integration)
8. [Backend API Specification](#8-backend-api-specification)
9. [Frontend Architecture & Canvas Engine](#9-frontend-architecture--canvas-engine)
10. [Phased Implementation Plan](#10-phased-implementation-plan)
11. [Component Specifications](#11-component-specifications)
12. [Environment & Dependencies](#12-environment--dependencies)
13. [Deployment Architecture](#13-deployment-architecture)
14. [Risks & Mitigations](#14-risks--mitigations)
15. [Future Roadmap](#15-future-roadmap)

---

## 1. Executive Summary

F1 Race Replay Visualizer is a full-stack web application that animates real Formula 1 race data — sourced from the FastF1 Python library — onto an interactive top-down circuit map. Users can replay any race from 2018 to present, watching all 20 cars move with team colors, driver labels, pit stop indicators, and safety car alerts.

| The Problem | The Solution |
|---|---|
| F1 race replays are locked behind broadcaster apps or require massive video files. There is no lightweight, data-driven, open-source way to replay a race programmatically. | A web app that streams structured position telemetry from FastF1, renders it on an HTML5 Canvas at adjustable playback speeds, with a Python/FastAPI backend handling all data acquisition and preprocessing. |

---

## 2. Product Goals & Success Metrics

### 2.1 Primary Goals

- Animate all 20 car positions across a full race on a 2D circuit outline
- Support variable playback speed (0.5x, 1x, 2x, 5x, 10x)
- Show real-time leaderboard, gap-to-leader, and tyre compound per driver
- Highlight safety car periods, pit stops, and race incidents visually
- Allow the user to select any race from 2018–2025 via a simple dropdown UI

### 2.2 Success Metrics

| Metric | Target | Measurement |
|---|---|---|
| Initial data load time | < 5 seconds (cached) | Stopwatch on cached FastF1 data |
| Frame render rate | 60 FPS on 1x speed | requestAnimationFrame timing |
| Position accuracy | < 0.5s interpolation lag | Compare to telemetry timestamps |
| Races available | 2018–2025 (all rounds) | FastF1 session load success rate |
| Browser support | Chrome, Firefox, Safari, Edge | Manual QA |

---

## 3. Scope

### 3.1 In Scope (MVP)

- Race session replay only (not Qualifying or Practice)
- FastF1 position data: X, Y coordinates per driver per timestamp
- Track outline rendered from fastest lap telemetry coordinates
- Driver dots colored by team color, labeled by 3-letter code
- Playback controls: Play, Pause, Speed selector, Lap scrubber
- Live leaderboard panel sorted by race position
- Pit stop visual flash when a driver pits
- Safety Car / Virtual Safety Car banner from `track_status` data
- FastAPI backend with in-memory caching per session
- Dockerized deployment to Cloud Run

### 3.2 Out of Scope (Future Phases)

- Live timing during an active race weekend
- 3D track rendering or elevation data
- Audio commentary or video overlay
- Mobile-native app (iOS/Android)
- User accounts, saved replays, or social sharing

---

## 4. User Personas

| Persona | Who They Are | What They Need |
|---|---|---|
| **The F1 Fan** | Watches every race, wants to re-analyze battles and strategy | Easy race picker, smooth animation, recognizable team colors |
| **The Data Analyst** | Data science student or ML engineer exploring F1 telemetry | Accurate position data, ability to pause and inspect timestamps |
| **The Developer** | Engineer evaluating FastF1 integration patterns | Clean API, documented endpoints, runnable locally |

---

## 5. Full System Architecture

The system follows a three-tier architecture: a React/HTML5 Canvas frontend, a FastAPI Python backend, and the FastF1 library acting as the data source layer backed by a persistent file cache.

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND  (Browser)                       │
│                                                             │
│   React App (Vite)                                          │
│   ├── RaceSelector.jsx    (year + round picker)             │
│   ├── ReplayCanvas.jsx    (HTML5 Canvas engine)             │
│   │   ├── drawTrack()     (static circuit outline)          │
│   │   ├── drawCars()      (animated driver dots)            │
│   │   └── interpolate()   (smooth position tweening)        │
│   ├── Leaderboard.jsx     (live race order panel)           │
│   ├── PlaybackBar.jsx     (controls + lap scrubber)         │
│   └── StatusBanner.jsx    (SC / VSC / DNF alerts)           │
└──────────────────────┬──────────────────────────────────────┘
                       │  HTTP / REST (JSON)
                       │  GET /replay/{year}/{round}
                       │  GET /schedule/{year}
┌──────────────────────▼──────────────────────────────────────┐
│                 BACKEND  (FastAPI + Python)                  │
│                                                             │
│   main.py          — API routes + CORS                      │
│   data_loader.py   — FastF1 session loading & extraction    │
│   processor.py     — data normalization + export            │
│   cache_manager.py — in-memory LRU + FastF1 disk cache      │
│   models.py        — Pydantic response models               │
└──────────────────────┬──────────────────────────────────────┘
                       │  Python library calls
┌──────────────────────▼──────────────────────────────────────┐
│               DATA LAYER  (FastF1 + Jolpica)                │
│                                                             │
│   fastf1.get_session()    — session loader                  │
│   session.load()          — telemetry + laps                │
│   laps.get_pos_data()     — X, Y, Time per driver           │
│   session.track_status    — SC / red flag data              │
│   session.laps            — pit stops, tyre compounds       │
│   fastf1.Cache            — disk cache (./cache/)           │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Project Folder Structure

```
f1-race-replay/
├── backend/
│   ├── main.py              # FastAPI app, routes, CORS
│   ├── data_loader.py       # FastF1 session loading & position extraction
│   ├── processor.py         # Coordinate normalization, interpolation prep
│   ├── cache_manager.py     # LRU in-memory cache + FastF1 disk cache
│   ├── models.py            # Pydantic response models
│   ├── requirements.txt
│   ├── Dockerfile
│   └── cache/               # FastF1 disk cache (gitignored)
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── RaceSelector.jsx
│   │   │   ├── ReplayCanvas.jsx
│   │   │   ├── Leaderboard.jsx
│   │   │   ├── PlaybackBar.jsx
│   │   │   └── StatusBanner.jsx
│   │   ├── hooks/
│   │   │   ├── useReplayEngine.js   # Core animation loop
│   │   │   └── useRaceData.js       # API fetch + state
│   │   └── utils/
│   │       ├── interpolate.js       # Linear position interpolation
│   │       ├── normalize.js         # Scale XY to canvas viewport
│   │       └── teamColors.js        # Fallback team color map
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── docker-compose.yml
└── README.md
```

---

## 7. Data Pipeline & FastF1 Integration

### 7.1 Key FastF1 Data Sources

| FastF1 Call | Data Returned | Used For |
|---|---|---|
| `get_session(year, round, 'R')` | Session object | Root for all data access |
| `session.load(telemetry=True)` | Loads telemetry into memory | Must be called before any data access |
| `laps.get_pos_data()` | X, Y, Z, Time, Status | Car position animation |
| `laps.pick_fastest().get_pos_data()` | X, Y coordinates | Draw track outline |
| `session.get_driver(num)` | LastName, TeamName, TeamColor | Driver labels and dot colors |
| `session.track_status` | Status, Message, Time | SC / VSC / Red Flag banners |
| `session.laps` | PitInTime, PitOutTime, Compound | Pit flash, tyre icons |
| `get_event_schedule(year)` | RoundNumber, EventName, Country | Race picker dropdown |

### 7.2 Position Data Flow

The pipeline converts raw FastF1 telemetry into a JSON structure optimized for the frontend animation engine:

1. **Load session** with `telemetry=True` — FastF1 fetches from its API and populates disk cache
2. **Collect position data** per driver via `get_pos_data()` — returns a DataFrame with X, Y, Time columns
3. **Normalize timestamps** to seconds-from-session-start for easy frontend scrubbing
4. **Downsample** to ~10Hz (every ~100ms sample) — sufficient for smooth 60fps animation via interpolation
5. **Normalize XY coordinates** to a `[0, 1]` unit square so the frontend scales to any canvas size
6. **Serialize** as compact JSON and compress with gzip for the API response

### 7.3 JSON API Response Schema

```json
{
  "race_name": "Monaco Grand Prix",
  "year": 2023,
  "duration_seconds": 5820.4,
  "track": [
    { "x": 0.42, "y": 0.71 },
    ...
  ],
  "track_status": [
    { "time": 312.5, "status": "4", "message": "SAFETY CAR" },
    { "time": 480.0, "status": "1", "message": "ALL CLEAR" }
  ],
  "drivers": {
    "1": {
      "code": "VER",
      "name": "Verstappen",
      "team": "Red Bull Racing",
      "color": "3671C6",
      "positions": [
        { "t": 0.0,  "x": 0.42, "y": 0.71 },
        { "t": 0.1,  "x": 0.43, "y": 0.72 },
        ...
      ],
      "pit_windows": [
        { "in_time": 1240.2, "out_time": 1268.7, "compound": "MEDIUM" }
      ]
    },
    "16": { ... }
  }
}
```

### 7.4 data_loader.py

```python
import fastf1
import pandas as pd

fastf1.Cache.enable_cache('cache/')

def get_race_replay_data(year: int, race: int) -> dict:
    session = fastf1.get_session(year, race, 'R')
    session.load(telemetry=True, weather=False, messages=False)

    drivers = session.drivers
    driver_data = {}

    for drv in drivers:
        laps = session.laps.pick_drivers(drv)
        tel = laps.get_pos_data()
        info = session.get_driver(drv)

        driver_data[drv] = {
            "code": info['Abbreviation'],
            "name": info['LastName'],
            "team": info['TeamName'],
            "color": info['TeamColor'],
            "positions": tel[['Time', 'X', 'Y']]
                           .dropna()
                           .to_dict(orient='records'),
            "pit_windows": get_pit_windows(laps)
        }

    ref_lap = session.laps.pick_fastest()
    track_pos = ref_lap.get_pos_data()[['X', 'Y']].dropna()

    return {
        "race_name": session.event['EventName'],
        "year": year,
        "duration_seconds": session.laps['LapStartTime'].max().total_seconds(),
        "track": track_pos.to_dict(orient='records'),
        "track_status": session.track_status.to_dict(orient='records'),
        "drivers": driver_data
    }

def get_pit_windows(laps) -> list:
    pits = laps[laps['PitInTime'].notna()]
    return [
        {
            "in_time": row['PitInTime'].total_seconds(),
            "out_time": row['PitOutTime'].total_seconds() if pd.notna(row['PitOutTime']) else None,
            "compound": row['Compound']
        }
        for _, row in pits.iterrows()
    ]
```

---

## 8. Backend API Specification

### 8.1 Endpoints

| Method | Endpoint | Response | Description |
|---|---|---|---|
| `GET` | `/schedule/{year}` | JSON array | List all race rounds for a given year |
| `GET` | `/replay/{year}/{round}` | JSON (gzipped) | Full replay data for a specific race |
| `GET` | `/status/{year}/{round}` | JSON | Track status events for SC/VSC/flags |
| `GET` | `/health` | `{ ok: true }` | Docker health check |

### 8.2 main.py

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from data_loader import get_race_replay_data
from cache_manager import lru_cache
import fastf1

app = FastAPI(title="F1 Race Replay API")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"])
app.add_middleware(GZipMiddleware, minimum_size=1000)

@app.get("/schedule/{year}")
def schedule(year: int):
    events = fastf1.get_event_schedule(year)
    return events[['RoundNumber', 'EventName', 'Country']].to_dict(orient='records')

@app.get("/replay/{year}/{round}")
def replay(year: int, round: int):
    cache_key = f"{year}_{round}"
    if cache_key in lru_cache:
        return lru_cache[cache_key]
    data = get_race_replay_data(year, round)
    lru_cache[cache_key] = data
    return data

@app.get("/health")
def health():
    return {"ok": True}

# Serve built frontend
app.mount("/", StaticFiles(directory="static", html=True), name="static")
```

### 8.3 Caching Strategy

Two caching layers are used to handle FastF1's slow cold-load times (5–30 seconds):

- **FastF1 disk cache** — Persists raw API responses to `./cache/`. Survives restarts. Keyed by session identity.
- **In-memory LRU cache** — Stores processed JSON response per `(year, round)` key. Instant repeat access within the same server process. Max 10 entries.
- **Cache-Control headers** — `Cache-Control: public, max-age=86400` — browsers and CDN edges cache for 24 hours.

---

## 9. Frontend Architecture & Canvas Engine

### 9.1 Technology Choices

| Layer | Technology | Reason |
|---|---|---|
| UI Framework | React + Vite | Component model; fast dev builds |
| Rendering | HTML5 Canvas 2D | 60 FPS capable; direct pixel control; no DOM overhead per car |
| Styling | Tailwind CSS | Rapid layout composition; dark theme utilities |
| State | React useState + useRef | Playback time in a ref — no re-render on every frame |
| Data Fetching | fetch() + SWR | Stale-while-revalidate; built-in loading states |

### 9.2 Animation Engine — useReplayEngine.js

The core loop runs inside `requestAnimationFrame`. React state is **never** updated per frame — the canvas is redrawn directly.

```javascript
// useReplayEngine.js
import { useRef, useEffect } from 'react';
import { interpolate } from '../utils/interpolate';

export function useReplayEngine(canvasRef, data, playing, speed, onTimeUpdate) {
  const timeRef = useRef(0);
  const prevMsRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    // Normalize track coordinates to canvas viewport
    const viewport = buildViewport(data.track, W, H);

    function tick(wallMs) {
      if (prevMsRef.current !== null) {
        const delta = ((wallMs - prevMsRef.current) / 1000) * speed;
        timeRef.current = Math.min(timeRef.current + delta, data.duration_seconds);
      }
      prevMsRef.current = wallMs;

      // 1. Clear
      ctx.clearRect(0, 0, W, H);

      // 2. Draw static track outline
      drawTrack(ctx, data.track, viewport);

      // 3. Interpolate + draw each car
      for (const [num, drv] of Object.entries(data.drivers)) {
        const pos = interpolate(drv.positions, timeRef.current);
        if (pos) drawCar(ctx, pos, drv, viewport, timeRef.current);
      }

      // 4. Notify parent (leaderboard, scrubber) every second
      onTimeUpdate(timeRef.current);

      if (playing) rafRef.current = requestAnimationFrame(tick);
    }

    if (playing) rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, speed, data]);
}

function drawTrack(ctx, track, vp) {
  ctx.beginPath();
  ctx.strokeStyle = '#2a2a2a';
  ctx.lineWidth = 10;
  track.forEach((pt, i) => {
    const [x, y] = toCanvas(pt.x, pt.y, vp);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.stroke();
}

function drawCar(ctx, pos, drv, vp, currentTime) {
  const [x, y] = toCanvas(pos.x, pos.y, vp);
  const isPitting = drv.pit_windows.some(
    pw => currentTime >= pw.in_time && currentTime <= (pw.out_time ?? pw.in_time + 30)
  );

  // Car dot
  ctx.beginPath();
  ctx.fillStyle = isPitting ? '#FFFFFF' : `#${drv.color}`;
  ctx.shadowColor = `#${drv.color}`;
  ctx.shadowBlur = isPitting ? 0 : 8;
  ctx.arc(x, y, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Driver label
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 9px monospace';
  ctx.fillText(drv.code, x + 9, y + 4);
}
```

### 9.3 Position Interpolation — interpolate.js

Raw FastF1 position data is sampled at irregular intervals (~0.1s–0.3s). Linear interpolation produces smooth movement between known data points.

```javascript
// utils/interpolate.js
export function interpolate(positions, t) {
  if (!positions || positions.length === 0) return null;
  if (t <= positions[0].t) return positions[0];
  if (t >= positions[positions.length - 1].t) return positions[positions.length - 1];

  // Binary search for surrounding timestamps
  let lo = 0, hi = positions.length - 1;
  while (lo < hi - 1) {
    const mid = Math.floor((lo + hi) / 2);
    positions[mid].t <= t ? (lo = mid) : (hi = mid);
  }

  const a = positions[lo];
  const b = positions[hi];
  const alpha = (t - a.t) / (b.t - a.t); // 0.0 → 1.0

  return {
    x: a.x + (b.x - a.x) * alpha,
    y: a.y + (b.y - a.y) * alpha,
  };
}
```

### 9.4 Coordinate Normalization — normalize.js

```javascript
// utils/normalize.js
export function buildViewport(track, canvasW, canvasH, padding = 40) {
  const xs = track.map(p => p.x);
  const ys = track.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const scaleX = (canvasW - padding * 2) / (maxX - minX);
  const scaleY = (canvasH - padding * 2) / (maxY - minY);
  const scale = Math.min(scaleX, scaleY);
  return { minX, minY, scale, padding };
}

export function toCanvas(x, y, vp) {
  return [
    (x - vp.minX) * vp.scale + vp.padding,
    (y - vp.minY) * vp.scale + vp.padding,
  ];
}
```

---

## 10. Phased Implementation Plan

| Phase | Name | Deliverables | Timeline |
|---|---|---|---|
| **1** | Data Pipeline | Install FastF1, write `data_loader.py`, export single race as JSON to file, validate X/Y/Time data for all 20 drivers | Days 1–3 |
| **2** | FastAPI Backend | Implement all 4 endpoints, LRU cache, Pydantic models, CORS, Gzip middleware, Swagger docs at `/docs` | Days 4–6 |
| **3** | Canvas Renderer | React + Vite setup, `ReplayCanvas` component, `drawTrack()`, `drawCar()`, `interpolate()`, 60fps loop, viewport normalization | Days 7–10 |
| **4** | Playback Controls | Play/Pause, speed selector (0.5x–10x), lap scrubber slider, `MM:SS` display, Space key shortcut | Days 11–13 |
| **5** | Overlays & UI | Leaderboard panel, Safety Car banner, pit stop flash, tyre compound icon, `RaceSelector` dropdown, loading skeletons | Days 14–17 |
| **6** | Polish & Deploy | Dockerfile, `docker-compose.yml`, static file serving, Cloud Run deployment, README | Days 18–21 |

---

## 11. Component Specifications

### 11.1 ReplayCanvas.jsx

| Prop / Method | Type | Description |
|---|---|---|
| `data` | object | Full race replay JSON from API |
| `width, height` | number | Canvas pixel dimensions — responsive via ResizeObserver |
| `playing` | boolean | Controls animation loop on/off |
| `speed` | number | Playback multiplier: `0.5 \| 1 \| 2 \| 5 \| 10` |
| `seekTime` | number | External seek — jumping to a specific timestamp |
| `onTimeUpdate` | function | Emits current replay time every second — drives the scrubber and leaderboard |

### 11.2 Leaderboard.jsx

Updates every 1 second via `onTimeUpdate`. For each driver shows:
- Position number
- Driver code + team color swatch
- Gap to leader in seconds
- Current tyre compound with color coding (Red = Soft, Yellow = Medium, White = Hard)
- `DNF` or `PIT` badge when applicable

Sorted by race position derived from position telemetry at the current replay time.

### 11.3 PlaybackBar.jsx

- **Left** — Play/Pause button with `Space` key shortcut
- **Center** — Scrubber slider (0 → race duration in seconds); dragging seeks the canvas
- **Center** — Time display formatted as `Lap N | MM:SS`
- **Right** — Speed selector: segmented button group `[0.5x | 1x | 2x | 5x | 10x]`

### 11.4 StatusBanner.jsx

Monitors `track_status` events and shows a full-width banner when the current replay time falls within a status window:

| Status Code | Message | Banner Color |
|---|---|---|
| `4` | Safety Car | `#FFC906` Yellow |
| `6` | Virtual Safety Car | `#FFE066` Light Yellow |
| `5` | Red Flag | `#E8002D` Red |
| `1` | All Clear | Hidden |

---

## 12. Environment & Dependencies

### 12.1 Backend — requirements.txt

```txt
fastf1>=3.8.1
fastapi>=0.111.0
uvicorn[standard]>=0.29.0
pandas>=2.0.0
numpy>=1.26.0
pydantic>=2.0.0
```

### 12.2 Frontend — package.json

```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "swr": "^2.2.0"
  },
  "devDependencies": {
    "vite": "^5.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0"
  }
}
```

### 12.3 Python Version

Python 3.11+ recommended. FastF1 3.8+ requires Python ≥ 3.9.

---

## 13. Deployment Architecture

### 13.1 Dockerfile

```dockerfile
FROM python:3.11-slim
WORKDIR /app

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend/ ./backend/

# Copy built frontend (run: cd frontend && npm run build first)
COPY frontend/dist/ ./static/

EXPOSE 8080
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8080"]
```

### 13.2 docker-compose.yml

```yaml
version: "3.9"
services:
  app:
    build: .
    ports:
      - "8080:8080"
    volumes:
      - ./backend/cache:/app/backend/cache   # Persist FastF1 disk cache
    environment:
      - PYTHONUNBUFFERED=1
```

### 13.3 Cloud Run Deployment

```bash
# 1. Build frontend
cd frontend && npm run build && cd ..

# 2. Build and push Docker image
docker build -t gcr.io/YOUR_PROJECT/f1-replay .
docker push gcr.io/YOUR_PROJECT/f1-replay

# 3. Deploy to Cloud Run
gcloud run deploy f1-replay \
  --image gcr.io/YOUR_PROJECT/f1-replay \
  --platform managed \
  --region us-central1 \
  --memory 2Gi \
  --cpu 2 \
  --min-instances 1 \     # Keep in-memory cache warm
  --allow-unauthenticated
```

> Mount a Cloud Storage bucket as `/app/backend/cache/` for persistent FastF1 disk cache across container instances.

---

## 14. Risks & Mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| FastF1 API rate limits or data unavailability | 🔴 High | Aggressive disk caching; fallback to last cached version |
| Position data missing for DNF drivers / early exits | 🟡 Medium | Null check in `interpolate()`; hide car dot if no data in last 5s |
| Canvas performance on older devices / Safari | 🟡 Medium | Throttle to 30fps on mobile; cap max visible drivers to 10 |
| First-load latency on cold FastF1 call (15–30s) | 🔴 High | Loading skeleton with race name; pre-warm popular races on deploy |
| FastF1 library breaking changes | 🟢 Low | Pin exact version in `requirements.txt`; write tests for `data_loader.py` |

---

## 15. Future Roadmap (Post-MVP)

### Phase 2 — Telemetry Overlay
- Click any car to open a live telemetry panel: speed, RPM, throttle %, brake %
- Mini speed trace chart for the selected driver that scrolls as replay progresses

### Phase 3 — Head-to-Head Mode
- Select two drivers and view side-by-side comparison: lap delta, gap chart, strategy diff
- Highlight exactly where Driver A gained or lost time on each lap

### Phase 4 — Live Mode
- Integrate FastF1's live timing recorder to replay an ongoing race 30s delayed
- WebSocket streaming from backend instead of a REST JSON dump

### Phase 5 — AI Race Analyst 🤖
- After a replay, pass session summary (positions, gaps, pit stops, SC events) to Claude API
- Generate a natural-language race analysis: *"Verstappen's undercut on lap 38 was the decisive move..."*
- Builds directly on the SummarizeAgent + Gemini ADK experience

---

## Appendix A — Quick Start

```bash
# Clone
git clone https://github.com/SudoAnirudh/f1-race-replay
cd f1-race-replay

# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# → API docs at http://localhost:8000/docs

# Frontend (new terminal)
cd frontend
npm install
npm run dev
# → App at http://localhost:5173

# Full stack via Docker
docker-compose up --build
# → App at http://localhost:8080
```

---

## Appendix B — Key FastF1 Code Snippets

```python
import fastf1

fastf1.Cache.enable_cache('cache/')

# Load a race session
session = fastf1.get_session(2023, 8, 'R')   # 2023, Round 8 (Monaco)
session.load(telemetry=True)

# Get track outline from the fastest lap
fastest = session.laps.pick_fastest()
track = fastest.get_pos_data()[['X', 'Y']].dropna()

# Get all driver positions
for drv_num in session.drivers:
    laps = session.laps.pick_drivers(drv_num)
    pos = laps.get_pos_data()   # DataFrame: X, Y, Time, Status
    info = session.get_driver(drv_num)
    print(info['Abbreviation'], info['TeamColor'])

# Safety car events
print(session.track_status)

# Pit stops
pits = session.laps[session.laps['PitInTime'].notna()][['Driver', 'PitInTime', 'Compound']]
print(pits)
```

---

*FastF1 and this project are unofficial and not associated with Formula One Licensing B.V. F1, FORMULA ONE, FORMULA 1, FIA FORMULA ONE WORLD CHAMPIONSHIP, GRAND PRIX and related marks are trademarks of Formula One Licensing B.V.*
