// ===== api.js =====
// Shared API helper — replaces localStorage calls

const API = 'http://localhost:3000/api';

function getToken()       { return localStorage.getItem('gt_token'); }
function setToken(t)      { localStorage.setItem('gt_token', t); }
function clearToken()     { localStorage.removeItem('gt_token'); }
function getSession()     { return JSON.parse(localStorage.getItem('gt_session') || 'null'); }
function setSession(s)    { localStorage.setItem('gt_session', JSON.stringify(s)); }
function clearSession()   { localStorage.removeItem('gt_session'); }

async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['x-token'] = token;

  const res  = await fetch(API + path, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Server error');
  return data;
}

// Auth
async function apiRegister(name, email, password) {
  return apiFetch('/register', { method: 'POST', body: JSON.stringify({ name, email, password }) });
}

async function apiLogin(email, password) {
  const data = await apiFetch('/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  setToken(data.token);
  setSession({ name: data.name, email: data.email });
  return data;
}

async function apiLogout() {
  try { await apiFetch('/logout', { method: 'POST' }); } catch(_) {}
  clearToken();
  clearSession();
  window.location.href = 'login.html';
}

// Inventory
async function apiGetInventory()           { return apiFetch('/inventory'); }
async function apiAddItem(name, qty, price){ return apiFetch('/inventory', { method: 'POST', body: JSON.stringify({ name, quantity: qty, price }) }); }
async function apiEditItem(id, name, qty, price) { return apiFetch('/inventory/' + id, { method: 'PUT', body: JSON.stringify({ name, quantity: qty, price }) }); }
async function apiDeleteItem(id)           { return apiFetch('/inventory/' + id, { method: 'DELETE' }); }
