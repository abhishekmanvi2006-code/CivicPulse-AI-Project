import React from 'react';
import {
  Activity,
  PlusCircle,
  LayoutDashboard,
  Search,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  Layers,
  ArrowRight,
  Flame,
  Clock,
  Compass
} from 'lucide-react';

export default function HomeOverview({
  setCurrentView,
  backendHealth,
  kpis,
  onResetDemo,
  isResetting
}) {
  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-10">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 text-white p-8 sm:p-12 border border-slate-800 shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-300 border border-sky-500/20">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>AI for Civic Impact — Hackathon Solution</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            From Scattered Citizen Complaints to{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-teal-300">
              Prioritized, Explainable Action
            </span>
          </h1>

          <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl">
            Tackles urban infrastructure bottlenecks (waterlogging, road craters, uncollected garbage, broken streetlights) across 4 transparent stages:
            <span className="text-sky-300 font-semibold"> Capture, Understand, Reveal, Act</span>.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-3">
            <button
              onClick={() => setCurrentView('report')}
              className="bg-gradient-to-r from-sky-500 to-teal-400 hover:from-sky-600 hover:to-teal-500 text-slate-950 font-bold px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-sky-500/20 transition-all text-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Report an Issue (Under 1 Min)</span>
            </button>

            <button
              onClick={() => setCurrentView('dashboard')}
              className="bg-slate-800/80 hover:bg-slate-700 text-white font-semibold px-6 py-3 rounded-xl border border-slate-700 flex items-center gap-2 transition-all text-sm"
            >
              <LayoutDashboard className="w-4 h-4 text-sky-400" />
              <span>Open Authority Dashboard</span>
            </button>
          </div>
        </div>

        {/* Decorative Grid Accent */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none hidden md:block" />
      </div>

      {/* The 4 Stages Framework Cards */}
      <div>
        <div className="text-center max-w-xl mx-auto mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-sky-600">Core Architecture</span>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">The 4-Stage Civic Pipeline</h2>
          <p className="text-xs text-slate-500 mt-1">End-to-end transformation from raw citizen voice to verified ground action.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Stage 1: Capture */}
          <div
            onClick={() => setCurrentView('report')}
            className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-sky-300 hover:shadow-md transition-all cursor-pointer group space-y-3"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-sm group-hover:scale-105 transition-transform">
              01
            </div>
            <h3 className="font-bold text-slate-900 text-base">Capture</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Phone-friendly mobile intake without login. Interactive map pin, GPS detection, category chooser or "Let AI decide", and optional photo.
            </p>
            <span className="text-xs text-sky-600 font-semibold flex items-center gap-1 pt-1 group-hover:translate-x-0.5 transition-transform">
              Report Issue <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>

          {/* Stage 2: Understand */}
          <div
            onClick={() => setCurrentView('dashboard')}
            className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group space-y-3"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm group-hover:scale-105 transition-transform">
              02
            </div>
            <h3 className="font-bold text-slate-900 text-base">Understand</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              AI categorization & 20-word summary. Duplicate detection links complaints within 160m. 0–100 explainable priority formula with point breakdown.
            </p>
            <span className="text-xs text-indigo-600 font-semibold flex items-center gap-1 pt-1 group-hover:translate-x-0.5 transition-transform">
              View Scoring <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>

          {/* Stage 3: Reveal */}
          <div
            onClick={() => setCurrentView('dashboard')}
            className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-orange-300 hover:shadow-md transition-all cursor-pointer group space-y-3"
          >
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-sm group-hover:scale-105 transition-transform">
              03
            </div>
            <h3 className="font-bold text-slate-900 text-base">Reveal</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Authority dashboard with priority-colored Leaflet map, spatial hotspot clustering, and 1-minute AI Action Briefs for immediate triage.
            </p>
            <span className="text-xs text-orange-600 font-semibold flex items-center gap-1 pt-1 group-hover:translate-x-0.5 transition-transform">
              Inspect Map <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>

          {/* Stage 4: Act */}
          <div
            onClick={() => setCurrentView('track')}
            className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group space-y-3"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm group-hover:scale-105 transition-transform">
              04
            </div>
            <h3 className="font-bold text-slate-900 text-base">Act</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Multi-department routing (Roads, Drainage, etc.), field updates, resolution photo attachments, and real-time citizen tracking stepper.
            </p>
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1 pt-1 group-hover:translate-x-0.5 transition-transform">
              Track Portal <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>

      {/* Demo Walkthrough Guide for Judges */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-sky-600" />
            <h3 className="font-bold text-slate-900 text-sm">5-Minute Judge Walkthrough Guide</h3>
          </div>
          <button
            onClick={onResetDemo}
            disabled={isResetting}
            className="text-xs text-rose-600 hover:text-rose-700 font-medium underline"
          >
            Reset Demo Dataset
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <strong className="text-slate-900 block mb-1">Step 1: File a Report</strong>
            Go to <em>Report Issue</em>, click a preset like "Open Manhole", submit, and see instant AI analysis & Tracking ID.
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <strong className="text-slate-900 block mb-1">Step 2: Check Duplicate</strong>
            Submit a waterlogging complaint on 12th Main Road; watch the engine detect the duplicate and link to parent ticket.
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <strong className="text-slate-900 block mb-1">Step 3: Action Brief</strong>
            Open <em>Authority Dashboard</em>, click "Generate Today's Top 5 Action Brief" or a Hotspot brief.
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <strong className="text-slate-900 block mb-1">Step 4: Resolve & Track</strong>
            Assign to a department, mark <em>Resolved</em>, then view the update in <em>Track Report</em>.
          </div>
        </div>
      </div>
    </div>
  );
}
