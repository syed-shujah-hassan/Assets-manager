import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchResponders, createResponder, updateResponderAvailability, updateResponder } from '../api';

function RespondersPage() {
  const navigate = useNavigate();
  const [responders, setResponders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', zone: '', cnic: '', password: '', vehicleType: 'Ambulance' });
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', zone: '', isActive: true, vehicleType: 'Ambulance' });
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchResponders().then(d => { setResponders(d); setLoading(false); });
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const availabilityBadge = (a, active) => {
    if (active === false) return <span className="badge badge-inactive">Inactive</span>;
    const cls = { 'Available': 'badge-available', 'Busy': 'badge-busy', 'Inactive': 'badge-inactive' }[a] || '';
    return <span className={`badge ${cls}`}>{a}</span>;
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.cnic || !form.password) return;
    try {
      const created = await createResponder(form);
      const withVehicle = {
        ...created,
        vehicleType: created.vehicleType || form.vehicleType || 'Ambulance',
      };
      setResponders([withVehicle, ...responders]);
      setForm({ name: '', email: '', phone: '', zone: '', cnic: '', password: '', vehicleType: 'Ambulance' });
      setShowAdd(false);
      setNotification({ type: 'success', message: 'Responder added successfully!' });
    } catch (err) {
      console.error('Failed to add responder:', err.message);
      setNotification({ type: 'error', message: 'Failed to add responder.' });
    }
  };

  const handleEdit = (r) => {
    setEditing(r);
    setEditForm({
      name: r.name,
      email: r.email,
      phone: r.phone,
      zone: r.zone,
      isActive: r.isActive,
      vehicleType: r.vehicleType || 'Ambulance'
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editing) return;
    try {
      const payload = {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        zone: editForm.zone,
        isActive: editForm.isActive,
        vehicleType: editForm.vehicleType,
      };
      const updated = await updateResponder(editing.id, payload);
      const savedVehicleType = updated.vehicleType || editForm.vehicleType || 'Ambulance';
      setResponders((prev) =>
        prev.map((r) =>
          String(r.id) === String(editing.id)
            ? { ...r, ...updated, vehicleType: savedVehicleType }
            : r
        )
      );
      setEditing(null);
      setNotification({ type: 'success', message: 'Responder updated successfully!' });
    } catch (err) {
      const msg = err.message || 'Failed to update responder.';
      if (msg.includes('log in again')) {
        navigate('/login');
        return;
      }
      setNotification({ type: 'error', message: msg });
    }
  };

  const toggleStatus = async (id) => {
    const current = responders.find(r => r.id === id);
    if (!current) return;

    const next = { 'Available': 'Busy', 'Busy': 'Inactive', 'Inactive': 'Available' };
    const nextAvailability = next[current.availability] || 'Available';

    try {
      const updated = await updateResponderAvailability(id, nextAvailability);
      setResponders(responders.map(r => (r.id === id ? updated : r)));
    } catch (err) {
      const msg = err.message || 'Failed to update availability.';
      if (msg.includes('log in again')) {
        navigate('/login');
        return;
      }
      setNotification({ type: 'error', message: msg });
    }
  };

  if (loading) return <div className="loading">Loading responders...</div>;

  const filters = ['All', 'Available', 'Busy', 'Inactive'];
  const filtered = filter === 'All' ? responders : responders.filter((r) => r.availability === filter);

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Responders</h2>
        <p className="page-subtitle">Manage rescue responder teams</p>
      </div>

      {notification && (
        <div className={`notification notification-${notification.type}`} style={{
          padding: '12px 20px',
          borderRadius: '8px',
          marginBottom: '20px',
          backgroundColor: notification.type === 'success' ? '#DEF7EC' : '#FDE8E8',
          color: notification.type === 'success' ? '#03543F' : '#9B1C1C',
          border: `1px solid ${notification.type === 'success' ? '#BCF0DA' : '#FBD5D5'}`,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span>{notification.type === 'success' ? '✅' : '❌'}</span>
          <span>{notification.message}</span>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <span className="card-title">All Responders ({filtered.length})</span>
          <div className="filter-row">
            {filters.map((f) => (
              <button
                key={f}
                className={`filter-chip ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>+ Add Responder</button>
        </div>
        <div className="card-body table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Zone</th>
                <th>Resolved</th>
                <th>Availability</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600 }}>{r.name}</td>
                  <td>
                    <span className="badge" style={{ backgroundColor: '#F3F4F6', color: '#374151', fontSize: '11px' }}>
                      {r.vehicleType || 'Ambulance'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{r.email}</td>
                  <td>{r.phone}</td>
                  <td>{r.zone}</td>
                  <td style={{ fontWeight: 600 }}>{r.totalResolved}</td>
                  <td>{availabilityBadge(r.availability, r.isActive)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(r)}>
                        Edit
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => toggleStatus(r.id)} disabled={r.isActive === false}>
                        Cycle
                      </button>
                    </div>
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
                <div className="form-group">
                  <label className="form-label">Vehicle Type</label>
                  <select className="form-input" value={form.vehicleType} onChange={e => setForm({ ...form, vehicleType: e.target.value })}>
                    <option value="Ambulance">Ambulance</option>
                    <option value="Bike">Bike</option>
                    <option value="Fire Truck">Fire Truck</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">CNIC</label>
                  <input className="form-input" value={form.cnic} onChange={e => setForm({ ...form, cnic: e.target.value })} placeholder="42101-1234567-8" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input type="password" className="form-input" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Create a password" required />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Add Responder</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Edit Responder</span>
              <button className="modal-close" onClick={() => setEditing(null)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleUpdate}>
                <div className="form-group">
                  <label className="form-label">Unit Name</label>
                  <input className="form-input" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Zone</label>
                  <input className="form-input" value={editForm.zone} onChange={e => setEditForm({ ...editForm, zone: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Vehicle Type</label>
                  <select className="form-input" value={editForm.vehicleType} onChange={e => setEditForm({ ...editForm, vehicleType: e.target.value })}>
                    <option value="Ambulance">Ambulance</option>
                    <option value="Bike">Bike</option>
                    <option value="Fire Truck">Fire Truck</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group" style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                  <input 
                    type="checkbox" 
                    id="isActive" 
                    checked={editForm.isActive} 
                    onChange={e => setEditForm({ ...editForm, isActive: e.target.checked })} 
                  />
                  <label htmlFor="isActive" className="form-label" style={{ marginBottom: 0 }}>Active Responder</label>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 20 }}>Save Changes</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RespondersPage;
