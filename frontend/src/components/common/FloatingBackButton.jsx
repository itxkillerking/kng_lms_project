import React, { useState, useRef } from 'react';

const FloatingBackButton = () => {
  // Start the button at the bottom right corner
  const [position, setPosition] = useState({ x: 20, y: 100 }); 
  const buttonRef = useRef(null);

  const handleTouchMove = (e) => {
    // Get the exact position of the user's finger
    const touch = e.touches[0];
    
    // Calculate the center of the button so it doesn't jump
    const buttonWidth = buttonRef.current.offsetWidth / 2;
    const buttonHeight = buttonRef.current.offsetHeight / 2;

    // Update the button position to follow the finger
    setPosition({
      x: touch.clientX - buttonWidth,
      y: touch.clientY - buttonHeight
    });
  };

  const goBack = () => {
    window.history.back();
  };

  return (
    <button
      ref={buttonRef}
      onTouchMove={handleTouchMove}
      onClick={goBack}
      className="draggable-back-btn" // This applies the CSS magic shield!
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
        cursor: 'pointer',
        touchAction: 'none' // This CSS acts as a secondary shield against scrolling
      }}
    >
      ⬅ Back
    </button>
  );
};

export default FloatingBackButton;
