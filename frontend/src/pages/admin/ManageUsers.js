import React, { useState, useEffect } from 'react';
import { FiArrowLeft, FiSearch, FiShield } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import './ManageUsers.css';

const ManageUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/admin/users');
      setUsers(data.users || []);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const makeAdmin = async (userId) => {
    if (!window.confirm('Make this user an admin?')) return;
    try {
      await api.put(`/admin/users/${userId}/make-admin`);
      toast.success('User is now an admin');
      fetchUsers();
    } catch (err) {
      toast.error('Failed to update user');
    }
  };

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.phone?.includes(search)
  );

  if (loading) {
    return <div className="page-container"><div className="loading-spinner" /></div>;
  }

  return (
    <div className="page-container">
      <div className="page-top-bar">
        <button className="back-btn" onClick={() => navigate('/admin')}>
          <FiArrowLeft />
        </button>
        <h1>Manage Users</h1>
      </div>

      <div className="user-search-bar">
        <FiSearch />
        <input
          type="text"
          placeholder="Search by name or phone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="orders-count">{filtered.length} users</div>

      <div className="users-list">
        {filtered.map(user => (
          <div className="user-card" key={user._id}>
            <div className="uc-avatar">
              {user.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="uc-info">
              <div className="uc-name">
                {user.name || 'Unnamed'}
                {user.role === 'admin' && <span className="uc-admin-badge">Admin</span>}
              </div>
              <div className="uc-phone">{user.phone}</div>
              <div className="uc-meta">
                <span>₹{user.walletBalance || 0} wallet</span>
                <span>{user.numOrders || 0} orders</span>
              </div>
            </div>
            {user.role !== 'admin' && (
              <button className="make-admin-btn" onClick={() => makeAdmin(user._id)}>
                <FiShield />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ManageUsers;
