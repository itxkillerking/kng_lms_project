import React from 'react';

export const GlassButton = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  style = {}, 
  onClick,
  type = 'button',
  disabled = false,
  ...props 
}) => {
  return (
    <button
      type={type}
      className={`glass-button ${variant} ${className}`}
      style={style}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
