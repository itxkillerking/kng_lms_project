import React from 'react';

export const GlassCard = ({ children, className = '', heavy = false, Heavy, style = {}, ...props }) => {
  const isHeavy = heavy || Heavy;
  const baseClass = isHeavy ? 'glass-panel-heavy' : 'glass-panel';
  
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
