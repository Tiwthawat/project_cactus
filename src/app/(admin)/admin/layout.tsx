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
      router.replace("/login"); // หรือหน้าอื่นที่อยากให้เด้งไป
    }
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex flex-1">
        <AdminSidebar />
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>

      <AdminLogoutButton />
    </div>
  );
}
