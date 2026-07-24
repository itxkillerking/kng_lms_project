import React from 'react';

export const GlassButton = ({ 
  children, 
  variant = 'secondary', 
  primary = false,
  className = '', 
  style = {}, 
  onClick,
  type = 'button',
  disabled = false,
  ...props 
}) => {
  const isPrimary = primary || variant === 'primary';
  const variantClass = isPrimary ? 'primary' : (variant || 'secondary');
  return (
    <button
      type={type}
      className={`glass-button ${variantClass} ${className}`}
      style={style}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
