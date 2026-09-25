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
  AlertOctagon,
  LayoutDashboard,
  ClipboardList,
  ChevronRight,
  User,
  Shield,
  Search,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

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
  const isHomePage = location.pathname === '/' || location.pathname === '/home';
  useBodyScrollLock(isOpen);

  // Close sidebar on route change
  useEffect(() => {
    onClose();
  }, [location.pathname]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/' || location.pathname === '/home';
    return location.pathname.startsWith(path);
  };

  const isAuthorityRole =
    user?.role === 'ADMIN' || user?.role === 'AUTHORITY' || user?.role === 'RESPONDER';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Navigation Sidebar"
      className="fixed inset-0 z-[9990] md:hidden flex flex-col w-full h-[100dvh] bg-white overflow-hidden animate-slide-in-right select-none overscroll-contain"
    >
      {/* 1. Sleek Header with Logo & Close Button */}
      <div className="px-4 py-3 bg-white border-b border-hairline flex items-center justify-between pt-[max(0.75rem,env(safe-area-inset-top))] flex-shrink-0">
        <Link to="/" onClick={onClose} className="flex items-center space-x-2.5">
          <img src="/logo.png" alt="Trinetra" className="w-7 h-7 object-contain" />
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-ink font-sans leading-none">
              TRINETRA
            </span>
            <span className="text-[9px] font-mono text-ink-muted leading-tight mt-0.5">
              Disaster Response
            </span>
          </div>
        </Link>

        {/* Cross / Minimize Button */}
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-xl bg-canvas-subtle hover:bg-hairline text-ink border border-hairline active:scale-90 transition-all flex items-center justify-center group"
          aria-label="Close sidebar"
          title="Close sidebar"
        >
          <X className="w-5 h-5 text-ink group-hover:text-coral transition-colors" />
        </button>
      </div>

      {/* 2. Scrollable Body: Clean, Curated, Less Cluttered */}
      <div className="flex-1 overflow-y-auto px-3.5 py-3.5 space-y-4 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
        {/* User Status Strip */}
        {isAuthenticated ? (
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-canvas-subtle border border-hairline">
            <Link
              to={isAuthorityRole ? '/authority/dashboard' : '/citizen/portal'}
              onClick={onClose}
              className="flex items-center space-x-2.5 min-w-0 flex-1 mr-2"
            >
              <div className="w-8 h-8 rounded-lg bg-coral text-white font-bold flex items-center justify-center text-xs uppercase flex-shrink-0">
                {user?.fullName?.charAt(0) || <User className="w-4 h-4" />}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-ink truncate leading-tight">
                  {user?.fullName}
                </p>
                <span className="text-[9px] font-mono text-coral font-medium uppercase">
                  {user?.role} Portal →
                </span>
              </div>
            </Link>
            <button
              onClick={() => {
                logout();
                onClose();
              }}
              className="p-1.5 rounded-lg text-ink-muted hover:text-[#9E2A2B] hover:bg-[#FDF2F2] border border-transparent hover:border-[#F5C2C2] transition"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              onClick={onClose}
              className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 bg-coral hover:bg-coral-hover text-white rounded-xl text-xs font-semibold shadow-xs transition"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </Link>
            <Link
              to="/register"
              onClick={onClose}
              className="py-2 px-3 bg-canvas-subtle hover:bg-hairline text-ink rounded-xl text-xs font-medium border border-hairline transition whitespace-nowrap"
            >
              Register
            </Link>
          </div>
        )}

        {/* Primary Navigation Links (Clean Single-Line List) */}
        <div>
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-ink-muted mb-1 px-1">
            Navigation
          </p>
          <div className="space-y-1">
            <Link
              to="/geo-intelligence"
              onClick={onClose}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl border transition text-xs ${
                isActive('/geo-intelligence') || isActive('/map')
                  ? 'bg-coral-subtle text-coral border-coral font-semibold'
                  : 'bg-white hover:bg-canvas text-ink border-hairline'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <MapPin className="w-4 h-4 text-coral flex-shrink-0" />
                <span>Live GIS & Geo-Intelligence</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-ink-subtle" />
            </Link>

            <Link
              to="/alerts"
              onClick={onClose}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl border transition text-xs ${
                isActive('/alerts')
                  ? 'bg-coral-subtle text-coral border-coral font-semibold'
                  : 'bg-white hover:bg-canvas text-ink border-hairline'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Bell className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>Broadcast Alerts</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-ink-subtle" />
            </Link>

            <Link
              to="/safe-zones"
              onClick={onClose}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl border transition text-xs ${
                isActive('/safe-zones')
                  ? 'bg-coral-subtle text-coral border-coral font-semibold'
                  : 'bg-white hover:bg-canvas text-ink border-hairline'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Safe Shelters & Camps</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-ink-subtle" />
            </Link>

            <Link
              to="/resources"
              onClick={onClose}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl border transition text-xs ${
                isActive('/resources')
                  ? 'bg-coral-subtle text-coral border-coral font-semibold'
                  : 'bg-white hover:bg-canvas text-ink border-hairline'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Building2 className="w-4 h-4 text-purple-600 flex-shrink-0" />
                <span>Relief Resources & Hospitals</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-ink-subtle" />
            </Link>

            <Link
              to="/report"
              onClick={onClose}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl border transition text-xs ${
                isActive('/report')
                  ? 'bg-coral-subtle text-coral border-coral font-semibold'
                  : 'bg-white hover:bg-canvas text-ink border-hairline'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <FilePlus2 className="w-4 h-4 text-coral flex-shrink-0" />
                <span>Report Hazard Incident</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-ink-subtle" />
            </Link>

            <Link
              to="/relay"
              onClick={onClose}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl border transition text-xs ${
                isActive('/relay')
                  ? 'bg-coral-subtle text-coral border-coral font-semibold'
                  : 'bg-white hover:bg-canvas text-ink border-hairline'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Radio className="w-4 h-4 text-neutral-700 flex-shrink-0" />
                <span>RELAY Mesh (Offline SOS)</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-ink-subtle" />
            </Link>
          </div>
        </div>

        {/* Authority Operations (Only when logged in as Authority/Admin) */}
        {isAuthorityRole && (
          <div>
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-coral mb-1 px-1">
              Authority Operations
            </p>
            <div className="space-y-1 bg-coral-subtle/30 p-1.5 rounded-xl border border-coral-border">
              <Link
                to="/authority/dashboard"
                onClick={onClose}
                className="flex items-center justify-between px-2.5 py-2 rounded-lg bg-white text-ink text-xs font-semibold border border-hairline"
              >
                <div className="flex items-center space-x-2">
                  <LayoutDashboard className="w-3.5 h-3.5 text-coral" />
                  <span>Command Center Desk</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-ink-subtle" />
              </Link>
              <Link
                to="/authority/triage"
                onClick={onClose}
                className="flex items-center justify-between px-2.5 py-2 rounded-lg bg-white text-ink text-xs font-medium border border-hairline"
              >
                <div className="flex items-center space-x-2">
                  <ClipboardList className="w-3.5 h-3.5 text-ink-muted" />
                  <span>Incident Triage</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-ink-subtle" />
              </Link>
              <Link
                to="/authority/alerts"
                onClick={onClose}
                className="flex items-center justify-between px-2.5 py-2 rounded-lg bg-white text-ink text-xs font-medium border border-hairline"
              >
                <div className="flex items-center space-x-2">
                  <Radio className="w-3.5 h-3.5 text-ink-muted" />
                  <span>EAS Alert Studio</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-ink-subtle" />
              </Link>
            </div>
          </div>
        )}

        {/* Emergency Helplines (Compact 4-Pill Row) */}
        <div className="pt-2 border-t border-hairline">
          <div className="flex items-center justify-between mb-1.5 px-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-ink-muted">
              24x7 Helplines
            </span>
            <span className="text-[9px] font-mono text-[#166534] bg-[#F0FDF4] px-1.5 py-0.2 rounded border border-[#BBF7D0]">
              Toll Free
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1.5 text-center">
            <a
              href="tel:112"
              className="py-1.5 px-1 bg-[#FDF2F2] border border-[#F5C2C2] rounded-lg active:scale-95 transition"
            >
              <p className="text-[9px] text-[#9E2A2B] font-mono font-semibold">National</p>
              <p className="text-xs font-bold text-ink">112</p>
            </a>
            <a
              href="tel:1070"
              className="py-1.5 px-1 bg-[#FFFBEB] border border-[#FDE68A] rounded-lg active:scale-95 transition"
            >
              <p className="text-[9px] text-[#92400E] font-mono font-semibold">NDRF</p>
              <p className="text-xs font-bold text-ink">1070</p>
            </a>
            <a
              href="tel:108"
              className="py-1.5 px-1 bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg active:scale-95 transition"
            >
              <p className="text-[9px] text-[#1E40AF] font-mono font-semibold">Ambulance</p>
              <p className="text-xs font-bold text-ink">108</p>
            </a>
            <a
              href="tel:101"
              className="py-1.5 px-1 bg-[#FEF3C7] border border-[#FCD34D] rounded-lg active:scale-95 transition"
            >
              <p className="text-[9px] text-[#78350F] font-mono font-semibold">Fire</p>
              <p className="text-xs font-bold text-ink">101</p>
            </a>
          </div>
        </div>

        {/* Compact SOS Emergency Button (Only on Home Page) */}
        {isHomePage && (
          <div>
            <button
              onClick={() => {
                onClose();
                onOpenSos();
              }}
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 bg-[#9E2A2B] hover:bg-[#852223] text-white rounded-xl text-xs font-bold tracking-wide active:scale-[0.98] transition shadow-xs"
            >
              <AlertOctagon className="w-4 h-4 text-white" />
              <span>TRIGGER EMERGENCY SOS</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
