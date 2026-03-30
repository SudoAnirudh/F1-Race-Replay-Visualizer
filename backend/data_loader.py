import fastf1
import pandas as pd
import numpy as np
from typing import List, Dict, Any
from models import ReplayResponse, TrackPoint, TrackStatus, Position, PitWindow, DriverReplay, TelemetryPoint, LapEntry

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

def get_lap_entries(laps: pd.DataFrame) -> List[LapEntry]:
    """Extract lap timing data for live leaderboard sorting."""
    entries = []
    for _, row in laps.iterrows():
        lap_num = int(row['LapNumber']) if pd.notna(row['LapNumber']) else 0
        
        # LapStartTime = when this lap began (timedelta from session start)
        # Time = when this lap ended / crossed the line (timedelta from session start)
        lap_start = row['LapStartTime'].total_seconds() if pd.notna(row.get('LapStartTime')) else None
        lap_end = row['Time'].total_seconds() if pd.notna(row.get('Time')) else None
        
        if lap_start is not None and lap_end is not None and lap_num > 0:
            entries.append(LapEntry(
                lap_number=lap_num,
                lap_start=lap_start,
                lap_end=lap_end,
            ))
    
    return sorted(entries, key=lambda e: e.lap_number)

def get_race_replay_data(year: int, round_num: int) -> dict:
    session = fastf1.get_session(year, round_num, 'R')
    session.load(telemetry=True, weather=False, messages=False)

    drivers = session.drivers
    driver_data = {}

    for drv in drivers:
        laps = session.laps.pick_drivers(drv)
        if len(laps) == 0:
            continue
        
        tel = laps.get_pos_data()
        info = session.get_driver(drv)
        
        # Position data
        positions = []
        for _, row in tel.iterrows():
            if pd.isna(row['X']) or pd.isna(row['Y']):
                continue
            positions.append(Position(
                t=row['Time'].total_seconds(),
                x=row['X'],
                y=row['Y']
            ))

        # Car telemetry data (speed, RPM, throttle, brake, gear, DRS)
        telemetry_points = []
        try:
            car_data = laps.get_car_data()
            if car_data is not None and len(car_data) > 0:
                # Downsample to ~1Hz
                step = max(1, len(car_data) // (int(car_data['Time'].iloc[-1].total_seconds()) or 1))
                step = max(step, 5)
                sampled = car_data.iloc[::step]
                
                for _, row in sampled.iterrows():
                    t_val = row['Time'].total_seconds() if hasattr(row['Time'], 'total_seconds') else float(row['Time'])
                    telemetry_points.append(TelemetryPoint(
                        t=t_val,
                        speed=float(row.get('Speed', 0) or 0),
                        rpm=int(row.get('RPM', 0) or 0),
                        throttle=float(row.get('Throttle', 0) or 0),
                        brake=float(row.get('Brake', 0) or 0) * 100,
                        gear=int(row.get('nGear', 0) or 0),
                        drs=int(row.get('DRS', 0) or 0),
                    ))
        except Exception as e:
            print(f"Warning: Could not load car telemetry for driver {drv}: {e}")

        # Lap timing data for leaderboard
        lap_entries = get_lap_entries(laps)

        driver_data[drv] = DriverReplay(
            code=info['Abbreviation'] if pd.notna(info['Abbreviation']) else str(drv),
            name=info['LastName'] if pd.notna(info['LastName']) else "Unknown",
            team=info['TeamName'] if pd.notna(info['TeamName']) else "Unknown",
            color=info['TeamColor'] if pd.notna(info['TeamColor']) else "CCCCCC",
            number=str(drv),
            positions=positions,
            pit_windows=get_pit_windows(laps),
            telemetry=telemetry_points,
            laps=lap_entries,
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
