// client/src/components/layout/MobileMenuDrawer.tsx
import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  X,
  MapPin,
  Activity,
  Bell,
  ShieldCheck,
  Building2,
  FilePlus2,
  Radio,
  PhoneCall,
  LogIn,
  LogOut,
  UserPlus,
  LayoutDashboard,
  ClipboardList,
  Flame,
  Boxes,
  ShieldAlert,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface MobileMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSos: () => void;
}

export const MobileMenuDrawer: React.FC<MobileMenuDrawerProps> = ({
  isOpen,
  onClose,
  onOpenSos,
}) => {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  // Close drawer when route changes
  useEffect(() => {
    onClose();
  }, [location.pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/' || location.pathname === '/home';
    return location.pathname.startsWith(path);
  };

  const isAuthorityRole =
    user?.role === 'ADMIN' || user?.role === 'AUTHORITY' || user?.role === 'RESPONDER';

  return (
    <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
      {/* Dimmed backdrop */}
      <div
        className="fixed inset-0 bg-ink/50 backdrop-blur-sm transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Slide-up sheet container */}
      <div className="relative w-full bg-white rounded-t-3xl max-h-[88vh] flex flex-col shadow-2xl border-t border-hairline overflow-hidden animate-slide-up z-10 pb-safe">
        {/* Top Pull Handle */}
        <div className="w-12 h-1.5 bg-hairline rounded-full mx-auto mt-3 mb-1" />

        {/* Drawer Header */}
        <div className="px-5 py-3 border-b border-hairline flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <img src="/logo.png" alt="Trinetra" className="w-7 h-7 object-contain" />
            <div>
              <h2 className="text-base font-bold text-ink tracking-tight font-sans">
                TRINETRA DIRECTORY
              </h2>
              <p className="text-[10px] font-mono text-ink-muted uppercase">
                Disaster Response & Early Warning
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-ink-muted hover:text-ink hover:bg-canvas-subtle transition"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto px-5 py-4 space-y-6 flex-1">
          {/* 1. Quick Emergency SOS Action Strip */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenSos();
              }}
              className="flex-1 flex items-center justify-between p-3 bg-[#9E2A2B] text-white rounded-2xl shadow-sm hover:bg-[#852223] active:scale-[0.98] transition group"
            >
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 bg-white/20 rounded-xl">
                  <ShieldAlert className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold uppercase tracking-wider">Trigger Emergency SOS</p>
                  <p className="text-[10px] text-white/80">Online & Offline Relay Mesh</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-white/70 group-hover:translate-x-0.5 transition" />
            </button>
          </div>

          {/* 2. Direct Emergency Helplines Row */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-ink-muted">
                Emergency 24x7 Helplines
              </span>
              <span className="text-[10px] font-mono text-[#166534] bg-[#F0FDF4] px-1.5 py-0.5 rounded border border-[#BBF7D0]">
                Toll Free
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <a
                href="tel:112"
                className="p-2.5 bg-[#FDF2F2] border border-[#F5C2C2] rounded-xl text-center active:scale-95 transition"
              >
                <p className="text-[10px] text-[#9E2A2B] font-mono font-semibold">National</p>
                <p className="text-sm font-bold text-ink">112</p>
              </a>
              <a
                href="tel:1070"
                className="p-2.5 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl text-center active:scale-95 transition"
              >
                <p className="text-[10px] text-[#92400E] font-mono font-semibold">NDRF</p>
                <p className="text-sm font-bold text-ink">1070</p>
              </a>
              <a
                href="tel:108"
                className="p-2.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl text-center active:scale-95 transition"
              >
                <p className="text-[10px] text-[#1E40AF] font-mono font-semibold">Ambulance</p>
                <p className="text-sm font-bold text-ink">108</p>
              </a>
              <a
                href="tel:101"
                className="p-2.5 bg-[#FEF3C7] border border-[#FCD34D] rounded-xl text-center active:scale-95 transition"
              >
                <p className="text-[10px] text-[#78350F] font-mono font-semibold">Fire</p>
                <p className="text-sm font-bold text-ink">101</p>
              </a>
            </div>
          </div>

          {/* 3. Situational Awareness Navigation */}
          <div>
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-ink-muted mb-2 px-1">
              Situational Awareness & Telemetry
            </p>
            <div className="space-y-1.5">
              <Link
                to="/map"
                className={`flex items-center justify-between p-3 rounded-2xl border transition ${
                  isActive('/map')
                    ? 'bg-coral-subtle text-coral border-coral font-semibold'
                    : 'bg-white hover:bg-canvas text-ink border-hairline'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-coral-subtle text-coral rounded-xl">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold">Live GIS Disaster Map</p>
                    <p className="text-[10px] text-ink-muted">Inundation buffers & relief telemetry</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-ink-subtle" />
              </Link>

              <Link
                to="/geo-intelligence"
                className={`flex items-center justify-between p-3 rounded-2xl border transition ${
                  isActive('/geo-intelligence')
                    ? 'bg-coral-subtle text-coral border-coral font-semibold'
                    : 'bg-white hover:bg-canvas text-ink border-hairline'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold">Geo-Intelligence & Risk Models</p>
                    <p className="text-[10px] text-ink-muted">River gauges & AI flood forecasts</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-ink-subtle" />
              </Link>

              <Link
                to="/alerts"
                className={`flex items-center justify-between p-3 rounded-2xl border transition ${
                  isActive('/alerts')
                    ? 'bg-coral-subtle text-coral border-coral font-semibold'
                    : 'bg-white hover:bg-canvas text-ink border-hairline'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-[#FDF2F2] text-[#9E2A2B] rounded-xl">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold">Broadcast Directives</p>
                    <p className="text-[10px] text-ink-muted">Official CAP alerts & audio siren</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-ink-subtle" />
              </Link>
            </div>
          </div>

          {/* 4. Civil Defense & Relief */}
          <div>
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-ink-muted mb-2 px-1">
              Civil Defense & Public Support
            </p>
            <div className="space-y-1.5">
              <Link
                to="/safe-zones"
                className={`flex items-center justify-between p-3 rounded-2xl border transition ${
                  isActive('/safe-zones')
                    ? 'bg-coral-subtle text-coral border-coral font-semibold'
                    : 'bg-white hover:bg-canvas text-ink border-hairline'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold">Evacuation Camps & Safe Zones</p>
                    <p className="text-[10px] text-ink-muted">Live occupancy & amenities</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-ink-subtle" />
              </Link>

              <Link
                to="/resources"
                className={`flex items-center justify-between p-3 rounded-2xl border transition ${
                  isActive('/resources')
                    ? 'bg-coral-subtle text-coral border-coral font-semibold'
                    : 'bg-white hover:bg-canvas text-ink border-hairline'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold">Relief Resources & Hospitals</p>
                    <p className="text-[10px] text-ink-muted">NDRF units, blood banks & supply bases</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-ink-subtle" />
              </Link>

              <Link
                to="/report"
                className={`flex items-center justify-between p-3 rounded-2xl border transition ${
                  isActive('/report')
                    ? 'bg-coral-subtle text-coral border-coral font-semibold'
                    : 'bg-white hover:bg-canvas text-ink border-hairline'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-50 text-purple-700 rounded-xl">
                    <FilePlus2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold">Report Incident</p>
                    <p className="text-[10px] text-ink-muted">Geotagged eyewitness submission</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-ink-subtle" />
              </Link>

              <Link
                to="/relay"
                className={`flex items-center justify-between p-3 rounded-2xl border transition ${
                  isActive('/relay')
                    ? 'bg-coral-subtle text-coral border-coral font-semibold'
                    : 'bg-white hover:bg-canvas text-ink border-hairline'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-neutral-100 text-neutral-800 rounded-xl">
                    <Radio className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold">RELAY Mesh Protocol</p>
                    <p className="text-[10px] text-ink-muted">Zero-internet P2P & ultrasonic chirp</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-ink-subtle" />
              </Link>
            </div>
          </div>

          {/* 5. Authority Command Modules (if authorized or link to login) */}
          {isAuthorityRole && (
            <div>
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-coral mb-2 px-1">
                SEOC Authority Command Desk
              </p>
              <div className="space-y-1.5 bg-coral-subtle/40 p-2 rounded-2xl border border-coral-border">
                <Link
                  to="/authority/dashboard"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white text-ink text-xs font-semibold border border-hairline"
                >
                  <div className="flex items-center space-x-2.5">
                    <LayoutDashboard className="w-4 h-4 text-coral" />
                    <span>Command Overview Desk</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-ink-subtle" />
                </Link>

                <Link
                  to="/authority/triage"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white text-ink text-xs font-semibold border border-hairline"
                >
                  <div className="flex items-center space-x-2.5">
                    <ClipboardList className="w-4 h-4 text-coral" />
                    <span>Incident Triage Queue</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-ink-subtle" />
                </Link>

                <Link
                  to="/authority/alerts"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white text-ink text-xs font-semibold border border-hairline"
                >
                  <div className="flex items-center space-x-2.5">
                    <Radio className="w-4 h-4 text-coral" />
                    <span>EAS Broadcast Studio</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-ink-subtle" />
                </Link>

                <Link
                  to="/authority/disasters"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white text-ink text-xs font-semibold border border-hairline"
                >
                  <div className="flex items-center space-x-2.5">
                    <Flame className="w-4 h-4 text-coral" />
                    <span>Disaster Lifecycle</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-ink-subtle" />
                </Link>

                <Link
                  to="/authority/resources"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white text-ink text-xs font-semibold border border-hairline"
                >
                  <div className="flex items-center space-x-2.5">
                    <Boxes className="w-4 h-4 text-coral" />
                    <span>Resource Stock Tracker</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-ink-subtle" />
                </Link>

                {user?.role === 'ADMIN' && (
                  <Link
                    to="/authority/users"
                    onClick={onClose}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-purple-50 text-purple-800 text-xs font-semibold border border-purple-200"
                  >
                    <div className="flex items-center space-x-2.5">
                      <UserPlus className="w-4 h-4 text-purple-700" />
                      <span>User Management & Provisioning</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-purple-400" />
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* 6. User Profile / Session Management */}
          <div className="pt-2 border-t border-hairline">
            {isAuthenticated ? (
              <div className="space-y-3">
                <div className="p-3 bg-canvas-subtle rounded-2xl flex items-center justify-between border border-hairline">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-coral text-white font-bold flex items-center justify-center text-xs uppercase flex-shrink-0">
                      {user?.fullName?.charAt(0) || 'U'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-ink truncate">{user?.fullName}</p>
                      <p className="text-[10px] text-ink-muted truncate font-mono">
                        {user?.role} • {user?.email}
                      </p>
                    </div>
                  </div>
                  <Link
                    to={isAuthorityRole ? '/authority/dashboard' : '/citizen/portal'}
                    className="px-2.5 py-1.5 bg-white text-ink text-xs font-semibold rounded-xl border border-hairline shadow-card whitespace-nowrap"
                  >
                    Portal
                  </Link>
                </div>

                <button
                  onClick={() => {
                    logout();
                    onClose();
                  }}
                  className="w-full flex items-center justify-center space-x-2 py-3 bg-[#FDF2F2] text-[#9E2A2B] border border-[#F5C2C2] rounded-2xl text-xs font-semibold transition active:scale-[0.98]"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out of TRINETRA</span>
                </button>
              </div>
            ) : (
              <div>
                <Link
                  to="/login"
                  onClick={onClose}
                  className="w-full flex items-center justify-center space-x-2 py-3 bg-coral hover:bg-coral-hover text-white rounded-2xl text-xs font-semibold shadow-sm transition active:scale-[0.98]"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
