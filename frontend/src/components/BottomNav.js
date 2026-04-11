import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiHome, FiShoppingBag, FiUser, FiGrid } from 'react-icons/fi';
import './BottomNav.css';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, cartCount } = useAuth();

  const isAdmin = user?.role === 'admin';

  const navItems = [
    { path: '/', icon: <FiHome />, label: 'Home' },
    { path: '/orders', icon: <FiShoppingBag />, label: 'Orders' },
    ...(isAdmin ? [{ path: '/admin', icon: <FiGrid />, label: 'Admin' }] : []),
    { path: '/profile', icon: <FiUser />, label: 'Profile' }
  ];

  // Hide on login page
  if (location.pathname === '/login') return null;

  return (
    <nav className="bottom-nav">
      {navItems.map(item => (
        <button
          key={item.path}
          className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          onClick={() => navigate(item.path)}
        >
          <span className="nav-icon">
            {item.icon}
            {item.label === 'Orders' && cartCount > 0 && (
              <span className="cart-badge">{cartCount}</span>
            )}
          </span>
          <span className="nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
};

export default BottomNav;
