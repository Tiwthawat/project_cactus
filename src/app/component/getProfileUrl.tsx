export const getProfileUrl = (p: string | null, name?: string) => {
  if (!p) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name || "User"
    )}&background=cccccc&color=555555`;
  }
  return `http://localhost:3000/profiles/${p}`;
};
