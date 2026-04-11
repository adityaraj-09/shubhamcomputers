import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiPlus } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import { formatPrice } from '../utils/constants';
import './MartCategory.css';

const MartCategory = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useAuth();
  const [products, setProducts] = useState([]);
  const [categoryName, setCategoryName] = useState('');
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('popular');

  useEffect(() => {
    fetchProducts();
  }, [categoryId, sort]);

  const fetchProducts = async () => {
    try {
      const { data } = await API.get(`/products?category=${categoryId}&sort=${sort}&limit=50`);
      setProducts(data.products || []);
      if (data.products?.length > 0 && data.products[0].category) {
        setCategoryName(data.products[0].category.name);
      }
    } catch (error) {
      console.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    addToCart({
      id: product._id,
      type: 'mart',
      name: product.name,
      price: product.price
    });
    toast.success(`${product.name} added!`);
  };

  return (
    <div className="page">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <FiArrowLeft />
        </button>
        <h1 className="page-title">{categoryName || 'Products'}</h1>
      </div>

      {/* Sort */}
      <div className="sort-bar">
        {['popular', 'price_low', 'price_high', 'newest'].map(s => (
          <button
            key={s}
            className={`sort-chip ${sort === s ? 'active' : ''}`}
            onClick={() => setSort(s)}
          >
            {s === 'popular' ? 'Popular' : s === 'price_low' ? 'Price ↑' : s === 'price_high' ? 'Price ↓' : 'Newest'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="spinner"></div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📦</div>
          <p>No products in this category yet.</p>
        </div>
      ) : (
        <div className="product-grid">
          {products.map(product => (
            <div key={product._id} className="product-card" onClick={() => navigate(`/product/${product._id}`)}>
              <div className="product-image">
                {product.image ? <img src={product.image} alt={product.name} /> : <span>📦</span>}
              </div>
              <div className="product-info">
                <div className="product-name">{product.name}</div>
                <div className="product-brand">{product.brand}</div>
                <div className="product-price-row">
                  <span className="product-price">{formatPrice(product.price)}</span>
                  {product.mrp > product.price && (
                    <span className="product-mrp">{formatPrice(product.mrp)}</span>
                  )}
                </div>
              </div>
              <button
                className="product-add-btn"
                onClick={(e) => { e.stopPropagation(); handleAddToCart(product); }}
              >
                <FiPlus />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="fab-spacer"></div>
    </div>
  );
};

export default MartCategory;
