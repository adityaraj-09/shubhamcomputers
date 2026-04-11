import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiPlus } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import LocationPicker from '../components/LocationPicker';
import { formatPrice } from '../utils/constants';
import './Checkout.css';

const COLOR_LABEL = { bw: 'Black & White', colour: 'Colour' };
const ORIENTATION_LABEL = { portrait: 'Portrait', landscape: 'Landscape' };
const SIDES_LABEL = { single: 'One side', both: 'Both sides' };

const getFileIcon = (name = '') => {
  const ext = name.split('.').pop().toLowerCase();
  const map = { pdf: '📄', jpg: '🖼️', jpeg: '🖼️', png: '🖼️', webp: '🖼️', doc: '📝', docx: '📝', xls: '📊', xlsx: '📊', ppt: '📽️', pptx: '📽️' };
  return map[ext] || '📁';
};

const isImageExt = (name = '') => ['jpg', 'jpeg', 'png', 'webp'].includes(name.split('.').pop().toLowerCase());

const Checkout = () => {
  const navigate = useNavigate();
  const { user, cart, removeFromCart, clearCart, updateUser, cartTotal, cartCount } = useAuth();
  const [placing, setPlacing] = useState(false);
  const [showLocation, setShowLocation] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [deliveryAddr, setDeliveryAddr] = useState(user?.address?.full || '');

  const hasPrintItems = cart.some(i => i.type === 'print');
  const hasAddress = !!user?.address?.lat;

  useEffect(() => {
    API.get('/products?limit=10')
      .then(({ data }) => setSuggestions(data.products || []))
      .catch(() => {});
  }, []);

  const placeOrder = async () => {
    if (!hasAddress) {
      setShowLocation(true);
      return;
    }
    if (deliveryAddr.trim().length < 5) {
      toast.error('Please enter your complete delivery address');
      document.getElementById('chk-delivery-addr')?.focus();
      return;
    }
    if ((user?.walletBalance || 0) < cartTotal) {
      toast.error(`Insufficient balance. Need ₹${cartTotal - (user?.walletBalance || 0)} more.`);
      toast(
        <span>
          <button
            onClick={() => { toast.dismiss(); navigate('/wallet'); }}
            style={{ background: '#6C63FF', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontWeight: 700 }}
          >
            Add Money →
          </button>
        </span>,
        { duration: 4000 }
      );
      return;
    }

    setPlacing(true);
    try {
      const isObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

      const items = cart.map(item => {
        const base = {
          type: item.type,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          options: item.printConfig || item.options || {},
          customNote: item.customNote || '',
          fileUrl: item.fileUrl || '',
        };
        if (item.type === 'mart') {
          if (isObjectId(item.id)) base.productId = item.id;
        } else if (item.driveFileId) {
          base.driveFileId = item.driveFileId;
        } else {
          if (isObjectId(item.id)) base.productId = item.id;
        }
        return base;
      });

      const { data } = await API.post('/orders', { items, deliveryAddress: deliveryAddr.trim() });
      toast.success(`Order placed! 🎉 ${data.order.orderId}`);
      const newBalance = (user?.walletBalance || 0) - cartTotal;
      updateUser({ walletBalance: newBalance, numOrders: (user?.numOrders || 0) + 1 });
      clearCart();
      navigate('/orders');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="page chk-page">
        <div className="chk-header">
          <button className="chk-back" onClick={() => navigate(-1)}><FiArrowLeft size={20} /></button>
          <span className="chk-header-title">Checkout</span>
        </div>
        <div className="chk-empty">
          <div className="chk-empty-icon">🛒</div>
          <p>Your cart is empty</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>Shop Now</button>
        </div>
      </div>
    );
  }

  const totalPages = cart.filter(i => i.type === 'print').reduce((s, i) => s + (i.printConfig?.pages || 1) * (i.printConfig?.copies || 1), 0);
  const itemCount = cartCount;

  return (
    <div className="chk-page">
      {/* Header */}
      <div className="chk-header">
        <button className="chk-back" onClick={() => navigate(-1)}><FiArrowLeft size={20} /></button>
        <span className="chk-header-title">Checkout</span>
        <button className="chk-clear" onClick={() => { clearCart(); navigate(-1); }}>Clear cart</button>
      </div>

      {/* Delivery Card */}
      <div className="chk-delivery-card">
        <div className="chk-delivery-icon">🕐</div>
        <div className="chk-delivery-info">
          <span className="chk-delivery-time">Delivery in 30 minutes</span>
          <span className="chk-delivery-sub">
            {totalPages > 0 ? `${totalPages} page${totalPages !== 1 ? 's' : ''}` : `${itemCount} item${itemCount !== 1 ? 's' : ''}`}
          </span>
        </div>
        <div className="chk-delivery-wavy" />
      </div>

      {hasPrintItems && (
        <div className="chk-print-notice">
          Delivery time may have increased due to print items.
        </div>
      )}

      {/* Cart Items */}
      <div className="chk-items">
        {cart.map((item, idx) => {
          const cfg = item.printConfig;
          const specs = cfg
            ? [
                cfg.copies > 1 ? `${cfg.copies} copies` : null,
                `${cfg.pages} page${cfg.pages !== 1 ? 's' : ''}`,
                COLOR_LABEL[cfg.color] || cfg.color,
                ORIENTATION_LABEL[cfg.orientation] || cfg.orientation
              ].filter(Boolean).join(', ')
            : null;

          const hasThumb = item.image && isImageExt(item.name || '');

          return (
            <div key={`${item.type}-${item.id}-${idx}`} className="chk-item">
              {/* Thumbnail */}
              <div className="chk-item-thumb">
                {hasThumb ? (
                  <img src={item.image} alt={item.name} className="chk-thumb-img" />
                ) : item.image ? (
                  <img src={item.image} alt={item.name} className="chk-thumb-img" />
                ) : (
                  <span className="chk-thumb-icon">{item.type === 'print' ? getFileIcon(item.name) : '📦'}</span>
                )}
              </div>

              {/* Info */}
              <div className="chk-item-body">
                <div className="chk-item-name">
                  {item.type === 'print'
                    ? `File ${idx + 1} - ${(item.driveFileId || item.id || '').slice(0, 28)}…`
                    : item.name}
                </div>
                {specs && <div className="chk-item-specs">{specs}</div>}
                {item.type === 'mart' && item.quantity > 1 && (
                  <div className="chk-item-specs">Qty: {item.quantity}</div>
                )}
                <button
                  className="chk-item-remove"
                  onClick={() => removeFromCart(item.id, item.type)}
                >
                  Remove
                </button>
              </div>

              {/* Right */}
              <div className="chk-item-right">
                <button className="chk-edit-btn" onClick={() => navigate(-1)}>Edit</button>
                <div className="chk-item-price">
                  {item.mrp && item.mrp > item.price && (
                    <span className="chk-price-mrp">₹{item.mrp * item.quantity}</span>
                  )}
                  <span className="chk-price-final">₹{item.price * item.quantity}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* You might also like */}
      {suggestions.length > 0 && (
        <div className="chk-suggestions">
          <div className="chk-section-title">You might also like</div>
          <div className="chk-suggest-scroll">
            {suggestions.map(p => (
              <div key={p._id} className="chk-suggest-card" onClick={() => navigate(`/product/${p._id}`)}>
                <div className="chk-suggest-img">
                  {p.image ? (
                    <img src={p.image} alt={p.name} />
                  ) : (
                    <span>📦</span>
                  )}
                </div>
                <div className="chk-suggest-name">{p.name}</div>
                <div className="chk-suggest-price">₹{p.price}</div>
                <button
                  className="chk-suggest-add"
                  onClick={e => { e.stopPropagation(); navigate(`/product/${p._id}`); }}
                >
                  <FiPlus size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delivery Address */}
      <div className="chk-addr-section">
        <div className="chk-addr-label">
          📍 Delivery Address <span className="chk-addr-required">*</span>
        </div>
        <textarea
          id="chk-delivery-addr"
          className="chk-addr-textarea"
          placeholder="House / flat no., street, landmark, area…"
          value={deliveryAddr}
          onChange={e => setDeliveryAddr(e.target.value)}
          rows={3}
          maxLength={300}
        />
        {deliveryAddr.trim().length > 0 && deliveryAddr.trim().length < 5 && (
          <p className="chk-addr-hint">Please enter a more complete address</p>
        )}
      </div>

      {/* Wallet info */}
      <div className="chk-wallet-row">
        <span>Wallet Balance</span>
        <span style={{ color: (user?.walletBalance || 0) >= cartTotal ? '#00D9A6' : '#ff4d4d', fontWeight: 700 }}>
          {formatPrice(user?.walletBalance || 0)}
        </span>
      </div>

      {/* Bottom CTA */}
      <div className="chk-bottom">
        <div className="chk-bottom-info">
          <span className="chk-bottom-items">{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
          <span className="chk-bottom-total">₹{cartTotal}</span>
        </div>
        <button
          className="chk-bottom-btn"
          onClick={hasAddress ? placeOrder : () => setShowLocation(true)}
          disabled={placing}
        >
          {placing
            ? 'Placing order…'
            : hasAddress
            ? `Pay ₹${cartTotal} →`
            : 'Select address at next step →'}
        </button>
      </div>

      {/* Spacer */}
      <div style={{ height: 90 }} />

      {/* Location Picker */}
      {showLocation && (
        <LocationPicker
          onClose={() => {
            setShowLocation(false);
          }}
        />
      )}
    </div>
  );
};

export default Checkout;
