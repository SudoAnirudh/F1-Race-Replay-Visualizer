export function buildViewport(track, canvasW, canvasH, padding = 40) {
  const xs = track.map(p => p.x);
  const ys = track.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  
  // Track is basically X/Y scale. We need to preserve aspect ratio.
  const scaleX = (canvasW - padding * 2) / (maxX - minX);
  const scaleY = (canvasH - padding * 2) / (maxY - minY);
  const scale = Math.min(scaleX, scaleY);
  
  // Center it in the canvas by applying offset
  const offsetX = (canvasW - (maxX - minX) * scale) / 2;
  const offsetY = (canvasH - (maxY - minY) * scale) / 2;

  return { minX, minY, scale, padding, offsetX, offsetY };
}

export function toCanvas(x, y, vp) {
  // Add base minX/Y subtraction, scaling, then padding and centering offset
  return [
    (x - vp.minX) * vp.scale + vp.offsetX,
    (y - vp.minY) * vp.scale + vp.offsetY,
  ];
}
