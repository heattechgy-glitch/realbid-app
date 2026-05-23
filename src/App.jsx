import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import PropertyDetails from './pages/PropertyDetails';
import ListProperty from './pages/ListProperty';
import MyBids from './pages/MyBids';
import MyListings from './pages/MyListings';
import MyShowings from './pages/MyShowings';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/property/:id" element={<PropertyDetails />} />
      <Route path="/list" element={<ListProperty />} />
      <Route path="/my-bids" element={<MyBids />} />
      <Route path="/my-listings" element={<MyListings />} />
      <Route path="/my-showings" element={<MyShowings />} />
      <Route path="/admin" element={<AdminDashboard />} />
    </Routes>
  );
}
