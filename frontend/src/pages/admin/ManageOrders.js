import React, { useState, useEffect } from 'react';
import { FiArrowLeft, FiPhone, FiChevronDown, FiChevronUp, FiExternalLink } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import './ManageOrders.css';

const statusFlow = ['confirmed', 'delivered'];

const statusColors = {
  placed:     '#FFB347',
  confirmed:  '#6C63FF',
  delivered:  '#00D9A6',
  cancelled:  '#FF6B6B',
};

const COLOR_LABEL     = { bw: 'B&W', colour: 'Colour' };
const SIDE_LABEL      = { single: 'One side', both: 'Both sides' };
const ORIENT_LABEL    = { portrait: 'Portrait', landscape: 'Landscape' };

const timeAgo = (iso) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const formatDateTime = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
};

/* ── Item renderers ── */
const PrintItem = ({ item }) => {
  const o = item.options || {};
  const specs = [
    o.copies > 1 ? `${o.copies} copies` : '1 copy',
    o.pages ? `${o.pages} page${o.pages !== 1 ? 's' : ''}` : null,
    COLOR_LABEL[o.color] || o.color || null,
    SIDE_LABEL[o.sides] || o.sides || null,
    ORIENT_LABEL[o.orientation] || o.orientation || null,
  ].filter(Boolean).join(' · ');

  return (
    <div className="ao-item-card">
      <div className="ao-item-top">
        <span className="ao-badge print">PRINT</span>
        <span className="ao-item-name">{item.name}</span>
        <span className="ao-item-price">₹{item.price}</span>
      </div>
      {specs && <div className="ao-item-specs">{specs}</div>}
      {item.fileUrl && (
        <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" className="ao-file-link">
          <FiExternalLink size={12} /> View / Download file
        </a>
      )}
    </div>
  );
};

const PassportItem = ({ item }) => {
  const o = item.options || {};
  const specParts = [o.passportPack, o.passportSize, o.passportDims, `${o.passportBg} bg`];
  if (o.extraCopies > 0) specParts.push(`+${o.extraCopies * 8} extra`);
  const specs = specParts.filter(Boolean).join(' · ');

  return (
    <div className="ao-item-card">
      <div className="ao-item-top">
        <span className="ao-badge photo">PHOTO</span>
        <span className="ao-item-name">{item.name}</span>
        <span className="ao-item-price">₹{item.price}</span>
      </div>
      {specs && <div className="ao-item-specs">{specs}</div>}
      {item.fileUrl ? (
        <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" className="ao-file-link photo">
          📸 View uploaded photo
        </a>
      ) : (
        <div className="ao-no-photo">No photo uploaded — customer will bring original</div>
      )}
    </div>
  );
};

const MartItem = ({ item }) => (
  <div className="ao-item-card">
    <div className="ao-item-top">
      <span className="ao-badge mart">MART</span>
      <span className="ao-item-name">{item.name}</span>
      {item.quantity > 1 && <span className="ao-item-qty">×{item.quantity}</span>}
      <span className="ao-item-price">₹{item.price * item.quantity}</span>
    </div>
  </div>
);

const InquiryItem = ({ item }) => {
  const o = item.options || {};
  return (
    <div className="ao-item-card">
      <div className="ao-item-top">
        <span className="ao-badge inquiry">BULK</span>
        <span className="ao-item-name">Bulk / Custom Order</span>
        <span className="ao-item-price ao-quote-label">Quote pending</span>
      </div>
      {o.requirements && (
        <div className="ao-item-specs" style={{ whiteSpace: 'pre-wrap' }}>{o.requirements}</div>
      )}
      {o.quantity && <div className="ao-item-specs">Qty: {o.quantity}</div>}
    </div>
  );
};

const renderItem = (item, i) => {
  if (item.type === 'print')   return <PrintItem key={i} item={item} />;
  if (item.type === 'inquiry') return <InquiryItem key={i} item={item} />;
  if (item.type === 'mart' && item.options?.passportPack) return <PassportItem key={i} item={item} />;
  return <MartItem key={i} item={item} />;
};

/* ── Main Component ── */
const ManageOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('all');
  const [expanded, setExpanded] = useState({});

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try {
      const { data } = await api.get('/admin/orders');
      setOrders(data.orders || []);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      await api.put(`/admin/orders/${orderId}/status`, { status: newStatus });
      toast.success(`Marked as ${newStatus.replace(/-/g, ' ')}`);
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    }
  };

  const getNextStatus = (current) => {
    const idx = statusFlow.indexOf(current);
    return idx !== -1 && idx < statusFlow.length - 1 ? statusFlow[idx + 1] : null;
  };

  const toggle = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));

  const filters = ['all', 'confirmed', 'delivered', 'cancelled'];
  const filteredOrders = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  if (loading) return <div className="page-container"><div className="loading-spinner" /></div>;

  return (
    <div className="page-container">
      <div className="page-top-bar">
        <button className="back-btn" onClick={() => navigate('/admin')}><FiArrowLeft /></button>
        <h1>Manage Orders</h1>
      </div>

      {/* Filter chips */}
      <div className="filter-bar">
        {filters.map(f => (
          <button key={f} className={`filter-chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All' : f.replace(/-/g, ' ')}
          </button>
        ))}
      </div>

      <div className="orders-count">{filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}</div>

      {filteredOrders.length === 0 ? (
        <div className="empty-state">No orders found</div>
      ) : (
        <div className="admin-orders-list">
          {filteredOrders.map(order => {
            const next  = getNextStatus(order.status);
            const color = statusColors[order.status] || '#888';
            const open  = expanded[order._id];
            const itemCount = order.items?.length || 0;

            return (
              <div className="admin-order-card" key={order._id}>

                {/* ── Row 1: Order ID + status ── */}
                <div className="ao-header">
                  <div className="ao-header-left">
                    <span className="ao-id">{order.orderId}</span>
                    <span className="ao-time-ago">{timeAgo(order.createdAt)}</span>
                  </div>
                  <span className="ao-status" style={{ background: color + '22', color }}>
                    {order.status === 'out-for-delivery' ? 'Out for delivery' : order.status}
                  </span>
                </div>

                {/* ── Row 2: Customer name + phone ── */}
                <div className="ao-customer">
                  <div className="ao-customer-info">
                    <span className="ao-customer-name">{order.customer?.name || 'Customer'}</span>
                    <span className="ao-user-id">UID: {String(order.customer?._id || '').slice(-10)}</span>
                  </div>
                  {order.customer?.phone && (
                    <a href={`tel:${order.customer.phone}`} className="ao-phone">
                      <FiPhone size={12} /> {order.customer.phone}
                    </a>
                  )}
                </div>

                {/* ── Row 3: Time placed + amount ── */}
                <div className="ao-meta-row">
                  <span className="ao-meta-time">🕐 {formatDateTime(order.createdAt)}</span>
                  <span className="ao-amount">₹{order.amount}</span>
                </div>

                {/* ── Row 4: Delivery address ── */}
                <div className="ao-address">
                  📍 {order.deliveryAddress?.full || order.deliveryAddress?.label || 'Address not available'}
                </div>

                {/* ── Items (expandable) ── */}
                <div className="ao-items-toggle" role="button" onClick={() => toggle(order._id)}>
                  <span className="ao-items-toggle-label">
                    {itemCount} item{itemCount !== 1 ? 's' : ''}
                    {!open && <span className="ao-items-types">
                      {order.items?.map((it, i) => (
                        <span key={i} className={`ao-badge-sm ${
                          it.type === 'print' ? 'print'
                          : it.type === 'inquiry' ? 'inquiry'
                          : it.options?.passportPack ? 'photo'
                          : 'mart'
                        }`}>
                          {it.type === 'print' ? 'PRINT' : it.type === 'inquiry' ? 'BULK' : it.options?.passportPack ? 'PHOTO' : 'MART'}
                        </span>
                      ))}
                    </span>}
                  </span>
                  {open ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
                </div>

                {open && (
                  <div className="ao-items-expanded">
                    {order.items?.map((item, i) => renderItem(item, i))}
                  </div>
                )}

                {/* ── Admin note ── */}
                {order.adminNote && (
                  <div className="ao-admin-note">📌 {order.adminNote}</div>
                )}

                {/* ── Actions ── */}
                <div className="ao-footer">
                  <div className="ao-actions">
                    {order.status === 'confirmed' && (
                      <button className="ao-cancel-btn" onClick={() => updateStatus(order._id, 'cancelled')}>
                        Cancel
                      </button>
                    )}
                    {next && (
                      <button className="ao-next-btn" onClick={() => updateStatus(order._id, next)}>
                        Mark {next.replace(/-/g, ' ')}
                      </button>
                    )}
                    {(order.status === 'delivered' || order.status === 'cancelled') && (
                      <span className="ao-done-label" style={{ color }}>
                        {order.status === 'delivered' ? '✓ Completed' : '✗ Cancelled'}
                        {order.deliveredAt && ` · ${formatDateTime(order.deliveredAt)}`}
                      </span>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ManageOrders;
