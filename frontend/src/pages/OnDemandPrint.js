import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiPhone, FiSend, FiCheckCircle } from 'react-icons/fi';
import { MdPrint } from 'react-icons/md';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import './OnDemandPrint.css';

const BUSINESS_PHONE = '9896XXXXXX'; // ← Replace with actual number

const OnDemandPrint = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    requirements: '',
    quantity: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.requirements.trim()) {
      toast.error('Please describe what you need');
      return;
    }
    setLoading(true);
    try {
      await API.post('/orders/inquiry', {
        requirements: form.requirements,
        quantity: form.quantity,
      });
      updateUser({ numOrders: (user?.numOrders || 0) + 1 });
      setSubmitted(true);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not submit. Please call us directly.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="odp-page">
      {/* Header */}
      <div className="odp-header">
        <button className="odp-back" onClick={() => navigate(-1)}>
          <FiArrowLeft size={20} />
        </button>
        <span className="odp-header-title">On‑Demand Printing</span>
      </div>

      {/* Hero Banner */}
      <div className="odp-hero">
        <div className="odp-hero-icon">
          <MdPrint size={52} color="#fff" />
        </div>
        <div className="odp-hero-text">
          <h2>Bulk &amp; Custom Orders</h2>
          <p>Flex banners · visiting cards · brochures · t‑shirt prints &amp; more</p>
        </div>
      </div>

      {/* Call CTA */}
      <div className="odp-call-section">
        <div className="odp-call-label">Talk to us directly</div>
        <a className="odp-call-btn" href={`tel:${BUSINESS_PHONE}`}>
          <FiPhone size={20} />
          <span>Call {BUSINESS_PHONE.replace(/(\d{4})(\d{3})(\d{3,4})/, '$1 $2 $3')}</span>
        </a>
        <p className="odp-call-hours">Mon – Sat · 9 AM – 8 PM</p>
      </div>

      <div className="odp-divider"><span>or leave an enquiry</span></div>

      {/* Enquiry Form / Success */}
      {submitted ? (
        <div className="odp-success">
          <FiCheckCircle size={52} color="#16a34a" />
          <h3>Enquiry Received!</h3>
          <p>We'll call you back at <strong>{user?.phone}</strong> within a few hours.</p>
          <p className="odp-success-sub">Your order has been saved under <strong>My Orders</strong>.</p>
          <div className="odp-success-actions">
            <button className="odp-orders-btn" onClick={() => navigate('/orders')}>View Orders</button>
            <button className="odp-home-btn" onClick={() => navigate('/')}>Back to Home</button>
          </div>
        </div>
      ) : (
        <form className="odp-form" onSubmit={handleSubmit} noValidate>
          <h3 className="odp-form-title">Enquiry Form</h3>

          {/* Account info (read-only) */}
          <div className="odp-account-info">
            <span className="odp-account-name">{user?.name}</span>
            <span className="odp-account-phone">📞 {user?.phone}</span>
          </div>

          <div className="odp-field">
            <label className="odp-label">What do you need? *</label>
            <textarea
              className="odp-textarea"
              name="requirements"
              placeholder="e.g. 500 visiting cards, matte finish. Design: I'll share on WhatsApp."
              value={form.requirements}
              onChange={handleChange}
              rows={4}
            />
          </div>

          <div className="odp-field">
            <label className="odp-label">Estimated Quantity (optional)</label>
            <input
              className="odp-input"
              type="text"
              name="quantity"
              placeholder="e.g. 200 copies, 3 posters"
              value={form.quantity}
              onChange={handleChange}
            />
          </div>

          <button className="odp-submit-btn" type="submit" disabled={loading}>
            {loading ? 'Sending…' : (
              <>
                <FiSend size={16} />
                <span>Send Enquiry</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
};

export default OnDemandPrint;

