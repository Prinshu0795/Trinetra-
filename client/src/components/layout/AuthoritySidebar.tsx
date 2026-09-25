// client/src/components/layout/AuthoritySidebar.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  Radio,
  Boxes,
  Flame,
  ArrowLeft,
  ShieldCheck,
  Signal,
  SignalZero,
  Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAlertStream } from '../../context/AlertStreamContext';

export const AuthoritySidebar: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { isConnected } = useAlertStream();

  const menuItems = [
    {
      title: 'Command Overview',
      path: '/authority/dashboard',
      icon: LayoutDashboard,
      allowed: ['ADMIN', 'AUTHORITY', 'RESPONDER'],
    },
    {
      title: 'Incident Triage',
      path: '/authority/triage',
      icon: ClipboardList,
      allowed: ['ADMIN', 'AUTHORITY', 'RESPONDER'],
    },
    {
      title: 'Broadcast Studio',
      path: '/authority/alerts',
      icon: Radio,
      allowed: ['ADMIN', 'AUTHORITY'],
    },
    {
      title: 'Resources & Camps',
      path: '/authority/resources',
      icon: Boxes,
      allowed: ['ADMIN', 'AUTHORITY', 'RESPONDER'],
    },
    {
      title: 'Disaster Lifecycle',
      path: '/authority/disasters',
      icon: Flame,
      allowed: ['ADMIN', 'AUTHORITY'],
    },
    {
      title: 'User Management',
      path: '/authority/users',
      icon: Users,
      allowed: ['ADMIN'],
    },
  ];

  return (
    <>
      {/* Mobile & Tablet Command Bar (Visible only on <lg) */}
      <div className="lg:hidden w-full bg-white/95 backdrop-blur-md border-b border-hairline px-3 py-2 sticky top-16 z-30 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar shadow-xs">
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
          {menuItems.map((item) => {
            if (user?.role !== 'ADMIN' && !item.allowed.includes(user?.role || '')) return null;
            const Icon = item.icon;
            const active = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                  active
                    ? 'bg-coral-subtle text-coral border-coral shadow-xs'
                    : 'bg-white hover:bg-canvas text-ink-muted hover:text-ink border-hairline'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-coral' : 'text-ink-subtle'}`} />
                <span>{item.title.split(' ')[0]}</span>
              </Link>
            );
          })}
        </div>

        <div className="flex items-center space-x-2 pl-2 border-l border-hairline shrink-0">
          <Link
            to="/citizen/portal"
            className="text-[11px] font-semibold text-ink-muted hover:text-coral transition whitespace-nowrap"
            title="Return to Citizen Portal"
          >
            Portal →
          </Link>
        </div>
      </div>

      {/* Desktop Sticky Aside Navigation (Visible only on lg+) */}
      <aside className="hidden lg:flex w-64 bg-canvas-subtle border-r border-hairline flex-col justify-between h-[calc(100vh-4rem)] sticky top-16 select-none flex-shrink-0">
        <div className="p-4 space-y-4">
          {/* Authority Identification Badge */}
          <div className="p-3.5 bg-white border border-hairline rounded-xl space-y-1.5 shadow-card">
            <div className="flex items-center space-x-2 text-coral">
              <ShieldCheck className="w-4 h-4 flex-shrink-0" />
              <span className="text-[11px] font-bold tracking-wider uppercase font-sans">
                {user?.role === 'ADMIN' ? 'Admin Directorate' : 'Command Portal'}
              </span>
            </div>
            <p className="text-sm font-semibold text-ink truncate">{user?.fullName}</p>
            <p className="text-xs text-ink-muted font-mono truncate">{user?.department || 'Operations Center'}</p>
            <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
              {user?.role === 'ADMIN' && (
                <span className="text-[10px] text-purple-700 bg-purple-50 font-mono font-bold uppercase px-1.5 py-0.5 rounded border border-purple-200 inline-block">
                  SUPERADMIN
                </span>
              )}
              {user?.badgeNumber && (
                <span className="text-[10px] text-coral font-mono font-semibold uppercase bg-coral-subtle px-1.5 py-0.5 rounded border border-coral-border inline-block">
                  Badge #{user.badgeNumber}
                </span>
              )}
            </div>
          </div>

          {/* Live Broadcast Telemetry Status */}
          <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white border border-hairline text-xs shadow-card">
            {isConnected ? (
              <>
                <span className="flex h-2 w-2 rounded-full bg-[#166534] animate-pulse" />
                <span className="text-[#166534] font-mono text-[11px] font-medium truncate">SSE Broadcast: ONLINE</span>
              </>
            ) : (
              <>
                <span className="flex h-2 w-2 rounded-full bg-[#9E2A2B]" />
                <span className="text-[#9E2A2B] font-mono text-[11px] font-medium truncate">SSE Channel: CONNECTING</span>
              </>
            )}
          </div>

          {/* Navigation Section */}
          <nav className="space-y-1 pt-1">
            {menuItems.map((item) => {
              if (user?.role !== 'ADMIN' && !item.allowed.includes(user?.role || '')) return null;
              const Icon = item.icon;
              const active = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm transition ${
                    active
                      ? 'bg-coral-subtle text-coral border border-coral-border font-semibold'
                      : 'text-ink-muted hover:text-ink hover:bg-white/70 font-medium'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-coral' : 'text-ink-subtle'}`} />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Return Link */}
        <div className="p-4 border-t border-hairline bg-canvas-subtle">
          <Link
            to="/citizen/portal"
            className="flex items-center space-x-2 text-xs font-semibold text-ink-muted hover:text-ink transition group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition" />
            <span>Return to Citizen Portal</span>
          </Link>
        </div>
      </aside>
    </>
  );
};
