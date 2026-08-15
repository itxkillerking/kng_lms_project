const config = {
  // Base API URL. In production, this can come from import.meta.env.VITE_API_URL
  API_BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  
  // Main LMS Base URL for external navigation
  LMS_BASE_URL: import.meta.env.VITE_LMS_BASE_URL || 'https://klstechcampus.netlify.app',
  
  // Timeout for API requests in milliseconds
  API_TIMEOUT: 10000,
  
  // Constants for pagination, etc.
  DEFAULT_PAGE_SIZE: 10,
  
  // App Version
  APP_VERSION: '1.0.0',
};

export default config;

