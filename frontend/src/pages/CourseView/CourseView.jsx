import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { GlassCard } from '../../components/common/GlassCard';
import { GlassButton } from '../../components/common/GlassButton';
import { PlayCircle, HelpCircle, FileText, Menu, X, ArrowLeft, Loader, CheckCircle, Clock, Download, ChevronRight, Award, Globe, Linkedin, MessageSquare } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { QuizView } from './QuizView';
import { AssignmentView } from './AssignmentView';
import { ReviewSection } from './ReviewSection';
import { StrictVideoPlayer } from './StrictVideoPlayer';
import { CommentSection } from './CommentSection';

const CourseView = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
    const [expandedModules, setExpandedModules] = useState({});
    const isMobile = window.innerWidth <= 768;

    const toggleModule = (id) => {
        setExpandedModules(prev => ({ ...prev, [id]: !prev[id] }));
    };

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
    const [courseProgress, setCourseProgress] = useState(0);
    const [progressUpdating, setProgressUpdating] = useState(false);


    // Sync active item and completed lessons
    useEffect(() => {
        if (course && progressData) {
            setCourseProgress(course.progress || 0);
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
                
                // Expand first module by default
                if (course.modules[0]) {
                    setExpandedModules(prev => ({ ...prev, [course.modules[0].id]: true }));
                }
            }
        }
    }, [course, progressData, activeItem]);

    const loading = courseLoading || progressLoading;
    const hasError = courseError || progressError;

    if (loading || hasError) return (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f5f7fa', color: '#64748b', textAlign: 'center', padding: '40px' }}>
            {hasError ? (
                <>
                    <HelpCircle size={48} color="#FF453A" style={{ marginBottom: '16px' }} />
                    <h2 style={{ color: '#1a1a2e', marginBottom: '8px' }}>Classroom Access Error</h2>
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
    
    if (!course) return <div style={{ padding: '40px', textAlign: 'center', color: '#1a1a2e' }}>Course not found.</div>;

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
            
            setCourseProgress(progress_percentage);
            
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
                <div style={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
                    {/* Video Container */}
                    <div style={{ padding: isMobile ? '16px' : '32px 48px 0', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
                        <div style={{ 
                            width: '100%', 
                            background: '#0a0a0a', 
                            borderRadius: '24px',
                            overflow: 'hidden',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.05)',
                            aspectRatio: isMobile ? '16/9' : '21/9',
                            display: 'flex',
                            position: 'relative'
                        }}>
                            {activeItem.video_url ? (
                                <StrictVideoPlayer 
                                    src={activeItem.video_url} 
                                    onComplete={handleToggleComplete} 
                                    lessonId={activeItem.id} 
                                />
                            ) : (
                                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1e293b, #0f172a)' }}>
                                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '24px', borderRadius: '24px', marginBottom: '24px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                        <FileText size={48} color="#0A84FF" />
                                    </div>
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', marginBottom: '8px' }}>Interactive Lab Session</h3>
                                    <p style={{ color: '#94a3b8', fontSize: '1rem', maxWidth: '400px', textAlign: 'center' }}>Complete the technical exercises outlined in the project specifications below to proceed.</p>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Lesson Details */}
                    <div style={{ padding: isMobile ? '24px 16px' : '48px', maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
                        <div style={{ marginBottom: '40px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0A84FF', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
                                <Clock size={16} /> Technical Session
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px', flexDirection: isMobile ? 'column' : 'row' }}>
                                <h2 style={{ fontSize: isMobile ? '1.8rem' : '2.8rem', fontWeight: 900, color: '#1a1a2e', lineHeight: 1.1, letterSpacing: '-0.02em', flex: 1 }}>{activeItem.title}</h2>
                                <GlassButton 
                                    onClick={() => handleToggleComplete(activeItem.id)}
                                    disabled={progressUpdating}
                                    style={{ 
                                        borderRadius: '14px', 
                                        padding: '12px 24px', 
                                        fontSize: '0.9rem',
                                        fontWeight: 700,
                                        background: completedLessons.includes(activeItem.id) ? 'rgba(48, 209, 88, 0.1)' : 'white',
                                        borderColor: completedLessons.includes(activeItem.id) ? '#30D158' : '#e2e8f0',
                                        color: completedLessons.includes(activeItem.id) ? '#30D158' : '#1a1a2e',
                                        boxShadow: completedLessons.includes(activeItem.id) ? 'none' : '0 4px 12px rgba(0,0,0,0.05)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    {completedLessons.includes(activeItem.id) ? <CheckCircle size={18} /> : <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid #cbd5e1' }} />}
                                    {completedLessons.includes(activeItem.id) ? "Lesson Completed" : "Mark as Complete"}
                                </GlassButton>
                            </div>
                            
                            {/* Graduation Call to Action */}
                            {courseProgress === 100 && (
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
                                        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>You have successfully graduated from this track.</p>
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
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1a1a2e', marginBottom: '20px' }}>Learning Objectives</h3>
                                    <div style={{ color: '#64748b', lineHeight: 1.8, fontSize: '1rem' }}>
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
                                    <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1a1a2e', marginBottom: '20px', textTransform: 'uppercase' }}>Resources</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <div style={{ padding: '12px 16px', background: 'rgba(0, 0, 0, 0.03)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <FileText size={18} color="rgba(255,255,255,0.4)" />
                                                <span style={{ fontSize: '0.9rem' }}>Project_Spec.pdf</span>
                                            </div>
                                            <Download size={16} color="#0A84FF" />
                                        </div>
                                        <div style={{ padding: '12px 16px', background: 'rgba(0, 0, 0, 0.03)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <FileText size={18} color="rgba(255,255,255,0.4)" />
                                                <span style={{ fontSize: '0.9rem' }}>Source_Code.zip</span>
                                            </div>
                                            <Download size={16} color="#0A84FF" />
                                        </div>
                                    </div>
                                </GlassCard>
                                
                                <GlassCard style={{ padding: '24px', borderRadius: '24px' }}>
                                    <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1a1a2e', marginBottom: '16px' }}>Course Instructor</h4>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(10, 132, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                            {course.instructor_picture ? (
                                                <img src={course.instructor_picture} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0A84FF' }}>
                                                    {course.instructor_name?.[0] || 'K'}
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1a1a2e' }}>{course.instructor_name}</p>
                                            <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>{course.instructor_title || 'Expert Instructor'}</p>
                                            
                                            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                                {course.instructor_website && (
                                                    <a href={course.instructor_website} target="_blank" rel="noopener noreferrer" style={{ color: '#94a3b8', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#0A84FF'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}>
                                                        <Globe size={14} />
                                                    </a>
                                                )}
                                                {course.instructor_linkedin && (
                                                    <a href={course.instructor_linkedin} target="_blank" rel="noopener noreferrer" style={{ color: '#94a3b8', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#0A84FF'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}>
                                                        <Linkedin size={14} />
                                                    </a>
                                                )}
                                                <Link to="/chat" style={{ color: '#94a3b8', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#30D158'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}>
                                                    <MessageSquare size={14} />
                                                </Link>
                                            </div>
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
        <div style={{ display: 'flex', height: '100vh', background: '#f5f7fa', color: '#1a1a2e', overflow: 'hidden', position: 'relative' }}>
            
            {/* Mobile Navigation Header */}
            {!sidebarOpen && (
                <div style={{ 
                    position: 'absolute', top: 0, left: 0, right: 0, height: '64px', 
                    background: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(30px)', zIndex: 40,
                    display: 'flex', alignItems: 'center', padding: '0 20px', borderBottom: '1px solid rgba(0, 0, 0, 0.06)'
                }}>
                    <button onClick={() => setSidebarOpen(true)} style={{ background: 'transparent', border: 'none', color: '#1a1a2e', cursor: 'pointer' }}>
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
                background: 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(40px)',
                borderRight: '1px solid rgba(0, 0, 0, 0.06)',
                display: sidebarOpen ? 'flex' : 'none',
                flexDirection: 'column',
                position: isMobile ? 'fixed' : 'relative',
                zIndex: 100, inset: 0,
                boxShadow: '4px 0 24px rgba(0,0,0,0.02)'
            }}>
                <div style={{ padding: '32px 24px', borderBottom: '1px solid rgba(0, 0, 0, 0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ overflow: 'hidden' }}>
                        <h4 style={{ fontSize: '0.75rem', fontWeight: 900, color: '#0A84FF', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Academy Player</h4>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1a1a2e', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{course.title}</h3>
                    </div>
                    {(isMobile || !isMobile) && (
                        <button onClick={() => setSidebarOpen(false)} style={{ background: 'rgba(0, 0, 0, 0.03)', border: 'none', color: '#64748b', padding: '8px', borderRadius: '10px', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.06)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.03)'}>
                            <X size={20} />
                        </button>
                    )}
                </div>
                
                {/* Course Progress Section */}
                <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid rgba(0, 0, 0, 0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1a1a2e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Course Progress</span>
                        <span style={{ fontSize: '0.9rem', fontWeight: 900, color: '#0A84FF' }}>{Math.round(courseProgress)}%</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${courseProgress}%`, height: '100%', background: 'linear-gradient(90deg, #0A84FF, #30D158)', borderRadius: '4px', transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1)' }} />
                    </div>
                    <div style={{ marginTop: '12px', fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                        <CheckCircle size={14} color="#30D158" /> {completedLessons.length} Lessons Completed
                    </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>
                    {course.modules?.map((module, mIdx) => {
                        const isExpanded = expandedModules[module.id];
                        return (
                            <div key={module.id} style={{ marginBottom: '8px' }}>
                                <div 
                                    onClick={() => toggleModule(module.id)}
                                    style={{ 
                                        padding: '16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        borderRadius: '16px', transition: 'background 0.2s ease'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.02)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    <div>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#0A84FF', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            📚 WEEK {mIdx + 1}
                                        </div>
                                        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1a1a2e' }}>{module.title}</div>
                                    </div>
                                    <ChevronRight size={18} color="#94a3b8" style={{ transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }} />
                                </div>
                                
                                <div style={{ 
                                    overflow: 'hidden', 
                                    maxHeight: isExpanded ? '1000px' : '0', 
                                    transition: 'max-height 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease',
                                    opacity: isExpanded ? 1 : 0,
                                    padding: isExpanded ? '4px 8px 12px' : '0 8px'
                                }}>
                                    {module.lessons?.map((lesson) => {
                                        const isActive = activeItem?.id === lesson.id && activeItem?.type === 'lesson';
                                        const isCompleted = completedLessons.includes(lesson.id);
                                        return (
                                            <div 
                                                key={lesson.id}
                                                onClick={() => selectItem(lesson, 'lesson')}
                                                style={{ 
                                                    padding: '12px 16px', display: 'flex', gap: '14px', cursor: 'pointer',
                                                    background: isActive ? '#f0f7ff' : 'transparent',
                                                    borderRadius: '12px',
                                                    marginBottom: '4px',
                                                    transition: 'all 0.2s ease',
                                                    alignItems: 'center'
                                                }}
                                                onMouseEnter={e => !isActive && (e.currentTarget.style.background = 'rgba(0,0,0,0.02)')}
                                                onMouseLeave={e => !isActive && (e.currentTarget.style.background = 'transparent')}
                                            >
                                                <div style={{ 
                                                    width: '28px', height: '28px', borderRadius: '10px', 
                                                    background: isCompleted ? 'rgba(48, 209, 88, 0.15)' : isActive ? '#0A84FF' : 'rgba(0,0,0,0.04)', 
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    flexShrink: 0 
                                                }}>
                                                    {isCompleted ? <CheckCircle size={14} color="#30D158" /> : <PlayCircle size={14} color={isActive ? 'white' : '#94a3b8'} />}
                                                </div>
                                                <span style={{ fontSize: '0.9rem', color: isActive ? '#0A84FF' : '#1a1a2e', fontWeight: (isActive || isCompleted) ? 700 : 500, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {lesson.title}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div style={{ padding: '24px', borderTop: '1px solid rgba(0, 0, 0, 0.04)' }}>
                    <button 
                        onClick={() => navigate('/dashboard')}
                        style={{ width: '100%', padding: '14px', borderRadius: '16px', background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', color: '#1a1a2e', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'all 0.2s ease' }}
                        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.06)'}
                        onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.03)'}
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
