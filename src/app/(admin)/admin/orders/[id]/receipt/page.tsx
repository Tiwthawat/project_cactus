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

function clsx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(' ')
}

function Card({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={clsx(
        'bg-white/80 backdrop-blur rounded-2xl shadow-lg border border-slate-200 overflow-hidden',
        className
      )}
    >
      {children}
    </div>
  )
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
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/35 to-slate-50 flex items-center justify-center print:hidden">
        <div className="bg-white/80 backdrop-blur rounded-2xl border border-slate-200 shadow-lg px-6 py-5 text-slate-600 font-semibold">
          กำลังโหลดใบเสร็จ
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/35 to-slate-50">
        <div className="p-6 pt-10 max-w-5xl mx-auto">
          <Card className="p-10 text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
              —
            </div>
            <p className="mt-4 text-slate-900 text-xl font-bold">ไม่พบข้อมูลออเดอร์</p>
            <p className="mt-1 text-slate-500">ตรวจสอบรหัสออเดอร์อีกครั้ง</p>

            <div className="mt-6">
              <button
                onClick={() => router.back()}
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-sm transition"
              >
                กลับ
              </button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  const paymentMethod =
    order.Opayment === 'cod' ? 'ชำระปลายทาง (COD)' : 'โอนผ่านบัญชี'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/35 to-slate-50 print:bg-white">
      <div className="p-6 pt-8 max-w-5xl mx-auto print:p-0 space-y-6">
        {/* Header */}
        <div className="print:hidden">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/70 px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm">
            Receipt
          </div>

          <div className="mt-4 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
                ใบเสร็จรับเงิน
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                ตรวจสอบความถูกต้องก่อนพิมพ์ และใช้โหมด Print ของเบราว์เซอร์
              </p>
            </div>

            {/* action bar (ไม่พิมพ์) */}
            <div className="flex gap-2">
              

              <button
                onClick={() => window.print()}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold shadow-lg transition"
              >
                พิมพ์ใบเสร็จ
              </button>
            </div>
          </div>
        </div>

        {/* Receipt */}
        <Card className="print:shadow-none print:border-0 print:bg-white">
          <div className="p-5 md:p-6 print:p-0">
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
              paymentMethod={paymentMethod}
            />
          </div>
        </Card>

        {/* footer note */}
        <div className="print:hidden text-xs text-slate-500">
          หมายเหตุ: ตอนพิมพ์ แถบควบคุมจะถูกซ่อนอัตโนมัติ เหลือเฉพาะใบเสร็จ
        </div>
      </div>
    </div>
  )
}
