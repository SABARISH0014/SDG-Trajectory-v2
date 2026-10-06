import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import { Loader2 } from 'lucide-react';

const HomePage = lazy(() => import('./pages/HomePage'));
const GoalPage = lazy(() => import('./pages/GoalPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const CountryDataPage = lazy(() => import('./pages/CountryDataPage'));
const CountriesPage = lazy(() => import('./pages/CountriesPage'));
const PolicySimulator = lazy(() => import('./pages/PolicySimulator'));
const CountryComparison = lazy(() => import('./pages/CountryComparison'));
const HelpPage = lazy(() => import('./pages/HelpPage'));

function PageFallback() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-cream text-navy gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      <span className="text-xs uppercase tracking-widest font-semibold text-slate-500">Loading SDG Intelligence...</span>
    </div>
  );
}

export default function App() {
  return (
    <>
      <PWAInstallPrompt />
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/goals" element={<Navigate to="/goal/1" replace />} />
          <Route path="/goal/:goalNumber" element={<GoalPage />} />
          <Route path="/countries" element={<CountriesPage />} />
          <Route path="/country/:countryCode" element={<CountryDataPage />} />
          <Route path="/simulator" element={<PolicySimulator />} />
          <Route path="/compare" element={<CountryComparison />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/docs" element={<Navigate to="/help" replace />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}
