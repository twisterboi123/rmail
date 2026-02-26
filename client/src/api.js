const API_BASE = '/api';

/**
 * Thin wrapper around fetch that adds JSON headers and auth token.
 */
async function request(path, options = {}) {
  const token = localStorage.getItem('rmail_token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const msg = data?.error || `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return data;
}

// Auth
export const login = (email, password) =>
  request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });

export const getMe = () => request('/auth/me');

// Emails
export const getInbox = (limit = 30) => request(`/emails/inbox?limit=${limit}`);
export const getEmail = (uid) => request(`/emails/${uid}`);
export const sendEmail = (mail) =>
  request('/emails/send', { method: 'POST', body: JSON.stringify(mail) });
export const toggleSpam = (uid) =>
  request(`/emails/${uid}/spam`, { method: 'POST' });

// Users (admin)
export const getUsers = () => request('/users');
export const createUser = (data) =>
  request('/users', { method: 'POST', body: JSON.stringify(data) });
export const deleteUser = (id) =>
  request(`/users/${id}`, { method: 'DELETE' });

// Mail settings
export const updateMailSettings = (userId, data) =>
  request(`/users/${userId}/mail-settings`, { method: 'PUT', body: JSON.stringify(data) });
