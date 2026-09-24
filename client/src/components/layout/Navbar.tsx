// client/src/components/layout/Navbar.tsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ShieldAlert,
  MapPin,
  Bell,
  FilePlus2,
  ShieldCheck,
  Building2,
  PhoneCall,
  LogIn,
  LogOut,
  Volume2,
  VolumeX,
  Activity,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAlertStream } from '../../context/AlertStreamContext';
import { Modal } from '../common/Modal';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { latestLiveAlert, clearLatestAlert, audioEnabled, setAudioEnabled } =
    useAlertStream();

  const [sosModalOpen, setSosModalOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/' || location.pathname === '/home';
    return location.pathname.startsWith(path);
  };

  const navLinks = [
    { name: 'Live Map', path: '/map', icon: MapPin },
    { name: 'Geo-Intel', path: '/geo-intelligence', icon: Activity },
    { name: 'Alerts', path: '/alerts', icon: Bell },
    { name: 'Report Incident', path: '/report', icon: FilePlus2 },
    { name: 'Safe Shelters', path: '/safe-zones', icon: ShieldCheck },
    { name: 'Resources', path: '/resources', icon: Building2 },
  ];

  return (
    <>
      {/* Live SSE Alert Ticker Ribbon (Visible on all pages when active alert exists) */}
      {latestLiveAlert && (
        <div className="bg-[#FDF2F2] border-b border-[#F5C2C2] text-[#9E2A2B] px-4 py-2 flex items-center justify-between text-xs sm:text-sm font-medium tracking-normal shadow-sm animate-fade-in">
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <span className="flex h-2 w-2 rounded-full bg-[#C64545] flex-shrink-0" />
            <span className="bg-[#F5C2C2]/70 text-[#9E2A2B] px-1.5 py-0.5 rounded text-[10px] uppercase font-mono font-semibold tracking-wider flex-shrink-0">
              {latestLiveAlert.severity} {latestLiveAlert.type}
            </span>
            <span className="truncate text-xs">
              <strong className="font-semibold text-ink">{latestLiveAlert.title}:</strong> {latestLiveAlert.headline}
            </span>
          </div>
          <div className="flex items-center space-x-2.5 flex-shrink-0 ml-2">
            <Link
              to="/alerts"
              className="bg-white text-[#9E2A2B] border border-[#F5C2C2] hover:bg-[#FAF9F5] px-2 py-0.5 rounded text-[11px] font-semibold shadow-sm transition whitespace-nowrap"
            >
              Directives
            </Link>
            <button
              onClick={clearLatestAlert}
              className="text-[#9E2A2B]/70 hover:text-[#9E2A2B] text-xs underline font-medium"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Top Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-hairline shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-2">
            {/* Left: Brand Identity */}
            <Link to="/" className="flex items-center space-x-2.5 group flex-shrink-0">
              <img src="/logo.png" alt="Trinetra Logo" className="w-10 h-10 object-contain transition-transform group-hover:scale-105" />
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-bold tracking-tight text-ink font-sans">TRINETRA</span>
                </div>
                <span className="hidden xl:block text-[9px] text-ink-muted tracking-wider font-medium uppercase font-mono">
                  Disaster Early Warning Platform
                </span>
              </div>
            </Link>

            {/* Center: Clean Navigation Links (Spacious, No Awkward Word-Wrapping) */}
            <nav className="hidden lg:flex items-center space-x-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.path);
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                      active
                        ? 'bg-canvas-subtle text-ink font-semibold border-b-2 border-coral shadow-none'
                        : 'text-ink-muted hover:text-ink hover:bg-canvas-subtle'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${active ? 'text-coral' : 'text-ink-subtle'}`} />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right: Controls & Actions */}
            <div className="flex items-center space-x-2 sm:space-x-2.5 flex-shrink-0">
              {/* Audio Alert Toggle */}
              <button
                onClick={() => setAudioEnabled(!audioEnabled)}
                title={audioEnabled ? 'Emergency EAS Audio Sounder: Active' : 'Alert Audio Muted'}
                className="p-2 rounded-lg bg-white border border-hairline text-ink-muted hover:text-ink hover:bg-canvas-subtle transition shadow-card"
              >
                {audioEnabled ? (
                  <Volume2 className="w-4 h-4 text-[#166534]" />
                ) : (
                  <VolumeX className="w-4 h-4 text-ink-subtle" />
                )}
              </button>

              {/* SOS Emergency Helpline Button */}
              <button
                onClick={() => setSosModalOpen(true)}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-coral hover:bg-coral-hover active:bg-coral-active text-white font-semibold text-xs uppercase tracking-wider rounded-lg shadow-sm transition whitespace-nowrap"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>SOS Call</span>
              </button>

              {/* Authority Mode Portal Button (if logged in as Authority / Responder) */}
              {isAuthenticated && (user?.role === 'AUTHORITY' || user?.role === 'RESPONDER') && (
                <Link
                  to="/authority/dashboard"
                  className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-hairline text-ink hover:bg-canvas-subtle text-xs font-semibold rounded-lg shadow-card transition whitespace-nowrap"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-coral" />
                  <span>Command Center</span>
                </Link>
              )}

              {/* Citizen Personal Portal Link (if logged in as Citizen) */}
              {isAuthenticated && user?.role === 'CITIZEN' && (
                <Link
                  to="/citizen/portal"
                  className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 bg-coral-subtle border border-coral-border text-coral hover:bg-coral hover:text-white text-xs font-semibold rounded-lg shadow-sm transition whitespace-nowrap"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>My Safety Portal</span>
                </Link>
              )}

              {/* User Account / Login State */}
              {isAuthenticated ? (
                <div className="flex items-center space-x-2 pl-1 border-l border-hairline">
                  <Link
                    to={user?.role === 'CITIZEN' ? '/citizen/portal' : '/authority/dashboard'}
                    className="hidden xl:block text-right hover:opacity-80 transition"
                  >
                    <p className="text-xs font-semibold text-ink leading-tight truncate max-w-[120px]">{user?.fullName}</p>
                    <p className="text-[10px] text-ink-muted uppercase font-mono">{user?.role}</p>
                  </Link>
                  <button
                    onClick={logout}
                    title="Sign Out"
                    className="p-2 text-ink-muted hover:text-coral rounded-lg hover:bg-canvas-subtle transition"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-canvas-subtle text-ink text-xs font-semibold rounded-lg border border-hairline shadow-card transition whitespace-nowrap"
                >
                  <LogIn className="w-3.5 h-3.5 text-ink-muted" />
                  <span>Sign In</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Medium/Mobile Navigation Strip (Clean single-line horizontal scroll) */}
        <div className="lg:hidden flex items-center justify-around py-2 border-t border-hairline bg-white/95 overflow-x-auto text-xs px-2 gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-1 py-1 px-2 rounded-md whitespace-nowrap ${
                  active ? 'text-coral font-bold bg-coral-subtle' : 'text-ink-muted hover:text-ink'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{link.name}</span>
              </Link>
            );
          })}
          {isAuthenticated && (user?.role === 'AUTHORITY' || user?.role === 'RESPONDER') && (
            <Link
              to="/authority/dashboard"
              className={`flex items-center gap-1 py-1 px-2 rounded-md whitespace-nowrap ${
                location.pathname.startsWith('/authority')
                  ? 'text-coral font-bold bg-coral-subtle'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Command</span>
            </Link>
          )}
        </div>
      </header>

      {/* SOS Emergency Helplines Modal */}
      <Modal isOpen={sosModalOpen} onClose={() => setSosModalOpen(false)} title="Emergency Distress Helplines">
        <div className="space-y-4">
          <p className="text-sm text-ink-body leading-relaxed">
            If you or someone near you is in immediate life danger, call national emergency first-response operators immediately. Lines are active 24x7.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <a
              href="tel:112"
              className="flex items-center justify-between p-3.5 bg-[#FDF2F2] border border-[#F5C2C2] rounded-xl hover:bg-[#FBE8E8] transition group shadow-card"
            >
              <div>
                <p className="text-xs text-[#9E2A2B] font-semibold uppercase tracking-wider font-mono">National Emergency</p>
                <p className="text-xl font-bold text-ink">112</p>
              </div>
              <PhoneCall className="w-6 h-6 text-[#9E2A2B] group-hover:scale-105 transition" />
            </a>
            <a
              href="tel:1070"
              className="flex items-center justify-between p-3.5 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl hover:bg-[#FEF3C7] transition group shadow-card"
            >
              <div>
                <p className="text-xs text-[#92400E] font-semibold uppercase tracking-wider font-mono">NDRF Disaster Helpline</p>
                <p className="text-xl font-bold text-ink">1070</p>
              </div>
              <PhoneCall className="w-6 h-6 text-[#92400E] group-hover:scale-105 transition" />
            </a>
            <a
              href="tel:108"
              className="flex items-center justify-between p-3.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl hover:bg-[#DBEAFE] transition group shadow-card"
            >
              <div>
                <p className="text-xs text-[#1E40AF] font-semibold uppercase tracking-wider font-mono">Ambulance Service</p>
                <p className="text-xl font-bold text-ink">108</p>
              </div>
              <PhoneCall className="w-6 h-6 text-[#1E40AF] group-hover:scale-105 transition" />
            </a>
            <a
              href="tel:101"
              className="flex items-center justify-between p-3.5 bg-[#FEF3C7] border border-[#FCD34D] rounded-xl hover:bg-[#FDE68A] transition group shadow-card"
            >
              <div>
                <p className="text-xs text-[#78350F] font-semibold uppercase tracking-wider font-mono">Fire & Rescue</p>
                <p className="text-xl font-bold text-ink">101</p>
              </div>
              <PhoneCall className="w-6 h-6 text-[#78350F] group-hover:scale-105 transition" />
            </a>
          </div>
        </div>
      </Modal>
    </>
  );
};
