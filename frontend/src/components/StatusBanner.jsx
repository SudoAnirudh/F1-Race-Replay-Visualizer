import { AlertTriangle, Flag, ShieldAlert } from "lucide-react";

export function StatusBanner({ data, time }) {
  if (!data || !data.track_status) return null;

  const activeEvent = [...data.track_status].reverse().find(e => time >= e.time);
  
  if (!activeEvent || activeEvent.status === "1") return null;

  let bgClass = "bg-zinc-800 text-white";
  let label = "TRACK STATUS";
  let Icon = AlertTriangle;
  let glowColor = "rgba(255,255,255,0.1)";

  if (activeEvent.status === "4") {
    bgClass = "bg-gradient-to-r from-yellow-500 to-amber-500 text-black";
    label = "⚠ SAFETY CAR DEPLOYED";
    Icon = ShieldAlert;
    glowColor = "rgba(234,179,8,0.3)";
  } else if (activeEvent.status === "5") {
    bgClass = "bg-gradient-to-r from-red-600 to-f1red text-white";
    label = "🔴 RED FLAG — SESSION STOPPED";
    Icon = Flag;
    glowColor = "rgba(225,6,0,0.4)";
  } else if (activeEvent.status === "6") {
    bgClass = "bg-gradient-to-r from-yellow-300 to-amber-400 text-black";
    label = "⚠ VIRTUAL SAFETY CAR";
    Icon = ShieldAlert;
    glowColor = "rgba(234,179,8,0.3)";
  } else if (activeEvent.status === "2") {
    bgClass = "bg-gradient-to-r from-yellow-500 to-amber-500 text-black";
    label = "⚠ YELLOW FLAG";
    Icon = Flag;
    glowColor = "rgba(234,179,8,0.3)";
  }

  return (
    <div 
      className={`w-full ${bgClass} py-2.5 px-6 flex items-center justify-center gap-3 relative z-10 font-bold tracking-[0.15em] text-sm animate-slideDown`}
      style={{ boxShadow: `0 4px 30px ${glowColor}` }}
    >
      {/* Animated stripes overlay */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 20px, currentColor 20px, currentColor 22px)',
            animation: 'shimmer 1s linear infinite',
            backgroundSize: '200% 100%',
          }}
        />
      </div>

      <Icon size={18} className="shrink-0" />
      <span className="truncate">{label}</span>
      <Icon size={18} className="shrink-0" />
      
      <span className="absolute right-4 text-[10px] font-mono opacity-70 top-1/2 -translate-y-1/2 hidden sm:block">
        {activeEvent.message}
      </span>
    </div>
  );
}
