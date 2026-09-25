// client/src/pages/authority/UserManagementPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  Radio,
  Flame,
  UserCheck,
  Trash2,
  Search,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  Building,
  BadgeAlert,
  Eye,
  EyeOff,
  RefreshCw,
} from 'lucide-react';
import { AuthoritySidebar } from '../../components/layout/AuthoritySidebar';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';
import api from '../../lib/api';

interface ManagedUser {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  role: Role;
  badgeNumber?: string | null;
  department?: string | null;
  createdAt: string;
}

export const UserManagementPage: React.FC = () => {
  const { user: currentAdmin } = useAuth();

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<Role>('AUTHORITY');
  const [department, setDepartment] = useState('');
  const [badgeNumber, setBadgeNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Deletion modal / confirm state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      let loadedUsers: ManagedUser[] = [];

      try {
        const res = await api.get('/auth/users');
        if (res.data?.success) {
          loadedUsers = res.data.data.users || [];
        }
      } catch (backendErr) {
        // Fall back to direct Supabase users query
        const { isSupabaseConfigured, supabaseGetUsers } = await import('../../lib/supabase');
        if (isSupabaseConfigured) {
          const supaUsers = await supabaseGetUsers();
          loadedUsers = supaUsers as any;
        } else {
          throw backendErr;
        }
      }

      setUsers(loadedUsers);
    } catch (err: any) {
      setErrorMsg(err.message || err.response?.data?.error?.message || 'Failed to load user directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      setSubmitting(true);
      const payload: any = {
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || null,
        role,
        department: department.trim() || null,
        badgeNumber: badgeNumber.trim() || null,
      };

      let created = false;
      try {
        const res = await api.post('/auth/register', payload);
        if (res.data?.success) {
          created = true;
        }
      } catch (backendErr) {
        // Fallback to Supabase direct user creation
        const { isSupabaseConfigured, supabaseAdminCreateUser } = await import('../../lib/supabase');
        if (isSupabaseConfigured) {
          await supabaseAdminCreateUser(payload);
          created = true;
        } else {
          throw backendErr;
        }
      }

      if (created) {
        setSuccessMsg(`Account for ${payload.fullName} (${payload.role}) created successfully in database.`);
        // Reset form
        setFullName('');
        setEmail('');
        setPassword('');
        setPhone('');
        setDepartment('');
        setBadgeNumber('');
        // Refresh users list
        fetchUsers();
      }
    } catch (err: any) {
      setErrorMsg(err.message || err.response?.data?.error?.message || 'Failed to create user account.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: string, userEmail: string) => {
    if (!window.confirm(`Are you sure you want to revoke access and delete account: ${userEmail}?`)) {
      return;
    }

    try {
      setDeletingId(id);
      setErrorMsg(null);
      let deleted = false;

      try {
        const res = await api.delete(`/auth/users/${id}`);
        if (res.data?.success) {
          deleted = true;
        }
      } catch (backendErr) {
        const { isSupabaseConfigured, supabaseAdminDeleteUser } = await import('../../lib/supabase');
        if (isSupabaseConfigured) {
          await supabaseAdminDeleteUser(id);
          deleted = true;
        } else {
          throw backendErr;
        }
      }

      if (deleted) {
        setSuccessMsg(`Account ${userEmail} deleted successfully.`);
        setUsers((prev) => prev.filter((u) => u.id !== id));
      }
    } catch (err: any) {
      setErrorMsg(err.message || err.response?.data?.error?.message || 'Failed to delete user.');
    } finally {
      setDeletingId(null);
    }
  };

  const getRoleBadgeClasses = (userRole: Role) => {
    switch (userRole) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'AUTHORITY':
        return 'bg-coral-subtle text-coral border-coral-border';
      case 'RESPONDER':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'CITIZEN':
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.department && u.department.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.badgeNumber && u.badgeNumber.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)]">
      <AuthoritySidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hairline pb-4">
          <div>
            <div className="flex items-center space-x-2 text-purple-700 mb-1">
              <Shield className="w-5 h-5 text-purple-700" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider">
                System Administration & RBAC
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif text-ink tracking-tight">
              User Provisioning & Access Control
            </h1>
            <p className="text-xs text-ink-muted mt-1 max-w-xl">
              Strictly administer access credentials. Only administrators can authorize new operational personnel to prevent unauthorized data access.
            </p>
          </div>

          <button
            onClick={fetchUsers}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-canvas-subtle border border-hairline rounded-xl text-xs font-medium text-ink shadow-card transition shrink-0 self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Directory</span>
          </button>
        </div>

        {/* Global Notifications */}
        {errorMsg && (
          <div className="p-3 bg-[#FDF2F2] border border-[#F5C2C2] rounded-xl text-[#9E2A2B] text-xs flex items-center gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#C64545]" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Role Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 bg-white border border-hairline rounded-2xl shadow-card">
            <div className="flex items-center justify-between text-xs text-ink-muted">
              <span>Total Accounts</span>
              <Users className="w-4 h-4 text-ink-muted" />
            </div>
            <p className="text-2xl font-bold text-ink mt-2">{users.length}</p>
          </div>

          <div className="p-4 bg-white border border-hairline rounded-2xl shadow-card">
            <div className="flex items-center justify-between text-xs text-purple-700">
              <span>Administrators</span>
              <Flame className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-ink mt-2">
              {users.filter((u) => u.role === 'ADMIN').length}
            </p>
          </div>

          <div className="p-4 bg-white border border-hairline rounded-2xl shadow-card">
            <div className="flex items-center justify-between text-xs text-coral">
              <span>Disaster Authorities</span>
              <ShieldCheck className="w-4 h-4 text-coral" />
            </div>
            <p className="text-2xl font-bold text-ink mt-2">
              {users.filter((u) => u.role === 'AUTHORITY').length}
            </p>
          </div>

          <div className="p-4 bg-white border border-hairline rounded-2xl shadow-card">
            <div className="flex items-center justify-between text-xs text-blue-700">
              <span>Field Responders</span>
              <Radio className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-ink mt-2">
              {users.filter((u) => u.role === 'RESPONDER').length}
            </p>
          </div>
        </div>

        {/* Account Creation Section & Accounts Directory */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Create User Form */}
          <div className="lg:col-span-5 bg-white border border-hairline rounded-2xl p-5 sm:p-6 shadow-card space-y-4">
            <div className="flex items-center space-x-2 border-b border-hairline pb-3">
              <UserPlus className="w-4 h-4 text-coral" />
              <h2 className="text-base font-semibold text-ink">Provision New User Account</h2>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              {/* Role Selection */}
              <div>
                <label className="block text-xs font-semibold text-ink-body mb-1.5">
                  Select Role & Permission Level
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('AUTHORITY')}
                    className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 ${
                      role === 'AUTHORITY'
                        ? 'bg-coral-subtle border-coral text-coral ring-1 ring-coral/30'
                        : 'bg-white hover:bg-canvas border-hairline text-ink'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 shrink-0 text-coral" />
                    <div>
                      <p className="text-xs font-bold leading-tight">Authority</p>
                      <p className="text-[10px] text-ink-muted">ASDMA / SDMA</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('RESPONDER')}
                    className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 ${
                      role === 'RESPONDER'
                        ? 'bg-blue-50 border-blue-400 text-blue-800 ring-1 ring-blue-300'
                        : 'bg-white hover:bg-canvas border-hairline text-ink'
                    }`}
                  >
                    <Radio className="w-4 h-4 shrink-0 text-blue-600" />
                    <div>
                      <p className="text-xs font-bold leading-tight">Responder</p>
                      <p className="text-[10px] text-ink-muted">NDRF / SDRF</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('ADMIN')}
                    className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 ${
                      role === 'ADMIN'
                        ? 'bg-purple-50 border-purple-400 text-purple-800 ring-1 ring-purple-300'
                        : 'bg-white hover:bg-canvas border-hairline text-ink'
                    }`}
                  >
                    <Flame className="w-4 h-4 shrink-0 text-purple-700" />
                    <div>
                      <p className="text-xs font-bold leading-tight">Admin</p>
                      <p className="text-[10px] text-ink-muted">Full Control</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('CITIZEN')}
                    className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 ${
                      role === 'CITIZEN'
                        ? 'bg-green-50 border-green-400 text-green-800 ring-1 ring-green-300'
                        : 'bg-white hover:bg-canvas border-hairline text-ink'
                    }`}
                  >
                    <UserCheck className="w-4 h-4 shrink-0 text-green-600" />
                    <div>
                      <p className="text-xs font-bold leading-tight">Citizen</p>
                      <p className="text-[10px] text-ink-muted">Public Portal</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-ink-body mb-1">Full Name</label>
                <div className="relative">
                  <UserIcon className="w-3.5 h-3.5 text-ink-subtle absolute left-3 top-3" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Commander Rajesh Varma"
                    className="w-full bg-canvas border border-hairline rounded-xl pl-9 pr-3 py-2 text-xs text-ink-body focus:outline-none focus:border-coral transition"
                    required
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-ink-body mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-ink-subtle absolute left-3 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="officer@agency.gov.in"
                    className="w-full bg-canvas border border-hairline rounded-xl pl-9 pr-3 py-2 text-xs text-ink-body focus:outline-none focus:border-coral transition"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-ink-body mb-1">
                  Initial Password (min 6 characters)
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-ink-subtle absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong password"
                    className="w-full bg-canvas border border-hairline rounded-xl pl-9 pr-9 py-2 text-xs text-ink-body focus:outline-none focus:border-coral transition"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-ink-subtle hover:text-ink transition"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-ink-body mb-1">
                  Contact Phone (Optional)
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-ink-subtle absolute left-3 top-3" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-canvas border border-hairline rounded-xl pl-9 pr-3 py-2 text-xs text-ink-body focus:outline-none focus:border-coral transition"
                  />
                </div>
              </div>

              {/* Department & Badge (for official roles) */}
              {role !== 'CITIZEN' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-ink-body mb-1">
                      Department / Agency
                    </label>
                    <div className="relative">
                      <Building className="w-3 h-3 text-ink-subtle absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder="e.g. NDRF / ASDMA"
                        className="w-full bg-canvas border border-hairline rounded-lg pl-7 pr-2.5 py-1.5 text-xs text-ink-body focus:outline-none focus:border-coral transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-ink-body mb-1">
                      Badge / Service ID
                    </label>
                    <div className="relative">
                      <BadgeAlert className="w-3 h-3 text-ink-subtle absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        value={badgeNumber}
                        onChange={(e) => setBadgeNumber(e.target.value)}
                        placeholder="e.g. AUTH-042"
                        className="w-full bg-canvas border border-hairline rounded-lg pl-7 pr-2.5 py-1.5 text-xs text-ink-body focus:outline-none focus:border-coral transition"
                      />
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-coral hover:bg-coral-hover text-white font-semibold rounded-xl text-xs uppercase tracking-wider transition shadow-sm flex items-center justify-center space-x-2 disabled:opacity-50 mt-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Provisioning Account...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Provision Account</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: User Accounts Directory Table */}
          <div className="lg:col-span-7 bg-white border border-hairline rounded-2xl p-5 sm:p-6 shadow-card space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-hairline pb-3">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-purple-700" />
                <h2 className="text-base font-semibold text-ink">Active User Accounts</h2>
                <span className="text-xs font-mono text-ink-muted">({filteredUsers.length})</span>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <div className="relative w-full sm:w-44">
                  <Search className="w-3.5 h-3.5 text-ink-subtle absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search users..."
                    className="w-full bg-canvas border border-hairline rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-ink placeholder:text-ink-subtle focus:outline-none focus:border-coral transition"
                  />
                </div>

                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="bg-canvas border border-hairline rounded-lg px-2.5 py-1.5 text-xs text-ink focus:outline-none focus:border-coral transition"
                >
                  <option value="ALL">All Roles</option>
                  <option value="ADMIN">Admin</option>
                  <option value="AUTHORITY">Authority</option>
                  <option value="RESPONDER">Responder</option>
                  <option value="CITIZEN">Citizen</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-ink-muted space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-coral" />
                <p className="text-xs">Loading user directory...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-ink-muted text-xs space-y-1">
                <Users className="w-8 h-8 mx-auto text-ink-subtle mb-2" />
                <p className="font-semibold text-ink">No accounts found</p>
                <p>Try adjusting your search criteria or provision a new user on the left.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-hairline text-ink-muted uppercase font-mono text-[10px]">
                      <th className="pb-2.5 font-semibold">User</th>
                      <th className="pb-2.5 font-semibold">Role</th>
                      <th className="pb-2.5 font-semibold">Department / ID</th>
                      <th className="pb-2.5 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline">
                    {filteredUsers.map((u) => {
                      const isSelf = u.id === currentAdmin?.id;

                      return (
                        <tr key={u.id} className="hover:bg-canvas/50 transition">
                          <td className="py-3 pr-2">
                            <div className="font-semibold text-ink">{u.fullName}</div>
                            <div className="text-[11px] text-ink-muted font-mono">{u.email}</div>
                          </td>
                          <td className="py-3 px-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${getRoleBadgeClasses(
                                u.role
                              )}`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3 px-2">
                            <div className="text-ink truncate max-w-[140px]">
                              {u.department || '—'}
                            </div>
                            {u.badgeNumber && (
                              <div className="text-[10px] text-ink-muted font-mono">
                                #{u.badgeNumber}
                              </div>
                            )}
                          </td>
                          <td className="py-3 pl-2 text-right">
                            {isSelf ? (
                              <span className="text-[10px] text-ink-muted font-mono italic px-2 py-1 bg-canvas rounded">
                                Active You
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(u.id, u.email)}
                                disabled={deletingId === u.id}
                                className="p-1.5 text-ink-subtle hover:text-[#C64545] hover:bg-[#FDF2F2] rounded-lg transition"
                                title="Revoke access & delete account"
                              >
                                {deletingId === u.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
