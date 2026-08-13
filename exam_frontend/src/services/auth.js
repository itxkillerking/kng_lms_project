import api from './api';

export const authService = {
  login: async (username, password) => {
    const response = await api.post('/users/login/', { username, password });
    if (response.data.access) {
      localStorage.setItem('jwt_token', response.data.access);
      localStorage.setItem('jwt_refresh', response.data.refresh);
      // Fetch user profile
      const userResponse = await api.get('/users/me/');
      localStorage.setItem('user', JSON.stringify(userResponse.data));
      return userResponse.data;
    }
    return null;
  },
  
  logout: () => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('jwt_refresh');
    localStorage.removeItem('user');
  },
  
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (userStr) return JSON.parse(userStr);
    return null;
  },
  
  isAuthenticated: () => {
    return !!localStorage.getItem('jwt_token');
  }
};
