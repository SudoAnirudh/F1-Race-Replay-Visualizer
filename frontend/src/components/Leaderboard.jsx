import { getTeamColor } from '../utils/teamColors';
import { Timer, Flag, TrendingUp, TrendingDown, Circle, AlertTriangle } from 'lucide-react';
import { useMemo, useRef } from 'react';

/**
 * Get the race progress for a driver at time t using actual lap data.
 * Returns { completedLaps, lapProgress, score, lastLapEnd }
 */
function getDriverRaceProgress(laps, t) {
  if (!laps || laps.length === 0) return { completedLaps: 0, lapProgress: 0, score: 0, lastLapEnd: 0 };

  let completedLaps = 0;
  let lastLapEnd = 0;
  let currentLapStart = 0;
  let currentLapEnd = Infinity;

  // Search for the current lap position
  for (let i = 0; i < laps.length; i++) {
    const lap = laps[i];
    if (t >= lap.lap_end) {
      completedLaps = lap.lap_number;
      lastLapEnd = lap.lap_end;
      currentLapStart = lap.lap_end;
    } else if (t >= lap.lap_start) {
      currentLapStart = lap.lap_start;
      currentLapEnd = lap.lap_end;
      break;
    }
  }

  const lapDuration = currentLapEnd - currentLapStart;
  const lapProgress = lapDuration > 0 && lapDuration < Infinity
    ? Math.min(1, (t - currentLapStart) / lapDuration) 
    : 0;

  const score = completedLaps + lapProgress;

  return { completedLaps, lapProgress, score, lastLapEnd };
}

const TYRE_COLORS = {
  'SOFT': 'text-red-500',
  'MEDIUM': 'text-yellow-500',
  'HARD': 'text-zinc-100',
  'INTERMEDIATE': 'text-emerald-500',
  'WET': 'text-blue-500',
  'UNKNOWN': 'text-zinc-600'
};

export function Leaderboard({ data, time }) {
  const prevOrderRef = useRef([]);

  const processedDrivers = useMemo(() => {
    if (!data) return [];
    
    // 1. Gather raw progress for all drivers
    const drivers = Object.entries(data.drivers).map(([num, drv]) => {
      const progress = getDriverRaceProgress(drv.laps, time);
      
      // Determine Current Tyre
      let currentTyre = 'UNKNOWN';
      const activeWindow = drv.pit_windows.find(pw => time >= pw.in_time && (pw.out_time === null || time <= pw.out_time));
      if (activeWindow) {
        currentTyre = activeWindow.compound;
      } else {
        const pastWindows = drv.pit_windows
          .filter(pw => time > (pw.out_time ?? pw.in_time))
          .sort((a, b) => (b.out_time ?? b.in_time) - (a.out_time ?? a.in_time));
        
        if (pastWindows.length > 0) {
          currentTyre = pastWindows[0].compound;
        } else {
          currentTyre = drv.pit_windows[0]?.compound || 'SOFT';
        }
      }

      // Detect DNF
      const lastPosTime = drv.positions.length > 0 ? drv.positions[drv.positions.length - 1].t : 0;
      const isRetired = time > lastPosTime + 20 && time < data.duration_seconds - 5;

      return { 
        num, 
        drv, 
        ...progress, 
        tyre: currentTyre, 
        isRetired 
      };
    });

    // 2. Sort primary standings
    drivers.sort((a, b) => {
      if (a.isRetired && !b.isRetired) return 1;
      if (!a.isRetired && b.isRetired) return -1;
      return b.score - a.score;
    });

    // 3. Gap Analysis
    const leader = drivers[0];
    const avgLapTime = 90; // Default estimate for F1

    return drivers.map((d, i) => {
      let gapText = '';
      if (i === 0) {
        gapText = 'INTERVAL';
      } else if (d.isRetired) {
        gapText = 'STOPPED';
      } else if (leader.completedLaps - d.completedLaps > 1) {
        gapText = `+${leader.completedLaps - d.completedLaps} LAPS`;
      } else {
        // Hybrid Calculation:
        // Try to get exact gap at the last common completed lap
        const commonLap = Math.min(d.completedLaps, leader.completedLaps);
        let exactGap = null;
        if (commonLap > 0) {
          const leaderLapEnd = leader.drv.laps.find(l => Number(l.lap_number) === commonLap)?.lap_end;
          const driverLapEnd = d.drv.laps.find(l => Number(l.lap_number) === commonLap)?.lap_end;
          if (leaderLapEnd && driverLapEnd) {
            exactGap = driverLapEnd - leaderLapEnd;
          }
        }

        if (exactGap !== null) {
          // If the leader is further ahead in current lap, add some estimated live delta
          const scoreDiff = leader.score - d.score;
          // Use exact gap at finish line as base, or just the score diff for smooth updates
          gapText = `+${(scoreDiff * avgLapTime).toFixed(1)}s`;
        } else {
          // Purely score-based estimate for first lap
          gapText = `+${((leader.score - d.score) * avgLapTime).toFixed(1)}s`;
        }
      }
      return { ...d, gapText };
    });
  }, [data, Math.floor(time)]);

  const positionChanges = useMemo(() => {
    const changes = {};
    const currentOrder = processedDrivers.map(e => e.drv.code);
    const prevOrder = prevOrderRef.current;

    if (prevOrder.length > 0) {
      currentOrder.forEach((code, newIdx) => {
        const oldIdx = prevOrder.indexOf(code);
        if (oldIdx !== -1) {
          changes[code] = oldIdx - newIdx;
        }
      });
    }

    prevOrderRef.current = currentOrder;
    return changes;
  }, [processedDrivers]);

  if (!data) return (
    <div className="w-full h-full glass rounded-xl shadow-2xl flex flex-col p-4 overflow-hidden">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-5 bg-zinc-800 rounded w-24 animate-shimmer bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800 bg-[length:200%_100%]"></div>
      </div>
      {[...Array(12)].map((_, i) => (
        <div 
          key={i} 
          className="h-9 bg-zinc-800/50 rounded-lg mb-1.5 animate-shimmer bg-gradient-to-r from-zinc-800/50 via-zinc-700/30 to-zinc-800/50 bg-[length:200%_100%]"
          style={{ animationDelay: `${i * 0.08}s` }}
        />
      ))}
    </div>
  );

  return (
    <div className="w-full h-full glass rounded-xl shadow-2xl flex flex-col overflow-hidden animate-fadeIn">
      {/* Header */}
      <div className="relative px-4 py-3 border-b border-zinc-800/40 flex justify-between items-center shrink-0">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-zinc-700/50 to-transparent" />
        <div className="flex items-center gap-2">
          <Flag size={12} className="text-f1red" />
          <h2 className="font-bold text-xs tracking-[0.15em] uppercase text-zinc-300">Live Standings</h2>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-600">
          <Timer size={10} />
          <span className="text-[9px] font-mono">{processedDrivers.length} cars</span>
        </div>
      </div>

      {/* Driver list */}
      <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
        {processedDrivers.map((d, i) => {
          const isPitting = d.drv.pit_windows.some(
            pw => time >= pw.in_time && time <= (pw.out_time ?? pw.in_time + 35)
          );
          const teamColor = `#${getTeamColor(d.drv.team, d.drv.color)}`;
          const change = positionChanges[d.drv.code] || 0;
          const isLeader = i === 0;
          
          return (
            <div 
              key={d.drv.code} 
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg mb-0.5 transition-all duration-300 group cursor-default ${
                isLeader 
                  ? 'bg-zinc-800/40 border border-zinc-700/30' 
                  : d.isRetired ? 'opacity-50 grayscale bg-zinc-950/20' : 'bg-zinc-950/30 hover:bg-zinc-800/60'
              }`}
            >
              {/* Position */}
              <span className={`font-mono text-[10px] w-5 text-center font-bold tabular-nums ${
                isLeader ? 'text-f1red' : d.isRetired ? 'text-zinc-700' : 'text-zinc-600'
              }`}>
                {d.isRetired ? 'RET' : String(i + 1).padStart(2, '0')}
              </span>
              
              {/* Team color bar */}
              <div 
                className="w-[3px] h-6 rounded-full shrink-0 transition-all duration-300 group-hover:h-8" 
                style={{ 
                  backgroundColor: teamColor,
                  boxShadow: isLeader ? `0 0 8px ${teamColor}40` : 'none',
                }}
              />
              
              <div className="flex-1 flex items-center justify-between min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`font-bold font-mono tracking-wider text-[13px] transition-colors ${
                    isLeader ? 'text-white' : 'group-hover:text-white'
                  }`}>
                    {d.drv.code}
                  </span>
                  
                  {/* Tyre indicator */}
                  {!d.isRetired && (
                    <div className={`flex items-center px-1 rounded-full border border-current opacity-70 transition-opacity scale-90 ${TYRE_COLORS[d.tyre] || TYRE_COLORS.UNKNOWN}`}>
                      <Circle size={6} fill="currentColor" strokeWidth={0} />
                      <span className="text-[7px] font-black ml-0.5">{d.tyre[0]}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Live Gap */}
                  {!d.isRetired && (
                    <span className={`text-[10px] font-mono tabular-nums font-bold ${isLeader ? 'text-zinc-500' : 'text-zinc-300'}`}>
                      {d.gapText}
                    </span>
                  )}

                  {/* Move indicator */}
                  {change !== 0 && !d.isRetired && (
                    <span className={`flex items-center text-[8px] font-bold ${
                      change > 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {change > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    </span>
                  )}

                  {isPitting && (
                    <span className="bg-white text-black text-[8px] font-extrabold px-1 py-0.5 rounded animate-pulse">
                      PIT
                    </span>
                  )}
                  
                  {d.isRetired && (
                    <AlertTriangle size={10} className="text-red-500 animate-pulse" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
