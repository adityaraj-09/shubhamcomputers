import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiPlus, FiMinus, FiShoppingCart } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import { formatPrice } from '../utils/constants';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await API.get(`/products/${id}`);
        setProduct(data.product);
      } catch (error) {
        toast.error('Product not found');
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, navigate]);

  const handleAdd = () => {
    for (let i = 0; i < qty; i++) {
      addToCart({
        id: product._id,
        type: 'mart',
        name: product.name,
        price: product.price,
        mrp: product.mrp || null,
        image: product.image || null
      });
    }
    toast.success(`${product.name} added to cart!`);
    navigate('/checkout');
  };

  if (loading) return <div className="page"><div className="spinner"></div></div>;
  if (!product) return null;

  const discount = product.mrp ? Math.round((1 - product.price / product.mrp) * 100) : 0;

  return (
    <div className="page">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <FiArrowLeft />
        </button>
        <h1 className="page-title">Product</h1>
      </div>

      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ fontSize: 72, marginBottom: 16 }}>
          {product.image ? <img src={product.image} alt={product.name} style={{ width: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 12 }} /> : '📦'}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{product.name}</h2>
        {product.brand && <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 8 }}>{product.brand}</p>}
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent)' }}>{formatPrice(product.price)}</span>
          {product.mrp > product.price && (
            <>
              <span style={{ fontSize: 15, color: 'var(--text-muted)', textDecoration: 'line-through' }}>{formatPrice(product.mrp)}</span>
              <span className="badge badge-success">{discount}% OFF</span>
            </>
          )}
        </div>

        {product.description && <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{product.description}</p>}
        
        <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
          <span>Unit: {product.unit}</span>
          <span>Stock: {product.stock > 0 ? `${product.stock} available` : 'Out of stock'}</span>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Quantity</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))}><FiMinus size={14} /></button>
            <span style={{ fontSize: 18, fontWeight: 700, minWidth: 30, textAlign: 'center' }}>{qty}</span>
            <button className="qty-btn" onClick={() => setQty(q => q + 1)}><FiPlus size={14} /></button>
          </div>
        </div>
      </div>

      <button className="btn btn-primary btn-full" onClick={handleAdd} disabled={product.stock <= 0}>
        <FiShoppingCart /> Add to Cart • {formatPrice(product.price * qty)}
      </button>

      <div className="fab-spacer"></div>
    </div>
  );
};

export default ProductDetail;
