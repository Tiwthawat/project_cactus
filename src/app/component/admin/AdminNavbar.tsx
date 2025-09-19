// src/app/component/admin/AdminNavbar.tsx
'use client';

import Link from "next/link";

export default function AdminNavbar() {
  return (
    <nav className="bg-gray-900 text-white px-6 py-4 flex gap-6">
      <Link href="/admin/dashboard">แดชบอร์ด</Link>
      <Link href="/admin/products">สินค้า</Link>
      <Link href="/admin/orders">ออเดอร์</Link>
      <Link href="/admin/auctions">ประมูล</Link>
      <Link href="/admin/users">ผู้ใช้</Link>
      <Link href="/admin/stats">สถิติ</Link>
    </nav>
  );
}
