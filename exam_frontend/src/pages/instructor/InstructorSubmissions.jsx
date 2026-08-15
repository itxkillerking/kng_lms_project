import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, LoadingOverlay, Alert } from '../../components/common/UIComponents';
import { examService } from '../../services/exams';

export const InstructorSubmissions = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [students, setStudents] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [examData, overviewData] = await Promise.all([
          examService.getExamDetails(id),
          examService.getExamStatusOverview(id)
        ]);
        setExam(examData);
        setStudents(overviewData.students);
        setSummary(overviewData.summary);
      } catch (err) {
        console.error(err);
        setError('Failed to load status overview.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  if (loading) return <LoadingOverlay message="Loading submissions..." />;
  if (error) return <Alert type="error" message={error} />;
  if (!exam) return <Alert type="error" message="Exam not found" />;

  const filteredStudents = filter === 'ALL' ? students : students.filter(s => s.status === filter);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)' }}>
        <div>
          <h2>Attempt Status Overview</h2>
          <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>Exam: {exam.title}</p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/instructor/exams')}>Back to Exams</Button>
      </div>

      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-6)' }}>
          <Card style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>{summary.total_assigned}</div>
            <p style={{ margin: 'var(--spacing-2) 0 0', color: 'var(--color-text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Assigned</p>
          </Card>
          <Card style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-text-muted)' }}>{summary.not_started}</div>
            <p style={{ margin: 'var(--spacing-2) 0 0', color: 'var(--color-text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Not Started</p>
          </Card>
          <Card style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-warning)' }}>{summary.in_progress}</div>
            <p style={{ margin: 'var(--spacing-2) 0 0', color: 'var(--color-text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>In Progress</p>
          </Card>
          <Card style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-danger)' }}>{summary.submitted}</div>
            <p style={{ margin: 'var(--spacing-2) 0 0', color: 'var(--color-text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Submitted</p>
          </Card>
          <Card style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-success)' }}>{summary.evaluated}</div>
            <p style={{ margin: 'var(--spacing-2) 0 0', color: 'var(--color-text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Evaluated</p>
          </Card>
        </div>
      )}

      <Card>
        <div style={{ display: 'flex', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-4)', borderBottom: '2px solid rgba(255, 255, 255, 0.4)', paddingBottom: 'var(--spacing-2)', overflowX: 'auto' }}>
           {['ALL', 'NOT STARTED', 'IN PROGRESS', 'SUBMITTED', 'EVALUATED'].map(f => (
              <button 
                key={f} 
                onClick={() => setFilter(f)} 
                style={{
                  fontWeight: filter === f ? 'bold' : 'normal',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 'var(--spacing-2)',
                  color: filter === f ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  whiteSpace: 'nowrap'
                }}
              >
                {f}
              </button>
           ))}
        </div>

        {filteredStudents.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 'var(--spacing-4)' }}>No students match this filter.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                <th style={{ padding: 'var(--spacing-3)' }}>Student</th>
                <th style={{ padding: 'var(--spacing-3)' }}>Status</th>
                <th style={{ padding: 'var(--spacing-3)' }}>Started</th>
                <th style={{ padding: 'var(--spacing-3)' }}>Submitted</th>
                <th style={{ padding: 'var(--spacing-3)' }}>Score</th>
                <th style={{ padding: 'var(--spacing-3)', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map(s => (
                <tr key={s.student_id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: 'var(--spacing-3)' }}>{s.student_name}</td>
                  <td style={{ padding: 'var(--spacing-3)' }}>
                    {(() => {
                      let badgeStyle = { padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' };
                      if (s.status === 'EVALUATED') badgeStyle = { ...badgeStyle, background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)' };
                      else if (s.status === 'SUBMITTED') badgeStyle = { ...badgeStyle, background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)' };
                      else if (s.status === 'IN PROGRESS') badgeStyle = { ...badgeStyle, background: 'rgba(245, 158, 11, 0.1)', color: 'var(--color-warning)' };
                      else badgeStyle = { ...badgeStyle, background: 'rgba(107, 114, 128, 0.1)', color: 'var(--color-text-muted)' };
                      
                      return <span style={badgeStyle}>{s.status}</span>;
                    })()}
                  </td>
                  <td style={{ padding: 'var(--spacing-3)', color: 'var(--color-text-muted)' }}>
                    {s.started_at ? new Date(s.started_at).toLocaleString() : '—'}
                  </td>
                  <td style={{ padding: 'var(--spacing-3)', color: 'var(--color-text-muted)' }}>
                    {s.submitted_at ? new Date(s.submitted_at).toLocaleString() : '—'}
                  </td>
                  <td style={{ padding: 'var(--spacing-3)' }}>
                    {s.status === 'EVALUATED' ? (s.score || 0) : '—'}
                  </td>
                  <td style={{ padding: 'var(--spacing-3)', textAlign: 'right' }}>
                    {s.attempt_id ? (
                      <Button onClick={() => navigate(`/instructor/attempt/${s.attempt_id}`)}>
                        {s.status === 'EVALUATED' ? 'View Results' : 'Review'}
                      </Button>
                    ) : (
                      <span style={{ color: 'var(--color-text-muted)' }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
};
