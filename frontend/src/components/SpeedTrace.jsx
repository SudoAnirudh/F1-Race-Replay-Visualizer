import { useRef, useEffect } from 'react';

/**
 * SpeedTrace — a scrolling canvas chart showing speed over time.
 * Shows a rolling 30-second window centered on the current time.
 */
export function SpeedTrace({ telemetry, time, color, maxSpeed = 350 }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !telemetry || telemetry.length === 0) return;

    const W = container.offsetWidth;
    const H = container.offsetHeight;
    canvas.width = W * 2; // 2x for retina
    canvas.height = H * 2;
    const ctx = canvas.getContext('2d');
    ctx.scale(2, 2);

    const WINDOW = 30; // seconds visible
    const PADDING_LEFT = 36;
    const PADDING_RIGHT = 12;
    const PADDING_TOP = 8;
    const PADDING_BOTTOM = 20;
    const chartW = W - PADDING_LEFT - PADDING_RIGHT;
    const chartH = H - PADDING_TOP - PADDING_BOTTOM;

    const tMin = time - WINDOW / 2;
    const tMax = time + WINDOW / 2;

    // Clear
    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, W, H);

    // Grid lines
    const speedSteps = [0, 100, 200, 300];
    if (maxSpeed > 300) speedSteps.push(maxSpeed);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 0.5;
    ctx.font = '9px monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.textAlign = 'right';

    for (const spd of speedSteps) {
      const y = PADDING_TOP + chartH * (1 - spd / maxSpeed);
      ctx.beginPath();
      ctx.moveTo(PADDING_LEFT, y);
      ctx.lineTo(W - PADDING_RIGHT, y);
      ctx.stroke();
      ctx.fillText(`${spd}`, PADDING_LEFT - 4, y + 3);
    }

    // Filter telemetry points in the visible window (with some margin)
    const margin = 2;
    const visible = telemetry.filter(p => p.t >= tMin - margin && p.t <= tMax + margin);

    if (visible.length < 2) return;

    // Draw speed line
    const teamColor = `#${color || 'CCCCCC'}`;
    
    // Gradient fill under the line
    const gradient = ctx.createLinearGradient(0, PADDING_TOP, 0, PADDING_TOP + chartH);
    gradient.addColorStop(0, teamColor + '40');
    gradient.addColorStop(1, teamColor + '00');

    ctx.beginPath();
    let firstX, firstY;
    visible.forEach((pt, i) => {
      const x = PADDING_LEFT + ((pt.t - tMin) / WINDOW) * chartW;
      const y = PADDING_TOP + chartH * (1 - pt.speed / maxSpeed);
      if (i === 0) {
        ctx.moveTo(x, y);
        firstX = x;
        firstY = y;
      } else {
        ctx.lineTo(x, y);
      }
    });

    // Stroke the line
    ctx.strokeStyle = teamColor;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Fill area under the line
    const lastPt = visible[visible.length - 1];
    const lastX = PADDING_LEFT + ((lastPt.t - tMin) / WINDOW) * chartW;
    ctx.lineTo(lastX, PADDING_TOP + chartH);
    ctx.lineTo(firstX, PADDING_TOP + chartH);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Playhead line (current time)
    const playheadX = PADDING_LEFT + (WINDOW / 2 / WINDOW) * chartW;
    ctx.beginPath();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.moveTo(playheadX, PADDING_TOP);
    ctx.lineTo(playheadX, PADDING_TOP + chartH);
    ctx.stroke();
    ctx.setLineDash([]);

    // Playhead dot
    const currentPoint = telemetry.reduce((closest, pt) => {
      return Math.abs(pt.t - time) < Math.abs(closest.t - time) ? pt : closest;
    }, telemetry[0]);
    
    const dotY = PADDING_TOP + chartH * (1 - currentPoint.speed / maxSpeed);
    ctx.beginPath();
    ctx.arc(playheadX, dotY, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#FFF';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(playheadX, dotY, 3, 0, Math.PI * 2);
    ctx.fillStyle = teamColor;
    ctx.fill();

    // Current speed label
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${Math.round(currentPoint.speed)} km/h`, playheadX + 8, dotY + 4);

    // Time labels on X axis
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    for (let ts = Math.ceil(tMin / 5) * 5; ts <= tMax; ts += 5) {
      const x = PADDING_LEFT + ((ts - tMin) / WINDOW) * chartW;
      const m = Math.floor(ts / 60);
      const s = Math.floor(ts % 60);
      ctx.fillText(`${m}:${s.toString().padStart(2, '0')}`, x, H - 4);
    }

  }, [telemetry, time, color, maxSpeed]);

  return (
    <div ref={containerRef} className="w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded-lg"
        style={{ imageRendering: 'auto' }}
      />
    </div>
  );
}
