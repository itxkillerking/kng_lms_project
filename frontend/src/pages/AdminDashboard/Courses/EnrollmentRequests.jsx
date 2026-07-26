import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { GlassCard } from '../../../components/common/GlassCard';
import { GlassButton } from '../../../components/common/GlassButton';
import { CheckCircle, XCircle, Search, AlertCircle, Book, User as UserIcon } from 'lucide-react';

export const EnrollmentRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [rejectReason, setRejectReason] = useState("");
    const [showRejectModal, setShowRejectModal] = useState(null);

    const fetchRequests = async () => {
        try {
            const response = await api.get('courses/pending_enrollments/');
            setRequests(response.data);
        } catch (error) {
            console.error('Error fetching enrollment requests:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleApprove = async (id) => {
        setProcessingId(id);
        try {
            await api.post(`courses/${id}/approve_enrollment/`);
            setRequests(requests.filter(req => req.id !== id));
        } catch (error) {
            console.error('Error approving enrollment:', error);
            alert("Failed to approve enrollment.");
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (id) => {
        if (!rejectReason.trim()) {
            alert("Please provide a reason for rejection.");
            return;
        }
        
        setProcessingId(id);
        try {
            await api.post(`courses/${id}/reject_enrollment/`, { reason: rejectReason });
            setRequests(requests.filter(req => req.id !== id));
            setShowRejectModal(null);
            setRejectReason("");
        } catch (error) {
            console.error('Error rejecting enrollment:', error);
            alert("Failed to reject enrollment.");
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
            <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid rgba(10, 132, 255, 0.2)', borderTopColor: '#0A84FF', borderRadius: '50%' }} />
        </div>
    );

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#1a1a2e', marginBottom: '8px' }}>Enrollment Requests</h2>
                <p style={{ color: '#64748b', fontSize: '1rem' }}>Review and approve student course enrollment applications.</p>
            </div>

            {requests.length === 0 ? (
                <GlassCard style={{ padding: '60px 20px', textAlign: 'center', borderRadius: '24px' }}>
                    <div style={{ width: '64px', height: '64px', background: 'rgba(10, 132, 255, 0.05)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                        <CheckCircle size={32} color="#0A84FF" opacity={0.5} />
                    </div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1a1a2e', marginBottom: '8px' }}>All Caught Up!</h3>
                    <p style={{ color: '#64748b' }}>There are no pending enrollment requests at this time.</p>
                </GlassCard>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {requests.map((req) => (
                        <GlassCard key={req.id} style={{ padding: '24px', borderRadius: '20px', borderLeft: '4px solid #F5A623', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                                    <UserIcon size={24} />
                                </div>
                                <div>
                                    <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1a1a2e', marginBottom: '4px' }}>{req.student_name || req.student_username}</h4>
                                    <div style={{ display: 'flex', gap: '16px', color: '#64748b', fontSize: '0.85rem' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Book size={14} /> {req.course_title}</span>
                                        <span>•</span>
                                        <span>{new Date(req.enrolled_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <GlassButton 
                                    onClick={() => setShowRejectModal(req.id)}
                                    disabled={processingId === req.id}
                                    style={{ background: 'rgba(255, 69, 58, 0.1)', color: '#FF453A', border: '1px solid rgba(255, 69, 58, 0.2)', padding: '10px 20px', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 700 }}
                                >
                                    Reject
                                </GlassButton>
                                <GlassButton 
                                    onClick={() => handleApprove(req.id)}
                                    disabled={processingId === req.id}
                                    style={{ background: '#30D158', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 700 }}
                                >
                                    {processingId === req.id ? 'Approving...' : 'Approve'}
                                </GlassButton>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(8px)' }}>
                    <div style={{ background: 'rgba(255, 255, 255, 0.95)', padding: '32px', borderRadius: '24px', maxWidth: '400px', width: '100%', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', color: '#FF453A' }}>
                            <AlertCircle size={24} />
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Reject Enrollment</h3>
                        </div>
                        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '16px' }}>Please provide a reason for rejecting this student's enrollment. This will be sent as a notification to the student.</p>
                        
                        <textarea 
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Reason for rejection..."
                            style={{
                                width: '100%',
                                minHeight: '100px',
                                padding: '16px',
                                borderRadius: '12px',
                                border: '1px solid rgba(0,0,0,0.1)',
                                background: 'rgba(0,0,0,0.02)',
                                marginBottom: '24px',
                                fontSize: '0.9rem',
                                resize: 'vertical'
                            }}
                        />
                        
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <GlassButton 
                                onClick={() => {
                                    setShowRejectModal(null);
                                    setRejectReason("");
                                }}
                                style={{ flex: 1, background: 'rgba(0,0,0,0.05)', color: '#64748b', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 700 }}
                            >
                                Cancel
                            </GlassButton>
                            <GlassButton 
                                onClick={() => handleReject(showRejectModal)}
                                disabled={processingId === showRejectModal}
                                style={{ flex: 1, background: '#FF453A', color: 'white', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: 700 }}
                            >
                                {processingId === showRejectModal ? 'Processing...' : 'Confirm Reject'}
                            </GlassButton>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
