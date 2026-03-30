import { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer,
  LabelList
} from 'recharts';
import { useTeamPace } from '../../hooks/useAnalytics';
import { getTeamColor } from '../../utils/teamColors';
import { formatTime } from '../../utils/formatTime';
import { Loader2, AlertCircle, TrendingUp } from 'lucide-react';

export default function TeamPaceBar({ year, round }) {
  const { data, error, isLoading } = useTeamPace(year, round);

  const chartData = useMemo(() => {
    if (!data) return [];
    
    // Calculate gap to leader for comparison
    const leaderPace = data[0].median_lap_sec;
    
    return data.map(item => ({
      ...item,
      gap: item.median_lap_sec - leaderPace,
      fill: `#${getTeamColor(item.team)}`
    }));
  }, [data]);

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-3">
        <Loader2 className="animate-spin text-red-500" size={32} />
        <span className="font-mono text-xs tracking-widest uppercase">Analyzing Team Pace...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-red-400 gap-3">
        <AlertCircle size={32} />
        <span className="font-mono text-xs tracking-widest uppercase text-center">No race data found for this year</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-sm font-black tracking-widest uppercase text-white/90 font-mono">Median Race Pace</h3>
          <p className="text-[10px] text-zinc-500 font-mono mt-1 italic italic-important">Excludes outliers, safety car, and pit laps.</p>
        </div>
        <div className="flex items-center gap-2 text-emerald-400 bg-emerald-400/5 px-3 py-1.5 rounded-lg border border-emerald-400/20">
           <TrendingUp size={12} strokeWidth={3} />
           <span className="text-[10px] font-black uppercase tracking-tighter">Gap to Leader</span>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={chartData} 
            layout="vertical" 
            margin={{ top: 5, right: 80, left: 40, bottom: 5 }}
            barCategoryGap={12}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#222" horizontal={false} />
            <XAxis 
               type="number" 
               domain={['auto', 'auto']} 
               hide 
            />
            <YAxis 
              type="category" 
              dataKey="team" 
              stroke="#52525b"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => v.length > 15 ? v.substring(0, 15) + '...' : v}
            />
            <Tooltip 
              cursor={{ fill: '#ffffff05' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-zinc-950/90 border border-zinc-800 p-3 rounded-xl shadow-2xl backdrop-blur-md">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-[3px] h-4 rounded-full" style={{ backgroundColor: d.fill }} />
                        <span className="text-sm font-black tracking-tight">{d.team}</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between gap-8 text-[11px]">
                          <span className="text-zinc-500">Median Lap</span>
                          <span className="text-white font-mono">{formatTime(d.median_lap_sec)}</span>
                        </div>
                        <div className="flex justify-between gap-8 text-[11px]">
                          <span className="text-zinc-500">Gap to P1</span>
                          <span className="text-emerald-400 font-mono">+{d.gap.toFixed(3)}s</span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="median_lap_sec" radius={[0, 4, 4, 0]}>
              <LabelList 
                dataKey="gap" 
                position="right" 
                formatter={(v) => v === 0 ? 'LEADER' : `+${v.toFixed(3)}s`}
                style={{ fontSize: 10, fill: '#71717a', fontWeight: 'bold', fontFamily: 'monospace' }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
