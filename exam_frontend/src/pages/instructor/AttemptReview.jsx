import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { examService } from '../../services/exams';
import { Card, Button, LoadingOverlay, Alert, Input } from '../../components/common/UIComponents';

export const AttemptReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('grading'); // 'grading' or 'security'
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [securityData, setSecurityData] = useState(null);
  const [filter, setFilter] = useState('All');
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [savingMarks, setSavingMarks] = useState(false);
  const [gradingError, setGradingError] = useState('');
  const [gradingSuccess, setGradingSuccess] = useState('');

  // Local state for the current answer being graded
  const [currentMarks, setCurrentMarks] = useState('');
  const [currentFeedback, setCurrentFeedback] = useState('');
  
  useEffect(() => {
    const loadData = async () => {
      try {
        const attemptRes = await api.get(`/exam-attempts/${id}/`);
        const attemptData = attemptRes.data;
        setAttempt(attemptData);
        
        // Fetch Security
        const secRes = await api.get(`/exam-attempts/${id}/security_summary/`);
        setSecurityData(secRes.data);
        
        // Fetch Questions and Answers
        const qData = await examService.getExamQuestions(attemptData.exam);
        const qList = qData.results !== undefined ? qData.results : qData;
        const sortedQuestions = Array.isArray(qList) ? qList.sort((a,b) => a.order_number - b.order_number) : [];
        setQuestions(sortedQuestions);
        
        const aData = await examService.getExamAnswers(id);
        const aList = aData.results !== undefined ? aData.results : aData;
        setAnswers(Array.isArray(aList) ? aList : []);
        
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  // When changing questions, sync local state
  useEffect(() => {
    if (questions.length > 0) {
      const q = questions[currentQuestionIndex];
      const ans = answers.find(a => a.question === q.id);
      setCurrentMarks(ans && ans.marks_obtained !== null ? ans.marks_obtained : '');
      setCurrentFeedback(ans && ans.instructor_feedback ? ans.instructor_feedback : '');
      setGradingError('');
      setGradingSuccess('');
    }
  }, [currentQuestionIndex, questions, answers]);

  const handleSaveMarks = async () => {
    const q = questions[currentQuestionIndex];
    let ans = answers.find(a => a.question === q.id);
    
    const numMarks = Number(currentMarks);
    const numMax = Number(q.marks);
    
    if (currentMarks === '' || numMarks < 0 || numMarks > numMax) {
      setGradingError(`Marks must be between 0 and ${numMax}. You entered ${currentMarks}.`);
      return;
    }

    setSavingMarks(true);
    setGradingError('');
    setGradingSuccess('');

    try {
      let savedAnswer;
      if (ans) {
        const res = await api.patch(`/exam-answers/${ans.id}/`, {
          marks_obtained: currentMarks,
          instructor_feedback: currentFeedback
        });
        savedAnswer = res.data;
      } else {
        // Instructor explicitly grading a question the student didn't answer
        const res = await api.post(`/exam-answers/`, {
          attempt: attempt.id,
          question: q.id,
          answer_text: '',
          marks_obtained: currentMarks,
          instructor_feedback: currentFeedback
        });
        savedAnswer = res.data;
      }
      
      // Update local answers array
      setAnswers(prev => {
        const existingIdx = prev.findIndex(a => a.question === q.id);
        if (existingIdx >= 0) {
          const newArr = [...prev];
          newArr[existingIdx] = savedAnswer;
          return newArr;
        } else {
          return [...prev, savedAnswer];
        }
      });
      setGradingSuccess('Marks saved!');
      setTimeout(() => setGradingSuccess(''), 2000);
    } catch (err) {
      console.error('Save Marks Error:', err);
      let errMsg = 'Failed to save marks.';
      if (err.response) {
        errMsg += ` (${err.response.status}: ${JSON.stringify(err.response.data)})`;
      }
      setGradingError(errMsg);
    } finally {
      setSavingMarks(false);
    }
  };

  const handleFinishGrading = async () => {
    // Check if all questions are graded
    const ungraded = questions.filter(q => {
      const ans = answers.find(a => a.question === q.id);
      return !ans || ans.marks_obtained === null;
    });

    if (ungraded.length > 0) {
      alert(`Please grade all questions before finishing the evaluation. (${ungraded.length} ungraded remaining)`);
      return;
    }

    try {
      console.log(`Attempting to evaluate attempt ID: ${attempt.id}`);
      const res = await examService.evaluateAttempt(attempt.id);
      setAttempt(prev => ({ ...prev, status: 'evaluated', total_score: res.total_score }));
      alert(`Grading finished successfully! Final Score: ${res.percentage}%`);
    } catch (err) {
      console.error('Evaluate Error:', err);
      let errMsg = 'Failed to finish grading.';
      if (err.response) {
        errMsg = `Server Error (${err.response.status}): ${err.response.data?.detail || JSON.stringify(err.response.data) || 'Unknown backend error'}`;
      } else if (err.request) {
        errMsg = 'No response received from server (possibly a 404 route error or network issue).';
      } else {
        errMsg = `Error: ${err.message}`;
      }
      alert(errMsg);
    }
  };

  if (loading) return <LoadingOverlay message="Loading Attempt Details..." />;
  if (!attempt || !securityData) return <Alert type="error" message="Failed to load attempt details." />;

  // Prepare timeline
  let timeline = [
    ...(securityData.violations || []).map(v => ({ ...v, itemType: 'violation', time: new Date(v.timestamp).getTime() })),
    ...(securityData.snapshots || []).map(s => ({ ...s, itemType: 'snapshot', time: new Date(s.captured_at).getTime() }))
  ];
  timeline.sort((a, b) => b.time - a.time);
  
  if (filter !== 'All') {
    if (filter === 'Snapshots') {
      timeline = timeline.filter(item => item.itemType === 'snapshot');
    } else {
      timeline = timeline.filter(item => item.itemType === 'violation' && item.violation_type === filter);
    }
  }

  const getSeverityColor = (sev) => {
    if (sev === 'High') return 'var(--color-danger)';
    if (sev === 'Medium') return 'orange';
    return 'var(--color-success)';
  };

  const currentQ = questions[currentQuestionIndex];
  const currentAns = currentQ ? answers.find(a => a.question === currentQ.id) : null;
  const isMarked = currentAns && currentAns.marks_obtained !== null;

  // Question-specific evidence
  const qSnapshots = currentQ ? securityData.snapshots.filter(s => s.question === currentQ.id) : [];
  const qViolations = currentQ ? securityData.violations.filter(v => v.question === currentQ.id) : [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)' }}>
        <div>
          <h2>Attempt Review: {attempt.student_name || attempt.student?.username || 'Student'}</h2>
          <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
            {attempt.exam_title} | Status: <strong style={{ color: attempt.status === 'evaluated' ? 'var(--color-success)' : 'inherit' }}>{attempt.status.toUpperCase()}</strong>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
          {(attempt.status === 'submitted' || attempt.status === 'evaluated') && (
            <Button 
              variant="secondary"
              onClick={async () => {
                try {
                  await examService.downloadResultPdf(attempt.id);
                } catch (err) {
                  alert('Failed to download PDF report.');
                }
              }}
            >
              📄 Download PDF Report
            </Button>
          )}
          <Button variant="secondary" onClick={() => navigate(`/instructor/submissions/${attempt.exam}`)}>Back to Submissions</Button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-6)', borderBottom: '2px solid rgba(255, 255, 255, 0.4)', paddingBottom: 'var(--spacing-2)', overflowX: 'auto' }}>
        <button 
          onClick={() => setActiveTab('grading')}
          style={{ background: 'none', border: 'none', padding: '10px 20px', fontWeight: activeTab === 'grading' ? 'bold' : 'normal', cursor: 'pointer', color: activeTab === 'grading' ? 'var(--color-primary)' : 'var(--color-text-muted)', whiteSpace: 'nowrap' }}
        >
          Grading Review
        </button>
        <button 
          onClick={() => setActiveTab('security')}
          style={{ background: 'none', border: 'none', padding: '10px 20px', fontWeight: activeTab === 'security' ? 'bold' : 'normal', cursor: 'pointer', color: activeTab === 'security' ? 'var(--color-primary)' : 'var(--color-text-muted)', whiteSpace: 'nowrap' }}
        >
          Security Timeline
        </button>
      </div>

      {activeTab === 'grading' && questions.length > 0 && currentQ && (
        <div style={{ display: 'flex', gap: 'var(--spacing-6)' }}>
          {/* Main Grading Area */}
          <div style={{ flex: 2 }}>
            <Card style={{ marginBottom: 'var(--spacing-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-4)', borderBottom: '1px solid rgba(255,255,255,0.4)', paddingBottom: 'var(--spacing-4)' }}>
                <h3 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--color-text-main)' }}>Question {currentQuestionIndex + 1} <span style={{ fontSize: '1rem', color: 'var(--color-text-muted)' }}>of {questions.length}</span></h3>
                <span style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: isMarked ? 'rgba(16, 185, 129, 0.1)' : 'rgba(107, 114, 128, 0.1)', color: isMarked ? 'var(--color-success)' : 'var(--color-text-muted)', border: `1px solid ${isMarked ? 'rgba(16, 185, 129, 0.3)' : 'rgba(107, 114, 128, 0.3)'}` }}>
                  {isMarked ? 'MARKED' : 'UNMARKED'}
                </span>
              </div>

              <div style={{ marginBottom: 'var(--spacing-6)' }}>
                <p style={{ marginTop: 'var(--spacing-2)', fontSize: '1.1rem', lineHeight: '1.6' }}>{currentQ.question_text}</p>
                <div style={{ display: 'flex', gap: 'var(--spacing-3)', marginTop: 'var(--spacing-3)' }}>
                  <span style={{ fontSize: '0.75rem', padding: '4px 8px', background: 'rgba(255,255,255,0.5)', borderRadius: '4px', color: 'var(--color-text-muted)' }}>Type: {currentQ.question_type.toUpperCase()}</span>
                  <span style={{ fontSize: '0.75rem', padding: '4px 8px', background: 'rgba(255,255,255,0.5)', borderRadius: '4px', color: 'var(--color-primary)' }}>Max Marks: {currentQ.marks}</span>
                </div>
              </div>

              <div style={{ marginBottom: 'var(--spacing-6)', padding: 'var(--spacing-6)', background: 'rgba(255, 255, 255, 0.4)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255, 255, 255, 0.6)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                <strong style={{ display: 'block', marginBottom: 'var(--spacing-4)', color: 'var(--color-primary)', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.05em' }}>Student Answer</strong>
                
                {(!currentAns || (!currentAns.answer_text && !currentAns.audio_file)) ? (
                  <p style={{ fontStyle: 'italic', color: 'var(--color-text-muted)', margin: 0 }}>No answer submitted.</p>
                ) : (
                  <div>
                    {currentQ.question_type === 'text' && (
                      <div style={{ whiteSpace: 'pre-wrap', fontSize: '1rem', lineHeight: '1.6' }}>{currentAns.answer_text}</div>
                    )}
                    
                    {currentQ.question_type === 'audio' && (
                      <div>
                        {currentAns.audio_file && (
                          <div style={{ background: 'rgba(255,255,255,0.7)', padding: 'var(--spacing-3)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--spacing-4)' }}>
                            <audio controls src={currentAns.audio_file} style={{ width: '100%' }} />
                          </div>
                        )}
                        {currentAns.transcript_text && (
                          <div>
                            <strong style={{ display: 'block', marginBottom: 'var(--spacing-2)', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Transcript</strong>
                            <p style={{ margin: 0, padding: 'var(--spacing-4)', background: 'rgba(255,255,255,0.7)', borderRadius: 'var(--radius-md)', fontStyle: 'italic', lineHeight: '1.6' }}>"{currentAns.transcript_text}"</p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {currentQ.question_type === 'code' && (
                      <pre style={{ backgroundColor: '#1E293B', color: '#F8FAFC', padding: 'var(--spacing-4)', borderRadius: 'var(--radius-md)', overflowX: 'auto', fontFamily: '"Fira Code", monospace', fontSize: '0.9rem', lineHeight: '1.5' }}>
                        {currentAns.answer_text}
                      </pre>
                    )}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 'var(--spacing-4)', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <Input 
                    label={`Marks (0 - ${currentQ.marks})`} 
                    type="number" 
                    min="0" 
                    max={currentQ.marks} 
                    value={currentMarks} 
                    onChange={e => setCurrentMarks(e.target.value === '' ? '' : Number(e.target.value))} 
                  />
                  {gradingError && <span style={{ color: 'var(--color-danger)', fontSize: '12px' }}>{gradingError}</span>}
                  {gradingSuccess && <span style={{ color: 'var(--color-success)', fontSize: '12px' }}>{gradingSuccess}</span>}
                </div>
                <div style={{ flex: 2 }}>
                  <label className="input-label">Instructor Feedback</label>
                  <textarea 
                    className="input-field" 
                    style={{ width: '100%', minHeight: '80px' }}
                    value={currentFeedback}
                    onChange={e => setCurrentFeedback(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ marginTop: 'var(--spacing-4)', display: 'flex', justifyContent: 'flex-end' }}>
                <Button onClick={handleSaveMarks} disabled={savingMarks}>
                  {savingMarks ? 'Saving...' : 'Save Marks'}
                </Button>
              </div>
            </Card>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button 
                variant="secondary" 
                disabled={currentQuestionIndex === 0} 
                onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
              >
                ← Previous
              </Button>
              <Button 
                variant="secondary" 
                disabled={currentQuestionIndex === questions.length - 1} 
                onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
              >
                Next →
              </Button>
            </div>
          </div>

          {/* Right Sidebar */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
            <Card>
              <h3 style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--spacing-2)', marginBottom: 'var(--spacing-4)' }}>Grading Progress</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: 'var(--spacing-4)' }}>
                {questions.map((q, idx) => {
                  const a = answers.find(ans => ans.question === q.id);
                  const isMkd = a && a.marks_obtained !== null;
                  return (
                    <div 
                      key={q.id}
                      onClick={() => setCurrentQuestionIndex(idx)}
                      style={{ 
                        width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                        borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold',
                        backgroundColor: currentQuestionIndex === idx ? 'var(--color-primary)' : (isMkd ? 'var(--color-success)' : '#e2e8f0'),
                        color: (currentQuestionIndex === idx || isMkd) ? '#fff' : '#000',
                        border: currentQuestionIndex === idx ? '2px solid #000' : 'none'
                      }}
                    >
                      {idx + 1}
                    </div>
                  );
                })}
              </div>

              {attempt.status === 'evaluated' ? (
                <div style={{ backgroundColor: '#f0fdf4', padding: '12px', borderRadius: '4px', textAlign: 'center' }}>
                  <h4 style={{ margin: 0, color: 'var(--color-success)' }}>Final Score</h4>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '8px 0' }}>{attempt.total_score}</p>
                </div>
              ) : (
                <Button 
                  style={{ width: '100%' }} 
                  onClick={handleFinishGrading}
                >
                  Finish Grading
                </Button>
              )}
            </Card>

            <Card>
              <h4 style={{ marginBottom: 'var(--spacing-2)' }}>Question Evidence</h4>
              <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-3)' }}>
                Security events logged specifically during this question.
              </p>
              
              <div style={{ display: 'flex', gap: '16px', fontSize: '14px' }}>
                <div>📷 {qSnapshots.length} Snapshots</div>
                <div style={{ color: qViolations.length > 0 ? 'var(--color-danger)' : 'inherit' }}>
                  🚨 {qViolations.length} Violations
                </div>
              </div>
              
              {(qSnapshots.length > 0 || qViolations.length > 0) && (
                <Button variant="secondary" size="sm" style={{ marginTop: 'var(--spacing-3)', width: '100%' }} onClick={() => setActiveTab('security')}>
                  View in Timeline
                </Button>
              )}
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-6)' }}>
            <Card style={{ textAlign: 'center', padding: 'var(--spacing-4)', background: 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(255,255,255,0.4))' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--color-danger)' }}>{securityData.total_violations}</div>
              <p style={{ margin: 'var(--spacing-2) 0 0', color: 'var(--color-text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Total Violations</p>
            </Card>
            <Card style={{ textAlign: 'center', padding: 'var(--spacing-4)', background: 'linear-gradient(135deg, rgba(79,70,229,0.1), rgba(255,255,255,0.4))' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>{securityData.total_snapshots}</div>
              <p style={{ margin: 'var(--spacing-2) 0 0', color: 'var(--color-text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Total Snapshots</p>
            </Card>
            <Card style={{ textAlign: 'center', padding: 'var(--spacing-4)', background: `linear-gradient(135deg, ${getSeverityColor(securityData.highest_severity)}22, rgba(255,255,255,0.4))` }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: getSeverityColor(securityData.highest_severity) }}>{securityData.highest_severity || 'None'}</div>
              <p style={{ margin: 'var(--spacing-2) 0 0', color: 'var(--color-text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Highest Severity</p>
            </Card>
            <Card style={{ textAlign: 'center', padding: 'var(--spacing-4)', background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(255,255,255,0.4))' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--color-warning)' }}>{securityData.warning_count}</div>
              <p style={{ margin: 'var(--spacing-2) 0 0', color: 'var(--color-text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Warnings Issued</p>
            </Card>
          </div>

          <Card style={{ marginBottom: 'var(--spacing-6)' }}>
            <h3>Violation Breakdown</h3>
            <div style={{ display: 'flex', gap: 'var(--spacing-4)', flexWrap: 'wrap', marginTop: 'var(--spacing-4)' }}>
              {Object.entries(securityData.counts_by_type || {}).map(([type, count]) => (
                <div key={type} style={{ padding: '8px 12px', backgroundColor: '#f1f5f9', borderRadius: '4px', fontSize: '14px' }}>
                  <strong>{type}:</strong> {count}
                </div>
              ))}
              {Object.keys(securityData.counts_by_type || {}).length === 0 && <span style={{ color: 'var(--color-success)' }}>No violations recorded.</span>}
            </div>
          </Card>

          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)' }}>
              <h3>Security Timeline</h3>
              <select value={filter} onChange={e => setFilter(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
                <option value="All">All Events</option>
                <option value="Snapshots">Snapshots Only</option>
                <option value="CAMERA_OFF">Camera Off</option>
                <option value="MICROPHONE_OFF">Microphone Off</option>
                <option value="TAB_SWITCH">Tab Switches (Legacy)</option>
                <option value="TAB_HIDDEN">Tab Hidden</option>
                <option value="TAB_RETURNED">Tab Returned</option>
                <option value="WINDOW_BLUR">Window Blur</option>
                <option value="WINDOW_FOCUS">Window Focus</option>
                <option value="COPY_ATTEMPT">Copy Attempts</option>
                <option value="PASTE_ATTEMPT">Paste Attempts</option>
                <option value="FULLSCREEN_EXIT">Fullscreen Exits</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
              {timeline.length === 0 ? <p>No events match this filter.</p> : (
                timeline.map(item => (
                  <div key={`${item.itemType}_${item.id}`} style={{ padding: 'var(--spacing-4)', borderLeft: `4px solid ${item.itemType === 'snapshot' ? 'var(--color-primary)' : getSeverityColor(item.severity)}`, background: 'rgba(255,255,255,0.5)', borderRadius: 'var(--radius-md)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-3)' }}>
                      <strong style={{ display: 'flex', alignItems: 'center', gap: '8px', color: item.itemType === 'snapshot' ? 'var(--color-text-main)' : 'var(--color-danger)' }}>
                        {item.itemType === 'snapshot' ? '📸 Snapshot Taken' : `🚨 Violation: ${item.violation_type}`}
                      </strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', background: 'rgba(255,255,255,0.7)', padding: '2px 8px', borderRadius: '12px' }}>{new Date(item.time).toLocaleString()}</span>
                    </div>
                    
                    {item.itemType === 'snapshot' ? (
                      <div>
                        {item.question && <div style={{ fontSize: '0.85rem', marginBottom: 'var(--spacing-3)', color: 'var(--color-text-muted)' }}>Question {questions.find(q => q.id === item.question)?.order_number || item.question}</div>}
                        <img src={item.image_url} alt="Snapshot" style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: 'var(--radius-md)', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                      </div>
                    ) : (
                      <div>
                        {item.question && <div style={{ fontSize: '0.85rem', marginBottom: 'var(--spacing-2)', color: 'var(--color-text-muted)' }}>Question {questions.find(q => q.id === item.question)?.order_number || item.question}</div>}
                        <p style={{ fontSize: '0.95rem', color: 'var(--color-text-main)', margin: 'var(--spacing-2) 0' }}>{item.details || 'No details provided.'}</p>
                        <span style={{ display: 'inline-block', marginTop: 'var(--spacing-2)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: getSeverityColor(item.severity), color: 'white' }}>
                          Severity: {item.severity}
                        </span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
