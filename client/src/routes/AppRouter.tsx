import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { ProtectedRoute } from '../components/layout/ProtectedRoute';

// Citizen & Public Pages
import { HomePage } from '../pages/citizen/HomePage';
import { DisasterMapPage } from '../pages/citizen/DisasterMapPage';
import { ReportIncidentPage } from '../pages/citizen/ReportIncidentPage';
import { AlertsPage } from '../pages/citizen/AlertsPage';
import { GeoIntelligencePage } from '../pages/citizen/GeoIntelligencePage';
import { SafeZonesPage } from '../pages/citizen/SafeZonesPage';
import { ResourcesPage } from '../pages/citizen/ResourcesPage';

import { CitizenPortalPage } from '../pages/citizen/CitizenPortalPage';
import { TrinetraRelayPage } from '../pages/citizen/TrinetraRelayPage';
import { FloatingSosButton } from '../components/relay/FloatingSosButton';
import { MobileBottomNav } from '../components/layout/MobileBottomNav';

// Authority Pages
import { AuthorityDashboardPage } from '../pages/authority/AuthorityDashboardPage';
import { IncidentTriagePage } from '../pages/authority/IncidentTriagePage';
import { AlertStudioPage } from '../pages/authority/AlertStudioPage';
import { ResourceManagePage } from '../pages/authority/ResourceManagePage';
import { DisasterManagePage } from '../pages/authority/DisasterManagePage';
import { UserManagementPage } from '../pages/authority/UserManagementPage';

// Auth Pages
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';

import { useAuth } from '../context/AuthContext';

// Smart Dashboard Redirection based on RBAC Role
const RoleBasedDashboardRedirect: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'ADMIN' || user?.role === 'AUTHORITY' || user?.role === 'RESPONDER') {
    return <Navigate to="/authority/dashboard" replace />;
  }
  return <Navigate to="/citizen/portal" replace />;
};

export const AppRouter: React.FC = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/' || location.pathname === '/home';

  return (
    <div className="min-h-screen bg-canvas text-ink-body flex flex-col font-sans">
      <Navbar />
      <div className="flex-1 pb-20 md:pb-0">
        <Routes>
          {/* Public / Citizen Flow (Home is '/') */}
          <Route path="/" element={<HomePage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/dashboard" element={<RoleBasedDashboardRedirect />} />
          <Route path="/admin" element={<Navigate to="/authority/dashboard" replace />} />
          <Route path="/map" element={<GeoIntelligencePage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/geo-intelligence" element={<GeoIntelligencePage />} />
          <Route path="/report" element={<ReportIncidentPage />} />
          <Route path="/safe-zones" element={<SafeZonesPage />} />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/relay" element={<TrinetraRelayPage />} />
          <Route path="/innovation/relay" element={<TrinetraRelayPage />} />
          <Route
            path="/citizen/portal"
            element={
              <ProtectedRoute allowedRoles={['CITIZEN', 'AUTHORITY', 'RESPONDER', 'ADMIN']}>
                <CitizenPortalPage />
              </ProtectedRoute>
            }
          />

          {/* Authentication */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Authority, Responder & Admin Command Center */}
          <Route
            path="/authority/dashboard"
            element={
              <ProtectedRoute allowedRoles={['AUTHORITY', 'RESPONDER', 'ADMIN']}>
                <AuthorityDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/authority/triage"
            element={
              <ProtectedRoute allowedRoles={['AUTHORITY', 'RESPONDER', 'ADMIN']}>
                <IncidentTriagePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/authority/alerts"
            element={
              <ProtectedRoute allowedRoles={['AUTHORITY', 'ADMIN']}>
                <AlertStudioPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/authority/resources"
            element={
              <ProtectedRoute allowedRoles={['AUTHORITY', 'RESPONDER', 'ADMIN']}>
                <ResourceManagePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/authority/disasters"
            element={
              <ProtectedRoute allowedRoles={['AUTHORITY', 'ADMIN']}>
                <DisasterManagePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/authority/users"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <UserManagementPage />
              </ProtectedRoute>
            }
          />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      {isHomePage && <FloatingSosButton />}
      <MobileBottomNav />
    </div>
  );
};
