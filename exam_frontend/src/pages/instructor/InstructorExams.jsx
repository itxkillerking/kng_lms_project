import React, { useContext, useEffect, useState } from 'react';
import { ExamContext } from '../../context/ExamContext';
import { Card, Button, LoadingOverlay, Alert } from '../../components/common/UIComponents';
import { useNavigate } from 'react-router-dom';
import { examService } from '../../services/exams';
import { AssignStudentsModal } from './AssignStudentsModal';

export const InstructorExams = () => {
  const { exams, loading, error, fetchExams } = useContext(ExamContext);
  const [assignModalExam, setAssignModalExam] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  const handlePublish = async (id) => {
    try {
      await examService.publishExam(id);
      fetchExams();
    } catch (err) {
      alert('Failed to publish exam');
    }
  };

  const handleDelete = async (id) => {
    if(window.confirm('Are you sure you want to delete this exam?')) {
      try {
        await examService.deleteExam(id);
        fetchExams();
      } catch (err) {
        alert('Failed to delete exam');
      }
    }
  };

  if (loading) return <LoadingOverlay message="Loading your exams..." />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)' }}>
        <h2 style={{ fontWeight: '700', textShadow: '0 2px 10px rgba(255,255,255,0.8)' }}>Manage Exams</h2>
        <Button variant="primary" onClick={() => navigate('/instructor/create')}>+ Create New Exam</Button>
      </div>

      {Array.isArray(exams) && exams.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-8)' }}>
          <Card style={{ textAlign: 'center' }}>
            <h4 style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-2)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Total Exams</h4>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>{exams.length}</div>
          </Card>
          <Card style={{ textAlign: 'center' }}>
            <h4 style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-2)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Active Exams</h4>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-success)' }}>{exams.filter(e => e.status === 'active').length}</div>
          </Card>
          <Card style={{ textAlign: 'center' }}>
            <h4 style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-2)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Total Students</h4>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-warning)' }}>{exams.reduce((sum, e) => sum + (e.assigned_count || 0), 0)}</div>
          </Card>
          <Card style={{ textAlign: 'center' }}>
            <h4 style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-2)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Pending Grading</h4>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-danger)' }}>{exams.reduce((sum, e) => sum + (e.submitted_count || 0), 0)}</div>
          </Card>
        </div>
      )}
      
      {error && <Alert type="error" message={error} />}
      
      {(!Array.isArray(exams) || exams.length === 0) && !error ? (
        <Card style={{ textAlign: 'center', padding: 'var(--spacing-8)' }}>
          <h3>No exams created yet</h3>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-4)' }}>Get started by creating your first exam.</p>
          <Button onClick={() => navigate('/instructor/create')}>Create Exam</Button>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
          {Array.isArray(exams) && exams.map(exam => {
            let statusBadge = <span style={{ padding: '4px 8px', background: 'rgba(107, 114, 128, 0.1)', color: 'var(--color-text-muted)', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>{exam.status.toUpperCase()}</span>;
            if (exam.status === 'active') statusBadge = <span style={{ padding: '4px 8px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>ACTIVE</span>;
            else if (exam.status === 'draft') statusBadge = <span style={{ padding: '4px 8px', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--color-warning)', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>DRAFT</span>;
            
            return (
            <Card key={exam.id} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ marginBottom: 'var(--spacing-1)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                    {exam.title} {statusBadge}
                  </h3>
                  <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
                    <strong>Course:</strong> {exam.course_title} | <strong>Duration:</strong> {exam.duration_minutes} mins
                  </span>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-3)', padding: 'var(--spacing-3)', background: 'var(--glass-light-bg)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: '80px' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Assigned</span>
                  <strong style={{ fontSize: '1.1rem' }}>{exam.assigned_count || 0}</strong>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: '80px' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Not Started</span>
                  <strong style={{ fontSize: '1.1rem' }}>{exam.not_started_count || 0}</strong>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: '80px' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>In Progress</span>
                  <strong style={{ fontSize: '1.1rem', color: 'var(--color-primary)' }}>{exam.in_progress_count || 0}</strong>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: '80px' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Submitted</span>
                  <strong style={{ fontSize: '1.1rem', color: 'var(--color-danger)' }}>{exam.submitted_count || 0}</strong>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: '80px' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Evaluated</span>
                  <strong style={{ fontSize: '1.1rem', color: 'var(--color-success)' }}>{exam.evaluated_count || 0}</strong>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: '80px', borderLeft: '1px solid rgba(0,0,0,0.1)' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Avg Score</span>
                  <strong style={{ fontSize: '1.1rem' }}>{exam.average_score || 0}%</strong>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: 'var(--spacing-3)', justifyContent: 'flex-end', marginTop: 'var(--spacing-2)' }}>
                {exam.status === 'draft' && (
                  <Button style={{ color: 'var(--color-success)', borderColor: 'var(--color-success)' }} onClick={() => handlePublish(exam.id)}>Publish</Button>
                )}
                <Button onClick={() => setAssignModalExam(exam)}>Assign</Button>
                <Button onClick={() => navigate(`/instructor/edit/${exam.id}`)}>Edit</Button>
                <Button variant="primary" onClick={() => navigate(`/instructor/submissions/${exam.id}`)}>Submissions</Button>
                <Button variant="danger" onClick={() => handleDelete(exam.id)}>Delete</Button>
              </div>
            </Card>
            );
          })}
        </div>
      )}

      {assignModalExam && (
        <AssignStudentsModal 
          exam={assignModalExam} 
          onClose={() => setAssignModalExam(null)} 
          onAssigned={() => fetchExams()} 
        />
      )}
    </div>
  );
};
