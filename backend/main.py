from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
import fastf1
from data_loader import get_race_replay_data
from cache_manager import lru_cache
from models import ScheduleEvent

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

@app.get("/health")
async def health():
    return {"ok": True}

# Serve built frontend if it exists
try:
    app.mount("/", StaticFiles(directory="static", html=True), name="static")
except Exception:
    pass
