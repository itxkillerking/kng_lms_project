import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const FloatingBackButton = () => {
  const navigate = useNavigate();
  const buttonRef = useRef(null);

  // Retrieve saved position or set default (bottom-left)
  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem('kng_backBtnPos');
    if (saved) return JSON.parse(saved);
    return { x: 30, y: typeof window !== 'undefined' ? window.innerHeight - 80 : 800 };
  });

  const isDragging = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleResize = () => {
      // Snap inside bounds when window resizes
      setPosition(prev => ({
        x: Math.min(prev.x, window.innerWidth - 60),
        y: Math.min(prev.y, window.innerHeight - 60)
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePointerDown = (e) => {
    isDragging.current = false;
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;

    const dx = e.clientX - dragStartPos.current.x;
    const dy = e.clientY - dragStartPos.current.y;

    // Only consider it a drag if moved more than 3px (prevents accidental drag on click)
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      isDragging.current = true;

      setPosition(prev => {
        let newX = prev.x + dx;
        let newY = prev.y + dy;

        // Keep within window bounds (assuming button is 50x50)
        newX = Math.max(10, Math.min(newX, window.innerWidth - 60));
        newY = Math.max(10, Math.min(newY, window.innerHeight - 60));

        return { x: newX, y: newY };
      });

      dragStartPos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handlePointerUp = (e) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
      // Save new position
      localStorage.setItem('kng_backBtnPos', JSON.stringify(position));
    }
  };

  const handleClick = (e) => {
    // Prevent navigate if the user just finished dragging
    if (isDragging.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // Fallback: If no browser history exists somehow, send to dashboard or home, 
    // but navigate(-1) usually handles it natively perfectly.
    navigate(-1);
  };

  return (
    <button
      ref={buttonRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
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
        touchAction: 'none', // Prevents scrolling while dragging on mobile touch
        userSelect: 'none',
        transition: 'box-shadow 0.3s ease, border-color 0.3s ease', // Only transition color/shadow, NOT position/transform to avoid drag lag
      }}
      onMouseEnter={(e) => {
        if (!isDragging.current) {
          e.currentTarget.style.boxShadow = '0 12px 40px rgba(10, 132, 255, 0.3)';
          e.currentTarget.style.borderColor = 'var(--accent-blue)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.4)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
      }}
      aria-label="Go Back (Draggable)"
    >
      <ArrowLeft size={24} />
    </button>
  );
};
