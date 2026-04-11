import React, { useState, useRef, useEffect } from 'react';
import { FiArrowLeft, FiPlus, FiMinus, FiFileText } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './PrintOrderConfig.css';

const COLOR_PRICE = { bw: 3, colour: 10 };

const getFileIcon = (name = '') => {
  const ext = name.split('.').pop().toLowerCase();
  const map = { pdf: '📄', jpg: '🖼️', jpeg: '🖼️', png: '🖼️', webp: '🖼️', doc: '📝', docx: '📝', xls: '📊', xlsx: '📊', ppt: '📽️', pptx: '📽️' };
  return map[ext] || '📁';
};

const isImage = (name = '') => ['jpg', 'jpeg', 'png', 'webp'].includes(name.split('.').pop().toLowerCase());

const defaultConfig = () => ({ copies: 1, pages: 1, color: 'bw', orientation: 'portrait', sides: 'single' });

const PrintOrderConfig = ({ uploadedFiles, onAddMoreFiles, onBack }) => {
  const navigate = useNavigate();
  const { addToCart } = useAuth();
  const [current, setCurrent] = useState(0);
  const [configs, setConfigs] = useState(() => uploadedFiles.map(() => defaultConfig()));
  const sliderRef = useRef(null);
  const addFileRef = useRef(null);

  // Sync configs if more files are added
  useEffect(() => {
    setConfigs(prev => {
      if (uploadedFiles.length > prev.length) {
        const extra = uploadedFiles.slice(prev.length).map(() => defaultConfig());
        return [...prev, ...extra];
      }
      return prev.slice(0, uploadedFiles.length);
    });
  }, [uploadedFiles.length]);

  // Scroll slider to current slide
  useEffect(() => {
    if (sliderRef.current) {
      const child = sliderRef.current.children[current];
      if (child) child.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [current]);

  const updateConfig = (key, value) => {
    setConfigs(prev => prev.map((c, i) => i === current ? { ...c, [key]: value } : c));
  };

  const applyToAll = () => {
    const base = configs[current];
    setConfigs(prev => prev.map(() => ({ ...base })));
    toast.success('Settings applied to all files');
  };

  const totalPages = configs.reduce((sum, c, i) => {
    return sum + (uploadedFiles[i] ? c.copies * c.pages : 0);
  }, 0);

  const totalPrice = configs.reduce((sum, c, i) => {
    if (!uploadedFiles[i]) return sum;
    return sum + c.copies * c.pages * COLOR_PRICE[c.color];
  }, 0);

  const handleAddMoreFiles = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) onAddMoreFiles?.(files);
    if (addFileRef.current) addFileRef.current.value = '';
  };

  const handleAddToCart = () => {
    uploadedFiles.forEach((f, i) => {
      const cfg = configs[i] || defaultConfig();
      const pricePerPage = COLOR_PRICE[cfg.color];
      const totalPrice = cfg.copies * cfg.pages * pricePerPage;
      addToCart({
        id: f.id,
        type: 'print',
        name: f.name,
        price: totalPrice,
        quantity: 1,
        image: f.thumbnailLink || f.viewLink || null,
        fileUrl: f.viewLink || f.thumbnailLink || null,
        driveFileId: f.id,
        printConfig: { ...cfg }
      });
    });
    toast.success('Added to cart! ✅');
    navigate('/checkout');
  };

  const cfg = configs[current] || defaultConfig();
  const file = uploadedFiles[current];

  return (
    <div className="poc-page">
      {/* Header */}
      <div className="poc-header">
        <button className="poc-back" onClick={onBack}>
          <FiArrowLeft size={20} />
        </button>
        <span className="poc-header-title">Print Setup</span>
        <button className="poc-add-files-btn" onClick={() => addFileRef.current?.click()}>
          <FiPlus size={16} />
          Add files
        </button>
        <input
          ref={addFileRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
          onChange={handleAddMoreFiles}
          style={{ display: 'none' }}
        />
      </div>

      {/* File Slider */}
      <div className="poc-slider-wrap">
        <div className="poc-slider" ref={sliderRef}>
          {uploadedFiles.map((f, i) => (
            <div
              key={f.id || i}
              className={`poc-slide ${i === current ? 'active' : ''}`}
              onClick={() => setCurrent(i)}
            >
              {isImage(f.name) && (f.thumbnailLink || f.viewLink) ? (
                <img src={f.thumbnailLink || f.viewLink} alt={f.name} className="poc-slide-img" />
              ) : (
                <div className="poc-slide-icon">
                  <span>{getFileIcon(f.name)}</span>
                  <span className="poc-slide-ext">{f.name?.split('.').pop().toUpperCase()}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Dots */}
        <div className="poc-dots">
          <span className="poc-dots-counter">{current + 1}/{uploadedFiles.length}</span>
          {uploadedFiles.map((_, i) => (
            <button
              key={i}
              className={`poc-dot ${i === current ? 'active' : ''}`}
              onClick={() => setCurrent(i)}
            />
          ))}
        </div>
      </div>

      {/* Config Panel */}
      <div className="poc-config">
        {/* Number of copies */}
        <div className="poc-section poc-section-row">
          <div className="poc-section-labels">
            <span className="poc-section-title">Number of copies</span>
            <span className="poc-section-sub">File {current + 1} ({cfg.pages} page{cfg.pages !== 1 ? 's' : ''})</span>
          </div>
          <div className="poc-counter">
            <button className="poc-count-btn" onClick={() => updateConfig('copies', Math.max(1, cfg.copies - 1))}>
              <FiMinus size={14} />
            </button>
            <span className="poc-count-val">{cfg.copies}</span>
            <button className="poc-count-btn" onClick={() => updateConfig('copies', cfg.copies + 1)}>
              <FiPlus size={14} />
            </button>
          </div>
        </div>

        {/* Pages per file */}
        <div className="poc-section poc-section-row">
          <div className="poc-section-labels">
            <span className="poc-section-title">Number of pages</span>
            <span className="poc-section-sub">Set pages in this document</span>
          </div>
          <div className="poc-counter">
            <button className="poc-count-btn" onClick={() => updateConfig('pages', Math.max(1, cfg.pages - 1))}>
              <FiMinus size={14} />
            </button>
            <span className="poc-count-val">{cfg.pages}</span>
            <button className="poc-count-btn" onClick={() => updateConfig('pages', cfg.pages + 1)}>
              <FiPlus size={14} />
            </button>
          </div>
        </div>

        {/* Print sides */}
        <div className="poc-section">
          <span className="poc-section-title">Print sides</span>
          <div className="poc-toggle-group">
            <button
              className={`poc-toggle-btn ${cfg.sides === 'both' ? 'selected' : ''}`}
              onClick={() => updateConfig('sides', 'both')}
            >
              <FiFileText size={16} />
              <span>Both sides</span>
            </button>
            <button
              className={`poc-toggle-btn ${cfg.sides === 'single' ? 'selected' : ''}`}
              onClick={() => updateConfig('sides', 'single')}
            >
              <FiFileText size={16} />
              <span>One side</span>
            </button>
          </div>
        </div>

        {/* Color */}
        <div className="poc-section">
          <span className="poc-section-title">Choose print color</span>
          <div className="poc-toggle-group">
            <button
              className={`poc-toggle-btn ${cfg.color === 'colour' ? 'selected' : ''}`}
              onClick={() => updateConfig('color', 'colour')}
            >
              <span className="poc-color-icon poc-color-icon--colour">⬤</span>
              <div>
                <div>Coloured</div>
                <div className="poc-toggle-price">₹10/page</div>
              </div>
            </button>
            <button
              className={`poc-toggle-btn ${cfg.color === 'bw' ? 'selected' : ''}`}
              onClick={() => updateConfig('color', 'bw')}
            >
              <span className="poc-color-icon poc-color-icon--bw">◑</span>
              <div>
                <div>B &amp; W</div>
                <div className="poc-toggle-price">₹3/page</div>
              </div>
            </button>
          </div>
        </div>

        {/* Orientation */}
        <div className="poc-section">
          <span className="poc-section-title">Choose print orientation</span>
          <div className="poc-toggle-group">
            <button
              className={`poc-toggle-btn ${cfg.orientation === 'portrait' ? 'selected' : ''}`}
              onClick={() => updateConfig('orientation', 'portrait')}
            >
              <span className="poc-orient-icon poc-orient-portrait">▯</span>
              <div>
                <div>Portrait</div>
                <div className="poc-toggle-price">8.3 × 11.7 in</div>
              </div>
            </button>
            <button
              className={`poc-toggle-btn ${cfg.orientation === 'landscape' ? 'selected' : ''}`}
              onClick={() => updateConfig('orientation', 'landscape')}
            >
              <span className="poc-orient-icon poc-orient-landscape">▭</span>
              <div>
                <div>Landscape</div>
                <div className="poc-toggle-price">11.7 × 8.3 in</div>
              </div>
            </button>
          </div>
        </div>

        {/* Apply to all */}
        {uploadedFiles.length > 1 && (
          <div className="poc-apply-all">
            <span>Apply this setting to all files</span>
            <button className="poc-apply-btn" onClick={applyToAll}>Apply</button>
          </div>
        )}
      </div>

      {/* Bottom Bar */}
      <div className="poc-bottom">
        <div className="poc-total-info">
          <span className="poc-total-pages">Total {totalPages} page{totalPages !== 1 ? 's' : ''}</span>
          <span className="poc-total-price">₹{totalPrice}</span>
        </div>
        <button className="poc-cart-btn" onClick={handleAddToCart}>
          Add to cart →
        </button>
      </div>
    </div>
  );
};

export default PrintOrderConfig;
