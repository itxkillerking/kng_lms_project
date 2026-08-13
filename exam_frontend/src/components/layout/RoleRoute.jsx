import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export const RoleRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  }

  // Fallback if context user is null but local storage has user (fixes login race condition)
  const fallbackUserStr = localStorage.getItem('user');
  let activeUser = user;
  if (!activeUser && fallbackUserStr) {
      try {
          activeUser = JSON.parse(fallbackUserStr);
      } catch(e) {}
  }

  if (!activeUser || !allowedRoles.includes(activeUser.role)) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
};
