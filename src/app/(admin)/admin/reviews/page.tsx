'use client'

import { apiFetch } from '@/app/lib/apiFetch'
import { useEffect, useMemo, useState } from 'react'
import { FaStar } from 'react-icons/fa'

const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000'

type ReviewRow = {
  id: number
  text: string
  stars: number
  created_at: string
  order_id: number | null
  images: string[]
  Cname?: string
  admin_reply?: string | null
  replied_at?: string | null
}

type TabKey = 'order' | 'store'

function toImgUrl(path: string) {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return `${API}${path}`
}

function clsx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(' ')
}

function softCard() {
  return 'bg-white/80 backdrop-blur rounded-2xl shadow-lg border border-slate-200 overflow-hidden'
}

function tabPill(active: boolean) {
  return clsx(
    'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold border transition shadow-sm',
    active
      ? 'bg-emerald-600 text-white border-emerald-600 shadow'
      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
  )
}

function tabCount(active: boolean) {
  return clsx(
    'min-w-[28px] h-6 px-2 rounded-full text-xs font-bold flex items-center justify-center',
    active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
  )
}

function fmtDT(s: string) {
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

function clampStars(n: number) {
  const x = Number(n)
  if (!Number.isFinite(x)) return 0
  return Math.max(0, Math.min(5, Math.round(x)))
}

export default function AdminReviewPage() {
  const [reviews, setReviews] = useState<ReviewRow[]>([])
  const [loading, setLoading] = useState(true)

  const [tab, setTab] = useState<TabKey>('order')

  // reply drafts
  const [replyDraft, setReplyDraft] = useState<Record<number, string>>({})
  const [savingId, setSavingId] = useState<number | null>(null)

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const res = await apiFetch(`${API}/admin/reviews`)

      if (res.status === 401 || res.status === 403) {
        window.location.href = '/'
        return
      }

      const data: unknown = await res.json()
      const list = Array.isArray(data) ? (data as ReviewRow[]) : []
      setReviews(list)

      // เติม draft ครั้งแรกเฉพาะตัวที่ยังไม่มี draft
      setReplyDraft((prev) => {
        const next = { ...prev }
        for (const r of list) {
          if (next[r.id] === undefined) next[r.id] = r.admin_reply ?? ''
        }
        return next
      })
    } catch (e) {
      console.error(e)
      setReviews([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    const ok = window.confirm('ยืนยันการลบรีวิวนี้?')
    if (!ok) return

    const res = await apiFetch(`${API}/admin/reviews/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      alert('ลบไม่สำเร็จ')
      return
    }

    setReviews((prev) => prev.filter((r) => r.id !== id))
    setReplyDraft((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  const handleSaveReply = async (id: number) => {
    const reply = (replyDraft[id] ?? '').trim()
    setSavingId(id)

    try {
      const res = await apiFetch(`${API}/admin/reviews/${id}/reply`, {
        method: 'PATCH',
        body: JSON.stringify({ reply }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        alert((data as any)?.message || 'บันทึกคำตอบไม่สำเร็จ')
        return
      }

      const now = new Date().toISOString()
      setReviews((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                admin_reply: reply.length ? reply : null,
                replied_at: reply.length ? now : null,
              }
            : r
        )
      )

      alert(reply.length ? 'บันทึกคำตอบแล้ว' : 'ลบคำตอบแล้ว')
    } catch (e) {
      console.error(e)
      alert('บันทึกคำตอบไม่สำเร็จ')
    } finally {
      setSavingId(null)
    }
  }

  useEffect(() => {
    const saved = localStorage.getItem('admin_reviews_tab') as TabKey | null
    if (saved === 'order' || saved === 'store') setTab(saved)
    fetchReviews()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    localStorage.setItem('admin_reviews_tab', tab)
  }, [tab])

  const groups = useMemo(() => {
    const store = reviews.filter((r) => r.order_id == null)
    const order = reviews.filter((r) => r.order_id != null)
    return { store, order }
  }, [reviews])

  const items = tab === 'order' ? groups.order : groups.store

  const TabButton = ({ k, label, count }: { k: TabKey; label: string; count: number }) => {
    const active = tab === k
    return (
      <button type="button" onClick={() => setTab(k)} className={tabPill(active)}>
        <span className="truncate max-w-[200px]">{label}</span>
        <span className={tabCount(active)}>{count}</span>
      </button>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/35 to-slate-50 flex items-center justify-center">
        <div className={clsx(softCard(), 'px-10 py-10 text-center')}>
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-700 font-semibold">กำลังโหลดรีวิว</p>
          <p className="text-slate-500 text-sm mt-1">โปรดรอสักครู่</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/35 to-slate-50">
      <div className="max-w-6xl mx-auto p-6 pt-8">
        {/* Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/70 px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm">
            Reviews Management
          </div>

          <div className="mt-4 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
                รายการรีวิว
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                จัดการรีวิวและตอบกลับลูกค้าอย่างเป็นทางการ
              </p>
            </div>

            <div className="flex items-center gap-2">
              <TabButton k="order" label="รีวิวจากออเดอร์" count={groups.order.length} />
              <TabButton k="store" label="รีวิวร้าน (About)" count={groups.store.length} />
            </div>
          </div>

          <div className="mt-3 text-sm text-slate-600">
            กำลังดู: <span className="font-semibold text-slate-900">{tab === 'order' ? 'รีวิวจากออเดอร์' : 'รีวิวร้าน (About)'}</span>
          </div>
        </div>

        {/* List */}
        {items.length === 0 ? (
          <div className={clsx(softCard(), 'p-12 text-center')}>
            <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
              —
            </div>
            <p className="mt-4 text-slate-900 text-xl font-bold">ยังไม่มีรีวิวในหมวดนี้</p>
            <p className="mt-1 text-slate-500">ลองสลับแท็บเพื่อดูหมวดอื่น</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((r) => {
              const draft = replyDraft[r.id] ?? ''
              const isSaving = savingId === r.id
              const stars = clampStars(r.stars)

              return (
                <div key={r.id} className={clsx(softCard(), 'hover:border-emerald-200 transition')}>
                  <div className="p-6">
                    {/* top row */}
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        {/* chips */}
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span
                            className={clsx(
                              'px-3 py-1 rounded-full text-sm font-semibold border',
                              r.order_id != null
                                ? 'bg-sky-50 text-sky-700 border-sky-100'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-100'
                            )}
                          >
                            {r.order_id != null ? `Order Review #${r.order_id}` : 'Store Review (About)'}
                          </span>

                          <span className="px-3 py-1 rounded-full text-sm font-semibold bg-slate-50 text-slate-700 border border-slate-200">
                            {r.Cname || 'ผู้ใช้'}
                          </span>

                          <span className="px-3 py-1 rounded-full text-sm font-semibold bg-white text-slate-700 border border-slate-200">
                            {fmtDT(r.created_at)}
                          </span>

                          {r.replied_at ? (
                            <span className="px-3 py-1 rounded-full text-sm font-semibold bg-white text-slate-700 border border-slate-200">
                              Replied {fmtDT(r.replied_at)}
                            </span>
                          ) : null}
                        </div>

                        {/* rating */}
                        <div className="flex items-center gap-2 mb-4">
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <FaStar
                                key={i}
                                className={clsx(
                                  'text-[18px]',
                                  i < stars ? 'text-emerald-600' : 'text-slate-200'
                                )}
                              />
                            ))}
                          </div>
                          <div className="text-sm font-semibold text-slate-700">{stars} / 5</div>
                        </div>

                        {/* review text */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                          <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">
                            {r.text}
                          </p>
                        </div>

                        {/* images */}
                        {Array.isArray(r.images) && r.images.length > 0 ? (
                          <div className="mt-5">
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-sm font-semibold text-slate-800">รูปแนบ</div>
                              <div className="text-xs text-slate-500">{r.images.length} รูป</div>
                            </div>

                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                              {r.images.map((img, idx) => (
                                <a
                                  key={idx}
                                  href={toImgUrl(img)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-50"
                                  title="เปิดรูป"
                                >
                                  <img
                                    src={toImgUrl(img)}
                                    alt="review-img"
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                  />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition" />
                                </a>
                              ))}
                            </div>
                          </div>
                        ) : null}

                        {/* reply box */}
                        <div className="mt-6">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm font-semibold text-slate-900">คำตอบจากแอดมิน</div>
                            <div className="text-xs text-slate-500">
                              เว้นว่างแล้วบันทึก = ลบคำตอบ
                            </div>
                          </div>

                          <textarea
                            className="w-full min-h-[110px] p-4 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-300 text-slate-800"
                            value={draft}
                            onChange={(e) =>
                              setReplyDraft((prev) => ({
                                ...prev,
                                [r.id]: e.target.value,
                              }))
                            }
                            placeholder="พิมพ์คำตอบอย่างสุภาพและเป็นทางการ..."
                          />

                          <div className="flex flex-wrap items-center gap-2 mt-3">
                            <button
                              onClick={() => handleSaveReply(r.id)}
                              disabled={isSaving}
                              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isSaving ? 'กำลังบันทึก' : 'บันทึกคำตอบ'}
                            </button>

                            <button
                              onClick={() => handleDelete(r.id)}
                              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold shadow-sm"
                            >
                              ลบรีวิว
                            </button>

                            <button
                              type="button"
                              onClick={() => fetchReviews()}
                              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-semibold shadow-sm"
                            >
                              รีเฟรช
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* side meta (desktop) */}
                      <div className="w-full md:w-[260px] shrink-0">
                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                          <div className="text-xs font-semibold text-slate-500">Review ID</div>
                          <div className="mt-1 font-mono text-sm text-slate-800">rev:{String(r.id).padStart(4, '0')}</div>

                          <div className="mt-4 text-xs font-semibold text-slate-500">ประเภท</div>
                          <div className="mt-1 text-sm font-semibold text-slate-900">
                            {r.order_id != null ? 'Order Review' : 'Store Review'}
                          </div>

                          {r.order_id != null ? (
                            <>
                              <div className="mt-4 text-xs font-semibold text-slate-500">Order</div>
                              <div className="mt-1 text-sm text-slate-800">#{r.order_id}</div>
                            </>
                          ) : null}

                          <div className="mt-4 text-xs font-semibold text-slate-500">สถานะการตอบ</div>
                          <div
                            className={clsx(
                              'mt-1 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border',
                              r.admin_reply
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                                : 'bg-slate-50 text-slate-700 border-slate-200'
                            )}
                          >
                            {r.admin_reply ? 'ตอบแล้ว' : 'ยังไม่ตอบ'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* subtle footer */}
                  <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
                    การบันทึกจะอัปเดตเฉพาะแถวนี้ในหน้าจอ เพื่อลดอาการกระตุกของ UI
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
