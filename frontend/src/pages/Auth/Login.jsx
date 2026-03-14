import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GlassCard } from '../../components/common/GlassCard';
import { GlassInput } from '../../components/common/GlassInput';
import { GlassButton } from '../../components/common/GlassButton';
import { Lock, User } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
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
      if (userData.role === 'admin') {
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
      const nonFieldErrors = err.response?.data?.non_field_errors;
      const errorMessage = detail || (nonFieldErrors ? nonFieldErrors[0] : null) || 'Invalid credentials. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <GlassCard heavy style={{ maxWidth: '400px', width: '100%' }}>
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
    </div>
  );
};

export default Login;
