import React from 'react';
import { FiClock, FiShield, FiDollarSign, FiLayers, FiEye, FiFileText, FiPrinter, FiShoppingCart, FiImage, FiColumns, FiRotateCw, FiUploadCloud } from 'react-icons/fi';
import FileUpload from './FileUpload';
import './PrintStoreLanding.css';

const PrintStoreLanding = ({ onFilesUploaded }) => {
  return (
    <div className="print-store-landing">

      {/* Hero Banner */}
      <div className="ps-hero">
        <div className="ps-hero-illustration">
          <span className="ps-hero-emoji">🖨️</span>
          <div className="ps-hero-docs">
            <span>📄</span><span>📑</span><span>🖼️</span>
          </div>
        </div>
        <h2 className="ps-hero-title">Print Store</h2>
        <p className="ps-hero-subtitle">Shubham Computers provides Safe & Secure printouts</p>
      </div>

      {/* Functional File Upload */}
      <FileUpload onFilesUploaded={onFilesUploaded} />

      {/* Why Try Print Store */}
      <div className="ps-section">
        <h3 className="ps-section-title">Why try our Print Store?</h3>
        <div className="ps-features-grid">
          <div className="ps-feature-card">
            <div className="ps-feature-icon clock">
              <FiClock size={20} />
            </div>
            <h4>Delivery in minutes</h4>
            <p>Instant deliveries under 30 minutes</p>
          </div>
          <div className="ps-feature-card">
            <div className="ps-feature-icon shield">
              <FiShield size={20} />
            </div>
            <h4>Safe and secure</h4>
            <p>We delete your files once delivered</p>
          </div>
          <div className="ps-feature-card">
            <div className="ps-feature-icon dollar">
              <FiDollarSign size={20} />
            </div>
            <h4>Affordable Printing</h4>
            <p>B&W: ₹3 per page<br />Colour: ₹10 per page</p>
          </div>
          <div className="ps-feature-card">
            <div className="ps-feature-icon layers">
              <FiLayers size={20} />
            </div>
            <h4>No minimum order</h4>
            <p>Order as many pages as few as you want</p>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="ps-section ps-how-section">
        <h3 className="ps-section-title">How Print Store works</h3>
        <p className="ps-section-desc">Let Shubham Computers take care of your everyday printing needs</p>
        <div className="ps-steps">
          <div className="ps-step">
            <div className="ps-step-content">
              <h4>Visit Print Store</h4>
              <p>Open the app and browse print services</p>
            </div>
            <div className="ps-step-icon visit"><FiEye size={18} /></div>
          </div>
          <div className="ps-step">
            <div className="ps-step-content">
              <h4>Upload file(s)</h4>
              <p>Upload a file or multiple files to take prints</p>
            </div>
            <div className="ps-step-icon upload"><FiUploadCloud size={18} /></div>
          </div>
          <div className="ps-step">
            <div className="ps-step-content">
              <h4>Customise print</h4>
              <p>Choose print settings as per your requirement</p>
            </div>
            <div className="ps-step-icon customize"><FiPrinter size={18} /></div>
          </div>
          <div className="ps-step">
            <div className="ps-step-content">
              <h4>Checkout</h4>
              <p>Add prints to cart and place an order</p>
            </div>
            <div className="ps-step-icon checkout"><FiShoppingCart size={18} /></div>
          </div>
        </div>
      </div>

      {/* Customisation Options */}
      <div className="ps-section ps-custom-section">
        <h3 className="ps-section-title">Customisation options</h3>
        <div className="ps-options-list">
          <div className="ps-option">
            <div className="ps-option-icon"><FiFileText size={20} /></div>
            <div>
              <h4>Upload any file type</h4>
              <p>Print PDF, JPG, PNG, JPEG, and many more</p>
            </div>
          </div>
          <div className="ps-option">
            <div className="ps-option-icon"><FiImage size={20} /></div>
            <div>
              <h4>Black & White / Colour</h4>
              <p>Save cost with B&W or pick the coloured option</p>
            </div>
          </div>
          <div className="ps-option">
            <div className="ps-option-icon"><FiColumns size={20} /></div>
            <div>
              <h4>Paper format size</h4>
              <p>We work with A4 printing paper of 70 GSM</p>
            </div>
          </div>
          <div className="ps-option">
            <div className="ps-option-icon"><FiRotateCw size={20} /></div>
            <div>
              <h4>Orientation</h4>
              <p>Choose landscape or portrait as per your need</p>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="ps-section ps-testimonials-section">
        <h3 className="ps-section-title">Proudly serving 500+ happy customers</h3>
        <p className="ps-section-desc">We think our Print Store is awesome. But don't take our word for it!</p>
        <div className="ps-testimonials-label">Testimonials</div>
        <div className="ps-testimonials-grid">
          <div className="ps-testimonial">
            <div className="ps-testimonial-avatar">R</div>
            <h4>Rahul Sharma</h4>
            <p>Super fast delivery! Got my project printed in under 20 minutes. Life saver during exams.</p>
          </div>
          <div className="ps-testimonial">
            <div className="ps-testimonial-avatar">P</div>
            <h4>Priya Yadav</h4>
            <p>Affordable and quality printing right at my doorstep. The B&W prints are super clear.</p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default PrintStoreLanding;
