import { useEffect, useRef, useState, useCallback } from 'react';
import { useReplayEngine } from '../hooks/useReplayEngine';
import { TelemetryPanel } from './TelemetryPanel';
import { F1WheelSpinner } from './F1WheelSpinner';

export function ReplayCanvas({ data, playing, speed, seekTime, onTimeUpdate, time }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [selectedDriver, setSelectedDriver] = useState(null);

  // Handle Resize
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const handleCarClick = useCallback((driverNum, driverData) => {
    setSelectedDriver(prev => {
      if (prev && prev.code === driverData.code) return null;
      return driverData;
    });
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedDriver(null);
  }, []);

  useEffect(() => {
    setSelectedDriver(null);
  }, [data?.race_name]);

  useReplayEngine(
    canvasRef, data, playing, speed, onTimeUpdate, seekTime,
    selectedDriver?.code,
    handleCarClick
  );

  return (
    <div ref={containerRef} className="relative h-full w-full min-w-0 cursor-crosshair overflow-hidden">
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="block h-full w-full bg-zinc-900/50 rounded-xl border border-zinc-800/40 shadow-2xl"
      />
      
      {/* Loading state */}
      {!data && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-zinc-900/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-6 animate-fadeIn">
            <F1WheelSpinner size={90} />
            <div className="flex flex-col items-center gap-2">
              <p className="text-zinc-300 font-semibold tracking-[0.2em] text-sm uppercase">Loading Session Data</p>
              <p className="text-zinc-600 text-[11px] font-mono tracking-wide">Fetching high-fidelity telemetry...</p>
            </div>
          </div>
        </div>
      )}

      {/* Corner accent marks */}
      {data && (
        <>
          <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-zinc-700/40 rounded-tl pointer-events-none" />
          <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-zinc-700/40 rounded-tr pointer-events-none" />
          <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-zinc-700/40 rounded-bl pointer-events-none" />
          <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-zinc-700/40 rounded-br pointer-events-none" />
        </>
      )}

      {/* Click hint */}
      {data && !selectedDriver && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-zinc-900/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-zinc-800/30 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-1.5 h-1.5 rounded-full bg-f1red animate-pulse" />
          <span className="text-[9px] text-zinc-400 font-mono tracking-wider uppercase">Click a car for telemetry</span>
        </div>
      )}
      
      {/* Telemetry overlay panel */}
      {selectedDriver && data && (
        <TelemetryPanel
          driver={selectedDriver}
          time={time}
          onClose={handleClosePanel}
        />
      )}
    </div>
  );
}
