import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiUsers, FiShoppingBag, FiPackage, FiDollarSign, FiClock, FiTrendingUp, FiChevronRight } from 'react-icons/fi';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const { data } = await api.get('/admin/dashboard');
      setStats(data.stats);
      setRecentOrders(data.recentOrders || []);
    } catch (err) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const statCards = stats ? [
    { label: 'Total Users', value: stats.totalUsers, icon: <FiUsers />, color: '#6C63FF' },
    { label: 'Total Orders', value: stats.totalOrders, icon: <FiShoppingBag />, color: '#00D9A6' },
    { label: 'Today Orders', value: stats.todayOrders, icon: <FiClock />, color: '#FFB347' },
    { label: 'Products', value: stats.totalProducts, icon: <FiPackage />, color: '#FF6B6B' },
    { label: 'Revenue', value: `₹${stats.revenue?.toLocaleString() || 0}`, icon: <FiDollarSign />, color: '#4ECDC4' },
    { label: 'Pending', value: stats.pendingOrders, icon: <FiTrendingUp />, color: '#A78BFA' },
  ] : [];

  const getStatusColor = (status) => {
    const colors = {
      placed: '#FFB347', confirmed: '#6C63FF', processing: '#A78BFA',
      'out-for-delivery': '#4ECDC4', delivered: '#00D9A6', cancelled: '#FF6B6B'
    };
    return colors[status] || '#888';
  };

  if (loading) {
    return <div className="page-container"><div className="loading-spinner" /></div>;
  }

  return (
    <div className="page-container">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <p>Shubham Computers</p>
      </div>

      <div className="stats-grid">
        {statCards.map((card, i) => (
          <div className="stat-card" key={i}>
            <div className="stat-icon" style={{ background: card.color + '20', color: card.color }}>
              {card.icon}
            </div>
            <div className="stat-value">{card.value}</div>
            <div className="stat-label">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="admin-nav-grid">
        <Link to="/admin/orders" className="admin-nav-item">
          <FiShoppingBag /> Manage Orders <FiChevronRight />
        </Link>
        <Link to="/admin/products" className="admin-nav-item">
          <FiPackage /> Manage Products <FiChevronRight />
        </Link>
        <Link to="/admin/users" className="admin-nav-item">
          <FiUsers /> Manage Users <FiChevronRight />
        </Link>
        <Link to="/admin/add-product" className="admin-nav-item">
          <FiTrendingUp /> Add Product <FiChevronRight />
        </Link>
      </div>

      <div className="section-header">
        <h2>Recent Orders</h2>
        <Link to="/admin/orders" className="see-all">See All</Link>
      </div>

      {recentOrders.length === 0 ? (
        <div className="empty-state">No orders yet</div>
      ) : (
        <div className="recent-orders">
          {recentOrders.slice(0, 5).map(order => (
            <div className="order-mini-card" key={order._id}>
              <div className="order-mini-top">
                <span className="order-mini-id">{order.orderId}</span>
                <span className="order-mini-status" style={{ background: getStatusColor(order.status) + '20', color: getStatusColor(order.status) }}>
                  {order.status}
                </span>
              </div>
              <div className="order-mini-bottom">
                <span>{order.customer?.name || 'User'}</span>
                <span className="order-mini-amount">₹{order.amount}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
