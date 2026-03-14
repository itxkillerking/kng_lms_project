import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Mail, Cpu, Linkedin, ExternalLink, Globe, ChevronRight } from 'lucide-react';

const Footer = () => {
    // Robust Resize Handling
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    
    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isExtraSmall = windowWidth <= 480;
    const isMobile = windowWidth <= 768;
    const isTablet = windowWidth <= 1024;
    const isLargeDesktop = windowWidth >= 1600;

    const navLinks = [
        { name: 'All Courses', path: '/catalog' },
        { name: 'About Campus', path: '/about' },
        { name: 'Contact Us', path: '/contact' },
        { name: 'My Dashboard', path: '/dashboard' }
    ];

    const companyLinks = [
        { name: 'Corporate Site', url: 'https://knglogicsolution.netlify.app/', icon: <Globe size={14} /> },
        { name: 'Professional Portfolio', url: 'https://jawadahmedportfolio.netlify.app/', icon: <ExternalLink size={14} /> }
    ];

    const socialLinks = [
        { name: 'LinkedIn Profile', url: 'https://www.linkedin.com/in/jawad-ahmed-439b68371', icon: <Linkedin size={18} />, color: '#0A66C2' },
        { name: 'Official Gmail', url: 'https://mail.google.com/mail/?view=cm&fs=1&to=kingjawad1581@gmail.com', icon: <Mail size={18} />, color: '#ea4335' }
    ];

    // Responsive Logic for Grid Columns
    const getGridTemplate = () => {
        if (isMobile) return '1fr';
        if (isTablet) return '1fr 1fr';
        return '1.5fr 1fr 1fr 1.2fr';
    };

    return (
        <footer style={{
            padding: isMobile ? '60px 24px 40px' : isTablet ? '80px 48px 60px' : '100px 80px 60px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            background: 'linear-gradient(to bottom, rgba(4, 4, 7, 0.8), rgba(2, 2, 4, 1))',
            position: 'relative',
            zIndex: 10,
            overflow: 'hidden'
        }}>
            {/* Background Accent */}
            <div style={{ position: 'absolute', top: '-100px', left: '10%', width: '300px', height: '300px', background: 'rgba(10, 132, 255, 0.03)', filter: 'blur(80px)', borderRadius: '50%', pointerEvents: 'none' }} />

            <div style={{ 
                maxWidth: isLargeDesktop ? '1600px' : '1300px', 
                margin: '0 auto', 
                display: 'grid', 
                gridTemplateColumns: getGridTemplate(), 
                gap: isMobile ? '48px' : isTablet ? '56px' : '40px' 
            }}>
                {/* Brand Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: isExtraSmall ? '36px' : '40px', height: isExtraSmall ? '36px' : '40px', background: 'linear-gradient(135deg, #0A84FF, #BF5AF2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(10, 132, 255, 0.2)' }}>
                            <Cpu color="white" size={isExtraSmall ? 18 : 20} />
                        </div>
                        <span style={{ fontWeight: 900, fontSize: isExtraSmall ? '1.1rem' : '1.2rem', letterSpacing: '-0.02em', color: 'white' }}>KLS TECH CAMPUS</span>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <p style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 700, fontSize: isExtraSmall ? '0.9rem' : '0.95rem', letterSpacing: '0.01em' }}>
                            Engineering the Future, Today.
                        </p>
                        <p style={{ color: 'rgba(255,255,255,0.4)', lineHeight: 1.8, fontSize: '0.85rem', maxWidth: isMobile ? '100%' : '320px' }}>
                            Empowering the next generation of engineers with industry-grade mentorship and scalable technology solutions. A project of KNG Logics Solutions.
                        </p>
                    </div>
                </div>

                {/* Quick Navigation */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <h4 style={{ fontWeight: 800, fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Navigation</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {navLinks.map((link, idx) => (
                            <NavLink key={idx} to={link.path} style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s' }}>
                                <ChevronRight size={14} style={{ opacity: 0.3 }} /> {link.name}
                            </NavLink>
                        ))}
                    </div>
                </div>

                {/* Corporate Resources */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <h4 style={{ fontWeight: 800, fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Resources</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {companyLinks.map((link, idx) => (
                            <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s' }}>
                                {link.icon} {link.name}
                            </a>
                        ))}
                    </div>
                </div>

                {/* Social Connectivity */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <h4 style={{ fontWeight: 800, fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Connect</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {socialLinks.map((link, idx) => (
                            <a 
                                key={idx} 
                                href={link.url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                style={{ 
                                    padding: isExtraSmall ? '12px 16px' : '14px 20px', 
                                    background: 'rgba(255,255,255,0.03)', 
                                    border: '1px solid rgba(255,255,255,0.06)', 
                                    borderRadius: '16px', 
                                    color: 'white', 
                                    textDecoration: 'none', 
                                    fontSize: isExtraSmall ? '0.85rem' : '0.9rem', 
                                    fontWeight: 700, 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '12px', 
                                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)' 
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                                    e.currentTarget.style.borderColor = link.color + '40';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                <span style={{ color: link.color }}>{link.icon}</span> {link.name}
                            </a>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div style={{ 
                marginTop: isMobile ? '60px' : '80px', 
                paddingTop: '32px', 
                borderTop: '1px solid rgba(255,255,255,0.03)', 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                gap: '24px' 
            }}>
                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.2)', fontWeight: 500, textAlign: 'center' }}>
                    &copy; 2026 KLS Tech Campus(A project of KNG Logics Solutons). All rights reserved.
                </p>
            </div>
        </footer>
    );
};

export default Footer;
