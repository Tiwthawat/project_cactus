'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Order {
  Oid: number
  Odate: string
  Ostatus: string
  Oprice: number
  products: string
}

export default function OrdersOfUserPage() {
  const { id } = useParams()
  const [orders, setOrders] = useState<Order[]>([])
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const makeCode = (prefix: string, id: number) =>
  `${prefix}:${String(id).padStart(4, '0')}`;

  useEffect(() => {
    fetch(`http://localhost:3000/orders/customer/${id}`)
      .then(res => res.json())
      .then(data => {
        console.log("✅ data จาก backend:", data)
        setOrders(Array.isArray(data) ? data : [])
      })
  }, [id])

  const filteredOrders = filterStatus === 'all'
    ? orders
    : orders.filter(order => order.Ostatus === filterStatus)

  return (
    <div className="p-6">
      <h1 className="text-2xl text-black font-bold mb-4">คำสั่งซื้อของลูกค้า ID: {id}</h1>

      <div className="mb-4">
        <label className="text-black mr-2 font-semibold">กรองสถานะ:</label>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1"
        >
          <option value="all">ทั้งหมด</option>
          <option value="paid">ชำระเงินแล้ว</option>
          <option value="waiting">รอตรวจสอบ</option>
          <option value="pending">รอชำระ</option>
          <option value="cancelled">ยกเลิกแล้ว</option>
          <option value="shipped">จัดส่งแล้ว</option>
        </select>
      </div>

      <table className="w-full border bg-white">
        <thead>
          <tr>
            <th className="border text-black p-2">รหัสคำสั่งซื้อ</th>
            <th className="border text-black p-2">วันที่</th>
            <th className="border text-black p-2">สถานะ</th>
            <th className="border text-black p-2">ยอดรวม</th>
            <th className="border text-black p-2">สินค้า</th>
          </tr>
        </thead>
        <tbody>
          {filteredOrders.length > 0 ? (
            filteredOrders.map(order => (
              <tr key={order.Oid}>
                                <td className="border text-black p-2 font-mono text-sm">
                  <Link
                    href={`/admin/orders/${order.Oid}`}
                    className="text-blue-600 hover:underline"
                  >
                    {makeCode('ord', order.Oid)}
                  </Link>
                </td>

                <td className="border text-black p-2">
                  {new Date(order.Odate).toLocaleDateString('th-TH', {
                    year: 'numeric', month: 'short', day: 'numeric'
                  })}
                </td>
                <td className={`border p-2 font-semibold text-center rounded ${
                  order.Ostatus === 'paid'
                    ? 'bg-green-100 text-green-700'
                    : order.Ostatus === 'waiting'
                    ? 'bg-yellow-100 text-yellow-700'
                    : order.Ostatus === 'pending'
                    ? 'bg-gray-100 text-gray-700'
                    : order.Ostatus === 'cancelled'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-white text-black'
                }`}>
                  {order.Ostatus}
                </td>
                <td className="border text-black p-2">
                  {order.Oprice ?? "–"} บาท
                </td>
                <td className="border text-black p-2">{order.products}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="text-center text-black p-4">ไม่มีข้อมูลคำสั่งซื้อ</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
