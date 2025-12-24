'use client';

import { useRouter } from "next/navigation";

export default function AdminLogoutButton() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("admin");
    localStorage.removeItem("role");

    // เผื่อ Navbar / state อื่นฟัง event อยู่
    window.dispatchEvent(new Event("logout"));

    router.replace("/login");
  };

  return (
    <button
      onClick={handleLogout}
      className="
        fixed bottom-6 right-6
        bg-red-600 hover:bg-red-700
        text-white font-semibold
        px-5 py-3 rounded-full
        shadow-lg
        transition
      "
    >
      ออกจากระบบ
    </button>
  );
}
