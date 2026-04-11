import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../api/axios';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('sc_token');
    if (token) {
      fetchUser(token);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async (token) => {
    try {
      API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const { data } = await API.get('/auth/me');
      setUser(data.user);
    } catch (error) {
      // Only clear token on 401 (invalid/expired token) — not on 429, network errors, etc.
      if (error.response?.status === 401) {
        localStorage.removeItem('sc_token');
        delete API.defaults.headers.common['Authorization'];
      }
    } finally {
      setLoading(false);
    }
  };

  const login = (token, userData) => {
    localStorage.setItem('sc_token', token);
    API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('sc_token');
    delete API.defaults.headers.common['Authorization'];
    setUser(null);
    setCart([]);
  };

  const updateUser = (userData) => {
    setUser(prev => ({ ...prev, ...userData }));
  };

  // Cart functions
  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id && i.type === item.type);
      if (existing) {
        return prev.map(i => 
          i.id === item.id && i.type === item.type 
            ? { ...i, quantity: i.quantity + 1 } 
            : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (id, type) => {
    setCart(prev => prev.filter(i => !(i.id === id && i.type === type)));
  };

  const updateCartQuantity = (id, type, quantity) => {
    if (quantity <= 0) {
      removeFromCart(id, type);
      return;
    }
    setCart(prev => prev.map(i => 
      i.id === id && i.type === type ? { ...i, quantity } : i
    ));
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <AuthContext.Provider value={{
      user, loading, login, logout, updateUser,
      cart, addToCart, removeFromCart, updateCartQuantity, clearCart, cartTotal, cartCount
    }}>
      {children}
    </AuthContext.Provider>
  );
};
