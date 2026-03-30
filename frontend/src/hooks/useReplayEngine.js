import { useRef, useEffect, useCallback } from 'react';
import { interpolate } from '../utils/interpolate';
import { buildViewport, toCanvas } from '../utils/normalize';

export function useReplayEngine(canvasRef, data, playing, speed, onTimeUpdate, seekTime, selectedDriverCode, onCarClick) {
  const timeRef = useRef(0);
  const prevMsRef = useRef(null);
  const rafRef = useRef(null);
  const carPositionsRef = useRef([]);
  
  // Handle seekTime changes from scrubber
  useEffect(() => {
    if (seekTime !== null && seekTime !== undefined) {
      timeRef.current = seekTime;
      if (!playing && canvasRef.current && data) {
        requestAnimationFrame((now) => tick(now, true));
      }
    }
  }, [seekTime, data, playing]);

  // Draw first frame when data loads
  useEffect(() => {
    if (data && canvasRef.current && !playing) {
      timeRef.current = 0;
      requestAnimationFrame((now) => tick(now, true));
    }
  }, [data]);

  // Click handler for car selection
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !onCarClick) return;

    const handleClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      const HIT_RADIUS = 16;
      let closestDist = Infinity;
      let closestDriver = null;

      for (const cp of carPositionsRef.current) {
        const dx = mx - cp.x;
        const dy = my - cp.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < HIT_RADIUS && dist < closestDist) {
          closestDist = dist;
          closestDriver = cp;
        }
      }

      if (closestDriver) {
        onCarClick(closestDriver.driverNum, closestDriver.driverData);
      }
    };

    canvas.addEventListener('click', handleClick);
    return () => canvas.removeEventListener('click', handleClick);
  }, [canvasRef.current, onCarClick]);

  function tick(wallMs, force = false) {
    if (!data) return;
    
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

    const viewport = buildViewport(data.track, W, H);

    // 1. Clear
    ctx.clearRect(0, 0, W, H);

    // 2. Draw track
    drawTrack(ctx, data.track, viewport);

    // 3. Draw cars
    const newCarPositions = [];
    for (const [num, drv] of Object.entries(data.drivers)) {
      const pos = interpolate(drv.positions, timeRef.current);
      if (pos) {
        const isSelected = selectedDriverCode === drv.code;
        const [cx, cy] = drawCar(ctx, pos, drv, viewport, timeRef.current, isSelected);
        newCarPositions.push({ x: cx, y: cy, driverNum: num, driverData: drv });
      }
    }
    carPositionsRef.current = newCarPositions;

    // 4. Update time EVERY FRAME for smooth progress bar
    onTimeUpdate(timeRef.current);

    if (playing && timeRef.current < data.duration_seconds) {
      rafRef.current = requestAnimationFrame((now) => tick(now));
    }
  }

  useEffect(() => {
    if (playing) {
      prevMsRef.current = null;
      rafRef.current = requestAnimationFrame((now) => tick(now));
    } else {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      prevMsRef.current = null;
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playing, speed, data, selectedDriverCode]);
}

function drawTrack(ctx, track, vp) {
  if (!track || track.length === 0) return;
  
  // Outer track
  ctx.beginPath();
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 14;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  track.forEach((pt, i) => {
    const [x, y] = toCanvas(pt.x, pt.y, vp);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.stroke();

  // Main track surface
  ctx.beginPath();
  ctx.strokeStyle = '#2a2a2a';
  ctx.lineWidth = 10;
  track.forEach((pt, i) => {
    const [x, y] = toCanvas(pt.x, pt.y, vp);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.stroke();
  
  // Center line
  ctx.beginPath();
  ctx.strokeStyle = '#353535';
  ctx.lineWidth = 1;
  ctx.setLineDash([8, 12]);
  track.forEach((pt, i) => {
    const [x, y] = toCanvas(pt.x, pt.y, vp);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.stroke();
  ctx.setLineDash([]);

  // Start/finish marker (first point)
  if (track.length > 0) {
    const [sx, sy] = toCanvas(track[0].x, track[0].y, vp);
    ctx.fillStyle = '#e10600';
    ctx.globalAlpha = 0.6;
    ctx.fillRect(sx - 2, sy - 8, 4, 16);
    ctx.globalAlpha = 1;
  }
}

function drawCar(ctx, pos, drv, vp, currentTime, isSelected) {
  const [x, y] = toCanvas(pos.x, pos.y, vp);
  const isPitting = drv.pit_windows.some(
    pw => currentTime >= pw.in_time && currentTime <= (pw.out_time ?? pw.in_time + 35)
  );

  const carColor = `#${drv.color || 'CCCCCC'}`;

  // Selected driver highlight
  if (isSelected) {
    const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 300);
    
    // Outer pulse ring
    ctx.beginPath();
    ctx.strokeStyle = carColor;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.2 + pulse * 0.3;
    ctx.arc(x, y, 16 + pulse * 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Inner glow ring
    ctx.beginPath();
    ctx.strokeStyle = carColor;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.7;
    ctx.arc(x, y, 11, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Radial glow
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, 20);
    gradient.addColorStop(0, carColor + '30');
    gradient.addColorStop(1, carColor + '00');
    ctx.beginPath();
    ctx.fillStyle = gradient;
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();
  }

  // Car dot with glow
  ctx.beginPath();
  ctx.fillStyle = isPitting ? '#FFFFFF' : carColor;
  ctx.shadowColor = isPitting ? '#FFFFFF' : carColor;
  ctx.shadowBlur = isSelected ? 20 : (isPitting ? 4 : 10);
  ctx.arc(x, y, isSelected ? 7 : 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // White center dot
  ctx.beginPath();
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.arc(x, y, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Driver label
  ctx.fillStyle = isSelected ? '#FFFFFF' : 'rgba(255,255,255,0.7)';
  ctx.font = isSelected ? 'bold 11px "JetBrains Mono", monospace' : '600 9px "JetBrains Mono", monospace';
  ctx.fillText(drv.code, x + 10, y + 3);

  return [x, y];
}
