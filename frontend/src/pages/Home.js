import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMapPin, FiCreditCard, FiPhone } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import SearchBar from '../components/SearchBar';
import ServiceGrid from '../components/ServiceGrid';
import MartSection from '../components/MartSection';
import LocationPicker from '../components/LocationPicker';
import { formatPrice } from '../utils/constants';
import './Home.css';

const Home = () => {
  const { user, cart, cartTotal } = useAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showLocation, setShowLocation] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    if (!user?.address?.lat) {
      setShowLocation(true);
    }
  }, [user?.address?.lat]);

  const fetchData = async () => {
    try {
      const [servicesRes, categoriesRes] = await Promise.all([
        API.get('/print-services'),
        API.get('/products/categories/all')
      ]);
      setServices(servicesRes.data.services || []);
      setCategories(categoriesRes.data.categories || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page home-page">
      {/* Header */}
      <div className="home-header">
        <div className="home-header-left">
          <button className="location-btn" onClick={() => setShowLocation(true)}>
            <FiMapPin className="location-icon" />
            <div className="location-text">
              <span className="location-label">Delivering to</span>
              <span className="location-address">
                {user?.address?.label || user?.address?.full || 'Set Location'}
              </span>
            </div>
          </button>
        </div>
        <div className="home-header-right">
          <button className="wallet-btn" onClick={() => navigate('/wallet')}>
            <FiCreditCard />
            <span>{formatPrice(user?.walletBalance || 0)}</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="home-search">
        <SearchBar />
      </div>

      {/* ── Service Banners ── */}
      {/* 1. Get it Printed – full-width hero */}
      <div className="home-banner home-banner--print" onClick={() => navigate('/print-store')}>
        <div className="banner-content">
          <h2>Get it Printed</h2>
          <p>Documents delivered under 30 mins ⚡</p>
        </div>
        <div className="banner-img-wrap">
          <img src="/images/printer.png" alt="Printer" className="banner-img" onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='block'; }} />
          <span className="banner-img-fallback" style={{ display: 'none', fontSize: 48 }}>🖨️</span>
        </div>
      </div>

      {/* 2 & 3 – Side-by-side smaller cards */}
      <div className="home-mini-banners">
        {/* Passport Photos */}
        <div className="mini-banner mini-banner--passport" onClick={() => navigate('/passport-photos')}>
          <div className="mini-banner-text">
            <span className="mini-banner-title">Passport Photos</span>
            <span className="mini-banner-sub">Pro quality · ₹40/8 pics</span>
          </div>
          <div className="mini-banner-img-wrap mini-banner-img-wrap--passport">
            <img src="/images/passport-photo.png" alt="Passport Photos" className="mini-banner-img" onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='block'; }} />
            <span className="mini-banner-img-fallback" style={{ display: 'none', fontSize: 36 }}>🪪</span>
          </div>
        </div>

        {/* On-Demand Printing */}
        <div className="mini-banner mini-banner--ondemand" onClick={() => navigate('/on-demand-print')}>
          <div className="mini-banner-text">
            <span className="mini-banner-title">Bulk / Custom</span>
            <span className="mini-banner-sub">Call or drop a request</span>
          </div>
          <div className="mini-banner-icon-wrap">
            <FiPhone size={32} className="mini-banner-phone-icon" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="spinner"></div>
      ) : (
        <>
          <ServiceGrid services={services} />
          <MartSection categories={categories} />
        </>
      )}

      {/* Floating Cart Bar */}
      {cart.length > 0 && (
        <div className="floating-cart" onClick={() => navigate('/checkout')}>
          <div className="floating-cart-info">
            <span className="floating-cart-count">{cart.length} item(s)</span>
            <span className="floating-cart-total">{formatPrice(cartTotal)}</span>
          </div>
          <span className="floating-cart-action">Checkout →</span>
        </div>
      )}

      {showLocation && <LocationPicker onClose={() => setShowLocation(false)} />}

      {/* Footer */}
      <footer className="home-footer">
        <div className="home-footer-brand">
          <span className="home-footer-logo">🖨️</span>
          <div>
            <h4 className="home-footer-name">Shubham Computers</h4>
            <p className="home-footer-tagline">Your local print &amp; stationery mart</p>
          </div>
        </div>

        <div className="home-footer-links">
          <div className="home-footer-col">
            <span className="home-footer-col-title">Services</span>
            <span>Document Printing</span>
            <span>Passport Photos</span>
            <span>Bulk &amp; Custom Print</span>
            <span>Stationery Mart</span>
          </div>
          <div className="home-footer-col">
            <span className="home-footer-col-title">Contact</span>
            <a className="home-footer-link" href="tel:+919518002486">+91 95180 02486</a>
            <span>Jhajjar, Haryana</span>
            <span>Mon – Sat · 9 AM – 8 PM</span>
          </div>
        </div>

        <div className="home-footer-bottom">
          <span>© {new Date().getFullYear()} Shubham Computers. All rights reserved.</span>
        </div>
      </footer>

      <div className="fab-spacer"></div>
    </div>
  );
};

export default Home;
