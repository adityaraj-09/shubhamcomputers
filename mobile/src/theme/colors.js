// Purple & gold palette — vibrant violet primary, warm gold accents
export const colors = {
  primary: '#6C47FF',
  primaryDark: '#4B2ECC',
  primaryLight: '#8b6bff',
  secondary: '#9B8FCC',
  accent: '#FFB800',
  bgDark: '#F0ECFF',
  bgCard: '#FFFFFF',
  bgSurface: '#EDE9FF',
  bgInput: '#FFFFFF',
  textPrimary: '#1A1040',
  textSecondary: '#5A4D8A',
  textMuted: '#9B8FCC',
  border: '#E4DEFF',
  textOnPrimary: '#FFFFFF',
  success: '#16A34A',
  warning: '#D97706',
  danger: '#DC2626',
};

export const radius = { sm: 10, md: 14, lg: 20 };
export const spacing = { page: 16, bottomInset: 100 };

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  fab: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 8,
  },
};

export const typography = {
  h1: { fontSize: 24, fontWeight: '800', lineHeight: 32 },
  h2: { fontSize: 20, fontWeight: '800', lineHeight: 28 },
  h3: { fontSize: 18, fontWeight: '700', lineHeight: 24 },
  body: { fontSize: 15, fontWeight: '400', lineHeight: 22 },
  caption: { fontSize: 13, fontWeight: '600', lineHeight: 18 },
  small: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
};
