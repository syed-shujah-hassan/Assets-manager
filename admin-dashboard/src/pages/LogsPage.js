import React, { useState, useEffect } from 'react';
import { fetchLogs, fetchReports } from '../api';

function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionFilter, setActionFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    Promise.all([fetchLogs(), fetchReports()])
      .then(([l, r]) => {
        setLogs(l);
        setFilteredLogs(l);
        setStats(r);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let filtered = logs;

    if (actionFilter !== 'all') {
      filtered = filtered.filter(l => l.action === actionFilter);
    }

    if (entityFilter !== 'all') {
      filtered = filtered.filter(l => l.entityType === entityFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(l =>
        l.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.action.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredLogs(filtered);
  }, [actionFilter, entityFilter, searchTerm, logs]);

  const actionColor = (action) => {
    if (action.includes('Created')) return 'var(--info)';
    if (action.includes('Assigned')) return 'var(--teal)';
    if (action.includes('Resolved')) return 'var(--success)';
    if (action.includes('Cancelled')) return 'var(--danger)';
    if (action.includes('Updated')) return 'var(--warning)';
    if (action.includes('Deleted')) return 'var(--danger)';
    return 'var(--text)';
  };

  const uniqueActions = [...new Set(logs.map(l => l.action))];
  const uniqueEntities = [...new Set(logs.map(l => l.entityType).filter(Boolean))];

  if (loading) return <div className="loading">Loading logs...</div>;

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Logs & Reports</h2>
        <p className="page-subtitle">System activity logs and summary reports</p>
      </div>

      {error && (
        <div style={{
          background: 'var(--danger-light)',
          color: 'var(--danger)',
          padding: '12px 16px',
          borderRadius: 8,
          marginBottom: 20,
          fontSize: 14,
        }}>
          {error}
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>📋</div>
          <div className="stat-info">
            <div className="stat-value">{stats?.totalRequests || 0}</div>
            <div className="stat-label">Total Requests</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>✅</div>
          <div className="stat-info">
            <div className="stat-value">{stats?.resolvedRequests || 0}</div>
            <div className="stat-label">Resolved</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(13, 148, 136, 0.1)', color: '#0d9488' }}>⏱</div>
          <div className="stat-info">
            <div className="stat-value">{stats?.avgResponseTime || 'N/A'}</div>
            <div className="stat-label">Avg Response</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>⭐</div>
          <div className="stat-info">
            <div className="stat-value">{stats?.avgRating || '0.0'}</div>
            <div className="stat-label">Avg Rating</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <span className="card-title">Activity Logs ({filteredLogs.length})</span>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid var(--border)',
                borderRadius: 6,
                fontSize: 14,
                minWidth: 200,
              }}
            />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid var(--border)',
                borderRadius: 6,
                fontSize: 14,
              }}
            >
              <option value="all">All Actions</option>
              {uniqueActions.map(action => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid var(--border)',
                borderRadius: 6,
                fontSize: 14,
              }}
            >
              <option value="all">All Entities</option>
              {uniqueEntities.map(entity => (
                <option key={entity} value={entity}>{entity}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="card-body table-wrap">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Action</th>
                <th>Entity Type</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(l => (
                <tr key={l.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{l.timestamp}</td>
                  <td>
                    <span style={{
                      color: actionColor(l.action),
                      fontWeight: 600,
                      fontSize: 13,
                    }}>{l.action}</span>
                  </td>
                  <td>
                    {l.entityType && (
                      <span style={{
                        background: 'var(--info-light)',
                        color: 'var(--info)',
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 600,
                      }}>
                        {l.entityType}
                      </span>
                    )}
                  </td>
                  <td>{l.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredLogs.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
              No logs found matching your criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LogsPage;
