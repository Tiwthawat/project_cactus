'use client'

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { label: "แดชบอร์ด", href: "/admin/dashboard", icon: "📊" },
  { label: "สินค้า", href: "/admin/products", icon: "🌵" },
  { label: "ออเดอร์", href: "/admin/orders", icon: "📦" },
  { label: "ประมูล", href: "/admin/auctions", icon: "🔨" },
  { label: "สินค้าประมูล", href: "/admin/auction-products", icon: "🏷️" },
  { label: "ออเดอร์ประมูล", href: "/admin/auction-orders", icon: "📋" },
  { label: "ประวัติการบิด", href: "/admin/AdminBiddingLogs", icon: "📜" },
  { label: "ผู้ใช้", href: "/admin/users", icon: "👥" },
  { label: "สถิติ", href: "/admin/stats", icon: "📈" },
  { label: "ดูรีวิวจากลูกค้า", href: "/admin/reviews", icon: "⭐" },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 min-h-screen bg-gradient-to-br from-gray-800 to-gray-900 text-white p-6 shadow-2xl">
      <div className="mb-8">
        <div className="inline-block bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-2 rounded-full text-sm font-semibold mb-2">
          Admin Panel
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
          จัดการระบบ
        </h2>
      </div>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${pathname.startsWith(link.href)
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
    </aside>
  );
}
