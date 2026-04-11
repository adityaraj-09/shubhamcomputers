// Store coordinates (Jhajjar)
export const STORE_LOCATION = {
  lat: 28.605441032453836,
  lng: 76.65319837711422
};

export const SERVICE_RADIUS_KM = 3;
export const DELIVERY_TIME_MINS = 30;
export const MIN_WALLET_TOPUP = 50;
export const MAX_WALLET_TOPUP = 10000;

export const ORDER_STATUS_MAP = {
  'placed': { label: 'Placed', color: 'var(--primary-light)', bg: 'rgba(108, 99, 255, 0.15)' },
  'confirmed': { label: 'Confirmed', color: 'var(--warning)', bg: 'rgba(255, 183, 77, 0.15)' },
  'processing': { label: 'Processing', color: 'var(--warning)', bg: 'rgba(255, 183, 77, 0.15)' },
  'out-for-delivery': { label: 'Out for Delivery', color: '#4FC3F7', bg: 'rgba(79, 195, 247, 0.15)' },
  'delivered': { label: 'Delivered', color: 'var(--success)', bg: 'rgba(0, 217, 166, 0.15)' },
  'cancelled': { label: 'Cancelled', color: 'var(--danger)', bg: 'rgba(255, 82, 82, 0.15)' }
};

export const formatPrice = (amount) => `₹${Number(amount).toFixed(0)}`;

export const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const formatDateTime = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', { 
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};
