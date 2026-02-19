'use client'

import { apiFetch } from '@/app/lib/apiFetch'
import StatusBadge from '@/app/component/StatusBadge'
import {
  getMeta,
  AUCTION_PAY_STATUS,
  AUCTION_SHIP_STATUS,
  StatusMeta,
} from '@/app/lib/status'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

type PaymentStatus =
  | 'pending_payment'
  | 'payment_review'
  | 'paid'
  | 'expired'
  | string

type ShipStatus = 'pending' | 'shipped' | 'delivered' | null

interface AuctionOrder {
  Aid: number
  PROid: number
  PROname: string
  Cname: string
  current_price: number
  payment_status: PaymentStatus

  // db อาจเก็บ 'shipping' แต่ใน status map เราใช้ 'shipped'
  shipping_status?: 'pending' | 'shipping' | 'shipped' | 'delivered' | null
  shipping_company?: string | null
  tracking_number?: string | null

  end_time?: string | null
  paid_at?: string | null
}

const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000'
const STORAGE_KEY = 'admin_auction_orders_year'

function clsx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(' ')
}

function fmtBaht(n: number) {
  return Number(n || 0).toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function fmtDateTime(s?: string | null) {
  if (!s) return '—'
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

type Filter = 'all' | 'pending_payment' | 'payment_review' | 'paid'
type ShipFilter = 'all' | 'pending' | 'shipped' | 'delivered'

function pill(active: boolean) {
  return clsx(
    'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold border transition shadow-sm',
    active
      ? 'bg-emerald-600 text-white border-emerald-600 shadow'
      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
  )
}

function pillCount(active: boolean) {
  return clsx(
    'min-w-[28px] h-6 px-2 rounded-full text-xs font-bold flex items-center justify-center',
    active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
  )
}

function softCard() {
  return 'bg-white/80 backdrop-blur rounded-2xl shadow-lg border border-slate-200 overflow-hidden'
}

export default function AuctionOrdersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const nowYear = new Date().getFullYear()
  const MIN_YEAR = 2000
  const MAX_YEAR = nowYear + 1
  const isValidYear = (v: number) =>
    Number.isFinite(v) && v >= MIN_YEAR && v <= MAX_YEAR

  // ✅ กัน hydration: เริ่มด้วย nowYear แล้วค่อยอ่านจริงตอน mount
  const [year, setYear] = useState<number>(nowYear)
  const [ready, setReady] = useState(false)

  const [orders, setOrders] = useState<AuctionOrder[]>([])
  const [filterStatus, setFilterStatus] = useState<Filter>('pending_payment')
  const [shipFilter, setShipFilter] = useState<ShipFilter>('all')
  const [loading, setLoading] = useState(true)

  // ---------- status helpers ----------
  const getPaymentMeta = (raw: PaymentStatus): StatusMeta =>
    getMeta(AUCTION_PAY_STATUS, raw)

  const normalizeShip = (o: AuctionOrder): ShipStatus => {
    const paid = String(o.payment_status || '').trim() === 'paid'
    if (!paid) return null

    const sRaw = String(o.shipping_status || '').trim()
    const hasTracking = Boolean(o.tracking_number)

    if (sRaw === 'delivered') return 'delivered'
    if (sRaw === 'shipping' || sRaw === 'shipped' || hasTracking) return 'shipped'
    return 'pending'
  }

  const getShipMeta = (o: AuctionOrder): StatusMeta => {
    const s = normalizeShip(o)
    if (!s) return { label: '—', tone: 'gray' }
    return getMeta(AUCTION_SHIP_STATUS, s)
  }

  // ✅ 1) mount แล้วค่อยอ่าน year: URL > localStorage > nowYear
  useEffect(() => {
    const fromUrl = Number(searchParams.get('year'))
    if (isValidYear(fromUrl)) {
      setYear(fromUrl)
      setReady(true)
      return
    }

    const saved = Number(localStorage.getItem(STORAGE_KEY))
    if (isValidYear(saved)) {
      setYear(saved)
      setReady(true)
      return
    }

    setReady(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ✅ 2) ready แล้วค่อย sync year -> localStorage + URL
  useEffect(() => {
    if (!ready) return

    localStorage.setItem(STORAGE_KEY, String(year))

    const params = new URLSearchParams(searchParams.toString())
    if (params.get('year') !== String(year)) {
      params.set('year', String(year))
      router.replace(`?${params.toString()}`)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, ready])

  // ✅ 3) โหลดข้อมูลตามปี
  useEffect(() => {
    if (!ready) return

    const load = async () => {
      try {
        setLoading(true)
        const res = await apiFetch(`${API}/auction-orders?year=${year}`)
        if (!res.ok) {
          setOrders([])
          return
        }
        const data: unknown = await res.json()
        setOrders(Array.isArray(data) ? (data as AuctionOrder[]) : [])
      } catch (err) {
        console.error(err)
        setOrders([])
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [year, ready])

  const counts = useMemo(() => {
    const all = Array.isArray(orders) ? orders : []
    return {
      all: all.length,
      pending_payment: all.filter((o) => o.payment_status === 'pending_payment').length,
      payment_review: all.filter((o) => o.payment_status === 'payment_review').length,
      paid: all.filter((o) => o.payment_status === 'paid').length,
    }
  }, [orders])

  const shipCounts = useMemo(() => {
    const all = Array.isArray(orders) ? orders : []
    const paidOnly = all.filter((o) => String(o.payment_status || '').trim() === 'paid')
    return {
      all: paidOnly.length,
      pending: paidOnly.filter((o) => normalizeShip(o) === 'pending').length,
      shipped: paidOnly.filter((o) => normalizeShip(o) === 'shipped').length,
      delivered: paidOnly.filter((o) => normalizeShip(o) === 'delivered').length,
    }
  }, [orders])

  const filtered = useMemo(() => {
    const byPayment = orders.filter((o) =>
      filterStatus === 'all' ? true : o.payment_status === filterStatus
    )

    if (shipFilter === 'all') return byPayment

    // shipFilter meaningful จริงเฉพาะ paid (แต่เรายังอนุญาตกรองไว้ เผื่อ filterStatus=all)
    return byPayment.filter((o) => normalizeShip(o) === shipFilter)
  }, [orders, filterStatus, shipFilter])

  const paymentButtons: Array<{ v: Filter; label: string; count: number }> = [
    { v: 'pending_payment', label: 'รอชำระเงิน', count: counts.pending_payment },
    { v: 'payment_review', label: 'รอตรวจสอบสลิป', count: counts.payment_review },
    { v: 'paid', label: 'ชำระแล้ว', count: counts.paid },
    { v: 'all', label: 'ทั้งหมด', count: counts.all },
  ]

  const shipButtons: Array<{ v: ShipFilter; label: string; count: number }> = [
    { v: 'pending', label: 'รอจัดส่ง', count: shipCounts.pending },
    { v: 'shipped', label: 'จัดส่งแล้ว', count: shipCounts.shipped },
    { v: 'delivered', label: 'ส่งสำเร็จ', count: shipCounts.delivered },
    { v: 'all', label: 'ชำระแล้วทั้งหมด', count: shipCounts.all },
  ]

  const shipEnabled = filterStatus === 'paid' || filterStatus === 'all'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/35 to-slate-50">
      <div className="p-6 pt-8 w-full max-w-[min(1500px,calc(100vw-64px))] mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/70 px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm">
            Auction Orders Management
          </div>

          <div className="mt-4 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
                ออเดอร์ประมูล
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                ติดตามการชำระเงินและการจัดส่งของผู้ชนะประมูล
              </p>
            </div>

            {/* Year */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={year <= MIN_YEAR || loading}
                onClick={() => setYear((y) => Math.max(MIN_YEAR, y - 1))}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                aria-label="ปีก่อนหน้า"
              >
                Previous
              </button>

              <div className="px-6 py-2 rounded-xl bg-white border border-slate-200 text-lg font-bold text-slate-800 min-w-[92px] text-center shadow-sm">
                {year}
              </div>

              <button
                type="button"
                disabled={year >= MAX_YEAR || loading}
                onClick={() => setYear((y) => Math.min(MAX_YEAR, y + 1))}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                aria-label="ปีถัดไป"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Payment */}
          <div className={softCard()}>
            <div className="p-5 md:p-6">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <div className="text-xs font-semibold text-slate-500">สถานะชำระเงิน</div>
                  <div className="text-sm font-bold text-slate-900">
                    กรองตามขั้นตอนการจ่ายเงิน
                  </div>
                </div>
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-slate-50 text-slate-700 border border-slate-200">
                  ทั้งหมด {counts.all}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {paymentButtons.map((x) => {
                  const active = filterStatus === x.v
                  return (
                    <button
                      key={x.v}
                      type="button"
                      onClick={() => {
                        setFilterStatus(x.v)
                        setShipFilter('all')
                      }}
                      className={pill(active)}
                    >
                      <span>{x.label}</span>
                      <span className={pillCount(active)}>{x.count}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Shipping */}
          <div className={softCard()}>
            <div className="p-5 md:p-6">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <div className="text-xs font-semibold text-slate-500">สถานะจัดส่ง</div>
                  <div className="text-sm font-bold text-slate-900">
                    ใช้ได้เฉพาะรายการที่ชำระแล้ว
                  </div>
                </div>
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100">
                  ชำระแล้ว {shipCounts.all}
                </span>
              </div>

              <div className={clsx('flex flex-wrap gap-2', !shipEnabled && 'opacity-50')}>
                {shipButtons.map((x) => {
                  const active = shipFilter === x.v
                  return (
                    <button
                      key={x.v}
                      type="button"
                      disabled={!shipEnabled}
                      onClick={() => setShipFilter(x.v)}
                      className={clsx(pill(active), !shipEnabled && 'cursor-not-allowed')}
                    >
                      <span>{x.label}</span>
                      <span className={pillCount(active)}>{x.count}</span>
                    </button>
                  )
                })}
              </div>

              {!shipEnabled ? (
                <div className="mt-3 text-xs text-slate-500">
                  เลือก “ชำระแล้ว” หรือ “ทั้งหมด” ก่อน เพื่อกรองสถานะจัดส่ง
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className={softCard()}>
          {loading ? (
            <div className="p-10 text-center border-t border-slate-200">
              <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-slate-600 font-medium">กำลังโหลดข้อมูล</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center border-t border-slate-200">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                —
              </div>
              <p className="mt-4 text-slate-900 text-xl font-bold">ไม่พบข้อมูล</p>
              <p className="mt-1 text-slate-500">ลองเปลี่ยนตัวกรอง หรือเลือกปีอื่น</p>
            </div>
          ) : (
            <div className="border-t border-slate-200 overflow-hidden">
              <table className="w-full table-fixed text-sm">

                <thead>
                  <tr className="bg-gradient-to-r from-emerald-700 to-green-700 text-white">
                    <th className="p-3 text-center w-24">รหัส</th>
                    <th className="py-3 px-3 text-left w-[20%]">สินค้า</th>

                    {/* ผู้ชนะ: ซ่อนบนจอเล็ก */}
                    <th className="p-3 text-left w-[18%] hidden md:table-cell">ผู้ชนะ</th>

                    {/* เวลา: ซ่อนจนกว่าจะ xl เพื่อไม่ให้ตารางทะลุ */}
                    <th className="p-3 text-center w-[16%] hidden xl:table-cell">จบประมูล</th>
                    <th className="p-3 text-center w-[16%] hidden xl:table-cell">ชำระล่าสุด</th>

                    <th className="p-3 text-right w-[14%]">ราคา</th>
                    <th className="p-3 text-center w-[14%]">ชำระเงิน</th>

                    {/* จัดส่ง: ซ่อนบนจอเล็ก-กลาง */}
                    <th className="p-3 text-center w-[14%] hidden lg:table-cell">จัดส่ง</th>

                    <th className="p-3 text-center w-32">จัดการ</th>
                  </tr>
                </thead>

                <tbody className="bg-white">
                  {filtered.map((o) => {
                    const code = `auc:${String(o.Aid).padStart(4, '0')}`
                    const pay = getPaymentMeta(o.payment_status)
                    const ship = getShipMeta(o)

                    return (
                      <tr
                        key={o.Aid}
                        className="border-b border-slate-100 hover:bg-emerald-50/40 transition"
                      >
                        <td className="p-4 text-center">
                          <span className="inline-flex items-center rounded-lg bg-slate-50 border border-slate-200 px-3 py-1 font-mono text-xs text-slate-700">
                            {code}
                          </span>
                        </td>

                        <td className="p-4">
                          <div className="font-semibold text-slate-900 truncate">{o.PROname}</div>
                          <div className="mt-1 text-xs text-slate-500 truncate">
                            PROid: {o.PROid}
                          </div>
                        </td>

                        <td className="p-4 text-slate-700 hidden md:table-cell">
                          <div className="truncate">{o.Cname}</div>
                        </td>

                        <td className="p-4 text-center text-sm text-slate-700 hidden xl:table-cell">
                          {fmtDateTime(o.end_time)}
                        </td>

                        <td className="p-4 text-center text-sm text-slate-700 hidden xl:table-cell">
                          {fmtDateTime(o.paid_at)}
                        </td>

                        <td className="p-4 text-right">
                          <div className="font-bold text-emerald-700 truncate">
                            {fmtBaht(Number(o.current_price))} ฿
                          </div>
                          <div className="text-xs text-slate-500">THB</div>
                        </td>

                        <td className="p-4 text-center">
                          <StatusBadge label={pay.label} tone={pay.tone} />
                        </td>

                        <td className="p-4 text-center hidden lg:table-cell">
                          <div className="flex flex-col items-center gap-1">
                            <StatusBadge label={ship.label} tone={ship.tone} />
                            {o.tracking_number ? (
                              <div className="text-xs text-slate-500 truncate max-w-[160px]">
                                #{o.tracking_number}
                              </div>
                            ) : null}
                          </div>
                        </td>

                        <td className="p-4 text-center">
                          <Link
                            href={`/admin/auction-orders/${o.Aid}`}
                            className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-sm transition whitespace-nowrap"
                          >
                            ดูรายละเอียด
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              <div className="px-6 py-4 text-xs text-slate-500 bg-slate-50 border-t border-slate-200">
                หน้านี้เป็นภาพรวม การแก้สถานะ/ใส่เลขพัสดุ ทำในหน้ารายละเอียดออเดอร์
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
