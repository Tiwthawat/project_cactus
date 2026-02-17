'use client'

import AdminDashboardTasks from "@/app/component/admin/AdminDashboardStats"


export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50">
      <div className="p-6 pt-8">
        <div className="mb-8">
          <div className="inline-block bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2 rounded-full text-sm font-semibold mb-4">
            แผงงานแอดมิน
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            ✅ จัดการงาน
          </h1>
          <p className="text-gray-600 mt-2">โฟกัสงานที่ต้องทำ: ตรวจสลิป / จัดส่ง / ผู้ชนะประมูล</p>
        </div>

        <AdminDashboardTasks />
      </div>
    </div>
  )
}
