import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../../components/common/GlassCard';
import { GlassButton } from '../../../components/common/GlassButton';
import { GlassSelect } from '../../../components/common/GlassSelect';
import { 
    BookOpen, 
    CheckCircle, 
    XCircle, 
    Eye, 
    Search, 
    Filter,
    Clock,
    User,
    ChevronRight,
    PlayCircle,
    FileText,
    Layers,
    AlertCircle,
    Check
} from 'lucide-react';
import api from '../../../services/api';

export const CourseModeration = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('pending');
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [showPreview, setShowPreview] = useState(false);

    const fetchCourses = async () => {
        setLoading(true);
        try {
            const response = await api.get(`courses/?status=${filterStatus}`);
            setCourses(Array.isArray(response.data) ? response.data : response.data.results || []);
        } catch (error) {
            console.error("Error fetching courses:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, [filterStatus]);

    const handleModeration = async (courseId, action) => {
        try {
            await api.post(`courses/${courseId}/${action}/`);
            fetchCourses();
            if (showPreview) setShowPreview(false);
        } catch (error) {
            console.error(`Error ${action}ing course:`, error);
            alert(`Failed to ${action} course`);
        }
    };

    const openPreview = async (course) => {
        try {
            const response = await api.get(`courses/${course.id}/preview/`);
            setSelectedCourse(response.data);
            setShowPreview(true);
        } catch (error) {
            console.error("Error fetching course details:", error);
        }
    };

    const filteredCourses = courses.filter(course => 
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.instructor_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="animate-fade-in" style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '6px', color: 'white' }}>Course Moderation</h1>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.95rem' }}>Review and approve course submissions to maintain platform quality.</p>
            </div>

            {/* Filters Bar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '24px', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                    <input 
                        className="glass-input" 
                        placeholder="Quick search..." 
                        style={{ paddingLeft: '40px', width: '100%', marginBottom: 0, fontSize: '0.9rem', padding: '10px 10px 10px 40px' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <GlassSelect 
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    style={{ width: '160px' }}
                    options={[
                        { label: 'Pending Review', value: 'pending' },
                        { label: 'Approved', value: 'approved' },
                        { label: 'Rejected', value: 'rejected' }
                    ]}
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                {loading ? (
                    <div style={{ gridColumn: '1/-1', padding: '60px', textAlign: 'center' }}>
                        <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }}>Scanning submission queue...</p>
                    </div>
                ) : filteredCourses.length === 0 ? (
                    <div style={{ gridColumn: '1/-1', padding: '60px', textAlign: 'center', color: 'rgba(255,255,255,0.2)' }}>
                        <BookOpen size={40} style={{ marginBottom: '12px', opacity: 0.1 }} />
                        <p style={{ fontSize: '0.9rem' }}>No courses found in the {filterStatus} queue.</p>
                    </div>
                ) : (
                    filteredCourses.map((course) => (
                        <GlassCard key={course.id} heavy style={{ padding: '0', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <div style={{ position: 'relative', height: '140px', overflow: 'hidden' }}>
                                <img 
                                    src={course.thumbnail || 'https://via.placeholder.com/400x200?text=Course+Thumbnail'} 
                                    alt={course.title}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }}
                                />
                                <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                                    <span style={{ 
                                        padding: '4px 10px', 
                                        borderRadius: '12px', 
                                        background: 'rgba(0,0,0,0.7)', 
                                        backdropFilter: 'blur(8px)',
                                        color: 'white',
                                        fontSize: '0.7rem',
                                        fontWeight: 700,
                                        border: '1px solid rgba(255,255,255,0.15)'
                                    }}>
                                        ${course.price}
                                    </span>
                                </div>
                            </div>
                            <div style={{ padding: '16px' }}>
                                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'white', marginBottom: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{course.title}</h3>
                                
                                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}>
                                        <User size={12} /> {course.instructor_name}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}>
                                        <Clock size={12} /> {new Date(course.created_at).toLocaleDateString()}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button 
                                        onClick={() => openPreview(course)}
                                        style={{ 
                                            flex: 1,
                                            padding: '8px', 
                                            borderRadius: '10px', 
                                            background: 'rgba(255,255,255,0.04)', 
                                            color: 'white', 
                                            border: '1px solid rgba(255,255,255,0.08)',
                                            fontWeight: 600,
                                            fontSize: '0.85rem',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '6px',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                                    >
                                        <Eye size={16} /> Inspect
                                    </button>
                                    
                                    {filterStatus === 'pending' && (
                                        <>
                                            <button 
                                                title="Approve"
                                                onClick={() => handleModeration(course.id, 'approve')}
                                                style={{ 
                                                    padding: '8px 12px', 
                                                    borderRadius: '10px', 
                                                    background: 'rgba(16, 185, 129, 0.1)', 
                                                    color: '#10b981', 
                                                    border: 'none',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <CheckCircle size={18} />
                                            </button>
                                            <button 
                                                title="Reject"
                                                onClick={() => handleModeration(course.id, 'reject')}
                                                style={{ 
                                                    padding: '8px 12px', 
                                                    borderRadius: '10px', 
                                                    background: 'rgba(255, 69, 58, 0.1)', 
                                                    color: '#ff453a', 
                                                    border: 'none',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <XCircle size={18} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </GlassCard>
                    ))
                )}
            </div>

            {/* Course Preview Modal */}
            {showPreview && selectedCourse && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.8)',
                    backdropFilter: 'blur(15px)',
                    zIndex: 3000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                }} onClick={() => setShowPreview(false)}>
                    <GlassCard heavy style={{ 
                        width: '100%', 
                        maxWidth: '900px', 
                        maxHeight: '85vh', 
                        overflowY: 'auto', 
                        padding: 0,
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '24px'
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ position: 'relative', height: '220px' }}>
                            <img src={selectedCourse.thumbnail || 'https://via.placeholder.com/1000x400'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px', background: 'linear-gradient(transparent, rgba(0,0,0,0.95))' }}>
                                <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'white', marginBottom: '4px' }}>{selectedCourse.title}</h2>
                                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>by {selectedCourse.instructor_name}</p>
                            </div>
                            <button 
                                onClick={() => setShowPreview(false)}
                                style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <XCircle size={20} />
                            </button>
                        </div>
                        
                        <div style={{ padding: '24px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px' }}>
                                <div style={{ borderRight: '1px solid rgba(255,255,255,0.05)', paddingRight: '16px' }}>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <FileText size={18} color="var(--accent-blue)" /> Syllabus Preview
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {selectedCourse.modules?.map((module, idx) => (
                                            <div key={module.id} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.8)' }}>
                                                    <Layers size={14} opacity={0.4} /> M{idx + 1}: {module.title}
                                                </h4>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    {module.lessons?.map((lesson) => (
                                                        <div key={lesson.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.01)', borderRadius: '8px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                <PlayCircle size={14} opacity={0.3} />
                                                                {lesson.title}
                                                            </div>
                                                            <span style={{ fontSize: '0.75rem', opacity: 0.2 }}>{Math.floor(lesson.duration / 60)}m</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div style={{ padding: '20px', borderRadius: '20px', background: 'rgba(0,132,255,0.03)', border: '1px solid rgba(0,132,255,0.08)' }}>
                                        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <AlertCircle size={16} color="var(--accent-blue)" /> Verification
                                        </h4>
                                        <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                                            Check course content, video quality, and ensure the price matches platform standards.
                                        </p>
                                    </div>

                                    <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <button 
                                            onClick={() => handleModeration(selectedCourse.id, 'approve')}
                                            style={{ 
                                                width: '100%', 
                                                padding: '14px', 
                                                borderRadius: '12px', 
                                                background: 'linear-gradient(135deg, #10b981, #059669)', 
                                                color: 'white', 
                                                border: 'none', 
                                                fontWeight: 700, 
                                                fontSize: '0.95rem',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px',
                                                boxShadow: '0 8px 16px rgba(16, 185, 129, 0.15)'
                                            }}
                                        >
                                            <Check size={18} /> Approve Course
                                        </button>
                                        <button 
                                            onClick={() => handleModeration(selectedCourse.id, 'reject')}
                                            style={{ 
                                                width: '100%', 
                                                padding: '14px', 
                                                borderRadius: '12px', 
                                                background: 'rgba(255, 69, 58, 0.05)', 
                                                color: '#ff453a', 
                                                border: '1px solid rgba(255, 69, 58, 0.1)', 
                                                fontWeight: 600, 
                                                fontSize: '0.9rem',
                                                cursor: 'pointer' 
                                            }}
                                        >
                                            Send Back for Revision
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            )}
        </div>
    );
};
