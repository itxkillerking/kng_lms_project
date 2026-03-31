import React, { useState } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Users, BookOpen, FileText, CheckSquare, Megaphone, LogOut, ChevronRight, Menu, X, MessageSquare } from 'lucide-react';
import { GlassCard } from '../../components/common/GlassCard';
import { GlassButton } from '../../components/common/GlassButton';
import { useAuth } from '../../context/AuthContext';
import SplashScreen from '../../components/common/SplashScreen';
import { TeacherOverview } from './Overview/TeacherOverview';
import { CourseManager } from './Courses/CourseManager';
import { CourseCreator } from './Courses/CourseCreator';
import { ContentBuilder } from './Courses/ContentBuilder';
import { AssessmentManager } from './Assessments/AssessmentManager';
import { QuizCreator } from './Assessments/QuizCreator';
import { AssignmentCreator } from './Assessments/AssignmentCreator';
import { SubmissionInbox } from './Grading/SubmissionInbox';
import { ManualGrader } from './Grading/ManualGrader';
import { AnnouncementManager } from './Announcements/AnnouncementManager';
import { StudentManager } from './Students/StudentManager';

const TeacherDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
  const isMobile = window.innerWidth <= 1024; // Standard tablet/mobile breakpoint
  const [showSplash, setShowSplash] = useState(false);

  React.useEffect(() => {
    const hasShownSplash = sessionStorage.getItem('kls_splash_shown');
    if (!hasShownSplash) {
      setShowSplash(true);
    }
  }, []);

  // Handle window resizing
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Overview', path: '/teacher', icon: Layout },
    { label: 'My Students', path: '/teacher/students', icon: Users },
    { label: 'Direct Messages', path: '/chat', icon: MessageSquare, badge: true },
    { label: 'My Courses', path: '/teacher/courses', icon: BookOpen },
    { label: 'Quizzes & Assignments', path: '/teacher/assessments', icon: FileText },
    { label: 'Grading', path: '/teacher/grading', icon: CheckSquare },
    { label: 'Announcements', path: '/teacher/announcements', icon: Megaphone },
  ];

  const currentPath = location.pathname;

  if (showSplash) {
    return <SplashScreen onComplete={() => {
      sessionStorage.setItem('kls_splash_shown', 'true');
      setShowSplash(false);
    }} />;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#050508', color: 'white', position: 'relative' }}>
      
      {/* Mobile Sidebar Backdrop */}
      {isMobile && sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 95 }}
        />
      )}

      {/* Mobile Header Toggle */}
      {(!sidebarOpen || !isMobile) && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '64px', background: 'rgba(5,5,10,0.8)', backdropFilter: 'blur(20px)', zIndex: 90, display: 'flex', alignItems: 'center', padding: '0 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <button onClick={() => setSidebarOpen(true)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
            <Menu size={24} />
          </button>
          <span style={{ marginLeft: '16px', fontWeight: 800, fontSize: '1rem', background: 'linear-gradient(to right, #0A84FF, #BF5AF2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>KLS Instructor</span>
        </div>
      )}

      {/* Sidebar Navigation */}
      <div style={{ 
        width: '300px', 
        minWidth: '300px',
        height: '100vh',
        borderRight: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(10,10,15,0.95)',
        backdropFilter: 'blur(40px)',
        padding: '40px 24px',
        display: 'flex',
        flexDirection: 'column',
        position: isMobile ? 'fixed' : 'sticky',
        top: 0,
        left: 0,
        zIndex: 100,
        transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        visibility: sidebarOpen || !isMobile ? 'visible' : 'hidden',
        boxShadow: isMobile && sidebarOpen ? '20px 0 60px rgba(0,0,0,0.8)' : 'none',
        overflowY: 'auto'
      }}>
        <div style={{ marginBottom: '48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, background: 'linear-gradient(to right, #0A84FF, #BF5AF2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>KLS Tech Campus</h2>
            <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 800 }}>Instructor Panel</p>
          </div>
          {isMobile && (
            <button onClick={() => setSidebarOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
              <X size={24} />
            </button>
          )}
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path || (item.path !== '/teacher' && currentPath.startsWith(item.path));
            return (
              <Link 
                key={item.path} 
                to={item.path} 
                onClick={() => isMobile && setSidebarOpen(false)}
                style={{ 
                  textDecoration: 'none', 
                  color: isActive ? 'white' : 'rgba(255,255,255,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 20px',
                  borderRadius: '16px',
                  background: isActive ? 'rgba(10, 132, 255, 0.1)' : 'transparent',
                  border: isActive ? '1px solid rgba(10, 132, 255, 0.2)' : '1px solid transparent',
                  transition: 'all 0.2s'
                }}
              >
                <Icon size={20} color={isActive ? '#0A84FF' : 'currentColor'} />
                <span style={{ fontWeight: isActive ? 700 : 500, fontSize: '0.95rem' }}>{item.label}</span>
                {isActive && <ChevronRight size={16} style={{ marginLeft: 'auto' }} color="#0A84FF" />}
              </Link>
            );
          })}
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: '40px' }}>
          <Link to="/profile" style={{ textDecoration: 'none' }} onClick={() => isMobile && setSidebarOpen(false)}>
            <GlassCard style={{ padding: '16px', borderRadius: '20px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(45deg, #0A84FF, #BF5AF2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <p style={{ fontWeight: 700, fontSize: '0.9rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{user?.first_name || user?.username}</p>
                  <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Verified Pro</p>
                </div>
              </div>
            </GlassCard>
          </Link>
          <GlassButton onClick={handleLogout} wide style={{ color: '#ff453a', background: 'rgba(255, 69, 58, 0.05)', borderColor: 'rgba(255, 69, 58, 0.1)' }}>
            <LogOut size={18} /> Logout
          </GlassButton>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ 
        flex: 1, 
        padding: isMobile ? '88px 20px 40px' : '60px 40px', 
        overflowY: 'auto', 
        height: '100vh',
        background: 'radial-gradient(circle at 50% 0%, rgba(10, 132, 255, 0.03) 0%, transparent 70%)'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <Routes>
            <Route path="/" element={<TeacherOverview />} />
            <Route path="/students" element={<StudentManager />} />
            <Route path="/courses" element={<CourseManager />} />
            <Route path="/courses/create" element={<CourseCreator />} />
            <Route path="/courses/:courseId/content" element={<ContentBuilder />} />
            <Route path="/assessments" element={<AssessmentManager />} />
            <Route path="/assessments/quiz/create" element={<QuizCreator />} />
            <Route path="/assessments/assignment/create" element={<AssignmentCreator />} />
            <Route path="/grading" element={<SubmissionInbox />} />
            <Route path="/grading/:id" element={<ManualGrader />} />
            <Route path="/announcements" element={<AnnouncementManager />} />
            <Route path="*" element={<div style={{ textAlign: 'center', marginTop: '100px', opacity: 0.3 }}><BookOpen size={64} style={{ margin: '0 auto 24px' }} /><h3>Section under development</h3></div>} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
