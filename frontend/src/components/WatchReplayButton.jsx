import { useNavigate } from 'react-router-dom';
import { Play, ExternalLink } from 'lucide-react';

export function WatchReplayButton({ year, round, session }) {
  const navigate = useNavigate();
  
  // Only show for Race sessions as Replay typically covers full race
  if (session !== 'R') return null;

  return (
    <button
      onClick={() => navigate(`/replay?year=${year}&round=${round}`)}
      className="group relative flex items-center gap-3 px-6 py-3 bg-red-600 rounded-2xl text-white font-bold transition-all duration-500 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(220,38,38,0.1)] hover:shadow-red-600/30 overflow-hidden"
    >
      {/* Background animated shine */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
      <div className="absolute inset-0 w-full h-[1px] bg-white/20 translate-y-[-100%] group-hover:translate-y-[100%] transition-transform duration-1000 ease-out pointer-events-none" />
      
      <div className="bg-white/10 p-1.5 rounded-lg group-hover:bg-white/20 transition-colors">
        <Play size={14} fill="currentColor" stroke="none" />
      </div>
      <div className="flex flex-col items-start leading-none">
        <span className="text-[9px] uppercase tracking-widest text-white/50 mb-1 group-hover:text-white/70">Visualizer</span>
        <span className="text-sm font-black tracking-tight">WATCH REPLAY</span>
      </div>
      <ExternalLink size={14} className="opacity-40 group-hover:opacity-100" />
    </button>
  );
}
