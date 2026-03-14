import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GlassCard } from '../../../components/common/GlassCard';
import { GlassButton } from '../../../components/common/GlassButton';
import { GlassInput } from '../../../components/common/GlassInput';
import { ChevronLeft, Save, Sparkles, Image as ImageIcon, Briefcase, FileText, DollarSign, UploadCloud } from 'lucide-react';
import api from '../../../services/api';

export const CourseCreator = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '0',
    });
    const [thumbnailFile, setThumbnailFile] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        const data = new FormData();
        data.append('title', formData.title);
        data.append('description', formData.description);
        data.append('price', parseFloat(formData.price));
        if (thumbnailFile) {
            data.append('thumbnail', thumbnailFile);
        }

        try {
            const response = await api.post('courses/', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            console.log("Course created:", response.data);
            navigate('/teacher/courses');
        } catch (error) {
            console.error("Error creating course:", error);
            alert("Failed to create course. Please check your inputs.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <Link to="/teacher/courses" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: '32px' }}>
                <ChevronLeft size={20} /> Back to Course Management
            </Link>

            <div style={{ marginBottom: '40px' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '8px' }}>Create New Course</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Design your curriculum and reach thousands of students.</p>
            </div>

            <form onSubmit={handleSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    
                    {/* Basic Info */}
                    <GlassCard style={{ padding: '32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                            <div style={{ padding: '10px', background: 'rgba(10, 132, 255, 0.1)', borderRadius: '12px' }}>
                                <FileText size={20} color="var(--accent-blue)" />
                            </div>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Basic Information</h3>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Course Title</label>
                                <GlassInput 
                                    name="title"
                                    placeholder="e.g. Master Class in UI/UX Design"
                                    value={formData.title}
                                    onChange={handleChange}
                                    required
                                    style={{ color: 'white' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Description</label>
                                <textarea 
                                    name="description"
                                    className="glass-input"
                                    placeholder="Tell your students what they will learn..."
                                    value={formData.description}
                                    onChange={handleChange}
                                    style={{ width: '100%', minHeight: '150px', padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', resize: 'vertical', outline: 'none' }}
                                    required
                                />
                            </div>
                        </div>
                    </GlassCard>

                    {/* Visuals & Pricing */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
                        <GlassCard style={{ padding: '32px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                                <div style={{ padding: '10px', background: 'rgba(191, 90, 242, 0.1)', borderRadius: '12px' }}>
                                    <ImageIcon size={20} color="var(--accent-purple)" />
                                </div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Visuals</h3>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '12px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Course Thumbnail</label>
                                <div 
                                    onClick={() => document.getElementById('thumbnail-input').click()}
                                    style={{ 
                                        border: '2px dashed var(--glass-border)', 
                                        borderRadius: '16px', 
                                        padding: '40px 20px', 
                                        textAlign: 'center', 
                                        cursor: 'pointer',
                                        background: 'rgba(255,255,255,0.02)',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '12px'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-purple)'}
                                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--glass-border)'}
                                >
                                    <UploadCloud size={32} color="var(--accent-purple)" style={{ opacity: 0.7 }} />
                                    {thumbnailFile ? (
                                        <div style={{ color: 'white', fontSize: '0.9rem' }}>
                                            <p style={{ fontWeight: 600 }}>{thumbnailFile.name}</p>
                                            <p style={{ fontSize: '0.75rem', opacity: 0.6 }}>Click to change image</p>
                                        </div>
                                    ) : (
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                            <p>Select a professional cover image</p>
                                            <p style={{ fontSize: '0.75rem', opacity: 0.5 }}>(JPG, PNG, WebP)</p>
                                        </div>
                                    )}
                                    <input 
                                        id="thumbnail-input"
                                        type="file" 
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files.length > 0) {
                                                setThumbnailFile(e.target.files[0]);
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </GlassCard>

                        <GlassCard style={{ padding: '32px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                                <div style={{ padding: '10px', background: 'rgba(50, 215, 75, 0.1)', borderRadius: '12px' }}>
                                    <DollarSign size={20} color="var(--success)" />
                                </div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Pricing</h3>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Price ($)</label>
                                <GlassInput 
                                    name="price"
                                    type="number"
                                    placeholder="0 (Free)"
                                    value={formData.price}
                                    onChange={handleChange}
                                    required
                                    style={{ color: 'white' }}
                                />
                            </div>
                        </GlassCard>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '16px', marginTop: '20px' }}>
                        <GlassButton 
                            type="button"
                            onClick={() => navigate('/teacher/courses')}
                            style={{ flex: 1, padding: '16px' }}
                        >
                            Cancel
                        </GlassButton>
                        <GlassButton 
                            className="primary" 
                            type="submit" 
                            disabled={loading}
                            style={{ flex: 2, padding: '16px', gap: '8px', background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))' }}
                        >
                            {loading ? 'Creating Project...' : (
                                <>
                                    <Sparkles size={20} /> Create Course
                                </>
                            )}
                        </GlassButton>
                    </div>

                </div>
            </form>
        </div>
    );
};
