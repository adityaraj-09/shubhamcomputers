import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Pages
import Login from './pages/Login';
import Home from './pages/Home';
import PrintStore from './pages/PrintStore';
import Wallet from './pages/Wallet';
import Orders from './pages/Orders';
import Checkout from './pages/Checkout';
import PrintServicePage from './pages/PrintServicePage';
import PassportPhotos from './pages/PassportPhotos';
import OnDemandPrint from './pages/OnDemandPrint';
import MartCategory from './pages/MartCategory';
import ProductDetail from './pages/ProductDetail';
import Profile from './pages/Profile';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import ManageOrders from './pages/admin/ManageOrders';
import ManageProducts from './pages/admin/ManageProducts';
import ManageUsers from './pages/admin/ManageUsers';
import AddProduct from './pages/admin/AddProduct';

// Components
import BottomNav from './components/BottomNav';
import AIBubble from './components/AIBubble';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner"></div>
        <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="App">
      <Routes>
        {/* Public */}
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />

        {/* Protected User Routes */}
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/print-store" element={<ProtectedRoute><PrintStore /></ProtectedRoute>} />
        <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
        <Route path="/print/:id" element={<ProtectedRoute><PrintServicePage /></ProtectedRoute>} />
        <Route path="/passport-photos" element={<ProtectedRoute><PassportPhotos /></ProtectedRoute>} />
        <Route path="/on-demand-print" element={<ProtectedRoute><OnDemandPrint /></ProtectedRoute>} />
        <Route path="/mart/:categoryId" element={<ProtectedRoute><MartCategory /></ProtectedRoute>} />
        <Route path="/product/:id" element={<ProtectedRoute><ProductDetail /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

        {/* Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/orders" element={<ProtectedRoute adminOnly><ManageOrders /></ProtectedRoute>} />
        <Route path="/admin/products" element={<ProtectedRoute adminOnly><ManageProducts /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute adminOnly><ManageUsers /></ProtectedRoute>} />
        <Route path="/admin/add-product" element={<ProtectedRoute adminOnly><AddProduct /></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      {/* Bottom Nav & AI Bubble - only show when logged in */}
      {user && (
        <>
          <BottomNav />
          <AIBubble />
        </>
      )}
    </div>
  );
}

export default App;
