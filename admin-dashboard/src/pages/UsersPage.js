import React, { useState, useEffect } from 'react';
import { fetchUsers } from '../api';

function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers().then(d => { setUsers(d); setLoading(false); });
  }, []);

  if (loading) return <div className="loading">Loading users...</div>;

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Users</h2>
        <p className="page-subtitle">Registered citizens in the system</p>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">All Users ({users.length})</span>
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
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default UsersPage;
