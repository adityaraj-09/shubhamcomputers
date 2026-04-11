import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import './Login.css';

const Login = () => {
  const { login } = useAuth();
  const [step, setStep] = useState('name'); // name → phone → otp
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [devOtp, setDevOtp] = useState('');

  const handleNameNext = (e) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      toast.error('Please enter your full name');
      return;
    }
    setStep('phone');
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(phone)) {
      toast.error('Enter a valid 10-digit phone number');
      return;
    }
    setLoading(true);
    try {
      const { data } = await API.post('/auth/send-otp', { phone });
      toast.success('OTP sent!');
      if (data.devOtp) setDevOtp(data.devOtp);
      setStep('otp');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error('Enter 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      const { data } = await API.post('/auth/verify-otp', { phone, otp });
      login(data.token, data.user);
      if (data.isNewUser) {
        // Save the name collected at step 1
        try {
          const profileRes = await API.put('/auth/complete-profile', { name: name.trim() });
          login(data.token, profileRes.data.user);
          toast.success(`Welcome, ${profileRes.data.user.name}! 🎉`);
        } catch {
          toast.success(`Welcome! 🎉`);
        }
      } else {
        toast.success(`Welcome back, ${data.user.name}!`);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid OTP');
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
        {step === 'name' && (
          <form onSubmit={handleNameNext}>
            <h2 className="login-form-title">Login / Sign Up</h2>
            <p className="login-otp-info">What's your name?</p>
            <input
              type="text"
              className="input-field"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              autoFocus
            />
            <button className="btn btn-primary btn-full" disabled={name.trim().length < 2}>
              Continue
            </button>
          </form>
        )}

        {step === 'phone' && (
          <form onSubmit={handleSendOTP}>
            <h2 className="login-form-title">Enter Phone Number</h2>
            <p className="login-otp-info">
              Hi <strong>{name}</strong>! Enter your number to continue.
            </p>
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
            <button className="btn btn-primary btn-full" disabled={loading || phone.length !== 10}>
              {loading ? 'Sending...' : 'Get OTP'}
            </button>
            <button type="button" className="login-change-btn" style={{ display: 'block', marginTop: 10 }}
              onClick={() => { setStep('name'); setPhone(''); }}>
              ← Change name
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerifyOTP}>
            <h2 className="login-form-title">Verify OTP</h2>
            <p className="login-otp-info">
              OTP sent to +91 {phone}
              <button type="button" className="login-change-btn" onClick={() => { setStep('phone'); setOtp(''); }}>
                Change
              </button>
            </p>
            {devOtp && (
              <p className="login-dev-otp">Dev OTP: {devOtp}</p>
            )}
            <input
              type="text"
              className="input-field otp-input"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              autoFocus
            />
            <button className="btn btn-primary btn-full" disabled={loading || otp.length !== 6}>
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>
          </form>
        )}
      </div>

      <p className="login-footer">By continuing, you agree to our Terms & Privacy Policy</p>
    </div>
  );
};

export default Login;
