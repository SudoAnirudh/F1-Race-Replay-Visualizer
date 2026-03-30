import { useMemo } from 'react';
import { getTeamColor } from '../utils/teamColors';
import { useLapTimes } from '../hooks/useAnalytics';
import { Check, User, Info } from 'lucide-react';

export function DriverSelector({ selected = [], onChange, max = 5, year, round, session }) {
  const { data: lapData, isLoading } = useLapTimes(year, round, session);

  const drivers = useMemo(() => {
    if (!lapData) return [];
    const uniqueDrivers = new Set();
    lapData.forEach(lap => uniqueDrivers.add(lap.Driver));
    return Array.from(uniqueDrivers).sort();
  }, [lapData]);

  const toggleDriver = (driver) => {
    if (selected.includes(driver)) {
      onChange(selected.filter(d => d !== driver));
    } else if (selected.length < max) {
      onChange([...selected, driver]);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-wrap gap-2 animate-pulse">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="w-16 h-8 bg-zinc-800 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {drivers.map(drv => {
          const isSelected = selected.includes(drv);
          const teamColor = `#${getTeamColor(null, null, drv)}`; // Some logic to get team color from driver code
          
          return (
            <button
              key={drv}
              onClick={() => toggleDriver(drv)}
              className={`
                relative h-9 px-3 rounded-lg flex items-center gap-2 border transition-all duration-300
                ${isSelected 
                  ? 'bg-zinc-800 border-zinc-700 shadow-lg' 
                  : 'bg-zinc-900/40 border-zinc-800/60 hover:bg-zinc-800/40 opacity-50 hover:opacity-100'}
              `}
            >
              <div 
                className="w-1.5 h-4 rounded-full" 
                style={{ backgroundColor: teamColor }} 
              />
              <span className={`text-xs font-black tracking-tight ${isSelected ? 'text-white' : 'text-zinc-500'}`}>
                {drv}
              </span>
              {isSelected && <Check size={10} className="text-red-500" />}
            </button>
          );
        })}
      </div>
      
      {selected.length === max && (
        <div className="flex items-start gap-2 text-red-400 bg-red-400/5 p-3 rounded-xl border border-red-400/20">
          <Info size={14} className="shrink-0 mt-0.5" />
          <p className="text-[10px] font-mono leading-relaxed tracking-tight">
            Comparison limit reached. Deselect a driver to add a new one.
          </p>
        </div>
      )}
    </div>
  );
}
