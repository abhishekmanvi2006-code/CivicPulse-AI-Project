import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HomeOverview from './components/HomeOverview';
import CaptureForm from './components/CaptureForm';
import AuthorityDashboard from './components/AuthorityDashboard';
import CitizenTracker from './components/CitizenTracker';
import AboutLimitations from './components/AboutLimitations';
import ReportDetailModal from './components/ReportDetailModal';
import ActionBriefModal from './components/ActionBriefModal';

export default function App() {
  const [currentView, setCurrentView] = useState('home');
  const [role, setRole] = useState('citizen'); // 'citizen' | 'authority' (Mocked)
  const [backendHealth, setBackendHealth] = useState(null);
  const [kpis, setKpis] = useState(null);
  const [isResetting, setIsResetting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Selected complaint tracking ID for detail modal
  const [activeComplaintId, setActiveComplaintId] = useState(null);

  // Tracking page initial ID
  const [trackerInitialId, setTrackerInitialId] = useState('');

  // Action brief modal state
  const [actionBriefState, setActionBriefState] = useState({
    isOpen: false,
    type: null,
    targetData: null
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Fetch backend health & KPIs
  const fetchHealthAndKpis = async () => {
    try {
      const [hRes, kRes] = await Promise.all([
        fetch('/api/health').then(r => r.json()),
        fetch('/api/analytics/kpis').then(r => r.json())
      ]);
      setBackendHealth(hRes);
      setKpis(kRes);
    } catch (err) {
      console.warn('Backend not responding yet:', err.message);
    }
  };

  useEffect(() => {
    fetchHealthAndKpis();
    const interval = setInterval(fetchHealthAndKpis, 15000);
    return () => clearInterval(interval);
  }, []);

  // Reset Demo Data
  const handleResetDemo = async () => {
    if (!window.confirm('Reset SQLite database to the default 45 synthetic demo reports?')) return;
    setIsResetting(true);
    try {
      const res = await fetch('/api/admin/reset-demo', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        showToast('Demo dataset reset successfully (45 realistic reports)!');
        fetchHealthAndKpis();
      } else {
        showToast(`Reset error: ${data.error}`);
      }
    } catch (err) {
      showToast(`Reset failed: ${err.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  // Open Action Brief
  const handleOpenActionBrief = (type, targetData) => {
    setActionBriefState({
      isOpen: true,
      type,
      targetData
    });
  };

  // Navigate directly to track page with a given tracking ID
  const handleNavigateToTrack = (trackingId) => {
    setTrackerInitialId(trackingId);
    setCurrentView('track');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-[100] bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-2 duration-200 border border-slate-700">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        backendHealth={backendHealth}
        role={role}
        setRole={setRole}
        onResetDemo={handleResetDemo}
        isResetting={isResetting}
      />

      {/* Primary View Routing */}
      <main className="flex-1 pb-16">
        {currentView === 'home' && (
          <HomeOverview
            setCurrentView={setCurrentView}
            backendHealth={backendHealth}
            kpis={kpis}
            onResetDemo={handleResetDemo}
            isResetting={isResetting}
          />
        )}

        {currentView === 'report' && (
          <CaptureForm
            onReportSubmitted={(complaint) => {
              showToast(`Report logged with ID ${complaint.tracking_id}`);
              fetchHealthAndKpis();
            }}
            onNavigateToTrack={handleNavigateToTrack}
          />
        )}

        {currentView === 'dashboard' && (
          <AuthorityDashboard
            onSelectComplaint={(trackingId) => setActiveComplaintId(trackingId)}
            onOpenActionBrief={handleOpenActionBrief}
          />
        )}

        {currentView === 'track' && (
          <CitizenTracker
            initialTrackingId={trackerInitialId}
          />
        )}

        {currentView === 'about' && (
          <AboutLimitations
            backendHealth={backendHealth}
            onResetDemo={handleResetDemo}
            isResetting={isResetting}
          />
        )}
      </main>

      {/* Modals */}
      {activeComplaintId && (
        <ReportDetailModal
          trackingId={activeComplaintId}
          onClose={() => setActiveComplaintId(null)}
          onOpenActionBrief={handleOpenActionBrief}
          onUpdateSuccess={() => {
            fetchHealthAndKpis();
            showToast('Complaint status updated successfully!');
          }}
        />
      )}

      {actionBriefState.isOpen && (
        <ActionBriefModal
          type={actionBriefState.type}
          targetData={actionBriefState.targetData}
          onClose={() => setActionBriefState({ isOpen: false, type: null, targetData: null })}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">CivicPulse AI</span>
            <span>—</span>
            <span>AI for Civic Impact (Hackathon Solution)</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Local SQLite + Leaflet OSM</span>
            <span>•</span>
            <span>Google Gemini + Rule-Based Fallback</span>
            <span>•</span>
            <span className="text-amber-600 font-mono">Mocked Integrations Labelled</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
