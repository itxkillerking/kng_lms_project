import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { GlassCard } from '../../components/common/GlassCard';
import { GlassInput } from '../../components/common/GlassInput';
import { GlassButton } from '../../components/common/GlassButton';
import { Mail, ArrowLeft, Key, CheckCircle, Lock, ShieldCheck, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Timer for OTP
  const [timeLeft, setTimeLeft] = useState(180);
  const [isResendDisabled, setIsResendDisabled] = useState(true);
  
  const navigate = useNavigate();
  const inputRefs = useRef([]);

  // Timer Effect
  useEffect(() => {
    let timer;
    if (step === 2 && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft <= 0) {
      setIsResendDisabled(false);
    }
    return () => clearInterval(timer);
  }, [step, timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleRequestOTP = async (e, isResend = false) => {
    if (e) e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      await api.post('users/otp/request/', { email, purpose: 'password_reset' });
      if (isResend) {
        setSuccessMsg('A new OTP has been sent.');
        setTimeLeft(180);
        setIsResendDisabled(true);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        setStep(2);
        setTimeLeft(180);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to request OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-advance
    if (value !== '' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOTPKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOTPPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6).split('');
    const newOtp = [...otp];
    pastedData.forEach((char, i) => {
      if (!isNaN(char) && i < 6) newOtp[i] = char;
    });
    setOtp(newOtp);
    // Focus last filled
    const lastFilledIndex = Math.min(pastedData.length - 1, 5);
    inputRefs.current[lastFilledIndex]?.focus();
  };

  const handleVerifyOTP = async (e) => {
    if (e) e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) {
      setError('Please enter the 6-digit code.');
      return;
    }
    
    setError('');
    setIsLoading(true);
    
    try {
      const res = await api.post('users/otp/verify/', { 
        email, 
        code, 
        purpose: 'password_reset' 
      });
      setResetToken(res.data.reset_token);
      setSuccessMsg(''); // Clear messages for transition
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid or expired OTP code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    
    setError('');
    setIsLoading(true);
    
    try {
      await api.post('users/password/reset/', { 
        email, 
        reset_token: resetToken, 
        new_password: newPassword 
      });
      setStep(4);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', overflow: 'hidden' }}>
      <GlassCard heavy layout style={{ maxWidth: step === 4 ? '500px' : '440px', width: '100%', overflow: 'hidden' }}>
        <AnimatePresence mode="wait">
          
          {step === 1 && (
            <motion.div key="step1" variants={pageVariants} initial="initial" animate="in" exit="out" layout>
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{ display: 'inline-flex', padding: '16px', borderRadius: '50%', background: 'rgba(10, 132, 255, 0.1)', marginBottom: '16px' }}>
                  <Key size={32} color="var(--accent-blue)" />
                </div>
                <h2 style={{ fontSize: '2rem', marginBottom: '8px' }}>Reset Password</h2>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Enter your email to receive a secure OTP code
                </p>
              </div>

              {error && <ErrorAlert error={error} />}

              <form onSubmit={handleRequestOTP}>
                <GlassInput 
                  label="Email Address" 
                  type="email"
                  placeholder="name@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <GlassButton type="submit" variant="primary" style={{ width: '100%', marginTop: '24px' }} disabled={isLoading}>
                  {isLoading ? 'Sending...' : 'Send OTP Code'}
                </GlassButton>
              </form>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" variants={pageVariants} initial="initial" animate="in" exit="out" layout>
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{ display: 'inline-flex', padding: '16px', borderRadius: '50%', background: 'rgba(165, 85, 236, 0.1)', marginBottom: '16px' }}>
                  <ShieldCheck size={32} color="#A555EC" />
                </div>
                <h2 style={{ fontSize: '1.75rem', marginBottom: '8px' }}>Verify your number</h2>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Enter the 6-digit code we sent to {email}
                </p>
              </div>

              {error && <ErrorAlert error={error} />}
              {successMsg && <SuccessAlert msg={successMsg} />}

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginBottom: '24px' }}>
                {otp.map((digit, idx) => (
                  <motion.input
                    key={idx}
                    ref={(el) => (inputRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOTPChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOTPKeyDown(idx, e)}
                    onPaste={handleOTPPaste}
                    autoComplete="one-time-code"
                    style={{
                      width: '50px',
                      height: '60px',
                      fontSize: '1.5rem',
                      textAlign: 'center',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: digit ? '1px solid rgba(255,255,255,0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      color: 'white',
                      outline: 'none',
                      transition: 'all 0.2s ease',
                      boxShadow: 'none'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#A555EC';
                      e.target.style.boxShadow = '0 0 15px rgba(165, 85, 236, 0.5)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = digit ? 'rgba(255,255,255,0.4)' : 'rgba(255, 255, 255, 0.1)';
                      e.target.style.boxShadow = 'none';
                    }}
                    whileFocus={{ scale: 1.05 }}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                  />
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <span style={{ color: timeLeft > 0 ? 'var(--text-secondary)' : '#FF453A', fontSize: '0.9rem', fontWeight: 500 }}>
                  {timeLeft > 0 ? `Expires in ${formatTime(timeLeft)}` : 'Code Expired'}
                </span>
                
                <button 
                  type="button" 
                  onClick={(e) => handleRequestOTP(e, true)}
                  disabled={isResendDisabled || isLoading}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: isResendDisabled ? 'rgba(255,255,255,0.2)' : 'var(--accent-blue)',
                    cursor: isResendDisabled ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.9rem',
                    fontWeight: 500
                  }}
                >
                  <RefreshCw size={14} className={isLoading && isResendDisabled ? "spin" : ""} /> Resend
                </button>
              </div>

              <GlassButton 
                onClick={handleVerifyOTP} 
                variant="primary" 
                style={{ width: '100%' }} 
                disabled={isLoading || otp.join('').length < 6 || timeLeft <= 0}
              >
                {isLoading ? 'Verifying...' : 'Verify Code'}
              </GlassButton>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" variants={pageVariants} initial="initial" animate="in" exit="out" layout>
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{ display: 'inline-flex', padding: '16px', borderRadius: '50%', background: 'rgba(48, 209, 88, 0.1)', marginBottom: '16px' }}>
                  <Lock size={32} color="#30D158" />
                </div>
                <h2 style={{ fontSize: '2rem', marginBottom: '8px' }}>Create New Password</h2>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Your identity has been verified.
                </p>
              </div>

              {error && <ErrorAlert error={error} />}

              <form onSubmit={handleResetPassword}>
                <GlassInput 
                  label="New Password" 
                  type="password"
                  placeholder="Enter new password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <div style={{ marginTop: '16px' }}>
                  <GlassInput 
                    label="Confirm Password" 
                    type="password"
                    placeholder="Confirm new password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                
                <GlassButton type="submit" variant="primary" style={{ width: '100%', marginTop: '32px' }} disabled={isLoading}>
                  {isLoading ? 'Resetting...' : 'Reset Password'}
                </GlassButton>
              </form>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div 
              key="step4" 
              layout
              initial={{ scale: 0.9, opacity: 0, borderRadius: '24px' }}
              animate={{ scale: 1, opacity: 1, backgroundColor: 'rgba(48, 209, 88, 0.15)', borderColor: 'rgba(48, 209, 88, 0.3)', borderRadius: '100px' }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              style={{ textAlign: 'center', padding: '20px 0' }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}
              >
                <CheckCircle size={48} color="#30D158" />
              </motion.div>
              <motion.h2 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                style={{ fontSize: '1.5rem', marginBottom: '8px', color: '#f8fafc' }}
              >
                Password Reset Successfully
              </motion.h2>
              <motion.p 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}
              >
                Redirecting you to login...
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        {step < 4 && (
          <motion.div layout style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem' }}>
            <Link to="/login" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <ArrowLeft size={16} /> Back to Login
            </Link>
          </motion.div>
        )}
      </GlassCard>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

const ErrorAlert = ({ error }) => (
  <motion.div 
    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
    style={{ background: 'rgba(255, 69, 58, 0.1)', border: '1px solid rgba(255, 69, 58, 0.3)', padding: '12px', borderRadius: '8px', color: 'var(--danger)', marginBottom: '20px', fontSize: '0.9rem', textAlign: 'center' }}
  >
    {error}
  </motion.div>
);

const SuccessAlert = ({ msg }) => (
  <motion.div 
    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
    style={{ background: 'rgba(48, 209, 88, 0.1)', border: '1px solid rgba(48, 209, 88, 0.3)', padding: '12px', borderRadius: '8px', color: '#30D158', marginBottom: '20px', fontSize: '0.9rem', textAlign: 'center' }}
  >
    {msg}
  </motion.div>
);

export default ForgotPassword;
