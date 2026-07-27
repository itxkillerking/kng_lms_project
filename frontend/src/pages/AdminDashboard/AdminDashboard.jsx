import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AdminSidebar } from './components/AdminSidebar';
import { AnalyticsDashboard } from './Overview/AnalyticsDashboard';
import { UserControlPanel } from './Users/UserControlPanel';
import { CourseModeration } from './Courses/CourseModeration';
import { CourseManager } from './Courses/CourseManager';
import { SystemSettings } from './Settings/SystemSettings';
import { EnrollmentRequests } from './Enrollments/EnrollmentRequests';
import SplashScreen from '../../components/common/SplashScreen';

const AdminDashboard = () => {
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(window.innerWidth > 1024);
    const [showSplash, setShowSplash] = React.useState(false);

    React.useEffect(() => {
        const hasShownSplash = sessionStorage.getItem('kls_splash_shown');
        if (!hasShownSplash) {
            setShowSplash(true);
        }
    }, []);

    if (showSplash) {
        return <SplashScreen onComplete={() => {
            sessionStorage.setItem('kls_splash_shown', 'true');
            setShowSplash(false);
        }} />;
    }

    return (
        <div style={{ 
            display: 'flex', 
            minHeight: '100vh', 
            background: '#f5f7fa',
            flexDirection: window.innerWidth <= 768 ? 'column' : 'row'
        }}>
            <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
            
            <main style={{ 
                flex: 1, 
                padding: window.innerWidth <= 768 ? '24px 20px' : '40px 60px', 
                maxHeight: '100vh', 
                overflowY: 'auto',
                background: 'radial-gradient(circle at top right, rgba(10, 132, 255, 0.05), transparent 40%), radial-gradient(circle at bottom left, rgba(191, 90, 242, 0.05), transparent 40%)',
                width: '100%'
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
        </div>
    );
};

export default AdminDashboard;
