import { getTeamColor } from '../utils/teamColors';
import { Timer, Flag, TrendingUp, TrendingDown } from 'lucide-react';
import { useMemo, useRef } from 'react';

/**
 * Get the race progress for a driver at time t using actual lap data.
 * Returns { completedLaps, lapProgress } where:
 * - completedLaps: number of laps finished
 * - lapProgress: fractional progress into the current lap (0-1)
 * Higher completedLaps = further ahead. Same laps = more lapProgress = further ahead.
 */
function getDriverRaceProgress(laps, t) {
  if (!laps || laps.length === 0) return { completedLaps: 0, lapProgress: 0, score: 0 };

  let completedLaps = 0;
  let currentLapStart = 0;
  let currentLapEnd = Infinity;

  for (const lap of laps) {
    if (t >= lap.lap_end) {
      // This lap is complete
      completedLaps = lap.lap_number;
      currentLapStart = lap.lap_end; // Next lap starts when this one ended
    } else if (t >= lap.lap_start) {
      // We're in this lap
      currentLapStart = lap.lap_start;
      currentLapEnd = lap.lap_end;
      break;
    }
  }

  // Calculate fractional progress into the current lap
  const lapDuration = currentLapEnd - currentLapStart;
  const lapProgress = lapDuration > 0 && lapDuration < Infinity
    ? Math.min(1, (t - currentLapStart) / lapDuration) 
    : 0;

  // Combined score: completed laps + fractional progress gives a single sortable number
  const score = completedLaps + lapProgress;

  return { completedLaps, lapProgress, score };
}

export function Leaderboard({ data, time }) {
  const prevOrderRef = useRef([]);

  // All hooks called unconditionally before any early returns
  const sortedDrivers = useMemo(() => {
    if (!data) return [];
    const entries = Object.entries(data.drivers).map(([num, drv]) => {
      const progress = getDriverRaceProgress(drv.laps, time);
      return { num, drv, ...progress };
    });
    // Sort by score descending (most laps + furthest into current lap = leader)
    entries.sort((a, b) => b.score - a.score);
    return entries;
  }, [data, Math.floor(time)]);

  const positionChanges = useMemo(() => {
    const changes = {};
    const currentOrder = sortedDrivers.map(e => e.drv.code);
    const prevOrder = prevOrderRef.current;

    if (prevOrder.length > 0) {
      currentOrder.forEach((code, newIdx) => {
        const oldIdx = prevOrder.indexOf(code);
        if (oldIdx === -1) {
          changes[code] = 0;
        } else {
          changes[code] = oldIdx - newIdx;
        }
      });
    }

    prevOrderRef.current = currentOrder;
    return changes;
  }, [sortedDrivers]);

  // Now safe to early-return
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
          <span className="text-[9px] font-mono">{sortedDrivers.length} cars</span>
        </div>
      </div>

      {/* Driver list */}
      <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
        {sortedDrivers.map(({ num, drv, completedLaps }, i) => {
          const isPitting = drv.pit_windows.some(
            pw => time >= pw.in_time && time <= (pw.out_time ?? pw.in_time + 35)
          );
          const teamColor = `#${getTeamColor(drv.team, drv.color)}`;
          const change = positionChanges[drv.code] || 0;
          const isLeader = i === 0;
          
          return (
            <div 
              key={drv.code} 
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg mb-0.5 transition-all duration-300 group cursor-default ${
                isLeader 
                  ? 'bg-zinc-800/40 border border-zinc-700/30' 
                  : 'bg-zinc-950/30 hover:bg-zinc-800/60'
              }`}
            >
              {/* Position number */}
              <span className={`font-mono text-[10px] w-5 text-center font-bold tabular-nums ${
                isLeader ? 'text-f1red' : 'text-zinc-600'
              }`}>
                {String(i + 1).padStart(2, '0')}
              </span>
              
              {/* Team color bar */}
              <div 
                className="w-[3px] h-6 rounded-full shrink-0 transition-all duration-300 group-hover:h-7" 
                style={{ 
                  backgroundColor: teamColor,
                  boxShadow: isLeader ? `0 0 8px ${teamColor}40` : 'none',
                }}
              />
              
              {/* Driver info */}
              <div className="flex-1 flex items-center justify-between min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`font-bold font-mono tracking-wider text-sm transition-colors ${
                    isLeader ? 'text-white' : 'group-hover:text-white'
                  }`}>
                    {drv.code}
                  </span>
                  <span className="text-[9px] text-zinc-600 font-mono tabular-nums">
                    L{completedLaps}
                  </span>
                </div>
                
                <div className="flex items-center gap-1.5">
                  {/* Position change indicator */}
                  {change !== 0 && (
                    <span className={`flex items-center text-[8px] font-bold font-mono ${
                      change > 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {change > 0 ? <TrendingUp size={8} /> : <TrendingDown size={8} />}
                      <span className="ml-0.5">{Math.abs(change)}</span>
                    </span>
                  )}

                  {isPitting && (
                    <span className="bg-white text-black text-[8px] font-extrabold px-1.5 py-0.5 rounded animate-pulse tracking-wider">
                      PIT
                    </span>
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
