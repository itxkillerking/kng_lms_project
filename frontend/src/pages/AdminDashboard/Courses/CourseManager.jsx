import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../../components/common/GlassCard';
import { GlassButton } from '../../../components/common/GlassButton';
import { GlassSelect } from '../../../components/common/GlassSelect';
import { 
    Plus, 
    BookOpen, 
    User, 
    Layers, 
    Tag, 
    DollarSign, 
    Image as ImageIcon,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Trash2,
    Edit2
} from 'lucide-react';
import api from '../../../services/api';

export const CourseManager = () => {
    const [courses, setCourses] = useState([]);
    const [instructors, setInstructors] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        price: '0',
        thumbnail: '',
        instructor: '',
        moderation_status: 'approved'
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [coursesRes, instRes, catRes] = await Promise.all([
                api.get('courses/'),
                api.get('courses/instructors/'),
                api.get('categories/')
            ]);
            setCourses(Array.isArray(coursesRes.data) ? coursesRes.data : coursesRes.data.results || []);
            setInstructors(Array.isArray(instRes.data) ? instRes.data : instRes.data.results || []);
            setCategories(Array.isArray(catRes.data) ? catRes.data : catRes.data.results || []);
        } catch (error) {
            console.error("Error fetching admin course data:", error);
            setMessage({ type: 'error', text: 'Failed to load dashboard data.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage({ type: '', text: '' });

        const data = new FormData();
        Object.keys(formData).forEach(key => {
            if (formData[key] !== null && formData[key] !== '') {
                data.append(key, formData[key]);
            }
        });

        try {
            await api.post('courses/', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMessage({ type: 'success', text: 'Course created and assigned successfully!' });
            setShowForm(false);
            setFormData({
                title: '',
                description: '',
                category: '',
                price: '0',
                thumbnail: '',
                instructor: '',
                moderation_status: 'approved'
            });
            fetchData();
        } catch (error) {
            console.error("Error creating course:", error);
            setMessage({ type: 'error', text: error.response?.data?.detail || 'Failed to create course.' });
        } finally {
            setSubmitting(false);
        }
    };

    const deleteCourse = async (id) => {
        if (!window.confirm('Are you sure you want to delete this course?')) return;
        try {
            await api.delete(`courses/${id}/`);
            setCourses(courses.filter(c => c.id !== id));
            setMessage({ type: 'success', text: 'Course deleted successfully.' });
        } catch (error) {
            console.error("Error deleting course:", error);
            const errorMsg = error.response?.data?.detail || error.response?.data?.error || 'Failed to delete course.';
            setMessage({ type: 'error', text: errorMsg });
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                <Loader2 className="animate-spin" size={40} color="var(--accent-blue)" />
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '32px' 
            }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 850, color: '#1a1a2e', letterSpacing: '-0.02em' }}>
                        Course Management
                    </h1>
                    <p style={{ color: '#64748b', marginTop: '4px' }}>
                        Create, assign, and manage courses across the platform.
                    </p>
                </div>
                <GlassButton primary onClick={() => setShowForm(!showForm)}>
                    <Plus size={18} style={{ marginRight: '8px' }} />
                    {showForm ? 'Cancel' : 'New Course'}
                </GlassButton>
            </div>

            {message.text && (
                <div style={{ 
                    padding: '16px', 
                    borderRadius: '12px', 
                    background: message.type === 'success' ? 'rgba(48, 209, 88, 0.1)' : 'rgba(255, 69, 58, 0.1)',
                    border: `1px solid ${message.type === 'success' ? 'rgba(48, 209, 88, 0.2)' : 'rgba(255, 69, 58, 0.2)'}`,
                    color: message.type === 'success' ? '#30D158' : '#FF453A',
                    marginBottom: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                    <span style={{ fontWeight: 600 }}>{message.text}</span>
                </div>
            )}

            {showForm && (
                <GlassCard heavy style={{ padding: '32px', marginBottom: '40px', border: '1px solid rgba(0, 0, 0, 0.08)' }}>
                    <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label className="glass-label">Course Title</label>
                            <input 
                                className="glass-input"
                                value={formData.title}
                                onChange={e => setFormData({...formData, title: e.target.value})}
                                placeholder="e.g., Advanced AI Engineering"
                                required
                            />
                        </div>

                        <div style={{ gridColumn: '1 / -1' }}>
                            <label className="glass-label">Description</label>
                            <textarea 
                                className="glass-input"
                                value={formData.description}
                                onChange={e => setFormData({...formData, description: e.target.value})}
                                placeholder="What will students learn?"
                                style={{ minHeight: '100px' }}
                                required
                            />
                        </div>

                        <div>
                            <label className="glass-label">Category</label>
                            <GlassSelect 
                                value={formData.category}
                                onChange={e => setFormData({...formData, category: e.target.value})}
                                options={[
                                    { label: 'Select Category', value: '' },
                                    ...categories.map(c => ({ label: c.name, value: c.id }))
                                ]}
                                required
                            />
                        </div>

                        <div>
                            <label className="glass-label">Instructor Assignment</label>
                            <GlassSelect 
                                value={formData.instructor}
                                onChange={e => setFormData({...formData, instructor: e.target.value})}
                                options={[
                                    { label: 'Assign Instructor', value: '' },
                                    ...instructors.map(i => ({ label: i.username, value: i.id }))
                                ]}
                                required
                            />
                        </div>

                        <div>
                            <label className="glass-label">Price ($)</label>
                            <input 
                                type="number"
                                className="glass-input"
                                value={formData.price}
                                onChange={e => setFormData({...formData, price: e.target.value})}
                                required
                            />
                        </div>

                        <div>
                            <label className="glass-label">Course Thumbnail</label>
                            <input 
                                type="file"
                                accept="image/*"
                                className="glass-input"
                                onChange={e => setFormData({...formData, thumbnail: e.target.files[0]})}
                            />
                        </div>

                        <div style={{ gridColumn: '1 / -1', marginTop: '12px' }}>
                            <GlassButton primary type="submit" disabled={submitting} style={{ width: '100%', padding: '16px' }}>
                                {submitting ? <Loader2 className="animate-spin" size={20} /> : 'Create and Assign Course'}
                            </GlassButton>
                        </div>
                    </form>
                </GlassCard>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
                {courses.map(course => (
                    <GlassCard key={course.id} heavy style={{ padding: '0', overflow: 'hidden' }}>
                        <div style={{ height: '180px', position: 'relative' }}>
                            <img 
                                src={course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop'} 
                                alt={course.title}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            <div style={{ 
                                position: 'absolute', 
                                top: '16px', 
                                right: '16px',
                                padding: '6px 12px',
                                borderRadius: '12px',
                                background: 'rgba(0,0,0,0.6)',
                                backdropFilter: 'blur(10px)',
                                color: '#1a1a2e',
                                fontSize: '0.8rem',
                                fontWeight: 700
                            }}>
                                ${course.price}
                            </div>
                        </div>
                        <div style={{ padding: '24px' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 750, color: '#1a1a2e', marginBottom: '12px' }}>
                                {course.title}
                            </h3>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b', fontSize: '0.9rem' }}>
                                    <User size={16} color="var(--accent-blue)" />
                                    <span>Instructor: <span style={{ color: '#1a1a2e', fontWeight: 600 }}>{course.instructor_name}</span></span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b', fontSize: '0.9rem' }}>
                                    <Tag size={16} color="var(--accent-purple)" />
                                    <span>Category: <span style={{ color: '#1a1a2e', fontWeight: 600 }}>{course.category_name}</span></span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b', fontSize: '0.9rem' }}>
                                    <Layers size={16} color="#0A84FF" />
                                    <span>Status: <span style={{ 
                                        color: course.moderation_status === 'approved' ? '#30D158' : '#FFD60A',
                                        fontWeight: 700,
                                        textTransform: 'capitalize'
                                    }}>{course.moderation_status}</span></span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <GlassButton style={{ flex: 1, padding: '10px' }} onClick={() => deleteCourse(course.id)}>
                                    <Trash2 size={16} color="#FF453A" />
                                </GlassButton>
                                <GlassButton style={{ flex: 1, padding: '10px' }}>
                                    <Edit2 size={16} />
                                </GlassButton>
                                <GlassButton primary style={{ flex: 3, padding: '10px', fontSize: '0.9rem' }}>
                                    Manage Content
                                </GlassButton>
                            </div>
                        </div>
                    </GlassCard>
                ))}
            </div>
        </div>
    );
};
