import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

function urlB64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

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

  // Web Push Subscription Logic (OPTIONAL feature)
  useEffect(() => {
    if (user && 'serviceWorker' in navigator && 'PushManager' in window) {
      const subscribeUser = async () => {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') return;

            const existingSubscription = await registration.pushManager.getSubscription();
            if (existingSubscription) {
                return existingSubscription;
            }

            const applicationServerKey = urlB64ToUint8Array('BClYLJkYNMyR0KX6M_BkYLn8TItE4L2xOHplvjpRyTrnWeCb-Oc5FzfjjKCIwuB_n5fIwuXd8IaxWhMgOV0FddQ');
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: applicationServerKey
            });
            
            await sendSubscriptionToBackend(subscription);
        } catch (error) {
            console.warn('Push subscription failed (non-critical):', error);
        }
      };

      const sendSubscriptionToBackend = async (subscription) => {
        try {
            const subJSON = subscription.toJSON();
            await api.post('chat/push/subscribe/', {
                endpoint: subJSON.endpoint,
                p256dh: subJSON.keys.p256dh,
                auth: subJSON.keys.auth
            });
        } catch (error) {
            console.warn('Backend push sub failed (non-critical):', error);
        }
      };

      subscribeUser();
    }
  }, [user]);

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
