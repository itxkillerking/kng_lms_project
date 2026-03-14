import React, { useState, useMemo } from 'react';
import { GlassCard } from '../../../components/common/GlassCard';
import { GlassButton } from '../../../components/common/GlassButton';
import { BookOpen, Users, Edit, Trash2, Plus, ExternalLink, Loader, RefreshCw, ChevronRight } from 'lucide-react';
import api from '../../../services/api';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

export const CourseManager = () => {
    const [page, setPage] = useState(1);
    const [allCourses, setAllCourses] = useState([]);
    
    const { isLoading, isError, data, isFetching } = useQuery({
        queryKey: ['instructor-courses', page],
        queryFn: async () => {
            const response = await api.get(`courses/?instructor=me&page=${page}`);
            return response.data;
        }
    });

    React.useEffect(() => {
        if (data) {
            const results = Array.isArray(data) ? data : data.results || [];
            setAllCourses(prev => {
                const existingIds = new Set(prev.map(c => c.id));
                const uniqueNew = results.filter(c => !existingIds.has(c.id));
                return [...prev, ...uniqueNew];
            });
        }
    }, [data]);

    const hasMore = data && !Array.isArray(data) && data.next !== null;

    if (isLoading && page === 1) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px' }}>
                <Loader className="animate-spin" size={32} color="var(--accent-blue)" />
                <span style={{ marginLeft: '12px', color: 'var(--text-secondary)' }}>Loading your tracks...</span>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '8px' }}>Course Management</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Create and manage the content of your courses.</p>
                </div>
                <Link to="/teacher/courses/create" style={{ textDecoration: 'none' }}>
                    <button className="glass-button primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}>
                        <Plus size={20} /> New Course
                    </button>
                </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                {allCourses.length > 0 ? (
                    allCourses.map(course => (
                        <GlassCard key={course.id} style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ height: '160px', background: course.thumbnail ? `url(${course.thumbnail}) center/cover` : 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))', position: 'relative' }}>
                                <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                                    <div style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}>
                                        {course.modules?.length || 0} Modules
                                    </div>
                                </div>
                            </div>
                            
                            <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px' }}>{course.title}</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {course.description}
                                </p>
                                
                                <div style={{ marginTop: 'auto', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                    <Link to={`/course/${course.id}`} style={{ flex: '1 1 100%', textDecoration: 'none' }}>
                                        <GlassButton style={{ width: '100%', gap: '8px', fontSize: '0.9rem', justifyContent: 'center' }}>
                                            <ExternalLink size={16} /> View Course
                                        </GlassButton>
                                    </Link>
                                    <Link to={`/teacher/courses/${course.id}/content`} style={{ flex: '1', textDecoration: 'none', display: 'flex' }}>
                                        <GlassButton style={{ width: '100%', gap: '8px', fontSize: '0.85rem', borderColor: 'rgba(10, 132, 255, 0.5)', color: 'white', background: 'rgba(10, 132, 255, 0.1)', justifyContent: 'center' }}>
                                            <Edit size={16} /> Manage Content
                                        </GlassButton>
                                    </Link>
                                    <GlassButton style={{ padding: '0 12px', height: '42px', color: 'rgba(255, 69, 58, 0.8)', borderColor: 'rgba(255, 69, 58, 0.3)', background: 'rgba(255, 69, 58, 0.05)', justifyContent: 'center' }}>
                                        <Trash2 size={16} />
                                    </GlassButton>
                                </div>
                            </div>
                        </GlassCard>
                    ))
                ) : !isLoading && (
                    <div style={{ gridColumn: '1 / -1' }}>
                        <GlassCard style={{ padding: '60px', textAlign: 'center' }}>
                            <BookOpen size={48} style={{ opacity: 0.2, marginBottom: '20px' }} />
                            <h3 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>No Courses Yet</h3>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>You haven't created any courses yet. Start your journey by creating your first curriculum!</p>
                            <Link to="/teacher/courses/create">
                                <button className="glass-button primary">Create First Course</button>
                            </Link>
                        </GlassCard>
                    </div>
                )}
            </div>

            {hasMore && (
                <div style={{ marginTop: '40px', textAlign: 'center' }}>
                    <GlassButton 
                        onClick={() => setPage(p => p + 1)} 
                        disabled={isFetching}
                        style={{ padding: '12px 32px', borderRadius: '12px', gap: '8px' }}
                    >
                        {isFetching ? <RefreshCw className="animate-spin" size={18} /> : <span>Load More Courses</span>}
                    </GlassButton>
                </div>
            )}

            {isError && (
                <div style={{ marginTop: '40px', textAlign: 'center', color: '#ff453a' }}>
                    <p>Failed to load courses. Please try again.</p>
                </div>
            )}
        </div>
    );
};
