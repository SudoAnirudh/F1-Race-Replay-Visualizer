import { useEffect, useRef, useState } from 'react';
import { useReplayEngine } from '../hooks/useReplayEngine';

export function ReplayCanvas({ data, playing, speed, seekTime, onTimeUpdate }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

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

  useReplayEngine(canvasRef, data, playing, speed, onTimeUpdate, seekTime);

  return (
    <div ref={containerRef} className="relative h-full w-full min-w-0 cursor-crosshair overflow-hidden">
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="block h-full w-full bg-zinc-900 rounded-xl border border-zinc-800 shadow-2xl"
      />
      {!data && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center animate-pulse">
            <div className="w-16 h-16 border-4 border-zinc-700 border-t-f1red rounded-full animate-spin"></div>
            <p className="mt-4 text-zinc-400 font-medium tracking-widest">LOADING SESSION TELEMETRY...</p>
          </div>
        </div>
      )}
    </div>
  );
}
