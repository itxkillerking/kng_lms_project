import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (user.role === 'instructor' || user.role === 'admin') {
        navigate('/instructor/exams', { replace: true });
      } else {
        navigate('/student/exams', { replace: true });
      }
    }
  }, [user, navigate]);

  return <div>Redirecting to your dashboard...</div>;
};
