export function getAuthHeaders(): HeadersInit {
  if (typeof window === 'undefined') return {};

  const token = localStorage.getItem('tg_auth_token');
  const userStr = localStorage.getItem('tg_auth_user');

  const headers: Record<string, string> = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user.id) headers['x-user-id'] = user.id;
      if (user.email) headers['x-user-email'] = user.email;
    } catch (e) {
      // Ignore
    }
  }

  return headers;
}

export async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  const authHeaders = getAuthHeaders();

  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/+$/, '');
  const url = input.startsWith('http') ? input : `${baseUrl}${input.startsWith('/') ? '' : '/'}${input}`;

  const mergedHeaders = {
    ...authHeaders,
    ...(init?.headers || {}),
  };

  return fetch(url, {
    ...init,
    headers: mergedHeaders,
  });
}
