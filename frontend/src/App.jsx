import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import GoalPage from './pages/GoalPage';
import AdminPage from './pages/AdminPage';
import CountryDataPage from './pages/CountryDataPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/goal/:goalNumber" element={<GoalPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/country/:countryCode" element={<CountryDataPage />} />
    </Routes>
  );
}
