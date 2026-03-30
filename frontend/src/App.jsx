import { useState, useCallback } from 'react';
import useSWR from 'swr';
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
    session ? `http://localhost:8080/replay/${session.year}/${session.round}` : null,
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
    <div className="h-screen w-screen bg-zinc-950 flex flex-col text-white font-sans overflow-hidden">
      <RaceSelector onSelect={handleSelectRace} disabled={isValidating} />
      
      {data && <StatusBanner data={data} time={time} />}
      
      <main className="flex-1 flex gap-6 p-6 min-h-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900 to-zinc-950">
        
        {/* Left Side: Canvas + Scrubber */}
        <div className="flex-1 flex flex-col h-full relative">
          <div className="flex-1 min-h-0 relative">
            {session ? (
              <ReplayCanvas 
                data={data}
                playing={playing}
                speed={speed}
                seekTime={seekTime}
                onTimeUpdate={handleTimeUpdate}
              />
            ) : (
              <div className="flex-1 h-full border border-dashed border-zinc-700/50 rounded-2xl flex flex-col items-center justify-center text-zinc-600 bg-zinc-900/20 backdrop-blur-sm">
                <svg className="w-24 h-24 mb-6 opacity-20" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 3.5L18.5 10H13V5.5zM6 20V4h5v7h7v9H6z"/></svg>
                <div className="text-xl font-bold tracking-widest uppercase">Select a Race to Load Telemetry</div>
                <div className="text-sm mt-2 opacity-50 font-mono">Fetching ~20MB of high-fidelity position data</div>
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
        <div className="w-80 h-full flex flex-col shrink-0">
          <Leaderboard data={data} time={time} />
        </div>

      </main>
    </div>
  );
}

export default App;
