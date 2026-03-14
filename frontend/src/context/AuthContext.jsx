import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      if (localStorage.getItem('access_token')) {
        try {
          const response = await api.get('users/me/');
          setUser(response.data);
        } catch (error) {
          console.error('Failed to fetch user:', error);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
      }
      setLoading(false);
    };
    checkUser();
  }, []);

  const login = async (username, password) => {
    const response = await api.post('users/login/', { username, password });
    localStorage.setItem('access_token', response.data.access);
    localStorage.setItem('refresh_token', response.data.refresh);
    
    // Fetch user details immediately after tokens
    const userRes = await api.get('users/me/');
    setUser(userRes.data);
    return userRes.data;
  };

  const register = async (userData) => {
    await api.post('users/register/', userData);
    // Auto login after register
    return login(userData.username, userData.password);
  };

  const logout = async () => {
    try {
      await api.post('users/logout/');
    } catch (error) {
      console.error('Logout log failed:', error);
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    sessionStorage.removeItem('kls_splash_shown');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
