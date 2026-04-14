import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API, { loadTokenIntoAxios, setOnAuthFailure } from '../api/client';
import { TOKEN_KEY } from '../utils/constants';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);

  useEffect(() => {
    setOnAuthFailure(() => {
      setUser(null);
      setCart([]);
    });
    return () => setOnAuthFailure(() => {});
  }, []);

  const fetchUser = useCallback(async (token) => {
    try {
      API.defaults.headers.common.Authorization = `Bearer ${token}`;
      const { data } = await API.get('/auth/me');
      setUser(data.user);
    } catch (error) {
      if (error.response?.status === 401) {
        await AsyncStorage.removeItem(TOKEN_KEY);
        delete API.defaults.headers.common.Authorization;
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await loadTokenIntoAxios();
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (token) {
        await fetchUser(token);
      } else {
        setLoading(false);
      }
    })();
  }, [fetchUser]);

  const login = async (token, userData) => {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    API.defaults.headers.common.Authorization = `Bearer ${token}`;
    setUser(userData);
  };

  const logout = async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    delete API.defaults.headers.common.Authorization;
    setUser(null);
    setCart([]);
  };

  const updateUser = (userData) => {
    setUser((prev) => (prev ? { ...prev, ...userData } : prev));
  };

  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id && i.type === item.type);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id && i.type === item.type
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { ...item, quantity: item.quantity ?? 1 }];
    });
  };

  const removeFromCart = (id, type) => {
    setCart((prev) => prev.filter((i) => !(i.id === id && i.type === type)));
  };

  const updateCartQuantity = (id, type, quantity) => {
    if (quantity <= 0) {
      removeFromCart(id, type);
      return;
    }
    setCart((prev) =>
      prev.map((i) => (i.id === id && i.type === type ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        updateUser,
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartTotal,
        cartCount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
