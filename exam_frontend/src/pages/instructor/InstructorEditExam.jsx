import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Alert, LoadingOverlay } from '../../components/common/UIComponents';
import { examService } from '../../services/exams';
import { useParams, useNavigate } from 'react-router-dom';

export const InstructorEditExam = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('details');
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [pendingImportQuestions, setPendingImportQuestions] = useState([]);
  
  // Question form state
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [qForm, setQForm] = useState({ question_text: '', marks: 1, time_limit_seconds: 60, question_type: 'text', order_number: 1 });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [examData, questionsData] = await Promise.all([
        examService.getExamDetails(id),
        examService.getExamQuestions(id)
      ]);
      setExam(examData);
      const qList = questionsData.results !== undefined ? questionsData.results : questionsData;
      setQuestions(Array.isArray(qList) ? qList.sort((a,b) => a.order_number - b.order_number) : []);
    } catch (err) {
      console.error(err);
      alert('Failed to load exam data.');
    } finally {
      setLoading(false);
    }
  };

  const saveExamDetails = async () => {
    setSaving(true);
    try {
      const payload = {
        title: exam.title,
        description: exam.description,
        duration_minutes: exam.duration_minutes,
        settings: exam.settings
      };
      await examService.updateExam(id, payload);
      alert('Exam settings saved successfully.');
      loadData();
    } catch (err) {
      console.error(err);
      alert('Failed to save exam details/settings.');
    } finally {
      setSaving(false);
    }
  };


  const handleSettingsChange = (field, value) => {
    setExam(prev => ({
      ...prev,
      settings: {
        ...(prev.settings || {}),
        [field]: value
      }
    }));
  };

  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState('');
  const [pdfSuccess, setPdfSuccess] = useState('');

  const saveQuestion = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingQuestion) {
        await examService.updateQuestion(editingQuestion.id, { ...editingQuestion, exam: id });
      } else {
        await examService.createQuestion({ ...qForm, exam: id });
      }
      setEditingQuestion(null);
      // Reset form
      setQForm({ question_text: '', marks: 1, time_limit_seconds: 60, question_type: 'text', order_number: questions.length + (editingQuestion ? 0 : 2) });
      setShowForm(false);
      loadData();
    } catch (err) {
      alert('Failed to save question.');
    } finally {
      setSaving(false);
    }
  };

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
        setPdfError('Only PDF files are allowed.');
        return;
    }
    
    setUploadingPdf(true);
    setPdfError('');
    setPdfSuccess('');
    
    try {
      const extracted = await examService.extractPdf(file, id);
      if (!extracted.questions || extracted.questions.length === 0) {
          setPdfError('No questions could be extracted from this PDF.');
          setUploadingPdf(false);
          return;
      }
      
      const startOrder = questions.length > 0 ? Math.max(...questions.map(q => q.order_number)) + 1 : 1;
      
      const parsedQuestions = extracted.questions.map((q, i) => ({
          ...q,
          order_number: startOrder + i,
          question_type: q.question_type || 'text',
          marks: q.marks || 10,
          time_limit_seconds: q.time_limit || 60,
      }));
      
      setPendingImportQuestions(parsedQuestions);
      
      let successMsg = `Extracted ${parsedQuestions.length} questions. Please review them before saving.`;
      if (extracted.warnings && extracted.warnings.length > 0) {
        successMsg += ` (Note: ${extracted.warnings.join(', ')})`;
      }
      setPdfSuccess(successMsg);
      
    } catch (err) {
        setPdfError('Failed to extract questions. Please check the PDF format.');
    } finally {
        setUploadingPdf(false);
        e.target.value = null;
    }
  };

  const savePendingQuestions = async () => {
      setSaving(true);
      try {
          let added = 0;
          for (let i = 0; i < pendingImportQuestions.length; i++) {
              const q = pendingImportQuestions[i];
              await examService.createQuestion({
                  exam: id,
                  question_text: q.question_text,
                  question_type: q.question_type,
                  marks: q.marks,
                  order_number: q.order_number,
                  options: q.options || {},
                  correct_answer: q.correct_answer || '',
                  max_words: q.max_words || null,
                  time_limit_seconds: q.time_limit_seconds || 60
              });
              added++;
          }
          setPdfSuccess(`Successfully added ${added} questions!`);
          setPendingImportQuestions([]);
          loadData();
      } catch (err) {
          alert('Failed to save imported questions.');
      } finally {
          setSaving(false);
      }
  };

  const deleteQuestion = async (qId) => {
    if(window.confirm('Delete this question?')) {
      try {
        await examService.deleteQuestion(qId);
        loadData();
      } catch (err) {
        alert('Failed to delete.');
      }
    }
  };

  const moveQuestion = async (index, direction) => {
    if (
      (direction === -1 && index === 0) || 
      (direction === 1 && index === questions.length - 1)
    ) return;
    
    const newQuestions = [...questions];
    const temp = newQuestions[index];
    newQuestions[index] = newQuestions[index + direction];
    newQuestions[index + direction] = temp;
    
    // Update order numbers
    newQuestions.forEach((q, i) => { q.order_number = i + 1; });
    
    setQuestions(newQuestions);
    
    // Save to backend
    setSaving(true);
    try {
      await Promise.all(newQuestions.map(q => examService.updateQuestion(q.id, { order_number: q.order_number, exam: id })));
    } catch (err) {
      alert('Failed to reorder.');
      loadData();
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingOverlay message="Loading exam editor..." />;
  if (!exam) return <Alert type="error" message="Exam not found" />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)' }}>
        <h2>Edit Exam: {exam.title}</h2>
        <div>
          <Button variant="secondary" style={{ marginRight: 'var(--spacing-2)' }} onClick={() => window.open(`/student/exam/${exam.id}`, '_blank')}>
            Preview Exam
          </Button>
          <Button onClick={() => navigate('/instructor/exams')}>Back to List</Button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-6)', borderBottom: '1px solid var(--color-border)' }}>
        <button className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`} onClick={() => setActiveTab('details')}>Details</button>
        <button className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>Settings</button>
        <button className={`tab-btn ${activeTab === 'questions' ? 'active' : ''}`} onClick={() => setActiveTab('questions')}>Questions ({questions.length})</button>
      </div>

      {activeTab === 'details' && (
        <Card style={{ maxWidth: '600px' }}>
          <Input label="Title" value={exam.title} onChange={e => setExam({...exam, title: e.target.value})} />
          <Input label="Description" value={exam.description || ''} onChange={e => setExam({...exam, description: e.target.value})} />
          <Input label="Duration (Minutes)" type="number" value={exam.duration_minutes} onChange={e => setExam({...exam, duration_minutes: e.target.value})} />
          <Button onClick={saveExamDetails} disabled={saving}>{saving ? 'Saving...' : 'Save Details'}</Button>
        </Card>
      )}

      {activeTab === 'settings' && (
        <Card style={{ maxWidth: '600px' }}>
          <div style={{ marginBottom: 'var(--spacing-4)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
              <input type="checkbox" checked={exam.settings?.allow_resume || false} onChange={e => handleSettingsChange('allow_resume', e.target.checked)} />
              Allow students to resume exam if disconnected
            </label>
          </div>
          <div style={{ marginBottom: 'var(--spacing-4)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
              <input type="checkbox" checked={exam.settings?.allow_back_navigation || false} onChange={e => handleSettingsChange('allow_back_navigation', e.target.checked)} />
              Allow backward navigation to previous questions
            </label>
          </div>
          
          <h3 style={{ marginTop: 'var(--spacing-8)', marginBottom: 'var(--spacing-4)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--spacing-2)' }}>Proctoring & Security</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-4)' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={exam.settings?.camera_required || false} onChange={(e) => handleSettingsChange('camera_required', e.target.checked)} />
                Camera Required
              </label>
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={exam.settings?.microphone_required || false} onChange={(e) => handleSettingsChange('microphone_required', e.target.checked)} />
                Microphone Required
              </label>
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={exam.settings?.copy_protection || false} onChange={(e) => handleSettingsChange('copy_protection', e.target.checked)} />
                Disable Copy/Paste/Right-Click
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--spacing-4)', marginTop: 'var(--spacing-6)' }}>
            <div style={{ flex: 1 }}>
              <label className="input-label">Max Warnings (0 to disable)</label>
              <input type="number" className="input-field" style={{ width: '100%' }} value={exam.settings?.max_warnings ?? 5} onChange={(e) => handleSettingsChange('max_warnings', parseInt(e.target.value) || 0)} />
            </div>
            <div style={{ flex: 1 }}>
              <label className="input-label">Auto-Terminate Threshold (Optional)</label>
              <input type="number" className="input-field" style={{ width: '100%' }} value={exam.settings?.auto_terminate_threshold || ''} placeholder="Leave blank to disable" onChange={(e) => handleSettingsChange('auto_terminate_threshold', parseInt(e.target.value) || '')} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--spacing-4)', marginTop: 'var(--spacing-6)', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label className="input-label">Snapshot Mode</label>
              <select className="input-field" style={{ width: '100%' }} value={exam.settings?.snapshot_mode || 'every_question'} onChange={(e) => handleSettingsChange('snapshot_mode', e.target.value)}>
                <option value="every_question">Every Question</option>
                <option value="every_n_questions">Every N Questions</option>
                <option value="random">Random Questions</option>
                <option value="custom">Custom Questions</option>
              </select>
            </div>
            {exam.settings?.snapshot_mode === 'every_n_questions' && (
              <div style={{ flex: 1, minWidth: '200px' }}>
                <label className="input-label">N Questions Interval (e.g. 5 = Q5, Q10...)</label>
                <input type="number" className="input-field" style={{ width: '100%' }} value={exam.settings?.snapshot_interval || 5} onChange={(e) => handleSettingsChange('snapshot_interval', parseInt(e.target.value) || 5)} />
              </div>
            )}
            {exam.settings?.snapshot_mode === 'random' && (
              <div style={{ flex: 1, minWidth: '200px' }}>
                <label className="input-label">Random Snapshot Count (e.g. 5)</label>
                <input type="number" className="input-field" style={{ width: '100%' }} value={exam.settings?.snapshot_interval || 5} onChange={(e) => handleSettingsChange('snapshot_interval', parseInt(e.target.value) || 5)} />
              </div>
            )}
            {exam.settings?.snapshot_mode === 'custom' && (
              <div style={{ flex: 1, minWidth: '200px' }}>
                <label className="input-label">Custom Question Numbers (comma-separated, e.g. 2, 7, 15)</label>
                <input type="text" className="input-field" style={{ width: '100%' }} placeholder="2, 7, 15" value={exam.settings?.snapshot_custom_questions || ''} onChange={(e) => handleSettingsChange('snapshot_custom_questions', e.target.value)} />
              </div>
            )}
          </div>


          <div style={{ marginTop: 'var(--spacing-6)' }}>
            <Button onClick={saveExamDetails} disabled={saving}>{saving ? 'Saving...' : 'Save Settings'}</Button>
          </div>
        </Card>
      )}

      {activeTab === 'questions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
          {pdfError && <Alert type="error" message={pdfError} />}
          {pdfSuccess && <Alert type="success" message={pdfSuccess} />}
          
          <div style={{ padding: 'var(--spacing-4)', backgroundColor: 'var(--color-bg-alt)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                  <h4 style={{ marginBottom: 'var(--spacing-2)' }}>Add Questions via PDF</h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', margin: 0 }}>
                      Upload a PDF document. Our AI will extract the questions and append them automatically.
                  </p>
              </div>
              <input 
                  type="file" 
                  accept="application/pdf"
                  id="pdf-upload"
                  style={{ display: 'none' }}
                  onChange={handlePdfUpload}
                  disabled={uploadingPdf}
              />
              <Button 
                  onClick={() => document.getElementById('pdf-upload').click()} 
                  disabled={uploadingPdf}
              >
                  {uploadingPdf ? 'Extracting & Saving...' : 'Upload PDF'}
              </Button>
          </div>

          {pendingImportQuestions.length > 0 && (
            <div style={{ padding: 'var(--spacing-4)', backgroundColor: 'var(--color-warning-light)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--spacing-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-4)' }}>
                <h3>Review Extracted Questions</h3>
                <div>
                  <Button onClick={() => setPendingImportQuestions([])} variant="secondary" style={{ marginRight: '8px' }}>Cancel</Button>
                  <Button onClick={savePendingQuestions} disabled={saving}>{saving ? 'Saving...' : 'Save All to Exam'}</Button>
                </div>
              </div>
              {pendingImportQuestions.map((q, index) => (
                <Card key={index} style={{ marginBottom: 'var(--spacing-2)' }}>
                  <div style={{ display: 'flex', gap: 'var(--spacing-4)' }}>
                    <div style={{ flex: 1 }}>
                      <label className="input-label">Question Text</label>
                      <textarea className="input-field" style={{ width: '100%', minHeight: '60px' }} value={q.question_text} onChange={(e) => {
                          const updated = [...pendingImportQuestions];
                          updated[index].question_text = e.target.value;
                          setPendingImportQuestions(updated);
                      }} />
                    </div>
                    <div style={{ width: '180px' }}>
                      <label className="input-label">Type</label>
                      <select className="input-field" style={{ width: '100%', marginBottom: '4px' }} value={q.question_type} onChange={(e) => {
                          const updated = [...pendingImportQuestions];
                          updated[index].question_type = e.target.value;
                          setPendingImportQuestions(updated);
                      }}>
                        <option value="text">Text</option>
                        <option value="audio">Audio</option>
                        <option value="code">Code</option>
                      </select>
                      {q.confidence_reason && <small style={{ color: 'var(--color-primary)', display: 'block', fontSize: '0.75rem', lineHeight: '1' }}>Detected: {q.confidence_reason}</small>}
                    </div>
                    <div style={{ width: '80px' }}>
                      <label className="input-label">Marks</label>
                      <input type="number" className="input-field" style={{ width: '100%' }} value={q.marks} onChange={(e) => {
                          const updated = [...pendingImportQuestions];
                          updated[index].marks = parseInt(e.target.value) || 0;
                          setPendingImportQuestions(updated);
                      }} />
                    </div>
                    <div style={{ width: '100px' }}>
                      <label className="input-label">Time (s)</label>
                      <input type="number" className="input-field" style={{ width: '100%' }} value={q.time_limit_seconds || ''} onChange={(e) => {
                          const updated = [...pendingImportQuestions];
                          updated[index].time_limit_seconds = parseInt(e.target.value) || null;
                          setPendingImportQuestions(updated);
                      }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <Button variant="danger" onClick={() => {
                        const updated = [...pendingImportQuestions];
                        updated.splice(index, 1);
                        setPendingImportQuestions(updated);
                      }}>Del</Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
            {/* Question List */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-4)' }}>
                <h3>Question List</h3>
                <Button onClick={() => { setEditingQuestion(null); setShowForm(true); window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); }}>+ Add Question</Button>
              </div>
              {questions.length === 0 ? <p>No questions added yet.</p> : (
                questions.map((q, index) => (
                  <Card key={q.id} style={{ marginBottom: 'var(--spacing-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong>Q{q.order_number}:</strong> {q.question_text.substring(0, 50)}...
                      <br/>
                      <small style={{ color: 'var(--color-text-muted)' }}>Type: {q.question_type} | Marks: {q.marks} | Time Limit: {q.time_limit_seconds}s</small>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                      <button onClick={() => moveQuestion(index, -1)} disabled={index === 0}>↑</button>
                      <button onClick={() => moveQuestion(index, 1)} disabled={index === questions.length - 1}>↓</button>
                      <Button onClick={() => { setEditingQuestion(q); setQForm({ question_text: q.question_text, marks: q.marks, time_limit_seconds: q.time_limit_seconds, question_type: q.question_type, order_number: q.order_number }); setShowForm(true); window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); }}>Edit</Button>
                      <Button variant="danger" onClick={() => deleteQuestion(q.id)}>Del</Button>
                    </div>
                  </Card>
                ))
              )}
            </div>

          {/* Question Form */}
          {showForm && (
          <Card style={{ flex: 1, height: 'fit-content', border: '2px solid var(--color-primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>{editingQuestion ? 'Edit Question' : 'Add New Question'}</h3>
                <button style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--color-text-muted)' }} onClick={() => setShowForm(false)}>&times;</button>
            </div>
            <form onSubmit={saveQuestion}>
              
              {editingQuestion ? (
                <>
                  <div style={{ marginBottom: 'var(--spacing-4)' }}>
                    <label className="input-label">Question Type</label>
                    <select className="input-field" style={{ width: '100%' }} value={editingQuestion.question_type} onChange={e => setEditingQuestion({...editingQuestion, question_type: e.target.value})}>
                      <option value="text">Text (Essay/Short Answer)</option>
                      <option value="audio">Audio Response</option>
                      <option value="code">Code Editor</option>
                    </select>
                  </div>
                  <Input label="Question Text" value={editingQuestion.question_text} onChange={e => setEditingQuestion({...editingQuestion, question_text: e.target.value})} required />
                  <div style={{ display: 'flex', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-4)' }}>
                    <div style={{ flex: 1 }}>
                      <Input label="Marks" type="number" value={editingQuestion.marks || ''} onChange={(e) => setEditingQuestion({ ...editingQuestion, marks: parseInt(e.target.value) || 0 })} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <Input label="Time Limit (sec, optional)" type="number" value={editingQuestion.time_limit_seconds || ''} onChange={(e) => setEditingQuestion({ ...editingQuestion, time_limit_seconds: parseInt(e.target.value) || '' })} />
                    </div>
                  </div>

                  {editingQuestion.question_type === 'text' && (
                    <div style={{ marginBottom: 'var(--spacing-4)' }}>
                      <Input label="Max Words (optional)" type="number" value={editingQuestion.max_words || ''} onChange={(e) => setEditingQuestion({ ...editingQuestion, max_words: parseInt(e.target.value) || '' })} />
                    </div>
                  )}

                  {editingQuestion.question_type === 'audio' && (
                    <div style={{ display: 'flex', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-4)' }}>
                      <div style={{ flex: 1 }}>
                        <Input label="Max Recording Time (sec, optional)" type="number" value={editingQuestion.max_recording_seconds || ''} onChange={(e) => setEditingQuestion({ ...editingQuestion, max_recording_seconds: parseInt(e.target.value) || '' })} />
                      </div>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', paddingBottom: '10px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={editingQuestion.transcript_enabled !== false} onChange={(e) => setEditingQuestion({ ...editingQuestion, transcript_enabled: e.target.checked })} />
                          Enable Transcript Input
                        </label>
                      </div>
                    </div>
                  )}

                  {editingQuestion.question_type === 'code' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-4)' }}>
                      <div>
                        <label className="input-label">Programming Language</label>
                        <select className="input-field" style={{ width: '100%' }} value={editingQuestion.programming_language || ''} onChange={(e) => setEditingQuestion({ ...editingQuestion, programming_language: e.target.value })}>
                          <option value="">Any Language (Student Choice)</option>
                          <option value="python">Python</option>
                          <option value="java">Java</option>
                          <option value="javascript">JavaScript</option>
                          <option value="c">C</option>
                          <option value="cpp">C++</option>
                          <option value="csharp">C#</option>
                          <option value="php">PHP</option>
                        </select>
                      </div>
                      <div>
                        <label className="input-label">Starter Code (optional)</label>
                        <textarea 
                          className="input-field" 
                          style={{ width: '100%', minHeight: '120px', fontFamily: 'monospace' }}
                          value={editingQuestion.starter_code || ''}
                          onChange={(e) => setEditingQuestion({ ...editingQuestion, starter_code: e.target.value })}
                          placeholder="def my_function():\n    pass"
                        />
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div style={{ marginBottom: 'var(--spacing-4)' }}>
                    <label className="input-label">Question Type</label>
                    <select className="input-field" style={{ width: '100%' }} value={qForm.question_type} onChange={e => setQForm({...qForm, question_type: e.target.value})}>
                      <option value="text">Text (Essay/Short Answer)</option>
                      <option value="audio">Audio Response</option>
                      <option value="code">Code Editor</option>
                    </select>
                  </div>

                  <Input label="Question Text" value={qForm.question_text} onChange={e => setQForm({...qForm, question_text: e.target.value})} required />
                  
                  <div style={{ display: 'flex', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-4)' }}>
                    <div style={{ flex: 1 }}>
                      <Input label="Marks" type="number" value={qForm.marks} onChange={e => setQForm({...qForm, marks: e.target.value})} required />
                    </div>
                    <div style={{ flex: 1 }}>
                      <Input label="Time Limit (Seconds)" type="number" value={qForm.time_limit_seconds} onChange={e => setQForm({...qForm, time_limit_seconds: e.target.value})} required />
                    </div>
                  </div>

                  {qForm.question_type === 'text' && (
                    <div style={{ marginBottom: 'var(--spacing-4)' }}>
                      <Input label="Max Words (optional)" type="number" value={qForm.max_words || ''} onChange={(e) => setQForm({ ...qForm, max_words: parseInt(e.target.value) || '' })} />
                    </div>
                  )}

                  {qForm.question_type === 'audio' && (
                    <div style={{ display: 'flex', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-4)' }}>
                      <div style={{ flex: 1 }}>
                        <Input label="Max Recording Time (sec, optional)" type="number" value={qForm.max_recording_seconds || ''} onChange={(e) => setQForm({ ...qForm, max_recording_seconds: parseInt(e.target.value) || '' })} />
                      </div>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', paddingBottom: '10px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={qForm.transcript_enabled !== false} onChange={(e) => setQForm({ ...qForm, transcript_enabled: e.target.checked })} />
                          Enable Transcript Input
                        </label>
                      </div>
                    </div>
                  )}

                  {qForm.question_type === 'code' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-4)' }}>
                      <div>
                        <label className="input-label">Programming Language</label>
                        <select className="input-field" style={{ width: '100%' }} value={qForm.programming_language || ''} onChange={(e) => setQForm({ ...qForm, programming_language: e.target.value })}>
                          <option value="">Any Language (Student Choice)</option>
                          <option value="python">Python</option>
                          <option value="java">Java</option>
                          <option value="javascript">JavaScript</option>
                          <option value="c">C</option>
                          <option value="cpp">C++</option>
                          <option value="csharp">C#</option>
                          <option value="php">PHP</option>
                        </select>
                      </div>
                      <div>
                        <label className="input-label">Starter Code (optional)</label>
                        <textarea 
                          className="input-field" 
                          style={{ width: '100%', minHeight: '120px', fontFamily: 'monospace' }}
                          value={qForm.starter_code || ''}
                          onChange={(e) => setQForm({ ...qForm, starter_code: e.target.value })}
                          placeholder="def my_function():\n    pass"
                        />
                      </div>
                    </div>
                  )}
                  
                  <Input label="Order Number" type="number" value={qForm.order_number} onChange={e => setQForm({...qForm, order_number: e.target.value})} required />
                </>
              )}
              
              <div style={{ display: 'flex', gap: 'var(--spacing-2)', marginTop: 'var(--spacing-4)' }}>
                <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Question'}</Button>
                <Button type="button" variant="secondary" onClick={() => { setEditingQuestion(null); setShowForm(false); }}>Cancel</Button>
              </div>
            </form>
          </Card>
          )}
          </div>
        </div>
      )}
      <style dangerouslySetInnerHTML={{__html: `
        .tab-btn { background: none; border: none; padding: 10px 20px; font-weight: bold; cursor: pointer; color: var(--color-text-muted); }
        .tab-btn.active { color: var(--color-primary); border-bottom: 2px solid var(--color-primary); }
        .tab-btn:hover { color: var(--color-primary); }
      `}} />
    </div>
  );
};
