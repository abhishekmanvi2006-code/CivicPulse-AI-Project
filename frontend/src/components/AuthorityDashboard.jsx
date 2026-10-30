import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  AlertTriangle,
  Flame,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  Filter,
  Search,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  MapPin,
  Building,
  School,
  Hospital,
  Compass,
  FileSpreadsheet
} from 'lucide-react';

export default function AuthorityDashboard({
  onSelectComplaint,
  onOpenActionBrief
}) {
  const [complaints, setComplaints] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [hotspots, setHotspots] = useState([]);
  const [sensitiveLocations, setSensitiveLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSensitiveOverlay, setShowSensitiveOverlay] = useState(true);
  const [mapMode, setMapMode] = useState('markers'); // 'markers' or 'clusters'

  // Map references
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerGroupRef = useRef(null);
  const sensitiveLayerGroupRef = useRef(null);

  // Fetch all dashboard data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [complaintsRes, kpisRes, hotspotsRes, sensitiveRes] = await Promise.all([
        fetch('/api/complaints').then(r => r.json()),
        fetch('/api/analytics/kpis').then(r => r.json()),
        fetch('/api/analytics/hotspots').then(r => r.json()),
        fetch('/api/sensitive-locations').then(r => r.json())
      ]);

      setComplaints(complaintsRes.complaints || []);
      setKpis(kpisRes);
      setHotspots(hotspotsRes.hotspots || []);
      setSensitiveLocations(sensitiveRes.locations || []);
    } catch (err) {
      console.error('Failed to load authority dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [12.9780, 77.6400],
      zoom: 14,
      zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    markersLayerGroupRef.current = L.layerGroup().addTo(map);
    sensitiveLayerGroupRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update map markers when filters or data change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerGroupRef.current) return;

    markersLayerGroupRef.current.clearLayers();
    sensitiveLayerGroupRef.current.clearLayers();

    // 1. Render Sensitive Locations (Mocked)
    if (showSensitiveOverlay && sensitiveLocations.length) {
      sensitiveLocations.forEach(loc => {
        const circle = L.circle([loc.latitude, loc.longitude], {
          color: loc.type === 'Hospital' ? '#e11d48' : loc.type === 'School' ? '#4f46e5' : '#0284c7',
          fillColor: loc.type === 'Hospital' ? '#ffe4e6' : loc.type === 'School' ? '#e0e7ff' : '#e0f2fe',
          fillOpacity: 0.35,
          radius: loc.radius_meters,
          weight: 1.5,
          dashArray: '4, 4'
        });

        circle.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; padding: 4px;">
            <div style="font-weight: bold; color: #0f172a;">${loc.name}</div>
            <div style="color: #64748b; font-size: 11px;">Type: ${loc.type} (Mocked Facility Zone)</div>
            <div style="color: #64748b; font-size: 11px;">Sensitivity Radius: ${loc.radius_meters}m</div>
          </div>
        `);
        sensitiveLayerGroupRef.current.addLayer(circle);
      });
    }

    // 2. Filter Complaints
    const filtered = complaints.filter(c => {
      if (categoryFilter !== 'All' && c.category !== categoryFilter) return false;
      if (statusFilter !== 'All' && c.status !== statusFilter) return false;
      if (priorityFilter !== 'All' && c.priority !== priorityFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const descMatch = (c.description || '').toLowerCase().includes(q);
        const addrMatch = (c.address || '').toLowerCase().includes(q);
        const idMatch = (c.tracking_id || '').toLowerCase().includes(q);
        if (!descMatch && !addrMatch && !idMatch) return false;
      }
      return true;
    });

    // 3. Render Complaint Markers
    filtered.forEach(c => {
      const priorityColors = {
        CRITICAL: '#e11d48', // rose-600
        HIGH: '#ea580c',     // orange-600
        MEDIUM: '#d97706',   // amber-600
        LOW: '#16a34a'       // emerald-600
      };

      const color = priorityColors[c.priority] || '#0284c7';
      const dupCount = c.duplicate_count || 1;
      const markerSize = Math.min(22 + (dupCount * 4), 38);

      const markerHtml = `
        <div style="
          background-color: ${color};
          width: ${markerSize}px;
          height: ${markerSize}px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: ${dupCount > 1 ? '11px' : '9px'};
          cursor: pointer;
        ">
          ${dupCount > 1 ? dupCount : ''}
        </div>
      `;

      const icon = L.divIcon({
        className: 'custom-map-marker',
        html: markerHtml,
        iconSize: [markerSize, markerSize],
        iconAnchor: [markerSize / 2, markerSize / 2]
      });

      const marker = L.marker([c.latitude, c.longitude], { icon });

      // Popup Content
      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; max-width: 240px; padding: 2px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span style="font-weight: bold; color: #0284c7;">${c.tracking_id}</span>
            <span style="background-color: ${color}20; color: ${color}; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 10px;">
              ${c.priority} (${c.priority_score})
            </span>
          </div>
          <div style="font-weight: 600; color: #0f172a; margin-bottom: 2px;">${c.category}</div>
          <div style="color: #475569; font-size: 11px; margin-bottom: 6px;">${c.summary || c.description.slice(0, 75)}...</div>
          ${dupCount > 1 ? `<div style="font-size: 10px; color: #d97706; font-weight: bold;">⚡ ${dupCount} Citizen Reports Corroborated</div>` : ''}
          <div style="font-size: 10px; color: #94a3b8; margin-top: 4px;">${c.address || ''}</div>
        </div>
      `);

      marker.on('click', () => {
        onSelectComplaint(c.tracking_id);
      });

      markersLayerGroupRef.current.addLayer(marker);
    });
  }, [complaints, categoryFilter, statusFilter, priorityFilter, searchQuery, showSensitiveOverlay, sensitiveLocations]);

  // Filtered complaints for the table queue
  const filteredComplaints = complaints.filter(c => {
    if (categoryFilter !== 'All' && c.category !== categoryFilter) return false;
    if (statusFilter !== 'All' && c.status !== statusFilter) return false;
    if (priorityFilter !== 'All' && c.priority !== priorityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const descMatch = (c.description || '').toLowerCase().includes(q);
      const addrMatch = (c.address || '').toLowerCase().includes(q);
      const idMatch = (c.tracking_id || '').toLowerCase().includes(q);
      if (!descMatch && !addrMatch && !idMatch) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Top Banner & Quick Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-700 bg-sky-50 px-2 py-0.5 rounded">
              Stage 3: Reveal
            </span>
            <span className="text-xs text-slate-400 font-mono">Real-Time Municipal Triage</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Authority Command Dashboard</h1>
          <p className="text-sm text-slate-500">
            Explainable priority scoring, automated spatial hotspot detection, and 1-minute AI action briefs.
          </p>
        </div>

        {/* Global Action Brief Button */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              const top5 = complaints.slice(0, 5);
              onOpenActionBrief('top5', top5);
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-semibold text-xs py-2.5 px-4 rounded-xl shadow-sm transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Today's Top 5 Action Brief</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      {kpis && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Reports */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase">Total Reports</span>
              <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">{kpis.totalReports}</div>
            <span className="text-xs text-slate-400 mt-0.5 block">Across city jurisdiction</span>
          </div>

          {/* Card 2: Critical Open */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase">Critical Open</span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-rose-600 mt-2">{kpis.criticalOpen}</div>
            <span className="text-xs text-rose-500 font-medium mt-0.5 block">Immediate safety risks</span>
          </div>

          {/* Card 3: Duplicates Merged */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase">Duplicates Merged</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">{kpis.duplicatesMerged}</div>
            <span className="text-xs text-emerald-600 font-medium mt-0.5 block">
              Auto-linked without deleting
            </span>
          </div>

          {/* Card 4: Avg Resolution Time */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase">Avg Resolution Time</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">{kpis.avgResolutionTimeHours} hrs</div>
            <span className="text-xs text-slate-400 mt-0.5 block">
              {kpis.resolutionRatePercent}% resolved
            </span>
          </div>
        </div>
      )}

      {/* Main Map & Hotspots Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Leaflet Map */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          {/* Map Header & Controls */}
          <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-sky-600" />
              <h2 className="text-sm font-bold text-slate-900">Civic Incident Heat & Priority Map</h2>
              <span className="text-xs text-slate-400">({filteredComplaints.length} markers shown)</span>
            </div>

            <div className="flex items-center gap-3">
              {/* Sensitive Zone Overlay Toggle */}
              <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showSensitiveOverlay}
                  onChange={(e) => setShowSensitiveOverlay(e.target.checked)}
                  className="rounded text-sky-600 focus:ring-sky-500"
                />
                <span>Sensitive Zones</span>
                <span className="text-[10px] bg-slate-100 px-1 rounded font-mono text-slate-400">Mocked</span>
              </label>

              {/* Priority Legend */}
              <div className="hidden sm:flex items-center gap-2 text-[11px] font-medium text-slate-500">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>Critical</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>High</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>Medium</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>Low</span>
              </div>
            </div>
          </div>

          {/* Leaflet Map Box */}
          <div className="h-[420px] w-full relative">
            <div ref={mapContainerRef} className="h-full w-full" />
            <div className="absolute top-3 right-3 z-[400] bg-white/90 backdrop-blur px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs shadow-sm font-medium text-slate-700">
              💡 Marker size reflects duplicate count
            </div>
          </div>
        </div>

        {/* Right 1 Col: Hotspot Detection Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" />
              <h2 className="text-sm font-bold text-slate-900">Detected Hotspots (Clusters)</h2>
            </div>
            <span className="text-xs bg-orange-50 text-orange-700 font-semibold px-2 py-0.5 rounded-full">
              {hotspots.length} Clusters
            </span>
          </div>

          <p className="text-xs text-slate-500 mt-2">
            Spatial clustering (DBSCAN/Distance) identifies systemic root causes from clustered symptoms.
          </p>

          <div className="mt-3 space-y-3 overflow-y-auto max-h-[360px] pr-1">
            {hotspots.map((spot, idx) => (
              <div
                key={spot.clusterId || idx}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-sky-300 transition-all text-xs space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-bold text-slate-900 text-xs">{spot.areaName}</span>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      {spot.clusterId} • {spot.reportCount} reports ({spot.totalComplaintsRepresented} citizens)
                    </div>
                  </div>
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-sky-100 text-sky-800">
                    {spot.dominantCategory}
                  </span>
                </div>

                {/* AI Root Cause Insight */}
                <div className="bg-white p-2 rounded-lg border border-slate-100 text-slate-700 italic">
                  💡 <span className="font-medium">{spot.rootCauseInsight}</span>
                </div>

                {/* Action Brief Button for this Hotspot */}
                <button
                  onClick={() => onOpenActionBrief('hotspot', spot)}
                  className="w-full flex items-center justify-center gap-1.5 bg-white hover:bg-sky-50 border border-slate-200 hover:border-sky-300 text-sky-700 font-semibold py-1.5 rounded-lg text-[11px] transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                  <span>Generate Hotspot Action Brief</span>
                </button>
              </div>
            ))}

            {hotspots.length === 0 && (
              <div className="text-center py-8 text-xs text-slate-400">
                No active geographic clusters detected currently.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Priority-Sorted Queue & Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Filters Header */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Priority Triage Queue</h2>
            <p className="text-xs text-slate-500">
              Sorted by transparent 0–100 score. Click any row to view AI factors and execute authority actions.
            </p>
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search description, ID..."
                className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 w-44"
              />
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium bg-white"
            >
              <option value="All">All Categories</option>
              <option value="Waterlogging">Waterlogging</option>
              <option value="Drainage">Drainage</option>
              <option value="Road Damage">Road Damage</option>
              <option value="Streetlight">Streetlight</option>
              <option value="Garbage">Garbage</option>
              <option value="Water Supply">Water Supply</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium bg-white"
            >
              <option value="All">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium bg-white"
            >
              <option value="All">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>
        </div>

        {/* Complaints Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Tracking ID</th>
                <th className="py-3 px-4">Priority & Score</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Explainability ("Why this priority?")</th>
                <th className="py-3 px-4">Status & Dept</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredComplaints.map((c) => {
                // Find highest scoring factor for inline explainability
                const topFactor = Array.isArray(c.priority_factors) && c.priority_factors.length
                  ? [...c.priority_factors].sort((a, b) => b.points - a.points)[0]
                  : null;

                return (
                  <tr
                    key={c.id}
                    onClick={() => onSelectComplaint(c.tracking_id)}
                    className="hover:bg-sky-50/50 cursor-pointer transition-colors"
                  >
                    {/* ID & Duplicates */}
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sky-700 font-bold">{c.tracking_id}</span>
                        {(c.duplicate_count || 1) > 1 && (
                          <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-1.5 py-0.2 rounded-full font-sans">
                            +{c.duplicate_count - 1} dups
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[140px]">
                        {c.address}
                      </div>
                    </td>

                    {/* Priority & Score Bar */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          c.priority === 'CRITICAL' ? 'bg-rose-100 text-rose-700' :
                          c.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                          c.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`}>
                          {c.priority}
                        </span>
                        <span className="font-mono font-bold text-slate-700">{c.priority_score}</span>
                      </div>
                      {/* Mini Score Bar */}
                      <div className="w-20 bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            c.priority === 'CRITICAL' ? 'bg-rose-600' :
                            c.priority === 'HIGH' ? 'bg-orange-500' :
                            c.priority === 'MEDIUM' ? 'bg-amber-500' :
                            'bg-emerald-600'
                          }`}
                          style={{ width: `${c.priority_score}%` }}
                        />
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-800">{c.category}</span>
                      <div className="text-[10px] text-slate-400">
                        {c.ai_source === 'gemini' ? 'Gemini AI' : 'Rule-Based'}
                      </div>
                    </td>

                    {/* Explainability Inline Snippet */}
                    <td className="py-3.5 px-4 max-w-sm">
                      <p className="font-medium text-slate-800 line-clamp-1">
                        {c.summary || c.description}
                      </p>
                      {topFactor && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                          <span className="font-bold text-sky-700">+{topFactor.points} pts:</span>
                          <span className="truncate">{topFactor.explanation}</span>
                        </div>
                      )}
                    </td>

                    {/* Status & Dept */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                        c.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' :
                        c.status === 'IN_PROGRESS' ? 'bg-sky-100 text-sky-800' :
                        c.status === 'ASSIGNED' ? 'bg-indigo-100 text-indigo-800' :
                        c.status === 'UNDER_REVIEW' ? 'bg-amber-100 text-amber-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {c.status.replace('_', ' ')}
                      </span>
                      <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                        {c.department || 'Unassigned'}
                      </div>
                    </td>

                    {/* Action Arrow */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectComplaint(c.tracking_id);
                        }}
                        className="text-sky-600 hover:text-sky-800 p-1 rounded hover:bg-sky-100 transition-colors"
                        title="Open Details & Actions"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredComplaints.length === 0 && (
            <div className="text-center py-10 text-slate-400 text-sm">
              No complaints match the selected filter criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
