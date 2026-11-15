const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export async function api(path, options = {}) {
  const res = await fetch(`${API}${path}`, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const post = (path) => api(path, { method: "POST" });
export const patch = (path) => api(path, { method: "PATCH" });
