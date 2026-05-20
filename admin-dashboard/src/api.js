const BACKEND_URL = (
  process.env.REACT_APP_BACKEND_URL ||
  process.env.REACT_APP_API_URL ||
  'http://localhost:5000'
).replace(/\/+$/, '');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function getAdminToken() {
  return localStorage.getItem('rms_admin_token');
}

function ensureAdminToken() {
  const token = getAdminToken();
  if (!token) {
    throw new Error('Session expired. Please log in again.');
  }
  return token;
}

function adminAuthHeaders() {
  const token = ensureAdminToken();
  return { Authorization: `Bearer ${token}` };
}

async function parseJsonResponse(res, { authRequired = false } = {}) {
  let body;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem('rms_admin_token');
      localStorage.removeItem('rms_admin_auth');
      const msg = body?.message || 'Session expired';
      if (msg.toLowerCase().includes('token') || authRequired) {
        throw new Error('Session expired. Please log in again.');
      }
    }
    throw new Error(body?.message || `Request failed (${res.status})`);
  }
  return body;
}

async function authFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...adminAuthHeaders(),
      ...(options.headers || {}),
    },
  });
  return parseJsonResponse(res, { authRequired: true });
}

export async function loginAdmin(email, password) {
	const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ identifier: email, password, role: 'admin' }),
	});
	const body = await parseJsonResponse(res);
	if (body?.token) {
		localStorage.setItem('rms_admin_token', body.token);
	}
	return body;
}

export async function fetchRequests() {
  const res = await fetch(`${BACKEND_URL}/api/requests`);
  if (!res.ok) {
    throw new Error('Failed to fetch requests');
  }
  const data = await res.json();
  return (data || []).map((r) => ({
    id: r.id,
    referenceCode: r.referenceCode,
    user: r.userName,
    phone: r.userPhone,
    time: r.createdAt,
    location: r.location,
    responder: r.responderName || 'Unassigned',
    status: r.status,
    description: r.description,
    priority: r.priority || 'High',
    photoUrl: r.photoUri || r.photoUrl,
    coordinates: r.coordinates,
    responderId: r.responderId,
  }));
}

export async function fetchResponderById(id) {
  const res = await fetch(`${BACKEND_URL}/api/responders/${id}`);
  let body;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  if (!res.ok) {
    throw new Error(body?.message || 'Failed to fetch responder');
  }
  return body;
}

export async function fetchNearbyResponders(
  lat,
  lng,
  { limit = 8, availability = 'Available', maxDistanceKm, description = '', incidentType = '', recommendedVehicle = '' } = {}
) {
  const qs = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
    limit: String(limit),
    availability,
  });

  if (typeof maxDistanceKm === 'number') {
    qs.set('maxDistanceKm', String(maxDistanceKm));
  }
  if (description) {
    qs.set('description', description);
  }
  if (incidentType) {
    qs.set('incidentType', incidentType);
  }
  if (recommendedVehicle) {
    qs.set('recommendedVehicle', recommendedVehicle);
  }

  const res = await fetch(`${BACKEND_URL}/api/responders/nearby?${qs.toString()}`);
  let body;
  try {
    body = await res.json();
  } catch {
    // ignore
  }
  if (!res.ok) {
    throw new Error(body?.message || 'Failed to fetch nearby responders');
  }
  return body;
}

export async function assignRequestToResponder(requestId, responderId) {
  return authFetch(`${BACKEND_URL}/api/requests/${requestId}/assign`, {
    method: 'PATCH',
    body: JSON.stringify({ responderId }),
  });
}

export async function fetchResponders() {
	const res = await fetch(`${BACKEND_URL}/api/responders`);
	if (!res.ok) {
		throw new Error('Failed to fetch responders');
	}
	return await res.json();
}

export async function createResponder(data) {
  const res = await fetch(`${BACKEND_URL}/api/responders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  let body;
  try {
    body = await res.json();
  } catch {
    // ignore
  }
  if (!res.ok) {
    throw new Error(body?.message || 'Failed to create responder');
  }
  return body;
}

export async function updateResponderAvailability(id, availability) {
	return authFetch(`${BACKEND_URL}/api/responders/${id}/availability`, {
		method: 'PATCH',
		body: JSON.stringify({ availability }),
	});
}

export async function updateResponder(id, data) {
	return authFetch(`${BACKEND_URL}/api/responders/${id}`, {
		method: 'PATCH',
		body: JSON.stringify(data),
	});
}

export async function fetchUsers() {
  const res = await fetch(`${BACKEND_URL}/api/users`);
  return parseJsonResponse(res);
}

export async function fetchFeedback() {
  const res = await fetch(`${BACKEND_URL}/api/feedback`);
  return parseJsonResponse(res);
}

export async function fetchLogs({ action, entityType, limit } = {}) {
  const qs = new URLSearchParams();
  if (action) qs.set('action', action);
  if (entityType) qs.set('entityType', entityType);
  if (limit) qs.set('limit', limit);

  const res = await fetch(`${BACKEND_URL}/api/logs?${qs.toString()}`);
  return parseJsonResponse(res);
}

export async function fetchReports() {
  const res = await fetch(`${BACKEND_URL}/api/reports`);
  return parseJsonResponse(res);
}

export async function fetchSettings() {
  await delay(300);
  return {
    searchRadius: 5000,
    duplicateTimeWindow: 30,
    defaultCity: "Karachi",
  };
}

export async function saveSettings(settings) {
  await delay(600);
  return { success: true, message: "Settings saved successfully" };
}

export async function deleteUser(id) {
  return authFetch(`${BACKEND_URL}/api/users/${id}`, {
    method: 'DELETE',
  });
}

export async function updateUserStatus(id, isActive) {
  return authFetch(`${BACKEND_URL}/api/users/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });
}

export async function deleteFeedback(id) {
  const res = await fetch(`${BACKEND_URL}/api/feedback/${id}`, {
    method: 'DELETE',
  });
  let body;
  try {
    body = await res.json();
  } catch {
    // ignore
  }
  if (!res.ok) {
    throw new Error(body?.message || 'Failed to delete feedback');
  }
  return body;
}
