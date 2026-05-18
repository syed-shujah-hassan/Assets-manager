import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchNearbyResponders, assignRequestToResponder, fetchResponderById } from '../api';
import { useRequestAlerts } from '../context/RequestAlertsContext';
import { isRequestUnread, countUnread } from '../utils/requestReadState';
import { getBrowserLocation, buildGoogleDirectionsUrl } from '../utils/mapsDirections';
import RouteDirectionsMap from '../components/RouteDirectionsMap';

function hasCoords(coordinates) {
  return (
    coordinates &&
    typeof coordinates.lat === 'number' &&
    typeof coordinates.lng === 'number' &&
    !Number.isNaN(coordinates.lat) &&
    !Number.isNaN(coordinates.lng)
  );
}

function mapRequestFromApi(r) {
  return {
    id: r.id,
    user: r.userName || r.user,
    phone: r.userPhone || r.phone,
    time: r.createdAt || r.time,
    location: r.location,
    responder: r.responderName || r.responder || 'Unassigned',
    status: r.status,
    description: r.description,
    priority: r.priority || 'High',
    photoUrl: r.photoUri || r.photoUrl,
    coordinates: r.coordinates,
    responderId: r.responderId,
  };
}

function RequestsPage() {
  const navigate = useNavigate();
  const { requests, refreshRequests, markSeen, markAllSeen } = useRequestAlerts();
  const [filter, setFilter] = useState('All');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nearbyResponders, setNearbyResponders] = useState([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyError, setNearbyError] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState('');
  const [showAssign, setShowAssign] = useState(false);
  const [routeOrigin, setRouteOrigin] = useState(null);
  const [routeOriginLabel, setRouteOriginLabel] = useState('');
  const [routeOriginLoading, setRouteOriginLoading] = useState(false);

  useEffect(() => {
    refreshRequests(false).finally(() => setLoading(false));
  }, [refreshRequests]);

  const openRequest = (r) => {
    setSelected(r);
    markSeen(r.id);
    setShowAssign(false);
    setNearbyResponders([]);
    setNearbyError('');
    setAssignError('');
  };

  useEffect(() => {
    setNearbyResponders([]);
    setNearbyError('');
    setAssignError('');
    setShowAssign(false);
  }, [selected?.id]);

  useEffect(() => {
    if (!selected || !hasCoords(selected.coordinates)) {
      setRouteOrigin(null);
      setRouteOriginLabel('');
      setRouteOriginLoading(false);
      return undefined;
    }

    let cancelled = false;
    setRouteOriginLoading(true);
    setRouteOrigin(null);
    setRouteOriginLabel('');

    (async () => {
      try {
        const browser = await getBrowserLocation();
        if (!cancelled) {
          setRouteOrigin(browser);
          setRouteOriginLabel('Admin (your location)');
          return;
        }
      } catch {
        // try assigned responder as route start
      }

      if (selected.responderId) {
        try {
          const responder = await fetchResponderById(selected.responderId);
          const c = responder?.lastKnownCoordinates;
          if (c?.lat != null && c?.lng != null && !cancelled) {
            setRouteOrigin({ lat: c.lat, lng: c.lng });
            setRouteOriginLabel(`Responder: ${responder.name || 'Unit'}`);
          }
        } catch {
          // ignore
        }
      }
    })().finally(() => {
      if (!cancelled) setRouteOriginLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [selected?.id, selected?.coordinates?.lat, selected?.coordinates?.lng, selected?.responderId]);

  const openDrivingRoute = () => {
    if (!hasCoords(selected?.coordinates)) return;
    const destination = selected.coordinates;
    if (routeOrigin) {
      window.open(buildGoogleDirectionsUrl(routeOrigin, destination), '_blank', 'noopener,noreferrer');
      return;
    }
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${destination.lat},${destination.lng}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const loadNearby = async () => {
    if (selected?.coordinates?.lat == null || selected?.coordinates?.lng == null) {
      setNearbyError('Request location coordinates are missing.');
      return;
    }
    setNearbyResponders([]);
    setNearbyError('');
    setAssignError('');
    setNearbyLoading(true);
    try {
      const lat = selected.coordinates.lat;
      const lng = selected.coordinates.lng;
      const data = await fetchNearbyResponders(lat, lng, {
        maxDistanceKm: 50,
        availability: 'Available',
      });
      setNearbyResponders(data);
    } catch (err) {
      setNearbyError(err?.message || 'Failed to load nearby responders');
    } finally {
      setNearbyLoading(false);
    }
  };

  const handleAssign = async (responderId) => {
    if (!selected?.id || !responderId) return;
    setAssigning(true);
    setAssignError('');
    try {
      const updated = await assignRequestToResponder(selected.id, responderId);
      const mapped = mapRequestFromApi(updated);
      await refreshRequests(false);
      setSelected(mapped);
      setShowAssign(false);
    } catch (err) {
      const msg = err?.message || 'Failed to assign request';
      setAssignError(msg);
      if (msg.includes('log in again')) navigate('/login');
    } finally {
      setAssigning(false);
    }
  };

  const canAssign =
    selected &&
    (selected.status === 'Pending' ||
      !selected.responderId ||
      selected.responder === 'Unassigned');

  const statuses = ['All', 'Pending', 'Assigned', 'En Route', 'Resolved', 'Cancelled'];
  const filtered = filter === 'All' ? requests : requests.filter((r) => r.status === filter);
  const unreadTotal = countUnread(requests);

  const statusBadge = (status) => {
    const cls =
      {
        Pending: 'badge-pending',
        Assigned: 'badge-assigned',
        'En Route': 'badge-enroute',
        Resolved: 'badge-resolved',
        Cancelled: 'badge-cancelled',
      }[status] || 'badge-pending';
    return <span className={`badge ${cls}`}>{status}</span>;
  };

  const priorityBadge = (p) => {
    const cls =
      {
        Critical: 'badge-cancelled',
        High: 'badge-pending',
        Medium: 'badge-assigned',
        Low: 'badge-resolved',
      }[p] || '';
    return <span className={`badge ${cls}`}>{p}</span>;
  };


  if (loading) return <div className="loading">Loading requests...</div>;

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Emergency Requests</h2>
        <p className="page-subtitle">Manage and monitor all emergency requests</p>
      </div>

      {unreadTotal > 0 && (
        <div className="requests-unread-banner">
          <span>
            <strong>{unreadTotal}</strong> unread request{unreadTotal !== 1 ? 's' : ''} — not opened yet
          </span>
          <button type="button" className="btn btn-secondary btn-sm" onClick={markAllSeen}>
            Mark all as read
          </button>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <span className="card-title">
            All Requests ({filtered.length})
            {unreadTotal > 0 && (
              <span className="header-unread-pill">{unreadTotal} unread</span>
            )}
          </span>
          <div className="filter-row">
            {statuses.map((s) => (
              <button
                key={s}
                className={`filter-chip ${filter === s ? 'active' : ''}`}
                onClick={() => setFilter(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="card-body table-wrap">
          <table>
            <thead>
              <tr>
                <th></th>
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
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  className={`clickable ${isRequestUnread(r.id) ? 'request-row-unread' : ''}`}
                  onClick={() => openRequest(r)}
                >
                  <td style={{ width: 88 }}>
                    {isRequestUnread(r.id) ? (
                      <span className="badge badge-unread">Unread</span>
                    ) : (
                      <span className="badge badge-read">Viewed</span>
                    )}
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--navy)' }}>{r.id}</td>
                  <td>{r.user}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{r.time}</td>
                  <td
                    style={{
                      maxWidth: 200,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {r.location}
                  </td>
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
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Request {selected.id}</span>
              <button type="button" className="modal-close" onClick={() => setSelected(null)}>
                ×
              </button>
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
                  {hasCoords(selected.coordinates) ? (
                    <RouteDirectionsMap
                      origin={routeOrigin}
                      destination={selected.coordinates}
                      originLabel={routeOriginLabel || 'Start'}
                      destinationLabel="Emergency"
                      loading={routeOriginLoading}
                    />
                  ) : (
                    <p className="detail-map-missing">GPS coordinates not available for this request.</p>
                  )}
                </div>
                <div className="detail-item">
                  <span className="detail-label">Assigned Responder</span>
                  <span className="detail-value">{selected.responder}</span>
                </div>
                {canAssign && (
                  <div className="detail-item detail-full">
                    <span className="detail-label">Assign Action</span>
                    <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={async () => {
                          const next = !showAssign;
                          setShowAssign(next);
                          if (next) await loadNearby();
                        }}
                        disabled={assigning || nearbyLoading}
                        style={{ padding: '10px 14px', borderRadius: 10 }}
                      >
                        {showAssign ? 'Hide List' : 'Assign Now'}
                      </button>
                      {hasCoords(selected.coordinates) && (
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '10px 14px', borderRadius: 10 }}
                          onClick={openDrivingRoute}
                        >
                          View route on Map
                        </button>
                      )}
                      {showAssign && (
                        <div style={{ marginTop: 12, width: '100%', flexBasis: '100%' }}>
                          {nearbyLoading ? (
                            <div className="nearby-loading">Searching for available responders...</div>
                          ) : nearbyError ? (
                            <div style={{ color: 'var(--danger)' }}>{nearbyError}</div>
                          ) : nearbyResponders.length === 0 ? (
                            <div className="nearby-empty">
                              No available responders found.
                              <br />
                              <small style={{ color: '#64748b' }}>
                                Make sure responders are marked as Available in the Responders tab.
                              </small>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {nearbyResponders.map((r) => (
                                <button
                                  key={r.id}
                                  type="button"
                                  onClick={() => handleAssign(r.id)}
                                  disabled={assigning}
                                  style={{
                                    textAlign: 'left',
                                    background: 'white',
                                    border: '1px solid var(--border-light)',
                                    borderRadius: 12,
                                    padding: '12px',
                                    cursor: 'pointer',
                                    width: '100%',
                                  }}
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ fontWeight: 700, color: 'var(--navy)' }}>{r.name}</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                                      {r.distance != null ? `${r.distance} km` : 'Location unknown'}
                                    </div>
                                  </div>
                                  <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-secondary)' }}>
                                    {r.phone ? `${r.phone} • ` : ''}
                                    {r.availability}
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      {assignError && (
                        <div style={{ marginTop: 8, color: 'var(--danger)', fontSize: 13 }}>{assignError}</div>
                      )}
                    </div>
                  </div>
                )}
                <div className="detail-item">
                  <span className="detail-label">Status</span>
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <span className="detail-value">{statusBadge(selected.status)}</span>
                    {hasCoords(selected.coordinates) && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={openDrivingRoute}
                      >
                        View route
                      </button>
                    )}
                  </div>
                </div>
                <div className="detail-item detail-full">
                  <span className="detail-label">Description</span>
                  <span className="detail-value">{selected.description}</span>
                </div>
                {selected.photoUrl && (
                  <div className="detail-item detail-full">
                    <span className="detail-label">Photo Evidence</span>
                    <div className="photo-preview">
                      <img
                        src={selected.photoUrl}
                        alt="Emergency scene"
                        style={{ width: '100%', display: 'block', objectFit: 'cover', borderRadius: 8 }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RequestsPage;
