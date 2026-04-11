import React, { useState, useEffect, useMemo } from 'react';
import { FiArrowLeft, FiPlus, FiEdit2, FiTrash2, FiSearch } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import './ManageProducts.css';

const UNITS = ['piece', 'pack', 'box', 'ream', 'set'];

const ManageProducts = () => {
  const navigate = useNavigate();
  const [products, setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm]   = useState({});
  const [saving, setSaving]       = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/products?limit=100');
      setProducts(data.products || []);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/products/categories/all');
      setCategories(data.categories || []);
    } catch {}
  };

  const startEdit = (product) => {
    setEditingId(product._id);
    setEditForm({
      name:        product.name        || '',
      description: product.description || '',
      category:    product.category?._id || product.category || '',
      price:       product.price       ?? '',
      mrp:         product.mrp         ?? '',
      stock:       product.stock       ?? '',
      unit:        product.unit        || 'piece',
      image:       product.image       || '',
      brand:       product.brand       || '',
      tags:        (product.tags || []).join(', '),
      isActive:    product.isActive    ?? true,
      isFeatured:  product.isFeatured  ?? false,
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const saveEdit = async (id) => {
    if (!editForm.name || editForm.price === '') {
      toast.error('Name and price are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...editForm,
        price: Number(editForm.price),
        mrp:   editForm.mrp !== '' ? Number(editForm.mrp) : undefined,
        stock: Number(editForm.stock),
        tags:  editForm.tags ? editForm.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      };
      await api.put(`/admin/products/${id}`, payload);
      toast.success('Product updated');
      setEditingId(null);
      fetchProducts();
    } catch {
      toast.error('Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await api.delete(`/admin/products/${id}`);
      toast.success('Product deleted');
      fetchProducts();
    } catch {
      toast.error('Failed to delete product');
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q) ||
      (p.category?.name || '').toLowerCase().includes(q)
    );
  }, [products, search]);

  if (loading) {
    return <div className="page-container"><div className="loading-spinner" /></div>;
  }

  return (
    <div className="page-container">
      <div className="page-top-bar">
        <button className="back-btn" onClick={() => navigate('/admin')}><FiArrowLeft /></button>
        <h1>Manage Products</h1>
        <button className="add-btn" onClick={() => navigate('/admin/add-product')}><FiPlus /></button>
      </div>

      <div className="mp-search-wrap">
        <FiSearch className="mp-search-icon" />
        <input
          className="mp-search-input"
          type="text"
          placeholder="Search by name, brand or category…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button className="mp-search-clear" onClick={() => setSearch('')}>✕</button>
        )}
      </div>

      <div className="orders-count">
        {filtered.length}{search ? ` of ${products.length}` : ''} product{filtered.length !== 1 ? 's' : ''}
      </div>

      <div className="products-admin-list">
        {filtered.length === 0 ? (
          <div className="mp-no-results">No products match "{search}"</div>
        ) : filtered.map(product => (
          <div className={`product-admin-card${editingId === product._id ? ' editing' : ''}`} key={product._id}>
            {editingId === product._id ? (

              /* ── Full edit form ── */
              <div className="product-edit-form">

                {/* Image preview + URL */}
                {editForm.image && (
                  <img src={editForm.image} alt="Preview" className="pef-img-preview" />
                )}
                <div className="pef-group">
                  <label>Image URL</label>
                  <input type="url" name="image" value={editForm.image} onChange={handleChange} placeholder="https://..." />
                </div>

                <div className="pef-group">
                  <label>Product Name *</label>
                  <input type="text" name="name" value={editForm.name} onChange={handleChange} placeholder="Product name" />
                </div>

                <div className="pef-group">
                  <label>Description</label>
                  <textarea name="description" value={editForm.description} onChange={handleChange} placeholder="Product description..." rows={2} />
                </div>

                <div className="pef-group">
                  <label>Category</label>
                  <select name="category" value={editForm.category} onChange={handleChange}>
                    <option value="">Select category</option>
                    {categories.map(cat => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="pef-row">
                  <div className="pef-group">
                    <label>Price (₹) *</label>
                    <input type="number" name="price" value={editForm.price} onChange={handleChange} placeholder="0" min="0" />
                  </div>
                  <div className="pef-group">
                    <label>MRP (₹)</label>
                    <input type="number" name="mrp" value={editForm.mrp} onChange={handleChange} placeholder="0" min="0" />
                  </div>
                </div>

                <div className="pef-row">
                  <div className="pef-group">
                    <label>Stock *</label>
                    <input type="number" name="stock" value={editForm.stock} onChange={handleChange} placeholder="0" min="0" />
                  </div>
                  <div className="pef-group">
                    <label>Unit</label>
                    <select name="unit" value={editForm.unit} onChange={handleChange}>
                      {UNITS.map(u => <option key={u} value={u}>{u.charAt(0).toUpperCase() + u.slice(1)}</option>)}
                    </select>
                  </div>
                </div>

                <div className="pef-row">
                  <div className="pef-group">
                    <label>Brand</label>
                    <input type="text" name="brand" value={editForm.brand} onChange={handleChange} placeholder="e.g. Classmate" />
                  </div>
                </div>

                <div className="pef-group">
                  <label>Tags (comma separated)</label>
                  <input type="text" name="tags" value={editForm.tags} onChange={handleChange} placeholder="notebook, school, writing" />
                </div>

                <div className="pef-checks">
                  <label className="pef-check-label">
                    <input type="checkbox" name="isActive" checked={editForm.isActive} onChange={handleChange} />
                    Active
                  </label>
                  <label className="pef-check-label">
                    <input type="checkbox" name="isFeatured" checked={editForm.isFeatured} onChange={handleChange} />
                    Featured
                  </label>
                </div>

                <div className="edit-actions">
                  <button className="save-btn" onClick={() => saveEdit(product._id)} disabled={saving}>
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                  <button className="cancel-edit-btn" onClick={() => setEditingId(null)}>Cancel</button>
                </div>
              </div>

            ) : (
              /* ── Card view ── */
              <>
                <div className="pa-left">
                  {product.image
                    ? <img src={product.image} alt={product.name} className="pa-img" />
                    : <div className="pa-img-placeholder">📦</div>}
                </div>
                <div className="pa-info">
                  <div className="pa-name">{product.name}</div>
                  <div className="pa-meta">
                    <span>₹{product.price}{product.mrp > product.price ? ` / ₹${product.mrp}` : ''}</span>
                    <span>Stock: {product.stock}</span>
                    <span className={`pa-status ${product.isActive ? 'active' : 'inactive'}`}>
                      {product.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className="pa-actions">
                  <button className="pa-edit" onClick={() => startEdit(product)}><FiEdit2 /></button>
                  <button className="pa-delete" onClick={() => deleteProduct(product._id)}><FiTrash2 /></button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ManageProducts;

