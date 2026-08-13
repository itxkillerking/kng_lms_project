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
  
  // Question form state
  const [editingQuestion, setEditingQuestion] = useState(null);
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
      setQuestions(questionsData.sort((a,b) => a.order_number - b.order_number));
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
      await examService.updateExam(id, exam);
      alert('Exam details saved successfully.');
    } catch (err) {
      alert('Failed to save exam details.');
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

  const saveQuestion = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingQuestion) {
        await examService.updateQuestion(editingQuestion.id, { ...qForm, exam: id });
      } else {
        await examService.createQuestion({ ...qForm, exam: id });
      }
      setEditingQuestion(null);
      loadData();
    } catch (err) {
      alert('Failed to save question.');
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

          <div style={{ display: 'flex', gap: 'var(--spacing-4)', marginTop: 'var(--spacing-6)' }}>
            <div style={{ flex: 1 }}>
              <label className="input-label">Snapshot Mode</label>
              <select className="input-field" style={{ width: '100%' }} value={exam.settings?.snapshot_mode || 'every_question'} onChange={(e) => handleSettingsChange('snapshot_mode', e.target.value)}>
                <option value="every_question">Every Question (on load)</option>
                <option value="every_n_questions">Timer Based Interval</option>
              </select>
            </div>
            {exam.settings?.snapshot_mode === 'every_n_questions' && (
              <div style={{ flex: 1 }}>
                <label className="input-label">Snapshot Interval (seconds)</label>
                <input type="number" className="input-field" style={{ width: '100%' }} value={exam.settings?.snapshot_interval || 60} onChange={(e) => handleSettingsChange('snapshot_interval', parseInt(e.target.value) || 60)} />
              </div>
            )}
          </div>

          <div style={{ marginTop: 'var(--spacing-6)' }}>
            <Button onClick={saveExamDetails} disabled={saving}>{saving ? 'Saving...' : 'Save Settings'}</Button>
          </div>
        </Card>
      )}

      {activeTab === 'questions' && (
        <div style={{ display: 'flex', gap: 'var(--spacing-6)' }}>
          {/* Question List */}
          <div style={{ flex: 1 }}>
            <h3>Question List</h3>
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
                    <Button onClick={() => { setEditingQuestion(q); setQForm({ question_text: q.question_text, marks: q.marks, time_limit_seconds: q.time_limit_seconds, question_type: q.question_type, order_number: q.order_number }); }}>Edit</Button>
                    <Button variant="danger" onClick={() => deleteQuestion(q.id)}>Del</Button>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Question Form */}
          <Card style={{ flex: 1, height: 'fit-content' }}>
            <h3>{editingQuestion ? 'Edit Question' : 'Add New Question'}</h3>
            <form onSubmit={saveQuestion}>
              <div style={{ marginBottom: 'var(--spacing-4)' }}>
                <label className="input-label">Question Type</label>
                <select className="input-field" style={{ width: '100%' }} value={qForm.question_type} onChange={e => setQForm({...qForm, question_type: e.target.value})}>
                  <option value="text">Text (Essay/Short Answer)</option>
                  <option value="audio">Audio Response</option>
                  <option value="code">Code Editor</option>
                </select>
              </div>
              
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
                {editingQuestion && <Button variant="secondary" onClick={() => { setEditingQuestion(null); }}>Cancel</Button>}
              </div>
            </form>
          </Card>
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
