import React from 'react';

export const GlassCard = ({ children, className = '', heavy = false, style = {}, ...props }) => {
  const baseClass = heavy ? 'glass-panel-heavy' : 'glass-panel';
  
  return (
    <div 
      className={`${baseClass} glass-card ${className}`} 
      style={{ padding: '24px', ...style }}
      {...props}
    >
      {children}
    </div>
  );
};
