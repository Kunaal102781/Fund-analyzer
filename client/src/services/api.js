// client/src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const analyzeFinance = async (data) => {
  const response = await api.post('/finance/analyze', data);
  return response.data;
};

export const getFinancialHistory = async () => {
  const response = await api.get('/finance/history');
  return response.data;
};