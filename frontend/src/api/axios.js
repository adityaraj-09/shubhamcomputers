import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token from localStorage on init
const token = localStorage.getItem('sc_token');
if (token) {
  API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// Response interceptor for auth errors
API.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('sc_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default API;
