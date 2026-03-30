/**
 * F1WheelSpinner — An SVG racing wheel that spins during loading.
 */
export function F1WheelSpinner({ size = 80, className = '' }) {
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      {/* Spinning wheel */}
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full animate-spin"
        style={{ animationDuration: '1.2s' }}
      >
        {/* Outer tire */}
        <circle cx="50" cy="50" r="46" fill="none" stroke="#1a1a1a" strokeWidth="8" />
        {/* Tire tread marks */}
        {[...Array(24)].map((_, i) => {
          const angle = (i * 15) * Math.PI / 180;
          const x1 = 50 + 42 * Math.cos(angle);
          const y1 = 50 + 42 * Math.sin(angle);
          const x2 = 50 + 49 * Math.cos(angle);
          const y2 = 50 + 49 * Math.sin(angle);
          return (
            <line
              key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="#2a2a2a"
              strokeWidth="2"
              strokeLinecap="round"
            />
          );
        })}
        {/* Tire rubber ring */}
        <circle cx="50" cy="50" r="45" fill="none" stroke="#333" strokeWidth="6" />
        <circle cx="50" cy="50" r="42" fill="none" stroke="#222" strokeWidth="1" />
        {/* Inner rim */}
        <circle cx="50" cy="50" r="30" fill="#111" stroke="#444" strokeWidth="1.5" />
        {/* Rim spokes — 5 spoke F1 style */}
        {[...Array(5)].map((_, i) => {
          const angle = (i * 72 - 90) * Math.PI / 180;
          const tipX = 50 + 28 * Math.cos(angle);
          const tipY = 50 + 28 * Math.sin(angle);
          const leftAngle = angle - 0.3;
          const rightAngle = angle + 0.3;
          const baseL_X = 50 + 10 * Math.cos(leftAngle);
          const baseL_Y = 50 + 10 * Math.sin(leftAngle);
          const baseR_X = 50 + 10 * Math.cos(rightAngle);
          const baseR_Y = 50 + 10 * Math.sin(rightAngle);
          return (
            <polygon
              key={i}
              points={`${tipX},${tipY} ${baseL_X},${baseL_Y} ${baseR_X},${baseR_Y}`}
              fill="#555"
              stroke="#666"
              strokeWidth="0.5"
            />
          );
        })}
        {/* Center hub */}
        <circle cx="50" cy="50" r="8" fill="#222" stroke="#555" strokeWidth="1.5" />
        <circle cx="50" cy="50" r="4" fill="#e10600" />
        {/* Center bolt */}
        <circle cx="50" cy="50" r="2" fill="#333" />
        
        {/* Red accent on rim edge */}
        <path
          d="M 50 8 A 42 42 0 0 1 85 25"
          fill="none"
          stroke="#e10600"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.7"
        />
      </svg>
      
      {/* Static center nut (doesn't spin) — overlayed */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div 
          className="w-2 h-2 rounded-full bg-f1red shadow-lg" 
          style={{ boxShadow: '0 0 8px rgba(225, 6, 0, 0.6)' }}
        />
      </div>
    </div>
  );
}
