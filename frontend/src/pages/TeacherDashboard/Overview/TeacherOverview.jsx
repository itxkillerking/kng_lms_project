import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../../components/common/GlassCard';
import { Users, BookOpen, TrendingUp, Calendar, AlertCircle, Plus, Megaphone, ChevronRight } from 'lucide-react';
import api from '../../../services/api';
import { Link } from 'react-router-dom';

export const TeacherOverview = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeCourses: 0,
    passingRate: 0,
    pendingGrades: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // In a real app, we'd have a specific analytics endpoint
        // For now, we'll derive them from existing endpoints or mock them
        const [coursesRes, submissionsRes] = await Promise.all([
          api.get('courses/'),
          api.get('assignment-submissions/')
        ]);

        const courses = Array.isArray(coursesRes.data) ? coursesRes.data : coursesRes.data.results || [];
        const submissions = Array.isArray(submissionsRes.data) ? submissionsRes.data : submissionsRes.data.results || [];
        
        // Mocking student count and passing rate for the demonstration
        // as enrollment model was just created
        setStats({
          totalStudents: 124, // Mocked for now
          activeCourses: courses.length,
          passingRate: 88, // Mocked for now
          pendingGrades: submissions.filter(s => s.grade_score === null).length
        });
      } catch (error) {
        console.error("Error fetching instructor stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    { label: 'Total Students', value: stats.totalStudents, icon: Users, color: 'var(--accent-blue)', trend: '+12% from last month' },
    { label: 'Active Courses', value: stats.activeCourses, icon: BookOpen, color: 'var(--accent-purple)', trend: '2 new this month' },
    { label: 'Passing Rate', value: `${stats.passingRate}%`, icon: TrendingUp, color: '#10b981', trend: '+5% improvement' },
    { label: 'Pending Reviews', value: stats.pendingGrades, icon: AlertCircle, color: '#f59e0b', trend: 'Needs attention' },
  ];

  if (loading) {
    return <div style={{ color: 'var(--text-secondary)' }}>Loading analytics...</div>;
  }

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '8px' }}>Dashboard Overview</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Welcome back! Here's how your students are performing.</p>
        </div>
        <Link to="/teacher/courses" style={{ textDecoration: 'none' }}>
          <button className="glass-button primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}>
            <Plus size={20} /> Create New Course
          </button>
        </Link>
      </div>

      {/* Analytics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <GlassCard key={idx} style={{ padding: '24px' }} Heavy>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ background: `rgba(${card.color === 'var(--accent-blue)' ? '10, 132, 255' : '168, 85, 247'}, 0.1)`, padding: '12px', borderRadius: '12px' }}>
                  <Icon size={24} color={card.color} />
                </div>
                <span style={{ fontSize: '0.75rem', color: card.trend.includes('+') ? '#10b981' : 'var(--text-secondary)', fontWeight: 600 }}>
                  {card.trend}
                </span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '4px' }}>{card.label}</p>
              <h3 style={{ fontSize: '2rem', fontWeight: 700 }}>{card.value}</h3>
            </GlassCard>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
        {/* Recent Submissions placeholder */}
        <GlassCard style={{ padding: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Recent Submissions</h3>
            <Link to="/teacher/grading" style={{ fontSize: '0.9rem', color: 'var(--accent-blue)', textDecoration: 'none' }}>View All</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {stats.pendingGrades > 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                You have {stats.pendingGrades} assignments waiting for your review.
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                No recent submissions to review.
              </div>
            )}
          </div>
        </GlassCard>

        {/* Quick Actions / Activity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <GlassCard style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '20px' }}>Upcoming Schedule</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(0, 0, 0, 0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar size={18} color="var(--accent-blue)" />
                </div>
                <div>
                  <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>Live Q&A Session</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Tomorrow, 10:00 AM</p>
                </div>
              </div>
            </div>
          </GlassCard>

          <Link to="/teacher/announcements" style={{ textDecoration: 'none' }}>
            <GlassCard style={{ padding: '24px', background: 'rgba(10, 132, 255, 0.05)', border: '1px solid rgba(10, 132, 255, 0.2)', transition: 'all 0.3s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(10, 132, 255, 0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(10, 132, 255, 0.05)'}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(10, 132, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Megaphone size={20} color="var(--accent-blue)" />
                        </div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1a1a2e' }}>Announcements</h3>
                    </div>
                    <ChevronRight size={20} color="var(--accent-blue)" />
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '16px', lineHeight: 1.5 }}>
                    Keep your students engaged with real-time updates and course bulletins.
                </p>
            </GlassCard>
          </Link>
        </div>
      </div>
    </div>
  );
};
