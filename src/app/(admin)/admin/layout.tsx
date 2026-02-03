"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import AdminSidebar from "@/app/component/admin/AdminSidebar";
import AdminLogoutButton from "./AdminLogoutButton";
import "@/app/globals.css";
import { isAdmin } from "@/app/lib/checkAdmin";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    if (!isAdmin()) {
      router.replace("/login");
    }
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex flex-1">
        {/* ❌ ไม่ต้องพิมพ์ */}
        <div className="print:hidden">
          <AdminSidebar />
        </div>

        {/* ✅ เนื้อหาหลัก (พิมพ์ได้) */}
        <main className="flex-1 p-6 overflow-y-auto print:p-0">
          {children}
        </main>
      </div>

      {/* ❌ ไม่ต้องพิมพ์ */}
      <div className="print:hidden">
        <AdminLogoutButton />
      </div>
    </div>
  );
}
