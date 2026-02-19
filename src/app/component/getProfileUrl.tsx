const API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000";

export const getProfileUrl = (p: string | null, name?: string) => {
  if (!p) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name || "User"
    )}&background=cccccc&color=555555`;
  }

  return `${API.replace(/\/+$/, "")}/profiles/${p}`;
};
