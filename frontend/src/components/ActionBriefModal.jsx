import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  AlertTriangle,
  Building,
  Clock,
  CheckCircle2,
  Send,
  RefreshCw,
  FileText
} from 'lucide-react';

export default function ActionBriefModal({
  type,
  targetData,
  onClose
}) {
  const [brief, setBrief] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const generateBrief = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/action-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, targetData })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to generate brief');
      setBrief(json.brief);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (type && targetData) {
      generateBrief();
    }
  }, [type, targetData]);

  if (!type || !targetData) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-gradient-to-r from-sky-50 to-indigo-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">Executive AI Action Brief</h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                  Under 1 Min Read
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Actionable operational recommendations for municipal authorities
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {isLoading && (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
              <span>Synthesizing multi-factor action brief...</span>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          {brief && (
            <div className="space-y-4 text-xs">
              {/* Header Banner */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="font-bold text-slate-900 text-sm">{brief.title}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold">
                  Source: {brief.ai_source === 'gemini' ? 'Gemini 2.5 Flash' : 'Rule-Based Fallback'}
                </span>
              </div>

              {/* 1. What is happening */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px] block mb-1">
                  1. Incident Overview (What is happening)
                </span>
                <p className="text-slate-700 font-medium leading-relaxed">
                  {brief.what_is_happening}
                </p>
              </div>

              {/* 2. Why it matters */}
              <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200">
                <span className="font-bold text-amber-900 uppercase tracking-wider text-[10px] block mb-1">
                  2. Impact & Sensitivity (Why it matters)
                </span>
                <p className="text-amber-950 font-medium leading-relaxed">
                  {brief.why_it_matters}
                </p>
              </div>

              {/* 3. Recommended Action */}
              <div className="bg-sky-50 p-3.5 rounded-xl border border-sky-200">
                <span className="font-bold text-sky-900 uppercase tracking-wider text-[10px] block mb-1">
                  3. Operational Protocol (Recommended Action)
                </span>
                <p className="text-sky-950 font-medium leading-relaxed">
                  {brief.recommended_action}
                </p>
              </div>

              {/* Meta Grid: Department & Urgency */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 text-[10px] font-medium block">Suggested Department</span>
                  <div className="font-bold text-slate-800 text-xs mt-0.5 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{brief.suggested_department}</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 text-[10px] font-medium block">Directive Urgency</span>
                  <div className="font-bold text-rose-700 text-xs mt-0.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-rose-600" />
                    <span>{brief.urgency}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              onClick={onClose}
              className="bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs py-2 px-5 rounded-xl transition-colors"
            >
              Close Brief
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
