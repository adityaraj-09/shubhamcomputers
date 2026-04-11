import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiPlus, FiMinus, FiUploadCloud, FiX, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import './PassportPhotos.css';

const SIZES = [
  { id: 'std', label: 'Standard Passport', dims: '35 × 45 mm', badge: 'Most Popular' },
  { id: 'stamp', label: 'Stamp Size', dims: '25 × 35 mm', badge: null },
  { id: 'visa', label: 'Visa / US Passport', dims: '50 × 50 mm', badge: null },
];

const BACKGROUNDS = [
  { id: 'white', label: 'White', color: '#ffffff' },
  { id: 'offwhite', label: 'Off-White', color: '#f5f0e8' },
  { id: 'blue', label: 'Blue', color: '#678ac0' },
  { id: 'grey', label: 'Grey', color: '#c5c5c5' },
];

const PACKS = [
  { id: 'pack8', label: '8 Photos', price: 40 },
  { id: 'pack16', label: '16 Photos', price: 75 },
  { id: 'pack24', label: '24 Photos', price: 100 },
];

const PassportPhotos = () => {
  const navigate = useNavigate();
  const { addToCart } = useAuth();
  const [selectedSize, setSelectedSize] = useState('std');
  const [selectedBg, setSelectedBg] = useState('white');
  const [selectedPack, setSelectedPack] = useState('pack8');
  const [extraCopies, setExtraCopies] = useState(0);
  const [uploadedPhoto, setUploadedPhoto] = useState(null); // { viewLink, thumbnailLink, name }
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!fileInputRef.current) fileInputRef.current = e.target;
    if (!file) return;
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      toast.error('Please upload a JPG, PNG, or WebP image');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File must be under 10 MB');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('files', file);
      const { data } = await API.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const uploaded = data.files?.[0];
      if (!uploaded) throw new Error('Upload failed');
      setUploadedPhoto(uploaded);
      toast.success('Photo uploaded!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const pack = PACKS.find(p => p.id === selectedPack);
  const size = SIZES.find(s => s.id === selectedSize);
  const totalPrice = pack.price + extraCopies * 5;
  const totalPhotos = pack.label.replace(' Photos', '') * 1 + extraCopies * 8;

  const handleAddToCart = () => {
    const bg = BACKGROUNDS.find(b => b.id === selectedBg);
    const totalPhotoCount = parseInt(pack.label) + extraCopies * 8;
    addToCart({
      id: `passport-${Date.now()}`,
      type: 'mart',
      name: `Passport Photos – ${size.label}, ${bg.label} bg, ${pack.label}${extraCopies > 0 ? ` +${extraCopies * 8}` : ''}`,
      price: totalPrice,
      quantity: 1,
      image: uploadedPhoto?.thumbnailLink || uploadedPhoto?.viewLink || null,
      fileUrl: uploadedPhoto?.viewLink || null,
      options: {
        passportPack: pack.label,
        passportSize: size.label,
        passportDims: size.dims,
        passportBg: bg.label,
        extraCopies,
        totalPhotos: totalPhotoCount,
      },
      mrp: null,
    });
    toast.success('Passport photos added to cart! 📸');
    navigate('/checkout');
  };

  return (
    <div className="psp-page">
      {/* Header */}
      <div className="psp-header">
        <button className="psp-back" onClick={() => navigate(-1)}>
          <FiArrowLeft size={20} />
        </button>
        <span className="psp-header-title">Passport Size Photos</span>
      </div>

      {/* Hero */}
      <div className="psp-hero">
        <img
          src="/images/passport-photo.png"
          alt="Passport Photos"
          className="psp-hero-img"
          onError={e => { e.target.style.display = 'none'; }}
        />
        <div className="psp-hero-overlay">
          <h2>Professional Quality</h2>
          <p>Printed on glossy photo paper • Ready in minutes</p>
        </div>
      </div>



      <div className="psp-body">

        {/* Photo Upload */}
        <div className="psp-section">
          <h3 className="psp-section-title">Upload Your Photo</h3>
          <p className="psp-section-sub" style={{ marginBottom: 12 }}>Optional · JPG / PNG · max 10 MB</p>

          {uploadedPhoto ? (
            <div className="psp-uploaded-wrap">
              <img
                src={uploadedPhoto.thumbnailLink || uploadedPhoto.viewLink}
                alt="Uploaded"
                className="psp-uploaded-thumb"
              />
              <div className="psp-uploaded-info">
                <span className="psp-uploaded-name">{uploadedPhoto.name}</span>
                <span className="psp-uploaded-ok"><FiCheck size={13} /> Ready to print</span>
              </div>
              <button
                className="psp-uploaded-remove"
                onClick={() => setUploadedPhoto(null)}
              >
                <FiX size={16} />
              </button>
            </div>
          ) : (
            <button
              className={`psp-upload-btn${uploading ? ' uploading' : ''}`}
              onClick={() => document.getElementById('psp-file-input').click()}
              disabled={uploading}
            >
              <FiUploadCloud size={22} />
              <span>{uploading ? 'Uploading…' : 'Tap to upload photo'}</span>
            </button>
          )}

          <input
            id="psp-file-input"
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            style={{ display: 'none' }}
            onChange={handlePhotoSelect}
          />
        </div>

      </div>

        {/* Pack selection */}
        <div className="psp-section">
          <h3 className="psp-section-title">Choose Pack</h3>
          <div className="psp-pack-row">
            {PACKS.map(p => (
              <button
                key={p.id}
                className={`psp-pack-btn ${selectedPack === p.id ? 'selected' : ''}`}
                onClick={() => setSelectedPack(p.id)}
              >
                <span className="psp-pack-label">{p.label}</span>
                <span className="psp-pack-price">₹{p.price}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Photo Size */}
        <div className="psp-section">
          <h3 className="psp-section-title">Photo Size</h3>
          <div className="psp-size-list">
            {SIZES.map(s => (
              <button
                key={s.id}
                className={`psp-size-btn ${selectedSize === s.id ? 'selected' : ''}`}
                onClick={() => setSelectedSize(s.id)}
              >
                <div className="psp-size-info">
                  <span className="psp-size-name">{s.label}</span>
                  <span className="psp-size-dims">{s.dims}</span>
                </div>
                {s.badge && <span className="psp-badge">{s.badge}</span>}
                <div className={`psp-size-radio ${selectedSize === s.id ? 'selected' : ''}`} />
              </button>
            ))}
          </div>
        </div>

        {/* Background Color */}
        <div className="psp-section">
          <h3 className="psp-section-title">Background Color</h3>
          <div className="psp-bg-row">
            {BACKGROUNDS.map(bg => (
              <button
                key={bg.id}
                className={`psp-bg-btn ${selectedBg === bg.id ? 'selected' : ''}`}
                onClick={() => setSelectedBg(bg.id)}
                style={{ '--bg-color': bg.color }}
              >
                <span className="psp-bg-swatch" style={{ background: bg.color }} />
                <span className="psp-bg-label">{bg.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Extra copies */}
        <div className="psp-section psp-section-row">
          <div>
            <h3 className="psp-section-title" style={{ marginBottom: 2 }}>Extra copies</h3>
            <p className="psp-section-sub">+8 photos per unit · ₹5 each</p>
          </div>
          <div className="psp-counter">
            <button className="psp-count-btn" onClick={() => setExtraCopies(Math.max(0, extraCopies - 1))}>
              <FiMinus size={13} />
            </button>
            <span className="psp-count-val">{extraCopies}</span>
            <button className="psp-count-btn" onClick={() => setExtraCopies(extraCopies + 1)}>
              <FiPlus size={13} />
            </button>
          </div>
        </div>

      {/* Bottom Bar */}
      <div className="psp-bottom">
        <div className="psp-total-info">
          <span className="psp-total-photos">{totalPhotos} Photos</span>
          <span className="psp-total-price">₹{totalPrice}</span>
        </div>
        <button className="psp-add-btn" onClick={handleAddToCart}>
          Add to cart →
        </button>
      </div>
    </div>
  );
};

export default PassportPhotos;
