'use client'

import { apiFetch } from '@/app/lib/apiFetch'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type UserStatus = 'user' | 'banned'

interface Customer {
  Cid: number
  Cname: string
  Cphone: string
  Cstatus: UserStatus
  orderCount: number
}

const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000'

function clsx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(' ')
}

function softCard(extra?: string) {
  return clsx(
    'bg-white/80 backdrop-blur rounded-2xl shadow-lg border border-slate-200 overflow-hidden',
    extra
  )
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

export default function AdminUsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<Customer[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | UserStatus>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await apiFetch(`${API}/customers`)
        if (!res.ok) {
          setUsers([])
          return
        }
        const data = await res.json()
        setUsers(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error('โหลดรายชื่อลูกค้าล้มเหลว:', err)
        setUsers([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleDelete = async (id: number) => {
    if (!confirm('คุณแน่ใจว่าต้องการลบผู้ใช้นี้?')) return

    const res = await apiFetch(`${API}/customers/delete/${id}`, {
      method: 'PUT',
    })
    if (!res.ok) {
      alert('ลบผู้ใช้ไม่สำเร็จ')
      return
    }
    setUsers((prev) => prev.filter((u) => u.Cid !== id))
  }

  const toggleBan = async (id: number, status: UserStatus) => {
    const newStatus: UserStatus = status === 'banned' ? 'user' : 'banned'

    const res = await apiFetch(`${API}/customers/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ Cstatus: newStatus }),
    })

    if (res.ok) {
      setUsers((prev) =>
        prev.map((u) => (u.Cid === id ? { ...u, Cstatus: newStatus } : u))
      )
    } else {
      const data = await res.json().catch(() => null)
      alert(data?.message || 'เปลี่ยนสถานะไม่สำเร็จ')
    }
  }

  const filteredUsers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    return users.filter((u) => {
      const nameOk = u.Cname.toLowerCase().includes(q)
      const statusOk = statusFilter === 'all' ? true : u.Cstatus === statusFilter
      return nameOk && statusOk
    })
  }, [users, searchTerm, statusFilter])

  const counts = useMemo(() => {
    let all = users.length
    let user = 0
    let banned = 0
    for (const u of users) {
      if (u.Cstatus === 'banned') banned += 1
      else user += 1
    }
    return { all, user, banned }
  }, [users])

  const statusButtons = [
    { v: 'all' as const, label: 'ทั้งหมด', count: counts.all },
    { v: 'user' as const, label: 'ผู้ใช้ปกติ', count: counts.user },
    { v: 'banned' as const, label: 'ถูกแบน', count: counts.banned },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/35 to-slate-50">
      <div className="p-6 pt-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/70 px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm">
            Users Management
          </div>

          <div className="mt-4 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
                จัดการบัญชีลูกค้า
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                ค้นหา/กรองสถานะลูกค้า และจัดการคำสั่งซื้อได้รวดเร็ว
              </p>
            </div>

            <div className="text-sm text-slate-600">
              ทั้งหมด <span className="font-bold text-slate-900">{counts.all}</span> บัญชี
            </div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className={clsx(softCard(), 'mb-6')}>
          <div className="p-5 md:p-6">
            <div className="flex flex-col lg:flex-row lg:items-end gap-4">
              {/* Search */}
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-500 mb-2">
                  ค้นหาชื่อลูกค้า
                </label>
                <input
                  type="text"
                  placeholder="พิมพ์ชื่อ..."
                  className="w-full p-3 rounded-xl bg-white border border-slate-200 focus:border-emerald-400 focus:outline-none transition"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Status pills */}
              <div className="lg:w-[520px]">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-semibold text-slate-500">กรองตามสถานะ</div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {statusButtons.map((x) => {
                    const active = statusFilter === x.v
                    return (
                      <button
                        key={x.v}
                        type="button"
                        onClick={() => setStatusFilter(x.v === 'all' ? 'all' : x.v)}
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
          </div>
        </div>

        {/* Table */}
        <div className={softCard()}>
          <div className="border-b border-slate-200 bg-white/70 px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-slate-900">รายชื่อลูกค้า</div>
              <div className="text-xs text-slate-500">
                แสดง {filteredUsers.length} รายการ
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <thead>
  <tr className="bg-gradient-to-r from-emerald-700 to-green-700 text-white">
    <th className="p-4 text-left w-32">รหัส</th>
    <th className="p-4 text-left w-[24%]">ชื่อ</th>
    <th className="p-4 text-center w-[20%] hidden md:table-cell">เบอร์โทร</th>
    <th className="p-4 text-center w-28">ออเดอร์</th>
    <th className="p-4 text-center w-28">สถานะ</th>
    <th className="p-4 text-center w-64">จัดการ</th>
  </tr>
</thead>


              <tbody className="bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-slate-500">
                      กำลังโหลด...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-500">
                      ไม่พบข้อมูล
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const code = `usr:${String(u.Cid).padStart(4, '0')}`
                    const banned = u.Cstatus === 'banned'

                    return (
                      <tr
                        key={u.Cid}
                        className="border-b border-slate-100 hover:bg-emerald-50/40 transition"
                      >
                        <td className="p-4">
                          <Link
                            href={`/admin/users/${u.Cid}/orders`}
                            className="inline-flex items-center rounded-lg bg-slate-50 border border-slate-200 px-3 py-1 font-mono text-xs text-slate-700 hover:bg-slate-100 transition"
                            title="ดูออเดอร์ของลูกค้า"
                          >
                            {code}
                          </Link>
                        </td>

                        <td className="p-4">
                           <div className="font-semibold text-slate-900 truncate max-w-[260px] md:max-w-[320px]">
    {u.Cname}
  </div>
                          <div className="mt-1 text-xs text-slate-500 truncate">
                            Cid: {u.Cid}
                          </div>
                        </td>

                        <td className="p-4 text-center text-slate-700 hidden md:table-cell">
                          <span className="truncate inline-block max-w-[180px]">
                            {u.Cphone}
                          </span>
                        </td>

                        <td className="p-4 text-center">
                          <span className="inline-flex items-center justify-center min-w-[64px] px-3 py-1 rounded-full text-sm font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                            {u.orderCount}
                          </span>
                        </td>

                        <td className="p-4 text-center">
                          <span
                            className={clsx(
                              'inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-semibold border',
                              banned
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            )}
                          >
                            {banned ? 'ถูกแบน' : 'ปกติ'}
                          </span>
                        </td>

                        <td className="p-4">
                          <div className="flex flex-col sm:flex-row gap-2 justify-center">
                            <button
                              type="button"
                              onClick={() => router.push(`/admin/users/${u.Cid}/orders`)}
                              className="inline-flex items-center justify-center px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-semibold shadow-sm transition whitespace-nowrap"
                            >
                              ดูคำสั่งซื้อ
                            </button>

                            <button
                              type="button"
                              onClick={() => toggleBan(u.Cid, u.Cstatus)}
                              className={clsx(
                                'inline-flex items-center justify-center px-4 py-2 rounded-xl font-semibold shadow-sm transition whitespace-nowrap',
                                banned
                                  ? 'bg-slate-900 hover:bg-slate-800 text-white'
                                  : 'bg-amber-500 hover:bg-amber-600 text-white'
                              )}
                            >
                              {banned ? 'ปลดแบน' : 'แบน'}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(u.Cid)}
                              className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold shadow-sm transition whitespace-nowrap"
                            >
                              ลบ
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 text-xs text-slate-500 bg-slate-50 border-t border-slate-200">
            * แนะนำ: ถ้าจะ “ลบ” จริง ๆ ให้เป็น soft-delete ฝั่ง backend จะปลอดภัยกว่า
          </div>
        </div>
      </div>
    </div>
  )
}
