'use client';

import { apiFetch } from '@/app/lib/apiFetch';
import React, { useEffect, useMemo, useState } from 'react';
import { FaStar, FaRegStar, FaPaperPlane, FaUserCircle } from 'react-icons/fa';

const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';

interface ReviewItem {
  id: number;
  text: string;
  stars: number;
  Cname?: string;
  images?: string[];
  created_at?: string;

  admin_reply?: string | null;
  replied_at?: string | null;
}

interface ReviewsErrorResponse {
  message?: string;
  error?: string;
}

function safeParseImages(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((x) => typeof x === 'string') as string[];
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter((x) => typeof x === 'string') as string[];
      return [];
    } catch {
      return raw.startsWith('/') ? [raw] : [];
    }
  }
  return [];
}

function toReviewItem(x: unknown): ReviewItem | null {
  if (typeof x !== 'object' || x === null) return null;
  const o = x as Record<string, unknown>;

  const id = typeof o.id === 'number' ? o.id : null;
  const text = typeof o.text === 'string' ? o.text : null;
  const stars = typeof o.stars === 'number' ? o.stars : null;

  if (id === null || text === null || stars === null) return null;

  const Cname = typeof o.Cname === 'string' ? o.Cname : undefined;
  const images = safeParseImages(o.images);
  const created_at = typeof o.created_at === 'string' ? o.created_at : undefined;

  const admin_reply =
    typeof o.admin_reply === 'string' ? o.admin_reply : o.admin_reply === null ? null : undefined;
  const replied_at =
    typeof o.replied_at === 'string' ? o.replied_at : o.replied_at === null ? null : undefined;

  return { id, text, stars, Cname, images, created_at, admin_reply, replied_at };
}

const maskCustomerName = (full?: string) => {
  if (!full) return 'ผู้ใช้';
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return (parts[0]?.[0] || 'ผ') + 'xxx';
  const first = parts[0] || 'ผ';
  const last = parts[1] || 'ช';
  return `${first[0]}xxx ${last[0]}x`;
};

function toPublicImgUrl(path: string) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${API}${path}`;
}

/* ---------------------------
  UI helpers (no emoji)
----------------------------*/
function IconX({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
function Pill({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'emerald';
}) {
  const cls =
    tone === 'emerald'
      ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
      : 'bg-gray-50 text-gray-700 border-gray-200';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cls}`}>
      {children}
    </span>
  );
}

export default function About() {
  const [review, setReview] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  const [reviews, setReviews] = useState<ReviewItem[]>([]);

  // รูปที่ผู้ใช้เลือกจะอัปโหลด
  const [images, setImages] = useState<File[]>([]);

  // modal ดูรูปใหญ่
  const [openImg, setOpenImg] = useState<string | null>(null);

  const loadReviews = async () => {
    try {
      const res = await apiFetch('/reviews/store');
      const data: unknown = await res.json();

      if (!res.ok || !Array.isArray(data)) {
        setReviews([]);
        return;
      }

      const normalized = data.map(toReviewItem).filter((x): x is ReviewItem => x !== null);
      // newest first (เผื่อ backend ยังไม่ sort)
      normalized.sort((a, b) => {
        const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
        const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
        return tb - ta;
      });

      setReviews(normalized);
    } catch (err) {
      console.error('โหลดรีวิวผิด:', err);
      setReviews([]);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const onPickImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setImages((prev) => [...prev, ...files].slice(0, 5));
    e.target.value = '';
  };

  const previews = useMemo(() => images.map((f) => URL.createObjectURL(f)), [images]);

  useEffect(() => {
    return () => {
      previews.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [previews]);

  const handleSubmit = async () => {
    if (!localStorage.getItem('token')) {
      alert('กรุณาเข้าสู่ระบบก่อนส่งรีวิว');
      return;
    }
    if (review.trim() === '' || rating < 1 || rating > 5) return;

    try {
      const fd = new FormData();
      fd.append('text', review.trim());
      fd.append('stars', String(rating));
      images.forEach((f) => fd.append('images', f));

      const res = await apiFetch('/reviews/store', { method: 'POST', body: fd });
      const data: unknown = await res.json();

      if (!res.ok) {
        const err = data as ReviewsErrorResponse;
        alert(err.message || err.error || 'ส่งรีวิวไม่สำเร็จ');
        return;
      }

      setReview('');
      setRating(0);
      setHoverRating(0);
      setImages([]);
      await loadReviews();
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาด');
    }
  };

  const StarRating = ({ count, interactive = false }: { count: number; interactive?: boolean }) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const active = star <= (interactive ? hoverRating || rating : count);
          return (
            <button
              key={star}
              type="button"
              onClick={interactive ? () => setRating(star) : undefined}
              onMouseEnter={interactive ? () => setHoverRating(star) : undefined}
              onMouseLeave={interactive ? () => setHoverRating(0) : undefined}
              className={[
                'p-1 rounded-lg transition',
                interactive ? 'hover:bg-emerald-50' : 'cursor-default',
              ].join(' ')}
              disabled={!interactive}
              aria-label={`ให้คะแนน ${star} ดาว`}
              title={`ให้คะแนน ${star} ดาว`}
            >
              {active ? (
                <FaStar className="text-yellow-400 text-2xl" />
              ) : (
                <FaRegStar className="text-gray-300 text-2xl" />
              )}
            </button>
          );
        })}
      </div>
    );
  };

  const stats = useMemo(() => {
    const total = reviews.length;
    const avg = total ? reviews.reduce((s, r) => s + r.stars, 0) / total : 0;
    const satisfied = total ? Math.round((reviews.filter((r) => r.stars >= 4).length / total) * 100) : 0;
    return { total, avg: Number(avg.toFixed(1)), satisfied };
  }, [reviews]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50/60 via-white to-white pt-32 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur border border-emerald-100 text-emerald-700 px-5 py-2 rounded-full text-sm font-semibold shadow-sm">
            ความคิดเห็นของลูกค้า
            <span className="text-xs font-normal text-emerald-700/70">Reviews</span>
          </div>
          <h1 className="mt-4 text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-emerald-700 to-green-600 bg-clip-text text-transparent">
            รีวิวเกี่ยวกับเรา
          </h1>
          <p className="mt-3 text-gray-600 text-base md:text-lg max-w-2xl mx-auto">
            แชร์ประสบการณ์เพื่อช่วยให้ร้านพัฒนาให้ดีขึ้น — ขอบคุณที่สนับสนุนร้านของเรา
          </p>
        </div>

        {/* Layout: form (left) + list (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: form */}
          <section className="lg:col-span-5">
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 md:p-7 sticky top-28">
              <div className="flex items-center justify-between gap-3 mb-5">
                <div>
                  <div className="text-lg font-extrabold text-gray-900">เขียนรีวิว</div>
                  <div className="text-sm text-gray-500 mt-1">ให้คะแนนและเล่าประสบการณ์สั้น ๆ</div>
                </div>
                <Pill tone="emerald">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Theme Green
                </Pill>
              </div>

              {/* textarea */}
              <label className="block text-sm font-semibold text-gray-800 mb-2">ความคิดเห็น</label>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                className="
                  w-full h-36 p-4 text-sm text-gray-800 bg-white
                  border border-gray-200 rounded-2xl resize-none
                  focus:outline-none focus:ring-4 focus:ring-emerald-200 focus:border-emerald-300
                  placeholder:text-gray-400
                "
                placeholder="เล่าให้หน่อยว่าชอบ/ไม่ชอบตรงไหน…"
              />

              {/* upload */}
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-semibold text-gray-800">แนบรูป</label>
                  <div className="text-xs text-gray-500">{images.length}/5</div>
                </div>

                <div className="mt-2">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={onPickImages}
                    className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4
                               file:rounded-full file:border-0 file:text-sm file:font-semibold
                               file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                  />
                </div>

                {images.length > 0 && (
                  <div className="mt-3 grid grid-cols-5 gap-2">
                    {previews.map((src, idx) => (
                      <div key={idx} className="aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                        <img src={src} alt="preview" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* rating */}
              <div className="mt-5">
                <label className="block text-sm font-semibold text-gray-800 mb-2">ให้คะแนน</label>
                <StarRating count={rating} interactive />
                {rating > 0 && <div className="mt-2 text-sm text-emerald-700 font-semibold">ให้คะแนน {rating} ดาว</div>}
              </div>

              {/* submit */}
              <button
                onClick={handleSubmit}
                disabled={review.trim() === '' || rating < 1}
                className="
                  mt-6 w-full inline-flex items-center justify-center gap-2
                  bg-emerald-600 text-white px-6 py-3 rounded-2xl
                  font-semibold text-sm shadow-sm hover:bg-emerald-700 transition
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                <FaPaperPlane className="text-base" />
                ส่งรีวิว
              </button>
            </div>
          </section>

          {/* Right: list */}
          <section className="lg:col-span-7">
            {/* summary */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 md:p-7 mb-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-lg font-extrabold text-gray-900">รีวิวจากลูกค้า</div>
                  <div className="text-sm text-gray-500 mt-1">ดูความคิดเห็นล่าสุดจากผู้ใช้งานจริง</div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-100">
                    <div className="text-xs text-emerald-700/70">รีวิวทั้งหมด</div>
                    <div className="text-xl font-extrabold text-emerald-800">{stats.total}</div>
                  </div>
                  <div className="px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-100">
                    <div className="text-xs text-emerald-700/70">คะแนนเฉลี่ย</div>
                    <div className="text-xl font-extrabold text-emerald-800">{stats.avg}</div>
                  </div>
                  <div className="px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-100">
                    <div className="text-xs text-emerald-700/70">พึงพอใจ</div>
                    <div className="text-xl font-extrabold text-emerald-800">{stats.satisfied}%</div>
                  </div>
                </div>
              </div>
            </div>

            {/* list */}
            <div className="space-y-4">
              {reviews.length === 0 ? (
                <div className="bg-white rounded-3xl p-10 text-center border border-gray-200 shadow-sm">
                  <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FaStar className="text-gray-300 text-2xl" />
                  </div>
                  <div className="text-gray-700 font-extrabold">ยังไม่มีรีวิว</div>
                  <div className="text-gray-500 text-sm mt-1">เป็นคนแรกที่แบ่งปันประสบการณ์ของคุณ</div>
                </div>
              ) : (
                reviews.map((r) => (
                  <article
                    key={r.id}
                    className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition"
                  >
                    <div className="flex items-start gap-4">
                      {/* avatar */}
                      <div className="flex-shrink-0">
                        <div className="w-11 h-11 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center">
                          <FaUserCircle className="text-emerald-600 text-2xl" />
                        </div>
                      </div>

                      {/* body */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-extrabold text-gray-900">{maskCustomerName(r.Cname)}</div>
                            {r.created_at && (
                              <div className="text-xs text-gray-500 mt-1">
                                {new Date(r.created_at).toLocaleString('th-TH')}
                              </div>
                            )}
                          </div>

                          <div className="shrink-0 text-right">
                            <div className="text-xs text-gray-500">คะแนน</div>
                            <div className="font-extrabold text-gray-900">{r.stars}/5</div>
                          </div>
                        </div>

                        <div className="mt-2">
                          <StarRating count={r.stars} />
                        </div>

                        <p className="mt-3 text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                          {r.text}
                        </p>

                        {/* images grid (Shopee-ish) */}
                        {r.images && r.images.length > 0 && (
                          <div className="mt-4">
                            <div className="grid grid-cols-3 gap-2">
                              {r.images.slice(0, 6).map((img, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => setOpenImg(img)}
                                  className="aspect-square rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 hover:border-emerald-200 transition"
                                  title="ดูรูป"
                                >
                                  <img
                                    src={toPublicImgUrl(img)}
                                    alt="review"
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                  />
                                </button>
                              ))}
                            </div>
                            {r.images.length > 6 && (
                              <div className="mt-2 text-xs text-gray-500">
                                และอีก {r.images.length - 6} รูป
                              </div>
                            )}
                          </div>
                        )}

                        {/* admin reply */}
                        {typeof r.admin_reply === 'string' && r.admin_reply.trim().length > 0 && (
                          <div className="mt-5 rounded-3xl border border-emerald-100 bg-emerald-50/50 p-4">
                            <div className="flex items-center justify-between gap-3 mb-2">
                              <Pill tone="emerald">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                Official Reply
                              </Pill>
                              {r.replied_at ? (
                                <div className="text-xs text-emerald-800/70">
                                  {new Date(r.replied_at).toLocaleString('th-TH')}
                                </div>
                              ) : null}
                            </div>
                            <div className="text-sm text-emerald-900 leading-relaxed whitespace-pre-wrap border-l-4 border-emerald-400 pl-3">
                              {r.admin_reply}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      </div>

      {/* modal ดูรูปใหญ่ */}
      {openImg && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-50 p-4"
          onClick={() => setOpenImg(null)}
        >
          <div className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-white/30">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <div className="text-sm font-extrabold text-gray-900">รูปจากรีวิว</div>
                <button
                  type="button"
                  className="p-2 rounded-full hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition"
                  onClick={() => setOpenImg(null)}
                  aria-label="close"
                >
                  <IconX />
                </button>
              </div>

              <div className="bg-black flex items-center justify-center">
                <img
                  src={toPublicImgUrl(openImg)}
                  alt="full"
                  className="w-full max-h-[80vh] object-contain"
                />
              </div>

              <div className="p-4">
                <button
                  className="w-full bg-emerald-600 text-white rounded-2xl py-3 font-semibold hover:bg-emerald-700 transition"
                  onClick={() => setOpenImg(null)}
                  type="button"
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
