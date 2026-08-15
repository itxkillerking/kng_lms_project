import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { AnalyticsDashboard } from './Overview/AnalyticsDashboard';
import { UserControlPanel } from './Users/UserControlPanel';
import { CourseModeration } from './Courses/CourseModeration';
import { CourseManager } from './Courses/CourseManager';
import { SystemSettings } from './Settings/SystemSettings';
import { EnrollmentRequests } from './Enrollments/EnrollmentRequests';
import SplashScreen from '../../components/common/SplashScreen';
import { useAuth } from '../../context/AuthContext';
import { LiquidBottomNav } from '../../components/common/LiquidBottomNav';
import { AdminSidebar } from './components/AdminSidebar';
import { LmsBackground } from '../../components/common/LmsBackground';
import { BarChart3, Users, BookOpen, ShieldCheck, UserPlus, Settings, MessageSquare, LogOut } from 'lucide-react';

const AdminDashboard = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [showSplash, setShowSplash] = React.useState(false);
    
    // Responsive state
    const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 1024);
    const [sidebarOpen, setSidebarOpen] = React.useState(false);

    React.useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 1024);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    React.useEffect(() => {
        const hasShownSplash = sessionStorage.getItem('kls_splash_shown');
        if (!hasShownSplash) {
            setShowSplash(true);
        }
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (showSplash) {
        return <SplashScreen onComplete={() => {
            sessionStorage.setItem('kls_splash_shown', 'true');
            setShowSplash(false);
        }} />;
    }

    const navItems = [
        { label: 'Analytics', path: '/admin', icon: BarChart3, end: true },
        { label: 'User Control', path: '/admin/users', icon: Users },
        { label: 'Course Management', path: '/admin/courses', icon: BookOpen },
        { label: 'Course Moderation', path: '/admin/moderation', icon: ShieldCheck },
        { label: 'Enrollment Requests', path: '/admin/enrollments', icon: UserPlus },
        { label: 'System Settings', path: '/admin/settings', icon: Settings },
        { label: 'Direct Messages', path: '/chat', icon: MessageSquare },
        { label: 'Logout', path: 'logout', icon: LogOut }
    ];

    return (
        <div style={{ 
            position: 'relative',
            zIndex: 1, // ensure content sits above the LmsBackground
            display: 'flex', 
            minHeight: '100vh', 
            background: 'transparent',
            flexDirection: 'column',
            paddingBottom: isMobile ? '0' : '100px' // Space for floating nav on desktop only
        }}>
            <LmsBackground />
            
            {/* Render Mobile Sidebar only on small screens */}
            {isMobile && (
                <AdminSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
            )}

            <main style={{ 
                flex: 1, 
                padding: isMobile ? '72px 20px 24px' : '40px 60px', // Extra top padding on mobile for hamburger
                width: '100%',
                maxWidth: '1600px',
                margin: '0 auto',
                position: 'relative',
                zIndex: 2,
            }}>
                <Routes>
                    <Route path="/" element={<AnalyticsDashboard />} />
                    <Route path="/users" element={<UserControlPanel />} />
                    <Route path="/courses" element={<CourseManager />} />
                    <Route path="/moderation" element={<CourseModeration />} />
                    <Route path="/enrollments" element={<EnrollmentRequests />} />
                    <Route path="/settings" element={<SystemSettings />} />
                </Routes>
            </main>
            
            {/* Render Liquid Bottom Nav only on desktop */}
            {!isMobile && (
                <LiquidBottomNav 
                    items={navItems} 
                    onLogout={handleLogout} 
                />
            )}
        </div>
    );
};

export default AdminDashboard;
