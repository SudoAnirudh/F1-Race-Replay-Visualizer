import { 
  BarChart3, LineChart, PieChart, Activity, Map, ArrowUpCircle 
} from 'lucide-react';

const TABS = [
  { id: 'lap-times', label: 'Lap Times', icon: Activity, description: 'All lap times scatter', types: ['R', 'Q', 'S'] },
  { id: 'telemetry', label: 'Telemetry', icon: LineChart, description: 'Speed & Throttle overlay', types: ['R', 'Q', 'S'] },
  { id: 'strategy', label: 'Strategy', icon: Map, description: 'Tyre compound stints', types: ['R'] },
  { id: 'team-pace', label: 'Team Pace', icon: BarChart3, description: 'Median representative pace', types: ['R'] },
  { id: 'sectors', label: 'Sectors', icon: PieChart, description: 'Fastest lap breakdown', types: ['R', 'Q', 'S'] },
  { id: 'positions', label: 'Positions', icon: ArrowUpCircle, description: 'Race position tracker', types: ['R'] }
];

export function ViewTabs({ active, onChange, sessionType = 'R' }) {
  return (
    <div className="flex flex-wrap items-center gap-2 bg-zinc-900/40 p-1.5 rounded-2xl border border-zinc-800/60 backdrop-blur-md">
      {TABS.map(tab => {
        const isActive = active === tab.id;
        const isDisabled = !tab.types.includes(sessionType);
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            disabled={isDisabled}
            onClick={() => onChange(tab.id)}
            className={`
              relative group flex items-center gap-2.5 px-4 py-2 rounded-xl transition-all duration-500
              ${isActive ? 'bg-red-600 text-white shadow-xl shadow-red-600/20' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}
              ${isDisabled ? 'opacity-20 cursor-not-allowed scale-95' : 'hover:scale-105 active:scale-95'}
            `}
          >
            <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-xs font-bold whitespace-nowrap tracking-tight uppercase font-mono">
              {tab.label}
            </span>
            
            {/* Tooltip for disabled state */}
            {isDisabled && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-2 py-1 bg-zinc-800 text-[9px] text-zinc-400 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                Not available for {sessionType === 'Q' ? 'Qualy' : sessionType === 'S' ? 'Sprint' : 'this session'}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
