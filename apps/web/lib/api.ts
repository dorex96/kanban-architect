const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  const contentType = res.headers.get('content-type');

  if (!res.ok) {
    const body = contentType?.includes('application/json')
      ? await res.json().catch(() => ({}))
      : {};
    throw new Error(body.error || `Request failed: ${res.status}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  if (contentType?.includes('application/json')) {
    return res.json() as Promise<T>;
  }

  return (await res.text()) as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
