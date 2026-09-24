import React, { useState, useEffect } from 'react';
import {
  FilePlus2,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  Navigation,
  ArrowRight,
} from 'lucide-react';
import api from '../../lib/api';
import { DisasterType } from '../../types';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

const DISASTER_TYPES: Array<{ type: DisasterType; label: string; icon: string }> = [
  { type: 'FLOOD', label: 'Flood / Waterlogging', icon: '🌊' },
  { type: 'CYCLONE', label: 'Cyclone / High Winds', icon: '🌀' },
  { type: 'LANDSLIDE', label: 'Landslide / Rockfall', icon: '⛰️' },
  { type: 'EARTHQUAKE', label: 'Earthquake Tremors', icon: '🏚️' },
  { type: 'WILDFIRE', label: 'Fire / Structural Blaze', icon: '🔥' },
  { type: 'URBAN_EMERGENCY', label: 'Road / Bridge Collapse', icon: '⚠️' },
];

export const ReportIncidentPage: React.FC = () => {
  const { latitude, longitude, refetchLocation } = useGeolocation();
  const { user } = useAuth();

  const [disasterType, setDisasterType] = useState<DisasterType>('FLOOD');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState('');
  const [reportLat, setReportLat] = useState<string>(latitude ? latitude.toString() : '');
  const [reportLng, setReportLng] = useState<string>(longitude ? longitude.toString() : '');
  const [citizenName, setCitizenName] = useState(user?.fullName || '');
  const [citizenPhone, setCitizenPhone] = useState(user?.phone || '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (latitude && !reportLat) setReportLat(latitude.toString());
    if (longitude && !reportLng) setReportLng(longitude.toString());
  }, [latitude, longitude, reportLat, reportLng]);

  useEffect(() => {
    if (user?.fullName && !citizenName) setCitizenName(user.fullName);
    if (user?.phone && !citizenPhone) setCitizenPhone(user.phone);
  }, [user, citizenName, citizenPhone]);

  const [submitting, setSubmitting] = useState(false);
  const [submittedReceipt, setSubmittedReceipt] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title || !description || !locationName) {
      setErrorMsg('Please fill in title, description, and location.');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('disasterType', disasterType);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('locationName', locationName);
      formData.append('latitude', reportLat);
      formData.append('longitude', reportLng);
      formData.append('citizenName', citizenName);
      formData.append('citizenPhone', citizenPhone);
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const res = await api.post('/reports', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        setSubmittedReceipt(res.data.data);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to submit incident report');
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedReceipt) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white border border-[#BBF7D0] rounded-2xl p-8 text-center space-y-6 shadow-card">
          <div className="w-14 h-14 bg-[#F0FDF4] border border-[#BBF7D0] rounded-full flex items-center justify-center mx-auto text-[#166534]">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-xs uppercase font-mono font-semibold tracking-wider text-[#166534]">
              Report Dispatched to Emergency Triage Desk
            </span>
            <h2 className="text-2xl font-serif font-normal text-ink">Incident Report Logged</h2>
            <p className="text-sm text-ink-body leading-relaxed max-w-lg mx-auto">
              Your eyewitness submission has been broadcast to the ASDMA Authority Triage Desk. Responders will verify coordinates and dispatch field units if required.
            </p>
          </div>

          {/* Tracking ID Badge */}
          <div className="p-4 bg-canvas border border-hairline rounded-xl inline-block max-w-sm w-full mx-auto">
            <p className="text-[11px] text-ink-muted uppercase font-mono font-medium">Tracking Reference</p>
            <p className="text-2xl font-bold text-coral font-mono tracking-wider mt-0.5">
              {submittedReceipt.trackingCode}
            </p>
            <p className="text-[11px] text-ink-subtle mt-1 font-mono">Status: PENDING AUTHORITY REVIEW</p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
            <Link
              to="/dashboard"
              className="px-6 py-2.5 bg-white hover:bg-canvas text-ink border border-hairline font-semibold text-sm rounded-lg shadow-card transition"
            >
              Return to Dashboard
            </Link>
            <button
              onClick={() => {
                setSubmittedReceipt(null);
                setTitle('');
                setDescription('');
                setImageFile(null);
                setImagePreview(null);
              }}
              className="px-6 py-2.5 bg-coral hover:bg-coral-hover text-white font-semibold text-sm rounded-lg shadow-sm transition"
            >
              Submit Another Report
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-normal text-ink flex items-center gap-2">
          <FilePlus2 className="w-5 h-5 text-coral" />
          <span>Report Live Disaster Incident</span>
        </h1>
        <p className="text-sm text-ink-muted mt-1">
          Submit verified ground eyewitness intel. Accurate reports assist commanders in immediate life-safety triage and rescue boat dispatch.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-[#FDF2F2] border border-[#F5C2C2] rounded-xl text-[#9E2A2B] text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-[#C64545]" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-hairline rounded-2xl p-6 sm:p-8 space-y-6 shadow-card">
        {/* Step 1: Select Disaster Category */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-ink">
            1. Select Incident Type
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {DISASTER_TYPES.map((dt) => (
              <button
                type="button"
                key={dt.type}
                onClick={() => setDisasterType(dt.type)}
                className={`p-3 rounded-xl border text-left flex items-center space-x-3 transition ${
                  disasterType === dt.type
                    ? 'bg-coral-subtle border-coral text-ink shadow-sm'
                    : 'bg-white border-hairline text-ink-muted hover:text-ink hover:bg-canvas-subtle'
                }`}
              >
                <span className="text-xl">{dt.icon}</span>
                <span className="text-xs font-semibold">{dt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Location & GPS Pinning */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-semibold text-ink">
              2. Location & Geocoordinates
            </label>
            <button
              type="button"
              onClick={() => {
                refetchLocation();
                if (latitude && longitude) {
                  setReportLat(latitude.toString());
                  setReportLng(longitude.toString());
                }
              }}
              className="text-xs text-coral hover:underline font-semibold flex items-center gap-1"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Use Current GPS</span>
            </button>
          </div>

          <input
            type="text"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            placeholder="e.g. Bharalumukh Lowland, Lane 4, Guwahati"
            className="w-full bg-canvas border border-hairline rounded-lg px-4 py-2.5 text-sm text-ink-body placeholder:text-ink-subtle focus:outline-none focus:border-coral focus:ring-1 focus:ring-coral/20 transition"
            required
          />

          <div className="grid grid-cols-2 gap-3 font-mono text-xs">
            <div>
              <span className="text-ink-subtle block mb-1">Latitude</span>
              <input
                type="text"
                value={reportLat}
                onChange={(e) => setReportLat(e.target.value)}
                className="w-full bg-canvas border border-hairline rounded-lg px-3 py-2 text-ink-body focus:outline-none focus:border-coral focus:ring-1 focus:ring-coral/20"
                required
              />
            </div>
            <div>
              <span className="text-ink-subtle block mb-1">Longitude</span>
              <input
                type="text"
                value={reportLng}
                onChange={(e) => setReportLng(e.target.value)}
                className="w-full bg-canvas border border-hairline rounded-lg px-3 py-2 text-ink-body focus:outline-none focus:border-coral focus:ring-1 focus:ring-coral/20"
                required
              />
            </div>
          </div>
        </div>

        {/* Step 3: Title and Detailed Description */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-ink">
            3. Eyewitness Observation
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Brief headline: e.g. Water rapidly rising near Bharalu bridge"
            className="w-full bg-canvas border border-hairline rounded-lg px-4 py-2.5 text-sm text-ink-body placeholder:text-ink-subtle focus:outline-none focus:border-coral focus:ring-1 focus:ring-coral/20 transition"
            required
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Describe current severity, stranded persons, blocked roads, or immediate rescue needs..."
            className="w-full bg-canvas border border-hairline rounded-lg px-4 py-2.5 text-sm text-ink-body placeholder:text-ink-subtle focus:outline-none focus:border-coral focus:ring-1 focus:ring-coral/20 transition"
            required
          />
        </div>

        {/* Step 4: Optional Photo Upload */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-ink">
            4. Photo Proof (Optional)
          </label>
          <div className="border-2 border-dashed border-hairline bg-canvas/50 rounded-xl p-5 text-center hover:bg-canvas transition">
            {imagePreview ? (
              <div className="relative inline-block">
                <img
                  src={imagePreview}
                  alt="Incident Preview"
                  className="max-h-48 rounded-lg object-contain border border-hairline"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                  className="absolute -top-2 -right-2 bg-coral text-white rounded-full p-1 text-xs shadow-sm hover:bg-coral-hover transition"
                >
                  ✕
                </button>
              </div>
            ) : (
              <label className="cursor-pointer flex flex-col items-center space-y-2">
                <UploadCloud className="w-8 h-8 text-ink-subtle" />
                <span className="text-xs text-ink-muted">
                  Click to take camera snap or upload JPEG/PNG/WebP photo (max 5MB)
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Step 5: Reporter Contact */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label className="block text-xs font-semibold text-ink-body mb-1">Your Name</label>
            <input
              type="text"
              value={citizenName}
              onChange={(e) => setCitizenName(e.target.value)}
              className="w-full bg-canvas border border-hairline rounded-lg px-3 py-2 text-xs text-ink-body focus:outline-none focus:border-coral"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-body mb-1">Phone Number (For Callback)</label>
            <input
              type="tel"
              value={citizenPhone}
              onChange={(e) => setCitizenPhone(e.target.value)}
              className="w-full bg-canvas border border-hairline rounded-lg px-3 py-2 text-xs text-ink-body focus:outline-none focus:border-coral"
            />
          </div>
        </div>

        {/* Submit Action */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-coral hover:bg-coral-hover active:bg-coral-active text-white font-semibold rounded-lg shadow-sm transition flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
        >
          {submitting ? (
            <span>Transmitting to Authority Desk...</span>
          ) : (
            <>
              <span>Submit Ground Incident Report</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};
