import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Alert } from '../../components/common/UIComponents';
import { examService } from '../../services/exams';
import api from '../../services/api';
import { useNavigate, useParams } from 'react-router-dom';

export const InstructorCreateExam = () => {
  const [formData, setFormData] = useState({ title: '', description: '', duration_minutes: 60, course_id: '' });
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get('/courses/?instructor=me');
        const courseData = res.data.results !== undefined ? res.data.results : res.data;
        const coursesArray = Array.isArray(courseData) ? courseData : [];
        setCourses(coursesArray);
        if (coursesArray.length > 0) {
            setFormData(prev => ({...prev, course_id: coursesArray[0].id}));
        }
      } catch (err) {
        console.error('Failed to fetch courses', err);
      }
    };
    fetchCourses();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.course_id) {
        setError('You must select a course. Create a course first if you have none.');
        return;
    }
    setLoading(true);
    setError('');
    try {
      await examService.createExam({
        title: formData.title,
        description: formData.description,
        duration_minutes: parseInt(formData.duration_minutes),
        course: parseInt(formData.course_id)
      });
      navigate('/instructor/exams');
    } catch (err) {
      if (err.response && err.response.data) {
        setError('Failed to create exam: ' + JSON.stringify(err.response.data));
      } else {
        setError('Failed to create exam. Ensure course ID exists and data is valid.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2>Create New Exam</h2>
      {error && <Alert type="error" message={error} />}
      <form onSubmit={handleSubmit}>
        <Input 
          label="Exam Title" 
          value={formData.title} 
          onChange={(e) => setFormData({...formData, title: e.target.value})} 
          required 
        />
        <Input 
          label="Description" 
          value={formData.description} 
          onChange={(e) => setFormData({...formData, description: e.target.value})} 
        />
        <Input 
          label="Duration (Minutes)" 
          type="number" 
          value={formData.duration_minutes} 
          onChange={(e) => setFormData({...formData, duration_minutes: e.target.value})} 
          required 
        />
        
        <div style={{ marginBottom: 'var(--spacing-3)' }}>
          <label style={{ display: 'block', marginBottom: 'var(--spacing-2)', fontWeight: 'bold' }}>Select Course</label>
          <select 
              value={formData.course_id} 
              onChange={(e) => setFormData({...formData, course_id: e.target.value})}
              required
              style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
          >
              <option value="" disabled>-- Select a Course --</option>
              {courses.map(course => (
                  <option key={course.id} value={course.id}>{course.title}</option>
              ))}
          </select>
        </div>

        <Button type="submit" disabled={loading} style={{ marginTop: 'var(--spacing-4)', width: '100%' }}>
          {loading ? 'Creating...' : 'Create Exam'}
        </Button>
      </form>
    </Card>
  );
};

export const InstructorEditExam = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ title: '', description: '', duration_minutes: 60, course_id: '', course_title: '' });
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // PDF Upload State
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState('');
  const [pdfSuccess, setPdfSuccess] = useState('');

  useEffect(() => {
    const loadExam = async () => {
      try {
        const examDetails = await examService.getExamDetails(id);
        const qData = await examService.getExamQuestions(id);
        const qList = qData.results !== undefined ? qData.results : qData;
        
        setFormData({
          title: examDetails.title,
          description: examDetails.description,
          duration_minutes: examDetails.duration_minutes,
          course_id: examDetails.course,
          course_title: examDetails.course_title || `Course ID: ${examDetails.course}`
        });
        setQuestions(Array.isArray(qList) ? qList : []);
      } catch (err) {
        setError('Failed to load exam details.');
      } finally {
        setLoading(false);
      }
    };
    loadExam();
  }, [id]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await examService.updateExam(id, {
        title: formData.title,
        description: formData.description,
        duration_minutes: parseInt(formData.duration_minutes),
        course: formData.course_id
      });
      setSuccess('Exam updated successfully.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update exam.');
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
      const extracted = await examService.extractPdf(file);
      if (!extracted.questions || extracted.questions.length === 0) {
          setPdfError('No questions could be extracted from this PDF.');
          setUploadingPdf(false);
          return;
      }
      
      // Calculate start order number
      const startOrder = questions.length > 0 ? Math.max(...questions.map(q => q.order_number)) + 1 : 1;
      
      let added = 0;
      // Add each question to the DB
      for (let i = 0; i < extracted.questions.length; i++) {
          const q = extracted.questions[i];
          await examService.createQuestion({
              exam: id,
              question_text: q.question_text,
              question_type: q.question_type || 'text',
              marks: q.marks || 10,
              order_number: startOrder + i,
              options: q.options || {},
              correct_answer: q.correct_answer || '',
              max_words: q.max_words || null
          });
          added++;
      }
      
      setPdfSuccess(`Successfully added ${added} questions!`);
      // Refresh questions
      const qData = await examService.getExamQuestions(id);
      const qList = qData.results !== undefined ? qData.results : qData;
      setQuestions(Array.isArray(qList) ? qList : []);
      
    } catch (err) {
        setPdfError('Failed to extract questions. Please check the PDF format.');
    } finally {
        setUploadingPdf(false);
        // Reset file input
        e.target.value = null;
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
      <Button variant="secondary" onClick={() => navigate('/instructor/exams')} style={{ alignSelf: 'flex-start' }}>
        ← Back to Dashboard
      </Button>
      
      <Card>
        <h2>Edit Exam Settings</h2>
        {error && <Alert type="error" message={error} />}
        {success && <Alert type="success" message={success} />}
        
        <form onSubmit={handleUpdate}>
          <Input 
            label="Exam Title" 
            value={formData.title} 
            onChange={(e) => setFormData({...formData, title: e.target.value})} 
            required 
          />
          <Input 
            label="Description" 
            value={formData.description} 
            onChange={(e) => setFormData({...formData, description: e.target.value})} 
          />
          <Input 
            label="Duration (Minutes)" 
            type="number" 
            value={formData.duration_minutes} 
            onChange={(e) => setFormData({...formData, duration_minutes: e.target.value})} 
            required 
          />
          
          <div style={{ marginTop: 'var(--spacing-4)' }}>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '8px' }}>
              <strong>Note:</strong> Course selection is permanently locked to prevent data corruption.
            </p>
            <Input label="Course (Read-Only)" value={formData.course_title} disabled />
          </div>

          <Button type="submit" disabled={saving} style={{ marginTop: 'var(--spacing-4)', width: '100%' }}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </Card>
      
      <Card>
        <h3>Question Management</h3>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-4)' }}>
          This exam currently has <strong>{questions.length}</strong> questions.
        </p>
        
        {pdfError && <Alert type="error" message={pdfError} />}
        {pdfSuccess && <Alert type="success" message={pdfSuccess} />}
        
        <div style={{ padding: 'var(--spacing-4)', backgroundColor: 'var(--color-bg-alt)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--color-border)' }}>
            <h4 style={{ marginBottom: 'var(--spacing-2)' }}>Add Questions via PDF</h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-4)' }}>
                Upload a PDF document. Our AI will extract the questions and automatically append them to this exam.
            </p>
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
      </Card>
    </div>
  );
};
