import React, { useState, useRef, useEffect } from 'react';
import { Card, Button, Input, Alert, LoadingOverlay } from '../../components/common/UIComponents';
import { examService } from '../../services/exams';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

export const InstructorImportExam = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [courses, setCourses] = useState([]);
  const [file, setFile] = useState(null);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [error, setError] = useState('');
  const [warnings, setWarnings] = useState([]);
  
  const [extractionResult, setExtractionResult] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [forceImport, setForceImport] = useState(false);
  const [step, setStep] = useState('upload'); // upload, review, preview, success
  const [successData, setSuccessData] = useState(null);

  // Load courses
  useEffect(() => {
    const loadCourses = async () => {
      try {
        const res = await api.get('/courses/?instructor=me');
        setCourses(res.data.results || res.data);
      } catch (err) {
        console.error("Could not load courses", err);
      }
    };
    loadCourses();
  }, []);

  // Autosave Draft
  useEffect(() => {
    if (extractionResult && step !== 'success') {
      localStorage.setItem('exam_import_draft', JSON.stringify({ extractionResult, selectedCourse }));
    }
  }, [extractionResult, selectedCourse, step]);

  // Load Draft
  useEffect(() => {
    const draft = localStorage.getItem('exam_import_draft');
    if (draft && step === 'upload') {
      try {
        const parsed = JSON.parse(draft);
        if (parsed.extractionResult) {
          if (window.confirm("You have an unsaved exam import draft. Do you want to resume?")) {
            setExtractionResult(parsed.extractionResult);
            setSelectedCourse(parsed.selectedCourse || '');
            setStep('review');
          } else {
            localStorage.removeItem('exam_import_draft');
          }
        }
      } catch (e) {
        localStorage.removeItem('exam_import_draft');
      }
    }
  }, [step]);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      if (selected.type !== 'application/pdf') {
        setError('Only PDF files are supported.');
        setFile(null);
      } else if (selected.size > 10 * 1024 * 1024) {
        setError('File exceeds 10MB limit.');
        setFile(null);
      } else {
        setError('');
        setFile(selected);
      }
    }
  };

  const handleExtract = async () => {
    if (!file) return;
    setLoadingMsg('Extracting Questions using AI...');
    setError('');
    try {
      const result = await examService.extractPdf(file);
      // Append original filename
      result.metadata.original_filename = file.name;
      setExtractionResult(result);
      setStep('review');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to process PDF.');
    } finally {
      setLoadingMsg('');
    }
  };

  const handleImport = async () => {
    if (!selectedCourse) {
      setError("Please select a course to import into.");
      return;
    }
    
    setError('');
    setWarnings([]);
    setLoadingMsg('Validating...');
    
    try {
      const payload = {
        course_id: selectedCourse,
        title: extractionResult.metadata.exam_title,
        description: `Imported via PDF Extraction on ${new Date().toLocaleDateString()}`,
        duration_minutes: Math.round((extractionResult.metadata.estimated_duration_seconds || 3600) / 60),
        metadata: {
            original_filename: extractionResult.metadata.original_filename
        },
        questions: extractionResult.questions,
        force_import: forceImport
      };

      setLoadingMsg('Creating Exam and Questions...');
      const res = await examService.importExam(payload);
      
      localStorage.removeItem('exam_import_draft');
      setSuccessData({
        id: res.exam_id,
        title: payload.title,
        questions: payload.questions.length,
        duration: payload.duration_minutes
      });
      setStep('success');

    } catch (err) {
      if (err.response?.status === 409) {
        setWarnings(err.response.data.warnings || ['Duplicate detected.']);
        setForceImport(true);
      } else if (err.response?.status === 400 && err.response.data.errors) {
        setError(err.response.data.errors);
      } else {
        setError(['An unexpected error occurred during import.']);
      }
    } finally {
      setLoadingMsg('');
    }
  };

  if (loadingMsg) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <LoadingOverlay message={loadingMsg} />
      </div>
    );
  }

  if (step === 'success') {
    return (
      <Card style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center', padding: 'var(--spacing-8)' }}>
        <h1 style={{ color: 'var(--color-success)', marginBottom: 'var(--spacing-4)' }}>Exam Imported Successfully!</h1>
        <div style={{ fontSize: '64px', marginBottom: 'var(--spacing-4)' }}>🎉</div>
        
        <div style={{ textAlign: 'left', backgroundColor: 'var(--color-bg-main)', padding: 'var(--spacing-4)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--spacing-6)' }}>
          <p><strong>Exam ID:</strong> {successData.id}</p>
          <p><strong>Title:</strong> {successData.title}</p>
          <p><strong>Questions Imported:</strong> {successData.questions}</p>
          <p><strong>Total Duration:</strong> {successData.duration} minutes</p>
          <p><strong>Import Date:</strong> {new Date().toLocaleString()}</p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--spacing-4)', justifyContent: 'center' }}>
          <Button onClick={() => window.open(`/student/exam/${successData.id}`, '_blank')}>View Exam (Student View)</Button>
          <Button onClick={() => navigate(`/instructor/edit/${successData.id}`)}>Edit Exam Settings</Button>
          <Button variant="secondary" onClick={() => navigate('/instructor/exams')}>Return to Dashboard</Button>
        </div>
      </Card>
    );
  }

  if (step === 'preview') {
    const { metadata, questions } = extractionResult;
    return (
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: 'var(--spacing-4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-6)' }}>
          <h2>Preview: {metadata.exam_title}</h2>
          <Button variant="secondary" onClick={() => setStep('review')}>Back to Review</Button>
        </div>
        
        <Alert type="info" message="This is a preview of how students will see the questions. The exam is NOT yet saved." style={{ marginBottom: 'var(--spacing-6)' }} />
        
        {questions.map((q, i) => (
          <Card key={i} style={{ marginBottom: 'var(--spacing-4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-4)' }}>
              <strong>Question {q.question_number}</strong>
              <span style={{ color: 'var(--color-text-muted)' }}>{q.marks} Marks | {q.time_limit || 'No Time Limit'}</span>
            </div>
            <p style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--spacing-6)' }}>{q.question_text}</p>
            {q.question_type === 'text' && <textarea disabled placeholder="Student answer area..." style={{ width: '100%', minHeight: '100px', padding: 'var(--spacing-2)' }} />}
          </Card>
        ))}

        <div style={{ textAlign: 'center', marginTop: 'var(--spacing-8)' }}>
          <Button onClick={() => setStep('review')} style={{ fontSize: 'var(--font-size-xl)' }}>Looks Good - Return to Import</Button>
        </div>
      </div>
    );
  }

  if (step === 'review' && extractionResult) {
    const { metadata, statistics, questions, warnings: initialWarnings } = extractionResult;
    const totalCalcMarks = questions.reduce((sum, q) => sum + (parseInt(q.marks) || 0), 0);
    
    return (
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <Alert type="warning" message="Review the extracted questions. They have NOT been saved to the database yet." style={{ marginBottom: 'var(--spacing-6)' }} />
        
        {error && error.length > 0 && (
          <Alert type="error" message={
            <div>
              <strong>Import Validation Errors:</strong>
              <ul style={{ margin: '8px 0 0 20px' }}>
                {Array.isArray(error) ? error.map((e, idx) => <li key={idx}>{e}</li>) : <li>{error}</li>}
              </ul>
            </div>
          } style={{ marginBottom: 'var(--spacing-4)' }} />
        )}
        {warnings.length > 0 && (
          <Alert type="warning" message={`Duplicate Warning: ${warnings.join(' ')} Click Import again to force override.`} style={{ marginBottom: 'var(--spacing-4)' }} />
        )}
        
        {initialWarnings && initialWarnings.length > 0 && (
          <Alert type="info" message={`Extraction Notes: ${initialWarnings.join(', ')}`} style={{ marginBottom: 'var(--spacing-4)' }} />
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-6)' }}>
          <Card>
            <h3 style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--spacing-2)', marginBottom: 'var(--spacing-4)' }}>Exam Details</h3>
            <Input label="Exam Title" value={metadata.exam_title} onChange={(e) => setExtractionResult({...extractionResult, metadata: {...metadata, exam_title: e.target.value}})} />
            <Input label="Estimated Duration (Minutes)" type="number" value={Math.round(metadata.estimated_duration_seconds / 60)} onChange={(e) => setExtractionResult({...extractionResult, metadata: {...metadata, estimated_duration_seconds: parseInt(e.target.value) * 60}})} />
            <div style={{ marginTop: 'var(--spacing-4)' }}>
              <label className="input-label">Select Course</label>
              <select className="input-field" style={{ width: '100%' }} value={selectedCourse} onChange={(e) => { setSelectedCourse(e.target.value); setForceImport(false); setWarnings([]); }}>
                <option value="">-- Choose Course --</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
          </Card>
          
          <Card>
            <h3 style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--spacing-2)', marginBottom: 'var(--spacing-4)' }}>Import Summary</h3>
            <p><strong>Total Questions:</strong> {questions.length}</p>
            <p><strong>Calculated Total Marks:</strong> {totalCalcMarks}</p>
            <p><strong>Average Extraction Confidence:</strong> <span style={{ color: statistics.average_confidence === 'High' ? 'var(--color-success)' : statistics.average_confidence === 'Medium' ? 'var(--color-warning)' : 'var(--color-danger)' }}>{statistics.average_confidence}</span></p>
            <p><strong>Low Confidence Count:</strong> {statistics.low_confidence_count}</p>
            <p style={{ marginTop: 'var(--spacing-4)' }}><strong>Source File:</strong> {metadata.original_filename || 'Unknown'}</p>
          </Card>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-4)' }}>
          <h3>Review Extracted Questions</h3>
          <Button variant="secondary" onClick={() => {
            const newQ = { question_number: questions.length + 1, question_text: 'New Question', marks: 1, time_limit: '', question_type: 'text', confidence: 'Manual' };
            setExtractionResult({...extractionResult, questions: [...questions, newQ]});
          }}>+ Add Manual Question</Button>
        </div>
        
        {questions.length === 0 ? (
          <Alert type="error" message="No questions were detected in this PDF." />
        ) : (
          questions.map((q, i) => (
            <Card key={i} style={{ marginBottom: 'var(--spacing-4)', border: q.confidence === 'Low' ? '2px solid var(--color-danger)' : '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)' }}>
                  <Input type="number" label="Q #" value={q.question_number} onChange={(e) => {
                    const nq = [...questions]; nq[i].question_number = parseInt(e.target.value);
                    setExtractionResult({...extractionResult, questions: nq});
                  }} style={{ width: '80px' }} />
                  <div style={{ 
                    padding: '4px 8px', 
                    borderRadius: '12px', 
                    fontSize: 'var(--font-size-sm)',
                    backgroundColor: q.confidence === 'High' ? '#D1FAE5' : q.confidence === 'Medium' || q.confidence === 'Manual' ? '#FEF3C7' : '#FEE2E2',
                    color: q.confidence === 'High' ? '#065F46' : q.confidence === 'Medium' || q.confidence === 'Manual' ? '#92400E' : '#991B1B'
                  }}>
                    {q.confidence} Confidence
                  </div>
                </div>
                <Button variant="danger" onClick={() => {
                  const nq = [...questions]; nq.splice(i, 1);
                  setExtractionResult({...extractionResult, questions: nq});
                }}>Remove</Button>
              </div>
              
              {q.warnings && q.warnings.length > 0 && (
                <div style={{ color: 'var(--color-danger)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--spacing-4)' }}>
                  ⚠️ {q.warnings.join(', ')}
                </div>
              )}
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                <div>
                  <label className="input-label">Question Text</label>
                  <textarea 
                    style={{ width: '100%', padding: 'var(--spacing-2)', minHeight: '80px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                    value={q.question_text}
                    onChange={(e) => {
                      const nq = [...questions]; nq[i].question_text = e.target.value;
                      setExtractionResult({...extractionResult, questions: nq});
                    }}
                  />
                </div>
                
                <div style={{ display: 'flex', gap: 'var(--spacing-4)' }}>
                  <Input 
                    label="Marks" 
                    type="number" 
                    value={q.marks || ''} 
                    onChange={(e) => {
                      const nq = [...questions]; nq[i].marks = parseInt(e.target.value) || 0;
                      setExtractionResult({...extractionResult, questions: nq});
                    }} 
                  />
                  <Input 
                    label="Time Limit (seconds)" 
                    type="number" 
                    value={q.time_limit || ''} 
                    onChange={(e) => {
                      const nq = [...questions]; nq[i].time_limit = parseInt(e.target.value) || '';
                      setExtractionResult({...extractionResult, questions: nq});
                    }} 
                  />
                  <div style={{ flex: 1 }}>
                    <label className="input-label">Type</label>
                    <select 
                      className="input-field" 
                      style={{ width: '100%' }}
                      value={q.question_type}
                      onChange={(e) => {
                        const nq = [...questions]; nq[i].question_type = e.target.value;
                        setExtractionResult({...extractionResult, questions: nq});
                      }}
                    >
                      <option value="text">Text</option>
                      <option value="code">Code</option>
                      <option value="audio">Audio</option>
                    </select>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
        
        <div style={{ display: 'flex', gap: 'var(--spacing-4)', marginTop: 'var(--spacing-8)', justifyContent: 'flex-end', paddingBottom: 'var(--spacing-8)' }}>
          <Button variant="secondary" onClick={() => {
            if(window.confirm('Discard all extracted questions and return to upload?')) {
              localStorage.removeItem('exam_import_draft');
              setExtractionResult(null);
              setStep('upload');
            }
          }}>Discard Import</Button>
          
          <Button variant="secondary" onClick={() => setStep('preview')}>Preview Final Exam</Button>
          
          <Button 
            onClick={() => {
              if (window.confirm("Are you sure you want to import this exam into the LMS?")) {
                handleImport();
              }
            }}
          >
            {forceImport ? 'Confirm & Override Import' : 'Import Exam'}
          </Button>
        </div>
      </div>
    );
  }

  // Upload Step
  return (
    <Card style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center', padding: 'var(--spacing-8)' }}>
      <h2>Import Exam via PDF</h2>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-6)' }}>
        Upload a PDF of your exam. Our AI will automatically extract questions, marks, and formatting.
      </p>
      
      {error && <Alert type="error" message={error} style={{ marginBottom: 'var(--spacing-4)' }} />}
      
      <div 
        style={{ 
          border: '2px dashed var(--color-border)', 
          borderRadius: 'var(--radius-lg)', 
          padding: 'var(--spacing-8)',
          backgroundColor: '#FAFAFA',
          marginBottom: 'var(--spacing-6)',
          cursor: 'pointer'
        }}
        onClick={() => fileInputRef.current.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          accept="application/pdf"
          onChange={handleFileChange}
        />
        <div style={{ fontSize: '48px', marginBottom: 'var(--spacing-2)' }}>📄</div>
        {file ? (
          <div><strong>Selected:</strong> {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</div>
        ) : (
          <div>Click to browse or drag PDF file here</div>
        )}
      </div>
      
      <Button 
        onClick={handleExtract} 
        disabled={!file} 
        style={{ width: '100%', fontSize: 'var(--font-size-lg)' }}
      >
        Extract Questions
      </Button>
    </Card>
  );
};
