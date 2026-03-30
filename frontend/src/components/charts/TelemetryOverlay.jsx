import { useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer,
  Legend
} from 'recharts';
import { useTelemetry } from '../../hooks/useAnalytics';
import { getTeamColor } from '../../utils/teamColors';
import { Loader2, AlertCircle, Gauge, Activity } from 'lucide-react';

export default function TelemetryOverlay({ year, round, session, selectedDrivers = [], lap = 'fastest' }) {
  const { data, error, isLoading } = useTelemetry(year, round, session, selectedDrivers, lap);

  const chartData = useMemo(() => {
    if (!data) return [];
    
    // Telemetry data is usually high-frequency (every 0.2s or so)
    // We need to merge all drivers based on Distance for comparison
    // But since they might have different distance points, we'll just use the first driver's distance scale
    // or round it. For simplicity in V1, let's just use the raw points if one driver, 
    // or a more complex merge if multiple.
    
    // For now, let's assume we compare up to 2 drivers for clarity
    const drivers = Object.keys(data);
    if (drivers.length === 0) return [];
    
    // Use the first driver's data as baseline
    const base = data[drivers[0]];
    return base.map((p, i) => {
      const entry = { distance: p.Distance };
      drivers.forEach(drv => {
        if (data[drv][i]) {
          entry[`${drv}_speed`] = data[drv][i].Speed;
          entry[`${drv}_throttle`] = data[drv][i].Throttle;
          entry[`${drv}_brake`] = data[drv][i].Brake;
        }
      });
      return entry;
    });
  }, [data]);

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-3">
        <Loader2 className="animate-spin text-red-500" size={32} />
        <span className="font-mono text-xs tracking-widest uppercase">Processing car telemetry...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-red-400 gap-3">
        <AlertCircle size={32} />
        <span className="font-mono text-xs tracking-widest uppercase">Telemetry service offline</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <div>
           <h3 className="text-sm font-black tracking-widest uppercase text-white/90 font-mono">Speed & Pedal Comparison</h3>
           <p className="text-[10px] text-zinc-500 font-mono mt-1 italic italic-important decoration-red-500/30">Overlay of speed trace (solid) and throttle input (area). Distance in meters.</p>
        </div>
        <div className="flex items-center gap-2 text-zinc-500 bg-zinc-900/40 px-3 py-1.5 rounded-lg border border-zinc-800/40 shadow-inner">
           <Gauge size={12} strokeWidth={3} />
           <span className="text-[10px] font-black uppercase tracking-tighter">Fastest Lap Comparison</span>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col gap-8">
        {/* Speed Chart */}
        <div className="h-3/5 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
              <XAxis dataKey="distance" hide />
              <YAxis domain={['auto', 'auto']} stroke="#52525b" fontSize={10} unit="km/h" tickLine={false} axisLine={false} />
              <Tooltip 
                 labelFormatter={(v) => `Distance: ${Math.round(v)}m`}
                 contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px' }}
              />
              <Legend formatter={(v) => <span className="text-[9px] font-black uppercase tracking-tighter text-zinc-400 font-mono">{v.replace('_speed', '')}</span>} />
              {Object.keys(data).map(drv => (
                <Line 
                  key={drv} 
                  type="monotone" 
                  dataKey={`${drv}_speed`} 
                  name={`${drv}_speed`} 
                  stroke={`#${getTeamColor(null, null, drv)}`} 
                  strokeWidth={2} 
                  dot={false} 
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Throttle Chart */}
        <div className="h-2/5 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
              <XAxis dataKey="distance" stroke="#52525b" fontSize={10} unit="m" tickLine={false} axisLine={false} />
              <YAxis domain={[0, 100]} stroke="#52525b" fontSize={10} unit="%" tickLine={false} axisLine={false} />
              <Legend formatter={(v) => <span className="text-[9px] font-black uppercase tracking-tighter text-zinc-500 font-mono italic">{v.replace('_throttle', '')} (Throttle %)</span>} />
              {Object.keys(data).map(drv => (
                <Line 
                  key={drv} 
                  type="monotone" 
                  dataKey={`${drv}_throttle`} 
                  name={`${drv}_throttle`} 
                  stroke={`#${getTeamColor(null, null, drv)}90`} 
                  strokeWidth={1} 
                  dot={false} 
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
