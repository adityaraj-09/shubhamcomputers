import React, { useState, useEffect } from 'react';
import { FiArrowLeft, FiShoppingCart } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import { formatPrice, formatDateTime, ORDER_STATUS_MAP } from '../utils/constants';
import './Orders.css';

const Orders = () => {
  const { user, cart, updateUser } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data } = await API.get('/orders');
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (orderId) => {
    try {
      const { data } = await API.put(`/orders/${orderId}/cancel`);
      toast.success('Order cancelled. Amount refunded.');
      updateUser({ walletBalance: data.walletBalance });
      fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to cancel');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <FiArrowLeft />
        </button>
        <h1 className="page-title">My Orders</h1>
        {cart.length > 0 && (
          <button
            className="btn btn-primary"
            style={{ padding: '8px 14px', fontSize: 13, borderRadius: 20 }}
            onClick={() => navigate('/checkout')}
          >
            <FiShoppingCart size={14} style={{ marginRight: 4 }} />
            Cart ({cart.length})
          </button>
        )}
      </div>

      <div className="orders-section">
        {loading ? (
          <div className="spinner"></div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📦</div>
            <p>No orders yet.</p>
            <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => navigate('/')}>
              Shop Now
            </button>
          </div>
        ) : (
          orders.map(order => {
            const statusInfo = ORDER_STATUS_MAP[order.status] || {};
            return (
              <div key={order._id} className="order-card">
                <div className="order-card-header">
                  <span className="order-id">{order.orderId}</span>
                  <span className="badge" style={{ background: statusInfo.bg, color: statusInfo.color }}>
                    {statusInfo.label}
                  </span>
                </div>
                <div className="order-items-summary">
                  {order.items.map((item, idx) => (
                    <span key={idx}>{item.name} × {item.quantity}</span>
                  ))}
                </div>
                <div className="order-card-footer">
                  <span className="order-amount">{formatPrice(order.amount)}</span>
                  <span className="order-date">{formatDateTime(order.createdAt)}</span>
                </div>
                {order.status === 'confirmed' && (
                  <button
                    className="btn btn-danger"
                    style={{ marginTop: 8, padding: '8px 16px', fontSize: 12 }}
                    onClick={() => cancelOrder(order._id)}
                  >
                    Cancel Order
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="fab-spacer"></div>
    </div>
  );
};

export default Orders;
