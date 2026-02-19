"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const links = [
  { label: "แดชบอร์ด", href: "/admin/dashboard", icon: "📊" },
  { label: "ประมูล", href: "/admin/auctions", icon: "🔨" },
  { label: "สินค้า", href: "/admin/products", icon: "🌵" },
  { label: "สินค้าประมูล", href: "/admin/auction-products", icon: "🏷️" },
  { label: "ออเดอร์", href: "/admin/orders", icon: "📦" },
   { label: "ออเดอร์ประมูล", href: "/admin/auction-orders", icon: "📋" },
  { label: "ผู้ใช้", href: "/admin/users", icon: "👥" },
  { label: "สถิติ", href: "/admin/stats", icon: "📈" },
  { label: "ดูรีวิวจากลูกค้า", href: "/admin/reviews", icon: "⭐" },
  { label: "กระทู้", href: "/forum", icon: "💬" }, 
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("admin");
    localStorage.removeItem("role");

    window.dispatchEvent(new Event("logout"));
    router.replace("/login");
  };

  return (
    <aside className="w-64 h-screen bg-gradient-to-br from-gray-800 to-gray-900 text-white p-6 shadow-2xl flex flex-col">
      {/* header */}
      <div className="mb-8">
        <div className="inline-block bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-2 rounded-full text-sm font-semibold mb-2">
          Admin Panel
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
          จัดการระบบ
        </h2>
      </div>

      {/* menu (ถ้าเยอะมากค่อยเลื่อนเฉพาะเมนู) */}
      <ul className="space-y-2 overflow-y-auto pr-1">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                pathname.startsWith(link.href)
                  ? "bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg scale-105"
                  : "hover:bg-gray-700/50 hover:translate-x-1"
              }`}
            >
              <span className="text-2xl">{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          </li>
        ))}
      </ul>

      {/* bottom logout */}
      <div className="mt-auto pt-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-300 bg-red-600 hover:bg-red-700 shadow-lg"
        >
          <span className="text-2xl"> </span>
          <span>ออกจากระบบ</span>
        </button>
      </div>
    </aside>
  );
}
