import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  Camera,
  MapPin,
  Crosshair,
  Sparkles,
  CheckCircle2,
  Copy,
  ArrowRight,
  AlertTriangle,
  FileText,
  Upload,
  RefreshCw,
  ExternalLink,
  PlusCircle
} from 'lucide-react';

const CATEGORIES = [
  'Let AI decide',
  'Waterlogging',
  'Road Damage',
  'Garbage',
  'Streetlight',
  'Drainage',
  'Water Supply',
  'Other'
];

const PRESETS = [
  {
    label: 'Open Manhole (Critical Safety)',
    desc: 'Uncovered sewer manhole on school road right where children walk. Extreme falling danger.',
    category: 'Drainage',
    lat: 12.9756,
    lng: 77.6416,
    address: '8th Main, Opposite National Public School'
  },
  {
    label: 'Flooded Street (Waterlogging Duplicate)',
    desc: 'Waterlogging near shops on 12th Main Road, standing rain water blocking pedestrians and vehicles.',
    category: 'Waterlogging',
    lat: 12.9783,
    lng: 77.6404,
    address: '12th Main Road, Indiranagar'
  },
  {
    label: 'Sparks from Wire (Electrical Hazard)',
    desc: 'Exposed live wire hanging from streetlight pole sparking near hospital emergency entrance.',
    category: 'Streetlight',
    lat: 12.9793,
    lng: 77.6386,
    address: 'St. Mary Hospital Entrance Road'
  }
];

export default function CaptureForm({ onReportSubmitted, onNavigateToTrack }) {
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Let AI decide');
  const [latitude, setLatitude] = useState(12.9780);
  const [longitude, setLongitude] = useState(77.6400);
  const [address, setAddress] = useState('12th Main Road, Indiranagar, Metro City');
  const [citizenName, setCitizenName] = useState('');
  const [citizenPhone, setCitizenPhone] = useState('');
  const [photoPreview, setPhotoPreview] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [copied, setCopied] = useState(false);

  // Leaflet map refs
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Fix leaflet marker icon path issue in bundlers
    const customIcon = L.divIcon({
      className: 'custom-map-marker',
      html: `
        <div style="background-color: #0284c7; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/><circle cx="12" cy="10" r="3"/></svg>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 28]
    });

    const map = L.map(mapContainerRef.current, {
      center: [latitude, longitude],
      zoom: 15,
      zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const marker = L.marker([latitude, longitude], {
      icon: customIcon,
      draggable: true
    }).addTo(map);

    marker.on('dragend', (e) => {
      const pos = e.target.getLatLng();
      setLatitude(Number(pos.lat.toFixed(5)));
      setLongitude(Number(pos.lng.toFixed(5)));
      setAddress(`Lat: ${pos.lat.toFixed(4)}, Lng: ${pos.lng.toFixed(4)} (Custom Pin)`);
    });

    map.on('click', (e) => {
      marker.setLatLng(e.latlng);
      setLatitude(Number(e.latlng.lat.toFixed(5)));
      setLongitude(Number(e.latlng.lng.toFixed(5)));
      setAddress(`Lat: ${e.latlng.lat.toFixed(4)}, Lng: ${e.latlng.lng.toFixed(4)} (Pinned Location)`);
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update marker when coords change from presets or GPS
  const updateMapPosition = (lat, lng) => {
    setLatitude(lat);
    setLongitude(lng);
    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.setView([lat, lng], 16);
      markerRef.current.setLatLng([lat, lng]);
    }
  };

  // GPS Location button
  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = Number(position.coords.latitude.toFixed(5));
          const lng = Number(position.coords.longitude.toFixed(5));
          updateMapPosition(lat, lng);
          setAddress(`Current GPS Coordinates (${lat}, ${lng})`);
        },
        () => {
          // If denied, provide fallback in city center
          updateMapPosition(12.9780, 77.6400);
          setAddress('Metro Central Hub (Simulated GPS)');
        }
      );
    }
  };

  // Image Upload Handler
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Load preset scenario
  const applyPreset = (preset) => {
    setDescription(preset.desc);
    setCategory(preset.category);
    setAddress(preset.address);
    updateMapPosition(preset.lat, preset.lng);
  };

  // Handle Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim() || description.trim().length < 5) {
      setErrorMessage('Please provide a descriptive complaint (at least 5 characters).');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          category,
          latitude,
          longitude,
          address,
          citizen_name: citizenName || 'Anonymous Citizen',
          citizen_phone: citizenPhone || null,
          image_url: photoPreview
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit report');
      }

      setSubmittedData(data.complaint);
      if (onReportSubmitted) {
        onReportSubmitted(data.complaint);
      }
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyTrackingId = () => {
    if (submittedData?.tracking_id) {
      navigator.clipboard.writeText(submittedData.tracking_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // --- STAGE 1 CONFIRMATION SCREEN ---
  if (submittedData) {
    const isDup = submittedData.is_duplicate;
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-sky-600 to-teal-600 p-6 text-white text-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold">Report Submitted to CivicPulse</h2>
            <p className="text-sky-100 text-sm mt-1">AI Pipeline has analyzed and prioritized your issue.</p>
          </div>

          <div className="p-6 space-y-6">
            {/* Tracking ID Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
              <span className="text-xs font-semibold tracking-wider uppercase text-slate-500">Your Tracking ID</span>
              <div className="flex items-center justify-center gap-3 mt-1">
                <span className="text-2xl font-mono font-bold text-sky-700 tracking-wide">
                  {submittedData.tracking_id}
                </span>
                <button
                  onClick={copyTrackingId}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-slate-200 transition-colors"
                  title="Copy Tracking ID"
                >
                  {copied ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1">Save this ID to check live progress anytime without logging in.</p>
            </div>

            {/* Duplicate Notice if merged */}
            {isDup && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-amber-900">Corroborated Issue (Duplicate Detected)</h4>
                  <p className="text-xs text-amber-800 mt-0.5">
                    Our AI geo-analysis linked your report with active ticket{' '}
                    <span className="font-mono font-bold text-amber-900">{submittedData.parent_tracking_id}</span> nearby.
                    Your report increased the parent ticket's urgency score to ensure faster action!
                  </p>
                </div>
              </div>
            )}

            {/* AI Understand Card */}
            <div className="border border-sky-100 bg-sky-50/50 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-sky-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-sky-800">AI Analysis Result</span>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white border border-sky-200 text-sky-700 font-semibold">
                  {submittedData.ai_source === 'gemini' ? 'Gemini 2.5 Flash' : 'Rule-Based Fallback'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                  <span className="text-xs text-slate-500">Detected Category</span>
                  <div className="font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                    <span>{submittedData.category}</span>
                    <span className="text-[11px] font-normal text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded font-mono">
                      {Math.round(submittedData.category_confidence * 100)}% conf
                    </span>
                  </div>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                  <span className="text-xs text-slate-500">Assigned Priority</span>
                  <div className="font-bold flex items-center gap-1.5 mt-0.5">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      submittedData.priority === 'CRITICAL' ? 'bg-rose-100 text-rose-700' :
                      submittedData.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                      submittedData.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                      'bg-emerald-100 text-emerald-700'
                    }`}>
                      {submittedData.priority} ({submittedData.priority_score}/100)
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-100">
                <span className="text-xs text-slate-500">Executive Summary</span>
                <p className="text-sm font-medium text-slate-800 mt-0.5 italic">
                  "{submittedData.summary}"
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => onNavigateToTrack(submittedData.tracking_id)}
                className="flex-1 bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <span>Track Report Status</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  setSubmittedData(null);
                  setDescription('');
                  setPhotoPreview(null);
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <PlusCircle className="w-4 h-4 text-slate-500" />
                <span>Submit Another Issue</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- STAGE 1 CAPTURE FORM ---
  return (
    <div className="max-w-3xl mx-auto py-6 px-4 sm:px-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-sky-600">Stage 1: Capture</span>
              <h1 className="text-2xl font-bold text-slate-900 mt-0.5">Report a Civic Problem</h1>
              <p className="text-sm text-slate-500 mt-1">
                Takes under 1 minute. No login required. AI prioritizes and dispatches to municipal teams.
              </p>
            </div>
          </div>

          {/* Preset Buttons for Quick Demo Testing */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-500 block mb-2">⚡ Quick 1-Click Demo Scenarios:</span>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className="text-xs bg-slate-100 hover:bg-sky-50 hover:text-sky-700 border border-slate-200 hover:border-sky-200 px-2.5 py-1.5 rounded-lg text-slate-700 transition-colors font-medium text-left"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Issue Description */}
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1">
              Describe the Problem <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Broken road with deep pothole causing vehicle skid, or open manhole near the school gate..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm placeholder:text-slate-400"
            />
            <span className="text-xs text-slate-400 mt-1 block">
              Be specific about hazards, safety risks, or affected areas.
            </span>
          </div>

          {/* Category Dropdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-medium"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === 'Let AI decide' ? '✨ Let AI decide (Recommended)' : cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Optional Photo Attachment */}
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1">
                Attach Photo <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <div className="flex items-center gap-3">
                <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-slate-300 hover:border-sky-500 bg-slate-50 hover:bg-sky-50/50 text-sm font-medium text-slate-600 transition-colors">
                  <Camera className="w-4 h-4 text-slate-400" />
                  <span>{photoPreview ? 'Change Photo' : 'Upload photo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
                {photoPreview && (
                  <div className="relative w-11 h-11 rounded-lg overflow-hidden border border-slate-300 shrink-0">
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setPhotoPreview(null)}
                      className="absolute inset-0 bg-black/40 text-white text-[10px] flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Location Picker with Leaflet Map */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-sky-600" />
                <span>Incident Location (Drag pin or click map)</span>
              </label>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                className="text-xs text-sky-600 hover:text-sky-700 font-semibold flex items-center gap-1 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-100 hover:bg-sky-100 transition-colors"
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>Use Current Location</span>
              </button>
            </div>

            {/* Leaflet Map Box */}
            <div className="h-56 w-full rounded-xl border border-slate-300 overflow-hidden relative shadow-inner">
              <div ref={mapContainerRef} className="h-full w-full" />
              <div className="absolute bottom-2 left-2 z-[400] bg-white/90 backdrop-blur px-2.5 py-1 rounded-md text-[11px] font-mono text-slate-600 border border-slate-200 shadow-sm">
                Lat: {latitude}, Lng: {longitude}
              </div>
            </div>

            {/* Manual Address Input */}
            <div className="mt-2.5">
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street address or nearby landmark..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Optional Citizen Info */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
              Citizen Contact (Optional, Mocked)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={citizenName}
                onChange={(e) => setCitizenName(e.target.value)}
                placeholder="Your Name (Optional)"
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <input
                type="text"
                value={citizenPhone}
                onChange={(e) => setCitizenPhone(e.target.value)}
                placeholder="Phone / WhatsApp (For SMS updates, Mocked)"
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 text-white font-semibold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-sky-600/20 disabled:opacity-50 transition-all text-sm"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>AI Analyzing & Calculating Priority...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Submit Complaint (Triggers AI Pipeline)</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
