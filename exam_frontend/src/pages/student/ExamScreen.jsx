import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { examService } from '../../services/exams';
import { Button, LoadingOverlay, Alert } from '../../components/common/UIComponents';
import { CodeQuestionEditor, AudioQuestionEditor } from './AdvancedQuestionEditors';
import { ProctoringWrapper } from './ProctoringWrapper';
import './exam.css';

export const ExamScreen = () => {
  const { id, attemptId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { qId: { id, text_answer } }
  const [visited, setVisited] = useState(new Set([0]));
  
  const [saveStatus, setSaveStatus] = useState(''); // '', 'saving', 'saved', 'failed'
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [globalTimeLeft, setGlobalTimeLeft] = useState(null);
  const [questionTimeLeft, setQuestionTimeLeft] = useState(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const saveTimeoutRef = useRef(null);
  const currentAnswerRef = useRef('');

  // Load Exam Data
  useEffect(() => {
    const initExam = async () => {
      try {
        const [examData, questionsData, answersData] = await Promise.all([
          examService.getExamDetails(id),
          examService.getExamQuestions(id),
          examService.getExamAnswers(attemptId)
        ]);
        
        const qResults = questionsData.results !== undefined ? questionsData.results : questionsData;
        const sortedQuestions = (Array.isArray(qResults) ? qResults : []).sort((a,b) => a.order_number - b.order_number);
        
        const aResults = answersData.results !== undefined ? answersData.results : answersData;
        const answersList = Array.isArray(aResults) ? aResults : [];

        setExam(examData);
        setQuestions(sortedQuestions);
        
        // Restore answers
        const restoredAnswers = {};
        answersList.forEach(ans => {
          restoredAnswers[ans.question] = { 
            id: ans.id, 
            text_answer: ans.answer_text || ans.text_answer || '', // handle alias
            transcript_text: ans.transcript_text || '',
            audioBlob: null, // Audio blob won't come from server via simple array unless fetched as URL, handled separately or ignored in draft
          };
        });
        
        // Draft Recovery - overwrite with localStorage if newer
        const draftKey = `exam_draft_${attemptId}`;
        const draft = localStorage.getItem(draftKey);
        if (draft) {
          try {
            const parsed = JSON.parse(draft);
            Object.keys(parsed).forEach(qId => {
              // Only overwrite if it wasn't already successfully submitted to server
              if (!restoredAnswers[qId]?.id) {
                restoredAnswers[qId] = { ...restoredAnswers[qId], ...parsed[qId] };
              }
            });
          } catch(e) {}
        }
        
        setAnswers(restoredAnswers);
        
        // Timer logic - assuming started_at logic or fixed duration for Phase 3
        setGlobalTimeLeft(examData.duration_minutes * 60);
        
      } catch (err) {
        alert('Failed to load exam data.');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    initExam();
    
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [id, attemptId, navigate]);

  // Set local question timer when question changes
  useEffect(() => {
    if (questions.length > 0 && !submitted) {
      currentAnswerRef.current = answers[questions[currentIndex].id]?.text_answer || '';
      if (questions[currentIndex].time_limit_seconds) {
        setQuestionTimeLeft(questions[currentIndex].time_limit_seconds);
      } else {
        setQuestionTimeLeft(null);
      }
    }
  }, [currentIndex, questions, submitted]); // Removed answers from dependency to avoid reset

  // Global Timer Tick
  useEffect(() => {
    if (globalTimeLeft === null || submitted || isPaused) return;
    if (globalTimeLeft <= 0) {
      handleFinalSubmit();
      return;
    }
    const timer = setInterval(() => setGlobalTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [globalTimeLeft, submitted, isPaused]);

  // Question Timer Tick
  useEffect(() => {
    if (questionTimeLeft === null || submitted || isPaused) return;
    if (questionTimeLeft <= 0) {
      forceNextQuestion();
      return;
    }
    const timer = setInterval(() => setQuestionTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [questionTimeLeft, submitted, isPaused]);

  const forceNextQuestion = async () => {
    await performSave(questions[currentIndex].id, currentAnswerRef.current);
    if (currentIndex < questions.length - 1) {
      changeQuestion(currentIndex + 1);
    } else {
      handleFinalSubmit();
    }
  };

  const handleAnswerChange = (val, field = 'text_answer', additionalData = {}) => {
    currentAnswerRef.current = val;
    const qId = questions[currentIndex].id;
    
    setAnswers(prev => {
      const newAns = {
        ...prev,
        [qId]: { ...prev[qId], [field]: val, ...additionalData }
      };
      // Save draft to localStorage
      localStorage.setItem(`exam_draft_${attemptId}`, JSON.stringify(newAns));
      return newAns;
    });

    setSaveStatus('saving');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      performSave(qId);
    }, 5000);
  };

  const performSave = async (qId) => {
    if (!answers[qId]) return;
    setSaveStatus('saving');
    try {
      const data = {
        attempt: parseInt(attemptId),
        question: qId,
        answer_text: answers[qId].text_answer,
        transcript_text: answers[qId].transcript_text,
        audioBlob: answers[qId].audioBlob,
        id: answers[qId].id
      };
      const res = await examService.saveAnswer(data);
      setAnswers(prev => ({
        ...prev,
        [qId]: { ...prev[qId], id: res.id }
      }));
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (err) {
      setSaveStatus('failed... retrying');
      // basic retry logic
      setTimeout(async () => {
         try {
             await examService.saveAnswer({ attempt: parseInt(attemptId), question: qId, answer_text: answers[qId].text_answer, id: answers[qId].id });
             setSaveStatus('saved');
         } catch(e) { setSaveStatus('failed'); }
      }, 5000);
    }
  };

  const changeQuestion = async (newIndex) => {
    // Immediate save current
    const qId = questions[currentIndex].id;
    await performSave(qId, currentAnswerRef.current);
    
    setVisited(prev => new Set(prev).add(newIndex));
    setCurrentIndex(newIndex);
  };

  const handleFinalSubmit = async () => {
    setSubmitting(true);
    try {
      // Save current answer one last time
      await performSave(questions[currentIndex].id);
      await examService.submitExam(attemptId);
      localStorage.removeItem(`exam_draft_${attemptId}`);
      setSubmitted(true);
      setShowSubmitConfirm(false);
    } catch (err) {
      alert('Failed to submit exam.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    if (seconds === null) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) return <LoadingOverlay message="Preparing your exam..." />;

  if (!exam) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: 'var(--color-bg-main)' }}>
        <div style={{ padding: 'var(--spacing-8)', backgroundColor: 'white', borderRadius: 'var(--radius-lg)', textAlign: 'center', boxShadow: 'var(--shadow-md)', maxWidth: '400px' }}>
          <h2 style={{ color: 'var(--color-danger)', marginBottom: 'var(--spacing-4)' }}>Failed to load exam</h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-6)' }}>
            The exam data could not be loaded. Please check your connection or contact support.
          </p>
          <Button onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: 'var(--color-bg-main)' }}>
        <div style={{ padding: 'var(--spacing-8)', backgroundColor: 'white', borderRadius: 'var(--radius-lg)', textAlign: 'center', boxShadow: 'var(--shadow-md)', maxWidth: '400px' }}>
          <h2 style={{ color: 'var(--color-warning)', marginBottom: 'var(--spacing-4)' }}>No Questions Available</h2>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-6)' }}>
            This exam has not been configured with any questions yet.
          </p>
          <Button onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }
  
  if (submitted) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: 'var(--color-bg-main)' }}>
        <div style={{ padding: 'var(--spacing-8)', backgroundColor: 'white', borderRadius: 'var(--radius-lg)', textAlign: 'center', boxShadow: 'var(--shadow-md)' }}>
          <h1 style={{ color: 'var(--color-success)', marginBottom: 'var(--spacing-4)' }}>Exam Submitted Successfully</h1>
          <p style={{ marginBottom: 'var(--spacing-6)' }}>Your answers have been securely recorded.</p>
          <div style={{ display: 'flex', gap: 'var(--spacing-4)', justifyContent: 'center' }}>
            <Button onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
            <Button variant="secondary" onClick={() => navigate('/student/exams')}>Return to Exams List</Button>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const answeredCount = Object.values(answers).filter(a => a.text_answer && a.text_answer.trim() !== '').length;

  return (
    <ProctoringWrapper exam={exam} attemptId={attemptId} currentQuestionId={currentQ?.id} questionIndex={currentIndex} totalQuestions={questions.length} onPauseChange={setIsPaused}>

      <div className="exam-layout">
        {isOffline && <div className="network-status">You are offline. Answers will not save until connection is restored.</div>}
      
      {/* Sidebar */}
      <aside className="exam-sidebar">
        <div className="sidebar-header">
          <h3>{exam.title}</h3>
          <div className="progress-stats">
            <div>Answered: {answeredCount} / {questions.length}</div>
            <div>Remaining: {questions.length - answeredCount}</div>
          </div>
        </div>
        <div className="question-grid">
          {questions.map((q, i) => {
            const isCurrent = i === currentIndex;
            const hasAnswer = answers[q.id]?.text_answer?.trim();
            const isVisited = visited.has(i);
            
            let cls = 'q-box';
            if (isCurrent) cls += ' current';
            else if (hasAnswer) cls += ' answered';
            else if (isVisited) cls += ' visited';

            return (
              <button 
                key={q.id} 
                className={cls}
                onClick={() => {
                  if (exam.settings?.allow_back_navigation || i > currentIndex) {
                    changeQuestion(i);
                  }
                }}
                disabled={!exam.settings?.allow_back_navigation && i < currentIndex}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </aside>

      {/* Main Content */}
      <main className="exam-main">
        {/* Topbar */}
        <header className="exam-topbar">
          <div>
            <span style={{ fontWeight: 'bold' }}>Question {currentIndex + 1} of {questions.length}</span>
            <span style={{ marginLeft: 'var(--spacing-4)', color: 'var(--color-text-muted)' }}>
              Marks: {currentQ.marks}
            </span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-6)' }}>
            <div className="save-status">
              {saveStatus === 'saving' && 'Saving...'}
              {saveStatus === 'saved' && <span className="saved">✓ Saved</span>}
              {saveStatus === 'failed' && <span className="failed">✕ Failed</span>}
            </div>
            
            <Button variant="secondary" onClick={() => performSave(currentQ.id, currentAnswerRef.current)}>
              Save Now
            </Button>
            
            <div style={{ display: 'flex', gap: 'var(--spacing-4)' }}>
              {questionTimeLeft !== null && (
                <div className={`timer-box ${questionTimeLeft < 15 ? 'warning' : ''}`} title="Question Time">
                  Q: {formatTime(questionTimeLeft)}
                </div>
              )}
              <div className={`timer-box ${globalTimeLeft < 300 ? 'warning' : ''}`} title="Total Time">
                T: {formatTime(globalTimeLeft)}
              </div>
            </div>
            
            <Button variant="danger" onClick={() => setShowSubmitConfirm(true)}>Finish Exam</Button>
          </div>
        </header>

        {/* Question Area */}
        <div className="exam-content">
          <h2 className="question-text">{currentQ.question_text}</h2>
          
          <div className="answer-area">
            {currentQ.question_type === 'text' && (
              <>
                <textarea
                  className="answer-textarea"
                  placeholder="Type your answer here..."
                  value={answers[currentQ.id]?.text_answer || ''}
                  onChange={(e) => {
                    const text = e.target.value;
                    const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
                    if (currentQ.max_words && words > currentQ.max_words) {
                        return; // prevent typing more
                    }
                    handleAnswerChange(text);
                  }}
                  disabled={isOffline}
                />
                {currentQ.max_words && (
                  <div style={{ textAlign: 'right', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginTop: '8px' }}>
                    Words: {answers[currentQ.id]?.text_answer?.trim().split(/\s+/).filter(w => w.length > 0).length || 0} / {currentQ.max_words}
                  </div>
                )}
              </>
            )}
            
            {currentQ.question_type === 'code' && (
              <CodeQuestionEditor 
                value={answers[currentQ.id]?.text_answer || ''}
                onChange={(val) => handleAnswerChange(val)}
                language={currentQ.programming_language}
                starterCode={currentQ.starter_code}
                disabled={isOffline}
              />
            )}
            
            {currentQ.question_type === 'audio' && (
              <AudioQuestionEditor
                audioBlob={answers[currentQ.id]?.audioBlob}
                onSaveAudio={(blob) => handleAnswerChange(answers[currentQ.id]?.text_answer || '', 'text_answer', { audioBlob: blob })}
                transcriptText={answers[currentQ.id]?.transcript_text || ''}
                onTranscriptChange={(text) => handleAnswerChange(text, 'transcript_text')}
                transcriptEnabled={currentQ.transcript_enabled !== false}
                maxRecordingSeconds={currentQ.max_recording_seconds}
                disabled={isOffline}
              />
            )}
          </div>
          
          <footer className="exam-footer">
            <Button 
              variant="secondary" 
              onClick={() => changeQuestion(currentIndex - 1)}
              disabled={currentIndex === 0 || !exam.settings?.allow_back_navigation}
            >
              ← Previous
            </Button>
            
            {currentIndex < questions.length - 1 ? (
              <Button onClick={() => changeQuestion(currentIndex + 1)}>
                Next Question →
              </Button>
            ) : (
              <Button variant="danger" onClick={() => setShowSubmitConfirm(true)}>
                Submit Exam
              </Button>
            )}
          </footer>
        </div>
      </main>

      {/* Submit Confirm Modal */}
      {showSubmitConfirm && (
        <div className="loading-overlay">
          <div style={{ backgroundColor: 'white', padding: 'var(--spacing-6)', borderRadius: 'var(--radius-lg)', color: 'var(--color-text-main)', maxWidth: '400px', width: '100%' }}>
            <h3 style={{ marginBottom: 'var(--spacing-4)' }}>Confirm Submission</h3>
            <ul style={{ marginBottom: 'var(--spacing-6)', listStyle: 'none', lineHeight: '1.8' }}>
              <li>Total Questions: <strong>{questions.length}</strong></li>
              <li>Answered: <strong style={{ color: 'var(--color-success)' }}>{answeredCount}</strong></li>
              <li>Unanswered: <strong style={{ color: 'var(--color-danger)' }}>{questions.length - answeredCount}</strong></li>
              <li>Time Remaining: <strong>{formatTime(globalTimeLeft)}</strong></li>
            </ul>
            <div style={{ display: 'flex', gap: 'var(--spacing-4)', justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setShowSubmitConfirm(false)}>Cancel</Button>
              <Button variant="danger" onClick={handleFinalSubmit} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Confirm Submit'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
    </ProctoringWrapper>
  );
};
