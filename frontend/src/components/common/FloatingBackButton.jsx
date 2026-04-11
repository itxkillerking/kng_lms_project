import React, { useState, useRef, useEffect } from 'react';

const FloatingBackButton = () => {
  // Start the button at the bottom right corner
  const [position, setPosition] = useState({ x: 20, y: typeof window !== 'undefined' ? window.innerHeight - 80 : 800 }); 
  const buttonRef = useRef(null);

  // We need to track if the mouse is actively pressed down
  const isDragging = useRef(false);
  // Track offset to stop jumping
  const offset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMove = (e) => {
      // ONLY move if the user is holding down the mouse/touch!
      if (!isDragging.current) return;
      
      const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
      const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;

      setPosition({
        x: clientX - offset.current.x,
        y: clientY - offset.current.y
      });
    };

    const handleUp = () => {
      isDragging.current = false;
    };

    // Attach to window so dragging is smooth even if mouse moves fast
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    
    // Touch equivalents
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleUp);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, []);

  // Dedicated secondary hook specifically to intercept Android Pull-to-Refresh
  useEffect(() => {
    const btn = buttonRef.current;
    const blockAndroidRefresh = (e) => {
      e.preventDefault(); 
    };
    if (btn) {
      btn.addEventListener('touchmove', blockAndroidRefresh, { passive: false });
    }
    return () => {
      if (btn) btn.removeEventListener('touchmove', blockAndroidRefresh);
    };
  }, []);

  const handleDown = (e) => {
    const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
    
    offset.current = {
      x: clientX - position.x,
      y: clientY - position.y
    };
    isDragging.current = true;
  };

  const goBack = () => {
    // Only navigate if we aren't dragging right now
    if(isDragging.current) return;
    window.history.back();
  };

  return (
    <button
      ref={buttonRef}
      onMouseDown={handleDown}
      onTouchStart={handleDown}
      onClick={goBack}
      className="draggable-back-btn" 
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 9999, // Keeps it above all other content
        padding: '12px 20px',
        backgroundColor: '#0A192F', // KLS Tech Campus Dark Blue
        color: '#FFFFFF',
        borderRadius: '50px',
        border: '1px solid #4D90FE',
        boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
        cursor: 'grab',
        touchAction: 'none' // This CSS acts as a secondary shield against scrolling
      }}
    >
      ⬅ Back
    </button>
  );
};

export default FloatingBackButton;
