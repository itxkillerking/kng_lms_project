import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ScrollToTop from './components/common/ScrollToTop';
import React, { lazy, Suspense, useEffect } from 'react';
import api from './services/api';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PrivateRoute } from './components/common/PrivateRoute';
import { AdminRoute } from './components/common/AdminRoute';

// Lazy load components
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Login = lazy(() => import('./pages/Auth/Login'));
const Register = lazy(() => import('./pages/Auth/Register'));
const ForgotPassword = lazy(() => import('./pages/Auth/ForgotPassword'));
const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard'));
const CourseCatalog = lazy(() => import('./pages/CourseCatalog/CourseCatalog'));
const CourseDetailPage = lazy(() => import('./pages/CourseDetail/CourseDetailPage'));
const InstructorProfilePage = lazy(() => import('./pages/InstructorProfile/InstructorProfilePage'));
const CourseView = lazy(() => import('./pages/CourseView/CourseView'));
const Gradebook = lazy(() => import('./pages/Gradebook/Gradebook'));
const Certificates = lazy(() => import('./pages/Certificates/Certificates'));
const TeacherDashboard = lazy(() => import('./pages/TeacherDashboard/TeacherDashboard'));
const Profile = lazy(() => import('./pages/Dashboard/Profile/Profile'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard/AdminDashboard'));
const About = lazy(() => import('./pages/About/About'));
const PublicProfilePage = lazy(() => import('./pages/Profile/PublicProfilePage'));
const ChatHub = lazy(() => import('./pages/Messaging/ChatHub').then(module => ({ default: module.ChatHub })));

// Simple loading fallback
const PageLoader = () => (
  <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f7fa' }}>
    <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid rgba(0,0,0,0.08)', borderTopColor: 'var(--accent-blue)', borderRadius: '50%' }}></div>
  </div>
);

import { EmailFloat } from './components/common/EmailFloat';
import { FloatingBackButton } from './components/common/FloatingBackButton';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      retry: 1,
      staleTime: 1000 * 10, // 10 seconds for fresher dashboard data
    },
  },
});

function urlB64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function App() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js");
    }
  }, []);

  useEffect(() => {
    async function enablePush() {
      if (!localStorage.getItem('access_token')) return;
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;

      const registration = await navigator.serviceWorker.ready;

      const existing = await registration.pushManager.getSubscription();
      if (existing) return existing;

      const VAPID_PUBLIC_KEY = urlB64ToUint8Array('BClYLJkYNMyR0KX6M_BkYLn8TItE4L2xOHplvjpRyTrnWeCb-Oc5FzfjjKCIwuB_n5fIwuXd8IaxWhMgOV0FddQ');
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: VAPID_PUBLIC_KEY
      });

      const subJSON = subscription.toJSON();
      await api.post('chat/push/subscribe/', {
          endpoint: subJSON.endpoint,
          p256dh: subJSON.keys.p256dh,
          auth: subJSON.keys.auth
      });
    }

    enablePush();
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <ScrollToTop />
          <EmailFloat />
          <FloatingBackButton />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/catalog" element={<CourseCatalog />} />
              <Route path="/about" element={<About />} />
              <Route path="/course/:id" element={<CourseDetailPage />} />
              <Route path="/instructor/:id" element={<InstructorProfilePage />} />
              <Route path="/profile/:id" element={<PublicProfilePage />} />

              <Route element={<PrivateRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/learn/:id" element={<CourseView />} />
                <Route path="/gradebook" element={<Gradebook />} />
                <Route path="/certificates" element={<Certificates />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/chat" element={<ChatHub />} />
                <Route element={<AdminRoute />}>
                  <Route path="/admin/*" element={<AdminDashboard />} />
                </Route>
                <Route path="/teacher/*" element={<TeacherDashboard />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
