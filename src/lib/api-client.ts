export async function apiCall<T>(endpoint: string): Promise<T> {
  const res = await fetch(endpoint);
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error || `HTTP Error ${res.status}`);
  }
  return res.json() as Promise<T>;
}
