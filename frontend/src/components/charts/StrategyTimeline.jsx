import { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, 
  Tooltip, ResponsiveContainer, Cell, LabelList,
  CartesianGrid
} from 'recharts';
import { useStrategy } from '../../hooks/useAnalytics';
import { getTeamColor } from '../../utils/teamColors';
import { Loader2, AlertCircle, Fuel } from 'lucide-react';

const TYRE_Fills = {
  'SOFT': '#ef4444',
  'MEDIUM': '#fbbf24',
  'HARD': '#f4f4f5',
  'INTERMEDIATE': '#10b981',
  'WET': '#3b82f6'
};

export default function StrategyTimeline({ year, round, selectedDrivers = [] }) {
  const { data, error, isLoading } = useStrategy(year, round);

  const chartData = useMemo(() => {
    if (!data) return [];
    
    // 1. Group data per driver
    const grouped = {};
    data.forEach(stint => {
      if (selectedDrivers.length > 0 && !selectedDrivers.includes(stint.Driver)) return;
      
      if (!grouped[stint.Driver]) grouped[stint.Driver] = [];
      grouped[stint.Driver].push(stint);
    });

    // 2. Prepare chart rows (one per driver)
    return Object.entries(grouped).map(([driver, stints]) => {
      // Create segments for the bar: { name: 'S1', value: lapCount, compound: 'SOFT' }
      const segments = stints
        .sort((a, b) => a.Stint - b.Stint)
        .map((s, i) => {
          // Calculate length of stint
          const nextStint = stints.find(ns => ns.Stint === s.Stint + 1);
          const stintLength = nextStint 
            ? nextStint.LapNumber - s.LapNumber 
            : 20; // Default estimate for last stint if unknown
            
          return {
            id: `${driver}-${s.Stint}`,
            driver,
            compound: s.Compound,
            laps: stintLength,
            startLap: s.LapNumber
          };
        });
        
      return { driver, segments };
    }).sort((a,b) => a.driver.localeCompare(b.driver));
  }, [data, selectedDrivers]);

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-3">
        <Loader2 className="animate-spin text-red-500" size={32} />
        <span className="font-mono text-xs tracking-widest uppercase">Analyzing pit strategies...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-red-400 gap-3">
        <AlertCircle size={32} />
        <span className="font-mono text-xs tracking-widest uppercase">Strategy info not found</span>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-zinc-700">
         <div className="text-center">
           <Fuel className="mx-auto mb-4 opacity-20" size={48} />
           <div className="font-mono text-sm tracking-widest uppercase opacity-40">Select drivers to see strategy</div>
         </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-sm font-black tracking-widest uppercase text-white/90 font-mono">Pit Stop Strategy Timeline</h3>
        <div className="flex gap-4">
          {Object.entries(TYRE_Fills).map(([name, fill]) => (
            <div key={name} className="flex items-center gap-1.5 opacity-60">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: fill }} />
              <span className="text-[9px] font-bold uppercase tracking-tighter text-zinc-400">{name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 custom-scrollbar">
        <div className="space-y-4">
          {chartData.map(row => {
            const teamColor = `#${getTeamColor(null, null, row.driver)}`;
            return (
              <div key={row.driver} className="flex items-center gap-4 group">
                <div className="w-12 shrink-0 flex items-center gap-2">
                  <div className="w-1 h-4 rounded-full" style={{ backgroundColor: teamColor }} />
                  <span className="text-[11px] font-black tracking-tighter font-mono group-hover:text-red-500 transition-colors">{row.driver}</span>
                </div>
                <div className="flex-1 h-6 flex gap-0.5 items-center">
                  {row.segments.map((seg, idx) => (
                    <div 
                      key={seg.id} 
                      className="h-full rounded-sm relative flex items-center justify-center hover:scale-[1.02] hover:brightness-110 cursor-help transition-all duration-300"
                      style={{ 
                        flex: seg.laps, 
                        backgroundColor: TYRE_Fills[seg.compound] || '#333',
                        minWidth: '15px'
                      }}
                    >
                      <span className="text-[8px] font-black text-black/60 truncate px-1">
                        {seg.laps}
                      </span>
                      {/* Tooltip Overlay */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap bg-zinc-900 border border-zinc-800 p-2 rounded shadow-2xl text-[10px] scale-90 group-hover:block hidden">
                        <span className="text-zinc-500 mr-2">Stint {idx + 1}:</span>
                        <span className="font-bold">{seg.compound} ({seg.laps} Laps)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Lap Axis labels */}
        <div className="flex items-center gap-4 mt-6 pt-4 border-t border-zinc-800/40">
           <div className="w-12" />
           <div className="flex-1 flex justify-between text-[10px] font-mono text-zinc-600 font-bold uppercase tracking-widest">
              <span>Lap 1</span>
              <span>Total Race Distance</span>
           </div>
        </div>
      </div>
    </div>
  );
}
