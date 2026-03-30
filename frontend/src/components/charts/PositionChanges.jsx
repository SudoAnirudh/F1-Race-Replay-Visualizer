import { useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { usePositions } from '../../hooks/useAnalytics';
import { getTeamColor } from '../../utils/teamColors';
import { Loader2, AlertCircle, Info } from 'lucide-react';

export default function PositionChanges({ year, round, selectedDrivers = [] }) {
  const { data, error, isLoading } = usePositions(year, round);

  const chartData = useMemo(() => {
    if (!data) return [];
    
    // Group all drivers by lap number for chart format
    // Recharts LineChart expects data in form: [{ LapNumber: 1, VER: 1, LEC: 2, ... }]
    const lapMap = {};
    data.forEach(p => {
      // If we have selected drivers, only include those
      if (selectedDrivers.length > 0 && !selectedDrivers.includes(p.Driver)) return;
      
      if (!lapMap[p.LapNumber]) lapMap[p.LapNumber] = { LapNumber: p.LapNumber };
      lapMap[p.LapNumber][p.Driver] = p.Position;
    });
    
    return Object.values(lapMap).sort((a, b) => a.LapNumber - b.LapNumber);
  }, [data, selectedDrivers]);

  const activeDrivers = useMemo(() => {
    if (!data) return [];
    const unique = new Set();
    data.forEach(p => {
      if (selectedDrivers.length > 0 && !selectedDrivers.includes(p.Driver)) return;
      unique.add(p.Driver);
    });
    return Array.from(unique);
  }, [data, selectedDrivers]);

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-3">
        <Loader2 className="animate-spin text-red-500" size={32} />
        <span className="font-mono text-xs tracking-widest uppercase text-zinc-500">Processing Race Positions...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-red-400 gap-3">
        <AlertCircle size={32} />
        <span className="font-mono text-xs tracking-widest uppercase">Failed to load standings</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-black tracking-widest uppercase text-white/90 font-mono">Race Position Tracker</h3>
        <div className="flex items-center gap-2 text-zinc-500 bg-zinc-900/40 px-3 py-1.5 rounded-lg border border-zinc-800/40">
           <Info size={12} strokeWidth={3} />
           <span className="text-[10px] font-mono whitespace-nowrap tracking-tighter">Positions are inverted (P1 at top)</span>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
            <XAxis 
              dataKey="LapNumber" 
              stroke="#52525b"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              label={{ value: 'Lap Number', position: 'insideBottom', offset: -10, fontSize: 10, fill: '#52525b' }}
            />
            <YAxis 
              reversed={true} 
              domain={[1, 20]} 
              stroke="#52525b"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              ticks={[1, 5, 10, 15, 20]}
            />
            <Tooltip 
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-zinc-950/90 border border-zinc-800 p-3 rounded-xl shadow-2xl backdrop-blur-md">
                      <div className="text-[10px] bg-zinc-800 px-3 py-1 rounded-md text-zinc-400 uppercase font-mono mb-3 text-center">
                        Lap {label} Standings
                      </div>
                      <div className="space-y-1.5 min-w-[120px]">
                        {payload
                          .sort((a, b) => a.value - b.value)
                          .map((p, i) => (
                            <div key={i} className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-2">
                                <div className="w-[2px] h-3 rounded-full" style={{ backgroundColor: p.color }} />
                                <span className="text-xs font-black tracking-tight">{p.name}</span>
                              </div>
                              <span className="text-xs font-mono font-bold text-white">P{p.value}</span>
                            </div>
                          ))
                        }
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
            {activeDrivers.map(drv => (
              <Line 
                key={drv} 
                type="stepAfter"
                dataKey={drv} 
                name={drv} 
                stroke={`#${getTeamColor(null, null, drv)}`} 
                strokeWidth={selectedDrivers.includes(drv) ? 3 : 1.5}
                dot={false}
                activeDot={{ r: 4 }}
                connectNulls={true}
                animateNewValues={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
