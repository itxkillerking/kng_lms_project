import React, { useState, useContext } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { FiMenu, FiX, FiLogOut } from 'react-icons/fi';
import { AuthContext } from '../../context/AuthContext';
import './layouts.css';

export const AuthLayout = () => {
  return (
    <div className="auth-layout">
      <div className="auth-container glass-panel">
        <h1 className="auth-title">KNG Exam System</h1>
        <Outlet />
      </div>
    </div>
  );
};

export const StudentLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-layout">
      <nav className="navbar">
        <button className="mobile-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
        <h2>Student Dashboard</h2>
        <div className="navbar-right">
          <span className="navbar-user">{user?.username}</span>
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            <FiLogOut size={18} /> Logout
          </button>
        </div>
      </nav>
      <div className="main-content">
        <aside className={`sidebar ${isSidebarOpen ? 'sidebar-open' : ''}`}>
          <ul>
            <li><a href="/dashboard">Dashboard</a></li>
            <li><a href="/student/exams">My Exams</a></li>
          </ul>
          <div className="sidebar-logout">
            <button onClick={handleLogout} className="sidebar-logout-btn">
              <FiLogOut size={16} /> Logout
            </button>
          </div>
        </aside>
        {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>}
        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export const InstructorLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-layout">
      <nav className="navbar">
        <button className="mobile-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
        <h2>Instructor Dashboard</h2>
        <div className="navbar-right">
          <span className="navbar-user">{user?.username}</span>
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            <FiLogOut size={18} /> Logout
          </button>
        </div>
      </nav>
      <div className="main-content">
        <aside className={`sidebar ${isSidebarOpen ? 'sidebar-open' : ''}`}>
          <ul>
            <li><a href="/dashboard">Dashboard</a></li>
            <li><a href="/instructor/exams">Manage Exams</a></li>
            <li><a href="/instructor/create">Create Exam</a></li>
          </ul>
          <div className="sidebar-logout">
            <button onClick={handleLogout} className="sidebar-logout-btn">
              <FiLogOut size={16} /> Logout
            </button>
          </div>
        </aside>
        {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>}
        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
