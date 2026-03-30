import { useCallback, useMemo } from 'react';

/**
 * Given a driver's telemetry array, returns a helper to efficiently
 * look up telemetry values at any timestamp via binary search.
 */
export function useDriverTelemetry(telemetry) {
  const getTelemetryAtTime = useCallback((t) => {
    if (!telemetry || telemetry.length === 0) return null;
    if (t <= telemetry[0].t) return telemetry[0];
    if (t >= telemetry[telemetry.length - 1].t) return telemetry[telemetry.length - 1];

    // Binary search
    let lo = 0, hi = telemetry.length - 1;
    while (lo < hi - 1) {
      const mid = Math.floor((lo + hi) / 2);
      telemetry[mid].t <= t ? (lo = mid) : (hi = mid);
    }

    // Return the closer point (no interpolation needed for gauge display)
    const a = telemetry[lo];
    const b = telemetry[hi];
    return (t - a.t) < (b.t - t) ? a : b;
  }, [telemetry]);

  // Pre-compute min/max for chart scaling
  const stats = useMemo(() => {
    if (!telemetry || telemetry.length === 0) return { maxSpeed: 350, maxRPM: 15000 };
    let maxSpeed = 0, maxRPM = 0;
    for (const pt of telemetry) {
      if (pt.speed > maxSpeed) maxSpeed = pt.speed;
      if (pt.rpm > maxRPM) maxRPM = pt.rpm;
    }
    return { 
      maxSpeed: Math.ceil(maxSpeed / 50) * 50, // Round up to nearest 50
      maxRPM: Math.ceil(maxRPM / 1000) * 1000  // Round up to nearest 1000
    };
  }, [telemetry]);

  return { getTelemetryAtTime, stats };
}
