import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import './Login.css';

const Login = () => {
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(phone)) {
      toast.error('Enter a valid 10-digit phone number');
      return;
    }
    if (!password || password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const { data } = await API.post('/auth/login', { phone, password });
      login(data.token, data.user);
      toast.success(`Welcome ${data.user.name ? data.user.name : ''}!`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-header">
        <div className="login-logo">🖨️</div>
        <h1 className="login-title">Shubham Computers</h1>
        <p className="login-tagline">Print & Stationery Mart</p>
        <p className="login-sub">Jhajjar • Delivery under 30 mins ⚡</p>
      </div>

      <div className="login-card">
        <form onSubmit={handleLogin}>
          <h2 className="login-form-title">Login / Sign Up</h2>
          <p className="login-otp-info">Enter your phone number and password.</p>
          <div className="phone-input-group">
            <span className="phone-prefix">+91</span>
            <input
              type="tel"
              className="phone-input"
              placeholder="Enter phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              maxLength={10}
              autoFocus
            />
          </div>
          <input
            type="password"
            className="input-field"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
          />
          <button className="btn btn-primary btn-full" disabled={loading || phone.length !== 10 || password.length < 6}>
            {loading ? 'Logging in...' : 'Continue'}
          </button>
        </form>
      </div>

      <p className="login-footer">By continuing, you agree to our Terms & Privacy Policy</p>
    </div>
  );
};

export default Login;
