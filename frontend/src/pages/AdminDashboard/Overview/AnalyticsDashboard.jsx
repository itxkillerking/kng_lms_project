import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../../components/common/GlassCard';
import { 
    Users, 
    BookOpen, 
    Activity, 
    TrendingUp, 
    ArrowUpRight, 
    ArrowDownRight,
    Users2,
    CheckCircle2,
    Award,
    GraduationCap
} from 'lucide-react';
import api from '../../../services/api';

export const AnalyticsDashboard = () => {
    const [stats, setStats] = useState({
        users: { total_users: 0, total_students: 0, total_instructors: 0 },
        courses: { total_courses: 0, approved_courses: 0, pending_courses: 0 },
        total_enrollments: 0,
        total_certificates: 0,
        enrollment_trends: [],
        user_trends: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGlobalStats = async () => {
            try {
                const res = await api.get('core/settings/stats/');
                setStats(res.data);
            } catch (error) {
                console.error("Error fetching admin stats:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchGlobalStats();
    }, []);

    const metrics = [
        { 
            label: 'Total Students', 
            value: stats.users.total_students, 
            icon: Users2, 
            color: 'var(--accent-blue)', 
            trend: '+12%', 
            isUp: true 
        },
        { 
            label: 'Total Enrollments', 
            value: stats.total_enrollments, 
            icon: GraduationCap, 
            color: 'var(--accent-purple)', 
            trend: '+6%', 
            isUp: true 
        },
        { 
            label: 'Active Courses', 
            value: stats.courses.approved_courses, 
            icon: BookOpen, 
            color: '#10b981', 
            trend: '+4', 
            isUp: true 
        },
        { 
            label: 'Certificates Issued', 
            value: stats.total_certificates, 
            icon: Award, 
            color: '#f59e0b', 
            trend: '+2', 
            isUp: true 
        },
    ];

    if (loading) return <div style={{ color: 'rgba(255,255,255,0.4)', padding: '40px' }}>Analyzing platform data...</div>;

    return (
        <div className="animate-fade-in">
            <div style={{ marginBottom: '48px' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '12px', color: 'white' }}>Platform Overview</h1>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.1rem' }}>Real-time growth metrics and system-wide performance analytics.</p>
            </div>

            {/* Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                {metrics.map((m, idx) => (
                    <GlassCard 
                        key={idx} 
                        heavy 
                        style={{ 
                            padding: '32px', 
                            border: '1px solid rgba(255,255,255,0.08)',
                            background: 'rgba(255,255,255,0.01)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >
                        <div style={{ 
                            position: 'absolute', 
                            top: '-20px', 
                            right: '-20px', 
                            width: '100px', 
                            height: '100px', 
                            background: m.color, 
                            filter: 'blur(60px)', 
                            opacity: 0.15,
                            zIndex: 0
                        }} />

                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                <div style={{ 
                                    background: `rgba(${m.color.startsWith('#') ? '16, 185, 129' : '10, 132, 255'}, 0.15)`, 
                                    padding: '12px', 
                                    borderRadius: '16px',
                                    border: `1px solid ${m.color}20`
                                }}>
                                    <m.icon size={28} color={m.color} />
                                </div>
                                <div style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '6px', 
                                    color: 'white', 
                                    fontSize: '0.75rem', 
                                    fontWeight: 700,
                                    background: m.isUp ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 69, 58, 0.2)',
                                    padding: '6px 12px',
                                    borderRadius: '20px',
                                    backdropFilter: 'blur(10px)'
                                }}>
                                    {m.isUp ? <ArrowUpRight size={14} color="#10b981" /> : <ArrowDownRight size={14} color="#ff453a" />}
                                    <span style={{ color: m.isUp ? '#10b981' : '#ff453a' }}>{m.trend}</span>
                                </div>
                            </div>
                            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.95rem', fontWeight: 500, marginBottom: '8px' }}>{m.label}</p>
                            <h3 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>{m.value}</h3>
                        </div>
                    </GlassCard>
                ))}
            </div>

            {/* Secondary Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px' }}>
                <GlassCard heavy style={{ padding: '32px' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '24px' }}>System Criticals</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                <div style={{ color: '#f59e0b' }}><TrendingUp size={24} /></div>
                                <div>
                                    <p style={{ fontSize: '0.95rem', fontWeight: 600 }}>Courses Awaiting Review</p>
                                    <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>New submissions from instructors</p>
                                </div>
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f59e0b' }}>{stats.courses.pending_courses}</div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                <div style={{ color: 'var(--accent-blue)' }}><CheckCircle2 size={24} /></div>
                                <div>
                                    <p style={{ fontSize: '0.95rem', fontWeight: 600 }}>Suspended Users</p>
                                    <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>Accounts flagged for review</p>
                                </div>
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-blue)' }}>{stats.users.suspended_users}</div>
                        </div>
                    </div>
                </GlassCard>

                <GlassCard heavy style={{ padding: '32px' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '24px' }}>User Base Composition</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '8px' }}>
                                <span style={{ color: 'rgba(255,255,255,0.6)' }}>Students</span>
                                <span style={{ fontWeight: 600 }}>{stats.users.total_students}</span>
                            </div>
                            <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ width: stats.users.total_users ? `${(stats.users.total_students/stats.users.total_users)*100}%` : '0%', height: '100%', background: 'var(--accent-blue)' }}></div>
                            </div>
                        </div>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '8px' }}>
                                <span style={{ color: 'rgba(255,255,255,0.6)' }}>Instructors</span>
                                <span style={{ fontWeight: 600 }}>{stats.users.total_instructors}</span>
                            </div>
                            <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ width: stats.users.total_users ? `${(stats.users.total_instructors/stats.users.total_users)*100}%` : '0%', height: '100%', background: 'var(--accent-purple)' }}></div>
                            </div>
                        </div>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
};
