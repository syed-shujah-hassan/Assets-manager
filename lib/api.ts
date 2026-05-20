export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  cnic?: string;
  role: 'citizen' | 'responder' | 'admin';
}

import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

export type ResponderAvailability = 'Available' | 'Busy' | 'Inactive';

export interface Responder {
  id: string;
  name: string;
  email: string;
  phone: string;
  zone: string;
  vehicleType?: string;
  availability: ResponderAvailability;
  totalResolved: number;
  joinDate: string;
}

export interface EmergencyRequest {
  id: string;
  /** Short display code from API e.g. ER-Q7-KM9 (Mongo id stays in `id`). */
  referenceCode?: string;
  userId: string;
  userName: string;
  userPhone?: string;
  description: string;
  location: string;
  coordinates: { lat: number; lng: number };
  photoUri?: string;
  status: 'Pending' | 'Assigned' | 'En Route' | 'Arrived' | 'Resolved' | 'Cancelled';
  responderId?: string;
  responderName?: string;
  responderPhone?: string;
  createdAt: string;
  updatedAt: string;
  distance?: string;
}

/** Compact request reference for headings and lists (falls back to system id). */
export function formatRequestRef(r: Pick<EmergencyRequest, 'id' | 'referenceCode'>): string {
  const code = r.referenceCode?.trim();
  return code || r.id;
}

export interface RequestLocations {
  requestId: string;
  referenceCode?: string;
  incident: {
    location: string;
    coordinates: { lat: number; lng: number };
    capturedAt: string | null;
  };
  citizenLive: null | {
    coordinates: { lat: number; lng: number };
    accuracy: number | null;
    updatedAt: string | null;
  };
  responderLive: null | {
    coordinates: { lat: number; lng: number };
    accuracy: number | null;
    updatedAt: string | null;
  };
}

export interface Feedback {
  id: string;
  requestId: string;
  userId: string;
  responderId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Backend base URL for real APIs (auth, requests, etc.)
function resolveBackendUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_BACKEND_URL?.trim().replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
    return `http://${window.location.hostname}:5000`;
  }
  return 'http://localhost:5000';
}

const BACKEND_URL = resolveBackendUrl();

// Cloudinary config for emergency photos
const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dympd4ec5';
const CLOUDINARY_UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'rms_emergencies';

const dummyRequests: EmergencyRequest[] = [
  {
    id: 'REQ-001',
    referenceCode: 'ER-DM-001',
    userId: 'U1',
    userName: 'Ahmed Khan',
    userPhone: '+92 300 1234567',
    description: 'Building fire on 3rd floor, smoke visible from outside. Multiple residents may be trapped.',
    location: 'Block 7, Gulshan-e-Iqbal, Karachi',
    coordinates: { lat: 24.9215, lng: 67.0975 },
    status: 'Assigned',
    responderId: 'R1',
    responderName: 'Rescue Unit Alpha',
    responderPhone: '+92 300 1111111',
    createdAt: '2026-02-20T08:30:00Z',
    updatedAt: '2026-02-20T08:35:00Z',
    distance: '2.3 km',
  },
  {
    id: 'REQ-002',
    referenceCode: 'ER-DM-002',
    userId: 'U2',
    userName: 'Sara Ali',
    userPhone: '+92 311 9876543',
    description: 'Road accident involving two vehicles near main intersection. Injuries reported.',
    location: 'Shahrah-e-Faisal, near PIDC, Karachi',
    coordinates: { lat: 24.8607, lng: 67.0011 },
    status: 'Pending',
    createdAt: '2026-02-20T09:15:00Z',
    updatedAt: '2026-02-20T09:15:00Z',
    distance: '4.1 km',
  },
  {
    id: 'REQ-003',
    referenceCode: 'ER-DM-003',
    userId: 'U1',
    userName: 'Ahmed Khan',
    userPhone: '+92 300 1234567',
    description: 'Medical emergency - elderly person collapsed, unresponsive.',
    location: 'DHA Phase 6, Karachi',
    coordinates: { lat: 24.8029, lng: 67.0584 },
    status: 'Resolved',
    responderId: 'R1',
    responderName: 'Rescue Unit Alpha',
    responderPhone: '+92 300 1111111',
    createdAt: '2026-02-19T14:00:00Z',
    updatedAt: '2026-02-19T15:30:00Z',
    distance: '1.8 km',
  },
  {
    id: 'REQ-004',
    referenceCode: 'ER-DM-004',
    userId: 'U3',
    userName: 'Hassan Raza',
    userPhone: '+92 322 5551234',
    description: 'Gas leak detected in residential area. Strong smell of gas.',
    location: 'North Nazimabad, Block H, Karachi',
    coordinates: { lat: 24.9420, lng: 67.0327 },
    status: 'En Route',
    responderId: 'R2',
    responderName: 'Rescue Unit Bravo',
    responderPhone: '+92 300 2222222',
    createdAt: '2026-02-20T10:00:00Z',
    updatedAt: '2026-02-20T10:10:00Z',
    distance: '5.6 km',
  },
  {
    id: 'REQ-005',
    referenceCode: 'ER-DM-005',
    userId: 'U4',
    userName: 'Fatima Noor',
    userPhone: '+92 333 7778899',
    description: 'Flood water entering ground floor homes after heavy rain.',
    location: 'Korangi Industrial Area, Karachi',
    coordinates: { lat: 24.8311, lng: 67.1202 },
    status: 'Cancelled',
    createdAt: '2026-02-18T16:00:00Z',
    updatedAt: '2026-02-18T17:00:00Z',
    distance: '8.2 km',
  },
];

export type AuthSession = { user: User; token: string };

async function authHeaders(token: string | null | undefined): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function mapApiUser(apiUser: any, role: User['role']): User {
  return {
    id: apiUser.id || apiUser._id,
    name: apiUser.name,
    email: apiUser.email,
    phone: apiUser.phone,
    cnic: apiUser.cnic,
    role: apiUser.role || role,
  };
}

export async function loginUser(identifier: string, password: string, role: 'citizen' | 'responder' | 'admin'): Promise<AuthSession> {
  if (!identifier || !password) throw new Error('Identifier and password are required');

  const body: any = { password };
  // Match backend login contract
  if (role === 'citizen') {
    body.identifier = identifier; // CNIC
    body.role = 'citizen';
  } else {
    body.identifier = identifier; // email for responder/admin
    body.role = role;
  }

  const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  let data: any;
  try {
    data = await res.json();
  } catch {
    // ignore JSON parse errors
  }

  if (!res.ok) {
    throw new Error(data?.message || 'Login failed');
  }

  const apiUser = data.user;
  if (!apiUser) {
    throw new Error('Invalid response from server');
  }

  if (!data.token) {
    throw new Error('Invalid response from server');
  }

  return { user: mapApiUser(apiUser, role), token: data.token };
}

export async function updateUserProfile(
  token: string,
  data: { name?: string; phone?: string; email?: string },
): Promise<User> {
  const res = await fetch(`${BACKEND_URL}/api/auth/profile`, {
    method: 'PATCH',
    headers: await authHeaders(token),
    body: JSON.stringify(data),
  });
  let body: any;
  try {
    body = await res.json();
  } catch {
    // ignore
  }
  if (!res.ok) {
    throw new Error(body?.message || 'Failed to update profile');
  }
  return body.user as User;
}

export async function changeUserPassword(
  token: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/api/auth/password`, {
    method: 'PATCH',
    headers: await authHeaders(token),
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  let body: any;
  try {
    body = await res.json();
  } catch {
    // ignore
  }
  if (!res.ok) {
    throw new Error(body?.message || 'Failed to change password');
  }
}

export async function fetchResponderById(responderId: string): Promise<Responder> {
  if (!responderId) throw new Error('Responder id is required');
  const res = await fetch(`${BACKEND_URL}/api/responders/${responderId}`);

  let data: any;
  try {
    data = await res.json();
  } catch {
    // ignore
  }

  if (!res.ok) {
    throw new Error(data?.message || 'Failed to fetch responder');
  }

  return data as Responder;
}

export async function updateResponderLocation(responderId: string, data: {
  coordinates: { lat: number; lng: number };
  accuracy?: number;
  at?: string;
}): Promise<Responder> {
  if (!responderId) throw new Error('Responder id is required');

  const res = await fetch(`${BACKEND_URL}/api/responders/${responderId}/location`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  let body: any;
  try {
    body = await res.json();
  } catch {
    // ignore
  }

  if (!res.ok) {
    throw new Error(body?.message || 'Failed to update responder location');
  }

  return body as Responder;
}

export async function updateResponderAvailability(responderId: string, availability: ResponderAvailability): Promise<Responder> {
  if (!responderId) throw new Error('Responder id is required');

  const res = await fetch(`${BACKEND_URL}/api/responders/${responderId}/availability`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ availability }),
  });

  let data: any;
  try {
    data = await res.json();
  } catch {
    // ignore
  }

  if (!res.ok) {
    throw new Error(data?.message || 'Failed to update responder availability');
  }

  return data as Responder;
}

export async function registerUser(name: string, email: string, password: string, phone: string, cnic: string): Promise<AuthSession> {
  if (!name || !email || !password || !phone || !cnic) throw new Error('All fields are required');

  const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, email, phone, cnic, password, role: 'citizen' }),
  });

  let data: any;
  try {
    data = await res.json();
  } catch {
    // ignore JSON parse errors
  }

  if (!res.ok) {
    throw new Error(data?.message || 'Registration failed');
  }

  const apiUser = data.user;
  if (!apiUser) {
    throw new Error('Invalid response from server');
  }

  if (!data.token) {
    throw new Error('Invalid response from server');
  }

  return { user: mapApiUser(apiUser, 'citizen'), token: data.token };
}

export async function submitEmergencyRequest(data: {
description: string;
location: string;
coordinates: { lat: number; lng: number };
photoUri?: string;
userId?: string;
userName?: string;
userPhone?: string;
}): Promise<EmergencyRequest> {
let photoUrl: string | undefined;

// 1) Upload to Cloudinary if we have a local photo URI
if (data.photoUri) {
const formData = new FormData();
formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

const guessMime = (uri: string) => {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
};

// Cloudinary expects either a real File/Blob (web) or a RN file object with uri/type/name (native)
if (Platform.OS === 'web') {
  // Web: convert the local URI (blob/http) into a Blob so Cloudinary accepts it
  const blobRes = await fetch(data.photoUri);
  if (!blobRes.ok) {
    throw new Error('Failed to read selected image');
  }
  const blob = await blobRes.blob();
  const filename = `evidence-${Date.now()}.jpg`;
  const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });
  formData.append('file', file);
} else {
  // Native (Expo Go/Hermes): avoid multipart file objects that can trigger
  // "cannot assign to property name which only has a getter". Use base64 data URI instead.
  const mime = guessMime(data.photoUri);
  const base64 = await FileSystem.readAsStringAsync(data.photoUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  formData.append('file', `data:${mime};base64,${base64}` as any);
}
try {
const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
method: 'POST',
body: formData as any,
});
const cloudinaryJson = await res.json();
if (!res.ok) {
throw new Error(cloudinaryJson?.error?.message || cloudinaryJson?.message || 'Failed to upload image');
}
photoUrl = cloudinaryJson.secure_url;
} catch (err: any) {
// If upload fails, surface error to caller
throw new Error(err?.message || 'Failed to upload image');
}
}

// 2) Send request payload to backend
const res = await fetch(`${BACKEND_URL}/api/requests`, {
method: 'POST',
headers: {
'Content-Type': 'application/json',
},
body: JSON.stringify({
description: data.description,
location: data.location,
coordinates: data.coordinates,
photoUrl,
userId: data.userId,
userName: data.userName,
userPhone: data.userPhone,
}),
});

let apiData: any;
try {
apiData = await res.json();
} catch {
// ignore
}

if (!res.ok) {
throw new Error(apiData?.message || 'Failed to submit request');
}

// Map backend response to EmergencyRequest type
const mapped: EmergencyRequest = {
  id: apiData.id,
  referenceCode: apiData.referenceCode,
  userId: apiData.userId || 'U1',
  userName: apiData.userName || 'Citizen',
  userPhone: apiData.userPhone,
  description: apiData.description,
  location: apiData.location,
  coordinates: apiData.coordinates,
  photoUri: apiData.photoUrl || apiData.photoUri,
  status: apiData.status,
  createdAt: apiData.createdAt,
  updatedAt: apiData.updatedAt,
};
return mapped;
}

export async function fetchRequests(role: 'citizen' | 'responder', userId?: string): Promise<EmergencyRequest[]> {
const res = await fetch(`${BACKEND_URL}/api/requests`);

let data: any;
try {
  data = await res.json();
} catch {
  // ignore
}

if (!res.ok) {
  throw new Error(data?.message || 'Failed to fetch requests');
}

const list = (data || []) as EmergencyRequest[];

if (role === 'citizen') {
  return userId ? list.filter((r) => r.userId === userId) : list;
}

// responder: show only requests assigned to this responder (active ones)
return list.filter((r) =>
  r.status !== 'Resolved' &&
  r.status !== 'Cancelled' &&
  r.status !== 'Pending' &&
  (userId ? r.responderId === userId : true)
);
}

export async function fetchRequestById(id: string): Promise<EmergencyRequest | undefined> {
if (!id) throw new Error('Request id is required');
const res = await fetch(`${BACKEND_URL}/api/requests/${id}`);

let data: any;
try {
  data = await res.json();
} catch {
  // ignore
}

if (!res.ok) {
  throw new Error(data?.message || 'Failed to fetch request');
}

return data as EmergencyRequest;
}

export async function fetchResponderHistory(responderId: string): Promise<EmergencyRequest[]> {
  const res = await fetch(`${BACKEND_URL}/api/requests/responder/${responderId}/history`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.message || 'Failed to fetch responder history');
  }
  return res.json();
}

export async function updateRequestStatus(
  requestId: string,
  status: EmergencyRequest['status']
): Promise<EmergencyRequest> {
  if (!requestId) throw new Error('Request id is required');
  const res = await fetch(`${BACKEND_URL}/api/requests/${requestId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });

  let data: any;
  try {
    data = await res.json();
  } catch {
    // ignore
  }

  if (!res.ok) {
    throw new Error(data?.message || 'Failed to update request status');
  }

  return data as EmergencyRequest;
}

export async function updateCitizenLiveLocation(requestId: string, data: {
  coordinates: { lat: number; lng: number };
  accuracy?: number;
  at?: string;
}): Promise<void> {
  if (!requestId) throw new Error('Request id is required');
  const res = await fetch(`${BACKEND_URL}/api/requests/${requestId}/citizen-location`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  let body: any;
  try {
    body = await res.json();
  } catch {
    // ignore
  }
  if (!res.ok) {
    throw new Error(body?.message || 'Failed to update citizen location');
  }
}

export async function updateResponderLiveLocation(requestId: string, data: {
  responderId?: string;
  coordinates: { lat: number; lng: number };
  accuracy?: number;
  at?: string;
}): Promise<void> {
  if (!requestId) throw new Error('Request id is required');
  const res = await fetch(`${BACKEND_URL}/api/requests/${requestId}/responder-location`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  let body: any;
  try {
    body = await res.json();
  } catch {
    // ignore
  }
  if (!res.ok) {
    throw new Error(body?.message || 'Failed to update responder location');
  }
}

export async function fetchRequestLocations(requestId: string): Promise<RequestLocations> {
  if (!requestId) throw new Error('Request id is required');
  const res = await fetch(`${BACKEND_URL}/api/requests/${requestId}/locations`);

  let data: any;
  try {
    data = await res.json();
  } catch {
    // ignore
  }

  if (!res.ok) {
    throw new Error(data?.message || 'Failed to fetch request locations');
  }

  return data as RequestLocations;
}

export async function submitFeedback(data: {
  requestId: string;
  rating: number;
  comment: string;
}): Promise<Feedback> {
  await delay(800);
  return {
    id: 'FB-' + Date.now().toString().slice(-4),
    requestId: data.requestId,
    userId: 'U1',
    responderId: 'R1',
    rating: data.rating,
    comment: data.comment,
    createdAt: new Date().toISOString(),
  };
}
