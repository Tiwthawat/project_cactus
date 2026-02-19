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

function clsx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(' ')
}

function softCard(extra?: string) {
  return clsx(
    'bg-white/80 backdrop-blur rounded-2xl shadow-lg border border-slate-200',
    extra
  )
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
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/35 to-slate-50 flex items-center justify-center">
        <div className={softCard('p-8 text-center')}>
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-600 font-medium">กำลังโหลดใบเสร็จ</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/35 to-slate-50 flex items-center justify-center">
        <div className={softCard('p-10 text-center')}>
          <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
            —
          </div>
          <p className="mt-4 text-slate-900 text-xl font-bold">ไม่พบข้อมูลออเดอร์ประมูล</p>
         
        </div>
      </div>
    )
  }

  const dateStr = data.paid_at
    ? new Date(data.paid_at).toLocaleString('th-TH')
    : new Date().toLocaleString('th-TH')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/35 to-slate-50">
      <div className="p-6 pt-8 max-w-4xl mx-auto print:p-0">
        {/* ===== action bar (ไม่พิมพ์) ===== */}
        <div className={clsx(softCard('p-4 mb-6'), 'print:hidden')}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/70 px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm">
                Auction Receipt
              </div>
              <div className="mt-2 text-sm text-slate-500">
                ใบเสร็จออเดอร์ประมูล • <span className="font-mono">AUC-{data.Aid}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => router.back()}
                className="inline-flex items-center justify-center px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-semibold shadow-sm transition"
              >
                กลับ
              </button>

              <button
                onClick={() => window.print()}
                className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-sm transition"
              >
                พิมพ์ใบเสร็จ
              </button>
            </div>
          </div>
        </div>

        {/* ===== receipt wrapper ===== */}
        <div className={clsx(softCard('p-0 overflow-hidden'), 'print:border-0 print:shadow-none print:bg-white')}>
          {/* แถบหัวบาง ๆ เฉพาะตอนดูจอ */}
          <div className="hidden print:hidden md:block px-6 py-4 border-b border-slate-200 bg-white/70">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-slate-900">Receipt</div>
              <div className="text-xs text-slate-500">{dateStr}</div>
            </div>
          </div>

          <div className="p-6 print:p-0 bg-white">
            <ReceiptTemplate
              receiptNo={`AUC-${data.Aid}`}
              date={dateStr}
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
        </div>

        {/* note (ไม่พิมพ์) */}
        <div className="mt-4 text-xs text-slate-500 print:hidden">
          * ตอนพิมพ์ ระบบจะซ่อนแถบปุ่มอัตโนมัติ
        </div>
      </div>
    </div>
  )
}
