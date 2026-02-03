'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { apiFetch } from '@/app/lib/apiFetch'
import ReceiptTemplate from '@/app/component/admin/receipt/ReceiptTemplate'

const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000'

interface AuctionOrder {
  Aid: number
  paid_at: string | null
  current_price: number

  Cname: string
  Cphone: string
  Caddress: string

  PROname: string
}

export default function AuctionOrderReceiptPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [data, setData] = useState<AuctionOrder | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return

    const load = async () => {
      try {
        setLoading(true)
        const res = await apiFetch(`${API}/auction-orders/${id}`)
        if (!res.ok) {
          setData(null)
          return
        }
        const d: AuctionOrder = await res.json()
        setData(d)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [id])

  if (loading) {
    return <p className="p-6 text-gray-600">⏳ กำลังโหลดใบเสร็จ...</p>
  }

  if (!data) {
    return <p className="p-6">ไม่พบข้อมูลออเดอร์ประมูล</p>
  }

  return (
    <div className="p-6 print:p-0 space-y-6 bg-white">
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
        receiptNo={`AUC-${data.Aid}`}
        date={
          data.paid_at
            ? new Date(data.paid_at).toLocaleString('th-TH')
            : new Date().toLocaleString('th-TH')
        }
        customer={{
          name: data.Cname,
          phone: data.Cphone,
          address: data.Caddress,
        }}
        items={[
          {
            name: data.PROname,
            qty: 1,
            price: data.current_price,
          },
        ]}
        total={data.current_price}
        paymentMethod="โอนผ่านบัญชี"
      />
    </div>
  )
}
