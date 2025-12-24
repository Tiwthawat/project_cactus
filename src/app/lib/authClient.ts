// lib/authClient.ts
export type Role = "admin" | "user";

export const getToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
};

export const getRole = (): Role | null => {
  if (typeof window === "undefined") return null;
  const r = localStorage.getItem("role");
  return r === "admin" || r === "user" ? r : null;
};

export const isLoggedIn = () => !!getToken();
