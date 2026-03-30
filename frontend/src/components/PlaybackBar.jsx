import { Play, Pause, FastForward, SkipBack, Volume2 } from "lucide-react";

function formatTime(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function PlaybackBar({ playing, setPlaying, speed, setSpeed, time, duration, onSeek }) {
  const speeds = [0.5, 1, 2, 5, 10];
  const progress = duration ? (time / duration) * 100 : 0;

  return (
    <div className="relative flex items-center gap-3 glass-strong p-3 rounded-xl shadow-2xl mt-3 h-14 animate-fadeInUp group">
      {/* Progress glow line at top */}
      <div className="absolute top-0 left-0 right-0 h-[1px] rounded-t-xl overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-f1red to-f1red/60 transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Play/Pause button */}
      <button 
        onClick={() => setPlaying(!playing)}
        className={`w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 text-white shrink-0 ${
          playing 
            ? 'bg-f1red shadow-lg shadow-f1red/30 hover:shadow-f1red/50 hover:scale-105' 
            : 'bg-zinc-800 hover:bg-zinc-700 hover:scale-105'
        }`}
      >
        {playing ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
      </button>

      {/* Reset button */}
      <button
        onClick={() => onSeek(0)}
        className="w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-800/60 hover:bg-zinc-700 transition-all duration-200 text-zinc-400 hover:text-white shrink-0"
      >
        <SkipBack size={14} />
      </button>

      {/* Time + Scrubber */}
      <div className="flex-1 flex items-center gap-3 min-w-0">
        <span className="font-mono text-xs text-zinc-400 w-14 text-right tabular-nums shrink-0">
          {formatTime(time)}
        </span>
        
        <div className="flex-1 relative group/slider">
          <input 
            type="range" 
            min="0" 
            max={duration || 100} 
            step="0.1"
            value={time || 0}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
            className="flex-1 w-full h-1 rounded-lg appearance-none cursor-pointer"
            style={{ '--progress': `${progress}%` }}
          />
        </div>
        
        <span className="font-mono text-xs w-14 text-zinc-500 tabular-nums shrink-0">
          {formatTime(duration)}
        </span>
      </div>

      {/* Speed controls */}
      <div className="flex items-center gap-0.5 bg-zinc-900/80 p-1 rounded-lg border border-zinc-800/40 shrink-0">
        <FastForward size={12} className="text-zinc-600 mx-1.5" />
        {speeds.map(s => (
          <button
            key={s}
            onClick={() => setSpeed(s)}
            className={`px-2 py-1 text-[10px] font-bold font-mono rounded-md transition-all duration-200 ${
              speed === s 
                ? 'bg-f1red text-white shadow-sm shadow-f1red/20 scale-105' 
                : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
            }`}
          >
            {s}×
          </button>
        ))}
      </div>
    </div>
  );
}
