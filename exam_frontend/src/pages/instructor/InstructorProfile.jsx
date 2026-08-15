import React, { useContext } from 'react';
import { Card, Button } from '../../components/common/UIComponents';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import config from '../../config/config';

export const InstructorProfile = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const rawBase = config.API_BASE_URL.replace(/\/api\/?$/, '');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)' }}>
        <h2>Instructor Profile</h2>
      </div>

      <Card style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', padding: 'var(--spacing-8)' }}>
        <div style={{ 
          width: '100px', 
          height: '100px', 
          borderRadius: '50%', 
          background: 'var(--glass-strong-bg)', 
          border: 'var(--glass-strong-border)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          margin: '0 auto var(--spacing-4)',
          fontSize: '2.5rem',
          color: 'var(--color-primary)'
        }}>
          {user?.username ? user.username.charAt(0).toUpperCase() : 'I'}
        </div>
        <h3 style={{ marginBottom: 'var(--spacing-2)' }}>{user?.first_name || user?.username} {user?.last_name || ''}</h3>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-6)' }}>{user?.email || 'No email provided'}</p>
        
        {user?.instructor_title && (
          <p style={{ fontWeight: 'bold', color: 'var(--color-primary)', marginBottom: 'var(--spacing-6)', padding: '0 var(--spacing-4)' }}>
            {user.instructor_title}
          </p>
        )}

        <div style={{ padding: 'var(--spacing-4)', background: 'var(--glass-light-bg)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--spacing-6)', textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-2)' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Role</span>
            <span style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>{user?.role}</span>
          </div>
          {user?.phone_number && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-2)' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Phone</span>
              <span style={{ fontWeight: 'bold' }}>{user.phone_number}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-2)' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Status</span>
            <span style={{ fontWeight: 'bold', textTransform: 'capitalize', color: 'var(--color-success)' }}>{user?.account_status || 'Active'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Joined</span>
            <span style={{ fontWeight: 'bold' }}>{user?.joined_at ? new Date(user.joined_at).toLocaleDateString() : 'N/A'}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--spacing-4)', justifyContent: 'center' }}>
          <Button variant="secondary" onClick={() => window.location.href = `${config.LMS_BASE_URL}/profile`}>
            Edit Profile in LMS
          </Button>
          <Button variant="danger" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </Card>
    </div>
  );
};
