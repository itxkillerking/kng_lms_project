import React from 'react';
import './common.css'; // Will hold basic styles for these components

export const Button = ({ children, variant = 'primary', size = 'md', className = '', ...props }) => {
  return (
    <button className={`btn btn-${variant} btn-${size} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const Card = ({ children, className = '', ...props }) => {
  return (
    <div className={`card glass-panel-medium ${className}`} {...props}>
      {children}
    </div>
  );
};

export const Input = ({ label, error, className = '', ...props }) => {
  return (
    <div className={`input-group ${className}`}>
      {label && <label className="input-label">{label}</label>}
      <input className={`input-field ${error ? 'input-error' : ''}`} {...props} />
      {error && <span className="error-text">{error}</span>}
    </div>
  );
};

export const Alert = ({ type = 'info', message }) => {
  return (
    <div className={`alert alert-${type}`}>
      {message}
    </div>
  );
};

export const LoadingOverlay = ({ message = 'Loading...' }) => {
  return (
    <div className="loading-overlay">
      <div className="spinner"></div>
      <p>{message}</p>
    </div>
  );
};

export const SkeletonLoader = ({ type = 'text', count = 1 }) => {
  return (
    <>
      {Array(count).fill(0).map((_, i) => (
        <div key={i} className={`skeleton skeleton-${type}`}></div>
      ))}
    </>
  );
};
