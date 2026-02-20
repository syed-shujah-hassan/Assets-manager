import React, { useState, useEffect } from 'react';
import { fetchLogs, fetchReports } from '../api';

function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchLogs(), fetchReports()]).then(([l, r]) => {
      setLogs(l);
      setStats(r);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="loading">Loading logs...</div>;

  const actionColor = (action) => {
    if (action.includes('Created')) return 'var(--info)';
    if (action.includes('Assigned')) return 'var(--teal)';
    if (action.includes('Resolved')) return 'var(--success)';
    if (action.includes('Cancelled')) return 'var(--danger)';
    return 'var(--text)';
  };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Logs & Reports</h2>
        <p className="page-subtitle">System activity logs and summary reports</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>📋</div>
          <div className="stat-info">
            <div className="stat-value">{stats.totalRequests}</div>
            <div className="stat-label">Total Requests</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>✅</div>
          <div className="stat-info">
            <div className="stat-value">{stats.resolvedRequests}</div>
            <div className="stat-label">Resolved</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(13, 148, 136, 0.1)', color: '#0d9488' }}>⏱</div>
          <div className="stat-info">
            <div className="stat-value">{stats.avgResponseTime}</div>
            <div className="stat-label">Avg Response</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>⭐</div>
          <div className="stat-info">
            <div className="stat-value">{stats.avgRating}</div>
            <div className="stat-label">Avg Rating</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Activity Logs</span>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{logs.length} entries</span>
        </div>
        <div className="card-body table-wrap">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Action</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(l => (
                <tr key={l.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{l.timestamp}</td>
                  <td>
                    <span style={{
                      color: actionColor(l.action),
                      fontWeight: 600,
                      fontSize: 13,
                    }}>{l.action}</span>
                  </td>
                  <td>{l.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default LogsPage;
