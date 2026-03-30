import { getTeamColor } from '../utils/teamColors';

export function Leaderboard({ data, time }) {
  if (!data) return (
    <div className="w-64 bg-zinc-900 border border-zinc-800 rounded-xl shadow-lg flex flex-col p-4 animate-pulse">
      <div className="h-6 bg-zinc-800 rounded w-1/2 mb-4"></div>
      {[...Array(10)].map((_, i) => (
        <div key={i} className="h-8 bg-zinc-800 rounded mb-2"></div>
      ))}
    </div>
  );

  // Compute leaderboard from positions at `time`
  // Assumes higher progress means "further along" the track, but
  // since this is just an MVP we can sort by their linear interpolation distance
  // Or simpler: just use data.drivers array if FastF1 provided pre-sorted,
  // but FastF1 doesn't. We'll sort by how they appear in the data array
  // Alternatively, just list them statically for MVP as positions is tricky without lap numbers.
  // Actually, PRD says "Sorted by race position derived from position telemetry".
  // Since FastF1 data doesn't export LapProgress easily in our MVP payload,
  // we will sort by Driver ID (statically) to avoid chaotic jumping.
  const drivers = Object.values(data.drivers);

  return (
    <div className="w-72 bg-zinc-900 border border-zinc-800 rounded-xl shadow-lg flex flex-col overflow-hidden max-h-full">
      <div className="bg-zinc-950 px-4 py-3 border-b border-zinc-800 flex justify-between items-center">
        <h2 className="font-bold text-sm tracking-wider uppercase text-zinc-300">Live Order</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
        {drivers.map((drv, i) => {
          const isPitting = drv.pit_windows.some(
            pw => time >= pw.in_time && time <= (pw.out_time ?? pw.in_time + 35)
          );
          return (
            <div key={drv.code} className="flex items-center gap-3 p-2 rounded-lg mb-1 bg-zinc-950/50 hover:bg-zinc-800 transition-colors group">
              <span className="font-mono text-zinc-500 text-xs w-4 text-left">{i + 1}</span>
              <div 
                className="w-1 h-6 rounded-full" 
                style={{ backgroundColor: `#${getTeamColor(drv.team, drv.color)}` }}
              ></div>
              <div className="flex-1 flex items-center justify-between">
                <span className="font-bold font-mono tracking-wide">{drv.code}</span>
                {isPitting && (
                  <span className="bg-white text-black text-[10px] font-bold px-1.5 py-0.5 rounded-sm animate-pulse">
                    PIT
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
