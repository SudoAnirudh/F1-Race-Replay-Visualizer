from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
import fastf1
from data_loader import get_race_replay_data
from analytics import (
    get_lap_times, get_telemetry, get_strategy,
    get_team_pace, get_sectors, get_positions
)
from cache_manager import lru_cache
from models import (
    ScheduleEvent, AnalyticsLapTime, AnalyticsTelemetryPoint,
    AnalyticsStrategy, AnalyticsTeamPace, AnalyticsSectors, AnalyticsPosition
)

app = FastAPI(title="F1 Race Replay API")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
app.add_middleware(GZipMiddleware, minimum_size=1000)

@app.get("/schedule/{year}")
def schedule(year: int):
    # Fetch schedule from FastF1
    events = fastf1.get_event_schedule(year)
    # Filter for full race weekends
    # FastF1 schedule format has EventName, RoundNumber, Country
    return events[['RoundNumber', 'EventName', 'Country']].to_dict(orient='records')

@app.get("/replay/{year}/{round_num}")
def replay(year: int, round_num: int):
    cache_key = f"{year}_{round_num}"
    data = lru_cache.get(cache_key)
    if data:
        return data
    
    # Process and fetch data (blocking call, in real world use threadpool or async loader)
    data = get_race_replay_data(year, round_num)
    lru_cache.put(cache_key, data)
    return data

@app.get("/analytics/lap-times/{year}/{round_num}/{session}")
def lap_times(year: int, round_num: int, session: str):
    return get_lap_times(year, round_num, session)

@app.get("/analytics/telemetry/{year}/{round_num}/{session}")
def telemetry(year: int, round_num: int, session: str, drivers: str = "VER", lap: str = "fastest"):
    driver_list = [d.strip() for d in drivers.split(",")]
    return get_telemetry(year, round_num, session, driver_list, lap)

@app.get("/analytics/strategy/{year}/{round_num}")
def strategy(year: int, round_num: int):
    return get_strategy(year, round_num)

@app.get("/analytics/team-pace/{year}/{round_num}")
def team_pace(year: int, round_num: int):
    return get_team_pace(year, round_num)

@app.get("/analytics/sectors/{year}/{round_num}/{session}")
def sectors(year: int, round_num: int, session: str):
    return get_sectors(year, round_num, session)

@app.get("/analytics/positions/{year}/{round_num}")
def positions(year: int, round_num: int):
    return get_positions(year, round_num)

@app.get("/health")
async def health():
    return {"ok": True}

# Serve built frontend if it exists
try:
    app.mount("/", StaticFiles(directory="static", html=True), name="static")
except Exception:
    pass
