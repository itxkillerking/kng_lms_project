import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GlassCard } from '../../components/common/GlassCard';
import { GlassInput } from '../../components/common/GlassInput';
import { GlassButton } from '../../components/common/GlassButton';
import { LmsBackground } from '../../components/common/LmsBackground';
import { Lock, User } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suspendedModal, setSuspendedModal] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const userData = await login(username, password);
      
      // Check for redirection URL in query params
      const searchParams = new URLSearchParams(window.location.search);
      const redirectTo = searchParams.get('redirectTo');
      
      if (redirectTo) {
        navigate(redirectTo);
        return;
      }

      // Dynamic redirection based on role
      if (userData.role === 'admin' || userData.role === 'staff') {
        navigate('/admin');
      } else if (userData.role === 'instructor') {
        navigate('/teacher');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Login error details:', err.response?.data);
      
      if (!err.response) {
        setError('Network Error: Cannot reach the server. Please check if the backend is running.');
        return;
      }

      const detail = err.response?.data?.detail;
      const code = err.response?.data?.code;
      
      if (code === 'account_suspended' || detail === 'Your account is suspended cannot login') {
          setSuspendedModal(true);
          return;
      }
      
      const nonFieldErrors = err.response?.data?.non_field_errors;
      const errorMessage = detail || (nonFieldErrors ? nonFieldErrors[0] : null) || 'Invalid credentials. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <LmsBackground />
      <GlassCard heavy style={{ maxWidth: '400px', width: '100%', position: 'relative', zIndex: 2 }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', padding: '16px', borderRadius: '50%', background: 'rgba(10, 132, 255, 0.1)', marginBottom: '16px' }}>
            <Lock size={32} color="var(--accent-blue)" />
          </div>
          <h2 style={{ fontSize: '2rem', marginBottom: '8px' }}>Welcome Back</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Sign in to continue learning</p>
        </div>

        {error && (
          <div style={{ background: 'rgba(255, 69, 58, 0.1)', border: '1px solid rgba(255, 69, 58, 0.3)', padding: '12px', borderRadius: '8px', color: 'var(--danger)', marginBottom: '20px', fontSize: '0.9rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <GlassInput 
            label="Username" 
            placeholder="Enter your username" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <GlassInput 
            label="Password" 
            type="password" 
            placeholder="Enter your password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
            <Link to="/forgot-password" style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500 }}>
              Forgot Password?
            </Link>
          </div>
          
          <GlassButton 
            type="submit" 
            variant="primary" 
            style={{ width: '100%', marginTop: '24px' }}
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </GlassButton>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Don't have an account? <Link to="/register" style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 500 }}>Create account</Link>
        </div>
      </GlassCard>

      {/* Suspension Popup Modal */}
      {suspendedModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px'
        }}>
          <GlassCard heavy style={{ maxWidth: '400px', width: '100%', textAlign: 'center', padding: '40px 32px' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(255, 69, 58, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '1px solid rgba(255, 69, 58, 0.3)' }}>
              <Lock size={36} color="#ff453a" />
            </div>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '16px', color: '#1a1a2e', letterSpacing: '-0.02em' }}>Account Suspended</h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '32px', lineHeight: 1.6, fontSize: '1.05rem' }}>
              Your account is suspended cannot login. Please contact support.
            </p>
            <GlassButton onClick={() => setSuspendedModal(false)} style={{ width: '100%', justifyContent: 'center', padding: '14px', borderRadius: '16px' }}>
              Dismiss
            </GlassButton>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default Login;
