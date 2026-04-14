/** Expo Router hrefs — keep in sync with `app/(tabs)/` file structure */

export const href = {
  home: '/(tabs)/home',
  orders: '/(tabs)/orders',
  profile: '/(tabs)/profile',
  admin: '/(tabs)/admin',
  wallet: '/(tabs)/home/wallet',
  checkout: '/(tabs)/home/checkout',
  printStore: '/(tabs)/home/print-store',
  passportPhotos: '/(tabs)/home/passport-photos',
  onDemandPrint: '/(tabs)/home/on-demand-print',
  printService: (id) => `/(tabs)/home/print-service/${encodeURIComponent(String(id))}`,
  product: (id) => `/(tabs)/home/product/${encodeURIComponent(String(id))}`,
  martCategory: (categoryId) =>
    `/(tabs)/home/mart-category/${encodeURIComponent(String(categoryId))}`,
  adminScreens: {
    manageOrders: '/(tabs)/admin/manage-orders',
    manageProducts: '/(tabs)/admin/manage-products',
    manageUsers: '/(tabs)/admin/manage-users',
    addProduct: '/(tabs)/admin/add-product',
  },
};
