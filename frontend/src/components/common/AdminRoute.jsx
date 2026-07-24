import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const AdminRoute = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return <div style={{ color: '#1a1a2e', padding: '40px', textAlign: 'center' }}>Verifying Authorization...</div>;
    }

    return user && user.role === 'admin' ? <Outlet /> : <Navigate to="/dashboard" replace />;
};
