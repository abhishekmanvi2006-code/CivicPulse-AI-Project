import React, { useState } from 'react';
import {
  Activity,
  PlusCircle,
  Search,
  LayoutDashboard,
  Info,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Menu,
  X
} from 'lucide-react';

export default function Navbar({
  currentView,
  setCurrentView,
  backendHealth,
  role,
  setRole,
  onResetDemo,
  isResetting
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Overview', icon: Activity },
    { id: 'report', label: 'Report Issue', icon: PlusCircle },
    { id: 'track', label: 'Track Report', icon: Search },
    { id: 'dashboard', label: 'Authority Dashboard', icon: LayoutDashboard },
    { id: 'about', label: 'About & Limitations', icon: Info },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Tagline */}
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => { setCurrentView('home'); setMobileMenuOpen(false); }}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <Activity className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-slate-900">CivicPulse</span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-sky-100 text-sky-700 rounded-md">
                  AI Impact
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">From Complaints to Action</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-sky-50 text-sky-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-sky-600' : 'text-slate-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Action Elements: AI Status Badge & Role Switcher */}
          <div className="hidden lg:flex items-center gap-3">
            {/* AI Engine Status Badge */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                backendHealth?.gemini?.configured
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
              title={
                backendHealth?.gemini?.configured
                  ? `Powered by Gemini API (${backendHealth.gemini.model})`
                  : 'Operating via built-in Rule-Based & TF-IDF engine'
              }
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{backendHealth?.gemini?.configured ? 'Gemini 2.5' : 'Rule-Based Fallback'}</span>
            </div>

            {/* Role Mock Toggle */}
            <button
              onClick={() => setRole(role === 'citizen' ? 'authority' : 'citizen')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                role === 'authority'
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  : 'bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{role === 'authority' ? 'Authority' : 'Citizen'}</span>
              <span className="text-[10px] text-slate-400 bg-white/70 px-1 py-0.2 rounded font-mono">Mocked</span>
            </button>

            {/* Reset Demo Data Button */}
            <button
              onClick={onResetDemo}
              disabled={isResetting}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors disabled:opacity-50"
              title="Reset SQLite database with 45 realistic synthetic records"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin text-rose-500' : ''}`} />
              <span className="hidden xl:inline">Reset Demo</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-sky-50 text-sky-700' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4 text-sky-600" />
                {item.label}
              </button>
            );
          })}

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{backendHealth?.gemini?.configured ? 'Gemini 2.5' : 'Rule-Based Fallback'}</span>
            </div>
            <button
              onClick={onResetDemo}
              disabled={isResetting}
              className="flex items-center gap-1.5 text-xs text-rose-600 font-medium px-2 py-1 rounded hover:bg-rose-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
              Reset Demo
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
