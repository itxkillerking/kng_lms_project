import React from 'react';
import { Card, Button } from '../../components/common/UIComponents';
import { useNavigate } from 'react-router-dom';

const ErrorPage = ({ code, title, message }) => {
  const navigate = useNavigate();
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: 'var(--color-bg-main)' }}>
      <Card style={{ textAlign: 'center', maxWidth: '400px' }}>
        <h1 style={{ fontSize: '4rem', color: 'var(--color-primary)' }}>{code}</h1>
        <h2>{title}</h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-6)' }}>{message}</p>
        <Button onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
      </Card>
    </div>
  );
};

export const Error403 = () => {
  const userStr = localStorage.getItem('user');
  let role = 'Unknown';
  try {
    if (userStr) {
      const user = JSON.parse(userStr);
      role = user.role || 'undefined';
    }
  } catch (e) {}

  return <ErrorPage code="403" title="Access Denied" message={`You don't have permission to view this page. (Debug Role: ${role})`} />;
};
export const Error404 = () => <ErrorPage code="404" title="Page Not Found" message="The page you're looking for doesn't exist or has been moved." />;
export const Error500 = () => <ErrorPage code="500" title="Server Error" message="Something went wrong on our end. Please try again later." />;
