import React from 'react';

export const GlassInput = ({ 
  label, 
  type = 'text', 
  placeholder, 
  value, 
  onChange, 
  name, 
  required = false,
  className = '',
  ...props 
}) => {
  return (
    <div className={`input-group ${className}`} style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
      {label && (
        <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
          {label} {required && <span style={{color: 'var(--danger)'}}>*</span>}
        </label>
      )}
      <input
        type={type}
        name={name}
        className="glass-input"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        {...props}
      />
    </div>
  );
};
