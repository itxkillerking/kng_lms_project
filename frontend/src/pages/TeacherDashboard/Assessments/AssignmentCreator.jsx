import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { GlassCard } from '../../../components/common/GlassCard';
import { GlassButton } from '../../../components/common/GlassButton';
import { ChevronLeft, Save, FileText, Calendar, Trophy, AlertCircle, Plus, Trash2, UploadCloud, X } from 'lucide-react';
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
        allowed_file_types: '.pdf,.zip,.doc,.docx'
    });
    const [attachmentFiles, setAttachmentFiles] = useState([]);
    const [existingAttachments, setExistingAttachments] = useState([]);

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
                    allowed_file_types: res.data.allowed_file_types
                });
                setExistingAttachments(res.data.attachments || []);
                setLoading(false);
            }).catch(err => {
                console.error(err);
                setLoading(false);
            });
        }
    }, [courseId, editId, moduleId]);

    const handleFileChange = (e) => {
        if (e.target.files) {
            setAttachmentFiles([...attachmentFiles, ...Array.from(e.target.files)]);
        }
    };

    const removeNewFile = (index) => {
        setAttachmentFiles(attachmentFiles.filter((_, i) => i !== index));
    };

    const removeExistingAttachment = async (id) => {
        if (!window.confirm("Delete this attachmentPermanently?")) return;
        try {
            await api.delete(`assignment-attachments/${id}/`);
            setExistingAttachments(existingAttachments.filter(a => a.id !== id));
        } catch (err) {
            alert("Failed to delete attachment");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            let assignmentId = editId;
            if (editId) {
                await api.patch(`assignments/${editId}/`, formData);
            } else {
                const res = await api.post('assignments/', formData);
                assignmentId = res.data.id;
            }

            // Upload new attachments
            for (const file of attachmentFiles) {
                const fData = new FormData();
                fData.append('assignment', assignmentId);
                fData.append('file', file);
                fData.append('filename', file.name);
                await api.post('assignment-attachments/', fData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
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
                                        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', color: 'white' }}
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
                                            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', color: 'white' }}
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
                                        style={{ width: '100%', color: 'white' }}
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
                                        style={{ width: '100%', minHeight: '300px', color: 'white', lineHeight: '1.6' }}
                                        value={formData.instructions_text}
                                        onChange={e => setFormData({...formData, instructions_text: e.target.value})}
                                        placeholder="Provide detailed instructions for your students..."
                                        required
                                    />
                                </div>
                            </div>
                        </GlassCard>

                        {/* Multiple File Upload Section */}
                        <GlassCard style={{ padding: 'clamp(20px, 4vw, 32px)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Plus size={18} color="var(--accent-blue)" /> Resources & Templates
                                </h3>
                                <GlassButton type="button" onClick={() => document.getElementById('assignment-files').click()} style={{ fontSize: '0.85rem', gap: '8px' }}>
                                    <UploadCloud size={16} /> Add Files
                                </GlassButton>
                                <input id="assignment-files" type="file" multiple style={{ display: 'none' }} onChange={handleFileChange} />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {existingAttachments.map(file => (
                                    <div key={file.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <FileText size={16} color="var(--success)" />
                                            <span style={{ fontSize: '0.9rem', color: 'white' }}>{file.filename}</span>
                                        </div>
                                        <button type="button" onClick={() => removeExistingAttachment(file.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                    </div>
                                ))}
                                {attachmentFiles.map((file, index) => (
                                    <div key={`new-${index}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: '12px', background: 'rgba(10, 132, 255, 0.05)', border: '1px solid var(--accent-blue)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <FileText size={16} color="var(--accent-blue)" />
                                            <span style={{ fontSize: '0.9rem', color: 'white' }}>{file.name}</span>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--accent-blue)', fontWeight: 600 }}>(NEW)</span>
                                        </div>
                                        <button type="button" onClick={() => removeNewFile(index)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><X size={16} /></button>
                                    </div>
                                ))}
                                {attachmentFiles.length === 0 && existingAttachments.length === 0 && (
                                    <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No attachments added yet.</p>
                                )}
                            </div>
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
                                style={{ width: '100%', color: 'white', marginBottom: '12px' }}
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
                                        style={{ width: '100%', color: 'white' }}
                                        value={formData.max_score}
                                        onChange={e => setFormData({...formData, max_score: e.target.value})}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Allowed Extensions</label>
                                    <input 
                                        className="glass-input"
                                        style={{ width: '100%', color: 'white', fontSize: '0.8rem' }}
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
