const API_BASE = import.meta.env.VITE_API_URL || 'https://api.lamalinked.in';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || res.statusText);
  }
  return res.json();
}

export const api = {
  // Auth
  register: (data: { email: string; password: string; name: string }) =>
    request<{ token: string; user: any }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    request<{ token: string; user: any }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getProfile: (token: string) =>
    request<any>('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  // Events
  logEvent: (token: string, event: any) =>
    request<void>('/api/events', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(event),
    }),

  getStats: (token: string, period: string) =>
    request<any>(`/api/events/stats?period=${period}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  // Stripe
  createCheckout: (installId: string) =>
    request<{ url: string }>('/api/stripe/create-checkout', {
      method: 'POST',
      body: JSON.stringify({ installId }),
    }),

  createPortal: (installId: string) =>
    request<{ url: string }>('/api/stripe/portal', {
      method: 'POST',
      body: JSON.stringify({ installId }),
    }),

  checkPremium: (installId: string) =>
    request<{ premium: boolean; expires: string | null }>(`/api/stripe/status?installId=${installId}`),
};
