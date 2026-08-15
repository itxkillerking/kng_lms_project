import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { GlassInput } from '../../components/common/GlassInput';
import { GlassButton } from '../../components/common/GlassButton';
import { LmsBackground } from '../../components/common/LmsBackground';
import { Mail, ArrowLeft, Key, CheckCircle, Lock, ShieldCheck, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  
  // OTP State - 6 chars
  const [otp, setOtp] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const hiddenInputRef = useRef(null);
  const [isCollapsing, setIsCollapsing] = useState(false);

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
  const prefersReducedMotion = useReducedMotion();

  // Timer Effect
  useEffect(() => {
    let timer;
    if (step === 2 && timeLeft > 0 && !isCollapsing) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft <= 0) {
      setIsResendDisabled(false);
    }
    return () => clearInterval(timer);
  }, [step, timeLeft, isCollapsing]);

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
      if (import.meta.env.DEV) {
        console.warn("⚠️ [DEV MODE] Bypassing real OTP request. Use OTP: 888888");
        await new Promise(resolve => setTimeout(resolve, 600)); // Simulate network
      } else {
        await api.post('users/otp/request/', { email, purpose: 'password_reset' });
      }

      if (isResend) {
        setSuccessMsg(import.meta.env.DEV ? 'Test OTP sent (use 888888).' : 'A new OTP has been sent.');
        setTimeLeft(180);
        setIsResendDisabled(true);
        setOtp('');
        hiddenInputRef.current?.focus();
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

  const handleVerifyOTP = async (e) => {
    if (e) e.preventDefault();
    if (otp.length < 6) {
      setError('Please enter the 6-digit code.');
      return;
    }
    
    setError('');
    setIsLoading(true);
    
    try {
      if (import.meta.env.DEV && otp === '888888') {
        console.warn("⚠️ [DEV MODE] Bypassing real OTP verification.");
        await new Promise(resolve => setTimeout(resolve, 600));
        setResetToken('dev_test_token_12345');
      } else {
        const res = await api.post('users/otp/verify/', { 
          email, 
          code: otp, 
          purpose: 'password_reset' 
        });
        setResetToken(res.data.reset_token);
      }
      
      setSuccessMsg(''); // Clear messages for transition
      
      if (!prefersReducedMotion) {
        setIsCollapsing(true);
        setTimeout(() => {
          setStep(3);
          setIsCollapsing(false);
        }, 800); // 800ms allows the inward collapse to complete
      } else {
        setStep(3);
      }

    } catch (err) {
      setError(err.response?.data?.error || 'Invalid or expired OTP code.');
      setOtp(''); // clear on failure
    } finally {
      setIsLoading(false);
    }
  };

  // Auto verify when 6 digits entered
  useEffect(() => {
    if (otp.length === 6 && step === 2 && !isLoading && !isCollapsing) {
      handleVerifyOTP();
    }
  }, [otp]);

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
      if (import.meta.env.DEV && resetToken === 'dev_test_token_12345') {
        console.warn("⚠️ [DEV MODE] Bypassing real password reset.");
        await new Promise(resolve => setTimeout(resolve, 800));
      } else {
        await api.post('users/password/reset/', { 
          email, 
          reset_token: resetToken, 
          new_password: newPassword 
        });
      }
      setStep(4);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  const pageVariants = {
    initial: { opacity: 0, y: 15 },
    in: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
    out: { opacity: 0, y: -15, transition: { duration: 0.3, ease: 'easeIn' } }
  };

  // Calculate horizontal inward collapse offsets for 6 cells
  const getCollapseOffset = (index) => {
    const offsets = [145, 87, 29, -29, -87, -145];
    return offsets[index] || 0;
  };
  const getCollapseDelay = (index) => {
    const delays = [0, 0.1, 0.15, 0.15, 0.1, 0];
    return delays[index] || 0;
  };

  return (
    <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', overflow: 'hidden' }}>
      <LmsBackground />
      <motion.div 
        layout 
        className="glass-panel-heavy glass-card" 
        style={{ 
          maxWidth: step === 4 ? '500px' : '440px', 
          width: '100%', 
          overflow: 'hidden',
          padding: '32px',
          position: 'relative',
          zIndex: 2,
          color: 'var(--text-primary)'
        }}
      >
        <AnimatePresence mode="wait">
          
          {step === 1 && (
            <motion.div key="step1" variants={pageVariants} initial="initial" animate="in" exit="out" layout>
              <motion.div layoutId="headerText" style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{ display: 'inline-flex', padding: '16px', borderRadius: '50%', background: 'rgba(10, 132, 255, 0.1)', marginBottom: '16px' }}>
                  <Key size={32} color="var(--accent-blue)" />
                </div>
                <h2 style={{ fontSize: '2rem', marginBottom: '8px', color: 'var(--text-primary)' }}>Reset Password</h2>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Enter your email to receive a secure OTP code
                </p>
              </motion.div>

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
              <motion.div layoutId="headerText" style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{ display: 'inline-flex', padding: '16px', borderRadius: '50%', background: 'rgba(191, 90, 242, 0.1)', marginBottom: '16px' }}>
                  <ShieldCheck size={32} color="var(--accent-purple)" />
                </div>
                <h2 style={{ fontSize: '1.75rem', marginBottom: '8px', color: 'var(--text-primary)' }}>Verify your number</h2>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Enter the 6-digit code we sent to {email}
                </p>
              </motion.div>

              {error && <ErrorAlert error={error} />}
              {successMsg && <SuccessAlert msg={successMsg} />}

              <div style={{ position: 'relative', width: '340px', margin: '0 auto 24px', cursor: 'text' }} onClick={() => hiddenInputRef.current?.focus()}>
                <input
                  ref={hiddenInputRef}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  disabled={isCollapsing || isLoading}
                  style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    opacity: 0, zIndex: 10, cursor: 'text'
                  }}
                />
                
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  {[0,1,2,3,4,5].map(i => {
                     // Active if it's the current digit to be typed, OR if full and it's the last one
                     const isActive = isFocused && !isCollapsing && (otp.length === i || (otp.length === 6 && i === 5));
                     const digit = otp[i] || '';
                     
                     return (
                        <motion.div
                           key={i}
                           animate={isCollapsing && !prefersReducedMotion ? {
                              x: getCollapseOffset(i),
                              scale: 0.3,
                              opacity: 0,
                              borderRadius: '24px'
                           } : { x: 0, scale: 1, opacity: 1, borderRadius: '12px' }}
                           transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1], delay: isCollapsing ? getCollapseDelay(i) : 0 }}
                           style={{
                              width: '50px',
                              height: '60px',
                              position: 'relative',
                              background: 'rgba(0, 0, 0, 0.02)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '1px solid rgba(0, 0, 0, 0.08)',
                              overflow: 'visible'
                           }}
                        >
                           {/* Animated Gliding SVG Border */}
                           {isActive && !prefersReducedMotion && (
                             <motion.svg
                               layoutId="activeGlow"
                               style={{ position: 'absolute', inset: -1, width: 'calc(100% + 2px)', height: 'calc(100% + 2px)', pointerEvents: 'none', zIndex: 2 }}
                               initial={{ opacity: 0 }}
                               animate={{ opacity: 1 }}
                               exit={{ opacity: 0 }}
                               transition={{ type: 'tween', ease: 'easeOut', duration: 0.4 }}
                             >
                               <rect 
                                  width="100%" height="100%" rx="12" 
                                  fill="rgba(191, 90, 242, 0.05)" 
                               />
                               <motion.rect 
                                  width="100%" height="100%" rx="12" 
                                  fill="none" 
                                  stroke="var(--accent-purple)" 
                                  strokeWidth="2"
                                  strokeDasharray="0.15 1"
                                  pathLength="1"
                                  animate={{ strokeDashoffset: [0, -1] }}
                                  transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                               />
                             </motion.svg>
                           )}

                           {/* Fallback border for reduced motion */}
                           {isActive && prefersReducedMotion && (
                              <div style={{ position: 'absolute', inset: 0, border: '2px solid var(--accent-purple)', borderRadius: '12px' }} />
                           )}

                           {/* Digit pop-in animation */}
                           <AnimatePresence mode="popLayout">
                              {digit && (
                                 <motion.span
                                    key={digit + i}
                                    initial={{ y: 8, opacity: 0, scale: 0.8 }}
                                    animate={{ y: 0, opacity: 1, scale: 1 }}
                                    exit={{ y: -8, opacity: 0, scale: 0.8 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                    style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', zIndex: 3 }}
                                 >
                                    {digit}
                                 </motion.span>
                              )}
                           </AnimatePresence>
                        </motion.div>
                     )
                  })}
                </div>
              </div>

              <motion.div animate={{ opacity: isCollapsing ? 0 : 1 }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <span style={{ color: timeLeft > 0 ? 'var(--text-secondary)' : 'var(--error-color)', fontSize: '0.9rem', fontWeight: 500 }}>
                  {timeLeft > 0 ? `Expires in ${formatTime(timeLeft)}` : 'Code Expired'}
                </span>
                
                <button 
                  type="button" 
                  onClick={(e) => handleRequestOTP(e, true)}
                  disabled={isResendDisabled || isLoading || isCollapsing}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: isResendDisabled ? 'var(--text-secondary)' : 'var(--accent-blue)',
                    cursor: isResendDisabled ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    opacity: isResendDisabled ? 0.5 : 1
                  }}
                >
                  <RefreshCw size={14} className={isLoading && isResendDisabled ? "spin" : ""} /> Resend
                </button>
              </motion.div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" variants={pageVariants} initial="initial" animate="in" exit="out" layout>
              <motion.div layoutId="headerText" style={{ textAlign: 'center', marginBottom: '32px' }}>
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }} style={{ display: 'inline-flex', padding: '16px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', marginBottom: '16px' }}>
                  <Lock size={32} color="var(--success-color)" />
                </motion.div>
                <h2 style={{ fontSize: '2rem', marginBottom: '8px', color: 'var(--text-primary)' }}>Create New Password</h2>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Your identity has been verified.
                </p>
              </motion.div>

              {error && <ErrorAlert error={error} />}

              <motion.form layoutId="morphContainer" onSubmit={handleResetPassword} style={{ borderRadius: '16px' }}>
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
              </motion.form>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div 
              key="step4" 
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 0' }}
            >
              <motion.div 
                layoutId="morphContainer"
                style={{ 
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '100px',
                  padding: '20px 40px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  boxShadow: '0 8px 32px rgba(16, 185, 129, 0.15)'
                }}
              >
                <CheckCircle size={32} color="var(--success-color)" />
                <span style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>Password Reset Successful</span>
              </motion.div>
              
              <motion.p 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '24px' }}
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
      </motion.div>

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
    style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '12px', borderRadius: '8px', color: 'var(--success-color)', marginBottom: '20px', fontSize: '0.9rem', textAlign: 'center' }}
  >
    {msg}
  </motion.div>
);

export default ForgotPassword;
