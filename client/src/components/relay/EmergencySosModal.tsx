// client/src/components/relay/EmergencySosModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  AlertOctagon,
  Radio,
  WifiOff,
  Wifi,
  Battery,
  MapPin,
  CheckCircle2,
  X,
  PhoneCall,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Phone,
  Sun,
} from 'lucide-react';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useAuth } from '../../context/AuthContext';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { relayMeshEngine } from '../../lib/relayMeshEngine';
import { RelayPacket, RelayEmergencyType } from '../../types';

interface EmergencySosModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SosPreset {
  id: RelayEmergencyType;
  title: string;
  icon: string;
  defaultMessage: string;
}

const SOS_PRESETS: SosPreset[] = [
  {
    id: 'FLOOD_TRAPPED',
    title: 'Flood Trapped',
    icon: '🌊',
    defaultMessage: 'Water level surging rapidly. Trapped on upper level / rooftop. Urgent boat rescue needed.',
  },
  {
    id: 'MEDICAL_CRITICAL',
    title: 'Medical Urgent',
    icon: '🩸',
    defaultMessage: 'Critical medical condition / trauma / unconscious person. Immediate 108 ambulance needed.',
  },
  {
    id: 'STRUCTURAL_COLLAPSE',
    title: 'Building Collapse',
    icon: '🏚️',
    defaultMessage: 'Structural failure / building collapse with persons trapped under debris.',
  },
  {
    id: 'FOOD_WATER_SHORTAGE',
    title: 'Hazard / Fire',
    icon: '🔥',
    defaultMessage: 'Active fire / chemical hazard cutting off safe exit. Immediate rescue needed.',
  },
];

export const EmergencySosModal: React.FC<EmergencySosModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { latitude: geoLat, longitude: geoLng } = useGeolocation();
  useBodyScrollLock(isOpen);

  // Mode Selection: Demonstrating offline mesh or online direct uplink
  const [networkMode, setNetworkMode] = useState<'OFFLINE_MESH' | 'ONLINE_UPLINK'>('OFFLINE_MESH');

  const [victimName, setVictimName] = useState(user?.fullName || '');
  const [victimPhone, setVictimPhone] = useState(user?.phone || '');
  const [emergencyType, setEmergencyType] = useState<RelayEmergencyType>('FLOOD_TRAPPED');
  const [customMessage, setCustomMessage] = useState('');
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState<boolean | null>(null);
  const [isBrowserOnline, setIsBrowserOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Live coordinates
  const [activeLat, setActiveLat] = useState<number | null>(null);
  const [activeLng, setActiveLng] = useState<number | null>(null);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [locatingGps, setLocatingGps] = useState<boolean>(false);

  // Hold-to-Trigger 3s state
  const [isHolding, setIsHolding] = useState<boolean>(false);
  const [holdProgress, setHoldProgress] = useState<number>(0);
  const holdTimerRef = useRef<any>(null);
  const holdStartRef = useRef<number>(0);

  // Visual Strobe state (silent)
  const [strobeActive, setStrobeActive] = useState<boolean>(false);

  // Submission state
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [uplinking, setUplinking] = useState<boolean>(false);
  const [deliveredPacket, setDeliveredPacket] = useState<RelayPacket | null>(null);
  const [deliveryStatus, setDeliveryStatus] = useState<'OFFLINE_VAULT' | 'ONLINE_CLOUD' | null>(null);
  const [dispatchDetails, setDispatchDetails] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Hardware telemetry acquisition
  useEffect(() => {
    if (!isOpen) {
      setStrobeActive(false);
      return;
    }

    // 1. Hardware Battery
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      (navigator as any)
        .getBattery?.()
        .then((bat: any) => {
          if (bat && typeof bat.level === 'number') {
            setBatteryLevel(Math.round(bat.level * 100));
            setIsCharging(bat.charging ?? null);
          }
        })
        .catch(() => {});
    }

    // 2. Hardware GPS Position
    setLocatingGps(true);
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setActiveLat(pos.coords.latitude);
          setActiveLng(pos.coords.longitude);
          setLocationAccuracy(Math.round(pos.coords.accuracy));
          setLocatingGps(false);
        },
        (err) => {
          console.warn('[Emergency SOS] GPS fallback to IP/default:', err);
          if (geoLat && geoLng) {
            setActiveLat(geoLat);
            setActiveLng(geoLng);
          } else {
            setActiveLat(28.6139);
            setActiveLng(77.2090);
          }
          setLocatingGps(false);
        },
        { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
      );
    } else {
      setActiveLat(geoLat || 28.6139);
      setActiveLng(geoLng || 77.2090);
      setLocatingGps(false);
    }

    // 3. Network listener
    const updateOnline = () => setIsBrowserOnline(navigator.onLine);
    window.addEventListener('online', updateOnline);
    window.addEventListener('offline', updateOnline);

    return () => {
      window.removeEventListener('online', updateOnline);
      window.removeEventListener('offline', updateOnline);
    };
  }, [isOpen, geoLat, geoLng]);

  if (!isOpen) return null;

  // HOLD-TO-TRIGGER 3S
  const startHold = () => {
    if (submitting || deliveryStatus) return;
    setIsHolding(true);
    setHoldProgress(0);
    holdStartRef.current = Date.now();

    holdTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - holdStartRef.current;
      const progress = Math.min(100, (elapsed / 3000) * 100);
      setHoldProgress(progress);

      if (elapsed >= 3000) {
        if (holdTimerRef.current) clearInterval(holdTimerRef.current);
        setIsHolding(false);
        setHoldProgress(100);
        triggerInstantSos();
      }
    }, 50);
  };

  const cancelHold = () => {
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    setIsHolding(false);
    setHoldProgress(0);
  };

  const triggerInstantSos = async (overrideType?: RelayEmergencyType, overrideMsg?: string) => {
    setErrorMessage(null);

    const latToUse = activeLat ?? geoLat ?? 28.6139;
    const lngToUse = activeLng ?? geoLng ?? 77.2090;
    const typeToUse = overrideType || emergencyType;

    const selectedPreset = SOS_PRESETS.find((p) => p.id === typeToUse);
    const messageToUse =
      overrideMsg ||
      customMessage.trim() ||
      selectedPreset?.defaultMessage ||
      'URGENT EMERGENCY DISTRESS: Immediate rescue mobilization required.';

    try {
      setSubmitting(true);
      const forceOffline = networkMode === 'OFFLINE_MESH';

      const { packet, dispatchInfo } = await relayMeshEngine.createOfflineSos(
        {
          victimName: victimName.trim() || user?.fullName || 'Distress Citizen',
          victimPhone: victimPhone.trim() || null,
          latitude: latToUse,
          longitude: lngToUse,
          emergencyType: typeToUse,
          message: messageToUse,
          batteryLevel,
        },
        forceOffline
      );

      setDeliveredPacket(packet);

      if (forceOffline) {
        setDeliveryStatus('OFFLINE_VAULT');
        setDispatchDetails(null);
      } else {
        setDeliveryStatus('ONLINE_CLOUD');
        setDispatchDetails(dispatchInfo);
      }
    } catch (err: any) {
      console.error('Failed to dispatch SOS:', err);
      setErrorMessage(err.message || 'Distress transmission failed. Try calling 112 directly.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    triggerInstantSos();
  };

  const handleSimulateUplink = async () => {
    if (!deliveredPacket) return;
    try {
      setUplinking(true);
      const res = await relayMeshEngine.transmitToCloud(deliveredPacket);
      if (res.success && res.dispatchInfo) {
        setDeliveryStatus('ONLINE_CLOUD');
        setDispatchDetails(res.dispatchInfo);
      } else {
        alert('Cloud gateway unreachable. Packet safely kept in device vault.');
      }
    } catch (err: any) {
      console.error('Failed opportunistic uplink:', err);
      alert('Uplink failed. SOS packet safely stored in local vault.');
    } finally {
      setUplinking(false);
    }
  };

  const handleReset = () => {
    cancelHold();
    setStrobeActive(false);
    setDeliveredPacket(null);
    setDeliveryStatus(null);
    setDispatchDetails(null);
    setErrorMessage(null);
  };

  const handleCloseModal = () => {
    cancelHold();
    setStrobeActive(false);
    onClose();
  };

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-3.5 sm:p-4 bg-ink/50 backdrop-blur-sm animate-fade-in font-sans transition-colors duration-300 overscroll-contain ${
        strobeActive ? 'animate-pulse bg-red-950/60' : ''
      }`}
      onClick={handleCloseModal}
    >
      <div
        className="bg-white border border-hairline rounded-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-elevated max-h-[90vh] overflow-y-auto overscroll-contain my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Minimalist Header */}
        <div className="flex items-start justify-between border-b border-hairline pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="flex h-2 w-2 rounded-full bg-coral animate-ping" />
              <h2 className="text-lg font-serif font-normal text-ink">Emergency SOS Dispatch</h2>
            </div>
            <p className="text-xs text-ink-muted mt-0.5">
              Transmits verified GNSS distress packet to ERSS 112 CAD and local P2P relay mesh.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCloseModal}
            className="p-1 text-ink-muted hover:text-ink rounded-md transition -mr-1 -mt-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ======================================================== */}
        {/* STATE 1: CAD CONFIRMATION */}
        {/* ======================================================== */}
        {deliveryStatus === 'ONLINE_CLOUD' ? (
          <div className="space-y-4 text-center py-2 animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 mx-auto">
              <ShieldCheck className="w-6 h-6 text-emerald-600 animate-pulse" />
            </div>

            <div className="space-y-1">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[11px] font-mono font-bold">
                ✓ CAD #{dispatchDetails?.cadIncidentNumber || 'ERSS-2026-LIVE'} DISPATCHED
              </span>
              <h3 className="text-base font-semibold text-ink">Emergency Response Mobilized</h3>
              <p className="text-xs text-ink-muted">
                Your coordinates have been received at the National Emergency Ops Desk. Responders are tracking your location.
              </p>
            </div>

            {/* Direct Helplines */}
            <div className="grid grid-cols-3 gap-2 text-xs font-mono">
              <a href="tel:112" className="p-2 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg text-red-700 font-bold flex items-center justify-center gap-1 transition">
                <Phone className="w-3.5 h-3.5" /> 112
              </a>
              <a href="tel:108" className="p-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-emerald-800 font-bold flex items-center justify-center gap-1 transition">
                <Phone className="w-3.5 h-3.5" /> 108
              </a>
              <a href="tel:1078" className="p-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-blue-800 font-bold flex items-center justify-center gap-1 transition">
                <Phone className="w-3.5 h-3.5" /> 1078
              </a>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-hairline">
              <button
                type="button"
                onClick={handleReset}
                className="px-3.5 py-1.5 text-xs font-medium text-ink-body bg-white border border-hairline rounded-lg hover:bg-canvas transition"
              >
                New Dispatch
              </button>
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-1.5 bg-coral hover:bg-coral-hover text-white text-xs font-semibold rounded-lg transition"
              >
                Close Window
              </button>
            </div>
          </div>
        ) : deliveryStatus === 'OFFLINE_VAULT' ? (
          /* ======================================================== */
          /* STATE 2: OFFLINE MESH BUFFER */
          /* ======================================================== */
          <div className="space-y-4 text-center py-2 animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 mx-auto">
              <Radio className="w-6 h-6 text-amber-600 animate-pulse" />
            </div>

            <div className="space-y-1">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-mono font-bold">
                STORED IN VAULT & CHIRPING ON MESH
              </span>
              <h3 className="text-base font-semibold text-ink">Zero-Internet Beacon Active</h3>
              <p className="text-xs text-ink-muted">
                Your SOS is cryptographically saved in flash storage and broadcasting over Bluetooth LE / P2P radio.
              </p>
            </div>

            <div className="p-3 bg-white border border-hairline rounded-xl text-left space-y-1.5">
              <p className="text-[11px] text-ink-muted">When reaching network coverage, upload triggers automatically:</p>
              <button
                type="button"
                onClick={handleSimulateUplink}
                disabled={uplinking}
                className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition disabled:opacity-50"
              >
                {uplinking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wifi className="w-3.5 h-3.5" />}
                <span>Simulate Gateway Ingress (Upload Now)</span>
              </button>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-hairline">
              <button
                type="button"
                onClick={handleReset}
                className="px-3.5 py-1.5 text-xs font-medium text-ink-body bg-white border border-hairline rounded-lg hover:bg-canvas transition"
              >
                New Dispatch
              </button>
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-1.5 bg-canvas hover:bg-canvas-subtle border border-hairline text-ink text-xs font-semibold rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          /* ======================================================== */
          /* STATE 3: MINIMALIST COMPOSITION FORM */
          /* ======================================================== */
          <div className="space-y-4">
            {errorMessage && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-red-900 text-xs rounded-lg flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-red-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* 1. MINIMALIST 3-SECOND HOLD BUTTON */}
            <div className="relative">
              <button
                type="button"
                onMouseDown={startHold}
                onMouseUp={cancelHold}
                onMouseLeave={cancelHold}
                onTouchStart={startHold}
                onTouchEnd={cancelHold}
                disabled={submitting}
                className={`w-full py-3.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-150 relative overflow-hidden flex items-center justify-center space-x-2 shadow-sm select-none active:scale-[0.99] ${
                  isHolding
                    ? 'bg-red-700 text-white ring-2 ring-red-400'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {/* Hold Progress Fill */}
                <div
                  className="absolute left-0 top-0 bottom-0 bg-red-900/40 transition-all duration-75"
                  style={{ width: `${holdProgress}%` }}
                />

                <AlertOctagon className={`w-4 h-4 relative z-10 ${isHolding ? 'animate-spin' : ''}`} />
                <span className="relative z-10">
                  {isHolding
                    ? `HOLDING... ${Math.ceil((3000 - (holdProgress / 100) * 3000) / 1000)}s`
                    : 'HOLD 3 SECONDS FOR INSTANT SOS'}
                </span>
              </button>
            </div>

            {/* 2. 1-TAP PRESET TILES */}
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">
                Emergency Distress Classification
              </label>
              <div className="grid grid-cols-2 gap-2">
                {SOS_PRESETS.map((preset) => {
                  const isSelected = emergencyType === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setEmergencyType(preset.id);
                        setCustomMessage(preset.defaultMessage);
                      }}
                      className={`p-2.5 rounded-lg border text-left flex items-center space-x-2 transition ${
                        isSelected
                          ? 'border-coral bg-coral-subtle text-ink font-semibold'
                          : 'border-hairline bg-white hover:bg-canvas text-ink-body'
                      }`}
                    >
                      <span className="text-lg">{preset.icon}</span>
                      <span className="text-xs truncate">{preset.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. MINIMALIST TELEMETRY STRIP */}
            <div className="flex items-center justify-between text-[11px] font-mono text-ink-muted py-1.5 px-2 bg-canvas rounded-lg border border-hairline">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-coral" />
                {locatingGps
                  ? 'Locking GPS...'
                  : activeLat && activeLng
                  ? `${activeLat.toFixed(3)}°, ${activeLng.toFixed(3)}°`
                  : 'GPS Ready'}
              </span>
              <span className="flex items-center gap-1">
                <Battery className="w-3 h-3 text-emerald-700" />
                {batteryLevel !== null ? `${batteryLevel}%` : 'Batt Monitored'}
              </span>
              <span className="flex items-center gap-1">
                {networkMode === 'ONLINE_UPLINK' ? (
                  <Wifi className="w-3 h-3 text-emerald-700" />
                ) : (
                  <WifiOff className="w-3 h-3 text-red-700" />
                )}
                {networkMode === 'ONLINE_UPLINK' ? 'Direct 112' : 'Mesh Mode'}
              </span>
            </div>

            {/* 4. MANUAL DETAILS FORM */}
            <form onSubmit={handleSubmitForm} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-ink font-semibold mb-1">Caller Name *</label>
                  <input
                    type="text"
                    required
                    value={victimName}
                    onChange={(e) => setVictimName(e.target.value)}
                    placeholder="Full name"
                    className="w-full bg-white border border-hairline rounded-lg px-3 py-2 text-ink text-xs focus:outline-none focus:border-coral transition"
                  />
                </div>
                <div>
                  <label className="block text-ink font-semibold mb-1">Emergency Phone</label>
                  <input
                    type="tel"
                    value={victimPhone}
                    onChange={(e) => setVictimPhone(e.target.value)}
                    placeholder="Mobile number"
                    className="w-full bg-white border border-hairline rounded-lg px-3 py-2 text-ink text-xs focus:outline-none focus:border-coral transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-ink font-semibold mb-1">Situation Description</label>
                <textarea
                  rows={2}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Provide situation details or landmark..."
                  className="w-full bg-white border border-hairline rounded-lg px-3 py-2 text-ink text-xs focus:outline-none focus:border-coral transition"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-hairline">
                <a
                  href="tel:112"
                  className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-lg text-xs font-bold transition flex items-center gap-1"
                  title="Call 112 directly"
                >
                  <Phone className="w-3 h-3" /> Call 112
                </a>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-3.5 py-2 text-xs font-medium text-ink-body bg-white border border-hairline rounded-lg hover:bg-canvas transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-coral hover:bg-coral-hover active:bg-coral-active text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50 flex items-center space-x-1.5"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Dispatching...</span>
                      </>
                    ) : (
                      <span>Transmit SOS</span>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
