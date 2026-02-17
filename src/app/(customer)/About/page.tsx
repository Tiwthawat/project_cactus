'use client';

import { apiFetch } from '@/app/lib/apiFetch';
import React, { useEffect, useMemo, useState } from 'react';
import {
  FaStar,
  FaRegStar,
  FaPaperPlane,
  FaQuoteLeft,
  FaUserCircle,
} from 'react-icons/fa';

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

  const admin_reply = typeof o.admin_reply === 'string' ? o.admin_reply : (o.admin_reply === null ? null : undefined);
  const replied_at = typeof o.replied_at === 'string' ? o.replied_at : (o.replied_at === null ? null : undefined);

  return { id, text, stars, Cname, images, created_at, admin_reply, replied_at };
}

const maskCustomerName = (full?: string) => {
  if (!full) return 'ผู้ใช้';
  const parts = full.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0][0] + 'xxx';
  }

  const first = parts[0];
  const last = parts[1];
  return `${first[0]}xxx ${last[0]}x`;
};

function toPublicImgUrl(path: string) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${API}${path}`;
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
    e.target.value = ''; // reset input ให้เลือกไฟล์เดิมซ้ำได้
  };

  const previews = useMemo(() => {
    return images.map((f) => URL.createObjectURL(f));
  }, [images]);

  useEffect(() => {
    // cleanup preview urls
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
      fd.append('text', review);
      fd.append('stars', String(rating));
      images.forEach((f) => fd.append('images', f)); // รูปสูงสุด 5

      const res = await apiFetch('/reviews/store', {
        method: 'POST',
        body: fd,
      });

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

  const StarRating = ({
    count,
    interactive = false,
  }: {
    count: number;
    interactive?: boolean;
  }) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={interactive ? () => setRating(star) : undefined}
            onMouseEnter={interactive ? () => setHoverRating(star) : undefined}
            onMouseLeave={interactive ? () => setHoverRating(0) : undefined}
            className={`text-3xl focus:outline-none transition-all duration-200 ${
              interactive ? 'hover:scale-110 cursor-pointer' : 'cursor-default'
            }`}
            disabled={!interactive}
          >
            {star <= (interactive ? hoverRating || rating : count) ? (
              <FaStar className="text-yellow-400" />
            ) : (
              <FaRegStar className="text-gray-300" />
            )}
          </button>
        ))}
      </div>
    );
  };

  return (
    <main className="mt-16 min-h-screen bg-white px-4 py-16">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-block bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2 rounded-full text-sm font-semibold mb-4">
            ความคิดเห็นของลูกค้า
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4">
            รีวิวเกี่ยวกับเรา
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            เรามุ่งมั่นที่จะให้บริการที่ดีที่สุดแก่ลูกค้าของเรา โปรดส่งความคิดเห็นของคุณเพื่อช่วยให้เราพัฒนา
          </p>
        </div>

        {/* Review Form */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl shadow-2xl p-8 md:p-10 mb-12 border-2 border-emerald-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
              <FaPaperPlane className="text-white text-xl" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">เขียนรีวิวของคุณ</h2>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-lg font-semibold mb-3">ความคิดเห็น</label>

            <div className="relative">
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                className="w-full h-40 p-4 text-base text-gray-800 bg-white border-2 border-gray-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all"
                placeholder="แบ่งปันประสบการณ์ของคุณกับเรา..."
              />
              <FaQuoteLeft className="absolute top-3 right-3 text-green-200 text-2xl" />
            </div>

            {/* Upload images */}
            <div className="mt-4">
              <label className="block text-gray-700 text-base font-semibold mb-2">
                เพิ่มรูป (สูงสุด 5 รูป)
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={onPickImages}
                className="block w-full text-sm text-gray-600"
              />

              {images.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-3">
                  {previews.map((src, idx) => (
                    <div
                      key={idx}
                      className="w-20 h-20 rounded-xl overflow-hidden border bg-white"
                      title="พรีวิว"
                    >
                      <img src={src} alt="preview" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}

              {images.length > 0 && (
                <div className="mt-2 text-xs text-gray-500">{images.length}/5 รูป</div>
              )}
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-gray-700 text-lg font-semibold mb-3">ให้คะแนน</label>
            <StarRating count={rating} interactive />
            {rating > 0 && <p className="mt-2 text-green-600 font-medium">คุณให้ {rating} ดาว</p>}
          </div>

          <button
            onClick={handleSubmit}
            disabled={review.trim() === '' || rating < 1}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            <FaPaperPlane />
            ส่งรีวิว
          </button>
        </div>

        {/* Reviews Section */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-800">รีวิวจากลูกค้า</h2>
            <div className="bg-green-100 text-green-700 px-4 py-2 rounded-full font-semibold">
              {reviews.length} รีวิว
            </div>
          </div>

          <div className="space-y-6">
            {reviews.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-gray-200">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaStar className="text-gray-300 text-3xl" />
                </div>
                <p className="text-gray-400 text-lg">ยังไม่มีรีวิว</p>
                <p className="text-gray-400 text-sm mt-2">เป็นคนแรกที่แบ่งปันประสบการณ์ของคุณ!</p>
              </div>
            ) : (
              reviews.map((r) => (
                <div
                  key={r.id}
                  className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100 hover:border-green-200 hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    {/* avatar */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                        <FaUserCircle className="text-white text-2xl" />
                      </div>
                    </div>

                    {/* content */}
                    <div className="flex-1 w-full">
                      <div className="flex items-start justify-between gap-4">
                        {/* left */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-semibold text-gray-700">{maskCustomerName(r.Cname)}</div>
                            <span className="text-sm text-gray-400 font-medium">{r.stars}/5</span>
                          </div>

                          <div className="flex space-x-1 mb-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <FaStar
                                key={star}
                                className={`text-xl ${star <= r.stars ? 'text-yellow-400' : 'text-gray-200'}`}
                              />
                            ))}
                          </div>

                          {r.created_at && (
                            <div className="text-xs text-gray-400 mb-3">
                              รีวิวเมื่อ: {new Date(r.created_at).toLocaleString('th-TH')}
                            </div>
                          )}

                          <p className="text-gray-700 text-base leading-relaxed">&quot;{r.text}&quot;</p>

                          {/* ✅ admin reply */}
                          {typeof r.admin_reply === 'string' && r.admin_reply.trim().length > 0 && (
                            <div className="mt-4 rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-4">
                              <div className="flex items-center justify-between gap-3 mb-2">
                                <div className="font-bold text-emerald-700">🗨️ แอดมินตอบกลับ</div>
                                {r.replied_at ? (
                                  <div className="text-xs text-emerald-700/70">
                                    {new Date(r.replied_at).toLocaleString('th-TH')}
                                  </div>
                                ) : null}
                              </div>
                              <p className="text-emerald-900 leading-relaxed whitespace-pre-wrap">
                                {r.admin_reply}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* right images */}
                        {r.images && r.images.length > 0 && (
                          <div className="flex flex-col gap-2 items-end">
                            {r.images.slice(0, 3).map((img, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setOpenImg(img)}
                                className="w-16 h-16 rounded-xl overflow-hidden border bg-gray-50"
                                title="กดดูรูป"
                              >
                                <img
                                  src={toPublicImgUrl(img)}
                                  alt="review"
                                  className="w-full h-full object-cover"
                                />
                              </button>
                            ))}

                            {r.images.length > 3 && (
                              <div className="text-xs text-gray-400">+{r.images.length - 3} รูป</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Stats Section */}
        {reviews.length > 0 && (
          <div className="mt-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-3xl p-8 text-white">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-4xl font-bold mb-2">{reviews.length}</div>
                <div className="text-green-100">รีวิวทั้งหมด</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">
                  {(reviews.reduce((sum, r) => sum + r.stars, 0) / reviews.length).toFixed(1)}
                </div>
                <div className="text-green-100">คะแนนเฉลี่ย</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">
                  {Math.round((reviews.filter((r) => r.stars >= 4).length / reviews.length) * 100)}%
                </div>
                <div className="text-green-100">ความพึงพอใจ</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* modal ดูรูปใหญ่ */}
      {openImg && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setOpenImg(null)}
        >
          <div className="max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={toPublicImgUrl(openImg)}
              alt="full"
              className="w-full max-h-[80vh] object-contain rounded-2xl bg-white"
            />
            <button
              className="mt-3 w-full bg-white rounded-xl py-2 font-semibold"
              onClick={() => setOpenImg(null)}
            >
              ปิด
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
