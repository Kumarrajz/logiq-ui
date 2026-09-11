import axios from 'axios';
import { useAuthStore } from '../store/authStore';
export const api = axios.create({ baseURL: '' });
api.interceptors.request.use((cfg) => {
  const token = useAuthStore.getState().token;
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});
