import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const FloatingBackButton = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Hide the back button on the root Landing Page or Login/Register pages if needed.
    // Assuming root ('/') requires no back button.
    const hiddenRoutes = ['/', '/login', '/register', '/forgot-password'];
    
    // Also consider if there is no history to go back to, but browser history API is complex to read accurately.
    // For now, simple route check is safer.
    if (hiddenRoutes.includes(location.pathname)) {
      setIsVisible(false);
    } else {
      setIsVisible(true);
    }
  }, [location.pathname]);

  if (!isVisible) return null;

  return (
    <button
      onClick={() => navigate(-1)}
      style={{
        position: 'fixed',
        bottom: '30px', // Place it at bottom-left
        left: '30px',
        zIndex: 9999,
        width: '50px',
        height: '50px',
        borderRadius: '50%',
        background: 'rgba(10, 10, 15, 0.6) ',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = '0 12px 40px rgba(10, 132, 255, 0.3)';
        e.currentTarget.style.borderColor = 'var(--accent-blue)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.4)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
      }}
      aria-label="Go Back"
    >
      <ArrowLeft size={24} />
    </button>
  );
};
