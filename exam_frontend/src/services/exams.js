import api from './api';

export const examService = {
  // Shared
  getExams: async () => {
    const res = await api.get('/exams/');
    return res.data;
  },
  
  getExamDetails: async (id) => {
    const res = await api.get(`/exams/${id}/`);
    return res.data;
  },

  // Instructor endpoints
  createExam: async (examData) => {
    const res = await api.post('/exams/', examData);
    return res.data;
  },

  updateExam: async (id, examData) => {
    const res = await api.put(`/exams/${id}/`, examData);
    return res.data;
  },

  deleteExam: async (id) => {
    const res = await api.delete(`/exams/${id}/`);
    return res.data;
  },

  publishExam: async (id) => {
    const res = await api.post(`/exams/${id}/publish/`);
    return res.data;
  },
  
  // Phase 7
  assignStudents: async (id, data) => {
    const res = await api.post(`/exams/${id}/assign/`, data);
    return res.data;
  },
  getCourseStudents: async (courseId) => {
    const res = await api.get(`/courses/${courseId}/students/`);
    return res.data;
  },

  getAttempts: async (id) => {
    const res = await api.get(`/exams/${id}/attempts/`);
    return res.data;
  },

  // Question endpoints
  getExamQuestions: async (examId) => {
    const res = await api.get(`/exam-questions/?exam=${examId}`);
    return res.data;
  },

  createQuestion: async (data) => {
    const res = await api.post('/exam-questions/', data);
    return res.data;
  },

  updateQuestion: async (id, data) => {
    const res = await api.put(`/exam-questions/${id}/`, data);
    return res.data;
  },

  deleteQuestion: async (id) => {
    const res = await api.delete(`/exam-questions/${id}/`);
    return res.data;
  },

  // Student endpoints
  startExam: async (examId) => {
    const res = await api.post('/exam-attempts/start_exam/', { exam_id: examId });
    return res.data;
  },
  
  submitExam: async (attemptId) => {
    const res = await api.post(`/exam-attempts/${attemptId}/submit/`);
    return res.data;
  },
  
  getStudentAttempts: async () => {
    const res = await api.get('/exam-attempts/');
    return res.data;
  },

  getExamAnswers: async (attemptId) => {
    const res = await api.get(`/exam-answers/?attempt=${attemptId}`);
    return res.data;
  },

  saveAnswer: async (data) => {
    let payload = data;
    let headers = {};
    
    if (data.audioBlob) {
      payload = new FormData();
      payload.append('attempt', data.attempt);
      payload.append('question', data.question);
      payload.append('answer_text', data.answer_text || '');
      payload.append('transcript_text', data.transcript_text || '');
      payload.append('audio_file', data.audioBlob, 'recording.webm');
      headers['Content-Type'] = 'multipart/form-data';
    }

    if (data.id) {
      const res = await api.put(`/exam-answers/${data.id}/`, payload, { headers });
      return res.data;
    } else {
      const res = await api.post('/exam-answers/', payload, { headers });
      return res.data;
    }
  },

  // AI Module endpoints
  extractPdf: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const res = await api.post('/pdf-extract/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return res.data;
  },
  
  importExam: async (data) => {
    const res = await api.post('/import/', data);
    return res.data;
  }
};
