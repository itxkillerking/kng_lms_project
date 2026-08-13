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
        <h2>Manage Exams</h2>
        <Button onClick={() => navigate('/instructor/create')}>+ Create New Exam</Button>
      </div>
      
      {error && <Alert type="error" message={error} />}
      
      {(!Array.isArray(exams) || exams.length === 0) && !error ? (
        <Card style={{ textAlign: 'center', padding: 'var(--spacing-8)' }}>
          <h3>No exams created yet</h3>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-4)' }}>Get started by creating your first exam.</p>
          <Button onClick={() => navigate('/instructor/create')}>Create Exam</Button>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
          {Array.isArray(exams) && exams.map(exam => (
            <Card key={exam.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ marginBottom: 'var(--spacing-1)' }}>{exam.title}</h3>
                <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', display: 'block' }}>
                  <strong>Course:</strong> {exam.course_title} | <strong>Status:</strong> <span style={{ color: exam.status === 'active' ? 'var(--color-success)' : 'inherit' }}>{exam.status.toUpperCase()}</span> | <strong>Duration:</strong> {exam.duration_minutes} mins
                </span>
                <div style={{ display: 'flex', gap: 'var(--spacing-4)', marginTop: 'var(--spacing-2)', fontSize: 'var(--font-size-sm)' }}>
                  <span>👥 Assigned: {exam.assigned_count || 0}</span>
                  <span>⏳ Not Started: {exam.not_started_count || 0}</span>
                  <span>🔄 In Progress: {exam.in_progress_count || 0}</span>
                  <span>✅ Submitted: {exam.submitted_count || 0}</span>
                  <span>🎓 Evaluated: {exam.evaluated_count || 0}</span>
                  <span>⭐ Avg Score: {exam.average_score || 0}%</span>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                {exam.status === 'draft' && (
                  <Button variant="primary" onClick={() => handlePublish(exam.id)}>Publish</Button>
                )}
                <Button onClick={() => setAssignModalExam(exam)}>Assign</Button>
                <Button onClick={() => navigate(`/instructor/edit/${exam.id}`)}>Edit</Button>
                <Button variant="danger" onClick={() => handleDelete(exam.id)}>Delete</Button>
              </div>
            </Card>
          ))}
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
