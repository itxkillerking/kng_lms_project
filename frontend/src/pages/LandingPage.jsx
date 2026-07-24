import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    Zap,
    Brain,
    Code,
    ChevronRight,
    Users,
    CheckCircle2,
    ArrowRight,
    Star,
    Globe,
    Cpu,
    Linkedin,
    Mail,
    Phone,
    ExternalLink,
    Terminal,
    Layers,
    Rocket,
    Smartphone,
    Menu,
    X
} from 'lucide-react';
import { GlassCard } from '../components/common/GlassCard';
import { GlassButton } from '../components/common/GlassButton';
import Footer from '../components/layout/Footer';

const LandingPage = () => {
    const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 1024);
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

    const [scrollY, setScrollY] = React.useState(0);

    React.useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 1024);
        const handleScroll = () => setScrollY(window.scrollY);

        window.addEventListener('resize', handleResize);
        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    return (
        <div style={{
            minHeight: '100vh',
            background: '#f5f7fa',
            color: '#1a1a2e',
            fontFamily: "'Inter', sans-serif",
            overflowX: 'hidden',
            position: 'relative'
        }}>
            {/* Premium Background Architecture */}
            <div style={{
                position: 'fixed',
                inset: 0,
                zIndex: 0,
                pointerEvents: 'none',
                overflow: 'hidden'
            }}>
                {/* Parallax Image Layer */}
                <img 
                    src="/background.png" 
                    alt="" 
                    style={{ 
                        width: '110%', // Oversized for parallax
                        height: '110%', 
                        objectFit: 'cover', 
                        opacity: 0.06,
                        filter: 'contrast(1.0) brightness(1.2) saturate(0.5)',
                        transform: `translate(-5%, calc(-5% + ${scrollY * 0.15}px))`, // Dynamic Parallax
                        position: 'absolute'
                    }} 
                />

                {/* Ultra-Fine Noise Texture Overlay */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    opacity: 0.03,
                    mixBlendMode: 'overlay',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                }} />

                {/* Master Depth Gradients */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'radial-gradient(circle at 50% 10%, rgba(10, 132, 255, 0.08) 0%, transparent 60%)'
                }} />
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to bottom, transparent 0%, rgba(245, 247, 250, 0.95) 95%)'
                }} />
            </div>

            {/* Background Glows (Enhanced) */}
            <div style={{
                position: 'fixed',
                top: '-10%',
                right: '-10%',
                width: '700px',
                height: '700px',
                background: 'rgba(10, 132, 255, 0.15)',
                filter: 'blur(180px)',
                borderRadius: '50%',
                zIndex: 1,
                pointerEvents: 'none'
            }} />
            <div style={{
                position: 'fixed',
                bottom: '-10%',
                left: '-10%',
                width: '700px',
                height: '700px',
                background: 'rgba(191, 90, 242, 0.15)',
                filter: 'blur(180px)',
                borderRadius: '50%',
                zIndex: 1,
                pointerEvents: 'none'
            }} />

            {/* Content Layer */}
            <div style={{ position: 'relative', zIndex: 10 }}>
                {/* Navigation */}
                <nav style={{
                padding: isMobile ? '12px 20px' : '16px 60px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 1000,
                background: 'rgba(255, 255, 255, 0.75)',
                backdropFilter: 'blur(40px) saturate(200%)',
                WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: isMobile ? '32px' : '42px',
                        height: isMobile ? '32px' : '42px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'transparent'
                    }}>
                        <img
                            src="/logo.png"
                            alt=""
                            style={{ 
                                width: '100%', 
                                height: '100%', 
                                objectFit: 'contain',
                                mixBlendMode: 'screen'
                            }}
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentElement.innerHTML = '⚡';
                                e.target.parentElement.style.fontSize = isMobile ? '0.9rem' : '1.2rem';
                            }}
                        />
                    </div>
                    <span style={{ 
                        fontSize: isMobile ? '1rem' : '1.3rem', 
                        fontWeight: 900, 
                        letterSpacing: '-0.04em',
                        display: isMobile && window.innerWidth < 400 ? 'none' : 'block'
                    }}>
                        KLS TECH CAMPUS
                    </span>
                </div>

                {isMobile ? (
                    <button 
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        style={{ background: 'transparent', border: 'none', color: '#1a1a2e', cursor: 'pointer' }}
                    >
                        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                        {['Courses', 'About'].map(item => (
                            <NavLink
                                key={item}
                                to={`/${item.toLowerCase() === 'courses' ? 'catalog' : item.toLowerCase()}`}
                                style={({ isActive }) => ({
                                    color: isActive ? '#1a1a2e' : '#64748b',
                                    textDecoration: 'none',
                                    fontWeight: 700,
                                    fontSize: '0.8rem',
                                    transition: 'all 0.3s ease',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                })}
                            >
                                {item}
                            </NavLink>
                        ))}
                        <div style={{ width: '1px', height: '20px', background: 'rgba(0, 0, 0, 0.06)' }}></div>
                        <NavLink to="/login" style={{ textDecoration: 'none' }}>
                            <span style={{ color: '#1a1a2e', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase' }}>Login</span>
                        </NavLink>
                        <NavLink to="/register" style={{ textDecoration: 'none' }}>
                            <GlassButton primary style={{ padding: '8px 20px', borderRadius: '12px', fontSize: '0.8rem' }}>
                                Join Platform
                            </GlassButton>
                        </NavLink>
                    </div>
                )}

                {/* Mobile Menu Dropdown */}
                {isMobile && mobileMenuOpen && (
                    <div style={{
                        position: 'fixed',
                        top: '58px',
                        left: 0,
                        right: 0,
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(40px)',
                        padding: '30px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '24px',
                        borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
                        zIndex: 999
                    }}>
                         {['Courses', 'About', 'Login'].map(item => (
                            <NavLink 
                                key={item} 
                                to={`/${item.toLowerCase() === 'courses' ? 'catalog' : item.toLowerCase()}`}
                                onClick={() => setMobileMenuOpen(false)}
                                style={{ color: '#1a1a2e', textDecoration: 'none', fontWeight: 700, fontSize: '1.2rem' }}
                            >
                                {item}
                            </NavLink>
                        ))}
                        <NavLink to="/register" onClick={() => setMobileMenuOpen(false)}>
                            <GlassButton primary wide style={{ borderRadius: '14px' }}>Join Platform</GlassButton>
                        </NavLink>
                    </div>
                )}
            </nav>

            {/* Hero Section */}
            <section style={{
                padding: isMobile ? '120px 20px 60px' : '160px 60px 120px 60px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                maxWidth: '1400px',
                margin: '0 auto',
                position: 'relative',
                zIndex: 1,
            }} className="hero-reveal">
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: '100%'
                }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 16px',
                        background: 'rgba(10, 132, 255, 0.1)',
                        border: '1px solid rgba(10, 132, 255, 0.2)',
                        borderRadius: '100px',
                        color: '#0A84FF',
                        fontSize: isMobile ? '0.65rem' : '0.75rem',
                        fontWeight: 800,
                        marginBottom: '32px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.12em'
                    }}>
                        <Zap size={14} fill="#0A84FF" /> Real-World Systems. Zero Tuition.
                    </div>

                    <h1 style={{
                        fontSize: isMobile ? '2.4rem' : '4.8rem',
                        fontWeight: 900,
                        lineHeight: 1.05,
                        letterSpacing: '-0.05em',
                        marginBottom: '24px',
                        color: '#1a1a2e',
                    }}>
                        Your Partner in AI & <br />
                        <span style={{
                            background: 'linear-gradient(to right, #0A84FF, #BF5AF2)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>Software Innovation</span>
                    </h1>

                    <p style={{
                        fontSize: isMobile ? '1rem' : '1.2rem',
                        color: '#64748b',
                        maxWidth: '800px',
                        margin: '0 auto 40px auto',
                        lineHeight: 1.7,
                    }}>
                        Specialized training in Artificial Intelligence, Machine Learning, and Enterprise Web Development.
                    </p>

                    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '16px', justifyContent: 'center', width: isMobile ? '100%' : 'auto' }}>
                        <NavLink to="/register" style={{ textDecoration: 'none' }}>
                            <GlassButton primary wide={isMobile} style={{ padding: '18px 40px', borderRadius: '18px', fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: 800 }}>
                                Start Learning Free
                            </GlassButton>
                        </NavLink>
                        <NavLink to="/catalog" style={{ textDecoration: 'none' }}>
                            <GlassButton wide={isMobile} style={{ padding: '18px 40px', borderRadius: '18px', fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: 600 }}>
                                Browse Catalog
                            </GlassButton>
                        </NavLink>
                    </div>
                </div>
            </section>

            {/* Founder's Vision Quote */}
            <section style={{ padding: isMobile ? '40px 20px' : '80px 60px', display: 'flex', justifyContent: 'center' }}>
                <GlassCard heavy style={{
                    maxWidth: '1000px',
                    padding: isMobile ? '40px 24px' : '80px 60px',
                    textAlign: 'center',
                    borderRadius: isMobile ? '32px' : '52px',
                    border: '1px solid rgba(0, 0, 0, 0.06)',
                    background: 'rgba(255, 255, 255, 0.85)'
                }}>
                    <p style={{
                        fontSize: isMobile ? '1.4rem' : '2.4rem',
                        fontStyle: 'italic',
                        fontWeight: 600,
                        color: '#1a1a2e',
                        marginBottom: '32px',
                        lineHeight: 1.35,
                    }}>
                        "In the pursuit of innovation, comfort is the enemy. To achieve something great, you must be willing to lose something in return."
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexDirection: isMobile ? 'column' : 'row' }}>
                        <div style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '18px',
                            background: 'linear-gradient(135deg, #0A84FF, #BF5AF2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#1a1a2e',
                            fontWeight: 900,
                            fontSize: '1.5rem',
                        }}>J</div>
                        <div style={{ textAlign: isMobile ? 'center' : 'left' }}>
                            <p style={{ fontWeight: 800, fontSize: '1.1rem', color: '#1a1a2e' }}>Jawad Ahmed</p>
                            <p style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Founder & CEO, KLS Tech Campus</p>
                        </div>
                    </div>
                </GlassCard>
            </section>

            {/* Teaching & Mentoring Section */}
            <section style={{ padding: isMobile ? '60px 20px' : '120px 60px', background: 'rgba(0, 0, 0, 0.01)' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: isMobile ? '40px' : '80px' }}>
                        <h2 style={{ fontSize: isMobile ? '2rem' : '3.2rem', fontWeight: 900, marginBottom: '16px' }}>Teaching & Mentoring</h2>
                        <p style={{ color: '#64748b', fontSize: '1rem', maxWidth: '600px', margin: '0 auto' }}>
                            Professional skill development and AI tools training for modern innovators.
                        </p>
                    </div>

                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', 
                        gap: '20px' 
                    }}>
                        {[
                            { icon: Terminal, title: "Python Fundamentals", desc: "Master the base of AI with production-grade Python patterns." },
                            { icon: Brain, title: "Machine Learning", desc: "Understand core concepts and advanced neural architectures." },
                            { icon: Cpu, title: "ChatGPT & AI Tools", desc: "Learn to leverage AI for rapid development and optimization." },
                            { icon: CheckCircle2, title: "Expert Code Review", desc: "Get feedback based on real-world best practices and standards." }
                        ].map((service, i) => (
                            <GlassCard key={i} style={{ padding: '28px', borderRadius: '24px' }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '14px',
                                    background: 'rgba(10, 132, 255, 0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: '16px'
                                }}>
                                    <service.icon color="#0A84FF" size={20} />
                                </div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '8px' }}>{service.title}</h3>
                                <p style={{ color: '#64748b', fontSize: '0.85rem', lineHeight: 1.6 }}>{service.desc}</p>
                            </GlassCard>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured Course Tracks */}
            <section style={{ padding: isMobile ? '60px 20px' : '100px 60px', maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: isMobile ? '40px' : '60px' }}>
                    <h2 style={{ fontSize: isMobile ? '2rem' : '3rem', fontWeight: 900, marginBottom: '16px' }}>Master the Matrix</h2>
                    <p style={{ color: '#64748b', fontSize: '1rem' }}>Career-defining tracks for the architects of tomorrow.</p>
                </div>

                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', 
                    gap: isMobile ? '20px' : '32px' 
                }}>
                    {[
                        { icon: Layers, title: "Full Stack Python", desc: "Scalable systems using Django/Python.", students: "Hot Track" },
                        { icon: Smartphone, title: "App Dev", desc: "Mobile experiences with professional polish.", students: "New" },
                        { icon: Rocket, title: "Modern Web", desc: "React, Node, and High-Performance Cloud.", students: "Trending" },
                        { icon: Brain, title: "ML Mastery", desc: "Advanced entry into the world of AI.", students: "Enterprise" }
                    ].map((course, i) => (
                        <GlassCard key={i} style={{
                            padding: isMobile ? '24px' : '40px',
                            borderRadius: '32px',
                            display: 'flex',
                            gap: '20px',
                            flexDirection: isMobile ? 'column' : 'row'
                        }}>
                            <div style={{
                                width: '64px',
                                height: '64px',
                                borderRadius: '20px',
                                background: 'linear-gradient(135deg, rgba(10, 132, 255, 0.1), rgba(191, 90, 242, 0.1))',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                <course.icon color="#BF5AF2" size={28} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '8px' }}>{course.title}</h3>
                                <p style={{ color: '#64748b', lineHeight: 1.6, marginBottom: '16px', fontSize: '0.9rem' }}>{course.desc}</p>
                                <div style={{ color: '#0A84FF', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.85rem' }}>
                                    View Syllabus <ChevronRight size={14} />
                                </div>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            </section>

            {/* Comprehensive Footer */}
            <Footer />

            <style dangerouslySetInnerHTML={{
                __html: `
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                
                @keyframes float {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                    100% { transform: translateY(0px); }
                }

                @keyframes scaleUp {
                    from { opacity: 0; transform: translateY(40px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }

                .hero-reveal {
                    animation: scaleUp 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }

                ::-webkit-scrollbar {
                    width: 8px;
                }
                ::-webkit-scrollbar-track {
                    background: transparent;
                }
                ::-webkit-scrollbar-thumb {
                    background: rgba(0, 0, 0, 0.1);
                    border-radius: 20px;
                }
            `}} />
            </div> {/* End Content Layer */}
        </div>
    );
};

export default LandingPage;
