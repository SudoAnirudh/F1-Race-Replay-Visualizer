import { useRef, useEffect } from 'react';
import { interpolate } from '../utils/interpolate';
import { buildViewport, toCanvas } from '../utils/normalize';

export function useReplayEngine(canvasRef, data, playing, speed, onTimeUpdate, seekTime) {
  const timeRef = useRef(0);
  const prevMsRef = useRef(null);
  const rafRef = useRef(null);
  
  // Handle seekTime changes from scrubber
  useEffect(() => {
    if (seekTime !== null && seekTime !== undefined) {
      timeRef.current = seekTime;
      // Manually trigger a single tick if paused so canvas updates immediately
      if (!playing && canvasRef.current && data) {
        requestAnimationFrame((now) => tick(now, true));
      }
    }
  }, [seekTime, data, playing]);

  function tick(wallMs, force = false) {
    if (!data) return;
    
    // Time tracking
    if (prevMsRef.current !== null && !force) {
      const delta = ((wallMs - prevMsRef.current) / 1000) * speed;
      timeRef.current = Math.min(timeRef.current + delta, data.duration_seconds);
    }
    if (!force) prevMsRef.current = wallMs;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    // Normalize track coordinates to canvas viewport
    const viewport = buildViewport(data.track, W, H);

    // 1. Clear
    ctx.clearRect(0, 0, W, H);

    // 2. Draw static track outline
    drawTrack(ctx, data.track, viewport);

    // 3. Interpolate + draw each car
    for (const [num, drv] of Object.entries(data.drivers)) {
      const pos = interpolate(drv.positions, timeRef.current);
      if (pos) drawCar(ctx, pos, drv, viewport, timeRef.current);
    }

    // 4. Notify parent every second
    if (Math.floor(timeRef.current) !== Math.floor(timeRef.current - ((wallMs - prevMsRef.current) / 1000) * speed) || force) {
      onTimeUpdate(timeRef.current);
    }

    if (playing && timeRef.current < data.duration_seconds) {
      rafRef.current = requestAnimationFrame((now) => tick(now));
    }
  }

  useEffect(() => {
    if (playing) {
      prevMsRef.current = null; // reset clock
      rafRef.current = requestAnimationFrame((now) => tick(now));
    } else {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      prevMsRef.current = null;
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playing, speed, data]);
}

function drawTrack(ctx, track, vp) {
  if (!track || track.length === 0) return;
  ctx.beginPath();
  ctx.strokeStyle = '#2a2a2a';
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  track.forEach((pt, i) => {
    const [x, y] = toCanvas(pt.x, pt.y, vp);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.stroke();
  
  // Inner line for aesthetic
  ctx.beginPath();
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  track.forEach((pt, i) => {
    const [x, y] = toCanvas(pt.x, pt.y, vp);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.stroke();
}

function drawCar(ctx, pos, drv, vp, currentTime) {
  const [x, y] = toCanvas(pos.x, pos.y, vp);
  const isPitting = drv.pit_windows.some(
    pw => currentTime >= pw.in_time && currentTime <= (pw.out_time ?? pw.in_time + 35)
  );

  // Car dot
  ctx.beginPath();
  ctx.fillStyle = isPitting ? '#FFFFFF' : `#${drv.color || 'CCCCCC'}`;
  ctx.shadowColor = `#${drv.color || 'CCCCCC'}`;
  ctx.shadowBlur = isPitting ? 0 : 8;
  ctx.arc(x, y, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Driver label
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 10px monospace';
  ctx.fillText(drv.code, x + 10, y + 4);
}
