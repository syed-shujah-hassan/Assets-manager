import React, { useState, useEffect } from 'react';
import { fetchFeedback } from '../api';

function FeedbackPage() {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeedback().then(d => { setFeedback(d); setLoading(false); });
  }, []);

  if (loading) return <div className="loading">Loading feedback...</div>;

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Feedback</h2>
        <p className="page-subtitle">User reviews and ratings for resolved requests</p>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <div className="stat-card">
          <div className="stat-info" style={{ textAlign: 'center', width: '100%' }}>
            <div className="stat-value">{feedback.length}</div>
            <div className="stat-label">Total Reviews</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info" style={{ textAlign: 'center', width: '100%' }}>
            <div className="stat-value" style={{ color: 'var(--warning)' }}>
              {(feedback.reduce((a, f) => a + f.rating, 0) / feedback.length).toFixed(1)}
            </div>
            <div className="stat-label">Average Rating</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info" style={{ textAlign: 'center', width: '100%' }}>
            <div className="stat-value" style={{ color: 'var(--success)' }}>
              {feedback.filter(f => f.rating >= 4).length}
            </div>
            <div className="stat-label">Positive (4-5 Stars)</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">All Feedback</span>
        </div>
        <div className="card-body table-wrap">
          <table>
            <thead>
              <tr>
                <th>Request ID</th>
                <th>User</th>
                <th>Responder</th>
                <th>Rating</th>
                <th>Comment</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {feedback.map(f => (
                <tr key={f.id}>
                  <td style={{ fontWeight: 600, color: 'var(--navy)' }}>{f.requestId}</td>
                  <td>{f.user}</td>
                  <td>{f.responder}</td>
                  <td>
                    <span className="stars">{'★'.repeat(f.rating)}{'☆'.repeat(5 - f.rating)}</span>
                  </td>
                  <td style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.comment}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{f.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default FeedbackPage;
