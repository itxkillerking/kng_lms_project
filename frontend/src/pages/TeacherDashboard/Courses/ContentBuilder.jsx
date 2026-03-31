import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { GlassCard } from '../../../components/common/GlassCard';
import { GlassButton } from '../../../components/common/GlassButton';
import { ChevronLeft, Plus, Play, FileText, Trash2, Edit2, GripVertical, CheckCircle, UploadCloud, Link as LinkIcon, Youtube, Video, Cloud } from 'lucide-react';
import api from '../../../services/api';

export const ContentBuilder = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showLessonModal, setShowLessonModal] = useState(false);
    const [showModuleModal, setShowModuleModal] = useState(false);
    const [currentModuleId, setCurrentModuleId] = useState(null);
    const [editingLessonId, setEditingLessonId] = useState(null);
    
    // Module Form
    const [moduleTitle, setModuleTitle] = useState('');

    // New Lesson Form
    const [lessonForm, setLessonForm] = useState({
        title: '',
        video_type: 'link',
        video_url: '',
        video_file: null,
        attachment_file: null,
        duration: 0
    });
    const [uploadProgress, setUploadProgress] = useState(0);

    useEffect(() => {
        fetchCourseData();
    }, [courseId]);

    const fetchCourseData = async () => {
        try {
            const courseRes = await api.get(`courses/${courseId}/`);
            setCourse(courseRes.data);
            setModules(courseRes.data.modules || []);
        } catch (err) {
            console.error("Failed to fetch course data", err);
        } finally {
            setLoading(false);
        }
    };

    const handleModuleSubmit = async (e) => {
        e.preventDefault();
        if (!moduleTitle) return;
        try {
            const res = await api.post('modules/', {
                course: courseId,
                title: moduleTitle,
                order_index: modules.length
            });
            setModules([...modules, { ...res.data, lessons: [] }]);
            setShowModuleModal(false);
            setModuleTitle('');
        } catch (err) {
            alert("Failed to add module");
        }
    };

    const deleteModule = async (id) => {
        if (!window.confirm("Delete this module and all its lessons?")) return;
        try {
            await api.delete(`modules/${id}/`);
            setModules(modules.filter(m => m.id !== id));
        } catch (err) {
            alert("Failed to delete module");
        }
    };

    const openLessonModal = (moduleId, lesson = null) => {
        setCurrentModuleId(moduleId);
        if (lesson) {
            setEditingLessonId(lesson.id);
            setLessonForm({
                title: lesson.title,
                video_type: lesson.video_type || 'link',
                video_url: lesson.video_url || '',
                video_file: null,
                attachment_file: null,
                duration: lesson.duration || 0
            });
        } else {
            setEditingLessonId(null);
            setLessonForm({ title: '', video_type: 'link', video_url: '', video_file: null, attachment_file: null, duration: 0 });
        }
        setShowLessonModal(true);
    };

    const handleLessonSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData();
        formData.append('module', currentModuleId);
        formData.append('title', lessonForm.title);
        formData.append('video_type', lessonForm.video_type);
        formData.append('duration', lessonForm.duration);
        
        if (lessonForm.video_type === 'file' && lessonForm.video_file) {
            formData.append('video_file', lessonForm.video_file);
        } else {
            formData.append('video_url', lessonForm.video_url);
        }

        if (lessonForm.attachment_file) {
            formData.append('attachment_file', lessonForm.attachment_file);
        }

        // Automatic lesson sequencing: only for new lessons
        if (!editingLessonId) {
            const currentModule = modules.find(m => m.id === currentModuleId);
            const nextIndex = currentModule?.lessons?.length || 0;
            formData.append('order_index', nextIndex);
        }

        try {
            const axiosConfig = {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percentCompleted);
                }
            };

            if (editingLessonId) {
                await api.patch(`lessons/${editingLessonId}/`, formData, axiosConfig);
            } else {
                await api.post('lessons/', formData, axiosConfig);
            }
            setShowLessonModal(false);
            setUploadProgress(0);
            fetchCourseData(); // Refresh list
        } catch (err) {
            console.error(err);
            const errorMessage = err.response?.data 
                ? Object.entries(err.response.data).map(([k, v]) => `${k}: ${v}`).join('\n')
                : "Ensure all fields are valid and your file isn't too large.";
            alert("Failed to save lesson:\n" + errorMessage);
        } finally {
            setLoading(false);
            setUploadProgress(0);
        }
    };

    if (loading) return <div>Loading Builder...</div>;

    return (
        <div className="animate-fade-in">
            <Link to="/teacher/courses" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: '32px' }}>
                <ChevronLeft size={20} /> Back to Courses
            </Link>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '48px' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '8px' }}>Curriculum Builder</h1>
                    <p style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>{course?.title}</p>
                </div>
                <GlassButton className="primary" onClick={() => setShowModuleModal(true)} style={{ gap: '8px' }}>
                    <Plus size={20} /> Add Module
                </GlassButton>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {modules.map((module) => (
                    <GlassCard key={module.id} style={{ padding: '0', overflow: 'hidden' }}>
                        <div style={{ padding: '20px 24px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <GripVertical size={20} style={{ opacity: 0.3 }} />
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'white' }}>{module.title}</h3>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: '8px', borderRight: '1px solid rgba(255,255,255,0.1)', paddingRight: '12px', marginRight: '4px' }}>
                                    <Link to={`/teacher/assessments/quiz/create?course=${courseId}&module=${module.id}`} style={{ textDecoration: 'none' }}>
                                        <GlassButton style={{ padding: '6px 12px', fontSize: '0.75rem', gap: '6px', background: 'rgba(191, 90, 242, 0.05)', color: 'rgba(191, 90, 242, 0.8)', borderColor: 'rgba(191, 90, 242, 0.2)' }}>
                                            <FileText size={14} /> + Quiz
                                        </GlassButton>
                                    </Link>
                                    <Link to={`/teacher/assessments/assignment/create?course=${courseId}&module=${module.id}`} style={{ textDecoration: 'none' }}>
                                        <GlassButton style={{ padding: '6px 12px', fontSize: '0.75rem', gap: '6px', background: 'rgba(52, 199, 89, 0.05)', color: 'rgba(52, 199, 89, 0.8)', borderColor: 'rgba(52, 199, 89, 0.2)' }}>
                                            <FileText size={14} /> + Assignment
                                        </GlassButton>
                                    </Link>
                                </div>
                                <GlassButton onClick={() => openLessonModal(module.id)} style={{ padding: '8px 16px', fontSize: '0.8rem', gap: '6px' }}>
                                    <Plus size={14} /> Add Lesson
                                </GlassButton>
                                <button onClick={() => deleteModule(module.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', opacity: 0.6 }}>
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        <div style={{ padding: '12px' }}>
                            {module.lessons?.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {module.lessons.map(lesson => (
                                        <div key={lesson.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid transparent', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--glass-border)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                {lesson.video_type === 'youtube' ? <Youtube size={18} color="#FF0000" /> : <Play size={18} color="var(--accent-blue)" />}
                                                <div>
                                                    <p style={{ fontWeight: 600, color: 'white', marginBottom: '2px' }}>{lesson.title}</p>
                                                    <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                                                        {lesson.video_type?.toUpperCase()} • {Math.floor(lesson.duration / 60)}m {lesson.duration % 60}s
                                                    </p>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button onClick={() => openLessonModal(module.id, lesson)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><Edit2 size={16} /></button>
                                                <button style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', opacity: 0.5 }}><Trash2 size={16} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                    No lessons in this module yet.
                                </div>
                            )}
                        </div>
                    </GlassCard>
                ))}
            </div>

            {/* Lesson Modal */}
            {showLessonModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <GlassCard style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }} className="animate-scale-in">
                        <div style={{ padding: '32px 40px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '8px' }}>{editingLessonId ? 'Edit Lesson' : 'Add New Lesson'}</h2>
                            <p style={{ color: 'var(--text-secondary)' }}>Configure your video content and metadata.</p>
                        </div>

                        <div style={{ padding: '24px 40px', overflowY: 'auto', flex: 1 }}>
                            <form id="lesson-form" onSubmit={handleLessonSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Lesson Title</label>
                                <input 
                                    className="glass-input" 
                                    style={{ width: '100%', color: 'white', background: 'rgba(255,255,255,0.05)' }}
                                    value={lessonForm.title} 
                                    onChange={e => setLessonForm({...lessonForm, title: e.target.value})} 
                                    placeholder="Enter lesson title..."
                                    required 
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>Video Type</label>
                                    <select 
                                        className="glass-select glass-input" 
                                        style={{ width: '100%', background: 'rgba(255,255,255,0.08)', color: 'white', cursor: 'pointer' }}
                                        value={lessonForm.video_type}
                                        onChange={e => setLessonForm({...lessonForm, video_type: e.target.value})}
                                    >
                                        <option value="file" style={{ background: '#1a1a1a', color: 'white' }}>File Upload</option>
                                        <option value="link" style={{ background: '#1a1a1a', color: 'white' }}>External Link</option>
                                        <option value="youtube" style={{ background: '#1a1a1a', color: 'white' }}>YouTube</option>
                                        <option value="vimeo" style={{ background: '#1a1a1a', color: 'white' }}>Vimeo</option>
                                        <option value="drive" style={{ background: '#1a1a1a', color: 'white' }}>Google Drive</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>Duration (seconds)</label>
                                    <input 
                                        type="number" 
                                        className="glass-input" 
                                        style={{ width: '100%', color: 'white' }}
                                        value={lessonForm.duration} 
                                        onChange={e => setLessonForm({...lessonForm, duration: parseInt(e.target.value) || 0})} 
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '12px', fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>Content Source</label>
                                {lessonForm.video_type === 'file' ? (
                                    <div style={{ border: '2px dashed var(--glass-border)', borderRadius: '12px', padding: '32px', textAlign: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.03)' }} onClick={() => document.getElementById('lesson-video').click()}>
                                        <UploadCloud size={32} color="var(--accent-blue)" style={{ marginBottom: '12px', opacity: 0.7 }} />
                                        <p style={{ fontSize: '0.9rem', color: 'white' }}>{lessonForm.video_file ? lessonForm.video_file.name : 'Select video file...'}</p>
                                        <input id="lesson-video" type="file" accept="video/*" style={{ display: 'none' }} onChange={e => setLessonForm({...lessonForm, video_file: e.target.files[0]})} />
                                    </div>
                                ) : (
                                    <div style={{ position: 'relative' }}>
                                        <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.7, color: 'var(--accent-blue)' }}>
                                            {lessonForm.video_type === 'youtube' ? <Youtube size={18} /> : lessonForm.video_type === 'drive' ? <Cloud size={18} /> : <LinkIcon size={18} />}
                                        </div>
                                        <input 
                                            className="glass-input" 
                                            style={{ width: '100%', paddingLeft: '48px', color: 'white' }}
                                            placeholder={`Paste ${lessonForm.video_type} URL here...`}
                                            value={lessonForm.video_url}
                                            onChange={e => setLessonForm({...lessonForm, video_url: e.target.value})}
                                        />
                                    </div>
                                )}
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>Lecture Resources (Optional)</label>
                                <div 
                                    style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '12px', 
                                        padding: '12px 16px', 
                                        background: 'rgba(255,255,255,0.05)', 
                                        borderRadius: '12px', 
                                        border: '1px solid var(--glass-border)',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => document.getElementById('lesson-attachment').click()}
                                >
                                    <FileText size={18} color="var(--accent-purple)" />
                                    <span style={{ fontSize: '0.85rem', flex: 1, color: lessonForm.attachment_file ? 'white' : 'var(--text-secondary)' }}>
                                        {lessonForm.attachment_file ? lessonForm.attachment_file.name : 'Upload PDF, Slides, or Notes...'}
                                    </span>
                                    {lessonForm.attachment_file && <Plus size={16} color="var(--success)" style={{ transform: 'rotate(45deg)' }} onClick={(e) => { e.stopPropagation(); setLessonForm({...lessonForm, attachment_file: null}); }} />}
                                    <input id="lesson-attachment" type="file" style={{ display: 'none' }} onChange={e => setLessonForm({...lessonForm, attachment_file: e.target.files[0]})} />
                                </div>
                            </div>

                            {uploadProgress > 0 && (
                                <div style={{ marginTop: '10px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                                        <span style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>
                                            {uploadProgress < 100 ? `Uploading Video: ${uploadProgress}%` : 'Finalizing & Processing...'}
                                        </span>
                                    </div>
                                    <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                                        <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent-blue), var(--accent-purple))', transition: 'width 0.3s ease' }}></div>
                                    </div>
                                </div>
                            )}
                        </form>
                    </div>

                        <div style={{ padding: '20px 40px 32px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '16px' }}>
                            <GlassButton type="button" onClick={() => setShowLessonModal(false)} style={{ flex: 1 }}>Cancel</GlassButton>
                            <GlassButton 
                                type="submit" 
                                form="lesson-form"
                                className="primary" 
                                style={{ flex: 2, background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))' }}
                                disabled={loading}
                            >
                                {loading ? 'Saving...' : (editingLessonId ? 'Update Lesson' : 'Add Lesson')}
                            </GlassButton>
                        </div>
                    </GlassCard>
                </div>
            )}
            {/* Module Modal */}
            {showModuleModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <GlassCard style={{ width: '100%', maxWidth: '450px', padding: '32px' }} className="animate-scale-in">
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '24px' }}>Add Module</h2>
                        <form onSubmit={handleModuleSubmit}>
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>Module Title</label>
                                <input 
                                    className="glass-input" 
                                    style={{ width: '100%' }}
                                    placeholder="e.g. Introduction & Setup"
                                    value={moduleTitle} 
                                    onChange={e => setModuleTitle(e.target.value)} 
                                    autoFocus
                                    required 
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <GlassButton type="button" onClick={() => setShowModuleModal(false)} style={{ flex: 1 }}>Cancel</GlassButton>
                                <GlassButton type="submit" className="primary" style={{ flex: 1, background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))' }}>Create Module</GlassButton>
                            </div>
                        </form>
                    </GlassCard>
                </div>
            )}
        </div>
    );
};
