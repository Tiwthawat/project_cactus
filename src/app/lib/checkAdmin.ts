// lib/checkAdmin.ts
export const isAdmin = () => {
  if (typeof window === "undefined") return false;
  const token = localStorage.getItem("token");
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role === "admin";
  } catch {
    return false;
  }
};
