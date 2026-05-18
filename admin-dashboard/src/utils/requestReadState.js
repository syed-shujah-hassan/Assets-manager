const STORAGE_KEY = 'rms_seen_request_ids';

export function getSeenRequestIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

export function markRequestSeen(id) {
  if (!id) return;
  const seen = getSeenRequestIds();
  seen.add(String(id));
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...seen]));
}

export function markAllRequestsSeen(requests) {
  const seen = getSeenRequestIds();
  (requests || []).forEach((r) => seen.add(String(r.id)));
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...seen]));
}

export function isRequestUnread(id) {
  return !getSeenRequestIds().has(String(id));
}

export function countUnread(requests) {
  const seen = getSeenRequestIds();
  return (requests || []).filter((r) => !seen.has(String(r.id))).length;
}
