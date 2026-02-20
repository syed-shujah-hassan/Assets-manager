import React, { useState, useEffect } from 'react';
import { fetchRequests } from '../api';

function RequestsPage() {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('All');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests().then(d => { setRequests(d); setLoading(false); });
  }, []);

  const statuses = ['All', 'Pending', 'Assigned', 'En Route', 'Resolved', 'Cancelled'];
  const filtered = filter === 'All' ? requests : requests.filter(r => r.status === filter);

  const statusBadge = (status) => {
    const cls = { 'Pending': 'badge-pending', 'Assigned': 'badge-assigned', 'En Route': 'badge-enroute', 'Resolved': 'badge-resolved', 'Cancelled': 'badge-cancelled' }[status] || 'badge-pending';
    return <span className={`badge ${cls}`}>{status}</span>;
  };

  const priorityBadge = (p) => {
    const cls = { 'Critical': 'badge-cancelled', 'High': 'badge-pending', 'Medium': 'badge-assigned', 'Low': 'badge-resolved' }[p] || '';
    return <span className={`badge ${cls}`}>{p}</span>;
  };

  if (loading) return <div className="loading">Loading requests...</div>;

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Emergency Requests</h2>
        <p className="page-subtitle">Manage and monitor all emergency requests</p>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">All Requests ({filtered.length})</span>
          <div className="filter-row">
            {statuses.map(s => (
              <button key={s} className={`filter-chip ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>{s}</button>
            ))}
          </div>
        </div>
        <div className="card-body table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>User</th>
                <th>Time</th>
                <th>Location</th>
                <th>Responder</th>
                <th>Priority</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="clickable" onClick={() => setSelected(r)}>
                  <td style={{ fontWeight: 600, color: 'var(--navy)' }}>{r.id}</td>
                  <td>{r.user}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{r.time}</td>
                  <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.location}</td>
                  <td>{r.responder}</td>
                  <td>{priorityBadge(r.priority)}</td>
                  <td>{statusBadge(r.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Request {selected.id}</span>
              <button className="modal-close" onClick={() => setSelected(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Reported By</span>
                  <span className="detail-value">{selected.user}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Phone</span>
                  <span className="detail-value">{selected.phone}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Time</span>
                  <span className="detail-value">{selected.time}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Priority</span>
                  <span className="detail-value">{priorityBadge(selected.priority)}</span>
                </div>
                <div className="detail-item detail-full">
                  <span className="detail-label">Location</span>
                  <span className="detail-value">{selected.location}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Assigned Responder</span>
                  <span className="detail-value">{selected.responder}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Status</span>
                  <span className="detail-value">{statusBadge(selected.status)}</span>
                </div>
                <div className="detail-item detail-full">
                  <span className="detail-label">Description</span>
                  <span className="detail-value">{selected.description}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RequestsPage;
