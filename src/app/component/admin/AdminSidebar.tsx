"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Gavel,
  Package,
  Tag,
  ShoppingCart,
  ClipboardList,
  Users,
  BarChart3,
  Star,
  MessageSquare,
  LogOut,
} from "lucide-react";


const links = [
  { label: "แดชบอร์ด", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "ประมูล", href: "/admin/auctions", icon: Gavel },
  { label: "สินค้า", href: "/admin/products", icon: Package },
  { label: "สินค้าประมูล", href: "/admin/auction-products", icon: Tag },
  { label: "ออเดอร์", href: "/admin/orders", icon: ShoppingCart },
  { label: "ออเดอร์ประมูล", href: "/admin/auction-orders", icon: ClipboardList },
  { label: "ผู้ใช้", href: "/admin/users", icon: Users },
  { label: "สถิติ", href: "/admin/stats", icon: BarChart3 },
  { label: "รีวิวลูกค้า", href: "/admin/reviews", icon: Star },
  { label: "กระทู้", href: "/forum", icon: MessageSquare },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.clear();
    window.dispatchEvent(new Event("logout"));
    router.replace("/login");
  };

  return (
    <aside className="w-64 h-screen bg-emerald-950 text-emerald-50 flex flex-col border-r border-emerald-800">
      
      {/* Header */}
      <div className="px-6 py-8 border-b border-emerald-800">
        <p className="text-xs tracking-widest uppercase text-emerald-400 mb-2">
          Administration
        </p>
        <h2 className="text-2xl font-semibold tracking-wide">
          Control Panel
        </h2>
      </div>

      {/* Menu */}
      <ul className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const active = pathname.startsWith(link.href);

          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium ${
                  active
                    ? "bg-emerald-800 text-white shadow-inner"
                    : "text-emerald-300 hover:bg-emerald-900 hover:text-white"
                }`}
              >
                <Icon size={18} />
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Logout */}
      <div className="p-4 border-t border-emerald-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold bg-emerald-800 hover:bg-emerald-700 transition"
        >
          <LogOut size={18} />
          ออกจากระบบ
        </button>
      </div>
    </aside>
  );
}
