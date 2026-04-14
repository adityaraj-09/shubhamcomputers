// Light editorial palette — warm white surfaces, ink typography (no blue UI accents)
export const colors = {
  primary: '#141414',
  primaryDark: '#000000',
  primaryLight: '#404040',
  secondary: '#525252',
  accent: '#1f1f1f',
  bgDark: '#f7f7f8',
  bgCard: '#ffffff',
  bgSurface: '#efeff1',
  bgInput: '#ffffff',
  textPrimary: '#111111',
  textSecondary: '#5c5c5c',
  textMuted: '#8e8e93',
  border: '#e5e5ea',
  textOnPrimary: '#ffffff',
  success: '#14532d',
  warning: '#b45309',
  danger: '#dc2626',
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
