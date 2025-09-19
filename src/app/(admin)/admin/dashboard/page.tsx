'use client'

import AdminDashboardStats from "@/app/component/admin/AdminDashboardStats"





export default function AdminDashboardPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl text-black font-bold mb-6">📊 รายงานยอดขาย</h1>
      <AdminDashboardStats />
    </div>
  )
}

// 'use client'

// import { useEffect, useState } from 'react'

// interface Stats {
//   totalOrders: number
//   totalSales: number
//   cancelledOrders: number
//   failedOrders: number
//   salesToday: number
//   salesThisWeek: number
//   salesThisMonth: number
// }

// export default function AdminStatsPage() {
//   const [stats, setStats] = useState<Stats | null>(null)

//   useEffect(() => {
//     fetch('http://localhost:3000/stats')
//       .then((res) => res.json())
//       .then((data) => setStats(data))
//       .catch((err) => console.error('โหลดสถิติล้มเหลว:', err))
//   }, [])

//   if (!stats) return <p className="text-center mt-10 text-gray-500">⏳ กำลังโหลดข้อมูล...</p>

//   return (
//     <div className="p-6">
//       <h1 className="text-2xl font-bold mb-6">📊 รายงานยอดขาย</h1>
//       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
//         <StatBox label="ยอดขายรวมทั้งหมด" value={stats.totalSales.toLocaleString()} />
//         <StatBox label="จำนวนคำสั่งซื้อทั้งหมด" value={stats.totalOrders} />
//         <StatBox label="คำสั่งซื้อที่ยกเลิก" value={stats.cancelledOrders} />
//         <StatBox label="คำสั่งซื้อที่ล้มเหลว" value={stats.failedOrders} />
//         <StatBox label="ยอดขายวันนี้" value={stats.salesToday.toLocaleString()} />
//         <StatBox label="ยอดขายสัปดาห์นี้" value={stats.salesThisWeek.toLocaleString()} />
//         <StatBox label="ยอดขายเดือนนี้" value={stats.salesThisMonth.toLocaleString()} />
//       </div>
//     </div>
//   )
// }

// function StatBox({ label, value }: { label: string; value: string | number }) {
//   return (
//     <div className="bg-white shadow-md rounded-xl p-4 border border-gray-200 hover:shadow-lg transition">
//       <p className="text-sm text-gray-600">{label}</p>
//       <p className="text-xl font-semibold text-blue-600">{value}</p>
//     </div>
//   )
// }
