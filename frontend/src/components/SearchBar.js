import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiX } from 'react-icons/fi';
import API from '../api/axios';
import { formatPrice } from '../utils/constants';
import './SearchBar.css';

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ products: [], services: [] });
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const timeoutRef = useRef(null);

  const search = useCallback(async (q) => {
    if (q.length < 2) {
      setResults({ products: [], services: [] });
      return;
    }
    
    setLoading(true);
    try {
      const [productsRes, servicesRes] = await Promise.all([
        API.get(`/products/search/quick?q=${encodeURIComponent(q)}`),
        API.get(`/print-services/search?q=${encodeURIComponent(q)}`)
      ]);
      setResults({
        products: productsRes.data.results || [],
        services: servicesRes.data.results || []
      });
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInput = (e) => {
    const value = e.target.value;
    setQuery(value);
    setShowResults(true);

    // Debounce search
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => search(value), 300);
  };

  const handleClear = () => {
    setQuery('');
    setResults({ products: [], services: [] });
    setShowResults(false);
    inputRef.current?.focus();
  };

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  const hasResults = results.products.length > 0 || results.services.length > 0;

  return (
    <div className="search-bar-wrapper">
      <div className="search-input-container">
        <FiSearch className="search-icon" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search prints, stationery..."
          value={query}
          onChange={handleInput}
          onFocus={() => query.length >= 2 && setShowResults(true)}
          className="search-input"
        />
        {query && (
          <button className="search-clear" onClick={handleClear}>
            <FiX />
          </button>
        )}
      </div>

      {showResults && query.length >= 2 && (
        <div className="search-results" onClick={() => setShowResults(false)}>
          {loading && <div className="search-loading">Searching...</div>}
          
          {!loading && !hasResults && (
            <div className="search-empty">No results for "{query}"</div>
          )}

          {results.services.length > 0 && (
            <div className="search-section">
              <div className="search-section-title">Print Services</div>
              {results.services.map(s => (
                <div key={s._id} className="search-item" onClick={() => {
                  navigate(`/print/${s._id}`);
                  handleClear();
                }}>
                  <span className="search-item-icon">{s.icon}</span>
                  <div className="search-item-info">
                    <span className="search-item-name">{s.name}</span>
                    <span className="search-item-price">From {formatPrice(s.basePrice)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {results.products.length > 0 && (
            <div className="search-section">
              <div className="search-section-title">Mart Products</div>
              {results.products.map(p => (
                <div key={p._id} className="search-item" onClick={() => {
                  navigate(`/product/${p._id}`);
                  handleClear();
                }}>
                  <span className="search-item-icon">📦</span>
                  <div className="search-item-info">
                    <span className="search-item-name">{p.name}</span>
                    <span className="search-item-price">{formatPrice(p.price)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
