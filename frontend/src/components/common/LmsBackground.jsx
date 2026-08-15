import React from 'react';
import './LmsBackground.css';

/**
 * LmsBackground
 * 
 * A shared background wrapper that perfectly replicates the Exam System's
 * animated aurora atmosphere and subtle company logo watermark.
 * It is non-interactive and sits behind all content.
 */
export const LmsBackground = () => {
    return (
        <div className="lms-background-wrapper">
            <div className="lms-bg-aurora" />
            <div className="lms-bg-watermark" />
        </div>
    );
};
