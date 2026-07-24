import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../../components/common/GlassCard';
import { GlassButton } from '../../../components/common/GlassButton';
import { Megaphone, Plus, Trash2, Edit2, Send, Clock, BookOpen, AlertCircle, ChevronDown } from 'lucide-react';
import api from '../../../services/api';

export const AnnouncementManager = () => {
    const [courses, setCourses] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [showCourseDropdown, setShowCourseDropdown] = useState(false);
    
    const [formData, setFormData] = useState({
        course: '',
        title: '',
        content: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [courseRes, annRes] = await Promise.all([
                api.get('courses/?instructor=me'),
                api.get('announcements/')
            ]);
            
            const fetchedCourses = Array.isArray(courseRes.data) ? courseRes.data : courseRes.data.results || [];
            setCourses(fetchedCourses);
            
            // Only show announcements for courses owned by this instructor
            const instructorCourseIds = fetchedCourses.map(c => c.id);
            const filteredAnn = (Array.isArray(annRes.data) ? annRes.data : annRes.data.results || [])
                .filter(a => instructorCourseIds.includes(a.course));
            
            setAnnouncements(filteredAnn);
            if (fetchedCourses.length > 0 && !formData.course) {
                setFormData(prev => ({ ...prev, course: fetchedCourses[0].id }));
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editingId) {
                await api.patch(`announcements/${editingId}/`, formData);
            } else {
                await api.post('announcements/', formData);
            }
            setShowModal(false);
            setEditingId(null);
            setFormData({ course: courses[0]?.id || '', title: '', content: '' });
            fetchData();
        } catch (err) {
            alert("Failed to save announcement");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (ann) => {
        setEditingId(ann.id);
        setFormData({
            course: ann.course,
            title: ann.title,
            content: ann.content
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this announcement?")) return;
        try {
            await api.delete(`announcements/${id}/`);
            fetchData();
        } catch (err) {
            alert("Failed to delete announcement");
        }
    };

    if (loading && announcements.length === 0) return <div style={{ color: 'var(--text-secondary)', padding: '40px' }}>Loading Announcements...</div>;

    return (
        <div className="animate-fade-in" style={{ padding: '0 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '56px', flexWrap: 'wrap', gap: '24px' }}>
                <div>
                    <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 3.5rem)', fontWeight: 800, marginBottom: '16px', color: '#1a1a2e', letterSpacing: '-0.02em' }}>Announcements</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', maxWidth: '600px', lineHeight: '1.6' }}>Broadcast important updates, bulletins, and news to your students instantly.</p>
                </div>
                <GlassButton className="primary" onClick={() => setShowModal(true)} style={{ gap: '12px', padding: '14px 28px', fontSize: '1rem' }}>
                    <Plus size={20} /> New Broadcast
                </GlassButton>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {announcements.length === 0 ? (
                    <GlassCard style={{ padding: '80px 40px', textAlign: 'center', background: 'rgba(0, 0, 0, 0.01)' }}>
                        <div style={{ opacity: 0.2, marginBottom: '24px' }}><Megaphone size={64} /></div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '12px' }}>No Announcements Yet</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>Keep your students engaged by sharing the latest updates.</p>
                    </GlassCard>
                ) : announcements.map(ann => (
                    <GlassCard key={ann.id} style={{ padding: '32px', borderLeft: '4px solid var(--accent-blue)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '0.1em', background: 'rgba(10, 132, 255, 0.1)', padding: '4px 12px', borderRadius: '20px' }}>
                                        {courses.find(c => c.id === ann.course)?.title || 'Course'}
                                    </span>
                                    <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }}></div>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Clock size={14} /> {new Date(ann.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                </div>
                                <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1a1a2e', letterSpacing: '-0.01em' }}>{ann.title}</h3>
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button onClick={() => handleEdit(ann)} style={{ background: 'rgba(0, 0, 0, 0.03)', border: 'none', color: '#475569', padding: '10px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'white'; }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}><Edit2 size={18} /></button>
                                <button onClick={() => handleDelete(ann.id)} style={{ background: 'rgba(255,69,58,0.05)', border: 'none', color: 'rgba(255,69,58,0.6)', padding: '10px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,69,58,0.15)'; e.currentTarget.style.color = '#ff453a'; }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,69,58,0.05)'; e.currentTarget.style.color = 'rgba(255,69,58,0.6)'; }}><Trash2 size={18} /></button>
                            </div>
                        </div>
                        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.05rem', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{ann.content}</p>
                    </GlassCard>
                ))}
            </div>

            {/* Announcement Modal */}
            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(32px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
                    <GlassCard heavy className="animate-fade-in" style={{ width: '100%', maxWidth: '600px', padding: '48px', position: 'relative', overflow: 'visible', border: '1px solid rgba(255,255,255,0.15)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '44px' }}>
                            <div style={{ width: '60px', height: '60px', borderRadius: '18px', background: 'rgba(10, 132, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(10, 132, 255, 0.2)' }}>
                                <Megaphone size={32} color="var(--accent-blue)" />
                            </div>
                            <div>
                                <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#1a1a2e', letterSpacing: '-0.02em', marginBottom: '4px' }}>{editingId ? 'Edit Broadcast' : 'New Broadcast'}</h2>
                                <p style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Instantly notify all enrolled students.</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', position: 'relative' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
                                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Target Course</label>
                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>{loading ? 'Searching...' : `${courses.length} Available`}</span>
                                </div>
                                <div 
                                    className="glass-input" 
                                    style={{ 
                                        cursor: 'pointer', 
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        alignItems: 'center',
                                        background: 'rgba(0, 0, 0, 0.04)',
                                        border: showCourseDropdown ? '1px solid var(--accent-blue)' : '1px solid rgba(255,255,255,0.1)'
                                    }}
                                    onClick={() => setShowCourseDropdown(!showCourseDropdown)}
                                >
                                    <span style={{ color: formData.course ? 'white' : 'rgba(255,255,255,0.4)' }}>
                                        {courses.find(c => String(c.id) === String(formData.course))?.title || 'Select Target Course'}
                                    </span>
                                    <ChevronDown size={20} style={{ transform: showCourseDropdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)', color: 'var(--accent-blue)' }} />
                                </div>
                                
                                {showCourseDropdown && (
                                    <>
                                        {/* Invisible overlay to close dropdown */}
                                        <div 
                                            style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 100 }} 
                                            onClick={(e) => { e.stopPropagation(); setShowCourseDropdown(false); }}
                                        />
                                        <div style={{ 
                                            position: 'absolute', 
                                            top: '100%', 
                                            left: 0, 
                                            right: 0, 
                                            marginTop: '12px',
                                            background: '#1a1a24', 
                                            border: '1px solid rgba(0, 0, 0, 0.1)',
                                            borderRadius: '16px',
                                            zIndex: 999999, // Extreme z-index
                                            minHeight: '80px', // Ensure it has visible height
                                            maxHeight: '260px',
                                            overflowY: 'auto',
                                            boxShadow: '0 40px 80px rgba(0,0,0,0.9)',
                                            padding: '10px'
                                        }}>
                                            {courses.length === 0 ? (
                                                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                                    <BookOpen size={24} style={{ opacity: 0.3, marginBottom: '8px' }} />
                                                    <p>No active courses found.</p>
                                                    <p style={{ fontSize: '0.75rem', marginTop: '4px' }}>Please create a course first.</p>
                                                </div>
                                            ) : (
                                                courses.map(c => (
                                                    <div 
                                                        key={c.id} 
                                                        style={{ 
                                                            padding: '14px 20px', 
                                                            cursor: 'pointer',
                                                            borderRadius: '12px',
                                                            color: String(formData.course) === String(c.id) ? 'var(--accent-blue)' : 'white',
                                                            background: String(formData.course) === String(c.id) ? 'rgba(10, 132, 255, 0.15)' : 'transparent',
                                                            transition: 'all 0.2s',
                                                            fontWeight: String(formData.course) === String(c.id) ? 600 : 400
                                                        }}
                                                        onClick={() => {
                                                            setFormData({...formData, course: c.id});
                                                            setShowCourseDropdown(false);
                                                        }}
                                                        onMouseEnter={e => {
                                                            if (String(formData.course) !== String(c.id)) e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                                                        }}
                                                        onMouseLeave={e => {
                                                            if (String(formData.course) !== String(c.id)) e.currentTarget.style.background = 'transparent';
                                                        }}
                                                    >
                                                        {c.title}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Bulletin Title</label>
                                <input 
                                    className="glass-input" 
                                    placeholder="e.g. Workshop Rescheduled or New Material Added"
                                    value={formData.title} 
                                    onChange={e => setFormData({...formData, title: e.target.value})} 
                                    required 
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Message Content</label>
                                <textarea 
                                    className="glass-input" 
                                    style={{ minHeight: '140px', lineHeight: '1.6', resize: 'vertical' }}
                                    placeholder="Write your announcement message here..."
                                    value={formData.content} 
                                    onChange={e => setFormData({...formData, content: e.target.value})} 
                                    required 
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
                                <GlassButton type="button" onClick={() => { setShowModal(false); setEditingId(null); }} style={{ flex: 1, opacity: 0.8 }}>Cancel</GlassButton>
                                <GlassButton type="submit" className="primary" disabled={loading} style={{ flex: 1.5, gap: '12px', fontWeight: 600 }}>
                                    {loading ? 'Processing...' : <><Send size={18} /> {editingId ? 'Update' : 'Schedule'} Broadcast</>}
                                </GlassButton>
                            </div>
                        </form>
                    </GlassCard>
                </div>
            )}
        </div>
    );
};
