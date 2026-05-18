import React, { useState, useEffect } from 'react';
import { fetchFeedback, deleteFeedback } from '../api';

function FeedbackPage() {
  const [feedback, setFeedback] = useState([]);
  const [filteredFeedback, setFilteredFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchFeedback()
      .then(d => {
        setFeedback(d);
        setFilteredFeedback(d);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let filtered = feedback;

    if (searchTerm) {
      filtered = filtered.filter(f =>
        f.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.responderName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.comment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.requestId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (ratingFilter !== 'all') {
      filtered = filtered.filter(f => f.rating === parseInt(ratingFilter));
    }

    setFilteredFeedback(filtered);
  }, [searchTerm, ratingFilter, feedback]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) return;
    try {
      await deleteFeedback(id);
      setFeedback(prev => prev.filter(f => f.id !== id));
      setFilteredFeedback(prev => prev.filter(f => f.id !== id));
      setShowModal(false);
      setSelectedFeedback(null);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(null), 3000);
    }
  };

  const viewDetails = (f) => {
    setSelectedFeedback(f);
    setShowModal(true);
  };

  const getRatingColor = (rating) => {
    if (rating >= 4) return 'var(--success)';
    if (rating === 3) return 'var(--warning)';
    return 'var(--danger)';
  };

  if (loading) return <div className="loading">Loading feedback...</div>;

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Feedback</h2>
        <p className="page-subtitle">User reviews and ratings for resolved requests</p>
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
              {feedback.length > 0 ? (feedback.reduce((a, f) => a + f.rating, 0) / feedback.length).toFixed(1) : '0.0'}
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
        <div className="stat-card">
          <div className="stat-info" style={{ textAlign: 'center', width: '100%' }}>
            <div className="stat-value" style={{ color: 'var(--danger)' }}>
              {feedback.filter(f => f.rating <= 2).length}
            </div>
            <div className="stat-label">Negative (1-2 Stars)</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <span className="card-title">All Feedback ({filteredFeedback.length})</span>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Search feedback..."
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
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid var(--border)',
                borderRadius: 6,
                fontSize: 14,
              }}
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFeedback.map(f => (
                <tr key={f.id}>
                  <td style={{ fontWeight: 600, color: 'var(--navy)' }}>{f.requestId}</td>
                  <td>{f.userName}</td>
                  <td>{f.responderName}</td>
                  <td>
                    <span style={{
                      color: getRatingColor(f.rating),
                      fontWeight: 700,
                      fontSize: 16,
                    }}>
                      {'★'.repeat(f.rating)}{'☆'.repeat(5 - f.rating)}
                    </span>
                    <span style={{ marginLeft: 8, fontSize: 14, color: 'var(--text-secondary)' }}>
                      ({f.rating}/5)
                    </span>
                  </td>
                  <td style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.comment || 'No comment'}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{f.date}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => viewDetails(f)}
                      >
                        View
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(f.id)}
                        style={{ background: 'var(--danger)', borderColor: 'var(--danger)' }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredFeedback.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
              No feedback found matching your criteria.
            </div>
          )}
        </div>
      </div>

      {showModal && selectedFeedback && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'white',
            borderRadius: 12,
            padding: 24,
            maxWidth: 500,
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
          }}>
            <h3 style={{ marginTop: 0, marginBottom: 16 }}>Feedback Details</h3>
            <div style={{ marginBottom: 16 }}>
              <strong>Request ID:</strong> {selectedFeedback.requestId}
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>User:</strong> {selectedFeedback.userName}
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>Responder:</strong> {selectedFeedback.responderName}
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>Rating:</strong>{' '}
              <span style={{
                color: getRatingColor(selectedFeedback.rating),
                fontWeight: 700,
                fontSize: 18,
              }}>
                {'★'.repeat(selectedFeedback.rating)}{'☆'.repeat(5 - selectedFeedback.rating)}
              </span>
              <span style={{ marginLeft: 8 }}>({selectedFeedback.rating}/5)</span>
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>Comment:</strong>
              <p style={{ marginTop: 8, padding: 12, background: 'var(--border-light)', borderRadius: 8 }}>
                {selectedFeedback.comment || 'No comment provided'}
              </p>
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong>Date:</strong> {selectedFeedback.date}
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowModal(false);
                  setSelectedFeedback(null);
                }}
              >
                Close
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleDelete(selectedFeedback.id)}
                style={{ background: 'var(--danger)', borderColor: 'var(--danger)' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FeedbackPage;
