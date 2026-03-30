import { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer,
  Legend
} from 'recharts';
import { useSectors } from '../../hooks/useAnalytics';
import { getTeamColor } from '../../utils/teamColors';
import { Loader2, AlertCircle, PieChart } from 'lucide-react';

export default function SectorBreakdown({ year, round, session, selectedDrivers = [] }) {
  const { data, error, isLoading } = useSectors(year, round, session);

  const chartData = useMemo(() => {
    if (!data) return [];
    
    // Sort by overall lap time
    return data
      .filter(item => selectedDrivers.length === 0 || selectedDrivers.includes(item.Driver))
      .sort((a, b) => a.LapTimeSec - b.LapTimeSec);
  }, [data, selectedDrivers]);

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-3">
        <Loader2 className="animate-spin text-red-500" size={32} />
        <span className="font-mono text-xs tracking-widest uppercase">Benchmarking Sectors...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-red-400 gap-3">
        <AlertCircle size={32} />
        <span className="font-mono text-xs tracking-widest uppercase">Sector timing unavailable</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-sm font-black tracking-widest uppercase text-white/90 font-mono">Fastest Lap Sector Breakdown</h3>
          <p className="text-[10px] text-zinc-500 font-mono mt-1 italic italic-important underline decoration-red-500/30">Total lap time compared across S1, S2 and S3.</p>
        </div>
        <div className="flex items-center gap-2 text-zinc-500 bg-zinc-900/40 px-3 py-1.5 rounded-lg border border-zinc-800/40 shadow-inner">
           <PieChart size={12} strokeWidth={3} />
           <span className="text-[10px] font-black uppercase tracking-tighter">Stack Visualization</span>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={chartData} 
            layout="vertical" 
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            barCategoryGap={16}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#222" horizontal={false} />
            <XAxis 
              type="number" 
              domain={[0, 'dataMax']} 
              stroke="#52525b"
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              type="category" 
              dataKey="Driver" 
              stroke="#52525b"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tick={(props) => {
                const { x, y, payload } = props;
                const teamColor = `#${getTeamColor(null, null, payload.value)}`;
                return (
                  <g transform={`translate(${x},${y})`}>
                    <text x={-10} y={0} dy={4} textAnchor="end" fill={teamColor} fontSize={11} fontWeight="black" fontFamily="monospace">
                      {payload.value}
                    </text>
                  </g>
                );
              }}
            />
            <Tooltip 
              cursor={{ fill: '#ffffff05' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-zinc-950/90 border border-zinc-800 p-3 rounded-xl shadow-2xl backdrop-blur-md">
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-zinc-800/50">
                        <span className="text-sm font-black tracking-tight">{d.Driver}</span>
                        <span className="text-[11px] font-mono text-white/60">Lap {d.LapTimeSec.toFixed(3)}s</span>
                      </div>
                      <div className="space-y-1 mt-2">
                        <div className="flex justify-between gap-12 text-[10px]">
                           <span className="text-zinc-500 font-bold">SECTOR 1</span>
                           <span className="text-white font-mono">{d.Sector1TimeSec.toFixed(3)}s</span>
                        </div>
                        <div className="flex justify-between gap-12 text-[10px]">
                           <span className="text-zinc-500 font-bold">SECTOR 2</span>
                           <span className="text-white font-mono">{d.Sector2TimeSec.toFixed(3)}s</span>
                        </div>
                        <div className="flex justify-between gap-12 text-[10px]">
                           <span className="text-zinc-500 font-bold">SECTOR 3</span>
                           <span className="text-white font-mono">{d.Sector3TimeSec.toFixed(3)}s</span>
                        </div>
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
               iconType="square"
               formatter={(value) => <span className="text-[10px] font-black tracking-widest uppercase text-zinc-500 font-mono italic">{value.replace('Sec', '')}</span>}
            />
            <Bar dataKey="Sector1TimeSec" stackId="a" fill="#ef444490" name="Sector 1" radius={[2, 0, 0, 2]} />
            <Bar dataKey="Sector2TimeSec" stackId="a" fill="#fbbf2490" name="Sector 2" />
            <Bar dataKey="Sector3TimeSec" stackId="a" fill="#3b82f690" name="Sector 3" radius={[0, 2, 2, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
