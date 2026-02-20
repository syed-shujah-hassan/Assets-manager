import React from 'react';
import './Topbar.css';

function Topbar({ onLogout }) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1 className="topbar-title">Rescue Management System</h1>
        <span className="topbar-badge">Admin Dashboard</span>
      </div>
      <div className="topbar-right">
        <div className="topbar-user">
          <div className="topbar-avatar">A</div>
          <div className="topbar-user-info">
            <span className="topbar-name">Admin</span>
            <span className="topbar-role">System Administrator</span>
          </div>
        </div>
        <button className="topbar-logout" onClick={onLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}

export default Topbar;
