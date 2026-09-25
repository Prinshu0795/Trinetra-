// client/src/components/layout/MobileBottomNav.tsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  MapPin,
  Bell,
  AlertOctagon,
  ShieldCheck,
  LayoutDashboard,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAlertStream } from '../../context/AlertStreamContext';
import { EmergencySosModal } from '../relay/EmergencySosModal';

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { latestLiveAlert } = useAlertStream();

  const [sosModalOpen, setSosModalOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/' || location.pathname === '/home';
    return location.pathname.startsWith(path);
  };

  const isAuthorityRole =
    user?.role === 'ADMIN' || user?.role === 'AUTHORITY' || user?.role === 'RESPONDER';

  const isHomePage = location.pathname === '/' || location.pathname === '/home';

  return (
    <>
      {/* Floating / Anchored Mobile Bottom Navigation Bar (Visible only on mobile/tablet <md) */}
      <nav
        aria-label="Mobile Navigation Bar"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-hairline shadow-[0_-4px_16px_rgba(0,0,0,0.06)] px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] select-none"
      >
        <div
          className={`max-w-md mx-auto grid items-center justify-items-center ${
            isHomePage ? 'grid-cols-5' : 'grid-cols-4'
          }`}
        >
          {/* 1. Home Tab */}
          <Link
            to="/"
            className={`flex flex-col items-center justify-center w-full py-1 transition group ${
              isActive('/')
                ? 'text-coral font-bold'
                : 'text-ink-muted hover:text-ink font-medium'
            }`}
          >
            <div
              className={`p-1 rounded-xl transition ${
                isActive('/') ? 'bg-coral-subtle text-coral' : 'group-hover:bg-canvas-subtle'
              }`}
            >
              <Home className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">Home</span>
          </Link>

          {/* 2. Live GIS Map Tab */}
          <Link
            to="/geo-intelligence"
            className={`flex flex-col items-center justify-center w-full py-1 transition group ${
              isActive('/geo-intelligence') || isActive('/map')
                ? 'text-coral font-bold'
                : 'text-ink-muted hover:text-ink font-medium'
            }`}
          >
            <div
              className={`p-1 rounded-xl transition ${
                isActive('/geo-intelligence') || isActive('/map') ? 'bg-coral-subtle text-coral' : 'group-hover:bg-canvas-subtle'
              }`}
            >
              <MapPin className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">GIS Map</span>
          </Link>

          {/* 3. Center Elevated Emergency SOS Beacon (Visible ONLY on Home Page) */}
          {isHomePage && (
            <div className="flex flex-col items-center justify-center w-full -mt-5">
              <button
                type="button"
                onClick={() => setSosModalOpen(true)}
                className="relative flex items-center justify-center w-13 h-13 rounded-full bg-[#9E2A2B] hover:bg-[#852223] active:brightness-90 text-white shadow-[0_4px_14px_rgba(158,42,43,0.38)] border-[3px] border-white transition-all"
                title="Emergency SOS (Works Offline)"
                aria-label="Trigger Emergency SOS"
              >
                <AlertOctagon className="w-6 h-6 text-white" />
                {/* Radar Ping Animation */}
                <span className="absolute -inset-1 rounded-full border-2 border-[#9E2A2B]/40 animate-ping pointer-events-none" />
              </button>
              <span className="text-[10px] font-bold text-[#9E2A2B] mt-0.5 tracking-tight uppercase font-mono">
                SOS
              </span>
            </div>
          )}

          {/* 4. Broadcast Alerts Tab */}
          <Link
            to="/alerts"
            className={`flex flex-col items-center justify-center w-full py-1 transition relative group ${
              isActive('/alerts')
                ? 'text-coral font-bold'
                : 'text-ink-muted hover:text-ink font-medium'
            }`}
          >
            <div
              className={`p-1 rounded-xl relative transition ${
                isActive('/alerts') ? 'bg-coral-subtle text-coral' : 'group-hover:bg-canvas-subtle'
              }`}
            >
              <Bell className="w-5 h-5" />
              {/* Dynamic Live Alert Badge Indicator */}
              {latestLiveAlert && (
                <span className="absolute top-0.5 right-0.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-coral opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-coral" />
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">Alerts</span>
          </Link>

          {/* 5. Direct Portal / Safe Shelters Tab */}
          {isAuthenticated ? (
            <Link
              to={isAuthorityRole ? '/authority/dashboard' : '/citizen/portal'}
              className={`flex flex-col items-center justify-center w-full py-1 transition group ${
                isActive(isAuthorityRole ? '/authority/dashboard' : '/citizen/portal')
                  ? 'text-coral font-bold'
                  : 'text-ink-muted hover:text-ink font-medium'
              }`}
            >
              <div
                className={`p-1 rounded-xl transition ${
                  isActive(isAuthorityRole ? '/authority/dashboard' : '/citizen/portal')
                    ? 'bg-coral-subtle text-coral'
                    : 'group-hover:bg-canvas-subtle'
                }`}
              >
                {isAuthorityRole ? (
                  <LayoutDashboard className="w-5 h-5" />
                ) : (
                  <ShieldCheck className="w-5 h-5" />
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">
                {isAuthorityRole ? 'SEOC' : 'Portal'}
              </span>
            </Link>
          ) : (
            <Link
              to="/safe-zones"
              className={`flex flex-col items-center justify-center w-full py-1 transition group ${
                isActive('/safe-zones')
                  ? 'text-coral font-bold'
                  : 'text-ink-muted hover:text-ink font-medium'
              }`}
            >
              <div
                className={`p-1 rounded-xl transition ${
                  isActive('/safe-zones')
                    ? 'bg-coral-subtle text-coral'
                    : 'group-hover:bg-canvas-subtle'
                }`}
              >
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">Shelters</span>
            </Link>
          )}
        </div>
      </nav>

      {/* Emergency SOS Modal (Only on Home Page) */}
      {isHomePage && (
        <EmergencySosModal isOpen={sosModalOpen} onClose={() => setSosModalOpen(false)} />
      )}
    </>
  );
};

