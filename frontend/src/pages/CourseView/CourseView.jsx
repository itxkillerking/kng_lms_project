import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { GlassCard } from '../../components/common/GlassCard';
import { GlassButton } from '../../components/common/GlassButton';
import { PlayCircle, HelpCircle, FileText, Menu, X, ArrowLeft, Loader, CheckCircle, Clock, Download, ChevronRight, Award } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { QuizView } from './QuizView';
import { AssignmentView } from './AssignmentView';
import { ReviewSection } from './ReviewSection';

const CourseView = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // Handle window resizing
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 1024) setSidebarOpen(true);
            else if (window.innerWidth <= 768) setSidebarOpen(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    
    // Queries for robust data fetching
    const { data: course, isLoading: courseLoading, error: courseError, refetch: refetchCourse } = useQuery({
        queryKey: ['course', id],
        queryFn: async () => {
            const res = await api.get(`courses/${id}/`);
            return res.data;
        }
    });

    const { data: progressData = [], isLoading: progressLoading, error: progressError, refetch: refetchProgress } = useQuery({
        queryKey: ['my-progress'],
        queryFn: async () => {
            const res = await api.get('progress/');
            return Array.isArray(res.data) ? res.data : (res.data.results || []);
        }
    });

    const handleRetry = () => {
        refetchCourse();
        refetchProgress();
    };

    const [activeItem, setActiveItem] = useState(null);
    const [completedLessons, setCompletedLessons] = useState([]);
    const [progressUpdating, setProgressUpdating] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
    const isMobile = window.innerWidth <= 768;

    // Sync active item and completed lessons
    useEffect(() => {
        if (course && progressData) {
            const completedIds = progressData
                .filter(p => p.is_complete && course.modules?.some(m => m.lessons.some(l => l.id === p.lesson)))
                .map(p => p.lesson);
            setCompletedLessons(completedIds);
            
            if (!activeItem && course.modules?.length > 0) {
                for (const module of course.modules) {
                    if (module.lessons?.length > 0) {
                        setActiveItem({ ...module.lessons[0], type: 'lesson' });
                        break;
                    }
                }
            }
        }
    }, [course, progressData, activeItem]);

    const loading = courseLoading || progressLoading;
    const hasError = courseError || progressError;

    if (loading || hasError) return (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#040407', color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '40px' }}>
            {hasError ? (
                <>
                    <HelpCircle size={48} color="#FF453A" style={{ marginBottom: '16px' }} />
                    <h2 style={{ color: 'white', marginBottom: '8px' }}>Classroom Access Error</h2>
                    <p style={{ marginBottom: '24px' }}>We couldn't load the course materials. Please check your connection.</p>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <GlassButton onClick={() => navigate('/dashboard')} style={{ borderRadius: '12px' }}>
                            Go to Dashboard
                        </GlassButton>
                        <GlassButton onClick={handleRetry} style={{ borderRadius: '12px' }}>
                            Retry Loading
                        </GlassButton>
                    </div>
                </>
            ) : (
                <>
                    <Loader className="animate-spin" size={48} color="#0A84FF" />
                    <p style={{ marginTop: '16px' }}>Entering classroom...</p>
                </>
            )}
        </div>
    );
    
    if (!course) return <div style={{ padding: '40px', textAlign: 'center', color: 'white' }}>Course not found.</div>;

    const selectItem = (item, type) => {
        setActiveItem({ ...item, type });
        if (window.innerWidth <= 1024) {
            setSidebarOpen(false);
        }
    };

    const handleToggleComplete = async (lessonId) => {
        if (progressUpdating) return;
        setProgressUpdating(true);
        try {
            const response = await api.post('progress/toggle_complete/', { lesson_id: lessonId });
            const { is_complete, progress_percentage, certificate_generated } = response.data;
            
            if (is_complete) {
                setCompletedLessons(prev => [...prev, lessonId]);
            } else {
                setCompletedLessons(prev => prev.filter(id => id !== lessonId));
            }

            if (certificate_generated) {
                alert("CONGRATULATIONS! You have graduated from this course. Your professional certificate has been generated!");
            }
        } catch (error) {
            console.error("Error updating progress:", error);
        } finally {
            setProgressUpdating(false);
        }
    };

    const renderMainContent = () => {
        if (!activeItem) return <div style={{ padding: '40px', textAlign: 'center' }}>Select a lesson</div>;

        if (activeItem.type === 'lesson') {
            return (
                <div style={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {/* Video Container */}
                    <div style={{ 
                        width: '100%', 
                        background: '#000', 
                        aspectRatio: isMobile ? '16/9' : '21/9',
                        display: 'flex',
                        position: 'relative',
                        borderBottom: '1px solid rgba(255,255,255,0.05)'
                    }}>
                        {activeItem.video_url ? (
                            <StrictVideoPlayer 
                                src={activeItem.video_url} 
                                onComplete={handleToggleComplete} 
                                lessonId={activeItem.id} 
                            />
                        ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.1)' }}>
                                <PlayCircle size={64} style={{ opacity: 0.2, marginBottom: '16px' }} />
                                <p style={{ fontWeight: 600 }}>Interactive Lab / Technical Document</p>
                            </div>
                        )}
                    </div>
                    
                    {/* Lesson Details */}
                    <div style={{ padding: isMobile ? '24px 20px' : '48px', maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
                        <div style={{ marginBottom: '40px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0A84FF', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
                                <Clock size={16} /> Technical Session
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px', flexDirection: isMobile ? 'column' : 'row' }}>
                                <h2 style={{ fontSize: isMobile ? '1.8rem' : '2.8rem', fontWeight: 900, color: 'white', lineHeight: 1.1, letterSpacing: '-0.02em', flex: 1 }}>{activeItem.title}</h2>
                                <GlassButton 
                                    onClick={() => handleToggleComplete(activeItem.id)}
                                    disabled={progressUpdating}
                                    style={{ 
                                        borderRadius: '14px', 
                                        padding: '12px 24px', 
                                        fontSize: '0.9rem',
                                        background: completedLessons.includes(activeItem.id) ? 'rgba(48, 209, 88, 0.1)' : 'rgba(255,255,255,0.03)',
                                        borderColor: completedLessons.includes(activeItem.id) ? '#30D158' : 'rgba(255,255,255,0.1)',
                                        color: completedLessons.includes(activeItem.id) ? '#30D158' : 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px'
                                    }}
                                >
                                    {completedLessons.includes(activeItem.id) ? <CheckCircle size={18} /> : <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.2)' }} />}
                                    {completedLessons.includes(activeItem.id) ? "Lesson Completed" : "Mark as Complete"}
                                </GlassButton>
                            </div>
                            
                            {/* Graduation Call to Action */}
                            {(course.progress === 100 || (completedLessons.length / course.total_lessons >= 1)) && (
                                <GlassCard style={{ 
                                    marginTop: '24px', 
                                    padding: '24px', 
                                    borderRadius: '20px', 
                                    background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1), rgba(0,0,0,0))',
                                    border: '1px solid rgba(212, 175, 55, 0.2)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    flexDirection: isMobile ? 'column' : 'row',
                                    gap: '20px'
                                }}>
                                    <div>
                                        <h3 style={{ color: '#D4AF37', fontWeight: 800, marginBottom: '4px' }}>Course Mastery Achieved</h3>
                                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>You have successfully graduated from this track.</p>
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        padding: '12px 20px',
                                        borderRadius: '12px',
                                        background: 'rgba(212, 175, 55, 0.05)',
                                        border: '1px solid rgba(212, 175, 55, 0.2)',
                                        color: '#D4AF37',
                                        fontSize: '0.9rem',
                                        fontWeight: 700
                                    }}>
                                        <Award size={18} />
                                        <span>Certificate will be emailed soon</span>
                                    </div>
                                </GlassCard>
                            )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap: '40px' }}>
                            {/* Description & Resources */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                                <GlassCard style={{ padding: '32px', borderRadius: '28px' }}>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'white', marginBottom: '20px' }}>Learning Objectives</h3>
                                    <div style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.8, fontSize: '1rem' }}>
                                        {activeItem.description || "Master the core concepts presented in this module with production-focused examples and architectures."}
                                    </div>
                                </GlassCard>

                                <div style={{ marginTop: '20px' }}>
                                    <CommentSection lessonId={activeItem.id} />
                                </div>
                            </div>
...
                            {/* Sidebar / Resources */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <GlassCard style={{ padding: '24px', borderRadius: '24px', border: '1px solid rgba(10, 132, 255, 0.1)' }}>
                                    <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'white', marginBottom: '20px', textTransform: 'uppercase' }}>Resources</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <FileText size={18} color="rgba(255,255,255,0.4)" />
                                                <span style={{ fontSize: '0.9rem' }}>Project_Spec.pdf</span>
                                            </div>
                                            <Download size={16} color="#0A84FF" />
                                        </div>
                                        <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <FileText size={18} color="rgba(255,255,255,0.4)" />
                                                <span style={{ fontSize: '0.9rem' }}>Source_Code.zip</span>
                                            </div>
                                            <Download size={16} color="#0A84FF" />
                                        </div>
                                    </div>
                                </GlassCard>
                                
                                <GlassCard style={{ padding: '24px', borderRadius: '24px' }}>
                                    <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'white', marginBottom: '16px' }}>Course Instructor</h4>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(10, 132, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 800, color: '#0A84FF' }}>K</div>
                                        <div>
                                            <p style={{ fontWeight: 700, fontSize: '0.95rem' }}>KNG Expert</p>
                                            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>Senior Software Architect</p>
                                        </div>
                                    </div>
                                </GlassCard>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        if (activeItem.type === 'quiz') return <QuizView quiz={activeItem} />;
        if (activeItem.type === 'assignment') return <AssignmentView assignment={activeItem} />;
    };

    return (
        <div style={{ display: 'flex', height: '100vh', background: '#040407', color: 'white', overflow: 'hidden', position: 'relative' }}>
            
            {/* Mobile Navigation Header */}
            {!sidebarOpen && (
                <div style={{ 
                    position: 'absolute', top: 0, left: 0, right: 0, height: '64px', 
                    background: 'rgba(5,5,10,0.85)', backdropFilter: 'blur(30px)', zIndex: 40,
                    display: 'flex', alignItems: 'center', padding: '0 20px', borderBottom: '1px solid rgba(255,255,255,0.05)'
                }}>
                    <button onClick={() => setSidebarOpen(true)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
                        <Menu size={24} />
                    </button>
                    <span style={{ marginLeft: '16px', fontWeight: 800, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{course.title}</span>
                </div>
            )}

            {/* Premium Curriculum Sidebar */}
            <div style={{ 
                width: isMobile ? '100%' : '380px',
                minWidth: isMobile ? '100%' : '380px',
                height: '100%',
                background: 'rgba(10,10,15,0.95)',
                backdropFilter: 'blur(40px)',
                borderRight: '1px solid rgba(255,255,255,0.05)',
                display: sidebarOpen ? 'flex' : 'none',
                flexDirection: 'column',
                position: isMobile ? 'fixed' : 'relative',
                zIndex: 100, inset: 0
            }}>
                <div style={{ padding: '32px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ overflow: 'hidden' }}>
                        <h4 style={{ fontSize: '0.75rem', fontWeight: 900, color: '#0A84FF', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Academy Player</h4>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{course.title}</h3>
                    </div>
                    {(isMobile || !isMobile) && (
                        <button onClick={() => setSidebarOpen(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'rgba(255,255,255,0.4)', padding: '8px', borderRadius: '10px', cursor: 'pointer' }}>
                            <X size={20} />
                        </button>
                    )}
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0' }}>
                    {course.modules?.map((module, mIdx) => (
                        <div key={module.id} style={{ marginBottom: '8px' }}>
                            <div style={{ padding: '16px 24px 8px', fontSize: '0.75rem', fontWeight: 900, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
                                {mIdx + 1}. {module.title}
                            </div>
                            
                            {module.lessons?.map((lesson) => {
                                const isActive = activeItem?.id === lesson.id && activeItem?.type === 'lesson';
                                return (
                                    <div 
                                        key={lesson.id}
                                        onClick={() => selectItem(lesson, 'lesson')}
                                        style={{ 
                                            padding: '14px 24px', display: 'flex', gap: '16px', cursor: 'pointer',
                                            background: isActive ? 'rgba(10, 132, 255, 0.08)' : 'transparent',
                                            borderLeft: isActive ? '3px solid #0A84FF' : '3px solid transparent',
                                            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                                        }}
                                        onMouseEnter={e => !isActive && (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                                        onMouseLeave={e => !isActive && (e.currentTarget.style.background = 'transparent')}
                                    >
                                        <div style={{ 
                                            width: '24px', height: '24px', borderRadius: '8px', 
                                            background: completedLessons.includes(lesson.id) ? '#30D158' : isActive ? '#0A84FF' : 'rgba(255,255,255,0.05)', 
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0 
                                        }}>
                                            {completedLessons.includes(lesson.id) ? <CheckCircle size={14} color="white" /> : <PlayCircle size={14} color={isActive ? 'white' : 'rgba(255,255,255,0.2)'} />}
                                        </div>
                                        <span style={{ fontSize: '0.9rem', color: isActive ? 'white' : 'rgba(255,255,255,0.6)', fontWeight: (isActive || completedLessons.includes(lesson.id)) ? 700 : 500, flex: 1 }}>{lesson.title}</span>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>

                <div style={{ padding: '24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <button 
                        onClick={() => navigate('/dashboard')}
                        style={{ width: '100%', padding: '14px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'all 0.3s' }}
                    >
                        <ArrowLeft size={18} /> Exit Classroom
                    </button>
                </div>
            </div>

            {/* Content Display */}
            <div style={{ flex: 1, height: '100%', overflowY: 'auto', paddingTop: (isMobile && !sidebarOpen) ? '64px' : 0 }}>
                {renderMainContent()}
            </div>
        </div>
    );
};

export default CourseView;
