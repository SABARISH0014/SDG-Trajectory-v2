import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import GoalPage from './pages/GoalPage';
import AdminPage from './pages/AdminPage';
import CountryDataPage from './pages/CountryDataPage';
import CountriesPage from './pages/CountriesPage';
import PolicySimulator from './pages/PolicySimulator';
import CountryComparison from './pages/CountryComparison';
import HelpPage from './pages/HelpPage';
import PWAInstallPrompt from './components/PWAInstallPrompt';

export default function App() {
  return (
    <>
      <PWAInstallPrompt />
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
    </>
  );
}
