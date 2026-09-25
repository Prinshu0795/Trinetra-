// client/src/pages/auth/RegisterPage.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  Lock,
  Mail,
  User,
  Phone,
  AlertCircle,
  Building,
  BadgeAlert,
  Eye,
  EyeOff,
  Flame,
  Shield,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, login } = useAuth();

  const [checkingStatus, setCheckingStatus] = useState(true);
  const [isBootstrap, setIsBootstrap] = useState(false);

  // Form State (for initial bootstrap setup)
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [department, setDepartment] = useState('National Disaster Management Command');
  const [badgeNumber, setBadgeNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // If user is already logged in as Admin, redirect to User Management
    if (user?.role === 'ADMIN') {
      navigate('/authority/users', { replace: true });
      return;
    }

    // Check system status to see if DB is in fresh setup mode (0 users)
    const checkSystem = async () => {
      try {
        const res = await api.get('/auth/status');
        if (res.data.success && res.data.data?.allowsBootstrap) {
          setIsBootstrap(true);
        } else {
          setIsBootstrap(false);
        }
      } catch (e) {
        setIsBootstrap(false);
      } finally {
        setCheckingStatus(false);
      }
    };

    checkSystem();
  }, [user, navigate]);

  const handleBootstrapSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    try {
      setLoading(true);
      const payload: any = {
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        password,
        role: 'ADMIN',
        department: department.trim() || null,
        badgeNumber: badgeNumber.trim() || null,
      };

      const res = await api.post('/auth/register', payload);
      if (res.data.success) {
        const { token, user: newUser } = res.data.data;
        if (token && newUser) {
          login(token, newUser);
          navigate('/authority/users');
        } else {
          navigate('/login');
        }
      }
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.error?.message ||
          'Failed to initialize administrative account. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6 bg-canvas">
        <div className="flex flex-col items-center space-y-3 text-ink-muted text-xs">
          <Loader2 className="w-6 h-6 animate-spin text-coral" />
          <span>Verifying security policies...</span>
        </div>
      </div>
    );
  }

  // If system has accounts and caller is not an authenticated Admin:
  if (!isBootstrap) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-3.5 sm:p-6 bg-canvas">
        <div className="max-w-md w-full bg-white border border-hairline rounded-2xl p-6 sm:p-8 space-y-6 shadow-card text-center">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center mx-auto text-purple-700 shadow-sm">
            <Shield className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-serif text-ink tracking-tight">
              Self-Registration Restricted
            </h2>
            <p className="text-xs text-ink-muted leading-relaxed max-w-sm mx-auto">
              To safeguard emergency operations and prevent unauthorized access to sensitive disaster telemetry, public self-registration is disabled.
            </p>
          </div>

          <div className="p-4 bg-canvas rounded-xl border border-hairline text-left space-y-2 text-xs text-ink-body">
            <p className="font-semibold text-ink flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Administrative Provisioning Required
            </p>
            <p className="text-[11px] text-ink-muted leading-relaxed">
              All accounts for Disaster Authorities, First Responders, and Operational Personnel must be created directly by a System Administrator.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <Link
              to="/login"
              className="w-full py-3 bg-coral hover:bg-coral-hover text-white font-semibold rounded-xl text-xs uppercase tracking-wider transition shadow-sm flex items-center justify-center space-x-2"
            >
              <span>Sign In with Administrator Credentials</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/"
              className="w-full py-2.5 bg-canvas hover:bg-canvas-subtle text-ink font-semibold rounded-xl text-xs transition border border-hairline flex items-center justify-center"
            >
              <span>Return to Public Safety Map</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Fresh Database Bootstrap Mode (0 users in DB)
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-3.5 sm:p-6 bg-canvas">
      <div className="max-w-lg w-full bg-white border border-hairline rounded-2xl p-6 sm:p-8 space-y-6 shadow-card">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 border border-purple-200 flex items-center justify-center mx-auto text-purple-700 shadow-sm">
            <Flame className="w-6 h-6" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif text-ink tracking-tight">
            Initial Administrator Setup
          </h2>
          <p className="text-xs text-ink-muted leading-relaxed max-w-sm mx-auto">
            Your database is ready. Create the primary System Administrator account to initialize TRINETRA and manage subsequent users.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-[#FDF2F2] border border-[#F5C2C2] rounded-xl text-[#9E2A2B] text-xs flex items-center gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#C64545]" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleBootstrapSubmit} className="space-y-4">
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-700 shrink-0" />
            <span>
              Role: <strong>SYSTEM ADMINISTRATOR (SUPERUSER)</strong>
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-body mb-1.5">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-ink-subtle absolute left-3 top-3" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Lead Operations Director"
                className="w-full bg-canvas border border-hairline rounded-xl pl-9 pr-4 py-2.5 text-xs text-ink-body focus:outline-none focus:border-coral transition"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-body mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-ink-subtle absolute left-3 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@agency.gov.in"
                className="w-full bg-canvas border border-hairline rounded-xl pl-9 pr-4 py-2.5 text-xs text-ink-body focus:outline-none focus:border-coral transition"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-body mb-1.5">
              Master Admin Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-ink-subtle absolute left-3 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full bg-canvas border border-hairline rounded-xl pl-9 pr-10 py-2.5 text-xs text-ink-body focus:outline-none focus:border-coral transition"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-ink-subtle hover:text-ink transition"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink-body mb-1.5">
                Department / Agency
              </label>
              <div className="relative">
                <Building className="w-3.5 h-3.5 text-ink-subtle absolute left-3 top-3" />
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="NDMA Command HQ"
                  className="w-full bg-canvas border border-hairline rounded-xl pl-9 pr-3 py-2.5 text-xs text-ink-body focus:outline-none focus:border-coral transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-body mb-1.5">
                Badge / Service ID
              </label>
              <div className="relative">
                <BadgeAlert className="w-3.5 h-3.5 text-ink-subtle absolute left-3 top-3" />
                <input
                  type="text"
                  value={badgeNumber}
                  onChange={(e) => setBadgeNumber(e.target.value)}
                  placeholder="ADM-001"
                  className="w-full bg-canvas border border-hairline rounded-xl pl-9 pr-3 py-2.5 text-xs text-ink-body focus:outline-none focus:border-coral transition"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-body mb-1.5">
              Phone Number (Optional)
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-ink-subtle absolute left-3 top-3" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full bg-canvas border border-hairline rounded-xl pl-9 pr-4 py-2.5 text-xs text-ink-body focus:outline-none focus:border-coral transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-coral hover:bg-coral-hover text-white font-semibold rounded-xl text-xs uppercase tracking-wider transition shadow-sm flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Initializing Administrator Account...</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Create Administrator Account</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
