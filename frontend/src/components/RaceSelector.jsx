import useSWR from 'swr';
import { useState } from 'react';

const fetcher = url => fetch(url).then(r => r.json());

export function RaceSelector({ onSelect, disabled }) {
  const [year, setYear] = useState(2023);
  
  const { data: schedule } = useSWR(
    `http://localhost:8080/schedule/${year}`,
    fetcher
  );

  return (
    <div className="flex gap-4 items-center bg-zinc-900 px-6 py-3 border-b border-zinc-800 shadow-md">
      <div className="flex bg-f1red px-3 py-1 rounded text-white font-black italic tracking-tighter text-2xl mr-4 shadow-lg">
        F1<span className="text-zinc-950 ml-1">REPLAY</span>
      </div>
      
      <div className="flex flex-col">
        <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Season</label>
        <select 
          disabled={disabled}
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="bg-zinc-800 border-none text-white text-sm rounded-md px-3 py-1.5 outline-none cursor-pointer hover:bg-zinc-700 transition font-mono"
        >
          {[2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025].map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col flex-1 max-w-sm">
        <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Race Selection</label>
        <select 
          disabled={disabled || !schedule}
          onChange={(e) => onSelect(year, Number(e.target.value))}
          className="bg-zinc-800 border-none text-white text-sm rounded-md px-3 py-1.5 outline-none cursor-pointer hover:bg-zinc-700 transition w-full"
        >
          <option value="">-- Choose a Grand Prix --</option>
          {schedule?.map(ev => (
            <option key={ev.RoundNumber} value={ev.RoundNumber}>
              Round {ev.RoundNumber} - {ev.EventName} ({ev.Country})
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
