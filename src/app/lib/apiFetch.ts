const API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000";

export const apiFetch = async (url: string, init: RequestInit = {}) => {
  const isBrowser = typeof window !== "undefined";

  const token = isBrowser ? localStorage.getItem("token") : null;

  const headers = new Headers(init.headers);

  const isFormData =
    typeof FormData !== "undefined" && init.body instanceof FormData;

  if (!isFormData) {
    const method = (init.method || "GET").toUpperCase();
    if (!headers.has("Content-Type") && method !== "GET") {
      headers.set("Content-Type", "application/json");
    }
  }

  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(url.startsWith("http") ? url : `${API}${url}`, {
    ...init,
    headers,
  });

  // ห้ามแตะ window/localStorage ตอนฝั่ง server
  if (isBrowser && (res.status === 401 || res.status === 403)) {
    const path = window.location.pathname;
    if (path.startsWith("/admin")) {
      localStorage.clear();
      window.location.href = "/login";
    }
  }

  return res;
};