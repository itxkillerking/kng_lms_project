import React, { useContext, useEffect, useState } from 'react';
import { ExamContext } from '../../context/ExamContext';
import { Card, Button, LoadingOverlay, Alert } from '../../components/common/UIComponents';
import { useNavigate, useParams } from 'react-router-dom';
import { examService } from '../../services/exams';
import { PreExamCheck } from './PreExamCheck';

export const StudentExams = () => {
  const { exams, loading, error, fetchExams } = useContext(ExamContext);
  const [attempts, setAttempts] = useState([]);
  const [activeTab, setActiveTab] = useState('available');
  const navigate = useNavigate();

  useEffect(() => {
    fetchExams();
    examService.getStudentAttempts().then(data => {
      const results = data.results !== undefined ? data.results : data;
      setAttempts(Array.isArray(results) ? results : []);
    }).catch(console.error);
  }, [fetchExams]);

  if (loading) return <LoadingOverlay message="Loading exams..." />;

  const now = new Date();
  
  // Create sets of exam IDs based on attempts
  const inProgressExamIds = new Set(attempts.filter(a => a.status === 'started' || a.status === 'paused').map(a => a.exam));
  const completedExamIds = new Set(attempts.filter(a => a.status === 'submitted' || a.status === 'evaluated' || a.status === 'terminated').map(a => a.exam));

  const availableExams = exams.filter(e => e.status === 'active' && !inProgressExamIds.has(e.id) && !completedExamIds.has(e.id) && (!e.end_time || new Date(e.end_time) > now) && (!e.start_time || new Date(e.start_time) <= now));
  const upcomingExams = exams.filter(e => e.status === 'scheduled' || (e.status === 'active' && e.start_time && new Date(e.start_time) > now));
  const inProgressExams = exams.filter(e => inProgressExamIds.has(e.id));
  const completedExams = exams.filter(e => completedExamIds.has(e.id));
  const expiredExams = exams.filter(e => e.status === 'active' && e.end_time && new Date(e.end_time) < now && !inProgressExamIds.has(e.id) && !completedExamIds.has(e.id));

  const getActiveList = () => {
    switch(activeTab) {
      case 'available': return availableExams;
      case 'upcoming': return upcomingExams;
      case 'inprogress': return inProgressExams;
      case 'completed': return completedExams;
      case 'expired': return expiredExams;
      default: return availableExams;
    }
  };

  const activeList = getActiveList();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-4)' }}>
        <h2>My Exams</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-8)' }}>
        <Card style={{ textAlign: 'center' }}>
          <h4 style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-2)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Available Exams</h4>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>{availableExams.length}</div>
        </Card>
        <Card style={{ textAlign: 'center' }}>
          <h4 style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-2)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Upcoming</h4>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-warning)' }}>{upcomingExams.length}</div>
        </Card>
        <Card style={{ textAlign: 'center' }}>
          <h4 style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-2)', fontSize: '0.9rem', textTransform: 'uppercase' }}>In Progress</h4>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-primary-hover)' }}>{inProgressExams.length}</div>
        </Card>
        <Card style={{ textAlign: 'center' }}>
          <h4 style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-2)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Completed</h4>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-success)' }}>{completedExams.length}</div>
        </Card>
      </div>

      <div style={{ display: 'flex', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-6)', borderBottom: '2px solid rgba(255, 255, 255, 0.4)', paddingBottom: 'var(--spacing-2)', overflowX: 'auto' }}>
        <button onClick={() => setActiveTab('available')} style={{ fontWeight: activeTab === 'available' ? 'bold' : 'normal', background: 'none', border: 'none', cursor: 'pointer', padding: 'var(--spacing-2)', color: activeTab === 'available' ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>Available</button>
        <button onClick={() => setActiveTab('upcoming')} style={{ fontWeight: activeTab === 'upcoming' ? 'bold' : 'normal', background: 'none', border: 'none', cursor: 'pointer', padding: 'var(--spacing-2)', color: activeTab === 'upcoming' ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>Upcoming</button>
        <button onClick={() => setActiveTab('inprogress')} style={{ fontWeight: activeTab === 'inprogress' ? 'bold' : 'normal', background: 'none', border: 'none', cursor: 'pointer', padding: 'var(--spacing-2)', color: activeTab === 'inprogress' ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>In Progress</button>
        <button onClick={() => setActiveTab('completed')} style={{ fontWeight: activeTab === 'completed' ? 'bold' : 'normal', background: 'none', border: 'none', cursor: 'pointer', padding: 'var(--spacing-2)', color: activeTab === 'completed' ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>Completed</button>
        <button onClick={() => setActiveTab('expired')} style={{ fontWeight: activeTab === 'expired' ? 'bold' : 'normal', background: 'none', border: 'none', cursor: 'pointer', padding: 'var(--spacing-2)', color: activeTab === 'expired' ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>Expired</button>
      </div>
      
      {error && <Alert type="error" message={error} />}
      
      {activeList.length === 0 && !error ? (
        <Card style={{ textAlign: 'center', padding: 'var(--spacing-8)' }}>
          <h3>No exams in this category</h3>
          <p style={{ color: 'var(--color-text-muted)' }}>There are no exams to display here.</p>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--spacing-6)' }}>
          {activeList.map(exam => {
            let statusBadge = null;
            if (activeTab === 'available') statusBadge = <span style={{ padding: '4px 8px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>AVAILABLE</span>;
            else if (activeTab === 'upcoming') statusBadge = <span style={{ padding: '4px 8px', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--color-warning)', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>UPCOMING</span>;
            else if (activeTab === 'inprogress') statusBadge = <span style={{ padding: '4px 8px', background: 'rgba(79, 70, 229, 0.1)', color: 'var(--color-primary)', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>IN PROGRESS</span>;
            else if (activeTab === 'completed') statusBadge = <span style={{ padding: '4px 8px', background: 'rgba(107, 114, 128, 0.1)', color: 'var(--color-text-muted)', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>COMPLETED</span>;
            
            return (
              <Card key={exam.id} style={{ display: 'flex', flexDirection: 'column', transition: 'transform 0.2s', cursor: 'pointer' }} onClick={() => navigate(`/student/exam/${exam.id}`)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-2)' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-text-main)' }}>{exam.title}</h3>
                  {statusBadge}
                </div>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-4)', flex: 1, fontSize: '0.9rem', lineHeight: '1.4' }}>{exam.description || 'No description provided.'}</p>
                <div style={{ padding: 'var(--spacing-3)', background: 'var(--glass-light-bg)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--spacing-4)' }}>
                  <p style={{ fontSize: 'var(--font-size-sm)', margin: 0, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Course:</span> 
                    <strong>{exam.course_title}</strong>
                  </p>
                  <p style={{ fontSize: 'var(--font-size-sm)', margin: '4px 0 0 0', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Duration:</span> 
                    <strong>{exam.duration_minutes} mins</strong>
                  </p>
                </div>
                
                <Button style={{ width: '100%' }}>
                  {activeTab === 'available' || activeTab === 'inprogress' ? 'Start/Resume' : 'View Details'}
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const StudentExamDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);
  const [showPreCheck, setShowPreCheck] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const [examData, questionsData, attemptsData] = await Promise.all([
          examService.getExamDetails(id),
          examService.getExamQuestions(id),
          examService.getStudentAttempts()
        ]);
        setExam(examData);
        const qResults = questionsData.results !== undefined ? questionsData.results : questionsData;
        setQuestions(Array.isArray(qResults) ? qResults : []);
        
        const aResults = attemptsData.results !== undefined ? attemptsData.results : attemptsData;
        const attemptsArr = Array.isArray(aResults) ? aResults : [];
        const myAttempts = attemptsArr.filter(a => a.exam === parseInt(id));
        setAttempts(myAttempts);

        if (myAttempts.length > 0 && myAttempts[0].status === 'evaluated') {
          // Fetch answers if evaluated to show result details
          try {
             const ansRes = await api.get(`/exam-answers/?attempt=${myAttempts[0].id}`);
             setAnswers(ansRes.data.results !== undefined ? ansRes.data.results : ansRes.data);
          } catch(e) {}
        }
      } catch (err) {
        setError('Failed to load exam details.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  const needsProctoring = exam?.settings?.camera_required || exam?.settings?.microphone_required;

  const handleStartResume = async () => {
    if (needsProctoring) {
      setShowPreCheck(true);
      return;
    }
    await proceedToExam();
  };

  const proceedToExam = async (mediaStream = null) => {
    setStarting(true);
    setError(null);
    try {
      const attempt = await examService.startExam(id);
      navigate(`/student/exam/${id}/take/${attempt.id}`, {
        state: mediaStream ? { hasVerifiedStream: true } : undefined
      });
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to start exam.');
      setStarting(false);
      if (mediaStream) {
        mediaStream.getTracks().forEach(t => t.stop());
      }
    }
  };

  const handlePreCheckReady = (stream) => {
    stream.getTracks().forEach(t => t.stop());
    proceedToExam(null);
  };

  const handlePreCheckCancel = () => {
    setShowPreCheck(false);
  };

  if (loading) return <LoadingOverlay message="Loading details..." />;
  if (error && !exam) return <Alert type="error" message={error} />;
  if (!exam) return <Alert type="error" message="Exam not found" />;

  if (showPreCheck) {
    return (
      <PreExamCheck
        onReady={handlePreCheckReady}
        onCancel={handlePreCheckCancel}
        examTitle={exam.title}
      />
    );
  }

  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
  const hasAttempt = attempts.length > 0;
  const myAttempt = hasAttempt ? attempts[0] : null;
  const isCompleted = myAttempt && ['submitted', 'evaluated', 'terminated'].includes(myAttempt.status);
  const isEvaluated = myAttempt && myAttempt.status === 'evaluated';
  const canResume = hasAttempt && !isCompleted && exam.settings?.allow_resume;

  return (
    <Card style={{ maxWidth: '800px', margin: '0 auto' }}>
      <Button variant="secondary" onClick={() => navigate('/student/exams')} style={{ marginBottom: 'var(--spacing-4)' }}>
        ← Back to Exams
      </Button>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: 'var(--font-size-3xl)', marginBottom: 'var(--spacing-2)' }}>{exam.title}</h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-6)' }}>{exam.description}</p>
        </div>
        {isEvaluated && (
          <div style={{ textAlign: 'right', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.05))', backdropFilter: 'blur(10px)', border: '1px solid rgba(16, 185, 129, 0.3)', color: 'var(--color-success)', padding: 'var(--spacing-4) var(--spacing-6)', borderRadius: 'var(--radius-lg)', minWidth: '150px' }}>
            <div style={{ fontSize: 'var(--font-size-sm)', opacity: 0.9, textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '8px' }}>Final Score</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', lineHeight: '1' }}>
               {Math.round((myAttempt.total_score / (totalMarks || 1)) * 100)}%
            </div>
            <div style={{ fontSize: '1rem', marginTop: '8px', opacity: 0.9 }}>
              {myAttempt.total_score} / {totalMarks}
            </div>
          </div>
        )}
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-8)' }}>
        <div style={{ padding: 'var(--spacing-3)', background: 'var(--glass-light-bg)', borderRadius: 'var(--radius-md)', border: 'var(--glass-light-border)' }}>
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Course</div>
          <div style={{ fontWeight: '600' }}>{exam.course_title || exam.course}</div>
        </div>
        <div style={{ padding: 'var(--spacing-3)', background: 'var(--glass-light-bg)', borderRadius: 'var(--radius-md)', border: 'var(--glass-light-border)' }}>
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Questions</div>
          <div style={{ fontWeight: '600' }}>{questions.length}</div>
        </div>
        <div style={{ padding: 'var(--spacing-3)', background: 'var(--glass-light-bg)', borderRadius: 'var(--radius-md)', border: 'var(--glass-light-border)' }}>
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Total Marks</div>
          <div style={{ fontWeight: '600' }}>{totalMarks}</div>
        </div>
        <div style={{ padding: 'var(--spacing-3)', background: 'var(--glass-light-bg)', borderRadius: 'var(--radius-md)', border: 'var(--glass-light-border)' }}>
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Duration</div>
          <div style={{ fontWeight: '600' }}>{exam.duration_minutes} Min</div>
        </div>
        {myAttempt && (
          <>
            <div style={{ padding: 'var(--spacing-3)', background: 'var(--glass-light-bg)', borderRadius: 'var(--radius-md)', border: 'var(--glass-light-border)' }}>
              <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Status</div>
              <div style={{ fontWeight: '600', color: isEvaluated ? 'var(--color-success)' : 'var(--color-primary)' }}>{myAttempt.status.toUpperCase()}</div>
            </div>
          </>
        )}
      </div>

      {needsProctoring && !isCompleted && (
        <div style={{ marginBottom: 'var(--spacing-4)', padding: 'var(--spacing-3) var(--spacing-4)', backgroundColor: '#EFF6FF', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-sm)', color: '#1E40AF', display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
          🔒 This exam requires {exam.settings?.camera_required && exam.settings?.microphone_required ? 'camera and microphone' : exam.settings?.camera_required ? 'camera' : 'microphone'} access for proctoring.
        </div>
      )}

      {error && <Alert type="error" message={error} />}
      
      <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-8)' }}>
        {isEvaluated ? (
          <Alert type="success" message="This exam has been evaluated. See your results below." />
        ) : isCompleted ? (
          <Alert type="info" message="You have submitted this exam. Pending evaluation." />
        ) : !hasAttempt || canResume ? (
          <Button onClick={handleStartResume} disabled={starting} style={{ fontSize: 'var(--font-size-xl)', padding: 'var(--spacing-4) var(--spacing-8)' }}>
            {starting ? 'Starting...' : hasAttempt ? 'Resume Exam' : needsProctoring ? 'Setup Proctoring & Start' : 'Start Exam'}
          </Button>
        ) : (
          <Alert type="error" message="You have a pending attempt but this exam does not allow resuming." />
        )}
      </div>

      {/* Evaluated Details */}
      {isEvaluated && answers.length > 0 && (
        <div style={{ marginTop: 'var(--spacing-8)', borderTop: '2px solid var(--color-border)', paddingTop: 'var(--spacing-6)' }}>
          <h3 style={{ marginBottom: 'var(--spacing-4)' }}>Evaluation Details</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
            {questions.map((q, idx) => {
              const ans = answers.find(a => a.question === q.id);
              return (
                <Card key={q.id} style={{ borderLeft: '4px solid ' + (ans?.marks_obtained > 0 ? 'var(--color-success)' : 'var(--color-danger)') }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-2)' }}>
                    <strong>Question {q.order_number || (idx + 1)}</strong>
                    <strong style={{ color: 'var(--color-primary)' }}>
                      Marks: {ans?.marks_obtained !== null && ans?.marks_obtained !== undefined ? ans.marks_obtained : 0} / {q.marks}
                    </strong>
                  </div>
                  <p style={{ margin: 'var(--spacing-2) 0', color: 'var(--color-text)' }}>{q.question_text}</p>
                  
                  {ans?.instructor_feedback && (
                    <div style={{ marginTop: 'var(--spacing-3)', padding: 'var(--spacing-2)', backgroundColor: '#FFFBEB', borderRadius: '4px', fontSize: 'var(--font-size-sm)' }}>
                      <strong>Instructor Feedback:</strong> {ans.instructor_feedback}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
};
