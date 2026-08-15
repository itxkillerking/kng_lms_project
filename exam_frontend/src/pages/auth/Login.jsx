import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Button, Input, Alert } from '../../components/common/UIComponents';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import './login.css'; // Let's add specific liquid input styles here if needed

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.8,
      staggerChildren: 0.15
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0, filter: 'blur(10px)' },
  visible: { 
    y: 0, 
    opacity: 1, 
    filter: 'blur(0px)',
    transition: { type: 'spring', stiffness: 120, damping: 20 } 
  }
};

const panelVariants = {
  hidden: { scale: 0.95, opacity: 0, y: 30, filter: 'blur(20px)' },
  visible: { 
    scale: 1, 
    opacity: 1, 
    y: 0,
    filter: 'blur(0px)',
    transition: { delay: 0.6, type: 'spring', stiffness: 100, damping: 25, duration: 0.6 }
  }
};

const logoVariants = {
  hidden: { y: -50, opacity: 0, scale: 0.9 },
  visible: { 
    y: 0, 
    opacity: 1, 
    scale: 1,
    transition: { type: 'spring', stiffness: 80, damping: 20, duration: 1.2 } 
  }
};

export const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(username, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError('Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', alignItems: 'center' }}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-8)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <motion.img 
          variants={logoVariants}
          initial="hidden"
          animate="visible"
          src="/logo_background.png" 
          alt="KLS Tech Campus Logo" 
          style={{ 
            height: '110px', 
            marginBottom: 'var(--spacing-4)', 
            objectFit: 'contain',
            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))'
          }} 
        />
        <motion.div
          variants={logoVariants}
          initial="hidden"
          animate="visible"
        >
          <h2 style={{ color: 'var(--color-primary)', marginBottom: 'var(--spacing-2)', fontSize: '1.75rem', fontWeight: '700', textShadow: '0 2px 10px rgba(255,255,255,0.8)' }}>
            Welcome to KLS Tech Campus Examination Portal
          </h2>
          <p style={{ color: 'var(--color-text-main)', fontSize: '1rem', fontWeight: '600', opacity: 0.8, textShadow: '0 1px 5px rgba(255,255,255,0.8)' }}>
            A project of KNG Logics Solution
          </p>
        </motion.div>
      </div>

      <motion.div 
        className="glass-panel-strong" 
        variants={panelVariants}
        initial="hidden"
        animate="visible"
        style={{ width: '100%', padding: 'var(--spacing-8)', borderRadius: 'var(--radius-xl)', position: 'relative', zIndex: 1 }}
      >
        <h3 style={{ textAlign: 'center', marginBottom: 'var(--spacing-6)', color: 'var(--color-text-main)', fontWeight: '700' }}>Sign In</h3>
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <Alert type="error" message={error} />
            </motion.div>
          )}
        </AnimatePresence>
        
        <motion.form 
          onSubmit={handleSubmit}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} style={{ marginBottom: 'var(--spacing-4)' }}>
            <Input 
              label="Username" 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              required 
              className="liquid-input"
            />
          </motion.div>
          
          <motion.div variants={itemVariants} style={{ position: 'relative', marginBottom: 'var(--spacing-4)' }}>
            <Input 
              label="Password" 
              type={showPassword ? 'text' : 'password'} 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              className="liquid-input liquid-input-password"
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '36px',
                background: 'none',
                border: 'none',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.2s, transform 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-primary)'; e.currentTarget.style.transform = 'scale(1.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-muted)'; e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
            </button>
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <Button type="submit" variant="primary" style={{ width: '100%', marginTop: 'var(--spacing-4)', padding: '14px', fontSize: '1.1rem' }} disabled={isLoading}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </motion.div>
        </motion.form>
      </motion.div>
    </div>
  );
};
