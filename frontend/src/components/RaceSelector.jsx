import useSWR from 'swr';
import { useState } from 'react';
import { ChevronDown, Radio, Loader2 } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const fetcher = url => fetch(url).then(r => r.json());

export function RaceSelector({ onSelect }) {
  const [year, setYear] = useState(2023);
  const [round, setRound] = useState('');

  const { data: schedule, isLoading } = useSWR(
    `${API_BASE_URL}/schedule/${year}`,
    fetcher,
    { revalidateOnFocus: false, keepPreviousData: true }
  );

  const handleYearChange = (event) => {
    setYear(Number(event.target.value));
    setRound('');
  };

  const handleRoundChange = (event) => {
    const nextRound = event.target.value;
    setRound(nextRound);
    if (!nextRound) return;
    onSelect(year, Number(nextRound));
  };

  return (
    <div className="relative flex flex-col sm:flex-row flex-wrap gap-4 items-start sm:items-center px-4 sm:px-6 py-3 border-b border-zinc-800/60 glass-strong z-20">
      {/* Subtle gradient line at top */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-f1red/40 to-transparent" />
      
      {/* Logo */}
      <div className="flex items-center gap-2 sm:mr-4 group cursor-default">
        <div className="relative bg-f1red px-3 py-1.5 rounded-md text-white font-black italic tracking-tighter text-xl shadow-lg shadow-f1red/20 group-hover:shadow-f1red/40 transition-shadow duration-300">
          F1
          <span className="text-zinc-950 ml-0.5">REPLAY</span>
          {/* Scan line effect */}
          <div className="absolute inset-0 overflow-hidden rounded-md pointer-events-none">
            <div className="absolute left-0 w-full h-[1px] bg-white/20" style={{ animation: 'scan 3s linear infinite' }} />
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-zinc-600">
          <Radio size={10} className="text-f1red animate-pulse" />
          <span className="text-[9px] font-mono tracking-[0.2em] uppercase">Live Telemetry</span>
        </div>
      </div>
      
      {/* Season selector */}
      <div className="flex flex-col animate-fadeIn">
        <label className="text-[9px] text-zinc-500 font-semibold uppercase tracking-[0.2em] mb-1.5 flex items-center gap-1.5">
          <div className="w-1 h-1 rounded-full bg-f1red" />
          Season
        </label>
        <select 
          value={year}
          onChange={handleYearChange}
          className="bg-zinc-800/80 border border-zinc-700/40 text-white text-sm rounded-lg px-3 py-2 outline-none cursor-pointer hover:bg-zinc-700/80 hover:border-zinc-600/50 transition-all duration-200 font-mono focus:ring-1 focus:ring-f1red/30"
        >
          {[2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025].map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Race selector */}
      <div className="flex flex-col flex-1 max-w-md animate-fadeIn" style={{ animationDelay: '0.1s' }}>
        <label className="text-[9px] text-zinc-500 font-semibold uppercase tracking-[0.2em] mb-1.5 flex items-center gap-1.5">
          <div className="w-1 h-1 rounded-full bg-zinc-600" />
          Grand Prix
          {isLoading && <Loader2 size={10} className="animate-spin text-zinc-500" />}
        </label>
        <select 
          disabled={!schedule?.length}
          value={round}
          onChange={handleRoundChange}
          className="bg-zinc-800/80 border border-zinc-700/40 text-white text-sm rounded-lg px-3 py-2 outline-none cursor-pointer hover:bg-zinc-700/80 hover:border-zinc-600/50 transition-all duration-200 w-full disabled:opacity-40 disabled:cursor-not-allowed focus:ring-1 focus:ring-f1red/30"
        >
          <option value="">
            {isLoading && !schedule?.length ? '⏳ Loading schedule...' : '🏁 Choose a Grand Prix'}
          </option>
          {schedule?.map(ev => (
            <option key={ev.RoundNumber} value={ev.RoundNumber}>
              R{ev.RoundNumber} — {ev.EventName} ({ev.Country})
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
