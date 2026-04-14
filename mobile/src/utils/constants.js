export const STORE_LOCATION = {
  lat: 28.605441032453836,
  lng: 76.65319837711422,
};

export const SERVICE_RADIUS_KM = 3;
export const DELIVERY_TIME_MINS = 30;
export const MIN_WALLET_TOPUP = 50;
export const MAX_WALLET_TOPUP = 10000;

export const ORDER_STATUS_MAP = {
  placed: { label: 'Placed', color: '#3f3f46', bg: 'rgba(63, 63, 70, 0.1)' },
  confirmed: { label: 'Confirmed', color: '#b45309', bg: 'rgba(180, 83, 9, 0.12)' },
  processing: { label: 'Processing', color: '#b45309', bg: 'rgba(180, 83, 9, 0.12)' },
  'out-for-delivery': { label: 'Out for Delivery', color: '#525252', bg: 'rgba(82, 82, 82, 0.1)' },
  delivered: { label: 'Delivered', color: '#14532d', bg: 'rgba(20, 83, 45, 0.12)' },
  cancelled: { label: 'Cancelled', color: '#dc2626', bg: 'rgba(220, 38, 38, 0.12)' },
};

export const formatPrice = (amount) => `₹${Number(amount).toFixed(0)}`;

export const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const formatDateTime = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const TOKEN_KEY = 'sc_token';
