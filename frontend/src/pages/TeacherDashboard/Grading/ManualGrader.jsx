import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { GlassCard } from '../../../components/common/GlassCard';
import { GlassButton } from '../../../components/common/GlassButton';
import { ChevronLeft, User, BookOpen, FileText, Link as LinkIcon, Save, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../../services/api';

export const ManualGrader = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [submission, setSubmission] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Form state
    const [grade, setGrade] = useState('');
    const [feedback, setFeedback] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        const fetchSubmission = async () => {
            try {
                const response = await api.get(`assignment-submissions/${id}/`);
                setSubmission(response.data);
                setGrade(response.data.grade_score !== null ? response.data.grade_score : '');
                setFeedback(response.data.instructor_feedback || '');
            } catch (error) {
                console.error("Error fetching submission:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSubmission();
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.patch(`assignment-submissions/${id}/`, {
                grade_score: parseInt(grade),
                instructor_feedback: feedback
            });
            setSuccessMessage("Grade and feedback saved successfully!");
            setTimeout(() => {
                navigate('/teacher/grading');
            }, 2000);
        } catch (error) {
            console.error("Error saving grade:", error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div style={{ color: 'var(--text-secondary)' }}>Loading student submission...</div>;
    if (!submission) return <div style={{ color: 'var(--text-secondary)' }}>Submission not found.</div>;

    const submissionUrl = submission.file_url || (submission.submission_text?.startsWith('http') ? submission.submission_text : null);
    const isFile = !!submission.file_url || (submission.submission_text?.includes('[Uploaded File]'));

    return (
        <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <Link to="/teacher/grading" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: '24px' }}>
                <ChevronLeft size={20} /> Back to Submission Inbox
            </Link>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px' }}>Grade Submission</h1>
                    <p style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BookOpen size={16} /> {submission.assignment_title}
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(0, 0, 0, 0.03)', padding: '10px 16px', borderRadius: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(45deg, var(--accent-blue), var(--accent-purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>
                        {submission.student_name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>{submission.student_name}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Student</p>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px' }}>
                {/* Left side: Student Work */}
                <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '16px' }}>Student Work</h3>
                    <GlassCard style={{ padding: '32px', minHeight: '400px' }}>
                        {submissionUrl && !submission.submission_text?.includes('[Uploaded File]') ? (
                            <div style={{ textAlign: 'center', paddingTop: '40px' }}>
                                <LinkIcon size={48} color="var(--accent-blue)" style={{ opacity: 0.3, marginBottom: '20px' }} />
                                <h4 style={{ marginBottom: '12px' }}>External Resource Submitted</h4>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>The student has submitted a link for review.</p>
                                <a href={submissionUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                                    <GlassButton style={{ gap: '8px' }}>
                                        Open Submission Link <ChevronLeft size={16} style={{ transform: 'rotate(180deg)' }} />
                                    </GlassButton>
                                </a>
                                <p style={{ marginTop: '20px', fontSize: '0.8rem', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>
                                    {submissionUrl}
                                </p>
                            </div>
                        ) : isFile ? (
                            <div style={{ textAlign: 'center', paddingTop: '40px' }}>
                                <FileText size={48} color="var(--accent-blue)" style={{ opacity: 0.3, marginBottom: '20px' }} />
                                <h4 style={{ marginBottom: '12px' }}>File Attached</h4>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                                    {submission.submission_text?.replace('[Uploaded File]: ', '') || "Student Upload"}
                                </p>
                                {submissionUrl ? (
                                    <a href={submissionUrl} download target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                                        <GlassButton style={{ gap: '8px' }}>
                                            Download File Content <ChevronLeft size={16} style={{ transform: 'rotate(180deg)' }} />
                                        </GlassButton>
                                    </a>
                                ) : isFile ? (
                                    <GlassButton style={{ gap: '8px', opacity: 0.7 }} onClick={() => alert("This is a mock upload. In a production environment, this would download the actual file.")}>
                                        Download Mock File <ChevronLeft size={16} style={{ transform: 'rotate(180deg)' }} />
                                    </GlassButton>
                                ) : (
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                        No file attached to this submission.
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, color: 'var(--text-primary)' }}>
                                {submission.submission_text || "No submission text provided."}
                            </div>
                        )}
                    </GlassCard>
                </div>

                {/* Right side: Grading Form */}
                <form onSubmit={handleSubmit}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '16px' }}>Assessment</h3>
                    <GlassCard style={{ padding: '24px' }}>
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Grade (0 - 100)</label>
                            <input 
                                type="number"
                                min="0"
                                max="100"
                                value={grade}
                                onChange={(e) => setGrade(e.target.value)}
                                required
                                style={{
                                    width: '100%',
                                    background: 'rgba(0, 0, 0, 0.03)',
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: '12px',
                                    padding: '12px 16px',
                                    color: '#1a1a2e',
                                    fontSize: '1.2rem',
                                    fontWeight: 600,
                                    outline: 'none',
                                    transition: 'border-color 0.2s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = 'var(--accent-blue)'}
                                onBlur={(e) => e.target.style.borderColor = 'var(--glass-border)'}
                                placeholder="85"
                            />
                        </div>

                        <div style={{ marginBottom: '32px' }}>
                            <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>Instructor Feedback</label>
                            <textarea 
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                rows={6}
                                style={{
                                    width: '100%',
                                    background: 'rgba(0, 0, 0, 0.03)',
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: '12px',
                                    padding: '12px 16px',
                                    color: '#1a1a2e',
                                    fontSize: '0.95rem',
                                    lineHeight: 1.5,
                                    outline: 'none',
                                    resize: 'none',
                                    transition: 'border-color 0.2s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = 'var(--accent-blue)'}
                                onBlur={(e) => e.target.style.borderColor = 'var(--glass-border)'}
                                placeholder="Great work on the responsiveness! One small detail..."
                            />
                        </div>

                        {successMessage && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)', fontSize: '0.9rem', marginBottom: '20px', padding: '12px', background: 'rgba(50, 215, 75, 0.1)', borderRadius: '8px' }}>
                                <CheckCircle size={18} /> {successMessage}
                            </div>
                        )}

                        <GlassButton 
                            className="primary" 
                            type="submit" 
                            disabled={saving}
                            style={{ width: '100%', padding: '14px', gap: '8px' }}
                        >
                            <Save size={20} /> {saving ? 'Saving...' : 'Complete Grading'}
                        </GlassButton>
                        
                        <p style={{ marginTop: '16px', fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            <AlertCircle size={12} /> Status will be updated instantly for the student.
                        </p>
                    </GlassCard>
                </form>
            </div>
        </div>
    );
};
