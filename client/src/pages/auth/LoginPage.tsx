// client/src/pages/auth/LoginPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  LogIn,
  Lock,
  Mail,
  AlertCircle,
  Eye,
  EyeOff,
  Shield,
  Loader2,
} from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { isSupabaseConfigured, supabaseSignIn } from '../../lib/supabase';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    try {
      setLoading(true);
      let authenticatedUser: any = null;
      let userToken = '';

      // 1. Try Live Supabase Auth directly
      if (isSupabaseConfigured) {
        try {
          const supaRes = await supabaseSignIn(email.trim(), password);
          if (supaRes?.user) {
            authenticatedUser = supaRes.user;
            userToken = supaRes.token;
          }
        } catch (supaErr: any) {
          console.warn('Live Supabase Auth error, checking backend fallback:', supaErr?.message);
        }
      }

      // 2. Fallback to Express backend if needed
      if (!authenticatedUser) {
        const res = await api.post('/auth/login', {
          email: email.trim(),
          password,
        });

        if (res.data?.success) {
          authenticatedUser = res.data.data.user;
          userToken = res.data.data.token;
        }
      }

      if (authenticatedUser) {
        login(userToken, authenticatedUser);

        // Role-based destination
        if (
          authenticatedUser.role === 'ADMIN' ||
          authenticatedUser.role === 'AUTHORITY' ||
          authenticatedUser.role === 'RESPONDER'
        ) {
          navigate('/authority/dashboard');
        } else {
          navigate('/citizen/portal');
        }
      } else {
        throw new Error('Authentication failed. Please verify your email and password.');
      }
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.error?.message ||
          err.message ||
          'Authentication failed. Please verify your email and password credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-3.5 sm:p-6 bg-canvas">
      <div className="max-w-md w-full bg-white border border-hairline rounded-2xl p-6 sm:p-8 space-y-6 shadow-card">
        {/* Header Branding */}
        <div className="text-center space-y-2.5">
          <div className="w-12 h-12 rounded-2xl bg-coral flex items-center justify-center mx-auto text-white shadow-sm transition-transform hover:scale-105">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-serif font-normal text-ink tracking-tight">
              TRINETRA Secure Access
            </h2>
            <p className="text-xs text-ink-muted leading-relaxed max-w-sm mx-auto mt-1">
              Unified incident awareness & disaster operations platform
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-[#FDF2F2] border border-[#F5C2C2] rounded-xl text-[#9E2A2B] text-xs flex items-center gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-[#C64545]" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink-body mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-ink-subtle absolute left-3 top-3.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="officer@agency.gov.in or user@example.com"
                className="w-full bg-canvas border border-hairline rounded-xl pl-9 pr-4 py-2.5 text-xs text-ink-body placeholder:text-ink-subtle focus:outline-none focus:border-coral focus:ring-1 focus:ring-coral/20 transition"
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-body mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-ink-subtle absolute left-3 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your account password"
                className="w-full bg-canvas border border-hairline rounded-xl pl-9 pr-10 py-2.5 text-xs text-ink-body placeholder:text-ink-subtle focus:outline-none focus:border-coral focus:ring-1 focus:ring-coral/20 transition"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-ink-subtle hover:text-ink transition"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-coral hover:bg-coral-hover active:bg-coral-active text-white font-semibold rounded-xl text-xs uppercase tracking-wider transition shadow-sm flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In to TRINETRA</span>
              </>
            )}
          </button>
        </form>

        {/* Security & Access Restriction Footer */}
        <div className="pt-3 border-t border-hairline text-center">
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-ink-muted">
            <Shield className="w-3.5 h-3.5 text-ink-subtle flex-shrink-0" />
            <span>Restricted Access: Accounts are provisioned by System Administrators.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
