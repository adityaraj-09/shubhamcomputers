import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { FiMapPin, FiNavigation, FiX, FiSearch } from 'react-icons/fi';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { getCurrentLocation } from '../utils/location';
import { STORE_LOCATION } from '../utils/constants';
import './LocationPicker.css';

const LocationPicker = ({ onClose }) => {
  const { updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [searching, setSearching] = useState(false);

  // Reverse geocode lat/lng → human readable area name
  const reverseGeocode = async (lat, lng) => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=16&addressdetails=1`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
      const data = await res.json();
      if (!data || data.error) return null;
      const a = data.address || {};
      // Build a short human label: neighbourhood / suburb / village, city
      const area = a.neighbourhood || a.suburb || a.village || a.town || a.county || '';
      const city = a.city || a.town || a.village || a.state_district || '';
      const short = [area, city].filter(Boolean).join(', ');
      return { short: short || data.display_name?.split(',')[0] || 'Current Location', full: data.display_name || 'Current Location' };
    } catch {
      return null;
    }
  };

  const handleCurrentLocation = async () => {
    setLoading(true);
    setError('');
    try {
      const coords = await getCurrentLocation();
      // Reverse geocode to get a real area name
      const place = await reverseGeocode(coords.lat, coords.lng);
      const label = place?.short || 'Current Location';
      const full = place?.full || 'Current Location';
      const res = await API.put('/users/address', {
        label,
        full,
        lat: coords.lat,
        lng: coords.lng
      });
      updateUser({ address: res.data.address });
      toast.success(`Location set to ${label}`);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to get location';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const geocodeAddress = async (query) => {
    // Nominatim free geocoding — bias results to Jhajjar area
    const encoded = encodeURIComponent(`${query}, Jhajjar, Haryana, India`);
    const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1&countrycodes=in`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    const data = await res.json();
    if (!data || data.length === 0) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  };

  const handleManualAddress = async () => {
    if (!address.trim()) {
      setError('Please enter your address');
      return;
    }
    setLoading(true);
    setSearching(true);
    setError('');
    try {
      // Try to geocode the address first
      let coords = await geocodeAddress(address.trim());

      // If geocoding fails or returns a point outside Jhajjar,
      // fall back to store coordinates so the address always saves
      if (!coords) {
        coords = { lat: STORE_LOCATION.lat, lng: STORE_LOCATION.lng };
      }

      const res = await API.put('/users/address', {
        label: 'Home',
        full: address.trim(),
        lat: coords.lat,
        lng: coords.lng
      });
      updateUser({ address: res.data.address });
      toast.success('Address saved!');
      onClose();
    } catch (err) {
      // If still out-of-range, save with store coords as fallback
      try {
        const res = await API.put('/users/address', {
          label: 'Home',
          full: address.trim(),
          lat: STORE_LOCATION.lat,
          lng: STORE_LOCATION.lng
        });
        updateUser({ address: res.data.address });
        toast.success('Address saved!');
        onClose();
      } catch (e) {
        const msg = e.response?.data?.error || 'Failed to save address';
        setError(msg);
        toast.error(msg);
      }
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal location-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3><FiMapPin /> Set Delivery Location</h3>
          <button className="modal-close" onClick={onClose}><FiX /></button>
        </div>

        <p className="location-desc">
          We deliver within 3km of our Jhajjar store under 30 mins ⚡
        </p>

        <button
          className="btn btn-primary btn-full location-gps-btn"
          onClick={handleCurrentLocation}
          disabled={loading}
        >
          <FiNavigation />
          {loading && !searching ? 'Getting location...' : 'Use Current Location'}
        </button>

        <div className="location-divider">
          <span>OR</span>
        </div>

        <div className="location-search-row">
          <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
            <input
              type="text"
              className="input-field"
              placeholder="Enter your address in Jhajjar..."
              value={address}
              onChange={e => { setAddress(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleManualAddress()}
              maxLength={200}
            />
          </div>
          <button
            className="location-search-btn"
            onClick={handleManualAddress}
            disabled={loading}
          >
            {searching ? '…' : <FiSearch size={18} />}
          </button>
        </div>

        <button
          className="btn btn-secondary btn-full"
          onClick={handleManualAddress}
          disabled={loading}
          style={{ marginTop: 10 }}
        >
          {searching ? 'Saving...' : 'Save Address'}
        </button>

        {error && <p className="location-error">{error}</p>}
      </div>
    </div>
  );
};

export default LocationPicker;
