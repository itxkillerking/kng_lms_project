import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
    Layout, 
    Users, 
    BookOpen, 
    BarChart3, 
    Settings, 
    LogOut,
    ShieldCheck,
    ChevronRight,
    Menu,
    X,
    MessageSquare
} from 'lucide-react';
import NotificationBadge from '../../../components/common/NotificationBadge';
import { useAuth } from '../../../context/AuthContext';
import { GlassCard } from '../../../components/common/GlassCard';

export const AdminSidebar = ({ isOpen, setIsOpen }) => {
    const { logout, user } = useAuth();
    const isMobile = window.innerWidth <= 1024;

    const navItems = [
        { label: 'Analytics', path: '/admin', icon: BarChart3, end: true },
        { label: 'Direct Messages', path: '/chat', icon: MessageSquare, badge: true },
        { label: 'User Control', path: '/admin/users', icon: Users },
        { label: 'Course Management', path: '/admin/courses', icon: BookOpen },
        { label: 'Course Moderation', path: '/admin/moderation', icon: ShieldCheck },
        { label: 'System Settings', path: '/admin/settings', icon: Settings },
    ];

    return (
        <>
        {/* Mobile Toggle Button */}
        {isMobile && (
            <button 
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: 'fixed',
                    top: '20px',
                    left: '20px',
                    zIndex: 1000,
                    background: 'rgba(0, 0, 0, 0.03)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                    borderRadius: '12px',
                    padding: '10px',
                    color: '#1a1a2e',
                    cursor: 'pointer'
                }}
            >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
        )}

        {/* Sidebar Overlay for Mobile */}
        {isMobile && isOpen && (
            <div 
                onClick={() => setIsOpen(false)}
                style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.4)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 998
                }}
            />
        )}

        <div style={{ 
            width: isMobile ? '280px' : '300px', 
            height: '100vh', 
            background: isMobile ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.7)', 
            backdropFilter: 'blur(30px)',
            borderRight: '1px solid rgba(0, 0, 0, 0.06)',
            padding: '40px 20px',
            display: 'flex',
            flexDirection: 'column',
            position: isMobile ? 'fixed' : 'sticky',
            left: isMobile ? (isOpen ? '0' : '-300px') : '0',
            top: 0,
            zIndex: 999,
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            flexShrink: 0
        }}>
            <div style={{ marginBottom: '40px', padding: '0 10px' }}>
                <h1 style={{ 
                    fontSize: '1.5rem', 
                    fontWeight: 800, 
                    background: 'linear-gradient(to right, #0A84FF, #BF5AF2)', 
                    WebkitBackgroundClip: 'text', 
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-0.02em'
                }}>
                    KNG ADMIN
                </h1>
                <p style={{ fontSize: '0.7rem', color: '#94a3b8', letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: '4px' }}>
                    Control Center
                </p>
            </div>

            <nav style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '8px',
                overflowY: 'auto',
                paddingRight: '4px',
                marginRight: '-4px',
                scrollPaddingBottom: '20px'
            }}>
                {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <NavLink 
                            key={item.path} 
                            to={item.path}
                            end={item.end}
                            style={({ isActive }) => ({
                                textDecoration: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '14px',
                                padding: '14px 20px',
                                borderRadius: '14px',
                                color: isActive ? '#1a1a2e' : '#64748b',
                                background: isActive ? 'rgba(10, 132, 255, 0.12)' : 'transparent',
                                border: isActive ? '1px solid rgba(10, 132, 255, 0.2)' : '1px solid transparent',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                fontWeight: isActive ? 600 : 400
                            })}
                        >
                            <Icon size={20} />
                            <span>{item.label}</span>
                            <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.3 }} />
                        </NavLink>
                    );
                })}
            </nav>

            <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
                <div style={{ height: '1px', background: 'rgba(0, 0, 0, 0.03)', margin: '0 -20px 24px -20px' }}></div>
                <GlassCard 
                    style={{ 
                        padding: '16px', 
                        marginBottom: '16px', 
                        background: 'rgba(0, 0, 0, 0.02)',
                        border: '1px solid rgba(0, 0, 0, 0.06)'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ 
                            width: '36px', 
                            height: '36px', 
                            borderRadius: '10px', 
                            background: 'linear-gradient(135deg, #0A84FF, #BF5AF2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 700,
                            fontSize: '0.8rem'
                        }}>
                            {user?.username?.[0].toUpperCase()}
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1a1a2e', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                                {user?.first_name || user?.username}
                            </p>
                            <p style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Super Admin</p>
                        </div>
                    </div>
                </GlassCard>
                
                <button 
                    onClick={logout}
                    style={{ 
                        width: '100%', 
                        padding: '14px', 
                        borderRadius: '16px', 
                        border: '1px solid rgba(255, 69, 58, 0.1)',
                        background: 'rgba(255, 69, 58, 0.05)',
                        color: '#ff453a',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(255, 69, 58, 0.1)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.background = 'rgba(255, 69, 58, 0.05)';
                        e.currentTarget.style.transform = 'translateY(0)';
                    }}
                >
                    <LogOut size={16} /> Logout
                </button>
            </div>
        </div>
        </>
    );
};
