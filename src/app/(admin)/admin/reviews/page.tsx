'use client';
import { apiFetch } from '@/app/lib/apiFetch';
import { useEffect, useMemo, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';

type ReviewRow = {
  id: number;
  text: string;
  stars: number;
  created_at: string;
  order_id: number | null;
  images: string[];
  Cname?: string;
  admin_reply?: string | null;
  replied_at?: string | null;
};

type TabKey = 'order' | 'store';

function toImgUrl(path: string) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${API}${path}`;
}

export default function AdminReviewPage() {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);

  // tab
  const [tab, setTab] = useState<TabKey>('order');

  // reply drafts (✅ คุม textarea ด้วย state อย่างเดียว)
  const [replyDraft, setReplyDraft] = useState<Record<number, string>>({});
  const [savingId, setSavingId] = useState<number | null>(null);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`${API}/admin/reviews`);

      if (res.status === 401 || res.status === 403) {
        window.location.href = '/';
        return;
      }

      const data: unknown = await res.json();
      const list = Array.isArray(data) ? (data as ReviewRow[]) : [];
      setReviews(list);

      // ✅ เติม draft ครั้งแรกเฉพาะตัวที่ยังไม่มี draft
      setReplyDraft((prev) => {
        const next = { ...prev };
        for (const r of list) {
          if (next[r.id] === undefined) {
            next[r.id] = r.admin_reply ?? '';
          }
        }
        return next;
      });
    } catch (e) {
      console.error(e);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const ok = window.confirm('ยืนยันการลบรีวิวนี้?');
    if (!ok) return;

    const res = await apiFetch(`${API}/admin/reviews/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      alert('ลบไม่สำเร็จ');
      return;
    }

    setReviews((prev) => prev.filter((r) => r.id !== id));
    setReplyDraft((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleSaveReply = async (id: number) => {
    const reply = (replyDraft[id] ?? '').trim();
    setSavingId(id);

    try {
      const res = await apiFetch(`${API}/admin/reviews/${id}/reply`, {
        method: 'PATCH',
        body: JSON.stringify({ reply }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data?.message || 'บันทึกคำตอบไม่สำเร็จ');
        return;
      }

      // ✅ อัปเดตเฉพาะแถวใน state ไม่ต้อง fetch ทั้งก้อน (ลดกระตุก)
      const now = new Date().toISOString();
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
      );

      alert(reply.length ? 'ตอบกลับสำเร็จ' : 'ลบคำตอบแล้ว');
    } catch (e) {
      console.error(e);
      alert('บันทึกคำตอบไม่สำเร็จ');
    } finally {
      setSavingId(null);
    }
  };

  useEffect(() => {
    // ✅ restore tab
    const saved = localStorage.getItem('admin_reviews_tab') as TabKey | null;
    if (saved === 'order' || saved === 'store') setTab(saved);
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    localStorage.setItem('admin_reviews_tab', tab);
  }, [tab]);

  const groups = useMemo(() => {
    const store = reviews.filter((r) => r.order_id == null);
    const order = reviews.filter((r) => r.order_id != null);
    return { store, order };
  }, [reviews]);

  const items = tab === 'order' ? groups.order : groups.store;

  const TabButton = ({
    k,
    label,
    count,
  }: {
    k: TabKey;
    label: string;
    count: number;
  }) => {
    const active = tab === k;
    return (
      <button
        type="button"
        onClick={() => setTab(k)}
        className={`px-4 py-2 rounded-xl font-semibold border-2 transition-all flex items-center gap-2
          ${
            active
              ? 'bg-emerald-600 text-white border-emerald-600 shadow'
              : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-300'
          }`}
      >
        <span>{label}</span>
        <span className={`${active ? 'bg-white/20' : 'bg-gray-100'} px-2 py-0.5 rounded-full text-sm`}>
          {count}
        </span>
      </button>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">กำลังโหลดรีวิว...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50">
      <div className="max-w-5xl mx-auto p-6 pt-8">
        {/* Header */}
        <div className="mb-6">
          <div className="inline-block bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2 rounded-full text-sm font-semibold mb-4">
            จัดการรีวิว
          </div>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              ⭐ รายการรีวิว
            </h1>

            <div className="flex items-center gap-2">
              <TabButton k="order" label="รีวิวจากออเดอร์" count={groups.order.length} />
              <TabButton k="store" label="รีวิวร้าน (About)" count={groups.store.length} />
            </div>
          </div>

          <div className="mt-3 text-sm text-gray-600">
            ตอนนี้กำลังดู: <span className="font-semibold">{tab === 'order' ? 'รีวิวจากออเดอร์' : 'รีวิวร้าน (About)'}</span>
          </div>
        </div>

        {/* List */}
        {items.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 border-2 border-dashed border-gray-200 text-gray-500 text-center">
            ยังไม่มีรีวิวในหมวดนี้
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((r) => {
              const draft = replyDraft[r.id] ?? ''; // ✅ ไม่มี fallback จาก r.admin_reply ตอนพิมพ์แล้ว
              const isSaving = savingId === r.id;

              return (
                <div
                  key={r.id}
                  className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200 hover:border-green-300 transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      {/* badges */}
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        {r.order_id != null ? (
                          <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-700 border-2 border-blue-300">
                            รีวิวจากออเดอร์ #{r.order_id}
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-sm font-semibold bg-emerald-100 text-emerald-700 border-2 border-emerald-300">
                            รีวิวร้าน (หน้า About)
                          </span>
                        )}

                        <span className="px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 text-gray-700 border-2 border-gray-200">
                          โดย: {r.Cname || 'ผู้ใช้'}
                        </span>

                        <div className="flex items-center gap-1 ml-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i} className={`text-xl ${i < r.stars ? '' : 'opacity-30'}`}>
                              ⭐
                            </span>
                          ))}
                          <span className="ml-2 font-semibold text-gray-700">({r.stars} ดาว)</span>
                        </div>
                      </div>

                      {/* text */}
                      <p className="text-gray-700 bg-gray-50 p-4 rounded-xl mb-3">"{r.text}"</p>

                      {/* images */}
                      {Array.isArray(r.images) && r.images.length > 0 && (
                        <div className="mb-4">
                          <div className="text-sm font-semibold text-gray-700 mb-2">
                            รูปแนบ ({r.images.length})
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {r.images.map((img, idx) => (
                              <a
                                key={idx}
                                href={toImgUrl(img)}
                                target="_blank"
                                rel="noreferrer"
                                className="w-20 h-20 rounded-xl overflow-hidden border bg-gray-100"
                                title="เปิดรูป"
                              >
                                <img
                                  src={toImgUrl(img)}
                                  alt="review-img"
                                  className="w-full h-full object-cover"
                                />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* timestamps */}
                      <p className="text-sm text-gray-500 mb-3">
                        📅 รีวิวเมื่อ: {new Date(r.created_at).toLocaleString('th-TH')}
                        {r.replied_at ? (
                          <>
                            {' '}
                            • 🗨️ ตอบกลับเมื่อ: {new Date(r.replied_at).toLocaleString('th-TH')}
                          </>
                        ) : null}
                      </p>

                      {/* reply editor */}
                      <div className="mt-2">
                        <div className="text-sm font-semibold text-gray-800 mb-2">ตอบกลับลูกค้า</div>

                        <textarea
                          className="w-full min-h-[90px] p-3 border-2 border-gray-200 rounded-xl bg-white focus:outline-none focus:border-emerald-400"
                          value={draft}
                          onChange={(e) =>
                            setReplyDraft((prev) => ({
                              ...prev,
                              [r.id]: e.target.value,
                            }))
                          }
                          placeholder="พิมพ์คำตอบแอดมิน... (เว้นว่างแล้วกดบันทึก = ลบคำตอบ)"
                        />

                        <div className="flex flex-wrap items-center gap-2 mt-3">
                          <button
                            onClick={() => handleSaveReply(r.id)}
                            disabled={isSaving}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl font-semibold disabled:opacity-50"
                          >
                            {isSaving ? 'กำลังบันทึก...' : 'บันทึกคำตอบ'}
                          </button>

                          <button
                            onClick={() => handleDelete(r.id)}
                            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-5 py-2 rounded-xl font-semibold"
                          >
                            🗑️ ลบรีวิว
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
