import React, { useState, useRef, useEffect } from 'react';
import { GlassCard } from '../../components/common/GlassCard';
import { GlassButton } from '../../components/common/GlassButton';
import { GlassInput } from '../../components/common/GlassInput';
import { FileText, UploadCloud, CheckCircle, Link as LinkIcon, Edit3, Clock, AlertCircle, Sparkles } from 'lucide-react';
import api from '../../services/api';

const SubmissionTimeline = ({ status }) => {
    const steps = [
        { id: 'submitted', label: 'Submitted', icon: CheckCircle },
        { id: 'processing', label: 'Processing', icon: Clock },
        { id: 'reviewed', label: 'Reviewed', icon: FileText }
    ];

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '40px' }}>
            {steps.map((step, idx) => {
                const Icon = step.icon;
                const isActive = status === step.id;
                const isDone = idx === 0 && (status === 'submitted' || status === 'processing' || status === 'reviewed');

                return (
                    <React.Fragment key={step.id}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            <div style={{ 
                                width: '40px', height: '40px', borderRadius: '50%', 
                                background: isDone ? 'rgba(10, 132, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                border: `1px solid ${isDone ? 'var(--accent-blue)' : 'rgba(255, 255, 255, 0.1)'}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: isDone ? 'var(--accent-blue)' : 'var(--text-secondary)',
                                position: 'relative'
                            }}>
                                <Icon size={20} />
                                {isActive && (
                                    <div style={{ position: 'absolute', top: -5, right: -5 }}>
                                        <Sparkles size={14} color="var(--accent-purple)" className="animate-pulse" />
                                    </div>
                                )}
                            </div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: isDone ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                                {step.label}
                            </span>
                        </div>
                        {idx < steps.length - 1 && (
                            <div style={{ width: '40px', height: '1px', background: isDone ? 'var(--accent-blue)' : 'rgba(255, 255, 255, 0.1)', marginTop: '-20px' }} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

export const AssignmentView = ({ assignment }) => {
    const [activeTab, setActiveTab] = useState('url');
    const [fileUrl, setFileUrl] = useState('');
    const [submissionText, setSubmissionText] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    
    const fileInputRef = useRef(null);

    useEffect(() => {
        const fetchSubmission = async () => {
            try {
                const response = await api.get(`assignment-submissions/?assignment=${assignment.id}`);
                const data = response.data.results || response.data;
                if (data && data.length > 0) {
                    setSubmitted(true);
                }
            } catch(err) {
                console.error("Failed to fetch past submission", err);
            }
        };
        fetchSubmission();
    }, [assignment.id]);

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            let finalUrl = fileUrl;
            let finalText = submissionText;

            if (activeTab === 'file' && selectedFile) {
                finalUrl = '';
                finalText = `[Uploaded File]: ${selectedFile.name}`;
            } else if (activeTab === 'url') {
                finalText = '';
            } else if (activeTab === 'text') {
                finalUrl = '';
            }

            await api.post('assignment-submissions/', {
                assignment: assignment.id,
                file_url: finalUrl || null,
                submission_text: finalText || null
            });
            setSubmitted(true);
        } catch (error) {
            console.error("Failed to submit assignment", error);
        } finally {
            setSubmitting(false);
        }
    };

    const isSubmitDisabled = () => {
        if (submitting) return true;
        if (activeTab === 'url' && !fileUrl.trim()) return true;
        if (activeTab === 'text' && !submissionText.trim()) return true;
        if (activeTab === 'file' && !selectedFile) return true;
        return false;
    };

    if (submitted) {
        return (
            <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
                <GlassCard style={{ textAlign: 'center', padding: '60px 40px' }}>
                    <SubmissionTimeline status="submitted" />
                    
                    <div style={{ position: 'relative', display: 'inline-block', marginBottom: '24px' }}>
                        <CheckCircle size={80} color="var(--success)" style={{ filter: 'drop-shadow(0 0 20px rgba(52, 211, 153, 0.4))' }} />
                        <Sparkles size={24} color="var(--accent-purple)" style={{ position: 'absolute', top: -5, right: -5 }} className="animate-bounce" />
                    </div>
                    
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '16px', letterSpacing: '-0.02em' }}>
                        Submission Received
                    </h2>
                    <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '40px', lineHeight: 1.6 }}>
                        Your professional system has been queued for instructor review.
                        <br />
                        <span style={{ fontSize: '0.95rem', opacity: 0.7 }}>Check your gradebook later for detailed feedback.</span>
                    </p>
                    <GlassButton onClick={() => window.history.back()}>
                        Return to Course
                    </GlassButton>
                </GlassCard>
            </div>
        );
    }

    return (
        <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
            {/* Header section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px' }}>
                <div style={{ background: 'rgba(10, 132, 255, 0.15)', padding: '20px', borderRadius: '24px' }}>
                    <FileText size={40} color="var(--accent-blue)" />
                </div>
                <div>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.02em' }}>{assignment.title}</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>Project Submission Task</p>
                </div>
            </div>
            
            {/* Instructions */}
            <GlassCard style={{ marginBottom: '32px', padding: '40px', borderLeft: '4px solid var(--accent-purple)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                    <AlertCircle size={20} color="var(--accent-purple)" />
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>System Requirements</h3>
                </div>
                <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '1.1rem' }}>
                    {assignment.instructions_text || "Please build a functional prototype based on the requirements discussed in this module. Ensure your code follows industry best practices."}
                </div>
                <div style={{ marginTop: '32px', paddingTop: '32px', borderTop: '1px solid var(--glass-border)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '24px' }}>
                    <div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Max Score</p>
                        <h4 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{assignment.max_score} <span style={{ fontSize: '0.8rem', fontWeight: 400 }}>pts</span></h4>
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Supported Files</p>
                        <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{assignment.allowed_file_types || '.zip, .pdf, .js'}</h4>
                    </div>
                </div>
            </GlassCard>

            {/* Submission Area */}
            <GlassCard style={{ padding: '40px' }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '28px' }}>Development Submission</h3>
                
                {/* Custom Tabs */}
                <div style={{ display: 'flex', background: 'rgba(0, 0, 0, 0.03)', borderRadius: '14px', padding: '8px', marginBottom: '32px' }}>
                    {[
                        { id: 'url', label: 'External Repo/URL', icon: LinkIcon },
                        { id: 'text', label: 'Brief / Raw Text', icon: Edit3 },
                        { id: 'file', label: 'Binary Upload', icon: UploadCloud }
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{ 
                                flex: 1, padding: '12px', borderRadius: '10px', border: 'none', 
                                background: activeTab === tab.id ? 'rgba(255,255,255,0.1)' : 'transparent', 
                                color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)', 
                                cursor: 'pointer', transition: 'all 0.3s', 
                                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                gap: '10px', fontWeight: 600, fontSize: '0.9rem' 
                            }}
                        >
                            <tab.icon size={18} /> {tab.label}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', minHeight: '180px' }}>
                    {activeTab === 'url' && (
                        <div className="animate-fade-in">
                            <label style={{ display: 'block', marginBottom: '10px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>
                                Destination Link (GitHub/GitLab/Drive)
                            </label>
                            <GlassInput 
                                type="url" 
                                placeholder="https://github.com/..." 
                                value={fileUrl}
                                onChange={(e) => setFileUrl(e.target.value)}
                            />
                        </div>
                    )}

                    {activeTab === 'text' && (
                        <div className="animate-fade-in">
                            <label style={{ display: 'block', marginBottom: '10px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>
                                Submission Manifest or Raw Comments
                            </label>
                            <textarea 
                                placeholder="Enter project technical details here..."
                                value={submissionText}
                                onChange={(e) => setSubmissionText(e.target.value)}
                                style={{ 
                                    width: '100%', minHeight: '180px', background: 'rgba(0, 0, 0, 0.03)', 
                                    border: '1px solid var(--glass-border)', borderRadius: '14px', 
                                    padding: '20px', color: '#1a1a2e', fontSize: '1.05rem', outline: 'none',
                                    resize: 'vertical', transition: 'all 0.3s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = 'var(--accent-blue)'}
                                onBlur={(e) => e.target.style.borderColor = 'var(--glass-border)'}
                            />
                        </div>
                    )}

                    {activeTab === 'file' && (
                        <div className="animate-fade-in">
                            <label style={{ display: 'block', marginBottom: '10px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>
                                Local Asset Upload
                            </label>
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    setIsDragging(false);
                                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                        setSelectedFile(e.dataTransfer.files[0]);
                                    }
                                }}
                                style={{ 
                                    border: `2px dashed ${isDragging ? 'var(--accent-blue)' : 'var(--glass-border)'}`, 
                                    borderRadius: '20px', 
                                    padding: '50px 20px', 
                                    textAlign: 'center', 
                                    cursor: 'pointer',
                                    background: isDragging ? 'rgba(10, 132, 255, 0.05)' : 'rgba(255,255,255,0.02)',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    transform: isDragging ? 'scale(1.02)' : 'scale(1)'
                                }}
                            >
                                <UploadCloud size={48} color={selectedFile ? "var(--success)" : "var(--accent-blue)"} style={{ opacity: 0.8, marginBottom: '20px' }} />
                                {selectedFile ? (
                                    <div>
                                        <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.1rem', marginBottom: '4px' }}>{selectedFile.name}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Click or drag to replace asset</div>
                                    </div>
                                ) : (
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
                                        <strong>Click to Browse</strong> or Drag & Drop File
                                    </div>
                                )}
                            </div>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                style={{ display: 'none' }}
                                onChange={(e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                        setSelectedFile(e.target.files[0]);
                                    }
                                }}
                            />
                        </div>
                    )}

                    <GlassButton 
                        primary 
                        onClick={handleSubmit} 
                        disabled={isSubmitDisabled()}
                        style={{ 
                            gap: '12px', padding: '20px', marginTop: '24px', 
                            width: '100%', fontSize: '1.2rem', fontWeight: 800,
                            boxShadow: isSubmitDisabled() ? 'none' : '0 10px 40px rgba(10, 132, 255, 0.25)'
                        }}
                    >
                        <CheckCircle size={22} />
                        {submitting ? 'Transmitting Data...' : 'Finalize Solution Submission'}
                    </GlassButton>
                </div>
            </GlassCard>
        </div>
    );
};
