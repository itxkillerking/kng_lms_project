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

      <div style={{ display: 'flex', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-6)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--spacing-2)' }}>
        <button onClick={() => setActiveTab('available')} style={{ fontWeight: activeTab === 'available' ? 'bold' : 'normal', background: 'none', border: 'none', cursor: 'pointer', padding: 'var(--spacing-2)' }}>Available ({availableExams.length})</button>
        <button onClick={() => setActiveTab('upcoming')} style={{ fontWeight: activeTab === 'upcoming' ? 'bold' : 'normal', background: 'none', border: 'none', cursor: 'pointer', padding: 'var(--spacing-2)' }}>Upcoming ({upcomingExams.length})</button>
        <button onClick={() => setActiveTab('inprogress')} style={{ fontWeight: activeTab === 'inprogress' ? 'bold' : 'normal', background: 'none', border: 'none', cursor: 'pointer', padding: 'var(--spacing-2)' }}>In Progress ({inProgressExams.length})</button>
        <button onClick={() => setActiveTab('completed')} style={{ fontWeight: activeTab === 'completed' ? 'bold' : 'normal', background: 'none', border: 'none', cursor: 'pointer', padding: 'var(--spacing-2)' }}>Completed ({completedExams.length})</button>
        <button onClick={() => setActiveTab('expired')} style={{ fontWeight: activeTab === 'expired' ? 'bold' : 'normal', background: 'none', border: 'none', cursor: 'pointer', padding: 'var(--spacing-2)' }}>Expired ({expiredExams.length})</button>
      </div>
      
      {error && <Alert type="error" message={error} />}
      
      {activeList.length === 0 && !error ? (
        <Card style={{ textAlign: 'center', padding: 'var(--spacing-8)' }}>
          <h3>No exams in this category</h3>
          <p style={{ color: 'var(--color-text-muted)' }}>There are no exams to display here.</p>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--spacing-6)' }}>
          {activeList.map(exam => (
            <Card key={exam.id} style={{ display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ marginBottom: 'var(--spacing-2)' }}>{exam.title}</h3>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-4)', flex: 1 }}>{exam.description || 'No description provided.'}</p>
              <p style={{ fontSize: 'var(--font-size-sm)', marginBottom: 'var(--spacing-2)' }}><strong>Course:</strong> {exam.course_title}</p>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'bold' }}>{exam.duration_minutes} mins</span>
                <Button onClick={() => navigate(`/student/exam/${exam.id}`)}>
                  {activeTab === 'available' || activeTab === 'inprogress' ? 'Start/Resume' : 'View Details'}
                </Button>
              </div>
            </Card>
          ))}
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
        setAttempts(attemptsArr.filter(a => a.exam === parseInt(id)));
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
    // If proctoring hardware is required, show PreExamCheck first
    if (needsProctoring) {
      setShowPreCheck(true);
      return;
    }
    // Otherwise, start directly
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
      // If we had a stream and failed, clean it up
      if (mediaStream) {
        mediaStream.getTracks().forEach(t => t.stop());
      }
    }
  };

  const handlePreCheckReady = (stream) => {
    // Hardware verified — now create attempt and navigate
    // The stream will be re-acquired by ProctoringWrapper (PreExamCheck will NOT stop it on unmount when status is READY)
    // But we stop it here since ProctoringWrapper will create its own managed stream
    // This avoids having an orphan stream
    stream.getTracks().forEach(t => t.stop());
    proceedToExam(null);
  };

  const handlePreCheckCancel = () => {
    setShowPreCheck(false);
  };

  if (loading) return <LoadingOverlay message="Loading details..." />;
  if (error && !exam) return <Alert type="error" message={error} />;
  if (!exam) return <Alert type="error" message="Exam not found" />;

  // Show PreExamCheck gate if active
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
  const isCompleted = attempts.some(a => ['submitted', 'evaluated', 'terminated'].includes(a.status));
  const canResume = hasAttempt && !isCompleted && exam.settings?.allow_resume;

  return (
    <Card style={{ maxWidth: '800px', margin: '0 auto' }}>
      <Button variant="secondary" onClick={() => navigate('/student/exams')} style={{ marginBottom: 'var(--spacing-4)' }}>
        ← Back to Exams
      </Button>
      
      <h2 style={{ fontSize: 'var(--font-size-3xl)', marginBottom: 'var(--spacing-2)' }}>{exam.title}</h2>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-6)' }}>{exam.description}</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-8)' }}>
        <div><strong>Course:</strong> {exam.course_title || exam.course}</div>
        <div><strong>Questions:</strong> {questions.length}</div>
        <div><strong>Total Marks:</strong> {totalMarks}</div>
        <div><strong>Duration:</strong> {exam.duration_minutes} Minutes</div>
        <div><strong>Resume Allowed:</strong> {exam.settings?.allow_resume ? 'Yes' : 'No'}</div>
        <div><strong>Back Navigation:</strong> {exam.settings?.allow_back_navigation ? 'Allowed' : 'Disabled'}</div>
      </div>

      {needsProctoring && (
        <div style={{ marginBottom: 'var(--spacing-4)', padding: 'var(--spacing-3) var(--spacing-4)', backgroundColor: '#EFF6FF', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-sm)', color: '#1E40AF', display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
          🔒 This exam requires {exam.settings?.camera_required && exam.settings?.microphone_required ? 'camera and microphone' : exam.settings?.camera_required ? 'camera' : 'microphone'} access for proctoring.
        </div>
      )}

      {error && <Alert type="error" message={error} />}
      
      <div style={{ textAlign: 'center' }}>
        {isCompleted ? (
          <Alert type="info" message="You have already completed this exam." />
        ) : !hasAttempt || canResume ? (
          <Button onClick={handleStartResume} disabled={starting} style={{ fontSize: 'var(--font-size-xl)', padding: 'var(--spacing-4) var(--spacing-8)' }}>
            {starting ? 'Starting...' : hasAttempt ? 'Resume Exam' : needsProctoring ? 'Setup Proctoring & Start' : 'Start Exam'}
          </Button>
        ) : (
          <Alert type="error" message="You have a pending attempt but this exam does not allow resuming." />
        )}
      </div>
    </Card>
  );
};
