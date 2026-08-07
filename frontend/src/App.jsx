import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainSite from './pages/MainSite';
import AdminPage from './pages/AdminPage';
import CountryDataPage from './pages/CountryDataPage';
import DisclaimerBanner from './components/ui/DisclaimerBanner';

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<MainSite />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/country/:countryCode" element={<CountryDataPage />} />
      </Routes>
      <DisclaimerBanner />
    </>
  );
}
