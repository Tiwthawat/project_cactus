export const apiFetch = async (url: string, init: RequestInit = {}) => {
  const token = localStorage.getItem("token");

  const headers = new Headers(init.headers);

  const isFormData =
    typeof FormData !== "undefined" && init.body instanceof FormData;

  // ❗ ถ้าเป็น FormData ห้าม set Content-Type เอง
  if (!isFormData) {
    if (!headers.has("Content-Type") && init.method && init.method !== "GET") {
      headers.set("Content-Type", "application/json");
    }
  }

  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(url, { ...init, headers });

  // เด้งเฉพาะ admin
  if (res.status === 401 || res.status === 403) {
    const path = window.location.pathname;
    const isAdminZone = path.startsWith("/admin");

    if (isAdminZone) {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("user");
      localStorage.removeItem("admin");
      window.location.href = "/login";
    }
  }

  return res;
};
