import { useState, useMemo, lazy, Suspense } from 'react';
import { SessionPicker } from '../components/SessionPicker';
import { DriverSelector } from '../components/DriverSelector';
import { ViewTabs } from '../components/ViewTabs';
import { WatchReplayButton } from '../components/WatchReplayButton';
import { Loader2, Activity } from 'lucide-react';

// Lazy load charts for performance
const LapTimeScatter = lazy(() => import('../components/charts/LapTimeScatter'));
const PositionChanges = lazy(() => import('../components/charts/PositionChanges'));
const TeamPaceBar = lazy(() => import('../components/charts/TeamPaceBar'));
const StrategyTimeline = lazy(() => import('../components/charts/StrategyTimeline'));
const SectorBreakdown = lazy(() => import('../components/charts/SectorBreakdown'));
const TelemetryOverlay = lazy(() => import('../components/charts/TelemetryOverlay'));

export default function DashboardPage() {
  const [params, setParams] = useState({ year: 2024, round: 1, session: 'R' });
  const [selectedDrivers, setSelectedDrivers] = useState([]);
  const [activeTab, setActiveTab] = useState('lap-times');

  const handleSessionChange = (year, round, session) => {
    setParams({ year, round, session });
  };

  const renderActiveChart = () => {
    const props = { 
       year: params.year, 
       round: params.round, 
       session: params.session, 
       selectedDrivers 
    };

    switch (activeTab) {
      case 'lap-times':
        return <LapTimeScatter {...props} />;
      case 'positions':
        return <PositionChanges {...props} />;
      case 'team-pace':
        return <TeamPaceBar {...props} />;
      case 'strategy':
        return <StrategyTimeline {...props} />;
      case 'sectors':
        return <SectorBreakdown {...props} />;
      case 'telemetry':
        return <TelemetryOverlay {...props} />;
      default:
        return <div>Select an analysis view</div>;
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-zinc-950 text-white overflow-hidden p-6 gap-6 relative">
      {/* Background radial glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-red-600/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-zinc-800/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Header Section */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 z-10">
        <div className="flex items-center gap-5">
           <div className="p-3 bg-zinc-900/50 rounded-2xl border border-zinc-800 shadow-xl shadow-red-600/5">
              <Activity className="text-red-600" size={28} />
           </div>
           <div>
              <h1 className="text-3xl font-black tracking-tight uppercase italic leading-none">
                 Analytics <span className="text-zinc-600 italic-important">Dashboard</span>
              </h1>
              <p className="text-[11px] font-mono tracking-widest text-zinc-500 mt-2 uppercase opacity-80">
                 Telemetry & Performance Optimization Engine
              </p>
           </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-zinc-900/20 p-2 border border-zinc-800/40 rounded-[2.5rem] backdrop-blur-2xl">
          <SessionPicker 
            year={params.year}
            round={params.round}
            session={params.session}
            onSelect={handleSessionChange}
          />
          <div className="h-10 w-[1px] bg-zinc-800 hidden sm:block" />
          <WatchReplayButton year={params.year} round={params.round} session={params.session} />
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 min-h-0 h-full relative z-10">
        
        {/* Left Column: Multi-select Drivers */}
        <aside className="lg:col-span-3 flex flex-col gap-6 overflow-hidden">
          <div className="flex-1 flex flex-col bg-zinc-900/40 border border-zinc-800/50 rounded-3xl p-6 backdrop-blur-md overflow-hidden relative group">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 font-mono italic">Compare Drivers</h2>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-800/50 border border-zinc-700/50">
                 <span className="text-[9px] font-mono font-bold text-red-500">{selectedDrivers.length}/5</span>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar mask-gradient-b">
              <DriverSelector 
                selected={selectedDrivers}
                onChange={setSelectedDrivers}
                max={5}
                year={params.year}
                round={params.round}
                session={params.session}
              />
            </div>
            
            <div className="mt-4 pt-4 border-t border-zinc-800/60">
               <p className="text-[10px] text-zinc-600 font-mono tracking-tighter leading-relaxed">
                  Deep comparative analysis requires at least two drivers selected.
               </p>
            </div>
          </div>
        </aside>

        {/* Main Content: Tabs + Dynamic Chart */}
        <main className="lg:col-span-9 flex flex-col gap-6 h-full min-h-0 overflow-hidden">
          <ViewTabs active={activeTab} onChange={setActiveTab} sessionType={params.session} />
          
          <div className="flex-1 h-full bg-zinc-900/50 border border-zinc-800/60 rounded-[2rem] p-8 relative overflow-hidden backdrop-blur-xl group transition-all duration-500 hover:border-zinc-700/50 shadow-2xl">
            {/* Ambient inner glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 blur-[100px] pointer-events-none -z-10 group-hover:bg-red-600/10 transition-colors" />
            
            <Suspense fallback={
              <div className="h-full flex flex-col items-center justify-center text-zinc-500">
                 <Loader2 className="animate-spin text-red-600 mb-4" size={40} />
                 <span className="font-mono text-xs tracking-widest uppercase">Building dynamic analysis report...</span>
              </div>
            }>
               {selectedDrivers.length > 0 || ['team-pace', 'lap-times', 'sectors'].includes(activeTab) ? (
                 <div className="h-full animate-fadeIn">
                   {renderActiveChart()}
                 </div>
               ) : (
                 <div className="h-full flex items-center justify-center">
                    <div className="text-center group-hover:scale-105 transition-transform duration-700">
                       <div className="w-20 h-20 bg-zinc-800/40 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-zinc-700/30 group-hover:border-red-500/30">
                          <Activity className="text-zinc-600 group-hover:text-red-500" size={32} />
                       </div>
                       <h4 className="text-xl font-bold tracking-tight mb-2 text-zinc-500 group-hover:text-zinc-300">No Analytics Loaded</h4>
                       <p className="text-xs font-mono text-zinc-600 tracking-wider">SELECT DRIVER(S) ON THE LEFT TO BEGIN DATA ANALYSIS</p>
                    </div>
                 </div>
               )}
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
