const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';

export const apiFetch = async (url: string, init: RequestInit = {}) => {
  const token = localStorage.getItem("token");

  const headers = new Headers(init.headers);

  const isFormData =
    typeof FormData !== "undefined" && init.body instanceof FormData;

  if (!isFormData) {
    if (!headers.has("Content-Type") && init.method && init.method !== "GET") {
      headers.set("Content-Type", "application/json");
    }
  }

  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(
    url.startsWith("http") ? url : `${API}${url}`,
    { ...init, headers }
  );

  if (res.status === 401 || res.status === 403) {
    const path = window.location.pathname;
    if (path.startsWith("/admin")) {
      localStorage.clear();
      window.location.href = "/login";
    }
  }

  return res;
};
