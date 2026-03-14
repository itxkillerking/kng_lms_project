import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../../components/common/GlassCard';
import { GlassButton } from '../../../components/common/GlassButton';
import { BookOpen, FileText, ClipboardList, Plus, Clock, RotateCcw, Calendar, MoreVertical, Trash2, Edit } from 'lucide-react';
import api from '../../../services/api';
import { Link, useNavigate } from 'react-router-dom';

export const AssessmentManager = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInstructorData();
    }, []);

    const fetchInstructorData = async () => {
        try {
            const response = await api.get('courses/?instructor=me');
            setCourses(Array.isArray(response.data) ? response.data : response.data.results || []);
        } catch (error) {
            console.error("Error fetching assessment data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (type, id) => {
        if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;
        try {
            const endpoint = type === 'quiz' ? 'quizzes' : 'assignments';
            await api.delete(`${endpoint}/${id}/`);
            fetchInstructorData(); // Refresh
        } catch (err) {
            alert("Failed to delete assessment.");
        }
    };

    if (loading) return <div style={{ color: 'var(--text-secondary)', padding: '40px' }}>Loading assessments Hub...</div>;

    return (
        <div className="animate-fade-in" style={{ padding: '0 20px' }}>
            <div style={{ marginBottom: '56px' }}>
                <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 3.5rem)', fontWeight: 800, marginBottom: '16px', color: 'white', letterSpacing: '-0.02em' }}>Assessments Hub</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', maxWidth: '650px', lineHeight: '1.6' }}>Design high-impact evaluations and track student performance with ease.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '64px' }}>
                {courses.length === 0 ? (
                    <GlassCard style={{ padding: '80px 40px', textAlign: 'center', background: 'rgba(255,255,255,0.01)' }}>
                        <div style={{ opacity: 0.2, marginBottom: '24px' }}><ClipboardList size={64} /></div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '12px' }}>No Courses Found</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>You need to create a course before adding assessments.</p>
                    </GlassCard>
                ) : courses.map(course => (
                    <div key={course.id} style={{ position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px', padding: '0 4px', flexWrap: 'wrap', gap: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(10, 132, 255, 0.2), rgba(191, 90, 242, 0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 16px rgba(0,0,0,0.2)' }}>
                                    <BookOpen size={28} color="white" />
                                </div>
                                <div>
                                    <h2 style={{ fontSize: '1.8rem', fontWeight: 700, color: 'white', letterSpacing: '-0.01em' }}>{course.title}</h2>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-blue)' }}></div>
                                        <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>Active Management</p>
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <Link to={`/teacher/assessments/quiz/create?course=${course.id}`} style={{ textDecoration: 'none' }}>
                                    <GlassButton style={{ fontSize: '0.9rem', gap: '10px', padding: '12px 24px', background: 'rgba(255,255,255,0.05)', fontWeight: 600 }}>
                                        <Plus size={18} /> Quiz
                                    </GlassButton>
                                </Link>
                                <Link to={`/teacher/assessments/assignment/create?course=${course.id}`} style={{ textDecoration: 'none' }}>
                                    <GlassButton style={{ fontSize: '0.9rem', gap: '10px', padding: '12px 24px', background: 'rgba(255,255,255,0.05)', fontWeight: 600 }}>
                                        <Plus size={18} /> Assignment
                                    </GlassButton>
                                </Link>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 420px), 1fr))', gap: '24px', alignItems: 'stretch' }}>
                            {course.modules?.map(module => (
                                <React.Fragment key={module.id}>
                                    {module.quizzes?.map(quiz => (
                                        <AssessmentCard key={`quiz-${quiz.id}`} type="quiz" item={quiz} moduleTitle={module.title} courseId={course.id} onDelete={() => handleDelete('quiz', quiz.id)} />
                                    ))}
                                    {module.assignments?.map(assignment => (
                                        <AssessmentCard key={`assignment-${assignment.id}`} type="assignment" item={assignment} moduleTitle={module.title} courseId={course.id} onDelete={() => handleDelete('assignment', assignment.id)} />
                                    ))}
                                </React.Fragment>
                            ))}
                            {(course.modules?.every(m => !m.quizzes?.length && !m.assignments?.length)) && (
                                <div style={{ gridColumn: '1 / -1', padding: '80px 40px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '28px', border: '1px dashed rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ opacity: 0.2 }}><ClipboardList size={48} /></div>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Get started by creating your first assessment for this course.</p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const AssessmentCard = ({ type, item, moduleTitle, courseId, onDelete }) => {
    const navigate = useNavigate();
    const editPath = type === 'quiz' ? `/teacher/assessments/quiz/create` : `/teacher/assessments/assignment/create`;

    return (
        <GlassCard style={{ padding: '32px', display: 'flex', flexDirection: 'column', height: '100%', border: '1px solid rgba(255,255,255,0.08)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: type === 'quiz' ? 'radial-gradient(circle at 70% 30%, rgba(191, 90, 242, 0.1), transparent 70%)' : 'radial-gradient(circle at 70% 30%, rgba(50, 215, 75, 0.1), transparent 70%)', pointerEvents: 'none' }}></div>
            
            <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ padding: '10px', borderRadius: '12px', background: type === 'quiz' ? 'rgba(191, 90, 242, 0.12)' : 'rgba(50, 215, 75, 0.12)', border: `1px solid ${type === 'quiz' ? 'rgba(191, 90, 242, 0.2)' : 'rgba(50, 215, 75, 0.2)'}`, boxShadow: 'inset 0 0 12px rgba(255,255,255,0.05)' }}>
                            {type === 'quiz' ? <ClipboardList size={20} color="var(--accent-purple)" /> : <FileText size={20} color="var(--success)" />}
                        </div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: type === 'quiz' ? 'var(--accent-purple)' : 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                            {type}
                        </span>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                         <button onClick={() => navigate(`${editPath}?course=${courseId}&edit=${item.id}`)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', padding: '8px', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'white'; }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }} title="Edit"><Edit size={16} /></button>
                         <button onClick={onDelete} style={{ background: 'rgba(255,69,58,0.05)', border: '1px solid rgba(255,69,58,0.1)', color: 'rgba(255,69,58,0.6)', padding: '8px', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,69,58,0.15)'; e.currentTarget.style.color = '#ff453a'; }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,69,58,0.05)'; e.currentTarget.style.color = 'rgba(255,69,58,0.6)'; }} title="Delete"><Trash2 size={16} /></button>
                    </div>
                </div>

                <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px', color: 'white', letterSpacing: '-0.02em', lineHeight: '1.3' }}>{item.title}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: '8px', width: 'fit-content', marginBottom: '28px', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <BookOpen size={14} color="var(--accent-blue)" /> 
                    <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{moduleTitle}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', padding: '20px', background: 'rgba(0,0,0,0.2)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.03)', boxShadow: 'inset 0 2px 20px rgba(0,0,0,0.2)' }}>
                    {type === 'quiz' ? (
                        <>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Clock size={14} color="var(--accent-purple)" />
                                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: 600 }}>Duration</span>
                                </div>
                                <span style={{ fontSize: '1rem', color: 'white', fontWeight: 600 }}>{item.time_limit_mins} mins</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <RotateCcw size={14} color="var(--accent-purple)" />
                                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: 600 }}>Attempts</span>
                                </div>
                                <span style={{ fontSize: '1rem', color: 'white', fontWeight: 600 }}>{item.max_retakes} Max</span>
                            </div>
                        </>
                    ) : (
                        <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Calendar size={14} color="var(--success)" />
                                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: 600 }}>Submission Deadline</span>
                            </div>
                            <span style={{ fontSize: '1rem', color: 'white', fontWeight: 600 }}>
                                {item.deadline ? new Date(item.deadline).toLocaleDateString(undefined, { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'No Deadline Set'}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            <div style={{ marginTop: '32px' }}>
                <GlassButton 
                    onClick={() => navigate(`${editPath}?course=${courseId}&edit=${item.id}`)}
                    style={{ 
                        width: '100%', 
                        padding: '14px', 
                        fontSize: '0.95rem', 
                        gap: '12px', 
                        background: 'rgba(255,255,255,0.06)', 
                        border: '1px solid rgba(255,255,255,0.1)',
                        fontWeight: 600,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                >
                    <Edit size={18} /> Manage Assessment
                </GlassButton>
            </div>
        </GlassCard>
    );
};
