import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../components/common/GlassCard';
import { GlassButton } from '../../components/common/GlassButton';
import { HelpCircle, CheckCircle, XCircle, Clock, FileText, AlertCircle, Sparkles, Trophy } from 'lucide-react';
import api from '../../services/api';

const CircularProgress = ({ total, answered }) => {
    const percentage = total === 0 ? 0 : (answered / total) * 100;
    const radius = 24;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div style={{ position: 'relative', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="60" height="60" style={{ transform: 'rotate(-90deg)' }}>
                <circle
                    cx="30"
                    cy="30"
                    r={radius}
                    stroke="rgba(255, 255, 255, 0.05)"
                    strokeWidth="4"
                    fill="transparent"
                />
                <circle
                    cx="30"
                    cy="30"
                    r={radius}
                    stroke="var(--accent-blue)"
                    strokeWidth="4"
                    fill="transparent"
                    strokeDasharray={circumference}
                    style={{ 
                        strokeDashoffset: offset,
                        transition: 'stroke-dashoffset 0.5s ease'
                    }}
                    strokeLinecap="round"
                />
            </svg>
            <div style={{ position: 'absolute', fontSize: '0.75rem', fontWeight: 800, color: '#1a1a2e' }}>
                {Math.round(percentage)}%
            </div>
        </div>
    );
};

export const QuizView = ({ quiz }) => {
    const [started, setStarted] = useState(false);
    const [answers, setAnswers] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);

    useEffect(() => {
        setStarted(false);
        setAnswers({});
        setResult(null);

        const fetchAttempt = async () => {
            try {
                const response = await api.get(`quiz-attempts/?quiz=${quiz.id}`);
                const data = response.data.results || response.data;
                if (data && data.length > 0) {
                    setResult(data[0]);
                    setStarted(true);
                }
            } catch(err) {
                console.error("Failed to fetch past attempts", err);
            }
        };
        fetchAttempt();
    }, [quiz.id]);

    const handleOptionSelect = (questionId, option) => {
        if (result) return;
        setAnswers(prev => ({ ...prev, [questionId]: option }));
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const response = await api.post('quiz-attempts/', {
                quiz: quiz.id,
                answers: answers
            });
            setResult(response.data);
        } catch (error) {
            console.error("Failed to submit quiz", error);
        } finally {
            setSubmitting(false);
        }
    };

    if (result) {
        return (
            <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', width: '100%', position: 'relative' }}>
                {result.passed && (
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '400px', pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
                        <div style={{ 
                            position: 'absolute', top: '-100px', left: '50%', transform: 'translateX(-50%)', 
                            width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(191, 90, 242, 0.4) 0%, transparent 70%)',
                            filter: 'blur(60px)', opacity: 0.6, animation: 'pulse 4s infinite'
                        }}></div>
                    </div>
                )}
                <GlassCard style={{ textAlign: 'center', padding: '60px 40px', position: 'relative', zIndex: 1, border: result.passed ? '1px solid rgba(191, 90, 242, 0.3)' : '1px solid var(--glass-border)' }}>
                    {result.passed ? (
                        <>
                            <div style={{ position: 'relative', display: 'inline-block', marginBottom: '32px' }}>
                                <Trophy size={80} color="#FFD700" style={{ filter: 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.4))' }} />
                                <div style={{ position: 'absolute', top: -10, right: -10 }}>
                                    <Sparkles size={24} color="#FFD700" className="animate-bounce" />
                                </div>
                            </div>
                            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '16px', textShadow: '0 0 30px rgba(191, 90, 242, 0.5)' }}>
                                Congratulations!
                            </h2>
                        </>
                    ) : (
                        <>
                            <AlertCircle size={80} color="var(--danger)" style={{ marginBottom: '32px', opacity: 0.8 }} />
                            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '16px' }}>
                                Keep Pushing!
                            </h2>
                        </>
                    )}
                    
                    <p style={{ fontSize: '1.4rem', color: 'var(--text-secondary)', marginBottom: '40px' }}>
                        You scored <span style={{ color: result.passed ? 'var(--success)' : 'var(--danger)', fontWeight: 800 }}>{result.score}%</span>
                        <br />
                        <span style={{ fontSize: '0.95rem', opacity: 0.7 }}>Platform Requirement: {quiz.passing_score}%</span>
                    </p>

                    <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                        <GlassButton onClick={() => { setResult(null); setAnswers({}); setStarted(false); }} style={{ padding: '16px 32px' }}>
                            Retake Assessment
                        </GlassButton>
                        {result.passed && (
                            <GlassButton primary style={{ padding: '16px 32px' }} onClick={() => window.history.back()}>
                                Continue Course
                            </GlassButton>
                        )}
                    </div>
                </GlassCard>

                <style>{`
                    @keyframes pulse {
                        0% { opacity: 0.4; transform: translateX(-50%) scale(1); }
                        50% { opacity: 0.7; transform: translateX(-50%) scale(1.2); }
                        100% { opacity: 0.4; transform: translateX(-50%) scale(1); }
                    }
                `}</style>
            </div>
        );
    }

    if (!started) {
        return (
            <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
                <GlassCard style={{ padding: '40px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px' }}>
                        <div style={{ background: 'rgba(10, 132, 255, 0.15)', padding: '20px', borderRadius: '24px' }}>
                            <HelpCircle size={48} color="var(--accent-blue)" />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '2.8rem', fontWeight: 900, letterSpacing: '-0.02em' }}>{quiz.title}</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Pre-Assessment Briefing</p>
                        </div>
                    </div>

                    <div style={{ background: 'rgba(0, 0, 0, 0.02)', padding: '32px', borderRadius: '24px', border: '1px solid var(--glass-border)', marginBottom: '40px' }}>
                        <p style={{ color: 'var(--text-primary)', marginBottom: '24px', fontSize: '1.1rem', lineHeight: 1.7 }}>
                            {quiz.description || "This assessment tests your knowledge of the core concepts covered in the previous lessons. Please read each question carefully."}
                        </p>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <FileText size={20} color="var(--accent-blue)" />
                                <span style={{ color: 'var(--text-secondary)' }}>{quiz.questions?.length || 0} Questions</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Trophy size={20} color="#FFD700" />
                                <span style={{ color: 'var(--text-secondary)' }}>Goal: {quiz.passing_score}%</span>
                            </div>
                        </div>
                    </div>

                    <GlassButton 
                        primary 
                        style={{ width: '100%', padding: '20px', fontSize: '1.25rem', fontWeight: 800, borderRadius: '20px' }}
                        onClick={() => setStarted(true)}
                        disabled={quiz.questions?.length === 0}
                    >
                        {quiz.questions?.length === 0 ? 'No Questions Available' : 'Initialize Quiz Session'}
                    </GlassButton>
                </GlassCard>
            </div>
        );
    }

    return (
        <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <CircularProgress total={quiz.questions?.length || 0} answered={Object.keys(answers).length} />
                    <div>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>{quiz.title}</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Assessment in Progress</p>
                    </div>
                </div>
                <div style={{ 
                    padding: '10px 20px', 
                    background: 'rgba(0, 0, 0, 0.03)', 
                    borderRadius: '16px', 
                    fontSize: '0.85rem', 
                    fontWeight: 700,
                    color: 'var(--text-secondary)', 
                    border: '1px solid var(--glass-border)' 
                }}>
                    {Object.keys(answers).length} / {quiz.questions?.length || 0}
                </div>
            </div>

            {quiz.questions?.map((q, idx) => (
                <GlassCard key={q.id} style={{ marginBottom: '28px', padding: '40px', border: answers[q.id] ? '1px solid rgba(10, 132, 255, 0.4)' : '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', gap: '20px' }}>
                        <div style={{ width: '32px', height: '32px', background: 'rgba(10, 132, 255, 0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 800, color: 'var(--accent-blue)', flexShrink: 0 }}>
                            {idx + 1}
                        </div>
                        <h3 style={{ fontSize: '1.3rem', fontWeight: 600, lineHeight: 1.5, marginBottom: '32px' }}>
                            {q.text}
                        </h3>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {q.options_data?.map((opt, oIdx) => (
                            <button 
                                key={oIdx}
                                onClick={() => handleOptionSelect(q.id, opt)}
                                style={{
                                    padding: '20px 24px',
                                    borderRadius: '16px',
                                    background: answers[q.id] === opt ? 'rgba(10, 132, 255, 0.15)' : 'rgba(255,255,255,0.03)',
                                    border: `1px solid ${answers[q.id] === opt ? 'var(--accent-blue)' : 'rgba(255,255,255,0.08)'}`,
                                    cursor: 'pointer',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px',
                                    width: '100%',
                                    textAlign: 'left',
                                    fontSize: '1.05rem',
                                    color: answers[q.id] === opt ? 'white' : 'var(--text-secondary)',
                                    outline: 'none'
                                }}
                                onMouseEnter={(e) => {
                                    if (answers[q.id] !== opt) {
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (answers[q.id] !== opt) {
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                                    }
                                }}
                            >
                                <div style={{ 
                                    width: '24px', height: '24px', borderRadius: '50%', 
                                    border: `2px solid ${answers[q.id] === opt ? 'var(--accent-blue)' : 'rgba(255,255,255,0.15)'}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0,
                                    transition: 'all 0.3s'
                                }}>
                                    {answers[q.id] === opt && <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--accent-blue)', boxShadow: '0 0 10px var(--accent-blue)' }} />}
                                </div>
                                {opt}
                            </button>
                        ))}
                    </div>
                </GlassCard>
            ))}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '40px', paddingBottom: '80px' }}>
                <GlassButton 
                    primary 
                    onClick={handleSubmit} 
                    disabled={submitting || Object.keys(answers).length !== (quiz.questions?.length || 0)}
                    style={{ 
                        padding: '20px 60px', 
                        fontSize: '1.2rem', 
                        fontWeight: 800,
                        borderRadius: '18px',
                        boxShadow: Object.keys(answers).length === (quiz.questions?.length || 0) ? '0 10px 40px rgba(10, 132, 255, 0.3)' : 'none'
                    }}
                >
                    {submitting ? 'Authenticating Answers...' : 'Finalize & Submit'}
                </GlassButton>
            </div>
        </div>
    );
};
