import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchUsers, updateUserStatus, deleteUser } from '../api';

function UsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState(null);

  const toggleStatus = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'Inactive';
      await updateUserStatus(id, newStatus);
      setUsers(prev => prev.map(u => {
        if (u.id !== id) return u;
        return { ...u, isActive: newStatus, status: newStatus ? 'Active' : 'Inactive' };
      }));
      setFilteredUsers(prev => prev.map(u => {
        if (u.id !== id) return u;
        return { ...u, isActive: newStatus, status: newStatus ? 'Active' : 'Inactive' };
      }));
    } catch (err) {
      const msg = err.message || 'Failed to update user';
      if (msg.includes('log in again')) {
        navigate('/login');
        return;
      }
      setError(msg);
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
      setFilteredUsers(prev => prev.filter(u => u.id !== id));
    } catch (err) {
      const msg = err.message || 'Failed to delete user';
      if (msg.includes('log in again')) {
        navigate('/login');
        return;
      }
      setError(msg);
      setTimeout(() => setError(null), 3000);
    }
  };

  useEffect(() => {
    fetchUsers().then(d => {
      const mapped = d.map(u => ({
			status: u.isActive === false ? 'Inactive' : 'Active',
			...u,
		}));
      setUsers(mapped);
      setFilteredUsers(mapped);
      setLoading(false);
    }).catch(err => {
      setError(err.message);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    let filtered = users;

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(u =>
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.phone || '').includes(searchTerm) ||
        (u.cnic || '').includes(searchTerm)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(u => u.status === statusFilter);
    }

    setFilteredUsers(filtered);
  }, [searchTerm, statusFilter, users]);

  if (loading) return <div className="loading">Loading users...</div>;

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Users</h2>
        <p className="page-subtitle">Registered citizens in the system</p>
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

      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <span className="card-title">All Users ({filteredUsers.length})</span>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Search users..."
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
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid var(--border)',
                borderRadius: 6,
                fontSize: 14,
              }}
            >
              <option value="all">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
        <div className="card-body table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>CNIC</th>
                <th>Total Requests</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}>{u.name}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                  <td>{u.phone}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{u.cnic}</td>
                  <td>
                    <span style={{
                      background: u.totalRequests >= 3 ? 'var(--warning-light)' : 'var(--info-light)',
                      color: u.totalRequests >= 3 ? 'var(--warning)' : 'var(--info)',
                      padding: '4px 12px',
                      borderRadius: 20,
                      fontWeight: 600,
                      fontSize: 13,
                    }}>
                      {u.totalRequests}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${u.status === 'Inactive' ? 'badge-inactive' : 'badge-available'}`}>
                      {u.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => toggleStatus(u.id, u.status)}
                      >
                        {u.status === 'Inactive' ? 'Activate' : 'Deactivate'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-delete-soft btn-sm"
                        onClick={() => handleDelete(u.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
              No users found matching your criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UsersPage;
