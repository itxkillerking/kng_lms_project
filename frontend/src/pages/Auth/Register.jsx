import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GlassCard } from '../../components/common/GlassCard';
import { GlassInput } from '../../components/common/GlassInput';
import { GlassButton } from '../../components/common/GlassButton';
import { UserPlus } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      await register(formData);
      navigate('/dashboard');
    } catch (err) {
      if (err.response?.data) {
        // Simple error parsing for DRF responses
        const errors = Object.values(err.response.data).map(e => Array.isArray(e) ? e[0] : e);
        setError(errors.join(' '));
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <GlassCard heavy style={{ maxWidth: '450px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', padding: '16px', borderRadius: '50%', background: 'rgba(191, 90, 242, 0.1)', marginBottom: '16px' }}>
            <UserPlus size={32} color="var(--accent-purple)" />
          </div>
          <h2 style={{ fontSize: '2rem', marginBottom: '8px' }}>Create Account</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Join KLS Tech Campus today</p>
        </div>

        {error && (
          <div style={{ background: 'rgba(255, 69, 58, 0.1)', border: '1px solid rgba(255, 69, 58, 0.3)', padding: '12px', borderRadius: '8px', color: 'var(--danger)', marginBottom: '20px', fontSize: '0.9rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <GlassInput 
              label="First Name" 
              name="first_name"
              placeholder="John" 
              value={formData.first_name}
              onChange={handleChange}
            />
            <GlassInput 
              label="Last Name" 
              name="last_name"
              placeholder="Doe" 
              value={formData.last_name}
              onChange={handleChange}
            />
          </div>

          <GlassInput 
            label="Username" 
            name="username"
            placeholder="Choose a username" 
            value={formData.username}
            onChange={handleChange}
            required
          />
          <GlassInput 
            label="Email" 
            name="email"
            type="email"
            placeholder="your@email.com" 
            value={formData.email}
            onChange={handleChange}
            required
          />
          <GlassInput 
            label="Password" 
            name="password"
            type="password" 
            placeholder="Create a password" 
            value={formData.password}
            onChange={handleChange}
            required
          />
          
          <GlassButton 
            type="submit" 
            variant="primary" 
            style={{ width: '100%', marginTop: '24px', background: 'linear-gradient(135deg, var(--accent-purple) 0%, #8E24AA 100%)', boxShadow: '0 4px 15px rgba(191, 90, 242, 0.4)' }}
            disabled={isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </GlassButton>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--accent-purple)', textDecoration: 'none', fontWeight: 500 }}>Sign in here</Link>
        </div>
      </GlassCard>
    </div>
  );
};

export default Register;
