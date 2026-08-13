import React, { createContext, useState, useCallback } from 'react';
import { examService } from '../services/exams';

export const ExamContext = createContext(null);

export const ExamProvider = ({ children }) => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchExams = useCallback(async () => {
    setLoading(true);
    try {
      const data = await examService.getExams();
      const results = data.results !== undefined ? data.results : data;
      setExams(Array.isArray(results) ? results : []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch exams');
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <ExamContext.Provider value={{ exams, loading, error, fetchExams }}>
      {children}
    </ExamContext.Provider>
  );
};
