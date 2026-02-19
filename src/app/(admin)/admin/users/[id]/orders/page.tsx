'use client'

import { apiFetch } from '@/app/lib/apiFetch'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

import StatusBadge from '@/app/component/StatusBadge'
import { getMeta, ORDER_STATUS, type OrderStatusKey } from '@/app/lib/status'

interface Order {
  Oid: number
  Odate: string
  Ostatus: string
  Oprice: number
  products: string
}

type FilterStatus = 'all' | OrderStatusKey | 'unknown'

const makeCode = (prefix: string, id: number) =>
  `${prefix}:${String(id).padStart(4, '0')}`

function fmtDateTH(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function fmtBaht(n: unknown) {
  const v = Number(n)
  if (!Number.isFinite(v)) return '—'
  return v.toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function isOrderStatusKey(x: string): x is OrderStatusKey {
  return Object.prototype.hasOwnProperty.call(ORDER_STATUS, x)
}

function clsx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(' ')
}

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

export default function OrdersOfUserPage() {
  const params = useParams()
  const id = params?.id?.toString()

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')

  useEffect(() => {
    let alive = true

    const load = async () => {
      if (!id) return

      setLoading(true)
      try {
        const res = await apiFetch(`/orders/customer/${id}`)
        if (!res.ok) {
          if (!alive) return
          setOrders([])
          return
        }

        const data: unknown = await res.json()
        if (!alive) return

        setOrders(Array.isArray(data) ? (data as Order[]) : [])
      } catch {
        if (!alive) return
        setOrders([])
      } finally {
        if (!alive) return
        setLoading(false)
      }
    }

    load()
    return () => {
      alive = false
    }
  }, [id])

  const statusOptions = useMemo(() => {
    return Object.keys(ORDER_STATUS) as OrderStatusKey[]
  }, [])

  const counts = useMemo(() => {
    const all = orders.length
    const unknown = orders.filter((o) => !isOrderStatusKey(String(o.Ostatus || '').trim())).length

    const map: Record<string, number> = { all, unknown }
    for (const k of statusOptions) {
      map[k] = orders.filter((o) => String(o.Ostatus || '').trim() === k).length
    }
    return map
  }, [orders, statusOptions])

  const filteredOrders = useMemo(() => {
    if (filterStatus === 'all') return orders

    if (filterStatus === 'unknown') {
      return orders.filter((o) => !isOrderStatusKey(String(o.Ostatus || '').trim()))
    }

    return orders.filter((o) => String(o.Ostatus || '').trim() === filterStatus)
  }, [orders, filterStatus])

  const filterButtons: Array<{ v: FilterStatus; label: string; count: number }> = useMemo(() => {
    const xs: Array<{ v: FilterStatus; label: string; count: number }> = [
      { v: 'all', label: 'ทั้งหมด', count: counts.all ?? 0 },
    ]

    for (const k of statusOptions) {
      xs.push({
        v: k,
        label: ORDER_STATUS[k].label,
        count: counts[k] ?? 0,
      })
    }

    xs.push({ v: 'unknown', label: 'ไม่ทราบสถานะ', count: counts.unknown ?? 0 })
    return xs
  }, [counts, statusOptions])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/35 to-slate-50">
      <div className="p-6 pt-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/70 px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm">
            Customer Orders
          </div>

          <div className="mt-4 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
                คำสั่งซื้อของลูกค้า
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                ลูกค้า ID: <span className="font-mono text-slate-700">{id ?? '—'}</span>
              </p>
            </div>

            <div className="text-xs text-slate-500">
              * สี/ข้อความสถานะอิงจาก <span className="font-mono">status.ts</span> เท่านั้น
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className={softCard() + ' mb-6'}>
          <div className="p-5 md:p-6">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <div className="text-xs font-semibold text-slate-500">กรองสถานะ</div>
                <div className="text-sm font-bold text-slate-900">
                  เลือกสถานะเพื่อดูรายการที่เกี่ยวข้อง
                </div>
              </div>

              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-slate-50 text-slate-700 border border-slate-200">
                รวม {orders.length}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {filterButtons.map((x) => {
                const active = filterStatus === x.v
                return (
                  <button
                    key={String(x.v)}
                    type="button"
                    onClick={() => setFilterStatus(x.v)}
                    className={pill(active)}
                  >
                    <span className="truncate max-w-[180px]">{x.label}</span>
                    <span className={pillCount(active)}>{x.count}</span>
                  </button>
                )
              })}
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
          ) : filteredOrders.length === 0 ? (
            <div className="p-12 text-center border-t border-slate-200">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                —
              </div>
              <p className="mt-4 text-slate-900 text-xl font-bold">ไม่มีข้อมูลคำสั่งซื้อ</p>
              <p className="mt-1 text-slate-500">ลองเปลี่ยนตัวกรอง</p>
            </div>
          ) : (
            <div className="border-t border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full table-fixed">
                  <thead>
                    <tr className="bg-gradient-to-r from-emerald-700 to-green-700 text-white">
                      <th className="p-4 text-left w-36">รหัสคำสั่งซื้อ</th>
                      <th className="p-4 text-left w-36">วันที่</th>
                      <th className="p-4 text-left w-44">สถานะ</th>
                      <th className="p-4 text-right w-36">ยอดรวม</th>
                      <th className="p-4 text-left w-[40%] hidden lg:table-cell">สินค้า</th>
                    </tr>
                  </thead>

                  <tbody className="bg-white">
                    {filteredOrders.map((order) => {
                      const meta = getMeta(ORDER_STATUS, order.Ostatus)
                      const raw = String(order.Ostatus || '').trim()

                      return (
                        <tr
                          key={order.Oid}
                          className="border-b border-slate-100 hover:bg-emerald-50/40 transition"
                        >
                          <td className="p-4">
                            <Link
                              href={`/admin/orders/${order.Oid}`}
                              className="inline-flex items-center rounded-lg bg-slate-50 border border-slate-200 px-3 py-1 font-mono text-xs text-slate-700 hover:bg-slate-100"
                            >
                              {makeCode('ord', order.Oid)}
                            </Link>

                            {/* mobile: โชว์สินค้าใต้รหัส */}
                            <div className="mt-2 text-xs text-slate-500 lg:hidden">
                              <div className="font-semibold text-slate-700">สินค้า</div>
                              <div className="truncate" title={order.products}>
                                {order.products || '—'}
                              </div>
                            </div>
                          </td>

                          <td className="p-4 text-slate-700">{fmtDateTH(order.Odate)}</td>

                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <StatusBadge label={meta.label} tone={meta.tone} />
                              <span className="text-[11px] text-slate-400 truncate max-w-[120px]">
                                {raw || '—'}
                              </span>
                            </div>
                          </td>

                          <td className="p-4 text-right">
                            <div className="font-bold text-emerald-700 truncate">
                              {fmtBaht(order.Oprice)} ฿
                            </div>
                            <div className="text-xs text-slate-500">THB</div>
                          </td>

                          <td className="p-4 hidden lg:table-cell">
                            <div className="text-slate-800 truncate" title={order.products}>
                              {order.products || '—'}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="px-6 py-4 text-xs text-slate-500 bg-slate-50 border-t border-slate-200">
                หน้านี้เป็นรายการคำสั่งซื้อของลูกค้า • คลิกรหัสเพื่อดูรายละเอียดออเดอร์
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
