import fastf1
import pandas as pd
from typing import List, Dict, Any
from data_loader import load_session

def get_lap_times(year: int, round_num: int, session_type: str) -> List[Dict[str, Any]]:
    session = load_session(year, round_num, session_type)
    laps = session.laps[['Driver', 'LapNumber', 'LapTime', 'Compound', 'TyreLife', 'IsPersonalBest']].copy()
    laps = laps.dropna(subset=['LapTime'])
    laps['LapTimeSec'] = laps['LapTime'].dt.total_seconds()
    
    # Process for JSON serialization
    return laps[['Driver', 'LapNumber', 'LapTimeSec', 'Compound', 'TyreLife', 'IsPersonalBest']].to_dict(orient='records')

def get_telemetry(year: int, round_num: int, session_type: str, drivers: List[str], lap: str = 'fastest') -> Dict[str, List[Dict[str, Any]]]:
    session = load_session(year, round_num, session_type)
    result = {}
    
    for drv in drivers:
        try:
            if lap == 'fastest':
                l = session.laps.pick_drivers(drv).pick_fastest()
            else:
                l = session.laps.pick_drivers(drv).pick_laps(int(lap)).iloc[0]
            
            car = l.get_car_data().add_distance()
            # Columns: Distance, Speed, Throttle, Brake, nGear, RPM
            result[drv] = car[['Distance', 'Speed', 'Throttle', 'Brake', 'nGear', 'RPM']].to_dict(orient='records')
        except Exception as e:
            print(f"Error loading telemetry for {drv}: {e}")
            result[drv] = []
            
    return result

def get_strategy(year: int, round_num: int) -> List[Dict[str, Any]]:
    session = load_session(year, round_num, 'R')
    laps = session.laps[['Driver', 'LapNumber', 'Stint', 'Compound', 'TyreLife', 'PitInTime', 'PitOutTime']].copy()
    
    for col in ['PitInTime', 'PitOutTime']:
        laps[col] = laps[col].dt.total_seconds()
        
    return laps.dropna(subset=['Compound']).to_dict(orient='records')

def get_team_pace(year: int, round_num: int) -> List[Dict[str, Any]]:
    session = load_session(year, round_num, 'R')
    laps = session.laps.pick_quicklaps().copy()
    laps['LapTimeSec'] = laps['LapTime'].dt.total_seconds()
    
    team_pace = laps.groupby('Team')['LapTimeSec'].median().reset_index()
    team_pace.columns = ['team', 'median_lap_sec']
    team_pace = team_pace.sort_values('median_lap_sec')
    
    return team_pace.to_dict(orient='records')

def get_sectors(year: int, round_num: int, session_type: str) -> List[Dict[str, Any]]:
    session = load_session(year, round_num, session_type)
    
    # pick_fastest per driver
    fastest_laps = []
    for drv in session.drivers:
        try:
            f_lap = session.laps.pick_drivers(drv).pick_fastest()
            if f_lap is not None:
                fastest_laps.append(f_lap)
        except:
            continue
            
    if not fastest_laps:
        return []
        
    df = pd.DataFrame(fastest_laps)
    result = df[['Driver', 'Sector1Time', 'Sector2Time', 'Sector3Time', 'LapTime']].copy()
    
    for col in ['Sector1Time', 'Sector2Time', 'Sector3Time', 'LapTime']:
        result[col + 'Sec'] = result[col].dt.total_seconds()
        
    return result[['Driver', 'Sector1TimeSec', 'Sector2TimeSec', 'Sector3TimeSec', 'LapTimeSec']].dropna().to_dict(orient='records')

def get_positions(year: int, round_num: int) -> List[Dict[str, Any]]:
    session = load_session(year, round_num, 'R')
    pos = session.laps[['Driver', 'LapNumber', 'Position']].dropna().copy()
    pos['Position'] = pos['Position'].astype(int)
    return pos.to_dict(orient='records')
