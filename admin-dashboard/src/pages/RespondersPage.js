import React, { useState, useEffect } from 'react';
import { fetchResponders } from '../api';

function RespondersPage() {
  const [responders, setResponders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', zone: '' });

  useEffect(() => {
    fetchResponders().then(d => { setResponders(d); setLoading(false); });
  }, []);

  const availabilityBadge = (a) => {
    const cls = { 'Available': 'badge-available', 'Busy': 'badge-busy', 'Inactive': 'badge-inactive' }[a] || '';
    return <span className={`badge ${cls}`}>{a}</span>;
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!form.name || !form.email) return;
    setResponders([...responders, {
      id: 'R' + (responders.length + 1),
      ...form,
      availability: 'Available',
      totalResolved: 0,
      joinDate: new Date().toISOString().split('T')[0],
    }]);
    setForm({ name: '', email: '', phone: '', zone: '' });
    setShowAdd(false);
  };

  const toggleStatus = (id) => {
    setResponders(responders.map(r => {
      if (r.id !== id) return r;
      const next = { 'Available': 'Busy', 'Busy': 'Inactive', 'Inactive': 'Available' };
      return { ...r, availability: next[r.availability] || 'Available' };
    }));
  };

  if (loading) return <div className="loading">Loading responders...</div>;

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Responders</h2>
        <p className="page-subtitle">Manage rescue responder teams</p>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">All Responders ({responders.length})</span>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ Add Responder</button>
        </div>
        <div className="card-body table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Zone</th>
                <th>Resolved</th>
                <th>Availability</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {responders.map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600 }}>{r.name}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{r.email}</td>
                  <td>{r.phone}</td>
                  <td>{r.zone}</td>
                  <td style={{ fontWeight: 600 }}>{r.totalResolved}</td>
                  <td>{availabilityBadge(r.availability)}</td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => toggleStatus(r.id)}>
                      Toggle Status
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Add Responder</span>
              <button className="modal-close" onClick={() => setShowAdd(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleAdd}>
                <div className="form-group">
                  <label className="form-label">Unit Name</label>
                  <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Rescue Unit Name" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="unit@rms.gov.pk" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+92 300 0000000" />
                </div>
                <div className="form-group">
                  <label className="form-label">Zone</label>
                  <input className="form-input" value={form.zone} onChange={e => setForm({ ...form, zone: e.target.value })} placeholder="e.g., North Karachi" />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Add Responder</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RespondersPage;
