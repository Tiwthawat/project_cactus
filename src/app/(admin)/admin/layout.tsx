import AdminNavbar from "@/app/component/admin/AdminNavbar";
import AdminSidebar from "@/app/component/admin/AdminSidebar";
import "@/app/globals.css";


export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <AdminNavbar />
      <div className="flex flex-1">
        <AdminSidebar />
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
