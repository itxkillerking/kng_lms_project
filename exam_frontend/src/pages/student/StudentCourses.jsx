import React, { useEffect, useState } from 'react';
import { Card, LoadingOverlay, Alert, Button } from '../../components/common/UIComponents';
import { courseService } from '../../services/courses';
import { useNavigate } from 'react-router-dom';
import config from '../../config/config';

export const StudentCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await courseService.getMyCourses();
        const results = data.results !== undefined ? data.results : data;
        setCourses(Array.isArray(results) ? results : []);
      } catch (err) {
        setError('Failed to fetch your enrolled courses.');
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  if (loading) return <LoadingOverlay message="Loading courses..." />;

  // URL to redirect back to LMS
  const rawBase = config.LMS_BASE_URL;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)' }}>
        <h2>My Enrolled Courses</h2>
        <Button variant="secondary" onClick={() => window.location.href = rawBase}>
          Go to Main LMS Platform
        </Button>
      </div>

      {error && <Alert type="error" message={error} />}

      {courses.length === 0 && !error ? (
        <Card style={{ textAlign: 'center', padding: 'var(--spacing-8)' }}>
          <h3>No courses found</h3>
          <p style={{ color: 'var(--color-text-muted)' }}>You are not enrolled in any courses yet.</p>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--spacing-6)' }}>
          {courses.map(course => (
            <Card key={course.id} style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-2)' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-text-main)' }}>{course.title}</h3>
                <span style={{ padding: '4px 8px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>ENROLLED</span>
              </div>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-4)', flex: 1, fontSize: '0.9rem', lineHeight: '1.4' }}>{course.description || 'No description provided.'}</p>
              
              <div style={{ padding: 'var(--spacing-3)', background: 'var(--glass-light-bg)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--spacing-4)' }}>
                <p style={{ fontSize: 'var(--font-size-sm)', margin: 0, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Level:</span> 
                  <strong>{course.level || 'Beginner'}</strong>
                </p>
                <p style={{ fontSize: 'var(--font-size-sm)', margin: '4px 0 0 0', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Price:</span> 
                  <strong>{course.price && course.price > 0 ? `$${course.price}` : 'Free'}</strong>
                </p>
              </div>
              <Button style={{ width: '100%' }} onClick={() => navigate('/student/exams')}>
                View Exams for this Course
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
