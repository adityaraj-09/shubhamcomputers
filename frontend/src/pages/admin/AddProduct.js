import React, { useState, useEffect } from 'react';
import { FiArrowLeft } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import './AddProduct.css';

const AddProduct = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    mrp: '',
    image: '',
    stock: '',
    unit: 'piece',
    brand: '',
    tags: '',
    isFeatured: false
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/products/categories/all');
      if (data.categories) setCategories(data.categories);
    } catch {
      // categories may come from a different endpoint
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.stock) {
      toast.error('Name, price and stock are required');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        mrp: form.mrp ? Number(form.mrp) : undefined,
        stock: Number(form.stock),
        tags: form.tags ? form.tags.split(',').map(t => t.trim()) : []
      };
      await api.post('/admin/products', payload);
      toast.success('Product added!');
      navigate('/admin/products');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-top-bar">
        <button className="back-btn" onClick={() => navigate('/admin/products')}>
          <FiArrowLeft />
        </button>
        <h1>Add Product</h1>
      </div>

      <form className="add-product-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Product Name *</label>
          <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="e.g. Classmate Notebook" />
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea name="description" value={form.description} onChange={handleChange} placeholder="Product description..." rows={3} />
        </div>

        <div className="form-group">
          <label>Category</label>
          <select name="category" value={form.category} onChange={handleChange}>
            <option value="">Select category</option>
            {categories.map(cat => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Price (₹) *</label>
            <input type="number" name="price" value={form.price} onChange={handleChange} placeholder="0" />
          </div>
          <div className="form-group">
            <label>MRP (₹)</label>
            <input type="number" name="mrp" value={form.mrp} onChange={handleChange} placeholder="0" />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Stock *</label>
            <input type="number" name="stock" value={form.stock} onChange={handleChange} placeholder="0" />
          </div>
          <div className="form-group">
            <label>Unit</label>
            <select name="unit" value={form.unit} onChange={handleChange}>
              <option value="piece">Piece</option>
              <option value="pack">Pack</option>
              <option value="box">Box</option>
              <option value="ream">Ream</option>
              <option value="set">Set</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Image URL</label>
          <input type="url" name="image" value={form.image} onChange={handleChange} placeholder="https://..." />
        </div>

        <div className="form-group">
          <label>Brand</label>
          <input type="text" name="brand" value={form.brand} onChange={handleChange} placeholder="e.g. Classmate" />
        </div>

        <div className="form-group">
          <label>Tags (comma separated)</label>
          <input type="text" name="tags" value={form.tags} onChange={handleChange} placeholder="notebook, writing, school" />
        </div>

        <label className="toggle-label">
          <input type="checkbox" name="isFeatured" checked={form.isFeatured} onChange={handleChange} />
          Featured Product
        </label>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'Adding...' : 'Add Product'}
        </button>
      </form>
    </div>
  );
};

export default AddProduct;
