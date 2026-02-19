"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import AdminSidebar from "@/app/component/admin/AdminSidebar";
import "@/app/globals.css";
import { isAdmin } from "@/app/lib/checkAdmin";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    if (!isAdmin()) {
      router.replace("/login");
    }
  }, [router]);

  return (
    <div className="flex min-h-screen">
     
      <aside className="print:hidden sticky top-0 h-screen">
        <AdminSidebar />
      </aside>

      
      <main className="flex-1 p-6 overflow-y-auto print:p-0">
        {children}
      </main>
    </div>
  );
}
