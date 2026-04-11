import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const FloatingBackButton = () => {
  const navigate = useNavigate();
  const buttonRef = useRef(null);

  // Retrieve saved position or set default
  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem('kng_backBtnPos');
    if (saved) return JSON.parse(saved);
    return { x: 30, y: typeof window !== 'undefined' ? window.innerHeight - 80 : 800 }; 
  });

  const isDragging = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const blockClickRef = useRef(false);

  // Native touch and mouse event listeners attached with { passive: false }
  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;

    // Handle initial touch / click
    const handleStart = (e) => {
      isDragging.current = false;
      blockClickRef.current = false;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      dragStartPos.current = { x: clientX, y: clientY };
    };

    // Handle moving the button AND preventing Android pull-to-refresh
    const handleMove = (e) => {
      // 1. Force the browser to stop its default swipe-down behavior (fixes android bug)
      if (e.cancelable) {
        e.preventDefault();
      }

      // 2. Perform the drag logic
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      
      const dx = clientX - dragStartPos.current.x;
      const dy = clientY - dragStartPos.current.y;

      // Only drag if moved slightly to prevent accidental drags
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        isDragging.current = true;
        blockClickRef.current = true; // prevent the next click
        
        setPosition(prev => {
          let newX = prev.x + dx;
          let newY = prev.y + dy;
          // Keep within window bounds
          newX = Math.max(10, Math.min(newX, window.innerWidth - 60));
          newY = Math.max(10, Math.min(newY, window.innerHeight - 60));
          return { x: newX, y: newY };
        });
        
        dragStartPos.current = { x: clientX, y: clientY };
      }
    };

    const handleEnd = (e) => {
      if (isDragging.current) {
        // Save new position
        setPosition(currentPos => {
           localStorage.setItem('kng_backBtnPos', JSON.stringify(currentPos));
           return currentPos;
        });
      }
      isDragging.current = false;
    };

    // Attach ALL events natively using passive: false
    // Mouse events
    button.addEventListener('mousedown', handleStart, { passive: false });
    window.addEventListener('mousemove', handleMove, { passive: false });
    window.addEventListener('mouseup', handleEnd);
    
    // Touch events (Where the real Android bug happens!)
    button.addEventListener('touchstart', handleStart, { passive: false });
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleEnd);
    window.addEventListener('touchcancel', handleEnd);

    // Keep it inside screen bounds on resize
    const handleResize = () => {
      setPosition(prev => ({
        x: Math.min(prev.x, window.innerWidth - 60),
        y: Math.min(prev.y, window.innerHeight - 60)
      }));
    };
    window.addEventListener('resize', handleResize);

    return () => {
      button.removeEventListener('mousedown', handleStart);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      
      button.removeEventListener('touchstart', handleStart);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
      window.removeEventListener('touchcancel', handleEnd);
      
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleClick = (e) => {
    // Stop navigation if the user was just dragging the button
    if (blockClickRef.current) {
        e.preventDefault();
        e.stopPropagation();
        blockClickRef.current = false; // Reset for next tap
        return;
    }
    navigate(-1);
  };

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      style={{
        position: 'fixed',
        top: `${position.y}px`,
        left: `${position.x}px`,
        zIndex: 9999,
        width: '50px',
        height: '50px',
        borderRadius: '50%',
        background: 'rgba(10, 10, 15, 0.6)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        cursor: 'grab',
        touchAction: 'none', // Secondary shield against scrolling
        userSelect: 'none',
        WebkitUserSelect: 'none',
        transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
      }}
      aria-label="Go Back (Draggable)"
    >
      <ArrowLeft size={24} />
    </button>
  );
};
