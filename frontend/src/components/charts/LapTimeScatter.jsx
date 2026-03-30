import { useMemo } from 'react';
import { 
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell
} from 'recharts';
import { useLapTimes } from '../../hooks/useAnalytics';
import { getTeamColor } from '../../utils/teamColors';
import { formatTime } from '../../utils/formatTime';
import { Loader2, AlertCircle } from 'lucide-react';

const TYRE_STYLES = {
  'SOFT': { stroke: '#ef4444', fill: '#ef4444' },
  'MEDIUM': { stroke: '#fbbf24', fill: '#fbbf24' },
  'HARD': { stroke: '#f4f4f5', fill: '#f4f4f5' },
  'INTERMEDIATE': { stroke: '#10b981', fill: '#10b981' },
  'WET': { stroke: '#3b82f6', fill: '#3b82f6' }
};

export default function LapTimeScatter({ year, round, session, selectedDrivers = [] }) {
  const { data, error, isLoading } = useLapTimes(year, round, session);

  const chartData = useMemo(() => {
    if (!data) return [];
    
    // Group by driver
    const grouped = {};
    data.forEach(lap => {
      // Filter by selected drivers if any
      if (selectedDrivers.length > 0 && !selectedDrivers.includes(lap.Driver)) return;
      
      if (!grouped[lap.Driver]) grouped[lap.Driver] = [];
      grouped[lap.Driver].push(lap);
    });
    
    return Object.entries(grouped).map(([driver, laps]) => ({
      driver,
      laps: laps.sort((a, b) => a.LapNumber - b.LapNumber)
    }));
  }, [data, selectedDrivers]);

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-3">
        <Loader2 className="animate-spin text-red-500" size={32} />
        <span className="font-mono text-xs tracking-widest uppercase">Fetching lap data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-red-400 gap-3">
        <AlertCircle size={32} />
        <span className="font-mono text-xs tracking-widest uppercase">Failed to load telemetry</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-black tracking-widest uppercase text-white/90 font-mono">Lap Time Distribution</h3>
        <div className="flex gap-4">
          {Object.entries(TYRE_STYLES).map(([name, style]) => (
            <div key={name} className="flex items-center gap-1.5 opacity-60">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: style.fill }} />
              <span className="text-[9px] font-bold uppercase tracking-tighter text-zinc-400">{name[0]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
            <XAxis 
              dataKey="LapNumber" 
              name="Lap" 
              type="number" 
              domain={['dataMin', 'dataMax']}
              stroke="#52525b"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              label={{ value: 'Lap Number', position: 'insideBottom', offset: -10, fontSize: 10, fill: '#52525b' }}
            />
            <YAxis 
              dataKey="LapTimeSec" 
              name="Time" 
              unit="s"
              domain={['auto', 'auto']}
              stroke="#52525b"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => v.toFixed(1)}
              label={{ value: 'Seconds', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#52525b' }}
            />
            <ZAxis type="number" range={[40, 40]} />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3', stroke: '#444' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  const teamColor = `#${getTeamColor(null, null, d.Driver)}`;
                  return (
                    <div className="bg-zinc-950/90 border border-zinc-800 p-3 rounded-xl shadow-2xl backdrop-blur-md">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-[3px] h-4 rounded-full" style={{ backgroundColor: teamColor }} />
                        <span className="text-sm font-black tracking-tight">{d.Driver}</span>
                        <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded text-zinc-400 uppercase font-mono">Lap {d.LapNumber}</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between gap-8 text-[11px]">
                          <span className="text-zinc-500">Lap Time</span>
                          <span className="text-white font-mono">{formatTime(d.LapTimeSec)}</span>
                        </div>
                        <div className="flex justify-between gap-8 text-[11px]">
                          <span className="text-zinc-500">Tyre</span>
                          <span className="text-white font-mono" style={{ color: TYRE_STYLES[d.Compound]?.fill }}>{d.Compound} ({d.TyreLife})</span>
                        </div>
                        {d.IsPersonalBest && (
                          <div className="mt-2 text-[9px] text-f1red font-black uppercase tracking-widest text-center py-1 bg-f1red/5 rounded-md border border-f1red/20 animate-pulse">
                            Personal Best
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend 
              verticalAlign="top" 
              height={36} 
              iconType="circle"
              formatter={(value) => <span className="text-[10px] font-black tracking-tight uppercase text-zinc-400 font-mono">{value}</span>}
            />
            {chartData.map((entry) => (
              <Scatter 
                key={entry.driver} 
                name={entry.driver} 
                data={entry.laps} 
                fill={`#${getTeamColor(null, null, entry.driver)}`}
                line={selectedDrivers.length > 0} // Connect only if filtered to a few drivers
                lineType="joint"
                shape={(props) => {
                  const { cx, cy, payload } = props;
                  const tyreFill = TYRE_STYLES[payload.Compound]?.fill || '#fff';
                  const isPB = payload.IsPersonalBest;
                  
                  return (
                    <g>
                      <circle cx={cx} cy={cy} r={isPB ? 4 : 3} fill={tyreFill} />
                      {isPB && <circle cx={cx} cy={cy} r={6} stroke={tyreFill} fill="none" strokeWidth={1} className="animate-ping" />}
                    </g>
                  );
                }}
              />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
