const apiBase = import.meta.env.VITE_API_URL || '/api';

async function request(path, options = {}) {
  const response = await fetch(`${apiBase}${path}`, { headers: { 'Content-Type': 'application/json' }, ...options });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const getDevices = () => request('/devices');
export const refreshDevices = () => request('/refresh', { method: 'POST' });
export const recommend = (body) => request('/recommend', { method: 'POST', body: JSON.stringify(body) });
