export function interpolate(positions, t) {
  if (!positions || positions.length === 0) return null;
  if (t <= positions[0].t) return positions[0];
  if (t >= positions[positions.length - 1].t) return positions[positions.length - 1];

  // Binary search for surrounding timestamps
  let lo = 0, hi = positions.length - 1;
  while (lo < hi - 1) {
    const mid = Math.floor((lo + hi) / 2);
    positions[mid].t <= t ? (lo = mid) : (hi = mid);
  }

  const a = positions[lo];
  const b = positions[hi];
  const alpha = (t - a.t) / (b.t - a.t); // 0.0 → 1.0

  return {
    x: a.x + (b.x - a.x) * alpha,
    y: a.y + (b.y - a.y) * alpha,
  };
}
