import React, { useState, useEffect } from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  MapPin,
  ShieldCheck,
  Building,
  Layers,
  ArrowRight,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

const STEPS = [
  { id: 'SUBMITTED', label: 'Submitted', desc: 'Complaint received & logged' },
  { id: 'UNDER_REVIEW', label: 'Under Review', desc: 'AI triage & verification' },
  { id: 'ASSIGNED', label: 'Assigned', desc: 'Dispatched to department' },
  { id: 'IN_PROGRESS', label: 'In Progress', desc: 'Crews operating on-site' },
  { id: 'RESOLVED', label: 'Resolved', desc: 'Remedial action verified' },
];

export default function CitizenTracker({ initialTrackingId }) {
  const [trackingId, setTrackingId] = useState(initialTrackingId || '');
  const [complaintData, setComplaintData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (idToSearch) => {
    const query = idToSearch || trackingId;
    if (!query.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/complaints/${query.trim()}`);
      if (!res.ok) {
        throw new Error('No complaint found with this Tracking ID. Check the code and try again.');
      }
      const data = await res.json();
      setComplaintData(data);
    } catch (err) {
      setError(err.message);
      setComplaintData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialTrackingId) {
      setTrackingId(initialTrackingId);
      handleSearch(initialTrackingId);
    }
  }, [initialTrackingId]);

  // Determine current step index
  const getCurrentStepIndex = (status) => {
    switch (status) {
      case 'SUBMITTED': return 0;
      case 'UNDER_REVIEW': return 1;
      case 'ASSIGNED': return 2;
      case 'IN_PROGRESS': return 3;
      case 'RESOLVED': return 4;
      default: return 0;
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Header & Search Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 text-center space-y-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-sky-600">Stage 4: Track</span>
          <h1 className="text-2xl font-bold text-slate-900 mt-0.5">Citizen Tracking Portal</h1>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
            Track real-time progress, assigned municipal departments, and timeline updates.
          </p>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
          className="flex items-center gap-2 max-w-md mx-auto"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              placeholder="e.g. CP-2026-0001"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="bg-sky-600 hover:bg-sky-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Track</span>}
          </button>
        </form>

        {/* Quick Demo ID link chips */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
          <span>Try sample IDs:</span>
          {['CP-2026-0001', 'CP-2026-0005', 'CP-2026-0010'].map(id => (
            <button
              key={id}
              type="button"
              onClick={() => { setTrackingId(id); handleSearch(id); }}
              className="font-mono bg-slate-100 hover:bg-sky-50 hover:text-sky-700 px-2 py-0.5 rounded border border-slate-200 font-medium transition-colors"
            >
              {id}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-rose-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Complaint Tracking View */}
      {complaintData && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden space-y-6 p-6">
          {/* Status Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold font-mono text-sky-800">
                  {complaintData.complaint.tracking_id}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  complaintData.complaint.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' :
                  complaintData.complaint.status === 'IN_PROGRESS' ? 'bg-sky-100 text-sky-800' :
                  complaintData.complaint.status === 'ASSIGNED' ? 'bg-indigo-100 text-indigo-800' :
                  'bg-amber-100 text-amber-800'
                }`}>
                  {complaintData.complaint.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-700 mt-1">
                {complaintData.complaint.summary || complaintData.complaint.description}
              </p>
            </div>

            <div className="text-right sm:border-l sm:border-slate-200 sm:pl-4">
              <span className="text-xs text-slate-400 block">Assigned Department</span>
              <span className="text-sm font-bold text-slate-900 flex items-center sm:justify-end gap-1 mt-0.5">
                <Building className="w-3.5 h-3.5 text-sky-600" />
                {complaintData.complaint.department || 'Awaiting Assignment'}
              </span>
            </div>
          </div>

          {/* Stepper Component */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
              Resolution Progress
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {STEPS.map((step, idx) => {
                const currentIdx = getCurrentStepIndex(complaintData.complaint.status);
                const isPassed = idx <= currentIdx;
                const isCurrent = idx === currentIdx;

                return (
                  <div
                    key={step.id}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      isCurrent ? 'bg-sky-50 border-sky-400 shadow-sm' :
                      isPassed ? 'bg-slate-50 border-slate-200' :
                      'opacity-40 border-dashed border-slate-200'
                    }`}
                  >
                    <div className="flex justify-center mb-1">
                      {isPassed ? (
                        <CheckCircle2 className={`w-5 h-5 ${isCurrent ? 'text-sky-600 animate-pulse' : 'text-emerald-600'}`} />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center text-[10px] text-slate-400">
                          {idx + 1}
                        </div>
                      )}
                    </div>
                    <div className="font-bold text-xs text-slate-800">{step.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5 hidden sm:block">{step.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Resolution Details if Resolved */}
          {complaintData.complaint.status === 'RESOLVED' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-center">
              {complaintData.complaint.resolution_photo && (
                <div className="w-24 h-24 rounded-lg overflow-hidden shrink-0 border border-emerald-200">
                  <img
                    src={complaintData.complaint.resolution_photo}
                    alt="Resolved Work"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div>
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
                  Work Completion Report
                </span>
                <p className="text-sm text-emerald-950 font-medium mt-1">
                  {complaintData.complaint.resolution_notes || 'All reported issues remediated. Field inspection completed.'}
                </p>
                <span className="text-xs text-emerald-700 mt-2 block">
                  Closed on {new Date(complaintData.complaint.updated_at).toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* Timeline of Authority Updates */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Official Progress Timeline
            </h3>

            <div className="space-y-3 relative pl-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {complaintData.timeline && complaintData.timeline.map((item, idx) => (
                <div key={item.id || idx} className="relative text-xs">
                  <div className={`absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white ${
                    item.status === 'RESOLVED' ? 'bg-emerald-600' :
                    item.status === 'IN_PROGRESS' ? 'bg-sky-600' :
                    item.status === 'DUPLICATE' ? 'bg-amber-500' : 'bg-slate-400'
                  }`} />
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{item.action}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-slate-600 mt-0.5">{item.note}</p>
                  <span className="text-[10px] text-slate-400 font-medium">Actor: {item.actor}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
