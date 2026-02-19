'use client'

import AdminDashboardTasks from "@/app/component/admin/AdminDashboardStats"

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-emerald-50">
      <div className="max-w-7xl mx-auto px-8 py-10">
        
        {/* Header */}
        <div className="mb-10 border-b border-emerald-100 pb-6">
          <p className="text-xs uppercase tracking-widest text-emerald-600 font-semibold mb-3">
            Administration
          </p>

          <h1 className="text-3xl font-semibold text-emerald-900 tracking-wide">
            Dashboard Overview
          </h1>

          <p className="text-emerald-700/70 mt-2 text-sm">
            ตรวจสอบงานที่ต้องดำเนินการ เช่น การยืนยันการชำระเงิน การจัดส่ง และผู้ชนะการประมูล
          </p>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-8">
          <AdminDashboardTasks />
        </div>

      </div>
    </div>
  )
}
