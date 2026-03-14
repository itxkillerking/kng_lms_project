import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../components/common/GlassCard';
import { GlassButton } from '../../components/common/GlassButton';
import { Award, BookOpen, CheckCircle, Clock, ArrowLeft, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const Gradebook = () => {
    const navigate = useNavigate();
    const [combinedQuizzes, setCombinedQuizzes] = useState([]);
    const [combinedAssignments, setCombinedAssignments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGrades = async () => {
            try {
                const [quizRes, assignRes, coursesRes] = await Promise.all([
                    api.get('quiz-attempts/'),
                    api.get('assignment-submissions/'),
                    api.get('courses/')
                ]);
                
                const attempts = Array.isArray(quizRes.data) ? quizRes.data : quizRes.data.results || [];
                const submissions = Array.isArray(assignRes.data) ? assignRes.data : assignRes.data.results || [];
                const courses = Array.isArray(coursesRes.data) ? coursesRes.data : coursesRes.data.results || [];

                // Extract all existing quizzes and assignments across enrolled courses
                let allQuizzes = [];
                let allAssignments = [];

                courses.forEach(course => {
                    course.modules?.forEach(module => {
                        module.quizzes?.forEach(q => {
                            allQuizzes.push({ ...q, course_id: course.id, course_title: course.title });
                        });
                        module.assignments?.forEach(a => {
                            allAssignments.push({ ...a, course_id: course.id, course_title: course.title });
                        });
                    });
                });

                // Map attempts to quizzes
                const quizzesMerged = allQuizzes.map(sysQuiz => {
                    // Try to find if user has attempted this quiz
                    const userAttempt = attempts.find(a => a.quiz === sysQuiz.id);
                    if (userAttempt) {
                        return { ...sysQuiz, isAttempted: true, attemptData: userAttempt };
                    }
                    return { ...sysQuiz, isAttempted: false, attemptData: null };
                });

                // Map submissions to assignments
                const assignsMerged = allAssignments.map(sysAssign => {
                    // Try to find if user submitted this assignment
                    const userSub = submissions.find(s => s.assignment === sysAssign.id);
                    if (userSub) {
                        return { ...sysAssign, isSubmitted: true, subData: userSub };
                    }
                    return { ...sysAssign, isSubmitted: false, subData: null };
                });

                setCombinedQuizzes(quizzesMerged);
                setCombinedAssignments(assignsMerged);
            } catch (error) {
                console.error("Error fetching grades:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchGrades();
    }, []);

    if (loading) {
        return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading your grades...</div>;
    }

    return (
        <div style={{ minHeight: '100vh', padding: '40px 20px', maxWidth: '1000px', margin: '0 auto' }}>
            {/* Header & Back Button */}
            <div style={{ marginBottom: '40px' }}>
                <GlassButton onClick={() => navigate('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '0.9rem', marginBottom: '24px', width: 'fit-content' }}>
                    <ArrowLeft size={16} /> Back to Dashboard
                </GlassButton>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ background: 'rgba(168, 85, 247, 0.1)', padding: '16px', borderRadius: '50%' }}>
                        <Award size={40} color="var(--accent-purple)" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 600 }}>My Gradebook</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Track your academic progress and pending tasks.</p>
                    </div>
                </div>
            </div>

            <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <CheckCircle size={24} color="var(--accent-blue)" /> Quiz Results
            </h2>
            <div style={{ display: 'grid', gap: '16px', marginBottom: '40px' }}>
                {combinedQuizzes.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)' }}>No quizzes assigned yet.</p>
                ) : (
                    combinedQuizzes.map((item, idx) => (
                        <GlassCard key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px' }}>
                            <div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 500, marginBottom: '8px' }}>{item.title}</h3>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                    {item.course_title}
                                </div>
                                {item.isAttempted && (
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                                        Attempted on: {new Date(item.attemptData.created_at).toLocaleDateString()}
                                    </div>
                                )}
                            </div>
                            <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '16px' }}>
                                {item.isAttempted ? (
                                    <>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: item.attemptData.passed ? 'var(--success-color, #10b981)' : 'var(--error-color, #ef4444)' }}>
                                                {item.attemptData.score}%
                                            </div>
                                            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                                {item.attemptData.passed ? 'Passed' : 'Failed'}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div style={{ textAlign: 'right', marginRight: '16px' }}>
                                            <div style={{ fontSize: '0.9rem', color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <AlertCircle size={16} /> Pending
                                            </div>
                                        </div>
                                        <GlassButton onClick={() => navigate(`/learn/${item.course_id}`)} style={{ borderColor: 'var(--warning)', color: 'var(--warning)' }}>
                                            Start Quiz
                                        </GlassButton>
                                    </>
                                )}
                            </div>
                        </GlassCard>
                    ))
                )}
            </div>

            <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <BookOpen size={24} color="var(--accent-purple)" /> Assignment Submissions
            </h2>
            <div style={{ display: 'grid', gap: '16px', marginBottom: '40px' }}>
                {combinedAssignments.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)' }}>No assignments given yet.</p>
                ) : (
                    combinedAssignments.map((item, idx) => (
                        <GlassCard key={idx} style={{ padding: '20px 24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 500, marginBottom: '8px' }}>{item.title}</h3>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: item.isSubmitted ? '16px' : '0' }}>
                                        {item.course_title}
                                    </div>
                                    {item.isSubmitted && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                            <Clock size={14} /> Submitted on {new Date(item.subData.created_at).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                                <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    {item.isSubmitted ? (
                                        item.subData.grade_score !== null ? (
                                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success-color, #10b981)' }}>
                                                {item.subData.grade_score} pts
                                            </div>
                                        ) : (
                                            <div style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.1)', borderRadius: '20px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                                Pending Review
                                            </div>
                                        )
                                    ) : (
                                        <>
                                            <div style={{ fontSize: '0.9rem', color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '6px', marginRight: '8px' }}>
                                                <AlertCircle size={16} /> Missing
                                            </div>
                                            <GlassButton onClick={() => navigate(`/learn/${item.course_id}`)}>
                                                Upload Assignment
                                            </GlassButton>
                                        </>
                                    )}
                                </div>
                            </div>
                            
                            {item.isSubmitted && item.subData.instructor_feedback && (
                                <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px', borderLeft: '3px solid var(--accent-purple)', marginTop: '20px' }}>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        Instructor Feedback
                                    </div>
                                    <p style={{ fontSize: '0.95rem', lineHeight: 1.5 }}>{item.subData.instructor_feedback}</p>
                                </div>
                            )}
                        </GlassCard>
                    ))
                )}
            </div>
        </div>
    );
};

export default Gradebook;
