import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TOKEN_KEY } from '../utils/constants';

export const getBaseURL = () =>
  process.env.EXPO_PUBLIC_API_URL || 'https://heidy-condensible-jadiel.ngrok-free.dev/api';

/** Static assets served from same host as API (strip trailing /api). */
export const getApiOrigin = () => getBaseURL().replace(/\/api\/?$/, '');

let onAuthFailure = () => {};

export function setOnAuthFailure(fn) {
  onAuthFailure = fn;
}

const API = axios.create({
  baseURL: getBaseURL(),
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const url = error.config?.url || '';
    if (error.response?.status === 401 && url.includes('/auth/me')) {
      await AsyncStorage.removeItem(TOKEN_KEY);
      delete API.defaults.headers.common.Authorization;
      onAuthFailure();
    }
    return Promise.reject(error);
  }
);

export async function loadTokenIntoAxios() {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (token) {
    API.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete API.defaults.headers.common.Authorization;
  }
}

export default API;
