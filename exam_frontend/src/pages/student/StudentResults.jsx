import React, { useContext, useEffect, useState } from 'react';
import { ExamContext } from '../../context/ExamContext';
import { Card, Button, LoadingOverlay, Alert } from '../../components/common/UIComponents';
import { useNavigate } from 'react-router-dom';
import { examService } from '../../services/exams';

export const StudentResults = () => {
  const { exams, loading, error, fetchExams } = useContext(ExamContext);
  const [attempts, setAttempts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchExams();
    examService.getStudentAttempts().then(data => {
      const results = data.results !== undefined ? data.results : data;
      setAttempts(Array.isArray(results) ? results : []);
    }).catch(console.error);
  }, [fetchExams]);

  if (loading) return <LoadingOverlay message="Loading results..." />;

  // Find exams where the user has an 'evaluated' attempt
  const evaluatedAttempts = attempts.filter(a => a.status === 'evaluated');
  const evaluatedExamIds = new Set(evaluatedAttempts.map(a => a.exam));
  const evaluatedExams = exams.filter(e => evaluatedExamIds.has(e.id));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)' }}>
        <h2>My Exam Results</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-8)' }}>
        <Card style={{ textAlign: 'center' }}>
          <h4 style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-2)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Evaluated Exams</h4>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-success)' }}>{evaluatedExams.length}</div>
        </Card>
      </div>
      
      {error && <Alert type="error" message={error} />}
      
      {evaluatedExams.length === 0 && !error ? (
        <Card style={{ textAlign: 'center', padding: 'var(--spacing-8)' }}>
          <h3>No results available</h3>
          <p style={{ color: 'var(--color-text-muted)' }}>You don't have any evaluated exams yet.</p>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--spacing-6)' }}>
          {evaluatedExams.map(exam => {
            const attempt = evaluatedAttempts.find(a => a.exam === exam.id);
            const scorePercentage = Math.round((attempt.total_score / (exam.total_marks || 1)) * 100);
            
            return (
              <Card key={exam.id} style={{ display: 'flex', flexDirection: 'column', transition: 'transform 0.2s', cursor: 'pointer' }} onClick={() => navigate(`/student/exam/${exam.id}`)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-2)' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-text-main)' }}>{exam.title}</h3>
                  <span style={{ padding: '4px 8px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>EVALUATED</span>
                </div>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-4)', flex: 1, fontSize: '0.9rem', lineHeight: '1.4' }}>{exam.description || 'No description provided.'}</p>
                <div style={{ padding: 'var(--spacing-3)', background: 'var(--glass-light-bg)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--spacing-4)' }}>
                  <p style={{ fontSize: 'var(--font-size-sm)', margin: 0, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Course:</span> 
                    <strong>{exam.course_title}</strong>
                  </p>
                  <p style={{ fontSize: 'var(--font-size-sm)', margin: '4px 0 0 0', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Score:</span> 
                    <strong style={{ color: 'var(--color-success)' }}>{attempt.total_score} ({scorePercentage}%)</strong>
                  </p>
                </div>
                
                <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                  <Button style={{ flex: 1 }} onClick={(e) => { e.stopPropagation(); navigate(`/student/exam/${exam.id}`); }}>
                    View Result
                  </Button>
                  <Button 
                    variant="secondary"
                    style={{ flex: 1 }}
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        await examService.downloadResultPdf(attempt.id);
                      } catch (err) {
                        alert('Failed to download PDF report.');
                      }
                    }}
                  >
                    📄 PDF Report
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
