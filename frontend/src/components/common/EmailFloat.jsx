import React from 'react';
import { Mail } from 'lucide-react';

export const EmailFloat = () => {
    const email = 'kingjawad1581@gmail.com';
    const emailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${email}`;

    return (
        <a 
            href={emailUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
                position: 'fixed',
                bottom: '30px',
                right: '30px',
                width: '60px',
                height: '60px',
                background: 'linear-gradient(135deg, #0A84FF, #BF5AF2)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                boxShadow: '0 8px 32px rgba(10, 132, 255, 0.3)',
                zIndex: 9999,
                transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                cursor: 'pointer',
                border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1) translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(10, 132, 255, 0.4)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1) translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(10, 132, 255, 0.3)';
            }}
        >
            <Mail size={32} color="white" />
            <span style={{
                position: 'absolute',
                right: '70px',
                background: 'rgba(5, 5, 10, 0.85)',
                backdropFilter: 'blur(10px)',
                padding: '8px 16px',
                borderRadius: '12px',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: 'white',
                whiteSpace: 'nowrap',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                opacity: 0,
                transform: 'translateX(10px)',
                transition: 'all 0.3s ease',
                pointerEvents: 'none'
            }} className="wa-tooltip">
                Email Us
            </span>
            <style>{`
                a:hover .wa-tooltip {
                    opacity: 1 !important;
                    transform: translateX(0) !important;
                }
            `}</style>
        </a>
    );
};
