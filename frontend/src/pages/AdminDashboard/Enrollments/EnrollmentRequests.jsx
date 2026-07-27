import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { GlassCard } from '../../../components/common/GlassCard';
import { GlassButton } from '../../../components/common/GlassButton';
import { Check, X, Lock, Unlock, Clock } from 'lucide-react';

export const EnrollmentRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    const fetchRequests = async () => {
        try {
            const response = await api.get('enrollment-requests/');
            setRequests(response.data.results || response.data);
        } catch (error) {
            console.error('Failed to fetch enrollment requests', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleAction = async (id, action) => {
        setActionLoading(id);
        try {
            await api.post(`enrollment-requests/${id}/${action}/`);
            // Refresh list
            await fetchRequests();
        } catch (error) {
            console.error(`Failed to ${action} request`, error);
            alert(`Failed to ${action} request`);
        } finally {
            setActionLoading(null);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'pending': return { bg: 'rgba(255, 149, 0, 0.1)', color: '#FF9500' };
            case 'accepted': return { bg: 'rgba(48, 209, 88, 0.1)', color: '#30D158' };
            case 'rejected': return { bg: 'rgba(255, 69, 58, 0.1)', color: '#FF453A' };
            case 'locked': return { bg: 'rgba(142, 142, 147, 0.1)', color: '#8E8E93' };
            default: return { bg: 'rgba(255, 255, 255, 0.1)', color: 'white' };
        }
    };

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="animate-spin" style={{ width: '30px', height: '30px', border: '3px solid rgba(0,0,0,0.1)', borderTopColor: 'var(--accent-blue)', borderRadius: '50%' }}></div></div>;
    }

    return (
        <div>
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '8px' }}>Enrollment Requests</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Manage student enrollment applications.</p>
            </div>

            <GlassCard style={{ overflow: 'hidden' }}>
                {requests.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        No enrollment requests found.
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', backgroundColor: 'rgba(0,0,0,0.02)' }}>
                                    <th style={{ padding: '16px', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Student</th>
                                    <th style={{ padding: '16px', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Course</th>
                                    <th style={{ padding: '16px', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Date</th>
                                    <th style={{ padding: '16px', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Status</th>
                                    <th style={{ padding: '16px', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(Array.isArray(requests) ? requests : []).map(req => {
                                    const style = getStatusStyle(req.status);
                                    const isActing = actionLoading === req.id;
                                    
                                    return (
                                        <tr key={req.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                            <td style={{ padding: '16px', fontWeight: 600 }}>{req.student_name}</td>
                                            <td style={{ padding: '16px' }}>{req.course_title}</td>
                                            <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                                {new Date(req.created_at).toLocaleDateString()}
                                            </td>
                                            <td style={{ padding: '16px' }}>
                                                <span style={{ 
                                                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                    padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600,
                                                    backgroundColor: style.bg, color: style.color, textTransform: 'capitalize'
                                                }}>
                                                    {req.status === 'pending' && <Clock size={12} />}
                                                    {req.status === 'accepted' && <Check size={12} />}
                                                    {req.status === 'rejected' && <X size={12} />}
                                                    {req.status === 'locked' && <Lock size={12} />}
                                                    {req.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '16px', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                    {req.status === 'pending' && (
                                                        <>
                                                            <GlassButton 
                                                                onClick={() => handleAction(req.id, 'accept')}
                                                                disabled={isActing}
                                                                style={{ padding: '6px 12px', fontSize: '0.8rem', background: '#30D158', color: 'white', border: 'none' }}
                                                            >
                                                                <Check size={14} style={{ marginRight: '4px' }}/> Accept
                                                            </GlassButton>
                                                            <GlassButton 
                                                                onClick={() => handleAction(req.id, 'reject')}
                                                                disabled={isActing}
                                                                style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'rgba(255, 69, 58, 0.1)', color: '#FF453A', border: 'none' }}
                                                            >
                                                                <X size={14} style={{ marginRight: '4px' }}/> Reject
                                                            </GlassButton>
                                                        </>
                                                    )}
                                                    
                                                    {req.status !== 'locked' && req.status !== 'accepted' && (
                                                        <GlassButton 
                                                            onClick={() => handleAction(req.id, 'lock')}
                                                            disabled={isActing}
                                                            style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'rgba(142, 142, 147, 0.1)', color: '#8E8E93', border: 'none' }}
                                                        >
                                                            <Lock size={14} style={{ marginRight: '4px' }}/> Lock
                                                        </GlassButton>
                                                    )}

                                                    {req.status === 'locked' && (
                                                        <GlassButton 
                                                            onClick={() => handleAction(req.id, 'unlock')}
                                                            disabled={isActing}
                                                            style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'rgba(10, 132, 255, 0.1)', color: '#0A84FF', border: 'none' }}
                                                        >
                                                            <Unlock size={14} style={{ marginRight: '4px' }}/> Unlock
                                                        </GlassButton>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </GlassCard>
        </div>
    );
};
