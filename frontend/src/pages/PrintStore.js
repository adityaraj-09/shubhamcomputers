import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import toast from 'react-hot-toast';
import ServiceGrid from '../components/ServiceGrid';
import PrintStoreLanding from '../components/PrintStoreLanding';
import PrintOrderConfig from '../components/PrintOrderConfig';
import { formatPrice } from '../utils/constants';
import './PrintStore.css';

const MAX_FILES = 15;
const MAX_SIZE_MB = 50;
const ALLOWED_EXT = ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'];

const PrintStore = () => {
  const navigate = useNavigate();
  const { cart, cartTotal } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [showConfig, setShowConfig] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const { data } = await API.get('/print-services');
        setServices(data.services || []);
      } catch (err) {
        console.error('Failed to load print services:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  const handleFilesUploaded = (files) => {
    setUploadedFiles(files);
    if (files.length > 0) setShowConfig(true);
  };

  const handleAddMoreFiles = async (newFiles) => {
    const remaining = MAX_FILES - uploadedFiles.length;
    if (remaining <= 0) {
      toast.error(`Maximum ${MAX_FILES} files allowed`);
      return;
    }

    const valid = newFiles.slice(0, remaining).filter(file => {
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      if (!ALLOWED_EXT.includes(ext)) { toast.error(`${file.name}: Unsupported type`); return false; }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) { toast.error(`${file.name}: Exceeds ${MAX_SIZE_MB}MB`); return false; }
      return true;
    });

    if (valid.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      valid.forEach(f => formData.append('files', f));
      const { data } = await API.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const combined = [...uploadedFiles, ...data.files];
      setUploadedFiles(combined);
      toast.success(`${data.files.length} more file(s) added!`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Show full-screen print config when files are ready
  if (showConfig && uploadedFiles.length > 0) {
    return (
      <PrintOrderConfig
        uploadedFiles={uploadedFiles}
        onAddMoreFiles={handleAddMoreFiles}
        onBack={() => setShowConfig(false)}
      />
    );
  }

  return (
    <div className="page print-store-page">
      <div className="page-top-bar">
        <button className="back-btn" onClick={() => navigate('/')}>
          <FiArrowLeft />
        </button>
        <h1>Print Store</h1>
      </div>

      {/* PrintStore Landing Content */}
      <PrintStoreLanding onFilesUploaded={handleFilesUploaded} />

      {/* Print Services */}
      {loading ? (
        <div className="spinner"></div>
      ) : (
        <ServiceGrid services={services} />
      )}

      {/* Floating Cart Bar */}
      {cart.length > 0 && (
        <div className="floating-cart" onClick={() => navigate('/orders')}>
          <div className="floating-cart-info">
            <span className="floating-cart-count">{cart.length} item(s)</span>
            <span className="floating-cart-total">{formatPrice(cartTotal)}</span>
          </div>
          <span className="floating-cart-action">View Cart →</span>
        </div>
      )}

      <div className="fab-spacer"></div>
    </div>
  );
};

export default PrintStore;
