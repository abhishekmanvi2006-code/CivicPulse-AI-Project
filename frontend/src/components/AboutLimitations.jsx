import React from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Cpu,
  Database,
  MapPin,
  Lock,
  Layers,
  ArrowRight
} from 'lucide-react';

export default function AboutLimitations({ backendHealth, onResetDemo, isResetting }) {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-sky-700 bg-sky-50 px-2 py-0.5 rounded">
            Ethics & Transparency
          </span>
          <span className="text-xs text-slate-400 font-mono">Civic AI Accountability</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mt-1">About CivicPulse & System Limitations</h1>
        <p className="text-sm text-slate-600 mt-2 leading-relaxed">
          CivicPulse is built for the "From Complaints to Action" civic AI hackathon challenge. We believe civic AI must be transparent, verifiable, and explainable rather than a black-box. Below is an honest breakdown of what is real, what is mocked, and current edge cases.
        </p>

        {/* Live Engine Status */}
        <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-sky-600" />
            <span className="text-slate-600">Active AI Configuration:</span>
            <span className="font-bold text-slate-900">
              {backendHealth?.gemini?.configured ? `Google Gemini (${backendHealth.gemini.model})` : 'Deterministic Rule-Based & TF-IDF Engine'}
            </span>
          </div>
          <span className={`px-2 py-0.5 rounded-full font-bold font-mono text-[11px] ${
            backendHealth?.gemini?.configured ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
          }`}>
            {backendHealth?.gemini?.statusBadge || 'Rule-based fallback'}
          </span>
        </div>
      </div>

      {/* Grid: What is Real vs What is Mocked */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Real */}
        <div className="bg-white rounded-2xl p-6 border border-emerald-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-base">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h2>What is Real (Working & Tested)</h2>
          </div>
          <ul className="space-y-3 text-xs text-slate-700">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <div>
                <strong>Local SQLite Database:</strong> Real persistent database (`civicpulse.db`) with relational tables for complaints, duplicates, and timeline events.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <div>
                <strong>Leaflet & OpenStreetMap:</strong> Real interactive map rendering live GPS pins, markers colored by priority, and marker sizes scaling with duplicate counts.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <div>
                <strong>Duplicate Detection Engine:</strong> Real Haversine distance calculations (160m threshold) combined with TF-IDF cosine text similarity and category matching.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <div>
                <strong>Deterministic Priority Formula:</strong> 0–100 explainability score derived from actual arithmetic (safety hazard keywords + sensitive zone proximity + duplicate weight + category severity + age).
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <div>
                <strong>Spatial Hotspot Clustering:</strong> Automated distance-based clustering detecting multi-issue hotspots and deducing systemic root causes.
              </div>
            </li>
          </ul>
        </div>

        {/* Mocked */}
        <div className="bg-white rounded-2xl p-6 border border-amber-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-base">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h2>What is Mocked (Labelled in App)</h2>
          </div>
          <ul className="space-y-3 text-xs text-slate-700">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
              <div>
                <strong>Sensitive Facilities (Mocked):</strong> St. Mary Hospital, National Public School, and 100ft Expressway coordinates are simulated locations for demo testing.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
              <div>
                <strong>Municipal Authentication (Mocked):</strong> Role switching between Citizen and Authority is an instant client-side toggle without real JWT/SSO logins.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
              <div>
                <strong>Government Dispatch & SMS (Mocked):</strong> Department dispatch (Roads, Drainage, etc.) updates internal SQLite tables rather than dispatching city municipal trucks.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
              <div>
                <strong>Synthetic Citizen Identities (Mocked):</strong> Phone numbers and citizen names are synthetic dummy test records.
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* Where AI Can Be Wrong */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-rose-800 font-bold text-base">
          <ShieldAlert className="w-5 h-5 text-rose-600" />
          <h2>Where the AI Can Be Wrong (Failure Modes & Edge Cases)</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-800 block mb-1">1. Ambiguous Text & Slang</span>
            <p className="text-slate-600 leading-relaxed">
              Citizens often use localized slang or metaphors (e.g., "The street looks like a swimming pool"). If keyword filters miss the context, confidence scores drop.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-800 block mb-1">2. GPS Inaccuracies</span>
            <p className="text-slate-600 leading-relaxed">
              Mobile browsers can sometimes report GPS with a 50m error margin. A complaint near a school boundary may artificially trigger or miss the sensitive zone bonus.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-800 block mb-1">3. Duplicate False Positives</span>
            <p className="text-slate-600 leading-relaxed">
              Two different potholes 80 meters apart on the same avenue could be wrongly merged if descriptions are too generic (e.g. "Pothole on main road").
            </p>
          </div>
        </div>
      </div>

      {/* Next Steps for City Production */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 space-y-3">
        <div className="flex items-center gap-2 text-sky-400 font-bold text-base">
          <Lightbulb className="w-5 h-5" />
          <h2>Next Steps for Real Municipal Deployment</h2>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          To transition CivicPulse from hackathon demo to production deployment in a city of 5M+ residents:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300 pt-2">
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
            <strong className="text-white block mb-0.5">Official GIS Layers</strong>
            Integrate municipal cadastral shapefiles and live traffic sensor feeds.
          </div>
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
            <strong className="text-white block mb-0.5">WhatsApp / SMS Webhooks</strong>
            Enable citizens to submit photos and voice notes directly via WhatsApp bot.
          </div>
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
            <strong className="text-white block mb-0.5">Field Crew Mobile PWA</strong>
            GPS-tagged geo-fenced resolution photo verification before closing tickets.
          </div>
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
            <strong className="text-white block mb-0.5">Automated SLA Escalation</strong>
            Auto-escalate unanswered Critical tickets to the Ward Commissioner after 6 hours.
          </div>
        </div>
      </div>
    </div>
  );
}
