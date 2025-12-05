// src/core/api.js

// Always hit the Express backend on port 3000
const BASE_URL = 'http://localhost:3000/api';

// Full DB (for Historical)
export async function getDb() {
  const res = await fetch(`${BASE_URL}/db`);
  if (!res.ok) throw new Error('Error loading database');
  return res.json();
}

// Detective by DNI
export async function fetchDetectiveByDni(dni) {
  if (!dni) return null;
  const normalized = dni.toUpperCase().replace(/\s+/g, '');

  const res = await fetch(`${BASE_URL}/detectives/${encodeURIComponent(normalized)}`);

  if (res.status === 404) {
    // Detective not found is not an error for the UI: just return null
    return null;
  }

  if (!res.ok) {
    throw new Error(`Error loading detective (status ${res.status})`);
  }

  return res.json(); // { ok: true, detective }
}

// Register new application
export async function registerApplication(payload) {
  const res = await fetch(`${BASE_URL}/applications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  let data;
  try {
    data = await res.json();
  } catch (e) {
    // Server responded with non-JSON (likely HTML)
    throw new Error(
      `Server returned unexpected format (Code: ${res.status}). Expected JSON.`,
    );
  }

  if (!res.ok) {
    return {
      ok: false,
      error: data.error || `Server responded with error ${res.status}`,
    };
  }

  return { ok: true, ...data }; // { ok:true, application: {…} }
}

// ✅ Get ALL applications
export async function getAllApplications() {
  const res = await fetch(`${BASE_URL}/applications`);
  if (!res.ok) throw new Error('Error loading applications');
  return res.json();
}

// ✅ Approve application + assign level
export async function approveApplication(applicationId, level) {
  const res = await fetch(`${BASE_URL}/applications/${applicationId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ level }),
  });

  const data = await res.json();
  if (!res.ok) return { ok: false, error: data.error };
  return { ok: true };
}

// ✅ Get all levels
export async function getLevels() {
  const res = await fetch(`${BASE_URL}/levels`);
  if (!res.ok) throw new Error('Error loading levels');
  return res.json();
}

// ✅ Update level price
export async function updateLevelPrice(level, price) {
  const res = await fetch(`${BASE_URL}/levels/${level}/price`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ price }),
  });

  const data = await res.json();
  if (!res.ok) return { ok: false, error: data.error };
  return { ok: true };
}

// ✅ Promote detective
export async function promoteDetective(dni, newLevel) {
  const res = await fetch(`${BASE_URL}/detectives/${dni}/promote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newLevel }),
  });

  const data = await res.json();
  if (!res.ok) return { ok: false, error: data.error };
  return { ok: true };
}
// ✅ Reject application
export async function rejectApplication(applicationId) {
  const res = await fetch(`${BASE_URL}/applications/${applicationId}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  const data = await res.json();
  if (!res.ok) return { ok: false, error: data.error };
  return { ok: true };
}

export async function getReports() {
  const res = await fetch(`${BASE_URL}/reports`);
  return res.json();
}

export async function createReport(payload) {
  const res = await fetch(`${BASE_URL}/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function getCourts() {
  const res = await fetch(`${BASE_URL}/courts`);
  return res.json();
}

export async function createCourt(payload) {
  const res = await fetch(`${BASE_URL}/courts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function updateCourt(cif, payload) {
  const res = await fetch(`${BASE_URL}/courts/${cif}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function deleteCourt(cif) {
  const res = await fetch(`${BASE_URL}/courts/${cif}`, {
    method: "DELETE"
  });
  return res.json();
}

export async function getSlips() {
  const res = await fetch(`${BASE_URL}/slips`);
  return res.json();
}

export async function createSlip(payload) {
  const res = await fetch(`${BASE_URL}/slips`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return res.json();
}
export async function getVipCases() {
  const res = await fetch(`${BASE_URL}/vip`);
  return res.json();
}

export async function createVipCase(payload) {
  const res = await fetch(`${BASE_URL}/vip`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function assignVipCase(id, payload) {
  const res = await fetch(`${BASE_URL}/vip/${id}/assign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function finaliseVipCase(id, payload) {
  const res = await fetch(`${BASE_URL}/vip/${id}/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return res.json();
}
