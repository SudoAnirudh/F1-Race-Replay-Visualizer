import { Play, Pause, FastForward } from "lucide-react";

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function PlaybackBar({ playing, setPlaying, speed, setSpeed, time, duration, onSeek }) {
  const speeds = [0.5, 1, 2, 5, 10];

  return (
    <div className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 p-4 rounded-xl shadow-lg mt-4 h-16">
      <button 
        onClick={() => setPlaying(!playing)}
        className="w-10 h-10 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 rounded-full transition-colors text-white"
      >
        {playing ? <Pause size={20} /> : <Play size={20} className="ml-1" />}
      </button>

      <div className="flex-1 flex items-center gap-4">
        <span className="font-mono text-sm text-zinc-400 w-12 text-right">{formatTime(time)}</span>
        <input 
          type="range" 
          min="0" 
          max={duration || 100} 
          step="0.1"
          value={time || 0}
          onChange={(e) => onSeek(parseFloat(e.target.value))}
          className="flex-1 h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-f1red"
        />
        <span className="font-mono text-sm w-12 text-zinc-400">{formatTime(duration)}</span>
      </div>

      <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg">
        <FastForward size={16} className="text-zinc-500 mr-2 ml-2" />
        {speeds.map(s => (
          <button
            key={s}
            onClick={() => setSpeed(s)}
            className={`px-2 py-1 text-xs font-bold rounded-md transition-colors ${
              speed === s 
                ? 'bg-f1red text-white' 
                : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            {s}x
          </button>
        ))}
      </div>
    </div>
  );
}
