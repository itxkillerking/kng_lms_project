import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { GlassCard } from '../../../components/common/GlassCard';
import { GlassButton } from '../../../components/common/GlassButton';
import { ChevronLeft, Save, FileText, Calendar, Trophy, AlertCircle, Plus, Trash2, UploadCloud, X, Cloud, Link as LinkIcon } from 'lucide-react';
import api from '../../../services/api';

export const AssignmentCreator = () => {
    const [searchParams] = useSearchParams();
    const courseId = searchParams.get('course');
    const editId = searchParams.get('edit');
    const navigate = useNavigate();
    
    const [loading, setLoading] = useState(false);
    const [modules, setModules] = useState([]);
    const [formData, setFormData] = useState({
        module: '',
        title: '',
        instructions_text: '',
        max_score: 100,
        deadline: '',
        allowed_file_types: '.pdf,.zip,.doc,.docx',
        resource_url: ''
    });

    const [allCourses, setAllCourses] = useState([]);
    const moduleId = searchParams.get('module');

    useEffect(() => {
        // Fetch all instructor courses for Selector
        api.get('courses/?instructor=me').then(res => {
            setAllCourses(Array.isArray(res.data) ? res.data : res.data.results || []);
        });

        if (courseId) {
            api.get(`courses/${courseId}/`).then(res => {
                const fetchedModules = res.data.modules || [];
                setModules(fetchedModules);
                if (!editId) {
                    const targetModule = moduleId || (fetchedModules.length > 0 ? fetchedModules[0].id : '');
                    setFormData(prev => ({ ...prev, module: targetModule }));
                }
            });
        }

        if (editId) {
            setLoading(true);
            api.get(`assignments/${editId}/`).then(res => {
                setFormData({
                    module: res.data.module,
                    title: res.data.title,
                    instructions_text: res.data.instructions_text,
                    max_score: res.data.max_score,
                    deadline: res.data.deadline ? res.data.deadline.slice(0, 16) : '',
                    allowed_file_types: res.data.allowed_file_types,
                    resource_url: res.data.resource_url || ''
                });
                setLoading(false);
            }).catch(err => {
                console.error(err);
                setLoading(false);
            });
        }
    }, [courseId, editId, moduleId]);


    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editId) {
                await api.patch(`assignments/${editId}/`, formData);
            } else {
                await api.post('assignments/', formData);
            }

            navigate('/teacher/assessments');
        } catch (error) {
            console.error(error);
            alert("Failed to save assignment.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 20px' }}>
            <Link to="/teacher/assessments" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: '32px' }}>
                <ChevronLeft size={20} /> Back to Hub
            </Link>

            <div style={{ marginBottom: '40px' }}>
                <h1 style={{ fontSize: 'clamp(2rem, 5vw, 2.5rem)', fontWeight: 700, marginBottom: '8px' }}>{editId ? 'Edit Assignment' : 'Create Assignment'}</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Set tasks, guidelines, and submission deadlines.</p>
            </div>

            <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', gridColumn: 'span 2' }}>
                        <GlassCard style={{ padding: 'clamp(20px, 4vw, 32px)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Target Course</label>
                                    <select 
                                        className="glass-select glass-input" 
                                        style={{ width: '100%', background: 'rgba(0, 0, 0, 0.03)', color: '#1a1a2e' }}
                                        value={courseId || ''}
                                        onChange={e => navigate(`/teacher/assessments/assignment/create?course=${e.target.value}`)}
                                        required={!editId}
                                        disabled={!!editId}
                                    >
                                        <option value="" disabled style={{ background: '#1a1a1a' }}>Select a course...</option>
                                        {allCourses.map(c => <option key={c.id} value={c.id} style={{ background: '#1a1a1a' }}>{c.title}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Target Module</label>
                                    {modules.length > 0 ? (
                                        <select 
                                            className="glass-select glass-input" 
                                            style={{ width: '100%', background: 'rgba(0, 0, 0, 0.03)', color: '#1a1a2e' }}
                                            value={formData.module}
                                            onChange={e => setFormData({...formData, module: e.target.value})}
                                            required
                                        >
                                            <option value="" disabled style={{ background: '#1a1a1a' }}>Select a module...</option>
                                            {modules.map(m => <option key={m.id} value={m.id} style={{ background: '#1a1a1a' }}>{m.title}</option>)}
                                        </select>
                                    ) : (
                                        <div style={{ padding: '12px', background: 'rgba(255, 69, 58, 0.05)', border: '1px solid rgba(255, 69, 58, 0.2)', borderRadius: '12px', fontSize: '0.85rem', color: '#ff453a' }}>
                                            {courseId ? 'No modules found in this course. Visit Content Builder to add one.' : 'Please select a course first.'}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Assignment Title</label>
                                    <input 
                                        className="glass-input" 
                                        style={{ width: '100%', color: '#1a1a2e' }}
                                        value={formData.title}
                                        onChange={e => setFormData({...formData, title: e.target.value})}
                                        placeholder="e.g. Project Phase 1: Market Research"
                                        required
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Instructions</label>
                                    <textarea 
                                        className="glass-input" 
                                        style={{ width: '100%', minHeight: '300px', color: '#1a1a2e', lineHeight: '1.6' }}
                                        value={formData.instructions_text}
                                        onChange={e => setFormData({...formData, instructions_text: e.target.value})}
                                        placeholder="Provide detailed instructions for your students..."
                                        required
                                    />
                                </div>
                            </div>
                        </GlassCard>

                        {/* Google Drive Resource Section */}
                        <GlassCard style={{ padding: 'clamp(20px, 4vw, 32px)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                                <Cloud size={20} color="var(--accent-blue)" />
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Project Resources (Google Drive)</h3>
                            </div>
                            
                            <div style={{ position: 'relative' }}>
                                <input 
                                    className="glass-input" 
                                    style={{ width: '100%', paddingLeft: '48px', color: '#1a1a2e' }}
                                    placeholder="Paste Google Drive sharing link for resources..."
                                    value={formData.resource_url}
                                    onChange={e => setFormData({...formData, resource_url: e.target.value})}
                                />
                                <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>
                                    <LinkIcon size={18} color="var(--accent-blue)" />
                                </div>
                            </div>
                            
                            <p style={{ marginTop: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                <AlertCircle size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                                Direct file uploads are disabled to save server space. Use Google Drive for large PDFs, ZIPs, or project templates.
                            </p>
                        </GlassCard>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        <GlassCard style={{ padding: '32px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                                <Calendar size={20} color="var(--accent-blue)" />
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Deadline</h3>
                            </div>
                            <input 
                                type="datetime-local"
                                className="glass-input"
                                style={{ width: '100%', color: '#1a1a2e', marginBottom: '12px' }}
                                value={formData.deadline}
                                onChange={e => setFormData({...formData, deadline: e.target.value})}
                                required
                            />
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                                Submissions will be automatically locked after this time.
                            </p>
                        </GlassCard>

                        <GlassCard style={{ padding: '32px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                                <Trophy size={20} color="var(--success)" />
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Rules</h3>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Max Points</label>
                                    <input 
                                        type="number"
                                        className="glass-input"
                                        style={{ width: '100%', color: '#1a1a2e' }}
                                        value={formData.max_score}
                                        onChange={e => setFormData({...formData, max_score: e.target.value})}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Allowed Extensions</label>
                                    <input 
                                        className="glass-input"
                                        style={{ width: '100%', color: '#1a1a2e', fontSize: '0.8rem' }}
                                        value={formData.allowed_file_types}
                                        onChange={e => setFormData({...formData, allowed_file_types: e.target.value})}
                                        placeholder=".pdf,.zip..."
                                    />
                                </div>
                            </div>
                        </GlassCard>

                        <GlassButton 
                            type="submit" 
                            className="primary" 
                            disabled={loading}
                            style={{ padding: '20px', gap: '12px', background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))', fontSize: '1.1rem' }}
                        >
                            {loading ? 'Processing...' : <><Save size={20} /> {editId ? 'Update Assignment' : 'Publish Assignment'}</>}
                        </GlassButton>
                    </div>
                </div>
            </form>
        </div>
    );
};
