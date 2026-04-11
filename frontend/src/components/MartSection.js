import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import toast from 'react-hot-toast';
import './MartSection.css';

const MartSection = ({ categories }) => {
  const navigate = useNavigate();
  const { addToCart } = useAuth();
  const [activeCategory, setActiveCategory] = useState(null); // null = All
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    fetchProducts(activeCategory);
  }, [activeCategory]);

  const fetchProducts = async (categoryId) => {
    setLoadingProducts(true);
    try {
      const params = categoryId ? `?category=${categoryId}&limit=40` : '?limit=40';
      const { data } = await API.get(`/products${params}`);
      setProducts(data.products || []);
    } catch {
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleAddToCart = (e, product) => {
    e.stopPropagation();
    if (product.stock < 1) { toast.error('Out of stock'); return; }
    addToCart({
      id: product._id,
      type: 'mart',
      name: product.name,
      price: product.price,
      mrp: product.mrp,
      image: product.image,
      quantity: 1,
    });
    toast.success('Added to cart!');
  };

  return (
    <div className="mart-section">
      {/* Heading */}
      <div className="mart-heading-wrap">
        <h2 className="mart-heading">Buy Stationery</h2>
      </div>

      {/* Category chips — horizontal scroll, text only */}
      {categories && categories.length > 0 && (
        <div className="mart-chips-wrap">
          <div className="mart-chips">
            <button
              className={`mart-chip${!activeCategory ? ' active' : ''}`}
              onClick={() => setActiveCategory(null)}
            >
              All
            </button>
            {categories
              .filter(c => c.name !== 'All Stationery')
              .map(cat => (
                <button
                  key={cat._id}
                  className={`mart-chip${activeCategory === cat._id ? ' active' : ''}`}
                  onClick={() => setActiveCategory(cat._id)}
                >
                  {cat.name}
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Products grid */}
      {loadingProducts ? (
        <div className="mart-loader"><div className="spinner"></div></div>
      ) : products.length === 0 ? (
        <p className="mart-empty">No products yet in this category.</p>
      ) : (
        <div className="mart-products-grid">
          {products.map(product => (
            <div
              key={product._id}
              className="mart-product-card"
              onClick={() => navigate(`/product/${product._id}`)}
            >
              <div className="mart-product-img-wrap">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="mart-product-img" />
                ) : (
                  <div className="mart-product-img-placeholder">📦</div>
                )}
                {product.stock < 1 && <span className="mart-out-badge">Out</span>}
                <button
                  className="mart-add-btn"
                  onClick={e => handleAddToCart(e, product)}
                  disabled={product.stock < 1}
                >
                  +
                </button>
              </div>
              <div className="mart-product-info">
                <p className="mart-product-name">{product.name}</p>
                <div className="mart-product-price-row">
                  <span className="mart-product-price">₹{product.price}</span>
                  {product.mrp && product.mrp > product.price && (
                    <span className="mart-product-mrp">₹{product.mrp}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MartSection;

