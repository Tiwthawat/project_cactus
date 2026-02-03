'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { apiFetch } from '@/app/lib/apiFetch'
import ReceiptTemplate from '@/app/component/admin/receipt/ReceiptTemplate'

const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000'

interface OrderItem {
  Oiid: number
  Pname: string
  Oquantity: number
  Oprice: number
}

interface FullOrder {
  Oid: number
  Odate: string
  Oprice: number
  Opayment: string

  Cname: string
  Cphone: string
  Caddress: string

  items: OrderItem[]
}

export default function OrderReceiptPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [order, setOrder] = useState<FullOrder | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return

    const load = async () => {
      try {
        setLoading(true)
        const res = await apiFetch(`${API}/orders/${id}`)
        if (!res.ok) {
          setOrder(null)
          return
        }
        const data: FullOrder = await res.json()
        setOrder(data)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [id])

  if (loading) {
    return <p className="p-6 text-gray-600">⏳ กำลังโหลดใบเสร็จ...</p>
  }

  if (!order) {
    return <p className="p-6">ไม่พบข้อมูลออเดอร์</p>
  }

  return (
    <div className="p-6 print:p-0 space-y-6">
      {/* ===== action bar (ไม่พิมพ์) ===== */}
      <div className="print:hidden flex justify-between items-center">
        <button
          onClick={() => router.back()}
          className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-100 text-sm"
        >
          ← กลับ
        </button>

        <button
          onClick={() => window.print()}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-semibold"
        >
          🖨 พิมพ์ใบเสร็จ
        </button>
      </div>

      {/* ===== receipt ===== */}
      <ReceiptTemplate
        receiptNo={`ORD-${order.Oid}`}
        date={new Date(order.Odate).toLocaleString('th-TH')}
        customer={{
          name: order.Cname,
          phone: order.Cphone,
          address: order.Caddress,
        }}
        items={order.items.map((i) => ({
          name: i.Pname,
          qty: i.Oquantity,
          price: i.Oprice,
        }))}
        total={order.Oprice}
        paymentMethod={
          order.Opayment === 'cod'
            ? 'ชำระปลายทาง (COD)'
            : 'โอนผ่านบัญชี'
        }
      />
    </div>
  )
}
