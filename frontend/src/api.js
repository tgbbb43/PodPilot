// All requests use relative paths only. In dev, Vite's proxy (vite.config.js)
// forwards them to each service by host:port. In Docker/Kubernetes, nginx
// (nginx.conf.template) forwards them by service DNS name. The app itself
// never hardcodes a hostname.

function getToken() {
  return localStorage.getItem('kubekanban_token');
}

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(path, { ...options, headers });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || `request failed with status ${res.status}`);
  }
  return data;
}

export const auth = {
  register: (username, password) =>
    request('/api/auth/register', { method: 'POST', body: JSON.stringify({ username, password }) }),
  login: (username, password) =>
    request('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  getUser: (id) => request(`/api/users/${id}`),
  saveSession: (token, user) => {
    localStorage.setItem('kubekanban_token', token);
    localStorage.setItem('kubekanban_user', JSON.stringify(user));
  },
  loadSession: () => {
    const token = getToken();
    const userRaw = localStorage.getItem('kubekanban_user');
    if (!token || !userRaw) return null;
    return { token, user: JSON.parse(userRaw) };
  },
  clearSession: () => {
    localStorage.removeItem('kubekanban_token');
    localStorage.removeItem('kubekanban_user');
  },
};

export const tasks = {
  list: () => request('/api/tasks'),
  create: (task) => request('/api/tasks', { method: 'POST', body: JSON.stringify(task) }),
  update: (id, updates) => request(`/api/tasks/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
  remove: (id) => request(`/api/tasks/${id}`, { method: 'DELETE' }),
};

export const notifications = {
  list: (userId) => request(`/api/notifications/${userId}`),
};
