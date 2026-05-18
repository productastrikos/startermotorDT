import axios from 'axios';

const browserOrigin = typeof window !== 'undefined' ? window.location.origin : '';
const isLocalOrigin = /localhost|127\.0\.0\.1/.test(browserOrigin);
const localApiBase = typeof window !== 'undefined'
  ? `${window.location.protocol}//${window.location.hostname}:5000/api`
  : 'http://localhost:5000/api';
const productionApiBase = browserOrigin ? `${browserOrigin}/api` : 'http://localhost:5000/api';
const API_BASE = isLocalOrigin ? localApiBase : productionApiBase;

const api = axios.create({ baseURL: API_BASE, timeout: 15000 });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cwm_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('cwm_token');
      localStorage.removeItem('cwm_user');
      window.dispatchEvent(new CustomEvent('cwm:unauthorized'));
    }
    return Promise.reject(error);
  }
);

export const login = (username: string, password: string) => {
  // Mock bypass — no backend needed for development
  if (username === 'admin' && password === 'admin123') {
    return Promise.resolve({
      data: {
        token: 'mock-token',
        user: { name: 'Admin User', username: 'admin', role: 'Operations Engineer', email: 'admin@gtsu.aero' },
      },
    });
  }
  return Promise.reject({ response: { data: { message: 'Invalid credentials. Use: admin / admin123' } } });
};
export const getMe = () => api.get('/auth/me');
export const getDashboard = () => api.get('/dashboard');
export const getVehicles = (params?: object) => api.get('/vehicles', { params });
export const dispatchVehicle = (vehicleId: string, zone: string) => api.post(`/vehicles/${vehicleId}/dispatch`, { zone });
export const getBins = (params?: object) => api.get('/bins', { params });
export const getAlerts = (params?: object) => api.get('/alerts', { params });
export const acknowledgeAlert = (alertId: string) => api.put(`/alerts/${alertId}/acknowledge`);
export const getAdvisories = () => api.get('/advisories');
export const acknowledgeAdvisory = (id: string) => api.put(`/advisories/${id}/acknowledge`);
export const getWeather = () => api.get('/weather');
export const getZones = () => api.get('/zones');

export default api;
