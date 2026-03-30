import useSWR from 'swr';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const fetcher = url => fetch(url).then(r => r.json());

/**
 * Hook to fetch lap times for the dashboard.
 */
export function useLapTimes(year, round, session) {
  const url = year && round && session 
    ? `${API_BASE_URL}/analytics/lap-times/${year}/${round}/${session}` 
    : null;
  return useSWR(url, fetcher, { revalidateOnFocus: false });
}

/**
 * Hook to fetch telemetry for selected drivers.
 */
export function useTelemetry(year, round, session, drivers, lap = 'fastest') {
  const driverStr = Array.isArray(drivers) ? drivers.join(',') : drivers;
  const url = year && round && session && driverStr
    ? `${API_BASE_URL}/analytics/telemetry/${year}/${round}/${session}?drivers=${driverStr}&lap=${lap}`
    : null;
  return useSWR(url, fetcher, { revalidateOnFocus: false });
}

/**
 * Hook to fetch race strategy/tyre stints.
 */
export function useStrategy(year, round) {
  const url = year && round 
    ? `${API_BASE_URL}/analytics/strategy/${year}/${round}` 
    : null;
  return useSWR(url, fetcher, { revalidateOnFocus: false });
}

/**
 * Hook to fetch team median pace.
 */
export function useTeamPace(year, round) {
  const url = year && round 
    ? `${API_BASE_URL}/analytics/team-pace/${year}/${round}` 
    : null;
  return useSWR(url, fetcher, { revalidateOnFocus: false });
}

/**
 * Hook to fetch sector breakdowns.
 */
export function useSectors(year, round, session) {
  const url = year && round && session 
    ? `${API_BASE_URL}/analytics/sectors/${year}/${round}/${session}` 
    : null;
  return useSWR(url, fetcher, { revalidateOnFocus: false });
}

/**
 * Hook to fetch position changes.
 */
export function usePositions(year, round) {
  const url = year && round 
    ? `${API_BASE_URL}/analytics/positions/${year}/${round}` 
    : null;
  return useSWR(url, fetcher, { revalidateOnFocus: false });
}
