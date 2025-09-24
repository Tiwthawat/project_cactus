'use client'

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { label: "แดชบอร์ด", href: "/admin/dashboard" },
  { label: "สินค้า", href: "/admin/products" },
  { label: "ออเดอร์", href: "/admin/orders" },
  { label: "ประมูล", href: "/admin/auctions" },
  { label: "สินค้าประมูล", href: "/admin/auction-products" },
  { label: "ผู้ใช้", href: "/admin/users" },
  { label: "สถิติ", href: "/admin/stats" },
  { label: "ดูรีวิวจากลูกค้า", href: "/admin/reviews" },
];



export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 min-h-screen bg-gray-900 text-white p-4">
      <h2 className="text-lg font-bold mb-4">Admin</h2>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className={`block px-2 py-1 rounded hover:bg-gray-700 ${
                pathname.startsWith(link.href) ? "bg-gray-700" : ""
              }`}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
