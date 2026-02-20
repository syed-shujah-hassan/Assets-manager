import React, { useState, useEffect } from 'react';
import { fetchSettings, saveSettings } from '../api';

function SettingsPage() {
  const [settings, setSettings] = useState({ searchRadius: 5000, duplicateTimeWindow: 30, defaultCity: 'Karachi' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchSettings().then(s => { setSettings(s); setLoading(false); });
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const res = await saveSettings(settings);
    setSaving(false);
    if (res.success) {
      setSuccess(res.message);
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  if (loading) return <div className="loading">Loading settings...</div>;

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Settings</h2>
        <p className="page-subtitle">Configure system parameters</p>
      </div>

      <div className="card" style={{ maxWidth: 600 }}>
        <div className="card-header">
          <span className="card-title">System Configuration</span>
        </div>
        <div className="card-body-padded">
          {success && <div className="success-msg">&#10003; {success}</div>}

          <form onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label">Search Radius (meters)</label>
              <input
                type="number"
                className="form-input"
                value={settings.searchRadius}
                onChange={e => setSettings({ ...settings, searchRadius: parseInt(e.target.value) || 0 })}
              />
              <span style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                Maximum distance for nearby responder search
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Duplicate Request Time Window (minutes)</label>
              <input
                type="number"
                className="form-input"
                value={settings.duplicateTimeWindow}
                onChange={e => setSettings({ ...settings, duplicateTimeWindow: parseInt(e.target.value) || 0 })}
              />
              <span style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                Prevent duplicate reports within this time
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Default City</label>
              <select
                className="form-select"
                value={settings.defaultCity}
                onChange={e => setSettings({ ...settings, defaultCity: e.target.value })}
              >
                <option>Karachi</option>
                <option>Lahore</option>
                <option>Islamabad</option>
                <option>Rawalpindi</option>
                <option>Faisalabad</option>
                <option>Multan</option>
                <option>Peshawar</option>
                <option>Quetta</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary" disabled={saving} style={{ marginTop: 8 }}>
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
