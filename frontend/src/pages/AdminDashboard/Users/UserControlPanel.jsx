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
import api from '../../../services/api';
import { GlassSelect } from '../../../components/common/GlassSelect';

export const UserControlPanel = () => {
    const [users, setUsers] = useState([]);
    const [activityLogs, setActivityLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [activeTab, setActiveTab] = useState('users'); // 'users' or 'logs'

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersRes, logsRes] = await Promise.all([
                api.get('users/admin/'),
                api.get('users/admin/activity_logs/')
            ]);
            setUsers(Array.isArray(usersRes.data) ? usersRes.data : usersRes.data.results || []);
            setActivityLogs(Array.isArray(logsRes.data) ? logsRes.data : []);
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

    const handleDelete = async (userId) => {
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
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px', color: 'white' }}>User Management</h1>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.1rem' }}>Control platform access, permissions, and security auditing.</p>
                </div>
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '6px', borderRadius: '16px', gap: '4px' }}>
                    <button 
                        onClick={() => setActiveTab('users')}
                        style={{ 
                            padding: '10px 24px', 
                            borderRadius: '12px', 
                            border: 'none', 
                            background: activeTab === 'users' ? 'var(--accent-blue)' : 'transparent',
                            color: 'white',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        Directory
                    </button>
                    <button 
                        onClick={() => setActiveTab('logs')}
                        style={{ 
                            padding: '10px 24px', 
                            borderRadius: '12px', 
                            border: 'none', 
                            background: activeTab === 'logs' ? 'var(--accent-blue)' : 'transparent',
                            color: 'white',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        Activity Log
                    </button>
                </div>
            </div>

            {activeTab === 'users' ? (
                <>
                    {/* Filters Bar */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '32px', alignItems: 'center' }}>
                         <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
                            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
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

                    <GlassCard heavy style={{ padding: '0', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                        <th style={{ padding: '20px 24px', fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>User Profile</th>
                                        <th style={{ padding: '20px 24px', fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Assign Role</th>
                                        <th style={{ padding: '20px 24px', fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Security Status</th>
                                        <th style={{ padding: '20px 24px', fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Verification</th>
                                        <th style={{ padding: '20px 24px', fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="5" style={{ padding: '80px', textAlign: 'center' }}>
                                                <div className="spinner" style={{ margin: '0 auto 20px' }}></div>
                                                <p style={{ color: 'rgba(255,255,255,0.3)' }}>Securing platform data...</p>
                                            </td>
                                        </tr>
                                    ) : filteredUsers.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" style={{ padding: '80px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
                                                No matches found for "{searchTerm}"
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredUsers.map((user) => (
                                            <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                <td style={{ padding: '20px 24px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                        <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #0A84FF, #BF5AF2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white', fontSize: '1.1rem', boxShadow: '0 4px 12px rgba(10, 132, 255, 0.3)' }}>
                                                            {user.username[0].toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p style={{ fontWeight: 600, color: 'white', marginBottom: '2px' }}>{user.first_name} {user.last_name}</p>
                                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                                <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>@{user.username}</span>
                                                                <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }}></span>
                                                                <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>{user.email}</span>
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
                                                                { label: 'SuperAdmin', value: 'admin' }
                                                            ]}
                                                        />
                                                    </div>
                                                </td>
                                                <td style={{ padding: '20px 24px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: getStatusColor(user.account_status), boxShadow: `0 0 10px ${getStatusColor(user.account_status)}80` }}></div>
                                                        <span style={{ fontSize: '0.9rem', color: 'white', textTransform: 'capitalize', fontWeight: 600 }}>{user.account_status?.replace('_', ' ')}</span>
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
                                                                </div>
                                                               
                                                            ) : (
                                                                <button 
                                                                    onClick={() => handleAction(user.id, 'approve_teacher')}
                                                                    style={{ 
                                                                        background: 'linear-gradient(135deg, #10b981, #059669)',
                                                                        border: 'none', 
                                                                        color: 'white', 
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
                                                        <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>Not Instructor</span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '20px 24px' }}>
                                                    <div style={{ display: 'flex', gap: '10px' }}>
                                                        {user.account_status === 'active' ? (
                                                            <button 
                                                                title="Suspend Access"
                                                                onClick={() => handleAction(user.id, 'suspend')}
                                                                style={{ 
                                                                    background: 'rgba(255, 255, 255, 0.05)', 
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
                                                        <button 
                                                            title="Permanently Delete"
                                                            onClick={() => handleDelete(user.id)}
                                                            style={{ 
                                                                background: 'rgba(255, 255, 255, 0.05)', 
                                                                border: '1px solid rgba(255, 255, 255, 0.05)', 
                                                                padding: '12px', 
                                                                borderRadius: '12px', 
                                                                color: 'rgba(255,255,255,0.4)', 
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
            ) : (
                <div className="animate-fade-in">
                    <GlassCard heavy style={{ padding: '0', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <div style={{ padding: '24px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <History size={20} color="var(--accent-blue)" /> Security & Session Audit
                            </h3>
                            <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>
                                Showing latest 200 authentication events
                            </div>
                        </div>
                        <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(255,255,255,0.01)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.3)' }}>USER</th>
                                        <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.3)' }}>ACTION</th>
                                        <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.3)' }}>TIMESTAMP</th>
                                        <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.3)' }}>STATUS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activityLogs.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" style={{ padding: '60px', textAlign: 'center', color: 'rgba(255,255,255,0.2)' }}>
                                                No security logs found.
                                            </td>
                                        </tr>
                                    ) : (
                                        activityLogs.map((log) => (
                                            <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                                <td style={{ padding: '16px 24px' }}>
                                                    <div style={{ color: 'white', fontWeight: 600 }}>{log.username}</div>
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
                                                    <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
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
            )}
        </div>
    );
};
