import axios from 'axios';
import config from '../config/config';

// Base Axios instance
const api = axios.create({
  baseURL: config.API_BASE_URL,
  timeout: config.API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      if (config.headers && config.headers.set) {
        config.headers.set('Authorization', `Bearer ${token}`);
      } else {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 Unauthorized globally
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      if (originalRequest.url === '/users/login/refresh/') {
        // Refresh failed, clear session
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('jwt_refresh');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('jwt_refresh');
      
      if (refreshToken) {
        try {
          const res = await axios.post(`${config.API_BASE_URL}/users/login/refresh/`, { refresh: refreshToken });
          if (res.data.access) {
            localStorage.setItem('jwt_token', res.data.access);
            if (originalRequest.headers && originalRequest.headers.set) {
              originalRequest.headers.set('Authorization', `Bearer ${res.data.access}`);
            } else {
              originalRequest.headers['Authorization'] = `Bearer ${res.data.access}`;
            }
            return api(originalRequest);
          }
        } catch (refreshError) {
          localStorage.removeItem('jwt_token');
          localStorage.removeItem('jwt_refresh');
          localStorage.removeItem('user');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
      } else {
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('jwt_refresh');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
