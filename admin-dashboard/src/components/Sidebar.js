import React from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css';

const menuItems = [
  { path: '/', icon: '📊', label: 'Dashboard' },
  { path: '/requests', icon: '🚨', label: 'Emergency Requests' },
  { path: '/responders', icon: '🚑', label: 'Responders' },
  { path: '/users', icon: '👥', label: 'Users' },
  { path: '/feedback', icon: '⭐', label: 'Feedback' },
  { path: '/logs', icon: '📋', label: 'Logs & Reports' },
  { path: '/settings', icon: '⚙️', label: 'Settings' },
];

function Sidebar({ collapsed, onToggle, currentPath, unreadCount = 0 }) {
  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-icon">RMS</div>
          {!collapsed && <span className="logo-text">Admin Panel</span>}
        </div>
        <button className="sidebar-toggle" onClick={onToggle}>
          {collapsed ? '→' : '←'}
        </button>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`sidebar-link ${currentPath === item.path ? 'active' : ''}`}
            title={collapsed ? item.label : ''}
          >
            <span className="sidebar-icon">{item.icon}</span>
            {!collapsed && <span className="sidebar-label">{item.label}</span>}
            {item.path === '/requests' && unreadCount > 0 && (
              <span className="sidebar-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        {!collapsed && (
          <div className="sidebar-version">
            <span>Rescue Management System</span>
            <span className="version-num">v1.0.0</span>
          </div>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
