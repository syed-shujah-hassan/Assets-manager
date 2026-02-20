const BASE_URL = "http://localhost:3000/api";

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const dummyRequests = [
  { id: "REQ-001", user: "Ahmed Khan", phone: "+92 300 1234567", time: "2026-02-20 08:30", location: "Block 7, Gulshan-e-Iqbal, Karachi", responder: "Rescue Unit Alpha", status: "Assigned", description: "Building fire on 3rd floor, smoke visible from outside. Multiple residents may be trapped.", priority: "High" },
  { id: "REQ-002", user: "Sara Ali", phone: "+92 311 9876543", time: "2026-02-20 09:15", location: "Shahrah-e-Faisal, near PIDC, Karachi", responder: "Unassigned", status: "Pending", description: "Road accident involving two vehicles near main intersection. Injuries reported.", priority: "Critical" },
  { id: "REQ-003", user: "Hassan Raza", phone: "+92 322 5551234", time: "2026-02-20 10:00", location: "North Nazimabad, Block H, Karachi", responder: "Rescue Unit Bravo", status: "En Route", description: "Gas leak detected in residential area. Strong smell of gas.", priority: "High" },
  { id: "REQ-004", user: "Fatima Noor", phone: "+92 333 7778899", time: "2026-02-19 14:00", location: "DHA Phase 6, Karachi", responder: "Rescue Unit Alpha", status: "Resolved", description: "Medical emergency - elderly person collapsed, unresponsive.", priority: "Critical" },
  { id: "REQ-005", user: "Ali Zafar", phone: "+92 345 1112233", time: "2026-02-18 16:00", location: "Korangi Industrial Area, Karachi", responder: "Rescue Unit Charlie", status: "Resolved", description: "Flood water entering ground floor homes after heavy rain.", priority: "Medium" },
  { id: "REQ-006", user: "Zainab Sheikh", phone: "+92 300 4445566", time: "2026-02-18 11:20", location: "Clifton Block 5, Karachi", responder: "Rescue Unit Delta", status: "Cancelled", description: "Minor fire in kitchen, already extinguished by residents.", priority: "Low" },
  { id: "REQ-007", user: "Bilal Ahmed", phone: "+92 312 9998877", time: "2026-02-20 07:45", location: "Saddar, Zaibunnisa Street, Karachi", responder: "Unassigned", status: "Pending", description: "Building wall collapsed partially, debris on road.", priority: "High" },
  { id: "REQ-008", user: "Nadia Hussain", phone: "+92 321 6667788", time: "2026-02-19 20:30", location: "Gulistan-e-Jauhar Block 14, Karachi", responder: "Rescue Unit Bravo", status: "Resolved", description: "Child stuck in elevator, building power failure.", priority: "Medium" },
];

const dummyResponders = [
  { id: "R1", name: "Rescue Unit Alpha", email: "alpha@rms.gov.pk", phone: "+92 300 1111111", zone: "South Karachi", availability: "Available", totalResolved: 45, joinDate: "2024-01-15" },
  { id: "R2", name: "Rescue Unit Bravo", email: "bravo@rms.gov.pk", phone: "+92 300 2222222", zone: "East Karachi", availability: "Busy", totalResolved: 38, joinDate: "2024-03-20" },
  { id: "R3", name: "Rescue Unit Charlie", email: "charlie@rms.gov.pk", phone: "+92 300 3333333", zone: "West Karachi", availability: "Available", totalResolved: 52, joinDate: "2023-11-10" },
  { id: "R4", name: "Rescue Unit Delta", email: "delta@rms.gov.pk", phone: "+92 300 4444444", zone: "Central Karachi", availability: "Inactive", totalResolved: 27, joinDate: "2024-06-01" },
  { id: "R5", name: "Rescue Unit Echo", email: "echo@rms.gov.pk", phone: "+92 300 5555555", zone: "North Karachi", availability: "Available", totalResolved: 31, joinDate: "2024-08-15" },
];

const dummyUsers = [
  { id: "U1", name: "Ahmed Khan", email: "ahmed@email.com", phone: "+92 300 1234567", cnic: "42101-1234567-8", totalRequests: 3 },
  { id: "U2", name: "Sara Ali", email: "sara@email.com", phone: "+92 311 9876543", cnic: "42201-9876543-2", totalRequests: 1 },
  { id: "U3", name: "Hassan Raza", email: "hassan@email.com", phone: "+92 322 5551234", cnic: "42301-5551234-4", totalRequests: 2 },
  { id: "U4", name: "Fatima Noor", email: "fatima@email.com", phone: "+92 333 7778899", cnic: "42401-7778899-6", totalRequests: 1 },
  { id: "U5", name: "Ali Zafar", email: "ali@email.com", phone: "+92 345 1112233", cnic: "42501-1112233-0", totalRequests: 4 },
  { id: "U6", name: "Zainab Sheikh", email: "zainab@email.com", phone: "+92 300 4445566", cnic: "42601-4445566-1", totalRequests: 2 },
  { id: "U7", name: "Bilal Ahmed", email: "bilal@email.com", phone: "+92 312 9998877", cnic: "42701-9998877-3", totalRequests: 1 },
  { id: "U8", name: "Nadia Hussain", email: "nadia@email.com", phone: "+92 321 6667788", cnic: "42801-6667788-5", totalRequests: 3 },
];

const dummyFeedback = [
  { id: "FB-001", requestId: "REQ-004", user: "Fatima Noor", responder: "Rescue Unit Alpha", rating: 5, comment: "Excellent response time. Very professional team.", date: "2026-02-19" },
  { id: "FB-002", requestId: "REQ-005", user: "Ali Zafar", responder: "Rescue Unit Charlie", rating: 4, comment: "Good response, but took slightly longer than expected.", date: "2026-02-18" },
  { id: "FB-003", requestId: "REQ-008", user: "Nadia Hussain", responder: "Rescue Unit Bravo", rating: 5, comment: "Saved my child's life. Incredibly grateful.", date: "2026-02-19" },
  { id: "FB-004", requestId: "REQ-003", user: "Hassan Raza", responder: "Rescue Unit Bravo", rating: 3, comment: "Response was okay but communication could be better.", date: "2026-02-20" },
];

const dummyLogs = [
  { id: "L1", timestamp: "2026-02-20 10:12:00", action: "Request Created", details: "REQ-007 created by Bilal Ahmed" },
  { id: "L2", timestamp: "2026-02-20 10:00:00", action: "Request Created", details: "REQ-003 created by Hassan Raza" },
  { id: "L3", timestamp: "2026-02-20 09:55:00", action: "Responder Assigned", details: "Rescue Unit Bravo assigned to REQ-003" },
  { id: "L4", timestamp: "2026-02-20 09:15:00", action: "Request Created", details: "REQ-002 created by Sara Ali" },
  { id: "L5", timestamp: "2026-02-20 08:35:00", action: "Responder Assigned", details: "Rescue Unit Alpha assigned to REQ-001" },
  { id: "L6", timestamp: "2026-02-20 08:30:00", action: "Request Created", details: "REQ-001 created by Ahmed Khan" },
  { id: "L7", timestamp: "2026-02-19 20:30:00", action: "Request Created", details: "REQ-008 created by Nadia Hussain" },
  { id: "L8", timestamp: "2026-02-19 21:15:00", action: "Request Resolved", details: "REQ-008 resolved by Rescue Unit Bravo" },
  { id: "L9", timestamp: "2026-02-19 15:30:00", action: "Request Resolved", details: "REQ-004 resolved by Rescue Unit Alpha" },
  { id: "L10", timestamp: "2026-02-19 14:00:00", action: "Request Created", details: "REQ-004 created by Fatima Noor" },
  { id: "L11", timestamp: "2026-02-18 17:00:00", action: "Request Cancelled", details: "REQ-006 cancelled by admin" },
  { id: "L12", timestamp: "2026-02-18 16:45:00", action: "Request Resolved", details: "REQ-005 resolved by Rescue Unit Charlie" },
];

export async function fetchRequests() {
  await delay(400);
  return dummyRequests;
}

export async function fetchResponders() {
  await delay(400);
  return [...dummyResponders];
}

export async function fetchUsers() {
  await delay(400);
  return dummyUsers;
}

export async function fetchFeedback() {
  await delay(400);
  return dummyFeedback;
}

export async function fetchLogs() {
  await delay(400);
  return dummyLogs;
}

export async function fetchReports() {
  await delay(300);
  return {
    totalRequests: dummyRequests.length,
    activeRequests: dummyRequests.filter(r => r.status !== "Resolved" && r.status !== "Cancelled").length,
    resolvedRequests: dummyRequests.filter(r => r.status === "Resolved").length,
    totalResponders: dummyResponders.length,
    avgResponseTime: "8.5 min",
    avgRating: "4.3",
  };
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
