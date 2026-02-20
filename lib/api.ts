export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  cnic?: string;
  role: 'citizen' | 'responder';
}

export interface EmergencyRequest {
  id: string;
  userId: string;
  userName: string;
  description: string;
  location: string;
  coordinates: { lat: number; lng: number };
  photoUri?: string;
  status: 'Pending' | 'Assigned' | 'En Route' | 'Arrived' | 'Resolved' | 'Cancelled';
  responderId?: string;
  responderName?: string;
  createdAt: string;
  updatedAt: string;
  distance?: string;
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

const dummyRequests: EmergencyRequest[] = [
  {
    id: 'REQ-001',
    userId: 'U1',
    userName: 'Ahmed Khan',
    description: 'Building fire on 3rd floor, smoke visible from outside. Multiple residents may be trapped.',
    location: 'Block 7, Gulshan-e-Iqbal, Karachi',
    coordinates: { lat: 24.9215, lng: 67.0975 },
    status: 'Assigned',
    responderId: 'R1',
    responderName: 'Rescue Unit Alpha',
    createdAt: '2026-02-20T08:30:00Z',
    updatedAt: '2026-02-20T08:35:00Z',
    distance: '2.3 km',
  },
  {
    id: 'REQ-002',
    userId: 'U2',
    userName: 'Sara Ali',
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
    userId: 'U1',
    userName: 'Ahmed Khan',
    description: 'Medical emergency - elderly person collapsed, unresponsive.',
    location: 'DHA Phase 6, Karachi',
    coordinates: { lat: 24.8029, lng: 67.0584 },
    status: 'Resolved',
    responderId: 'R1',
    responderName: 'Rescue Unit Alpha',
    createdAt: '2026-02-19T14:00:00Z',
    updatedAt: '2026-02-19T15:30:00Z',
    distance: '1.8 km',
  },
  {
    id: 'REQ-004',
    userId: 'U3',
    userName: 'Hassan Raza',
    description: 'Gas leak detected in residential area. Strong smell of gas.',
    location: 'North Nazimabad, Block H, Karachi',
    coordinates: { lat: 24.9420, lng: 67.0327 },
    status: 'En Route',
    responderId: 'R2',
    responderName: 'Rescue Unit Bravo',
    createdAt: '2026-02-20T10:00:00Z',
    updatedAt: '2026-02-20T10:10:00Z',
    distance: '5.6 km',
  },
  {
    id: 'REQ-005',
    userId: 'U4',
    userName: 'Fatima Noor',
    description: 'Flood water entering ground floor homes after heavy rain.',
    location: 'Korangi Industrial Area, Karachi',
    coordinates: { lat: 24.8311, lng: 67.1202 },
    status: 'Cancelled',
    createdAt: '2026-02-18T16:00:00Z',
    updatedAt: '2026-02-18T17:00:00Z',
    distance: '8.2 km',
  },
];

export async function loginUser(email: string, password: string, role: 'citizen' | 'responder'): Promise<User> {
  await delay(800);
  if (!email || !password) throw new Error('Email and password are required');
  return {
    id: role === 'citizen' ? 'U1' : 'R1',
    name: role === 'citizen' ? 'Ahmed Khan' : 'Rescue Unit Alpha',
    email,
    phone: '+92 300 1234567',
    cnic: role === 'citizen' ? '42101-1234567-8' : undefined,
    role,
  };
}

export async function registerUser(name: string, email: string, password: string, phone: string): Promise<User> {
  await delay(1000);
  if (!name || !email || !password) throw new Error('All fields are required');
  return {
    id: 'U-NEW',
    name,
    email,
    phone,
    role: 'citizen',
  };
}

export async function submitEmergencyRequest(data: {
  description: string;
  location: string;
  coordinates: { lat: number; lng: number };
  photoUri?: string;
}): Promise<EmergencyRequest> {
  await delay(1200);
  return {
    id: 'REQ-' + Date.now().toString().slice(-4),
    userId: 'U1',
    userName: 'Ahmed Khan',
    description: data.description,
    location: data.location,
    coordinates: data.coordinates,
    photoUri: data.photoUri,
    status: 'Pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function fetchRequests(role: 'citizen' | 'responder', userId?: string): Promise<EmergencyRequest[]> {
  await delay(600);
  if (role === 'citizen') {
    return dummyRequests.filter(r => r.userId === 'U1');
  }
  return dummyRequests.filter(r => r.status !== 'Resolved' && r.status !== 'Cancelled');
}

export async function fetchRequestById(id: string): Promise<EmergencyRequest | undefined> {
  await delay(400);
  return dummyRequests.find(r => r.id === id);
}

export async function fetchResponderHistory(): Promise<EmergencyRequest[]> {
  await delay(600);
  return dummyRequests.filter(r => r.status === 'Resolved' || r.status === 'Cancelled');
}

export async function updateRequestStatus(
  requestId: string,
  status: EmergencyRequest['status']
): Promise<EmergencyRequest> {
  await delay(800);
  const req = dummyRequests.find(r => r.id === requestId);
  if (!req) throw new Error('Request not found');
  return { ...req, status, updatedAt: new Date().toISOString() };
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
