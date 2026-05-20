import React, { useState, useEffect } from 'react';
import { fetchRequests, fetchReports } from '../api';

function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [report, requests] = await Promise.all([fetchReports(), fetchRequests()]);
        setStats(report);
        setRecentRequests(requests.slice(0, 5));
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
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
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>⚡</div>
          <div className="stat-info">
            <div className="stat-value">{stats?.activeRequests || 0}</div>
            <div className="stat-label">Active Requests</div>
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
          <div className="stat-icon" style={{ background: 'rgba(13, 148, 136, 0.1)', color: '#0d9488' }}>🚑</div>
          <div className="stat-info">
            <div className="stat-value">{stats?.totalResponders || 0}</div>
            <div className="stat-label">Total Responders</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>👥</div>
          <div className="stat-info">
            <div className="stat-value">{stats?.totalUsers || 0}</div>
            <div className="stat-label">Total Users</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>⭐</div>
          <div className="stat-info">
            <div className="stat-value">{stats?.totalFeedback || 0}</div>
            <div className="stat-label">Total Feedback</div>
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
                  <th>Ref</th>
                  <th>User</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentRequests.map(r => (
                  <tr key={r.id}>
                    <td>
                      <span className="request-ref">{r.referenceCode || r.id}</span>
                    </td>
                    <td>{r.user || r.userName}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{new Date(r.createdAt).toLocaleString()}</td>
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
                <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--teal)' }}>{stats?.avgResponseTime || 'N/A'}</span>
              </div>
              <div style={{ height: 1, background: 'var(--border-light)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Avg Rating</span>
                <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--warning)' }}>{'★'.repeat(Math.round(parseFloat(stats?.avgRating || 0)))} {stats?.avgRating || '0.0'}</span>
              </div>
              <div style={{ height: 1, background: 'var(--border-light)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Resolution Rate</span>
                <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--success)' }}>{stats?.resolutionRate || 0}%</span>
              </div>
              <div style={{ height: 1, background: 'var(--border-light)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Active Responders</span>
                <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--navy)' }}>{stats?.activeResponders || 0}</span>
              </div>
              <div style={{ height: 1, background: 'var(--border-light)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Cancelled Requests</span>
                <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--danger)' }}>{stats?.cancelledRequests || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {stats?.requestsByStatus && stats.requestsByStatus.length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-header">
            <span className="card-title">Requests by Status</span>
          </div>
          <div className="card-body-padded">
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {stats.requestsByStatus.map(item => (
                <div key={item._id} style={{ flex: 1, minWidth: 150 }}>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>{item._id}</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--navy)' }}>{item.count}</div>
                  <div style={{ height: 6, background: 'var(--border-light)', borderRadius: 3, marginTop: 8, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      background: item._id === 'Resolved' ? 'var(--success)' : 
                               item._id === 'Pending' ? 'var(--warning)' :
                               item._id === 'Assigned' ? 'var(--info)' :
                               item._id === 'Cancelled' ? 'var(--danger)' : 'var(--teal)',
                      width: `${(item.count / stats.totalRequests) * 100}%`,
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {stats?.feedbackDistribution && stats.feedbackDistribution.length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-header">
            <span className="card-title">Feedback Distribution</span>
          </div>
          <div className="card-body-padded">
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {stats.feedbackDistribution.map(item => (
                <div key={item._id} style={{ flex: 1, minWidth: 100 }}>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    {item._id} Star{item._id > 1 ? 's' : ''}
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--warning)' }}>{item.count}</div>
                  <div style={{ height: 6, background: 'var(--border-light)', borderRadius: 3, marginTop: 8, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      background: item._id >= 4 ? 'var(--success)' : item._id === 3 ? 'var(--warning)' : 'var(--danger)',
                      width: `${(item.count / stats.totalFeedback) * 100}%`,
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardPage;
