from pydantic import BaseModel
from typing import List, Dict, Optional

class TrackPoint(BaseModel):
    x: float
    y: float

class TrackStatus(BaseModel):
    time: float
    status: str
    message: str

class Position(BaseModel):
    t: float
    x: float
    y: float

class TelemetryPoint(BaseModel):
    t: float        # time in seconds
    speed: float    # km/h
    rpm: int        # engine RPM
    throttle: float # 0-100%
    brake: float    # 0-100%
    gear: int       # gear number
    drs: int        # DRS status

class PitWindow(BaseModel):
    in_time: float
    out_time: Optional[float]
    compound: str

class LapEntry(BaseModel):
    lap_number: int
    lap_start: float   # seconds from race start when this lap began
    lap_end: float      # seconds from race start when this lap ended (crossed the line)

class DriverReplay(BaseModel):
    code: str
    name: str
    team: str
    color: str
    number: str
    positions: List[Position]
    pit_windows: List[PitWindow]
    telemetry: List[TelemetryPoint]
    laps: List[LapEntry]

class ReplayResponse(BaseModel):
    race_name: str
    year: int
    duration_seconds: float
    track: List[TrackPoint]
    track_status: List[TrackStatus]
    drivers: Dict[str, DriverReplay]

class ScheduleEvent(BaseModel):
    RoundNumber: int
    EventName: str
    Country: str

# --- Analytics Models ---

class AnalyticsLapTime(BaseModel):
    Driver: str
    LapNumber: int
    LapTimeSec: Optional[float]
    Compound: str
    TyreLife: int
    IsPersonalBest: bool

class AnalyticsTelemetryPoint(BaseModel):
    Distance: float
    Speed: float
    Throttle: float
    Brake: bool
    nGear: int
    RPM: int

class AnalyticsStrategy(BaseModel):
    Driver: str
    LapNumber: int
    Stint: int
    Compound: str
    TyreLife: int
    PitInTime: Optional[float]
    PitOutTime: Optional[float]

class AnalyticsTeamPace(BaseModel):
    team: str
    median_lap_sec: float

class AnalyticsSectors(BaseModel):
    Driver: str
    Sector1TimeSec: float
    Sector2TimeSec: float
    Sector3TimeSec: float
    LapTimeSec: float

class AnalyticsPosition(BaseModel):
    Driver: str
    LapNumber: int
    Position: int
