import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiLogOut, FiMapPin, FiPhone, FiCalendar, FiShoppingBag, FiCreditCard, FiCamera, FiEdit2, FiCheck, FiX } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { formatPrice, formatDate } from '../utils/constants';
import API from '../api/axios';
import toast from 'react-hot-toast';
import './Profile.css';

const Profile = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState('');
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [nameLoading, setNameLoading] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleAvatarClick = () => fileRef.current?.click();

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5 MB');
      return;
    }
    setAvatarLoading(true);
    try {
      const form = new FormData();
      form.append('files', file);
      const { data: uploadData } = await API.post('/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const avatarUrl = uploadData.files?.[0]?.thumbnailLink || uploadData.files?.[0]?.viewLink;
      if (!avatarUrl) throw new Error('No URL in response');
      const { data } = await API.put('/auth/update-profile', { avatar: avatarUrl });
      updateUser(data.user);
      toast.success('Avatar updated!');
    } catch {
      toast.error('Failed to update avatar');
    } finally {
      setAvatarLoading(false);
      e.target.value = '';
    }
  };

  const startEditName = () => {
    setNameVal(user?.name || '');
    setEditingName(true);
  };

  const saveName = async () => {
    if (nameVal.trim().length < 2) {
      toast.error('Name must be at least 2 characters');
      return;
    }
    setNameLoading(true);
    try {
      const { data } = await API.put('/auth/update-profile', { name: nameVal.trim() });
      updateUser(data.user);
      setEditingName(false);
      toast.success('Name updated!');
    } catch {
      toast.error('Failed to update name');
    } finally {
      setNameLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <FiArrowLeft />
        </button>
        <h1 className="page-title">Profile</h1>
      </div>

      {/* Profile Card */}
      <div className="profile-card">
        {/* Avatar with edit overlay */}
        <div className="profile-avatar-wrap">
          <div className="profile-avatar" onClick={handleAvatarClick} title="Change photo">
            {avatarLoading ? (
              <div className="profile-avatar-spinner" />
            ) : user?.avatar ? (
              <img src={user.avatar} alt="avatar" className="profile-avatar-img" />
            ) : (
              user?.name ? user.name.charAt(0).toUpperCase() : '?'
            )}
          </div>
          <button className="profile-avatar-edit-btn" onClick={handleAvatarClick} disabled={avatarLoading}>
            <FiCamera />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleAvatarChange}
          />
        </div>

        {/* Editable name */}
        {editingName ? (
          <div className="profile-name-edit">
            <input
              className="profile-name-input"
              value={nameVal}
              onChange={e => setNameVal(e.target.value)}
              maxLength={100}
              autoFocus
            />
            <button className="profile-name-action confirm" onClick={saveName} disabled={nameLoading}>
              <FiCheck />
            </button>
            <button className="profile-name-action cancel" onClick={() => setEditingName(false)}>
              <FiX />
            </button>
          </div>
        ) : (
          <div className="profile-name-row">
            <h2 className="profile-name">{user?.name || 'User'}</h2>
            <button className="profile-name-edit-btn" onClick={startEditName}><FiEdit2 /></button>
          </div>
        )}

        <p className="profile-id">{user?.userId}</p>
        {user?.role === 'admin' && <span className="badge badge-primary">ADMIN</span>}
      </div>

      {/* Details */}
      <div className="profile-details">
        <div className="profile-item">
          <FiPhone className="profile-item-icon" />
          <div>
            <span className="profile-item-label">Phone</span>
            <span className="profile-item-value">+91 {user?.phone}</span>
          </div>
        </div>

        <div className="profile-item">
          <FiCreditCard className="profile-item-icon" />
          <div>
            <span className="profile-item-label">Wallet Balance</span>
            <span className="profile-item-value" style={{ color: 'var(--accent)' }}>
              {formatPrice(user?.walletBalance || 0)}
            </span>
          </div>
        </div>

        <div className="profile-item">
          <FiShoppingBag className="profile-item-icon" />
          <div>
            <span className="profile-item-label">Total Orders</span>
            <span className="profile-item-value">{user?.numOrders || 0}</span>
          </div>
        </div>

        <div className="profile-item">
          <FiMapPin className="profile-item-icon" />
          <div>
            <span className="profile-item-label">Address</span>
            <span className="profile-item-value">{user?.address?.full || user?.address?.label || 'Not set'}</span>
          </div>
        </div>

        <div className="profile-item">
          <FiCalendar className="profile-item-icon" />
          <div>
            <span className="profile-item-label">Member Since</span>
            <span className="profile-item-value">{formatDate(user?.createdAt || new Date())}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      {user?.role === 'admin' && (
        <button className="btn btn-secondary btn-full" style={{ marginBottom: 10 }} onClick={() => navigate('/admin')}>
          🛠️ Admin Dashboard
        </button>
      )}

      <button className="btn btn-danger btn-full" onClick={handleLogout}>
        <FiLogOut /> Logout
      </button>

      <div className="fab-spacer"></div>
    </div>
  );
};

export default Profile;
