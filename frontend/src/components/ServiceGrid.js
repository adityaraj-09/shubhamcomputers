import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatPrice } from '../utils/constants';
import './ServiceGrid.css';

const ServiceGrid = ({ services }) => {
  const navigate = useNavigate();

  if (!services || services.length === 0) return null;

  return (
    <div className="service-grid-section">
      <h2 className="section-title">🖨️ Print Services</h2>
      <p className="section-subtitle">Get your documents printed & delivered under 30 mins</p>
      <div className="service-grid">
        {services.map((service, index) => (
          <div
            key={service._id}
            className="service-card fade-in"
            style={{ animationDelay: `${index * 0.05}s` }}
            onClick={() => navigate(`/print/${service._id}`)}
          >
            <div className="service-icon">{service.icon}</div>
            <div className="service-name">{service.name}</div>
            <div className="service-price">From {formatPrice(service.basePrice)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ServiceGrid;
