import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { GlassCard } from '../../components/common/GlassCard';
import { GlassButton } from '../../components/common/GlassButton';
import { Play, Clock, BookOpen, Award, CheckCircle, ChevronRight, Bell, Mail, Shield, User as UserIcon, LogOut, Search, Sparkles, Star, AlertCircle, MessageSquare } from 'lucide-react';
import SplashScreen from '../../components/common/SplashScreen';
import NotificationBadge from '../../components/common/NotificationBadge';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { useQuery } from '@tanstack/react-query';
import Footer from '../../components/layout/Footer';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // Queries for robust data fetching
    const { data: coursesData = [], isLoading: coursesLoading, error: coursesError, refetch: refetchCourses } = useQuery({
        queryKey: ['my-courses'],
        queryFn: async () => {
            const res = await api.get('courses/my_courses/');
            return Array.isArray(res.data) ? res.data : (res.data.results || []);
        }
    });

    const { data: certsData = [], isLoading: certsLoading, error: certsError, refetch: refetchCerts } = useQuery({
        queryKey: ['my-certificates'],
        queryFn: async () => {
            const res = await api.get('certificates/');
            return Array.isArray(res.data) ? res.data : (res.data.results || []);
        }
    });

    const { data: quizData = [], isLoading: quizLoading, error: quizError, refetch: refetchQuizzes } = useQuery({
        queryKey: ['my-quizzes'],
        queryFn: async () => {
            const res = await api.get('quiz-attempts/');
            return Array.isArray(res.data) ? res.data : (res.data.results || []);
        }
    });

    const loading = coursesLoading || certsLoading || quizLoading;
    const hasError = coursesError || certsError || quizError;
    
    const handleRetry = () => {
        refetchCourses();
        refetchCerts();
        refetchQuizzes();
    };

    const courses = coursesData;
    const certificates = certsData;
    const quizAttempts = quizData;

    // Redirect instructors and admins to their respective dashboards
    useEffect(() => {
        if (user) {
            if (user.role === 'instructor') {
                navigate('/teacher', { replace: true });
            } else if (user.role === 'admin') {
                navigate('/admin', { replace: true });
            }
        }
    }, [user, navigate]);

    // Robust Window Width Handling
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    
    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const [showSplash, setShowSplash] = useState(false);
    useEffect(() => {
        const hasShownSplash = sessionStorage.getItem('kls_splash_shown');
        if (!hasShownSplash) {
            setShowSplash(true);
        }
    }, []);

    const isExtraSmall = windowWidth <= 480;
    const isMobile = windowWidth <= 768;
    const isTablet = windowWidth <= 1100;
    const isLargeDesktop = windowWidth >= 1600;

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const enrolledCoursesCount = courses.length;
    const completedQuizzesCount = quizAttempts.filter(a => a.passed).length;

    if (showSplash) {
        return <SplashScreen onComplete={() => {
            sessionStorage.setItem('kls_splash_shown', 'true');
            setShowSplash(false);
        }} />;
    }

    if (loading || hasError) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#040407', color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '20px' }}>
                <div>
                    {hasError ? (
                        <>
                            <AlertCircle size={48} color="#FF453A" style={{ marginBottom: '16px' }} />
                            <h2 style={{ color: 'white', marginBottom: '8px' }}>Connection Issue</h2>
                            <p style={{ marginBottom: '24px' }}>We couldn't sync your dashboard data right now.</p>
                            <GlassButton onClick={handleRetry} style={{ borderRadius: '12px', padding: '10px 24px' }}>
                                Try to Reconnect
                            </GlassButton>
                        </>
                    ) : (
                        <>
                            <div style={{ width: '40px', height: '40px', border: '3px solid rgba(10, 132, 255, 0.2)', borderTop: '3px solid #0A84FF', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
                            <p>Preparing your experience...</p>
                        </>
                    )}
                </div>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: '#040407' }}>
            <div style={{ 
                padding: isExtraSmall ? '100px 16px 40px' : isMobile ? '100px 24px 60px' : isTablet ? '60px 40px 100px' : '80px 80px 120px', 
                maxWidth: isLargeDesktop ? '1800px' : '1450px', 
                margin: '0 auto', 
                color: 'white' 
            }}>

                {/* Top Header */}
                <div style={{
                    display: 'flex',
                    flexDirection: isTablet ? 'column' : 'row',
                    justifyContent: 'space-between',
                    alignItems: isTablet ? 'flex-start' : 'center',
                    marginBottom: isMobile ? '40px' : '64px',
                    gap: isTablet ? '32px' : '24px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: isExtraSmall ? '16px' : '24px' }}>
                        <div style={{ 
                            width: isExtraSmall ? '64px' : '80px', 
                            height: isExtraSmall ? '64px' : '80px', 
                            borderRadius: '24px', 
                            background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            border: '1px solid rgba(255,255,255,0.1)', 
                            overflow: 'hidden', 
                            flexShrink: 0 
                        }}>
                            {user?.profile_picture ? (
                                <img src={user.profile_picture.startsWith('http') ? user.profile_picture : `${import.meta.env.VITE_API_BASE_URL}${user.profile_picture}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <UserIcon size={isExtraSmall ? 28 : 32} color="white" />
                            )}
                        </div>
                        <div>
                            <h1 style={{ 
                                fontSize: isExtraSmall ? '1.6rem' : isMobile ? '2rem' : isTablet ? '2.4rem' : '3.2rem', 
                                fontWeight: 900, 
                                marginBottom: '4px', 
                                letterSpacing: '-0.04em',
                                lineHeight: 1.1
                            }}>
                                Hello, {user?.first_name || user?.username}
                            </h1>
                            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: isExtraSmall ? '0.95rem' : '1.1rem' }}>Welcome back to KLS Tech Campus.</p>
                        </div>
                    </div>
                    
                    <div style={{ 
                        display: 'flex', 
                        gap: '12px', 
                        flexWrap: 'wrap', 
                        width: isTablet ? '100%' : 'auto' 
                    }}>
                        <Link to="/chat" style={{ textDecoration: 'none', flex: isTablet ? 1 : 'none', minWidth: isExtraSmall ? '100%' : 'auto' }}>
                            <GlassButton wide style={{ borderRadius: '16px', border: '1px solid rgba(10, 132, 255, 0.1)', padding: '14px 28px', color: '#0A84FF', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <MessageSquare size={18} /> Direct Messages <NotificationBadge />
                            </GlassButton>
                        </Link>
                        <Link to="/profile" style={{ textDecoration: 'none', flex: isTablet ? 1 : 'none', minWidth: isExtraSmall ? '100%' : 'auto' }}>
                            <GlassButton wide style={{ borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.05)', padding: '14px 28px' }}>
                                Profile Settings
                            </GlassButton>
                        </Link>
                        <GlassButton onClick={handleLogout} style={{ 
                            color: '#ff453a', 
                            background: 'rgba(255, 69, 58, 0.05)', 
                            borderRadius: '16px', 
                            border: '1px solid rgba(255, 69, 58, 0.1)',
                            flex: isExtraSmall ? 1 : 'none',
                            minWidth: isExtraSmall ? '100%' : 'auto'
                        }}>
                            Logout
                        </GlassButton>
                    </div>
                </div>

                {/* Layout Grid */}
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: isTablet ? '1fr' : '2.4fr 1.1fr', 
                    gap: isMobile ? '32px' : isTablet ? '48px' : '64px' 
                }}>
                    
                    {/* Main Content (Left) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '40px' : '64px' }}>
                        
                        {/* Hero Stat Panel */}
                        <GlassCard style={{ 
                            padding: isExtraSmall ? '24px' : isMobile ? '32px' : '48px', 
                            borderRadius: '32px', 
                            background: 'linear-gradient(135deg, rgba(10, 132, 255, 0.06), rgba(0,0,0,0))',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <div style={{ position: 'relative', zIndex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0A84FF', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>
                                    <Sparkles size={16} /> Learning Dashboard
                                </div>
                                <h2 style={{ fontSize: isExtraSmall ? '1.5rem' : '1.8rem', fontWeight: 800, marginBottom: '32px' }}>Your platform progress</h2>
                                
                                <div style={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: isExtraSmall ? '1fr' : 'repeat(auto-fit, minmax(180px, 1fr))', 
                                    gap: '20px' 
                                }}>
                                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                        <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginBottom: '8px', fontWeight: 600 }}>Enrolled Courses</p>
                                        <h4 style={{ fontSize: '2rem', fontWeight: 900, color: 'white' }}>{enrolledCoursesCount}</h4>
                                    </div>
                                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                        <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginBottom: '8px', fontWeight: 600 }}>Quizzes Passed</p>
                                        <h4 style={{ fontSize: '2rem', fontWeight: 900, color: 'white' }}>{completedQuizzesCount}</h4>
                                    </div>
                                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                        <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginBottom: '8px', fontWeight: 600 }}>Platform Rank</p>
                                        <h4 style={{ fontSize: '2rem', fontWeight: 900, color: '#BF5AF2' }}>Novice</h4>
                                    </div>
                                </div>
                            </div>
                            <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '300px', height: '300px', background: 'rgba(10, 132, 255, 0.05)', filter: 'blur(80px)', borderRadius: '50%' }} />
                        </GlassCard>

                        {/* My Learning */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <h2 style={{ fontSize: isMobile ? '1.3rem' : '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>My Active Tracks</h2>
                                <Link to="/catalog" style={{ textDecoration: 'none', color: '#0A84FF', fontSize: '0.85rem', fontWeight: 800, letterSpacing: '0.05em' }}>VIEW ALL</Link>
                            </div>
                            
                            {courses.length > 0 ? (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: isMobile ? '20px' : '28px' }}>
                                    {courses.slice(0, 6).map(course => {
                                        const isCompleted = course.progress === 100;
                                        return (
                                            <GlassCard key={course.id} style={{ 
                                                padding: 0, 
                                                borderRadius: '28px', 
                                                overflow: 'hidden',
                                                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                                                border: '1px solid rgba(255,255,255,0.04)',
                                                background: 'rgba(10, 10, 15, 0.4)',
                                                display: 'flex',
                                                flexDirection: 'column'
                                            }}>
                                                <div style={{ 
                                                    display: 'flex', 
                                                    flexDirection: isMobile ? 'column' : 'row',
                                                    alignItems: isMobile ? 'stretch' : 'center',
                                                    padding: isExtraSmall ? '20px' : '28px',
                                                    gap: isExtraSmall ? '20px' : '32px'
                                                }}>
                                                    {/* Course Visual Indicator */}
                                                    <div style={{ 
                                                        width: isMobile ? '100%' : '140px', 
                                                        height: isMobile ? '160px' : '100px', 
                                                        borderRadius: '20px',
                                                        background: isCompleted ? 'linear-gradient(135deg, #30D15822, #30D15805)' : 'linear-gradient(135deg, #0A84FF22, #0A84FF05)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        border: `1px solid ${isCompleted ? '#30D15822' : '#0A84FF22'}`,
                                                        overflow: 'hidden',
                                                        flexShrink: 0
                                                    }}>
                                                        {isCompleted ? <Award size={48} color="#D4AF37" style={{ opacity: 0.8 }} /> : <Play size={48} color="#0A84FF" style={{ opacity: 0.8 }} />}
                                                    </div>

                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                                            <span style={{ 
                                                                fontSize: '0.65rem', 
                                                                fontWeight: 900, 
                                                                padding: '4px 10px', 
                                                                borderRadius: '6px', 
                                                                background: isCompleted ? 'rgba(48, 209, 88, 0.1)' : 'rgba(10, 132, 255, 0.1)',
                                                                color: isCompleted ? '#30D158' : '#0A84FF',
                                                                textTransform: 'uppercase',
                                                                letterSpacing: '0.05em'
                                                            }}>
                                                                {isCompleted ? 'Completed' : 'In Progress'}
                                                            </span>
                                                            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>ID: #{String(course.id).padStart(4, '0')}</span>
                                                        </div>
                                                        <h3 style={{ fontSize: isExtraSmall ? '1.2rem' : '1.4rem', fontWeight: 900, marginBottom: '6px', color: 'white', letterSpacing: '-0.01em' }}>{course.title}</h3>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', fontWeight: 600 }}>
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={14} /> 2.5h Total</span>
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><BookOpen size={14} /> 12 Modules</span>
                                                        </div>
                                                    </div>

                                                    <div style={{ 
                                                        display: 'flex', 
                                                        gap: '12px', 
                                                        width: isMobile ? '100%' : 'auto', 
                                                        flexDirection: isExtraSmall ? 'column' : 'row' 
                                                    }}>
                                                        {isCompleted && (
                                                            <div style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '8px',
                                                                padding: '12px 20px',
                                                                borderRadius: '16px',
                                                                background: 'rgba(212, 175, 55, 0.05)',
                                                                border: '1px solid rgba(212, 175, 55, 0.2)',
                                                                color: '#D4AF37',
                                                                fontSize: '0.85rem',
                                                                fontWeight: 700,
                                                                flex: 1
                                                            }}>
                                                                <Award size={18} />
                                                                <span>Cert. will be emailed soon</span>
                                                            </div>
                                                        )}
                                                        <Link to={`/learn/${course.id}`} style={{ textDecoration: 'none', flex: 1.2 }}>
                                                            <GlassButton primary style={{ 
                                                                borderRadius: '16px', 
                                                                padding: '14px 32px', 
                                                                fontSize: '0.9rem', 
                                                                width: '100%',
                                                                fontWeight: 800,
                                                                background: isCompleted ? 'rgba(191, 90, 242, 1)' : 'rgba(10, 132, 255, 1)'
                                                            }}>
                                                                {isCompleted ? 'Review Track' : 'Resume Track'}
                                                            </GlassButton>
                                                        </Link>
                                                    </div>
                                                </div>

                                                {/* Glowing Progress Strip */}
                                                <div style={{ height: '4px', width: '100%', background: 'rgba(255,255,255,0.03)', position: 'relative' }}>
                                                    <div style={{ 
                                                        width: `${course.progress || 0}%`, 
                                                        height: '100%', 
                                                        background: isCompleted ? '#30D158' : '#0A84FF',
                                                        boxShadow: `0 0 15px ${isCompleted ? '#30D15866' : '#0A84FF66'}`,
                                                        transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1)'
                                                    }} />
                                                    <div style={{ 
                                                        position: 'absolute', 
                                                        right: '12px', 
                                                        bottom: '8px', 
                                                        fontSize: '0.65rem', 
                                                        fontWeight: 900, 
                                                        color: isCompleted ? '#30D158' : 'rgba(255,255,255,0.2)' 
                                                    }}>
                                                        {course.progress || 0}% MASTERY
                                                    </div>
                                                </div>
                                            </GlassCard>
                                        );
                                    })}
                                </div>
                            ) : (
                                <GlassCard style={{ padding: isMobile ? '60px 24px' : '80px 40px', textAlign: 'center', borderRadius: '32px' }}>
                                    <div style={{ background: 'rgba(10, 132, 255, 0.05)', width: '72px', height: '72px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                                        <BookOpen size={32} color="#0A84FF" />
                                    </div>
                                    <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '12px' }}>Ready to start engineering?</h3>
                                    <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '40px', maxWidth: '340px', margin: '0 auto 40px', lineHeight: 1.6 }}>Your library is currently empty. Explore our professional tracks to begin your journey.</p>
                                    <Link to="/catalog">
                                        <GlassButton primary style={{ padding: '16px 48px', borderRadius: '18px', fontWeight: 800 }}>Browse All Courses</GlassButton>
                                    </Link>
                                </GlassCard>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        
                        {/* News & Updates */}
                        <GlassCard style={{ 
                            padding: '28px', 
                            borderRadius: '28px', 
                            border: '1px solid rgba(10, 132, 255, 0.15)',
                            background: 'linear-gradient(135deg, rgba(10, 132, 255, 0.03), rgba(0,0,0,0))' 
                        }}>
                            <div style={{ background: 'rgba(10, 132, 255, 0.1)', width: '44px', height: '44px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                                <Bell size={22} color="#0A84FF" />
                            </div>
                            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '10px', color: 'white' }}>Platform Update</h4>
                            <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>Cloud labs are now available for all full-stack tracks. Access your instances via the course view.</p>
                        </GlassCard>

                        {/* Activity Tracker */}
                        <div>
                            <h4 style={{ fontSize: '0.8rem', fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '24px' }}>Activity Tracker</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                {[
                                    { title: 'Python Backend Quiz', status: 'In Evaluation', color: '#FF9F0A' },
                                    { title: 'Modern Architecture', status: 'Pass', color: '#30D158' },
                                    { title: 'AI Automation', status: 'Continuing', color: '#0A84FF' }
                                ].map((task, i) => (
                                    <GlassCard key={i} style={{ padding: '18px 22px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.95rem', fontWeight: 700 }}>{task.title}</span>
                                            <div style={{ 
                                                fontSize: '0.7rem', 
                                                fontWeight: 800, 
                                                color: task.color, 
                                                background: `${task.color}15`, 
                                                padding: '6px 12px', 
                                                borderRadius: '8px',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.02em'
                                            }}>
                                                {task.status}
                                            </div>
                                        </div>
                                    </GlassCard>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <Footer />
        </div>
    );
};

export default Dashboard;
