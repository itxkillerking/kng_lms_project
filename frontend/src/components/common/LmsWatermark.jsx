import React from 'react';

/**
 * LmsWatermark
 * 
 * A full-viewport, subtle background watermark layer using the company logo.
 * Non-interactive, centered, and visually integrated with the Light/Glass theme.
 */
export const LmsWatermark = () => {
    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 0, // Behind all foreground content
            pointerEvents: 'none', // Strictly non-interactive
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
        }}>
            <img 
                src="/logo.png" 
                alt="" 
                aria-hidden="true"
                style={{
                    width: '60vw',
                    maxWidth: '800px',
                    opacity: 0.04, // Very subtle, as requested (4-6%)
                    filter: 'blur(4px) grayscale(100%)', // Soft integration
                    objectFit: 'contain'
                }} 
            />
        </div>
    );
};
