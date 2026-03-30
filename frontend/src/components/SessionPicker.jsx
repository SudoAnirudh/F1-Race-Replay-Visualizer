import useSWR from 'swr';
import { useState, useEffect } from 'react';
import { ChevronDown, Radio, Loader2, Calendar, MapPin, Gauge } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const fetcher = url => fetch(url).then(r => r.json());

export function SessionPicker({ year: initialYear, round: initialRound, session: initialSession, onSelect }) {
  const [year, setYear] = useState(initialYear || 2024);
  const [round, setRound] = useState(initialRound || 1);
  const [session, setSession] = useState(initialSession || 'R');

  const { data: schedule, isLoading } = useSWR(
    `${API_BASE_URL}/schedule/${year}`,
    fetcher,
    { revalidateOnFocus: false, keepPreviousData: true }
  );

  const handleYearChange = (event) => {
    const newYear = Number(event.target.value);
    setYear(newYear);
    // Reset round when year changes, but wait for schedule to load or use first round
  };

  const handleRoundChange = (event) => {
    setRound(Number(event.target.value));
  };

  const handleSessionChange = (type) => {
    setSession(type);
  };

  // Trigger onSelect when any parameter changes
  useEffect(() => {
    if (year && round && session) {
      onSelect(year, round, session);
    }
  }, [year, round, session]);

  return (
    <div className="flex flex-wrap items-center gap-4 bg-zinc-900/40 border border-zinc-800/60 p-2 pl-4 rounded-2xl backdrop-blur-md">
      
      {/* Year Selector */}
      <div className="flex items-center gap-2">
        <Calendar size={14} className="text-zinc-500" />
        <select 
          value={year}
          onChange={handleYearChange}
          className="bg-transparent text-white text-sm font-bold outline-none cursor-pointer hover:text-red-500 transition-colors font-mono"
        >
          {[2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025].map(y => (
            <option key={y} value={y} className="bg-zinc-900">{y}</option>
          ))}
        </select>
      </div>

      <div className="w-px h-4 bg-zinc-800" />

      {/* Round Selector */}
      <div className="flex items-center gap-2 max-w-[200px]">
        <MapPin size={14} className="text-zinc-500" />
        <select 
          disabled={!schedule?.length}
          value={round}
          onChange={handleRoundChange}
          className="bg-transparent text-white text-sm font-bold outline-none cursor-pointer hover:text-red-500 transition-colors truncate disabled:opacity-30"
        >
          {schedule?.map(ev => (
            <option key={ev.RoundNumber} value={ev.RoundNumber} className="bg-zinc-900">
              R{ev.RoundNumber}: {ev.EventName}
            </option>
          ))}
        </select>
        {isLoading && <Loader2 size={12} className="animate-spin text-red-500" />}
      </div>

      <div className="w-px h-4 bg-zinc-800" />

      {/* Session Type Toggle */}
      <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
        {[
          { id: 'R', label: 'Race' },
          { id: 'Q', label: 'Qualy' },
          { id: 'S', label: 'Sprint' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => handleSessionChange(t.id)}
            className={`
              px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all duration-300
              ${session === t.id ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}
            `}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
