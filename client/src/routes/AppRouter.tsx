// client/src/routes/AppRouter.tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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

// Authority Pages
import { AuthorityDashboardPage } from '../pages/authority/AuthorityDashboardPage';
import { IncidentTriagePage } from '../pages/authority/IncidentTriagePage';
import { AlertStudioPage } from '../pages/authority/AlertStudioPage';
import { ResourceManagePage } from '../pages/authority/ResourceManagePage';
import { DisasterManagePage } from '../pages/authority/DisasterManagePage';

// Auth Pages
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';

export const AppRouter: React.FC = () => {
  return (
    <div className="min-h-screen bg-canvas text-ink-body flex flex-col font-sans">
      <Navbar />
      <div className="flex-1">
        <Routes>
          {/* Public / Citizen Flow (Home is '/') */}
          <Route path="/" element={<HomePage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/dashboard" element={<Navigate to="/" replace />} />
          <Route path="/map" element={<DisasterMapPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/geo-intelligence" element={<GeoIntelligencePage />} />
          <Route path="/report" element={<ReportIncidentPage />} />
          <Route path="/safe-zones" element={<SafeZonesPage />} />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route
            path="/citizen/portal"
            element={
              <ProtectedRoute allowedRoles={['CITIZEN', 'AUTHORITY', 'RESPONDER']}>
                <CitizenPortalPage />
              </ProtectedRoute>
            }
          />

          {/* Authentication */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Authority & Responder Command Center */}
          <Route
            path="/authority/dashboard"
            element={
              <ProtectedRoute allowedRoles={['AUTHORITY', 'RESPONDER']}>
                <AuthorityDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/authority/triage"
            element={
              <ProtectedRoute allowedRoles={['AUTHORITY', 'RESPONDER']}>
                <IncidentTriagePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/authority/alerts"
            element={
              <ProtectedRoute allowedRoles={['AUTHORITY']}>
                <AlertStudioPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/authority/resources"
            element={
              <ProtectedRoute allowedRoles={['AUTHORITY', 'RESPONDER']}>
                <ResourceManagePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/authority/disasters"
            element={
              <ProtectedRoute allowedRoles={['AUTHORITY']}>
                <DisasterManagePage />
              </ProtectedRoute>
            }
          />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
};
