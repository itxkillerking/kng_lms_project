import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../../components/common/GlassCard';
import { GlassButton } from '../../../components/common/GlassButton';
import { Users, GraduationCap, ShieldAlert, BarChart3, Search, Clock, CheckCircle, XCircle, FileImage, ExternalLink } from 'lucide-react';
import api from '../../../services/api';

export const StudentManager = () => {
    const [students, setStudents] = useState([]);
    const [suspensionRequests, setSuspensionRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [reason, setReason] = useState('');
    const [proofFile, setProofFile] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [studentsRes, requestsRes] = await Promise.all([
                api.get('users/instructor-students/'),
                api.get('users/suspension-requests/')
            ]);
            setStudents(Array.isArray(studentsRes.data) ? studentsRes.data : []);
            setSuspensionRequests(Array.isArray(requestsRes.data) ? requestsRes.data : requestsRes.data.results || []);
        } catch (error) {
            console.error("Error fetching student data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const openModal = (student) => {
        setSelectedStudent(student);
        setReason('');
        setProofFile(null);
        setShowModal(true);
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setProofFile(e.target.files[0]);
        }
    };

    const submitSuspensionRequest = async (e) => {
        e.preventDefault();
        if (!selectedStudent || !reason) return;

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('student', selectedStudent.student_id);
            formData.append('reason', reason);
            if (proofFile) {
                formData.append('proof', proofFile);
            }

            await api.post('users/suspension-requests/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            alert('Suspension request submitted successfully. Admin will review it shortly.');
            setShowModal(false);
            fetchData(); // Refresh requests list
        } catch (error) {
            console.error("Error submitting suspension request:", error);
            alert('Failed to submit request. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredStudents = students.filter(s => 
        s.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.student_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.course_title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getRequestStatusForStudent = (studentId) => {
        // Return latest pending/approved request
        const reqs = suspensionRequests.filter(r => r.student === studentId);
        if (reqs.length === 0) return null;
        reqs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        return reqs[0];
    };

    return (
        <div className="animate-fade-in">
            <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px', color: 'white' }}>My Students</h1>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.1rem' }}>Track progress and manage enrolled scholars across your courses.</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                <GlassCard style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(10, 132, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Users size={24} color="#0A84FF" />
                        </div>
                        <div>
                            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Total Enrollments</p>
                            <h3 style={{ fontSize: '1.8rem', fontWeight: 800 }}>{students.length}</h3>
                        </div>
                    </div>
                </GlassCard>

                <GlassCard style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(191, 90, 242, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ShieldAlert size={24} color="#BF5AF2" />
                        </div>
                        <div>
                            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Your Requests</p>
                            <h3 style={{ fontSize: '1.8rem', fontWeight: 800 }}>{suspensionRequests.length}</h3>
                        </div>
                    </div>
                </GlassCard>
            </div>

            <div style={{ display: 'flex', marginBottom: '24px' }}>
                 <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                    <input 
                        className="glass-input" 
                        placeholder="Search students or courses..." 
                        style={{ paddingLeft: '48px', width: '100%', marginBottom: 0 }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <GlassCard heavy style={{ padding: '0', overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '60px', textAlign: 'center' }}>
                        <div className="spinner" style={{ margin: '0 auto 20px' }}></div>
                        <p style={{ color: 'rgba(255,255,255,0.5)' }}>Loading student metrics...</p>
                    </div>
                ) : students.length === 0 ? (
                    <div style={{ padding: '60px', textAlign: 'center' }}>
                        <GraduationCap size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>No students enrolled yet</h3>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                    <th style={{ padding: '20px', fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Student</th>
                                    <th style={{ padding: '20px', fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Course</th>
                                    <th style={{ padding: '20px', fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Progress Track</th>
                                    <th style={{ padding: '20px', fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.map((enrollment) => {
                                    const requestStatus = getRequestStatusForStudent(enrollment.student_id);
                                    const isSuspended = enrollment.account_status === 'suspended';

                                    return (
                                        <tr key={enrollment.enrollment_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '20px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(10,132,255,0.2), rgba(191,90,242,0.2))', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 700, color: '#0A84FF', border: '1px solid rgba(10,132,255,0.3)' }}>
                                                        {enrollment.student_username[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <h4 style={{ fontWeight: 600, color: 'white', marginBottom: '2px' }}>{enrollment.student_name}</h4>
                                                        <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>{enrollment.student_email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '20px', fontSize: '0.95rem', fontWeight: 500 }}>
                                                {enrollment.course_title}
                                            </td>
                                            <td style={{ padding: '20px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{ flex: 1, minWidth: '100px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                                        <div style={{ width: `${enrollment.progress}%`, height: '100%', background: enrollment.progress === 100 ? '#10b981' : '#0A84FF', borderRadius: '3px' }}></div>
                                                    </div>
                                                    <span style={{ fontSize: '0.9rem', fontWeight: 700, minWidth: '40px' }}>{enrollment.progress}%</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '20px' }}>
                                                {isSuspended ? (
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '6px 12px', background: 'rgba(255, 69, 58, 0.1)', color: '#ff453a', borderRadius: '12px', fontWeight: 600 }}>
                                                        <XCircle size={14} /> System Suspended
                                                    </span>
                                                ) : requestStatus && requestStatus.status === 'pending' ? (
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '6px 12px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', borderRadius: '12px', fontWeight: 600 }}>
                                                        <Clock size={14} /> Pending Review
                                                    </span>
                                                ) : requestStatus && requestStatus.status === 'rejected' ? (
                                                     <GlassButton 
                                                        onClick={() => openModal(enrollment)}
                                                        style={{ padding: '8px 16px', fontSize: '0.8rem', gap: '6px' }}
                                                    >
                                                        <ShieldAlert size={14} /> Re-Request
                                                    </GlassButton>
                                                ) : (
                                                    <GlassButton 
                                                        onClick={() => openModal(enrollment)}
                                                        style={{ padding: '8px 16px', fontSize: '0.8rem', color: '#ff453a', background: 'rgba(255, 69, 58, 0.05)', borderColor: 'rgba(255, 69, 58, 0.2)', gap: '6px' }}
                                                    >
                                                        <ShieldAlert size={14} /> Request Suspend
                                                    </GlassButton>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </GlassCard>

            {/* Suspension Request Modal */}
            {showModal && selectedStudent && (
                 <div style={{
                    position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                }}>
                    <GlassCard heavy style={{ maxWidth: '500px', width: '100%', position: 'relative' }}>
                        <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                            <XCircle size={24} />
                        </button>
                        
                        <div style={{ marginBottom: '24px' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255, 69, 58, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                                <ShieldAlert size={24} color="#ff453a" />
                            </div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '8px' }}>Request Suspension</h2>
                            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
                                For student: <strong style={{ color: 'white' }}>{selectedStudent.student_name}</strong>
                            </p>
                        </div>

                        <form onSubmit={submitSuspensionRequest} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reason for Suspension</label>
                                <textarea 
                                    className="glass-input"
                                    required
                                    placeholder="Please describe in detail why this student should be suspended..."
                                    style={{ minHeight: '120px', resize: 'vertical' }}
                                    value={reason}
                                    onChange={e => setReason(e.target.value)}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Attach Proof (Image/PDF)</label>
                                <div style={{ position: 'relative', border: '1px dashed rgba(255,255,255,0.2)', padding: '20px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', textAlign: 'center' }}>
                                    <input 
                                        type="file" 
                                        onChange={handleFileChange}
                                        style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                                        accept="image/*,.pdf"
                                        required
                                    />
                                    {proofFile ? (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#0A84FF', fontWeight: 600 }}>
                                            <CheckCircle size={18} />
                                            {proofFile.name}
                                        </div>
                                    ) : (
                                        <div style={{ color: 'rgba(255,255,255,0.4)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                            <FileImage size={24} />
                                            <span style={{ fontSize: '0.9rem' }}>Click to upload screenshot or document</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                                <GlassButton type="button" onClick={() => setShowModal(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</GlassButton>
                                <GlassButton type="submit" disabled={isSubmitting || !proofFile} style={{ flex: 2, justifyContent: 'center', background: '#ff453a', border: 'none', color: 'white', fontWeight: 700 }}>
                                    {isSubmitting ? 'Submitting...' : 'Submit to Admin'}
                                </GlassButton>
                            </div>
                        </form>
                    </GlassCard>
                </div>
            )}
        </div>
    );
};
