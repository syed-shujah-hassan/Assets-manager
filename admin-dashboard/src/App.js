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
  const { unreadCount, newRequestPopup, dismissNewRequestPopup } = useRequestAlerts();

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
      {newRequestPopup && (
        <div className="new-request-popup-root" role="alertdialog" aria-modal="true" aria-labelledby="new-request-popup-title">
          <div
            className="new-request-popup-backdrop"
            onClick={newRequestPopup.persist ? undefined : dismissNewRequestPopup}
            aria-hidden="true"
          />
          <div className="new-request-popup-dialog">
            <div className="new-request-popup-icon-wrap" aria-hidden="true">
              <span className="new-request-popup-icon">🚨</span>
            </div>
            <h2 id="new-request-popup-title" className="new-request-popup-title">
              {newRequestPopup.count} new emergency request{newRequestPopup.count !== 1 ? 's' : ''}
            </h2>
            <p className="new-request-popup-meta">
              {newRequestPopup.unreadTotal} unread total — review the list when you are ready.
            </p>
            {newRequestPopup.subtitle ? <p className="new-request-popup-sub">{newRequestPopup.subtitle}</p> : null}
            <div className="new-request-popup-actions">
              <Link
                to="/requests"
                className="btn btn-primary new-request-popup-primary"
                onClick={dismissNewRequestPopup}
              >
                View requests
              </Link>
              <button type="button" className="btn btn-secondary" onClick={dismissNewRequestPopup}>
                {newRequestPopup.persist ? 'OK, got it' : 'Dismiss'}
              </button>
            </div>
            {newRequestPopup.persist ? (
              <p className="new-request-popup-hint">Shown because you returned to this tab — it stays until you close it.</p>
            ) : null}
          </div>
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
