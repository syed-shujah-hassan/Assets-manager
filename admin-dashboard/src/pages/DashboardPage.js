import React, { useState, useEffect } from 'react';
import { fetchRequests, fetchReports } from '../api';

function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [report, requests] = await Promise.all([fetchReports(), fetchRequests()]);
      setStats(report);
      setRecentRequests(requests.slice(0, 5));
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="loading">Loading dashboard...</div>;

  const statusBadge = (status) => {
    const cls = {
      'Pending': 'badge-pending',
      'Assigned': 'badge-assigned',
      'En Route': 'badge-enroute',
      'Resolved': 'badge-resolved',
      'Cancelled': 'badge-cancelled',
    }[status] || 'badge-pending';
    return <span className={`badge ${cls}`}>{status}</span>;
  };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Dashboard</h2>
        <p className="page-subtitle">System overview and key metrics</p>
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
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>⚡</div>
          <div className="stat-info">
            <div className="stat-value">{stats.activeRequests}</div>
            <div className="stat-label">Active Requests</div>
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
          <div className="stat-icon" style={{ background: 'rgba(13, 148, 136, 0.1)', color: '#0d9488' }}>🚑</div>
          <div className="stat-info">
            <div className="stat-value">{stats.totalResponders}</div>
            <div className="stat-label">Total Responders</div>
          </div>
        </div>
      </div>

      <div className="two-col">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Requests</span>
          </div>
          <div className="card-body table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentRequests.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600, color: 'var(--navy)' }}>{r.id}</td>
                    <td>{r.user}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{r.time}</td>
                    <td>{statusBadge(r.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Quick Stats</span>
          </div>
          <div className="card-body-padded">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Avg Response Time</span>
                <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--teal)' }}>{stats.avgResponseTime}</span>
              </div>
              <div style={{ height: 1, background: 'var(--border-light)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Avg Rating</span>
                <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--warning)' }}>{'★'.repeat(Math.round(parseFloat(stats.avgRating)))} {stats.avgRating}</span>
              </div>
              <div style={{ height: 1, background: 'var(--border-light)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Resolution Rate</span>
                <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--success)' }}>{Math.round((stats.resolvedRequests / stats.totalRequests) * 100)}%</span>
              </div>
              <div style={{ height: 1, background: 'var(--border-light)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Active Responders</span>
                <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--navy)' }}>{stats.totalResponders}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
