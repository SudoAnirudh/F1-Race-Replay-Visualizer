import { AlertTriangle, Flag, ShieldAlert, CheckCircle } from "lucide-react";

export function StatusBanner({ data, time }) {
  if (!data || !data.track_status) return null;

  // Find the active status that encapsulates the current time
  // track_status events are sequential in time. The last event whose time <= current time is active.
  const activeEvent = [...data.track_status].reverse().find(e => time >= e.time);
  
  if (!activeEvent || activeEvent.status === "1") return null;

  let color = "bg-zinc-800 text-white";
  let label = "TRACK STATUS";
  let Icon = AlertTriangle;

  if (activeEvent.status === "4") {
    color = "bg-yellow-500 text-black";
    label = "SAFETY CAR";
    Icon = ShieldAlert;
  } else if (activeEvent.status === "5") {
    color = "bg-f1red text-white";
    label = "RED FLAG";
    Icon = Flag;
  } else if (activeEvent.status === "6") {
    color = "bg-yellow-300 text-black";
    label = "VIRTUAL SAFETY CAR";
    Icon = ShieldAlert;
  } else if (activeEvent.status === "2") {
    color = "bg-yellow-500 text-black";
    label = "YELLOW FLAG";
    Icon = Flag;
  }

  return (
    <div className={`w-full ${color} shadow-lg py-3 px-6 flex items-center justify-center gap-4 border-b border-white/10 relative z-10 transition-colors duration-500 font-bold tracking-[0.2em] animate-pulse`}>
      <Icon size={24} />
      <span>{label}</span>
      <Icon size={24} />
      <span className="absolute right-4 text-xs font-mono opacity-80 backdrop-blur top-1/2 -translate-y-1/2">
        {activeEvent.message}
      </span>
    </div>
  );
}
