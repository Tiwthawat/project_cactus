export const apiFetch = async (url: string, init: RequestInit = {}) => {
  const token = localStorage.getItem("token");

  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.method && init.method !== "GET") {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(url, { ...init, headers });

  // ถ้าโดน 401/403 ให้เด้งออกจากโซนแอดมิน
  if (res.status === 401 || res.status === 403) {
    // ล้าง session ให้จบ
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    localStorage.removeItem("admin");
    window.location.href = "/login";
  }

  return res;
};
