import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../../components/common/GlassCard';
import { GlassButton } from '../../../components/common/GlassButton';
import { CheckCircle, Clock, AlertCircle, User, FileText, ChevronRight, Search, Filter } from 'lucide-react';
import api from '../../../services/api';
import { Link } from 'react-router-dom';

export const SubmissionInbox = () => {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, pending, graded

    useEffect(() => {
        const fetchSubmissions = async () => {
            try {
                const response = await api.get('assignment-submissions/');
                const data = Array.isArray(response.data) ? response.data : response.data.results || [];
                console.log("Teacher Dashboard Submissions:", data);
                setSubmissions(data);
            } catch (error) {
                console.error("Error fetching submissions:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSubmissions();
    }, []);

    const filteredSubmissions = submissions.filter(s => {
        if (filter === 'pending') return s.grade_score === null;
        if (filter === 'graded') return s.grade_score !== null;
        return true;
    });

    if (loading) return <div style={{ color: 'var(--text-secondary)' }}>Loading submissions...</div>;

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '8px' }}>Grading Inbox</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Review and grade student assignment submissions.</p>
                </div>
            </div>

            {/* Filter Bar */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
                <GlassButton 
                    onClick={() => setFilter('all')}
                    style={{ background: filter === 'all' ? 'rgba(255,255,255,0.1)' : 'transparent', borderColor: filter === 'all' ? 'var(--accent-blue)' : 'var(--glass-border)' }}
                >
                    All Submissions
                </GlassButton>
                <GlassButton 
                    onClick={() => setFilter('pending')}
                    style={{ background: filter === 'pending' ? 'rgba(255,255,255,0.1)' : 'transparent', borderColor: filter === 'pending' ? 'var(--accent-blue)' : 'var(--glass-border)' }}
                >
                    Pending Review ({submissions.filter(s => s.grade_score === null).length})
                </GlassButton>
                <GlassButton 
                    onClick={() => setFilter('graded')}
                    style={{ background: filter === 'graded' ? 'rgba(255,255,255,0.1)' : 'transparent', borderColor: filter === 'graded' ? 'var(--accent-blue)' : 'var(--glass-border)' }}
                >
                    Graded
                </GlassButton>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {filteredSubmissions.length > 0 ? (
                    filteredSubmissions.map(sub => (
                        <GlassCard key={sub.id} style={{ padding: '20px' }}>
                            <div style={{ 
                                display: 'flex', 
                                flexDirection: window.innerWidth < 768 ? 'column' : 'row',
                                justifyContent: 'space-between', 
                                alignItems: window.innerWidth < 768 ? 'stretch' : 'center',
                                gap: '20px'
                            }}>
                                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flex: 1, minWidth: 0 }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <FileText size={24} color="var(--accent-blue)" />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {sub.assignment_title || 'Final Project Upload'}
                                        </h4>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                                                <User size={14} /> {sub.student_name || 'Student Name'}
                                            </span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                                                <Clock size={14} /> {sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString() : 'Just now'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: window.innerWidth < 768 ? 'space-between' : 'flex-end',
                                    gap: '24px',
                                    borderTop: window.innerWidth < 768 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                                    paddingTop: window.innerWidth < 768 ? '16px' : '0'
                                }}>
                                    <div>
                                        {sub.grade_score !== null ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981' }}>
                                                <CheckCircle size={18} />
                                                <span style={{ fontWeight: 600 }}>{sub.grade_score}%</span>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b' }}>
                                                <AlertCircle size={18} />
                                                <span style={{ fontWeight: 600 }}>Pending</span>
                                            </div>
                                        )}
                                    </div>
                                    <Link to={`/teacher/grading/${sub.id}`} style={{ textDecoration: 'none' }}>
                                        <GlassButton className="primary" style={{ padding: '10px 20px', fontSize: '0.85rem', gap: '8px', whiteSpace: 'nowrap' }}>
                                            {sub.grade_score !== null ? 'View Details' : 'Grade Submission'} <ChevronRight size={16} />
                                        </GlassButton>
                                    </Link>
                                </div>
                            </div>
                        </GlassCard>
                    ))
                ) : (
                    <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
                        No submissions found matching the criteria.
                    </div>
                )}
            </div>
        </div>
    );
};
