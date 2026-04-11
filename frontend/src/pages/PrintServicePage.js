import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiPlus } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import { formatPrice } from '../utils/constants';
import './PrintServicePage.css';

const PrintServicePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useAuth();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [customNote, setCustomNote] = useState('');

  useEffect(() => {
    fetchService();
  }, [id]);

  const fetchService = async () => {
    try {
      const { data } = await API.get(`/print-services/${id}`);
      setService(data.service);
      // Set default options
      const defaults = {};
      const opts = data.service.options || {};
      if (opts.colorOptions?.length) defaults.color = opts.colorOptions[0];
      if (opts.sizeOptions?.length) defaults.size = opts.sizeOptions[0];
      if (opts.sidesOptions?.length) defaults.sides = opts.sidesOptions[0];
      if (opts.paperOptions?.length) defaults.paper = opts.paperOptions[0];
      if (opts.bindingOptions?.length) defaults.binding = opts.bindingOptions[0];
      setSelectedOptions(defaults);
    } catch (error) {
      toast.error('Service not found');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const calculatePrice = () => {
    if (!service) return 0;
    let price = service.basePrice;
    
    if (selectedOptions.color) price *= selectedOptions.color.priceMultiplier || 1;
    if (selectedOptions.size) price *= selectedOptions.size.priceMultiplier || 1;
    if (selectedOptions.sides) price *= selectedOptions.sides.priceMultiplier || 1;
    if (selectedOptions.paper) price *= selectedOptions.paper.priceMultiplier || 1;
    if (selectedOptions.binding) price += selectedOptions.binding.price || 0;
    
    return Math.ceil(price);
  };

  const handleAddToCart = () => {
    const price = calculatePrice();
    addToCart({
      id: service._id,
      type: 'print',
      name: service.name,
      price,
      options: selectedOptions,
      customNote,
      quantity: 1
    });
    // Update quantity in cart
    for (let i = 1; i < quantity; i++) {
      addToCart({ id: service._id, type: 'print', name: service.name, price });
    }
    toast.success(`${service.name} added to cart!`);
    navigate('/checkout');
  };

  if (loading) return <div className="page"><div className="spinner"></div></div>;
  if (!service) return null;

  const unitPrice = calculatePrice();
  const totalPrice = unitPrice * quantity;
  const opts = service.options || {};

  return (
    <div className="page">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <FiArrowLeft />
        </button>
        <h1 className="page-title">{service.name}</h1>
      </div>

      <div className="print-hero">
        <div className="print-hero-icon">{service.icon}</div>
        <div>
          <h2 className="print-hero-name">{service.name}</h2>
          <p className="print-hero-desc">{service.description}</p>
          <p className="print-hero-price">From {formatPrice(service.basePrice)}/page</p>
        </div>
      </div>

      {/* Options */}
      <div className="print-options">
        {opts.sizeOptions?.length > 0 && (
          <div className="option-group">
            <label className="option-label">Paper Size</label>
            <div className="option-chips">
              {opts.sizeOptions.map((opt, i) => (
                <button
                  key={i}
                  className={`option-chip ${selectedOptions.size?.label === opt.label ? 'active' : ''}`}
                  onClick={() => setSelectedOptions(p => ({ ...p, size: opt }))}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {opts.sidesOptions?.length > 0 && (
          <div className="option-group">
            <label className="option-label">Print Sides</label>
            <div className="option-chips">
              {opts.sidesOptions.map((opt, i) => (
                <button
                  key={i}
                  className={`option-chip ${selectedOptions.sides?.label === opt.label ? 'active' : ''}`}
                  onClick={() => setSelectedOptions(p => ({ ...p, sides: opt }))}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {opts.colorOptions?.length > 0 && (
          <div className="option-group">
            <label className="option-label">Color</label>
            <div className="option-chips">
              {opts.colorOptions.map((opt, i) => (
                <button
                  key={i}
                  className={`option-chip ${selectedOptions.color?.label === opt.label ? 'active' : ''}`}
                  onClick={() => setSelectedOptions(p => ({ ...p, color: opt }))}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {opts.paperOptions?.length > 0 && (
          <div className="option-group">
            <label className="option-label">Paper Type</label>
            <div className="option-chips">
              {opts.paperOptions.map((opt, i) => (
                <button
                  key={i}
                  className={`option-chip ${selectedOptions.paper?.label === opt.label ? 'active' : ''}`}
                  onClick={() => setSelectedOptions(p => ({ ...p, paper: opt }))}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {opts.bindingOptions?.length > 0 && (
          <div className="option-group">
            <label className="option-label">Binding</label>
            <div className="option-chips">
              {opts.bindingOptions.map((opt, i) => (
                <button
                  key={i}
                  className={`option-chip ${selectedOptions.binding?.label === opt.label ? 'active' : ''}`}
                  onClick={() => setSelectedOptions(p => ({ ...p, binding: opt }))}
                >
                  {opt.label} (+{formatPrice(opt.price)})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quantity */}
        <div className="option-group">
          <label className="option-label">Quantity (pages/copies)</label>
          <div className="quantity-controls">
            <button className="qty-btn" onClick={() => setQuantity(q => Math.max(1, q - 1))}>-</button>
            <input
              type="number"
              className="qty-input"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              min={1}
            />
            <button className="qty-btn" onClick={() => setQuantity(q => q + 1)}>+</button>
          </div>
        </div>

        {/* Custom Note */}
        <div className="option-group">
          <label className="option-label">Customization Note (optional)</label>
          <textarea
            className="input-field"
            placeholder="E.g., Print only pages 1-10, landscape mode, etc."
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            maxLength={500}
            rows={3}
          />
        </div>
      </div>

      {/* Price & Add to Cart */}
      <div className="print-footer">
        <div className="print-price-summary">
          <span>{formatPrice(unitPrice)} × {quantity}</span>
          <span className="print-total">{formatPrice(totalPrice)}</span>
        </div>
        <button className="btn btn-primary btn-full" onClick={handleAddToCart}>
          <FiPlus /> Add to Cart • {formatPrice(totalPrice)}
        </button>
      </div>

      <div className="fab-spacer"></div>
    </div>
  );
};

export default PrintServicePage;
