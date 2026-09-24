// client/src/pages/auth/LoginPage.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, LogIn, Lock, Mail, AlertCircle } from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    try {
      setLoading(true);
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        const { token, user } = res.data.data;
        login(token, user);

        if (user.role === 'AUTHORITY' || user.role === 'RESPONDER') {
          navigate('/authority/dashboard');
        } else {
          navigate('/citizen/portal');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (testEmail: string) => {
    setEmail(testEmail);
    setPassword('Password123!');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-canvas">
      <div className="max-w-md w-full bg-white border border-hairline rounded-2xl p-8 space-y-6 shadow-card">
        <div className="text-center space-y-2">
          <div className="w-11 h-11 rounded-xl bg-coral flex items-center justify-center mx-auto text-white shadow-sm">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-serif font-normal text-ink tracking-tight">TRINETRA Secure Access</h2>
          <p className="text-xs text-ink-muted leading-relaxed">
            Unified incident awareness & disaster operations platform
          </p>
        </div>

        {/* 1-Click Quick Demo Login Shortcuts */}
        <div className="bg-canvas-subtle p-3.5 rounded-xl border border-hairline space-y-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted block text-center font-mono">
            SIH Evaluation 1-Click Quick Login
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('authority@trinetra.gov.in')}
              className="py-1.5 px-2 bg-white hover:bg-canvas text-ink border border-hairline rounded-lg text-xs font-semibold transition shadow-card"
            >
              Authority
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('responder@ndrf.gov.in')}
              className="py-1.5 px-2 bg-white hover:bg-canvas text-ink border border-hairline rounded-lg text-xs font-semibold transition shadow-card"
            >
              Responder
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('citizen@example.com')}
              className="py-1.5 px-2 bg-white hover:bg-canvas text-ink border border-hairline rounded-lg text-xs font-semibold transition shadow-card"
            >
              Citizen
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-[#FDF2F2] border border-[#F5C2C2] rounded-xl text-[#9E2A2B] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-[#C64545]" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink-body mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-ink-subtle absolute left-3 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@domain.gov.in"
                className="w-full bg-canvas border border-hairline rounded-lg pl-9 pr-4 py-2.5 text-xs text-ink-body placeholder:text-ink-subtle focus:outline-none focus:border-coral focus:ring-1 focus:ring-coral/20 transition"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-body mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-ink-subtle absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-canvas border border-hairline rounded-lg pl-9 pr-4 py-2.5 text-xs text-ink-body placeholder:text-ink-subtle focus:outline-none focus:border-coral focus:ring-1 focus:ring-coral/20 transition"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-coral hover:bg-coral-hover active:bg-coral-active text-white font-semibold rounded-lg text-xs uppercase tracking-wider transition shadow-sm flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" />
            <span>{loading ? 'Authenticating...' : 'Sign In to TRINETRA'}</span>
          </button>
        </form>

        <div className="text-center text-xs text-ink-muted">
          <span>Need a citizen account? </span>
          <Link to="/register" className="text-coral hover:underline font-semibold">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
};
