import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      const role = user.role || '';
      if (['instructor', 'admin', 'staff'].includes(role)) {
        navigate('/instructor/exams', { replace: true });
      } else if (role === 'student') {
        navigate('/student/exams', { replace: true });
      } else {
        // Fallback for unknown roles to prevent redirect loops
        navigate('/403', { replace: true });
      }
    } else if (!loading && !user) {
      navigate('/login', { replace: true });
    }
  }, [user, loading, navigate]);

  return <div>Redirecting to your dashboard...</div>;
};
