import axios from 'axios';
import { Storage, StorageKeys } from '../utils/storage';

const BACKEND_URL = 'http://192.168.14.111:5000';
console.log('Using backend URL:', BACKEND_URL);

export const API_ROUTES = {
  base: __DEV__ ? BACKEND_URL : 'https://your-production-url.com',
  auth: '/api/auth',
  users: '/api/users',
  services: '/api/services'
};

export const api = axios.create({
  baseURL: API_ROUTES.base,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

api.interceptors.request.use(
  async (config) => {
    const token = await Storage.getItem(StorageKeys.USER_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);