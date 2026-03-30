import { useMemo } from 'react';
import { X, Gauge, Zap, Flame, Radio } from 'lucide-react';
import { useDriverTelemetry } from '../hooks/useDriverTelemetry';
import { SpeedTrace } from './SpeedTrace';

/**
 * TelemetryPanel — live telemetry overlay for the selected driver.
 * Shows speed, RPM, throttle %, brake %, gear, DRS, and a scrolling speed trace.
 */
export function TelemetryPanel({ driver, time, onClose }) {
  const { getTelemetryAtTime, stats } = useDriverTelemetry(driver?.telemetry);
  const current = getTelemetryAtTime(time);

  if (!driver || !current) return null;

  const teamColor = `#${driver.color || 'CCCCCC'}`;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 animate-slideUp">
      {/* Team color accent line with glow */}
      <div 
        className="h-[2px] w-full" 
        style={{ 
          background: `linear-gradient(90deg, ${teamColor}, ${teamColor}60, transparent)`,
          boxShadow: `0 -2px 15px ${teamColor}30`,
        }} 
      />
      
      <div className="bg-zinc-950/90 backdrop-blur-2xl border-t border-zinc-800/30">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-2.5 border-b border-zinc-800/20">
          <div className="flex items-center gap-3">
            <div 
              className="w-1.5 h-7 rounded-full" 
              style={{ backgroundColor: teamColor, boxShadow: `0 0 10px ${teamColor}40` }} 
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-black font-mono text-base tracking-wider">{driver.code}</span>
                <span className="text-[9px] text-zinc-500 bg-zinc-800/50 px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold">
                  #{driver.number || ''}
                </span>
              </div>
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider -mt-0.5">{driver.team}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-zinc-600">
              <Radio size={8} className="text-emerald-400 animate-pulse" />
              <span className="text-[8px] font-mono tracking-widest uppercase">Live</span>
            </div>
            <button 
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-zinc-800/50 hover:bg-zinc-700 hover:rotate-90 transition-all duration-300 text-zinc-400 hover:text-white"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Content: Gauges + Speed Trace */}
        <div className="flex gap-0 h-[165px]">
          {/* Gauges Section */}
          <div className="flex items-center gap-2 px-4 py-3 shrink-0">
            {/* Speed Gauge */}
            <GaugeCard 
              label="SPEED"
              value={Math.round(current.speed)}
              unit="km/h"
              max={stats.maxSpeed}
              color={teamColor}
              icon={<Gauge size={10} />}
            />
            
            {/* RPM Gauge */}
            <GaugeCard
              label="RPM"
              value={current.rpm}
              unit=""
              max={stats.maxRPM}
              color="#FF6B35"
              icon={<Zap size={10} />}
              formatValue={(v) => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v}
            />

            {/* Throttle Bar */}
            <VerticalBar
              label="THR"
              value={current.throttle}
              max={100}
              color="#22C55E"
              suffix="%"
            />

            {/* Brake Bar */}
            <VerticalBar
              label="BRK"
              value={current.brake}
              max={100}
              color="#EF4444"
              suffix="%"
            />

            {/* Gear indicator */}
            <div className="flex flex-col items-center justify-center w-14 h-full bg-zinc-900/50 rounded-lg border border-zinc-800/30 px-1 relative overflow-hidden">
              <span className="text-[7px] text-zinc-500 font-mono tracking-[0.2em]">GEAR</span>
              <span 
                className="text-3xl font-black font-mono mt-0.5 transition-all duration-100" 
                style={{ color: teamColor, textShadow: `0 0 12px ${teamColor}40` }}
              >
                {current.gear === 0 ? 'N' : current.gear}
              </span>
              {/* DRS indicator */}
              {current.drs > 0 && (
                <span className="absolute bottom-1.5 text-[6px] font-bold text-emerald-400 tracking-[0.15em] animate-pulse">DRS</span>
              )}
            </div>
          </div>

          {/* Speed Trace Chart */}
          <div className="flex-1 p-3 min-w-0">
            <div className="h-full rounded-lg border border-zinc-800/20 overflow-hidden bg-zinc-900/20">
              <SpeedTrace
                telemetry={driver.telemetry}
                time={time}
                color={driver.color}
                maxSpeed={stats.maxSpeed}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GaugeCard({ label, value, unit, max, color, icon, formatValue }) {
  const pct = Math.min(100, (value / max) * 100);
  const displayValue = formatValue ? formatValue(value) : value;

  return (
    <div className="flex flex-col items-center justify-between w-20 h-full bg-zinc-900/50 rounded-lg border border-zinc-800/30 p-2">
      <div className="flex items-center gap-1 text-zinc-500">
        {icon}
        <span className="text-[7px] font-mono tracking-[0.2em]">{label}</span>
      </div>
      
      {/* Arc gauge */}
      <div className="relative w-14 h-8 mt-1">
        <svg viewBox="0 0 60 35" className="w-full h-full">
          {/* Background arc */}
          <path
            d="M 5 30 A 25 25 0 0 1 55 30"
            fill="none"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Value arc */}
          <path
            d="M 5 30 A 25 25 0 0 1 55 30"
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${pct * 0.785} 100`}
            style={{ 
              filter: `drop-shadow(0 0 6px ${color}60)`,
              transition: 'stroke-dasharray 0.1s ease-out',
            }}
          />
        </svg>
      </div>
      
      <div className="text-center">
        <span 
          className="text-lg font-black font-mono leading-none transition-all duration-100" 
          style={{ color, textShadow: `0 0 8px ${color}30` }}
        >
          {displayValue}
        </span>
        {unit && <span className="text-[7px] text-zinc-600 ml-0.5">{unit}</span>}
      </div>
    </div>
  );
}

function VerticalBar({ label, value, max, color, suffix }) {
  const pct = Math.min(100, (value / max) * 100);

  return (
    <div className="flex flex-col items-center justify-between w-10 h-full bg-zinc-900/50 rounded-lg border border-zinc-800/30 p-2">
      <span className="text-[7px] text-zinc-500 font-mono tracking-[0.2em]">{label}</span>
      
      {/* Vertical bar */}
      <div className="flex-1 w-3 bg-zinc-800/30 rounded-full my-1.5 relative overflow-hidden">
        <div
          className="absolute bottom-0 left-0 w-full rounded-full transition-all duration-75"
          style={{
            height: `${pct}%`,
            backgroundColor: color,
            boxShadow: pct > 50 ? `0 0 10px ${color}50, inset 0 0 4px ${color}30` : 'none',
          }}
        />
      </div>
      
      <span className="text-[10px] font-bold font-mono tabular-nums" style={{ color }}>
        {Math.round(value)}{suffix}
      </span>
    </div>
  );
}
