import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, Link } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import RequestsPage from './pages/RequestsPage';
import RespondersPage from './pages/RespondersPage';
import UsersPage from './pages/UsersPage';
import FeedbackPage from './pages/FeedbackPage';
import LogsPage from './pages/LogsPage';
import SettingsPage from './pages/SettingsPage';
import { RequestAlertsProvider, useRequestAlerts } from './context/RequestAlertsContext';
import './App.css';

function ProtectedRoute({ children }) {
  const isAuth =
    localStorage.getItem('rms_admin_auth') === 'true' &&
    !!localStorage.getItem('rms_admin_token');
  if (!isAuth) return <Navigate to="/login" replace />;
  return children;
}

function AdminLayoutInner() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount, toast, dismissToast } = useRequestAlerts();

  const handleLogout = () => {
    localStorage.removeItem('rms_admin_auth');
    localStorage.removeItem('rms_admin_token');
    navigate('/login');
  };

  return (
    <div className="admin-layout">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        currentPath={location.pathname}
        unreadCount={unreadCount}
      />
      {toast && (
        <div className="request-toast" role="alert">
          <span className="request-toast-icon">🚨</span>
          <div className="request-toast-body">
            <strong>{toast.title}</strong>
            <p>{toast.message}</p>
            <Link to="/requests" className="request-toast-link" onClick={dismissToast}>
              View requests
            </Link>
          </div>
          <button type="button" className="request-toast-close" onClick={dismissToast} aria-label="Dismiss">
            ×
          </button>
        </div>
      )}
      <div className={`admin-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Topbar onLogout={handleLogout} />
        <div className="admin-content">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/requests" element={<RequestsPage />} />
            <Route path="/responders" element={<RespondersPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/feedback" element={<FeedbackPage />} />
            <Route path="/logs" element={<LogsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

function AdminLayout() {
  return (
    <RequestAlertsProvider>
      <AdminLayoutInner />
    </RequestAlertsProvider>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
