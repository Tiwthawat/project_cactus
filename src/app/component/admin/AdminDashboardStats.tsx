'use client'

import { useEffect, useState } from 'react'
import AdminStatBox from './AdminStatBox'

interface Stats {
  totalOrders: number
  totalSales: number
  cancelledOrders: number
  failedOrders: number
  salesToday: number
  salesThisWeek: number
  salesThisMonth: number
}

export default function AdminDashboardStats() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    fetch('http://localhost:3000/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error('โหลดสถิติล้มเหลว:', err))
  }, [])

  if (!stats)
    return <p className="text-center mt-10 text-gray-500">⏳ กำลังโหลดข้อมูล...</p>

  return (
    <div className="grid text-black grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      <AdminStatBox label="ยอดขายรวมทั้งหมด" value={stats.totalSales.toLocaleString()} />
      <AdminStatBox label="จำนวนคำสั่งซื้อทั้งหมด" value={stats.totalOrders} />
      <AdminStatBox label="คำสั่งซื้อที่ยกเลิก" value={stats.cancelledOrders} />
      <AdminStatBox label="คำสั่งซื้อที่ล้มเหลว" value={stats.failedOrders} />
      <AdminStatBox label="ยอดขายวันนี้" value={stats.salesToday.toLocaleString()} />
      <AdminStatBox label="ยอดขายสัปดาห์นี้" value={stats.salesThisWeek.toLocaleString()} />
      <AdminStatBox label="ยอดขายเดือนนี้" value={stats.salesThisMonth.toLocaleString()} />
    </div>
  )
}

