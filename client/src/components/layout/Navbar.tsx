// client/src/components/layout/Navbar.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  MapPin,
  Activity,
  Bell,
  FilePlus2,
  ShieldCheck,
  Building2,
  PhoneCall,
  LogIn,
  LogOut,
  Volume2,
  VolumeX,
  ChevronDown,
  Layers,
  Radio,
  Boxes,
  Flame,
  UserCheck,
  UserPlus,
  Shield,
  LifeBuoy,
  Menu,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAlertStream } from '../../context/AlertStreamContext';
import { Modal } from '../common/Modal';
import { MobileMenuDrawer } from './MobileMenuDrawer';
import { EmergencySosModal } from '../relay/EmergencySosModal';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { latestLiveAlert, clearLatestAlert, audioEnabled, setAudioEnabled } =
    useAlertStream();

  type ActiveMenu = 'situational' | 'civilDefense' | 'emergency' | null;

  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [emergencySosOpen, setEmergencySosOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<ActiveMenu>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const navRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Timers to handle smooth hover without accidental closing
  const menuHoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const profileHoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMenuMouseEnter = (menu: ActiveMenu) => {
    if (menuHoverTimer.current) {
      clearTimeout(menuHoverTimer.current);
      menuHoverTimer.current = null;
    }
    setOpenMenu(menu);
  };

  const handleMenuMouseLeave = () => {
    menuHoverTimer.current = setTimeout(() => {
      setOpenMenu(null);
    }, 180);
  };

  const toggleMenu = (menu: 'situational' | 'civilDefense' | 'emergency') => {
    setOpenMenu((prev) => (prev === menu ? null : menu));
  };

  const handleProfileMouseEnter = () => {
    if (profileHoverTimer.current) {
      clearTimeout(profileHoverTimer.current);
      profileHoverTimer.current = null;
    }
    setIsProfileOpen(true);
  };

  const handleProfileMouseLeave = () => {
    profileHoverTimer.current = setTimeout(() => {
      setIsProfileOpen(false);
    }, 200);
  };

  // Close menus upon route change
  useEffect(() => {
    setOpenMenu(null);
    setIsProfileOpen(false);
  }, [location.pathname]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (menuHoverTimer.current) clearTimeout(menuHoverTimer.current);
      if (profileHoverTimer.current) clearTimeout(profileHoverTimer.current);
    };
  }, []);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/' || location.pathname === '/home';
    return location.pathname.startsWith(path);
  };

  // Situational Awareness Navigation Modules
  const situationalLinks = [
    {
      name: 'Live GIS Map',
      path: '/map',
      icon: MapPin,
      subtitle: 'Hazard perimeter & relief telemetry',
    },
    {
      name: 'Geo-Intelligence',
      path: '/geo-intelligence',
      icon: Activity,
      subtitle: 'Predictive AI risk & terrain models',
    },
    {
      name: 'Broadcast Alerts',
      path: '/alerts',
      icon: Bell,
      subtitle: 'Official CAP emergency directives',
    },
  ];

  // Civil Defense & Support Modules
  const civilDefenseLinks = [
    {
      name: 'Safe Shelters',
      path: '/safe-zones',
      icon: ShieldCheck,
      subtitle: 'Evacuation camps & live occupancy',
    },
    {
      name: 'Relief Resources',
      path: '/resources',
      icon: Building2,
      subtitle: 'Hospitals, NDRF units & supply depots',
    },
  ];

  // Emergency Response Modules
  const emergencyResponseLinks = [
    {
      name: 'Report Incident',
      path: '/report',
      icon: FilePlus2,
      subtitle: 'Eyewitness geotagged hazard submission',
    },
    {
      name: 'RELAY Mesh',
      path: '/relay',
      icon: Radio,
      subtitle: 'Zero-internet offline emergency SOS',
    },
  ];

  const isSituationalActive = ['/map', '/geo-intelligence', '/alerts'].some((p) =>
    location.pathname.startsWith(p)
  );
  const isCivilDefenseActive = ['/safe-zones', '/resources'].some((p) =>
    location.pathname.startsWith(p)
  );
  const isEmergencyActive = ['/report', '/relay'].some((p) =>
    location.pathname.startsWith(p)
  );

  const getButtonClass = (
    menu: 'situational' | 'civilDefense' | 'emergency',
    isActiveCategory: boolean
  ) => {
    const isOpen = openMenu === menu;
    if (isOpen) {
      return 'bg-coral-subtle text-coral border-coral shadow-xs';
    }
    if (isActiveCategory) {
      return 'bg-coral-subtle/70 text-coral border-coral/30 font-semibold shadow-xs';
    }
    return 'bg-white hover:bg-canvas text-ink border-hairline shadow-card';
  };

  // Role Badge Color Utility
  const getRoleBadgeClasses = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'AUTHORITY':
        return 'bg-coral-subtle text-coral border-coral-border';
      case 'RESPONDER':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  const getAvatarBg = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-700';
      case 'AUTHORITY':
        return 'bg-coral';
      case 'RESPONDER':
        return 'bg-blue-700';
      default:
        return 'bg-emerald-700';
    }
  };

  return (
    <>
      {/* Live SSE Alert Ticker Ribbon (Visible on all pages when active alert exists) */}
      {latestLiveAlert && (
        <div className="bg-[#FDF2F2] border-b border-[#F5C2C2] text-[#9E2A2B] px-4 py-2 flex items-center justify-between text-xs sm:text-sm font-medium tracking-normal shadow-sm animate-fade-in relative z-50">
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <span className="flex h-2 w-2 rounded-full bg-[#C64545] flex-shrink-0 animate-ping" />
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
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-hairline shadow-[0_1px_2px_rgba(0,0,0,0.02)] select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
            {/* Left: Brand Identity */}
            <Link to="/" className="flex items-center space-x-2.5 group flex-shrink-0">
              <img
                src="/logo.png"
                alt="Trinetra Logo"
                className="w-8 h-8 sm:w-9 sm:h-9 object-contain transition-transform group-hover:scale-105"
              />
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-base sm:text-lg font-bold tracking-tight text-ink font-sans">TRINETRA</span>
                </div>
                <span className="hidden lg:block text-[9px] text-ink-muted tracking-wider font-medium uppercase font-mono">
                  Disaster Early Warning Platform
                </span>
              </div>
            </Link>

            {/* Center: Three Structured Dropdown Navigation Categories */}
            <nav ref={navRef} className="hidden md:flex items-center space-x-1.5 lg:space-x-2">
              {/* Menu 1: Situational Awareness */}
              <div
                className="relative"
                onMouseEnter={() => handleMenuMouseEnter('situational')}
                onMouseLeave={handleMenuMouseLeave}
              >
                <button
                  type="button"
                  onClick={() => toggleMenu('situational')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${getButtonClass(
                    'situational',
                    isSituationalActive
                  )}`}
                  aria-expanded={openMenu === 'situational'}
                  aria-haspopup="true"
                >
                  <Activity className="w-3.5 h-3.5 text-coral" />
                  <span className="hidden lg:inline text-ink font-semibold">Situational Awareness</span>
                  <span className="lg:hidden text-ink font-semibold">Situational</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-ink-subtle transition-transform duration-200 ${
                      openMenu === 'situational' ? 'rotate-180 text-coral' : ''
                    }`}
                  />
                </button>

                {/* Situational Awareness Floating Popover */}
                <div
                  className={`pt-2 z-50 transition-all duration-200 ease-out ${
                    openMenu === 'situational'
                      ? 'opacity-100 translate-y-0 pointer-events-auto visible'
                      : 'opacity-0 -translate-y-2 pointer-events-none invisible'
                  } absolute left-0 top-full w-80 max-w-[calc(100vw-2rem)]`}
                >
                  <div
                    className="bg-white border border-[#E6DFD8] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.18)] p-3"
                    style={{ backgroundColor: '#ffffff' }}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between pb-2 mb-1.5 border-b border-hairline/60 px-1">
                      <div className="flex items-center space-x-2">
                        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-ink uppercase tracking-wider font-mono">
                          Situational Awareness
                        </span>
                      </div>
                      <span className="text-[10px] text-ink-muted font-mono">GIS Telemetry</span>
                    </div>

                    {/* Links */}
                    <div className="space-y-1">
                      {situationalLinks.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setOpenMenu(null)}
                            className={`flex items-start space-x-2.5 p-2 rounded-xl transition group ${
                              active
                                ? 'bg-coral-subtle/90 text-coral font-medium'
                                : 'hover:bg-canvas-subtle text-ink'
                            }`}
                          >
                            <div
                              className={`p-1.5 rounded-lg flex-shrink-0 transition-colors mt-0.5 ${
                                active
                                  ? 'bg-coral text-white'
                                  : 'bg-canvas-subtle group-hover:bg-coral-subtle text-coral'
                              }`}
                            >
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold leading-tight group-hover:text-coral transition-colors">
                                {item.name}
                              </p>
                              <p className="text-[10px] text-ink-muted leading-tight mt-0.5 truncate">
                                {item.subtitle}
                              </p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Menu 2: Civil Defense & Support */}
              <div
                className="relative"
                onMouseEnter={() => handleMenuMouseEnter('civilDefense')}
                onMouseLeave={handleMenuMouseLeave}
              >
                <button
                  type="button"
                  onClick={() => toggleMenu('civilDefense')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${getButtonClass(
                    'civilDefense',
                    isCivilDefenseActive
                  )}`}
                  aria-expanded={openMenu === 'civilDefense'}
                  aria-haspopup="true"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-coral" />
                  <span className="hidden lg:inline text-ink font-semibold">Civil Defense & Support</span>
                  <span className="lg:hidden text-ink font-semibold">Civil Defense</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-ink-subtle transition-transform duration-200 ${
                      openMenu === 'civilDefense' ? 'rotate-180 text-coral' : ''
                    }`}
                  />
                </button>

                {/* Civil Defense Floating Popover */}
                <div
                  className={`pt-2 z-50 transition-all duration-200 ease-out ${
                    openMenu === 'civilDefense'
                      ? 'opacity-100 translate-y-0 pointer-events-auto visible'
                      : 'opacity-0 -translate-y-2 pointer-events-none invisible'
                  } absolute left-1/2 -translate-x-1/2 top-full w-80 max-w-[calc(100vw-2rem)]`}
                >
                  <div
                    className="bg-white border border-[#E6DFD8] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.18)] p-3"
                    style={{ backgroundColor: '#ffffff' }}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between pb-2 mb-1.5 border-b border-hairline/60 px-1">
                      <div className="flex items-center space-x-2">
                        <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-ink uppercase tracking-wider font-mono">
                          Civil Defense & Support
                        </span>
                      </div>
                      <span className="text-[10px] text-ink-muted font-mono">Operations</span>
                    </div>

                    {/* Links */}
                    <div className="space-y-1">
                      {civilDefenseLinks.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setOpenMenu(null)}
                            className={`flex items-start space-x-2.5 p-2 rounded-xl transition group ${
                              active
                                ? 'bg-coral-subtle/90 text-coral font-medium'
                                : 'hover:bg-canvas-subtle text-ink'
                            }`}
                          >
                            <div
                              className={`p-1.5 rounded-lg flex-shrink-0 transition-colors mt-0.5 ${
                                active
                                  ? 'bg-coral text-white'
                                  : 'bg-canvas-subtle group-hover:bg-coral-subtle text-coral'
                              }`}
                            >
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold leading-tight group-hover:text-coral transition-colors">
                                {item.name}
                              </p>
                              <p className="text-[10px] text-ink-muted leading-tight mt-0.5 truncate">
                                {item.subtitle}
                              </p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Menu 3: Emergency Response */}
              <div
                className="relative"
                onMouseEnter={() => handleMenuMouseEnter('emergency')}
                onMouseLeave={handleMenuMouseLeave}
              >
                <button
                  type="button"
                  onClick={() => toggleMenu('emergency')}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${getButtonClass(
                    'emergency',
                    isEmergencyActive
                  )}`}
                  aria-expanded={openMenu === 'emergency'}
                  aria-haspopup="true"
                >
                  <Radio className="w-3.5 h-3.5 text-coral" />
                  <span className="hidden lg:inline text-ink font-semibold">Emergency Response</span>
                  <span className="lg:hidden text-ink font-semibold">Response</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-ink-subtle transition-transform duration-200 ${
                      openMenu === 'emergency' ? 'rotate-180 text-coral' : ''
                    }`}
                  />
                </button>

                {/* Emergency Response Floating Popover */}
                <div
                  className={`pt-2 z-50 transition-all duration-200 ease-out ${
                    openMenu === 'emergency'
                      ? 'opacity-100 translate-y-0 pointer-events-auto visible'
                      : 'opacity-0 -translate-y-2 pointer-events-none invisible'
                  } absolute right-0 top-full w-80 max-w-[calc(100vw-2rem)]`}
                >
                  <div
                    className="bg-white border border-[#E6DFD8] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.18)] p-3"
                    style={{ backgroundColor: '#ffffff' }}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between pb-2 mb-1.5 border-b border-hairline/60 px-1">
                      <div className="flex items-center space-x-2">
                        <span className="flex h-2 w-2 rounded-full bg-coral animate-ping" />
                        <span className="text-[10px] font-bold text-ink uppercase tracking-wider font-mono">
                          Emergency Response
                        </span>
                      </div>
                      <span className="text-[10px] text-coral font-mono font-semibold">Distress Action</span>
                    </div>

                    {/* Links */}
                    <div className="space-y-1">
                      {emergencyResponseLinks.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setOpenMenu(null)}
                            className={`flex items-start space-x-2.5 p-2 rounded-xl transition group ${
                              active
                                ? 'bg-coral-subtle/90 text-coral font-medium'
                                : 'hover:bg-canvas-subtle text-ink'
                            }`}
                          >
                            <div
                              className={`p-1.5 rounded-lg flex-shrink-0 transition-colors mt-0.5 ${
                                active
                                  ? 'bg-coral text-white'
                                  : 'bg-canvas-subtle group-hover:bg-coral-subtle text-coral'
                              }`}
                            >
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold leading-tight group-hover:text-coral transition-colors">
                                {item.name}
                              </p>
                              <p className="text-[10px] text-ink-muted leading-tight mt-0.5 truncate">
                                {item.subtitle}
                              </p>
                            </div>
                          </Link>
                        );
                      })}

                      {/* Helplines Directory Modal Trigger */}
                      <button
                        type="button"
                        onClick={() => {
                          setOpenMenu(null);
                          setSosModalOpen(true);
                        }}
                        className="w-full flex items-start space-x-2.5 p-2 rounded-xl transition group hover:bg-[#FDF2F2] text-ink text-left"
                      >
                        <div className="p-1.5 rounded-lg flex-shrink-0 transition-colors mt-0.5 bg-[#FDF2F2] group-hover:bg-coral group-hover:text-white text-coral">
                          <PhoneCall className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold leading-tight group-hover:text-coral transition-colors">
                            Emergency Helplines
                          </p>
                          <p className="text-[10px] text-ink-muted leading-tight mt-0.5 truncate">
                            National operators (112, 1070, 108, 101)
                          </p>
                        </div>
                      </button>
                    </div>

                    {/* Helplines Quick Dial Footer */}
                    <div className="mt-2 pt-2 border-t border-hairline/60 flex items-center justify-between text-[11px] text-ink-muted px-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px]">Emergency:</span>
                        <a href="tel:112" className="font-mono font-bold text-coral hover:underline">112</a>
                        <span className="text-hairline">•</span>
                        <a href="tel:1070" className="font-mono font-bold text-coral hover:underline">1070</a>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setOpenMenu(null);
                          setSosModalOpen(true);
                        }}
                        className="text-coral hover:underline font-semibold text-[10px]"
                      >
                        Directory →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </nav>

            {/* Right: Profile Icon Dropdown or Login */}
            <div className="flex items-center space-x-2 sm:space-x-2.5 flex-shrink-0">

              {/* Profile Icon with Hover Dropdown (Takes minimal space, consolidates portal & logout) */}
              {isAuthenticated ? (
                <div
                  ref={profileRef}
                  className="relative pl-1 sm:pl-1.5 border-l border-hairline"
                  onMouseEnter={handleProfileMouseEnter}
                  onMouseLeave={handleProfileMouseLeave}
                >
                  <button
                    type="button"
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className={`flex items-center space-x-1.5 p-1 sm:px-2 sm:py-1 rounded-xl border transition ${
                      isProfileOpen
                        ? 'bg-canvas-subtle border-hairline shadow-xs'
                        : 'bg-white hover:bg-canvas-subtle border-hairline shadow-card'
                    }`}
                    aria-expanded={isProfileOpen}
                    aria-haspopup="true"
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold uppercase text-white shadow-xs ${getAvatarBg(
                        user?.role
                      )}`}
                    >
                      {user?.fullName?.charAt(0) || 'U'}
                    </div>
                    <span className="hidden sm:inline text-xs font-semibold text-ink max-w-[85px] truncate">
                      {user?.fullName?.split(' ')[0] || user?.fullName}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-ink-subtle transition-transform duration-200 ${
                        isProfileOpen ? 'rotate-180 text-coral' : ''
                      }`}
                    />
                  </button>

                  {/* Profile Hover Dropdown Menu */}
                  <div
                    className={`absolute top-full right-0 pt-2 z-50 transition-all duration-200 ease-out w-64 ${
                      isProfileOpen
                        ? 'opacity-100 translate-y-0 pointer-events-auto visible'
                        : 'opacity-0 -translate-y-2 pointer-events-none invisible'
                    }`}
                  >
                    <div
                      className="bg-white border border-[#E6DFD8] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.18)] p-2 divide-y divide-hairline/60"
                      style={{ backgroundColor: '#ffffff' }}
                    >
                      {/* User Identity Info */}
                      <div className="p-2.5">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold uppercase text-white shadow-xs flex-shrink-0 ${getAvatarBg(
                              user?.role
                            )}`}
                          >
                            {user?.fullName?.charAt(0) || 'U'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-ink truncate leading-tight">
                              {user?.fullName}
                            </p>
                            <p className="text-[10px] text-ink-muted truncate font-mono mt-0.5">
                              {user?.email}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2.5 flex items-center justify-between">
                          <span
                            className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${getRoleBadgeClasses(
                              user?.role
                            )}`}
                          >
                            {user?.role === 'CITIZEN' ? 'Verified Citizen' : `${user?.role} Officer`}
                          </span>
                          {user?.badgeNumber && (
                            <span className="text-[9px] font-mono text-ink-muted">
                              #{user.badgeNumber}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Primary Role Portal & Navigation Links */}
                      <div className="py-1.5 space-y-0.5">
                        {user?.role === 'CITIZEN' ? (
                          <>
                            <Link
                              to="/citizen/portal"
                              onClick={() => setIsProfileOpen(false)}
                              className="flex items-center space-x-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-ink hover:bg-coral-subtle/80 hover:text-coral transition group"
                            >
                              <div className="p-1.5 rounded-lg bg-coral-subtle text-coral group-hover:bg-coral group-hover:text-white transition">
                                <ShieldCheck className="w-3.5 h-3.5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <span>My Safety Portal</span>
                                  <span className="text-[9px] font-mono font-medium text-coral bg-coral-subtle px-1.5 py-0.2 rounded">
                                    Active
                                  </span>
                                </div>
                                <p className="text-[10px] text-ink-muted font-normal mt-0.5">
                                  Incident tracking & bulletins
                                </p>
                              </div>
                            </Link>

                            <Link
                              to="/report"
                              onClick={() => setIsProfileOpen(false)}
                              className="flex items-center space-x-2.5 px-2.5 py-2 rounded-xl text-xs font-medium text-ink hover:bg-canvas-subtle transition group"
                            >
                              <div className="p-1.5 rounded-lg bg-canvas-subtle text-ink-muted group-hover:text-ink transition">
                                <FilePlus2 className="w-3.5 h-3.5" />
                              </div>
                              <span>Submit Hazard Report</span>
                            </Link>
                          </>
                        ) : (
                          <>
                            <Link
                              to="/authority/dashboard"
                              onClick={() => setIsProfileOpen(false)}
                              className="flex items-center space-x-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-ink hover:bg-canvas-subtle hover:text-coral transition group"
                            >
                              <div className="p-1.5 rounded-lg bg-canvas-subtle text-coral group-hover:bg-coral group-hover:text-white transition">
                                <ShieldCheck className="w-3.5 h-3.5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p>Command Dashboard</p>
                                <p className="text-[10px] text-ink-muted font-normal">Operational telemetry</p>
                              </div>
                            </Link>

                            <Link
                              to="/authority/triage"
                              onClick={() => setIsProfileOpen(false)}
                              className="flex items-center space-x-2.5 px-2.5 py-2 rounded-xl text-xs font-medium text-ink hover:bg-canvas-subtle transition group"
                            >
                              <div className="p-1.5 rounded-lg bg-canvas-subtle text-ink-muted group-hover:text-ink transition">
                                <Shield className="w-3.5 h-3.5" />
                              </div>
                              <span>Incident Triage</span>
                            </Link>

                            {(user?.role === 'ADMIN' || user?.role === 'AUTHORITY') && (
                              <>
                                <Link
                                  to="/authority/alerts"
                                  onClick={() => setIsProfileOpen(false)}
                                  className="flex items-center space-x-2.5 px-2.5 py-2 rounded-xl text-xs font-medium text-ink hover:bg-canvas-subtle transition group"
                                >
                                  <div className="p-1.5 rounded-lg bg-canvas-subtle text-ink-muted group-hover:text-ink transition">
                                    <Radio className="w-3.5 h-3.5" />
                                  </div>
                                  <span>EAS Broadcast Studio</span>
                                </Link>
                                <Link
                                  to="/authority/disasters"
                                  onClick={() => setIsProfileOpen(false)}
                                  className="flex items-center space-x-2.5 px-2.5 py-2 rounded-xl text-xs font-medium text-ink hover:bg-canvas-subtle transition group"
                                >
                                  <div className="p-1.5 rounded-lg bg-canvas-subtle text-ink-muted group-hover:text-ink transition">
                                    <Flame className="w-3.5 h-3.5" />
                                  </div>
                                  <span>Disaster Lifecycle</span>
                                </Link>
                              </>
                            )}

                            {(user?.role === 'ADMIN' || user?.role === 'RESPONDER') && (
                              <Link
                                to="/authority/resources"
                                onClick={() => setIsProfileOpen(false)}
                                className="flex items-center space-x-2.5 px-2.5 py-2 rounded-xl text-xs font-medium text-ink hover:bg-canvas-subtle transition group"
                              >
                                <div className="p-1.5 rounded-lg bg-canvas-subtle text-ink-muted group-hover:text-ink transition">
                                  <Boxes className="w-3.5 h-3.5" />
                                </div>
                                <span>Resource Allocation</span>
                              </Link>
                            )}

                            {user?.role === 'ADMIN' && (
                              <Link
                                to="/authority/users"
                                onClick={() => setIsProfileOpen(false)}
                                className="flex items-center space-x-2.5 px-2.5 py-2 rounded-xl text-xs font-medium text-ink hover:bg-canvas-subtle transition group"
                              >
                                <div className="p-1.5 rounded-lg bg-purple-50 text-purple-700 group-hover:bg-purple-100 transition">
                                  <UserPlus className="w-3.5 h-3.5" />
                                </div>
                                <span>User Management</span>
                              </Link>
                            )}
                          </>
                        )}
                      </div>

                      {/* Sign Out Action */}
                      <div className="pt-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setIsProfileOpen(false);
                            logout();
                          }}
                          className="w-full flex items-center space-x-2 px-2.5 py-2 text-xs font-semibold text-[#9E2A2B] hover:bg-[#FDF2F2] rounded-xl transition"
                        >
                          <LogOut className="w-3.5 h-3.5 text-[#9E2A2B]" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-1.5">
                  <Link
                    to="/login"
                    className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-coral hover:bg-coral-hover text-white text-xs font-semibold rounded-xl shadow-xs transition whitespace-nowrap"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In</span>
                  </Link>
                </div>
              )}

              {/* Mobile Quick Action Buttons (Helplines, Audio Siren & Menu Drawer) */}
              <div className="flex md:hidden items-center space-x-1 pl-1 border-l border-hairline">
                <button
                  type="button"
                  onClick={() => setAudioEnabled(!audioEnabled)}
                  className="p-1.5 rounded-xl border border-hairline bg-white text-ink-muted hover:text-ink transition"
                  title={audioEnabled ? 'Mute Siren' : 'Enable Siren'}
                  aria-label="Toggle Siren Audio"
                >
                  {audioEnabled ? (
                    <Volume2 className="w-4 h-4 text-coral" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-ink-subtle" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setSosModalOpen(true)}
                  className="p-1.5 rounded-xl border border-[#F5C2C2] bg-[#FDF2F2] text-[#9E2A2B] hover:bg-[#FBE8E8] transition"
                  title="Emergency Distress Helplines"
                  aria-label="Emergency Helplines"
                >
                  <PhoneCall className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(true)}
                  className="p-1.5 rounded-xl border border-hairline bg-white text-ink hover:bg-canvas-subtle transition"
                  aria-label="Open Directory Menu"
                >
                  <Menu className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
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

      {/* Full Feature Mobile Directory Drawer */}
      <MobileMenuDrawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        onOpenSos={() => setEmergencySosOpen(true)}
      />

      {/* Standalone Emergency SOS Modal */}
      <EmergencySosModal
        isOpen={emergencySosOpen}
        onClose={() => setEmergencySosOpen(false)}
      />
    </>
  );
};
