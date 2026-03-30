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

class PitWindow(BaseModel):
    in_time: float
    out_time: Optional[float]
    compound: str

class DriverReplay(BaseModel):
    code: str
    name: str
    team: str
    color: str
    positions: List[Position]
    pit_windows: List[PitWindow]

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
