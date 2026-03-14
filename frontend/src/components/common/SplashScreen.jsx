import React, { useState, useEffect } from 'react';

/**
 * Premium SplashScreen component for KLS TECH CAMPUS
 * Features: 3D Perspective Reveal, Gold Shimmer Text, Immersive Dissolve
 */
const SplashScreen = ({ onComplete }) => {
    const [isVisible, setIsVisible] = useState(true);
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsExiting(true);
            setTimeout(() => {
                setIsVisible(false);
                if (onComplete) onComplete();
            }, 800); // Dissolve duration
        }, 3000); // Reveal duration

        return () => clearTimeout(timer);
    }, [onComplete]);

    if (!isVisible) return null;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: '#040407',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: isExiting ? 0 : 1,
            transform: isExiting ? 'scale(1.1)' : 'scale(1)',
            filter: isExiting ? 'blur(20px)' : 'none',
            transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            pointerEvents: isExiting ? 'none' : 'auto',
            perspective: '1200px'
        }}>
            {/* Ambient Background Glow */}
            <div style={{
                position: 'absolute',
                width: '400px',
                height: '400px',
                background: 'radial-gradient(circle, rgba(212, 175, 55, 0.1) 0%, rgba(0,0,0,0) 70%)',
                filter: 'blur(60px)',
                borderRadius: '50%',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)'
            }} />

            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                animation: 'reveal3D 1.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
                transformStyle: 'preserve-3d'
            }}>
                {/* Logo with 3D entry */}
                <div style={{
                    marginBottom: '32px',
                    filter: 'drop-shadow(0 0 20px rgba(212, 175, 55, 0.3))'
                }}>
                    <img 
                        src="/background.png" 
                        alt="KLS Logo" 
                        style={{ 
                            width: '180px', 
                            height: 'auto',
                            transform: 'translateZ(50px)'
                        }} 
                    />
                </div>

                {/* Company Name with Shimmer */}
                <div style={{ textAlign: 'center' }}>
                    <h1 style={{
                        fontSize: '2.5rem',
                        fontWeight: 900,
                        letterSpacing: '8px',
                        color: 'white',
                        margin: 0,
                        textTransform: 'uppercase',
                        background: 'linear-gradient(90deg, #fff 0%, #D4AF37 50%, #fff 100%)',
                        backgroundSize: '200% auto',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        animation: 'shimmer 3s linear infinite',
                        transform: 'translateZ(100px)'
                    }}>
                        KLS TECH CAMPUS
                    </h1>
                    <div style={{
                        height: '1px',
                        width: '0',
                        background: 'linear-gradient(90deg, transparent, #D4AF37, transparent)',
                        marginTop: '12px',
                        animation: 'growLine 1s ease-out 0.8s forwards'
                    }} />
                    <p style={{
                        color: 'rgba(255,255,255,0.4)',
                        fontSize: '0.9rem',
                        marginTop: '20px',
                        letterSpacing: '4px',
                        fontWeight: 500,
                        opacity: 0,
                        animation: 'fadeIn 1s ease-out 1.2s forwards'
                    }}>
                        ESTABLISHING EXCELLENCE
                    </p>
                </div>
            </div>

            <style>{`
                @keyframes reveal3D {
                    0% {
                        transform: rotateY(-45deg) rotateX(10deg) translateZ(-400px) scale(0.8);
                        opacity: 0;
                        filter: blur(10px);
                    }
                    100% {
                        transform: rotateY(0) rotateX(0) translateZ(0) scale(1);
                        opacity: 1;
                        filter: blur(0);
                    }
                }

                @keyframes shimmer {
                    to { background-position: 200% center; }
                }

                @keyframes growLine {
                    to { width: 100%; }
                }

                @keyframes fadeIn {
                    to { opacity: 1; transform: translateY(-5px); }
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default SplashScreen;
