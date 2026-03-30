import fastf1
import pandas as pd
import numpy as np
from typing import List, Dict, Any
from models import ReplayResponse, TrackPoint, TrackStatus, Position, PitWindow, DriverReplay

# Enable FastF1 cache
import os
cache_dir = 'backend/cache'
if not os.path.exists(cache_dir):
    os.makedirs(cache_dir)
fastf1.Cache.enable_cache(cache_dir)

def get_pit_windows(laps: pd.DataFrame) -> List[PitWindow]:
    pits = laps[laps['PitInTime'].notna()]
    return [
        PitWindow(
            in_time=row['PitInTime'].total_seconds(),
            out_time=row['PitOutTime'].total_seconds() if pd.notna(row['PitOutTime']) else None,
            compound=row['Compound']
        )
        for _, row in pits.iterrows()
    ]

def get_race_replay_data(year: int, round_num: int) -> dict:
    session = fastf1.get_session(year, round_num, 'R')
    session.load(telemetry=True, weather=False, messages=False)

    drivers = session.drivers
    driver_data = {}

    # Downsample position data to 10Hz (approx)
    # FastF1 telemetry is usually ~0.1s frequency
    
    for drv in drivers:
        laps = session.laps.pick_drivers(drv)
        if len(laps) == 0:
            continue
        
        tel = laps.get_pos_data()
        info = session.get_driver(drv)
        
        # Clean and rename for Pydantic
        # Telemetry 'Time' is timedelta
        positions = []
        for _, row in tel.iterrows():
            if pd.isna(row['X']) or pd.isna(row['Y']):
                continue
            positions.append(Position(
                t=row['Time'].total_seconds(),
                x=row['X'],
                y=row['Y']
            ))

        driver_data[drv] = DriverReplay(
            code=info['Abbreviation'] if pd.notna(info['Abbreviation']) else str(drv),
            name=info['LastName'] if pd.notna(info['LastName']) else "Unknown",
            team=info['TeamName'] if pd.notna(info['TeamName']) else "Unknown",
            color=info['TeamColor'] if pd.notna(info['TeamColor']) else "CCCCCC",
            positions=positions,
            pit_windows=get_pit_windows(laps)
        )

    # Track outline from fastest lap
    fastest_lap = session.laps.pick_fastest()
    track_tel = fastest_lap.get_pos_data()[['X', 'Y']].dropna()
    track_points = [TrackPoint(x=row['X'], y=row['Y']) for _, row in track_tel.iterrows()]

    # Track status
    status_events = []
    for _, row in session.track_status.iterrows():
        status_events.append(TrackStatus(
            time=row['Time'].total_seconds(),
            status=str(row['Status']),
            message=get_status_message(row['Status'])
        ))

    response = ReplayResponse(
        race_name=session.event['EventName'],
        year=year,
        duration_seconds=float(session.laps['LapStartTime'].max().total_seconds()),
        track=track_points,
        track_status=status_events,
        drivers=driver_data
    )
    
    return response.model_dump()

def get_status_message(status: str) -> str:
    messages = {
        '1': 'All Clear',
        '2': 'Yellow Flag',
        '4': 'Safety Car',
        '5': 'Red Flag',
        '6': 'Virtual Safety Car',
        '7': 'Virtual Safety Car Ending'
    }
    return messages.get(str(status), f'Status {status}')
