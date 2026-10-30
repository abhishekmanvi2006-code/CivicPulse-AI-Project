import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Layers,
  MapPin,
  Clock,
  ShieldCheck,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Send,
  Camera,
  RefreshCw
} from 'lucide-react';

const DEPARTMENTS = [
  'Roads',
  'Sanitation',
  'Electrical',
  'Water Works',
  'Drainage',
  'Unassigned'
];

const STATUSES = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'ASSIGNED',
  'IN_PROGRESS',
  'RESOLVED',
  'REJECTED'
];

export default function ReportDetailModal({
  trackingId,
  onClose,
  onOpenActionBrief,
  onUpdateSuccess
}) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Authority Form State
  const [newStatus, setNewStatus] = useState('');
  const [newDepartment, setNewDepartment] = useState('');
  const [newAssignedTo, setNewAssignedTo] = useState('');
  const [actionNote, setActionNote] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolutionPhoto, setResolutionPhoto] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState('');

  const fetchDetail = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/complaints/${trackingId}`);
      if (!res.ok) {
        throw new Error('Complaint not found');
      }
      const json = await res.json();
      setData(json);
      setNewStatus(json.complaint.status);
      setNewDepartment(json.complaint.department || 'Unassigned');
      setNewAssignedTo(json.complaint.assigned_to || '');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (trackingId) {
      fetchDetail();
    }
  }, [trackingId]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    setUpdateMsg('');

    try {
      const res = await fetch(`/api/complaints/${data.complaint.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          department: newDepartment,
          assigned_to: newAssignedTo,
          note: actionNote,
          resolution_notes: newStatus === 'RESOLVED' ? (resolutionNotes || actionNote) : null,
          resolution_photo: newStatus === 'RESOLVED' ? (resolutionPhoto || 'https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?auto=format&fit=crop&w=600&q=80') : null,
          actor: 'Authority Officer (Mocked)'
        })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Update failed');

      setUpdateMsg('Status & assignments updated successfully!');
      setActionNote('');
      fetchDetail();
      if (onUpdateSuccess) onUpdateSuccess();
    } catch (err) {
      setUpdateMsg(`Error: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!trackingId) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col">
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
              CP
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  {data?.complaint ? data.complaint.tracking_id : trackingId}
                </h2>
                {data?.complaint && (
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    data.complaint.priority === 'CRITICAL' ? 'bg-rose-100 text-rose-700' :
                    data.complaint.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                    data.complaint.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                    'bg-emerald-100 text-emerald-700'
                  }`}>
                    {data.complaint.priority} ({data.complaint.priority_score}/100)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {data?.complaint?.address || 'Incident Details & Authority Workflow'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {data?.complaint && (
              <button
                onClick={() => onOpenActionBrief('single', data.complaint)}
                className="flex items-center gap-1.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 text-white font-semibold text-xs px-3 py-2 rounded-xl transition-all shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">AI Action Brief</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {isLoading && (
            <div className="text-center py-16 text-slate-400 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-sky-600" />
              <span>Loading complaint & AI explainability factors...</span>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
              {error}
            </div>
          )}

          {data?.complaint && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column (7 cols): Complaint Grievance & AI Analysis */}
              <div className="lg:col-span-7 space-y-5">
                {/* 1. Citizen Grievance Card */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Citizen Description
                  </span>
                  <p className="text-sm font-medium text-slate-800 leading-relaxed">
                    {data.complaint.description}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-3 border-t border-slate-200">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(data.complaint.created_at).toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-sky-600" />
                      {data.complaint.address}
                    </span>
                  </div>

                  {/* Citizen photo if uploaded */}
                  {data.complaint.image_url && (
                    <div className="mt-3 rounded-lg overflow-hidden border border-slate-200 max-h-48">
                      <img
                        src={data.complaint.image_url}
                        alt="Citizen Upload"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>

                {/* 2. STAGE 2: AI UNDERSTAND CARD */}
                <div className="bg-white rounded-xl p-5 border border-sky-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-sky-600" />
                      <h3 className="text-sm font-bold text-slate-900">
                        AI Analysis & Prioritization
                      </h3>
                    </div>
                    <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-sky-700 font-semibold">
                      {data.complaint.ai_source === 'gemini' ? 'Gemini 2.5 Flash' : 'Rule-Based Fallback Engine'}
                    </span>
                  </div>

                  {/* Category & Summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <span className="text-slate-500 font-medium">Categorization</span>
                      <div className="font-bold text-slate-800 text-sm mt-0.5 flex items-center gap-2">
                        <span>{data.complaint.category}</span>
                        <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1 rounded font-mono">
                          {Math.round((data.complaint.category_confidence || 0.9) * 100)}% conf
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <span className="text-slate-500 font-medium">Community Weight</span>
                      <div className="font-bold text-slate-800 text-sm mt-0.5 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-amber-600" />
                        <span>{data.complaint.duplicate_count || 1} Citizen Reports</span>
                      </div>
                    </div>
                  </div>

                  {/* One-Line Summary */}
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs">
                    <span className="text-slate-500 font-medium block mb-0.5">Executive Summary</span>
                    <p className="font-semibold text-slate-800 italic">
                      "{data.complaint.summary || data.complaint.description}"
                    </p>
                  </div>

                  {/* TRANSPARENT "WHY THIS PRIORITY?" PANEL */}
                  <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                        <span>Explainable Priority Breakdown ({data.complaint.priority_score}/100)</span>
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono">Deterministic Formula</span>
                    </div>

                    <div className="space-y-2 text-xs">
                      {Array.isArray(data.complaint.priority_factors) && data.complaint.priority_factors.map((factor, idx) => (
                        <div
                          key={idx}
                          className="bg-white p-2.5 rounded-lg border border-slate-200/80 flex items-start justify-between gap-3"
                        >
                          <div>
                            <span className="font-bold text-slate-800">{factor.factor}</span>
                            <p className="text-slate-600 text-[11px] mt-0.5">{factor.explanation}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold shrink-0 ${
                            factor.points >= 25 ? 'bg-rose-100 text-rose-700' :
                            factor.points >= 15 ? 'bg-orange-100 text-orange-700' :
                            factor.points > 0 ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-500'
                          }`}>
                            +{factor.points}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Linked Duplicates Accordion / List */}
                  {data.duplicates && data.duplicates.length > 0 && (
                    <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 text-xs space-y-2">
                      <div className="font-bold text-amber-900 flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-amber-600" />
                        <span>Corroborating Duplicates Merged ({data.duplicates.length})</span>
                      </div>
                      <div className="space-y-1.5">
                        {data.duplicates.map(dup => (
                          <div key={dup.id} className="bg-white p-2 rounded border border-amber-100 text-[11px] flex items-center justify-between">
                            <span className="font-mono font-bold text-amber-800">{dup.tracking_id}</span>
                            <span className="truncate max-w-[240px] text-slate-600">{dup.description}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {Math.round(dup.similarity_score * 100)}% sim
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column (5 cols): Stage 4 Authority Actions & Timeline */}
              <div className="lg:col-span-5 space-y-5">
                {/* 1. STAGE 4: AUTHORITY WORKFLOW ACTION PANEL */}
                <div className="bg-white rounded-xl p-5 border border-indigo-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-indigo-600" />
                      <h3 className="text-sm font-bold text-slate-900">Authority Action & Dispatch</h3>
                    </div>
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 font-mono px-2 py-0.5 rounded font-semibold">
                      Mocked Workflow
                    </span>
                  </div>

                  {updateMsg && (
                    <div className={`p-2.5 rounded-lg text-xs font-medium ${
                      updateMsg.includes('Error') ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}>
                      {updateMsg}
                    </div>
                  )}

                  <form onSubmit={handleUpdate} className="space-y-3.5 text-xs">
                    {/* Status Dropdown */}
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Status Workflow</label>
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium bg-white focus:ring-2 focus:ring-indigo-500"
                      >
                        {STATUSES.map(s => (
                          <option key={s} value={s}>{s.replace('_', ' ')}</option>
                        ))}
                      </select>
                    </div>

                    {/* Department Dropdown */}
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Assign Department <span className="text-[10px] text-slate-400 font-mono">(Mocked)</span>
                      </label>
                      <select
                        value={newDepartment}
                        onChange={(e) => setNewDepartment(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium bg-white focus:ring-2 focus:ring-indigo-500"
                      >
                        {DEPARTMENTS.map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>

                    {/* Assigned Officer */}
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Assigned Officer / Crew</label>
                      <input
                        type="text"
                        value={newAssignedTo}
                        onChange={(e) => setNewAssignedTo(e.target.value)}
                        placeholder="e.g. Eng. Rajesh Sharma, Crew Alpha"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    {/* Internal Action Note */}
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Action Note / Update</label>
                      <textarea
                        rows={2}
                        value={actionNote}
                        onChange={(e) => setActionNote(e.target.value)}
                        placeholder="Public or internal update note..."
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    {/* Resolution Specific Fields (if selecting Resolved) */}
                    {newStatus === 'RESOLVED' && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-2">
                        <span className="font-bold text-emerald-900 block text-[11px]">
                          Resolution Verification
                        </span>
                        <input
                          type="text"
                          value={resolutionNotes}
                          onChange={(e) => setResolutionNotes(e.target.value)}
                          placeholder="Resolution remarks (e.g. Cold mix asphalt patched, road opened)"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-emerald-300 bg-white"
                        />
                        <div className="text-[10px] text-emerald-700">
                          📷 Default demo resolution photo attached automatically.
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isUpdating}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors disabled:opacity-50"
                    >
                      {isUpdating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      <span>Save & Broadcast Update</span>
                    </button>
                  </form>
                </div>

                {/* 2. CHRONOLOGICAL TIMELINE */}
                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>Audit Timeline</span>
                    </h3>
                    <span className="text-[10px] text-slate-400 font-mono">Timestamped</span>
                  </div>

                  <div className="relative pl-4 space-y-3 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 text-xs">
                    {data.timeline && data.timeline.map((event, idx) => (
                      <div key={event.id || idx} className="relative">
                        <div className={`absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white ${
                          event.status === 'RESOLVED' ? 'bg-emerald-600' :
                          event.status === 'IN_PROGRESS' ? 'bg-sky-600' :
                          event.status === 'DUPLICATE' ? 'bg-amber-500' :
                          'bg-indigo-600'
                        }`} />
                        <div className="flex items-baseline justify-between">
                          <span className="font-bold text-slate-800 text-[11px]">{event.action}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px] mt-0.5">{event.note}</p>
                        <span className="text-[9px] text-slate-400 font-semibold">{event.actor}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
