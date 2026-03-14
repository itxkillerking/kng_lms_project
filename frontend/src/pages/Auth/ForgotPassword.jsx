import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { GlassCard } from '../../components/common/GlassCard';
import { GlassInput } from '../../components/common/GlassInput';
import { GlassButton } from '../../components/common/GlassButton';
import { Mail, ArrowLeft, Key } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1); // 1: Request OTP, 2: Verify & Reset
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      await api.post('users/otp/request/', { email });
      setStep(2);
      setSuccess('If an account exists, an OTP has been sent to your email.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to request OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      await api.post('users/otp/verify/', { 
        email, 
        code: otp, 
        new_password: newPassword 
      });
      setSuccess('Password reset successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP or expired. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <GlassCard heavy style={{ maxWidth: '440px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', padding: '16px', borderRadius: '50%', background: 'rgba(10, 132, 255, 0.1)', marginBottom: '16px' }}>
            <Key size={32} color="var(--accent-blue)" />
          </div>
          <h2 style={{ fontSize: '2rem', marginBottom: '8px' }}>Reset Password</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            {step === 1 ? "Enter your email to receive an OTP code" : "Enter the OTP code and your new password"}
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(255, 69, 58, 0.1)', border: '1px solid rgba(255, 69, 58, 0.3)', padding: '12px', borderRadius: '8px', color: 'var(--danger)', marginBottom: '20px', fontSize: '0.9rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ background: 'rgba(48, 209, 88, 0.1)', border: '1px solid rgba(48, 209, 88, 0.3)', padding: '12px', borderRadius: '8px', color: '#30D158', marginBottom: '20px', fontSize: '0.9rem', textAlign: 'center' }}>
            {success}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleRequestOTP}>
            <GlassInput 
              label="Email Address" 
              type="email"
              placeholder="name@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            
            <GlassButton 
              type="submit" 
              variant="primary" 
              style={{ width: '100%', marginTop: '24px' }}
              disabled={isLoading}
            >
              {isLoading ? 'Sending OTP...' : 'Send OTP Code'}
            </GlassButton>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP}>
            <GlassInput 
              label="OTP Code" 
              placeholder="Enter 6-digit code" 
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />
            <GlassInput 
              label="New Password" 
              type="password"
              placeholder="Enter new password" 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            
            <GlassButton 
              type="submit" 
              variant="primary" 
              style={{ width: '100%', marginTop: '24px' }}
              disabled={isLoading}
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </GlassButton>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem' }}>
          <Link to="/login" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <ArrowLeft size={16} /> Back to Login
          </Link>
        </div>
      </GlassCard>
    </div>
  );
};

export default ForgotPassword;
