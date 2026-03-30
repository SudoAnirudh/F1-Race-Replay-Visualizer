import { useState, useCallback } from 'react';
import useSWR from 'swr';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
import { RaceSelector } from './components/RaceSelector';
import { ReplayCanvas } from './components/ReplayCanvas';
import { Leaderboard } from './components/Leaderboard';
import { PlaybackBar } from './components/PlaybackBar';
import { StatusBanner } from './components/StatusBanner';

const fetcher = url => fetch(url).then(r => r.json());

function App() {
  const [session, setSession] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [time, setTime] = useState(0);
  const [seekTime, setSeekTime] = useState(null);

  const { data, isValidating } = useSWR(
    session ? `${API_BASE_URL}/replay/${session.year}/${session.round}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const handleSelectRace = (year, round) => {
    setSession({ year, round });
    setPlaying(false);
    setTime(0);
    setSeekTime(0);
  };

  const handleTimeUpdate = useCallback((t) => {
    setTime(Math.max(0, t));
  }, []);

  const handleSeek = (t) => {
    setSeekTime(t);
    setTime(t);
  };

  return (
    <div className="h-screen w-screen bg-zinc-950 flex flex-col text-white overflow-hidden">
      <RaceSelector onSelect={handleSelectRace} />
      
      {data && <StatusBanner data={data} time={time} />}
      
      <main className="flex-1 flex flex-col lg:flex-row gap-3 lg:gap-4 p-3 lg:p-4 min-h-0 min-w-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900/50 to-zinc-950 overflow-y-auto lg:overflow-y-hidden">
        
        {/* Left Side: Canvas + Scrubber */}
        <div className="flex-1 flex flex-col h-full min-w-0 relative group">
          <div className="flex-1 min-h-0 relative">
            {session ? (
              <ReplayCanvas 
                data={data}
                playing={playing}
                speed={speed}
                seekTime={seekTime}
                onTimeUpdate={handleTimeUpdate}
                time={time}
              />
            ) : (
              <div className="flex-1 h-full border border-dashed border-zinc-800/40 rounded-2xl flex flex-col items-center justify-center text-zinc-600 bg-zinc-900/20 backdrop-blur-sm animate-fadeIn">
                <div className="relative mb-8">
                  {/* Animated car icon */}
                  <svg className="w-20 h-20 opacity-15" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
                  </svg>
                  {/* Pulse rings */}
                  <div className="absolute inset-0 -m-4 border border-zinc-800/20 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
                  <div className="absolute inset-0 -m-8 border border-zinc-800/10 rounded-full animate-ping" style={{ animationDuration: '4s' }} />
                </div>
                <div className="text-lg font-bold tracking-[0.2em] uppercase text-glow-red">Select a Race</div>
                <div className="text-xs mt-2 opacity-40 font-mono tracking-wider">Choose a Grand Prix above to start replay</div>
                
                {/* Grid pattern decoration */}
                <div className="absolute inset-0 opacity-[0.02] pointer-events-none" 
                  style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}
                />
              </div>
            )}
          </div>

          <PlaybackBar 
            playing={playing}
            setPlaying={setPlaying}
            speed={speed}
            setSpeed={setSpeed}
            time={time}
            duration={data?.duration_seconds || 0}
            onSeek={handleSeek}
          />
        </div>

        {/* Right Side: Leaderboard */}
        <div className="w-full lg:w-72 h-96 lg:h-full flex flex-col shrink-0 mb-4 lg:mb-0">
          <Leaderboard data={data} time={time} />
        </div>

      </main>
    </div>
  );
}

export default App;
