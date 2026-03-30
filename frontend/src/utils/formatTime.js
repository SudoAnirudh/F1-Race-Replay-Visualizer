/**
 * Formats a duration in seconds to MM:SS.mmm format.
 * @param {number} seconds 
 * @returns {string}
 */
export const formatTime = (seconds) => {
  if (isNaN(seconds) || seconds === null) return '00:00.000';
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
};

/**
 * Formats a gap in seconds to +S.mmm or +M:SS.mmm format.
 */
export const formatGap = (gap) => {
  if (gap === 0) return 'INTERVAL';
  if (gap === null || isNaN(gap)) return '--';
  
  const absGap = Math.abs(gap);
  if (absGap < 60) {
    return `+${absGap.toFixed(3)}`;
  }
  
  const mins = Math.floor(absGap / 60);
  const secs = (absGap % 60).toFixed(3);
  return `+${mins}:${secs.padStart(6, '0')}`;
};
