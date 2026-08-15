import api from './api';

export const courseService = {
  // Get all approved courses (for instructor/admin)
  getCourses: async (params = {}) => {
    const res = await api.get('/courses/', { params });
    return res.data;
  },

  // Get courses the student is enrolled in
  getMyCourses: async () => {
    const res = await api.get('/courses/my_courses/');
    return res.data;
  },
  
  // Get details for a specific course
  getCourseDetails: async (id) => {
    const res = await api.get(`/courses/${id}/`);
    return res.data;
  }
};
