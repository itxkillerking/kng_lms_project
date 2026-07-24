import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export const GlassSelect = ({ value, onChange, options, style, className }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value) || options[0] || { label: 'Select...', value: '' };

    return (
        <div 
            ref={containerRef}
            className={`glass-select-container ${className || ''}`}
            style={{ 
                position: 'relative', 
                width: '100%',
                ...style 
            }}
        >
            <div 
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    background: 'rgba(30, 30, 45, 0.6)',
                    border: isOpen ? '1px solid var(--accent-blue)' : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    padding: '10px 16px',
                    color: '#1a1a2e',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s',
                    backdropFilter: 'blur(10px)',
                    boxShadow: isOpen ? '0 0 15px rgba(10, 132, 255, 0.2)' : 'none'
                }}
                onMouseEnter={e => {
                    if (!isOpen) e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                }}
                onMouseLeave={e => {
                    if (!isOpen) e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }}
            >
                <span style={{ textTransform: 'capitalize' }}>{selectedOption.label}</span>
                <ChevronDown 
                    size={16} 
                    style={{ 
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s',
                        opacity: 0.5
                    }} 
                />
            </div>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    left: 0,
                    right: 0,
                    background: 'rgba(20, 20, 30, 0.95)',
                    backdropFilter: 'blur(25px)',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    borderRadius: '16px',
                    padding: '8px',
                    zIndex: 2000,
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
                    maxHeight: '300px',
                    overflowY: 'auto'
                }}>
                    {options.map((option) => (
                        <div
                            key={option.value}
                            onClick={() => {
                                onChange({ target: { value: option.value } });
                                setIsOpen(false);
                            }}
                            style={{
                                padding: '10px 16px',
                                borderRadius: '10px',
                                color: value === option.value ? 'white' : 'rgba(255, 255, 255, 0.7)',
                                background: value === option.value ? 'var(--accent-blue)' : 'transparent',
                                fontSize: '0.85rem',
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                                marginBottom: '2px',
                                textTransform: 'capitalize'
                            }}
                            onMouseEnter={e => {
                                if (value !== option.value) {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                                    e.currentTarget.style.color = 'white';
                                }
                            }}
                            onMouseLeave={e => {
                                if (value !== option.value) {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
                                }
                            }}
                        >
                            {option.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
