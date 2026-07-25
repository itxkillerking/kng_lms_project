import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../../components/common/GlassCard';
import { GlassButton } from '../../../components/common/GlassButton';
import { 
    Users, 
    ShieldCheck, 
    UserX, 
    UserCheck, 
    Trash2, 
    Search, 
    Filter,
    MoreVertical,
    Mail,
    Calendar,
    BadgeCheck,
    AlertCircle,
    History,
    ChevronDown,
    ShieldAlert,
    Clock,
    UserPlus,
    XCircle
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';
import { GlassSelect } from '../../../components/common/GlassSelect';

export const UserControlPanel = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [activityLogs, setActivityLogs] = useState([]);
    const [suspensionRequests, setSuspensionRequests] = useState([]);
    const [revokeRequests, setRevokeRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [activeTab, setActiveTab] = useState('users'); // 'users', 'logs', 'suspension', 'revoke'

    const fetchData = async () => {
        setLoading(true);
        try {
            const promises = [
                api.get('users/admin/').catch(e => ({ data: [] })),
                api.get('users/suspension-requests/').catch(e => ({ data: [] }))
            ];
            
            if (currentUser?.role === 'admin') {
                promises.push(api.get('users/admin/activity_logs/').catch(e => ({ data: [] })));
                promises.push(api.get('users/revoke-requests/').catch(e => ({ data: [] })));
            } else if (currentUser?.role === 'staff') {
                promises.push(Promise.resolve({ data: [] })); 
                promises.push(api.get('users/revoke-requests/').catch(e => ({ data: [] }))); 
            }

            const [usersRes, suspensionRes, logsRes, revokeRes] = await Promise.all(promises);
            setUsers(Array.isArray(usersRes?.data) ? usersRes.data : usersRes?.data?.results || []);
            setSuspensionRequests(Array.isArray(suspensionRes?.data) ? suspensionRes.data : suspensionRes?.data?.results || []);
            if (logsRes) setActivityLogs(Array.isArray(logsRes?.data) ? logsRes.data : []);
            if (revokeRes) setRevokeRequests(Array.isArray(revokeRes?.data) ? revokeRes.data : revokeRes?.data?.results || []);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAction = async (userId, action, data = {}) => {
        try {
            await api.post(`users/admin/${userId}/${action}/`, data);
            fetchData(); // Refresh list
        } catch (error) {
            console.error(`Error performing ${action}:`, error);
            alert(`Failed to ${action} user`);
        }
    };

    const handleSuspensionAction = async (id, action) => {
        if (!window.confirm(`Are you sure you want to ${action} this request?`)) return;
        try {
            await api.post(`users/suspension-requests/${id}/${action}/`);
            fetchData();
        } catch (error) {
            console.error(`Error performing ${action}:`, error);
            alert(`Failed to ${action} request`);
        }
    };

    const handleRevokeAction = async (id, action) => {
        if (!window.confirm(`Are you sure you want to ${action} this request?`)) return;
        try {
            await api.post(`users/revoke-requests/${id}/${action}/`);
            fetchData();
        } catch (error) {
            console.error(`Error performing ${action}:`, error);
            alert(`Failed to ${action} request`);
        }
    };

    const handleStaffRevokeRequest = async (instructorId) => {
        const reason = window.prompt("Reason for revoking this instructor:");
        if (!reason) return;
        try {
            await api.post('users/revoke-requests/', { instructor: instructorId, reason });
            alert("Revocation request submitted to superadmin.");
            fetchData();
        } catch (error) {
            console.error("Error submitting revoke request:", error);
            alert("Failed to submit request.");
        }
    };

    const handleDelete = async (userId) => {
        if (currentUser?.role === 'staff') {
            alert("Staff cannot delete users directly.");
            return;
        }
        if (window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
            try {
                await api.delete(`users/admin/${userId}/`);
                fetchData();
            } catch (error) {
                console.error("Error deleting user:", error);
            }
        }
    };

    const handleChangeRole = async (userId, newRole) => {
        if (currentUser?.role === 'staff' && (newRole === 'admin' || newRole === 'instructor')) {
            alert("Staff cannot assign admin or instructor roles.");
            return;
        }
        if (window.confirm(`Change user role to ${newRole.toUpperCase()}?`)) {
            await handleAction(userId, 'change_role', { role: newRole });
        }
    };

    const filteredUsers = users.filter(user => {
        const fullName = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase();
        const matchesSearch = 
            user.username?.toLowerCase().includes(searchTerm.toLowerCase()) || 
            user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            fullName.includes(searchTerm.toLowerCase());
        
        const matchesRole = filterRole === 'all' || user.role === filterRole;
        const matchesStatus = filterStatus === 'all' || user.account_status === filterStatus;

        return matchesSearch && matchesRole && matchesStatus;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return '#10b981';
            case 'suspended': return '#ff453a';
            case 'under_review': return '#f59e0b';
            default: return 'var(--text-secondary)';
        }
    };

    return (
        <div className="animate-fade-in">
            <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px', color: '#1a1a2e' }}>User Management</h1>
                    <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Control platform access, permissions, and security auditing.</p>
                </div>
                <div style={{ display: 'flex', background: 'rgba(0, 0, 0, 0.03)', padding: '6px', borderRadius: '16px', gap: '4px' }}>
                    <button 
                        onClick={() => setActiveTab('users')}
                        style={{ 
                            padding: '10px 24px', 
                            borderRadius: '12px', 
                            border: 'none', 
                            background: activeTab === 'users' ? 'var(--accent-blue)' : 'transparent',
                            color: '#1a1a2e',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        Directory
                    </button>
                    {currentUser?.role === 'admin' && (
                        <button 
                            onClick={() => setActiveTab('logs')}
                            style={{ 
                                padding: '10px 24px', 
                                borderRadius: '12px', 
                                border: 'none', 
                                background: activeTab === 'logs' ? 'var(--accent-blue)' : 'transparent',
                                color: '#1a1a2e',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            Activity Log
                        </button>
                    )}
                    <button 
                        onClick={() => setActiveTab('suspension')}
                        style={{ 
                            padding: '10px 24px', 
                            borderRadius: '12px', 
                            border: 'none', 
                            background: activeTab === 'suspension' ? 'var(--accent-blue)' : 'transparent',
                            color: '#1a1a2e',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        Suspension Requests {suspensionRequests.filter(r => r.status === 'pending').length > 0 && `(${suspensionRequests.filter(r => r.status === 'pending').length})`}
                    </button>
                    <button 
                        onClick={() => setActiveTab('revoke')}
                        style={{ 
                            padding: '10px 24px', 
                            borderRadius: '12px', 
                            border: 'none', 
                            background: activeTab === 'revoke' ? 'var(--accent-blue)' : 'transparent',
                            color: '#1a1a2e',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        Revoke Requests {revokeRequests.filter(r => r.status === 'pending').length > 0 && `(${revokeRequests.filter(r => r.status === 'pending').length})`}
                    </button>
                </div>
            </div>

            {activeTab === 'users' ? (
                <>
                    {/* Filters Bar */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '32px', alignItems: 'center' }}>
                         <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
                            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            <input 
                                className="glass-input" 
                                placeholder="Search by name, email, or username..." 
                                style={{ paddingLeft: '48px', width: '100%', marginBottom: 0 }}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <GlassSelect 
                            value={filterRole}
                            onChange={(e) => setFilterRole(e.target.value)}
                            style={{ width: '180px' }}
                            options={[
                                { label: 'View All Roles', value: 'all' },
                                { label: 'Students', value: 'student' },
                                { label: 'Instructors', value: 'instructor' },
                                { label: 'Admins', value: 'admin' }
                            ]}
                        />
                        <GlassSelect
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            style={{ width: '180px' }}
                            options={[
                                { label: 'View All Status', value: 'all' },
                                { label: 'Active', value: 'active' },
                                { label: 'Suspended', value: 'suspended' },
                                { label: 'Under Review', value: 'under_review' }
                            ]}
                        />
                        <GlassButton onClick={fetchData} style={{ padding: '12px', borderRadius: '12px' }}>
                            <History size={18} />
                        </GlassButton>
                    </div>

                    <GlassCard heavy style={{ padding: '0', overflow: 'hidden', border: '1px solid rgba(0, 0, 0, 0.06)' }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(0, 0, 0, 0.03)', borderBottom: '1px solid rgba(0, 0, 0, 0.06)' }}>
                                        <th style={{ padding: '20px 24px', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>User Profile</th>
                                        <th style={{ padding: '20px 24px', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Assign Role</th>
                                        <th style={{ padding: '20px 24px', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Security Status</th>
                                        <th style={{ padding: '20px 24px', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Verification</th>
                                        <th style={{ padding: '20px 24px', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="5" style={{ padding: '80px', textAlign: 'center' }}>
                                                <div className="spinner" style={{ margin: '0 auto 20px' }}></div>
                                                <p style={{ color: '#94a3b8' }}>Securing platform data...</p>
                                            </td>
                                        </tr>
                                    ) : filteredUsers.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" style={{ padding: '80px', textAlign: 'center', color: '#94a3b8' }}>
                                                No matches found for "{searchTerm}"
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredUsers.map((user) => (
                                            <tr key={user.id} style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.06)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                <td style={{ padding: '20px 24px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                        <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #0A84FF, #BF5AF2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#1a1a2e', fontSize: '1.1rem', boxShadow: '0 4px 12px rgba(10, 132, 255, 0.3)' }}>
                                                            {user.username[0].toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p style={{ fontWeight: 600, color: '#1a1a2e', marginBottom: '2px' }}>{user.first_name} {user.last_name}</p>
                                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>@{user.username}</span>
                                                                <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }}></span>
                                                                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{user.email}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '20px 24px' }}>
                                                    <div style={{ width: '160px' }}>
                                                        <GlassSelect 
                                                            value={user.role}
                                                            onChange={(e) => handleChangeRole(user.id, e.target.value)}
                                                            options={[
                                                                { label: 'Student', value: 'student' },
                                                                { label: 'Instructor', value: 'instructor' },
                                                                { label: 'Staff', value: 'staff' },
                                                                { label: 'SuperAdmin', value: 'admin' }
                                                            ]}
                                                        />
                                                    </div>
                                                </td>
                                                <td style={{ padding: '20px 24px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: getStatusColor(user.account_status), boxShadow: `0 0 10px ${getStatusColor(user.account_status)}80` }}></div>
                                                        <span style={{ fontSize: '0.9rem', color: '#1a1a2e', textTransform: 'capitalize', fontWeight: 600 }}>{user.account_status?.replace('_', ' ')}</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '20px 24px' }}>
                                                    {user.role === 'instructor' ? (
                                                        <div style={{ display: 'flex', gap: '8px' }}>
                                                            {user.is_verified_teacher ? (
                                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                                     <div style={{ 
                                                                        display: 'flex', 
                                                                        alignItems: 'center', 
                                                                        gap: '6px', 
                                                                        color: '#10b981', 
                                                                        fontSize: '0.8rem', 
                                                                        fontWeight: 700,
                                                                        background: 'rgba(16, 185, 129, 0.1)',
                                                                        padding: '6px 12px',
                                                                        borderRadius: '10px',
                                                                        border: '1px solid rgba(16, 185, 129, 0.2)'
                                                                    }}>
                                                                        <BadgeCheck size={16} /> Verified
                                                                    </div>
                                                                    {currentUser?.role === 'staff' ? (
                                                                        <button 
                                                                            onClick={() => handleStaffRevokeRequest(user.id)}
                                                                            style={{ 
                                                                                background: 'rgba(255, 153, 0, 0.1)', 
                                                                                border: 'none', 
                                                                                color: '#ff9900', 
                                                                                cursor: 'pointer', 
                                                                                fontSize: '0.75rem', 
                                                                                padding: '6px 10px', 
                                                                                borderRadius: '8px',
                                                                                fontWeight: 600
                                                                            }}
                                                                        >
                                                                            Request Revoke
                                                                        </button>
                                                                    ) : (
                                                                        <button 
                                                                            onClick={() => handleAction(user.id, 'disapprove_teacher')}
                                                                            style={{ 
                                                                                background: 'rgba(255, 69, 58, 0.1)', 
                                                                                border: 'none', 
                                                                                color: '#ff453a', 
                                                                                cursor: 'pointer', 
                                                                                fontSize: '0.75rem', 
                                                                                padding: '6px 10px', 
                                                                                borderRadius: '8px',
                                                                                fontWeight: 600
                                                                            }}
                                                                        >
                                                                            Revoke
                                                                        </button>
                                                                    )}
                                                                </div>
                                                               
                                                            ) : (
                                                                <button 
                                                                    onClick={() => handleAction(user.id, 'approve_teacher')}
                                                                    style={{ 
                                                                        background: 'linear-gradient(135deg, #10b981, #059669)',
                                                                        border: 'none', 
                                                                        color: '#1a1a2e', 
                                                                        cursor: 'pointer', 
                                                                        fontSize: '0.8rem', 
                                                                        padding: '8px 16px', 
                                                                        borderRadius: '10px',
                                                                        fontWeight: 700,
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '8px',
                                                                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                                                                        transition: 'transform 0.2s'
                                                                    }}
                                                                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                                                                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                                                                >
                                                                    <ShieldCheck size={16} /> Verify Teacher
                                                                </button>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic' }}>Not Instructor</span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '20px 24px' }}>
                                                    <div style={{ display: 'flex', gap: '10px' }}>
                                                        {user.account_status === 'active' ? (
                                                            <button 
                                                                title="Suspend Access"
                                                                onClick={() => handleAction(user.id, 'suspend')}
                                                                style={{ 
                                                                    background: 'rgba(0, 0, 0, 0.03)', 
                                                                    border: '1px solid rgba(255, 69, 58, 0.2)', 
                                                                    padding: '12px', 
                                                                    borderRadius: '12px', 
                                                                    color: '#ff453a', 
                                                                    cursor: 'pointer',
                                                                    transition: 'all 0.2s'
                                                                }}
                                                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 69, 58, 0.1)'}
                                                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                                                            >
                                                                <XCircle size={20} />
                                                            </button>
                                                        ) : (
                                                            <button 
                                                                title="Restore Access"
                                                                onClick={() => handleAction(user.id, 'activate')}
                                                                style={{ 
                                                                    background: 'rgba(16, 185, 129, 0.1)', 
                                                                    border: '1px solid rgba(16, 185, 129, 0.3)', 
                                                                    padding: '12px', 
                                                                    borderRadius: '12px', 
                                                                    color: '#10b981', 
                                                                    cursor: 'pointer' 
                                                                }}
                                                            >
                                                                <UserCheck size={20} />
                                                            </button>
                                                        )}
                                                        {currentUser?.role === 'admin' && (
                                                            <button 
                                                                title="Permanently Delete"
                                                                onClick={() => handleDelete(user.id)}
                                                                style={{ 
                                                                    background: 'rgba(0, 0, 0, 0.03)', 
                                                                    border: '1px solid rgba(0, 0, 0, 0.06)', 
                                                                    padding: '12px', 
                                                                    borderRadius: '12px', 
                                                                    color: '#64748b', 
                                                                    cursor: 'pointer',
                                                                    transition: 'all 0.2s'
                                                                }}
                                                                onMouseEnter={e => {
                                                                    e.currentTarget.style.background = 'rgba(255, 69, 58, 0.05)';
                                                                    e.currentTarget.style.color = '#ff453a';
                                                                }}
                                                                onMouseLeave={e => {
                                                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                                                    e.currentTarget.style.color = 'rgba(255,255,255,0.4)';
                                                                }}
                                                            >
                                                                <Trash2 size={20} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </GlassCard>
                </>
            ) : activeTab === 'logs' ? (
                <div className="animate-fade-in">
                    <GlassCard heavy style={{ padding: '0', overflow: 'hidden', border: '1px solid rgba(0, 0, 0, 0.06)' }}>
                        <div style={{ padding: '24px', background: 'rgba(0, 0, 0, 0.02)', borderBottom: '1px solid rgba(0, 0, 0, 0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <History size={20} color="var(--accent-blue)" /> Security & Session Audit
                            </h3>
                            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                Showing latest 200 authentication events
                            </div>
                        </div>
                        <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(0, 0, 0, 0.01)', borderBottom: '1px solid rgba(0, 0, 0, 0.06)' }}>
                                        <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>USER</th>
                                        <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>ACTION</th>
                                        <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>TIMESTAMP</th>
                                        <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>STATUS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activityLogs.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
                                                No security logs found.
                                            </td>
                                        </tr>
                                    ) : (
                                        activityLogs.map((log) => (
                                            <tr key={log.id} style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.04)' }}>
                                                <td style={{ padding: '16px 24px' }}>
                                                    <div style={{ color: '#1a1a2e', fontWeight: 600 }}>{log.username}</div>
                                                </td>
                                                <td style={{ padding: '16px 24px' }}>
                                                    <div style={{ 
                                                        display: 'inline-flex', 
                                                        alignItems: 'center', 
                                                        gap: '6px',
                                                        fontSize: '0.8rem',
                                                        fontWeight: 700,
                                                        color: log.action === 'login' ? '#10b981' : '#f59e0b',
                                                        textTransform: 'uppercase'
                                                    }}>
                                                        {log.action === 'login' ? <UserPlus size={14} /> : <UserX size={14} />}
                                                        {log.action}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '16px 24px' }}>
                                                    <div style={{ color: '#475569', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <Clock size={14} opacity={0.5} />
                                                        {new Date(log.timestamp).toLocaleString()}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '16px 24px' }}>
                                                    <span style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>Success</span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </GlassCard>
                </div>
            ) : activeTab === 'suspension' ? (
                <div className="animate-fade-in">
                    <GlassCard heavy style={{ padding: '0', overflow: 'hidden', border: '1px solid rgba(0, 0, 0, 0.06)' }}>
                        <div style={{ padding: '24px', background: 'rgba(0, 0, 0, 0.02)', borderBottom: '1px solid rgba(0, 0, 0, 0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <ShieldAlert size={20} color="#ff453a" /> Instructor Suspension Requests
                            </h3>
                            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                Review and moderate student access
                            </div>
                        </div>
                        <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(0, 0, 0, 0.01)', borderBottom: '1px solid rgba(0, 0, 0, 0.06)' }}>
                                        <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>Student Profile</th>
                                        <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>Details & Proof</th>
                                        <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>Status</th>
                                        <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {suspensionRequests.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
                                                No suspension requests to review.
                                            </td>
                                        </tr>
                                    ) : (
                                        suspensionRequests.map((req) => (
                                            <tr key={req.id} style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.04)' }}>
                                                <td style={{ padding: '20px 24px' }}>
                                                    <div style={{ color: '#1a1a2e', fontWeight: 600, marginBottom: '4px' }}>{req.student_name}</div>
                                                    <div style={{ color: '#64748b', fontSize: '0.8rem' }}>Requested by: {req.instructor_name}</div>
                                                    <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '4px' }}>
                                                        {new Date(req.created_at).toLocaleString()}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '20px 24px', maxWidth: '300px' }}>
                                                    <p style={{ fontSize: '0.85rem', color: '#334155', marginBottom: '8px', lineHeight: 1.4 }}>
                                                        {req.reason}
                                                    </p>
                                                    {req.proof && (
                                                        <a href={req.proof} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#0A84FF', textDecoration: 'none', background: 'rgba(10, 132, 255, 0.1)', padding: '6px 12px', borderRadius: '8px', fontWeight: 600 }}>
                                                            View Evidence
                                                        </a>
                                                    )}
                                                </td>
                                                <td style={{ padding: '20px 24px' }}>
                                                    <span style={{ 
                                                        fontSize: '0.75rem', 
                                                        padding: '6px 10px', 
                                                        borderRadius: '8px', 
                                                        background: req.status === 'pending' ? 'rgba(245, 158, 11, 0.1)' : req.status === 'approved' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 69, 58, 0.1)', 
                                                        color: req.status === 'pending' ? '#f59e0b' : req.status === 'approved' ? '#10b981' : '#ff453a',
                                                        fontWeight: 700,
                                                        textTransform: 'uppercase'
                                                    }}>
                                                        {req.status}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '20px 24px' }}>
                                                    {req.status === 'pending' && (
                                                        <div style={{ display: 'flex', gap: '8px' }}>
                                                            <button 
                                                                onClick={() => handleSuspensionAction(req.id, 'approve')}
                                                                style={{ background: '#ff453a', border: 'none', color: '#1a1a2e', cursor: 'pointer', padding: '8px 16px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700 }}
                                                            >
                                                                Approve Extrusion
                                                            </button>
                                                            <button 
                                                                onClick={() => handleSuspensionAction(req.id, 'reject')}
                                                                style={{ background: 'rgba(0, 0, 0, 0.03)', border: '1px solid rgba(0, 0, 0, 0.08)', color: '#1a1a2e', cursor: 'pointer', padding: '8px 16px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600 }}
                                                            >
                                                                Reject
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </GlassCard>
                </div>
            ) : activeTab === 'revoke' ? (
                <div className="animate-fade-in">
                    <GlassCard heavy style={{ padding: '0', overflow: 'hidden', border: '1px solid rgba(0, 0, 0, 0.06)' }}>
                        <div style={{ padding: '24px', background: 'rgba(0, 0, 0, 0.02)', borderBottom: '1px solid rgba(0, 0, 0, 0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <ShieldAlert size={20} color="#ff9900" /> Instructor Revocation Requests
                            </h3>
                            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                Review staff requests to revoke instructors
                            </div>
                        </div>
                        <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(0, 0, 0, 0.01)', borderBottom: '1px solid rgba(0, 0, 0, 0.06)' }}>
                                        <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>Instructor</th>
                                        <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>Requested By (Staff)</th>
                                        <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>Reason</th>
                                        <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>Status</th>
                                        {currentUser?.role === 'admin' && <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>Actions</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {revokeRequests.length === 0 ? (
                                        <tr>
                                            <td colSpan={currentUser?.role === 'admin' ? "5" : "4"} style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
                                                No revocation requests to review.
                                            </td>
                                        </tr>
                                    ) : (
                                        revokeRequests.map((req) => (
                                            <tr key={req.id} style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.04)' }}>
                                                <td style={{ padding: '20px 24px' }}>
                                                    <div style={{ color: '#1a1a2e', fontWeight: 600 }}>{req.instructor_name}</div>
                                                    <div style={{ color: '#64748b', fontSize: '0.8rem' }}>@{req.instructor_username}</div>
                                                </td>
                                                <td style={{ padding: '20px 24px' }}>
                                                    <div style={{ color: '#1a1a2e', fontWeight: 600 }}>{req.staff_name}</div>
                                                    <div style={{ color: '#64748b', fontSize: '0.8rem' }}>@{req.staff_username}</div>
                                                    <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '4px' }}>
                                                        {new Date(req.created_at).toLocaleString()}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '20px 24px', maxWidth: '300px' }}>
                                                    <p style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.4 }}>
                                                        {req.reason}
                                                    </p>
                                                </td>
                                                <td style={{ padding: '20px 24px' }}>
                                                    <span style={{ 
                                                        fontSize: '0.75rem', 
                                                        padding: '6px 10px', 
                                                        borderRadius: '8px', 
                                                        background: req.status === 'pending' ? 'rgba(245, 158, 11, 0.1)' : req.status === 'approved' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 69, 58, 0.1)', 
                                                        color: req.status === 'pending' ? '#f59e0b' : req.status === 'approved' ? '#10b981' : '#ff453a',
                                                        fontWeight: 700,
                                                        textTransform: 'uppercase'
                                                    }}>
                                                        {req.status}
                                                    </span>
                                                </td>
                                                {currentUser?.role === 'admin' && (
                                                    <td style={{ padding: '20px 24px' }}>
                                                        {req.status === 'pending' && (
                                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                                <button 
                                                                    onClick={() => handleRevokeAction(req.id, 'approve')}
                                                                    style={{ background: '#ff453a', border: 'none', color: '#1a1a2e', cursor: 'pointer', padding: '8px 16px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700 }}
                                                                >
                                                                    Approve
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleRevokeAction(req.id, 'reject')}
                                                                    style={{ background: 'rgba(0, 0, 0, 0.03)', border: '1px solid rgba(0, 0, 0, 0.08)', color: '#1a1a2e', cursor: 'pointer', padding: '8px 16px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600 }}
                                                                >
                                                                    Reject
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                )}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </GlassCard>
                </div>
            ) : null}
        </div>
    );
};
