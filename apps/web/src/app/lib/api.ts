const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export async function api<T = unknown>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('lbp_token');
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `HTTP ${res.status}`);
  }
  return res.json();
}
