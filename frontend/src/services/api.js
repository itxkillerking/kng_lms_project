import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/api/`;

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== 'users/login/') {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const res = await axios.post(`${API_URL}users/login/refresh/`, { refresh: refreshToken });
        localStorage.setItem('access_token', res.data.access);
        api.defaults.headers.common['Authorization'] = `Bearer ${res.data.access}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
