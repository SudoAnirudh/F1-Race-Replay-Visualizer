import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import ReplayPage from './pages/ReplayPage';
import DashboardPage from './pages/DashboardPage';
import { LayoutDashboard, Play, Info } from 'lucide-react';

function App() {
  return (
    <BrowserRouter>
      <div className="h-screen w-screen bg-zinc-950 flex flex-col text-white overflow-hidden selection:bg-red-500/30 selection:text-red-200">
        
        {/* Modern Navigation Header */}
        <header className="h-16 flex items-center justify-between px-6 bg-zinc-900/50 border-b border-zinc-800/60 backdrop-blur-xl z-50">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-800 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.3)]">
              <span className="font-black italic text-xl tracking-tighter">F1</span>
            </div>
            <div className="hidden sm:block">
              <h2 className="text-sm font-bold tracking-widest uppercase text-white/90">SudoAnirudh</h2>
              <p className="text-[10px] font-mono text-zinc-500 tracking-tight leading-none uppercase">Race Replay & Analytics</p>
            </div>
          </div>

          <nav className="flex items-center gap-1 sm:gap-2 bg-black/20 p-1 rounded-2xl border border-white/5">
            <NavLink 
              to="/replay" 
              className={({ isActive }) => `
                flex items-center gap-2 px-4 py-1.5 rounded-xl text-sm font-bold transition-all duration-300
                ${isActive ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}
              `}
            >
              <Play size={16} fill="currentColor" />
              <span>Replay</span>
            </NavLink>
            <NavLink 
              to="/dashboard" 
              className={({ isActive }) => `
                flex items-center gap-2 px-4 py-1.5 rounded-xl text-sm font-bold transition-all duration-300
                ${isActive ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}
              `}
            >
              <LayoutDashboard size={16} />
              <span>Analytics</span>
            </NavLink>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <button className="text-zinc-500 hover:text-white transition-colors p-2">
              <Info size={18} />
            </button>
            <div className="h-6 w-px bg-zinc-800" />
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">Status</p>
                <div className="flex items-center gap-1.5 justify-end">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <p className="text-[10px] font-mono text-emerald-400">Live API</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Container */}
        <div className="flex-1 overflow-hidden relative">
          <Routes>
            <Route path="/replay" element={<ReplayPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          
          {/* Global Ambient Background Effects */}
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-red-600/5 blur-[120px] rounded-full pointer-events-none -z-10" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-600/5 blur-[100px] rounded-full pointer-events-none -z-10" />
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
