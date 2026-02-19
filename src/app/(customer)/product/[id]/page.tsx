'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  FaShoppingCart,
  FaHeart,
  FaRegHeart,
  FaMinus,
  FaPlus,
  FaCheck,
} from 'react-icons/fa';
import { IoFlashSharp } from 'react-icons/io5';

const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';

interface Product {
  Pid: number;
  Pname: string;
  Pprice: number;
  Ppicture: string;
  Pstatus: string;
  Pnumproduct: number; // stock
  Prenume: number;
  Pdetail: string;
}

interface ProductOrderReview {
  id: number;
  text: string;
  stars: number;
  created_at: string;
  order_id: number;
  images?: string[];

  admin_reply?: string | null;
  replied_at?: string | null;
}

interface ReviewSummary {
  avg_stars: number;
  total: number;
}

function toImgUrl(path: string) {
  if (!path) return '';
  const clean = String(path).trim();
  if (!clean) return '';
  if (clean.startsWith('http')) return clean;
  if (clean.startsWith('/')) return `${API}${clean}`;
  return `${API}/${clean}`;
}

function safeParseImages(raw: any): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter((x) => typeof x === 'string');
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter((x) => typeof x === 'string');
      return [];
    } catch {
      return raw.startsWith('/') ? [raw] : [];
    }
  }
  return [];
}

function clampStars(n: number) {
  const x = Number(n || 0);
  return Math.max(0, Math.min(5, x));
}

function clampInt(n: number, min: number, max: number) {
  const x = Math.floor(Number.isFinite(n) ? n : min);
  return Math.max(min, Math.min(max, x));
}

function fmtMoney(n: number) {
  return Number(n || 0).toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const btnPrimary =
  "h-12 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-extrabold shadow-lg " +
  "hover:from-green-700 hover:to-emerald-700 hover:shadow-xl transition " +
  "disabled:opacity-50 disabled:cursor-not-allowed";

const btnSecondary =
  "h-12 rounded-2xl border-2 border-emerald-500 bg-white text-emerald-700 font-extrabold " +
  "hover:bg-emerald-50 transition disabled:opacity-50 disabled:cursor-not-allowed";

const iconBtn =
  "h-11 w-11 rounded-2xl border border-slate-200 bg-white text-slate-900 font-extrabold " +
  "hover:bg-emerald-50 hover:border-emerald-200 transition disabled:opacity-40";


export default function ProductDetail() {
  const params = useParams();
  const idParam = (params as any)?.id;
  const id = Array.isArray(idParam) ? idParam[0] : idParam;

  const [product, setProduct] = useState<Product | null>(null);
  const [mainImage, setMainImage] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);

  const [isFavorite, setIsFavorite] = useState<boolean>(false);

  const [reviewSummary, setReviewSummary] = useState<ReviewSummary | null>(null);
  const [reviews, setReviews] = useState<ProductOrderReview[]>([]);
  const [reviewLoading, setReviewLoading] = useState(true);

  const [openImg, setOpenImg] = useState<string | null>(null);

  const token = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }, []);

  const pictures = useMemo(() => {
    if (!product?.Ppicture) return [];
    return product.Ppicture
      .split(',')
      .map((pic) => pic.trim())
      .filter(Boolean);
  }, [product?.Ppicture]);

  const stock = product?.Pnumproduct ?? 0;
  const isOut = stock <= 0;
  const lowStock = stock > 0 && stock <= 5;

  const fetchProduct = async () => {
    if (!id) return;
    const res = await fetch(`${API}/product/${id}`);
    const data = await res.json().catch(() => null);

    if (!res.ok || !data) {
      setProduct(null);
      return;
    }

    setProduct(data);
    const first = String(data.Ppicture || '').split(',')[0]?.trim() || '';
    setMainImage(first);

    const maxQty = Math.max(1, Number(data.Pnumproduct || 0));
    setQuantity(clampInt(1, 1, maxQty));
  };

  const fetchFavoriteStatus = async () => {
    if (!id || !token) return;

    const res = await fetch(`${API}/favorites`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json().catch(() => null);

    if (Array.isArray(data)) {
      const found = data.some((f: any) => Number(f.product_id) === Number(id));
      setIsFavorite(found);
    }
  };

  const fetchReviews = async () => {
    if (!id) return;

    try {
      setReviewLoading(true);

      const [sumRes, listRes] = await Promise.all([
        fetch(`${API}/products/${id}/reviews/summary`),
        fetch(`${API}/products/${id}/reviews`),
      ]);

      const sumJson: any = sumRes.ok ? await sumRes.json().catch(() => null) : null;
      const listJson: any = listRes.ok ? await listRes.json().catch(() => null) : null;

      setReviewSummary({
        avg_stars: Number(sumJson?.avg_stars ?? 0),
        total: Number(sumJson?.total ?? 0),
      });

      const normalized: ProductOrderReview[] = Array.isArray(listJson)
        ? listJson.map((r: any) => ({
            ...r,
            images: safeParseImages(r.images),
          }))
        : [];

      setReviews(normalized);
    } catch {
      setReviewSummary({ avg_stars: 0, total: 0 });
      setReviews([]);
    } finally {
      setReviewLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    fetchProduct();
    fetchFavoriteStatus();
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const toggleFavorite = async () => {
    if (!token) {
      alert('กรุณาเข้าสู่ระบบก่อนค่ะ 🌵');
      return;
    }

    const res = await fetch(`${API}/favorites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ product_id: Number(id) }),
    });

    const data = await res.json().catch(() => null);
    if (res.ok && data) {
      setIsFavorite(Boolean(data.is_favorite));
    }
  };

  // ✅ clamp ทุกครั้งที่ stock เปลี่ยน (กัน stock 0 แล้ว qty ยัง 3)
  useEffect(() => {
    if (!product) return;
    const maxQty = Math.max(1, product.Pnumproduct || 0);
    setQuantity((q) => clampInt(q, 1, maxQty));
  }, [product?.Pnumproduct]);

  const onQtyInput = (raw: string) => {
    if (!product) return;
    const maxQty = Math.max(1, product.Pnumproduct || 0);

    // allow empty while typing
    if (raw === '') return setQuantity(1);

    const v = Number(raw);
    if (!Number.isFinite(v)) return;

    setQuantity(clampInt(v, 1, maxQty)); // ✅ เกิน/ต่ำกว่า → clamp
  };

  const increaseQuantity = () => {
    if (!product) return;
    const maxQty = Math.max(1, product.Pnumproduct || 0);
    setQuantity((q) => clampInt(q + 1, 1, maxQty));
  };

  const decreaseQuantity = () => {
    if (!product) return;
    const maxQty = Math.max(1, product.Pnumproduct || 0);
    setQuantity((q) => clampInt(q - 1, 1, maxQty));
  };

  const addToCart = () => {
    if (!product) return;

    if (product.Pnumproduct <= 0) {
      alert('สินค้าหมดแล้วค่ะ');
      return;
    }

    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingIndex = cart.findIndex((item: any) => item.Pid === product.Pid);

    const maxQty = Math.max(0, product.Pnumproduct || 0);

    if (existingIndex !== -1) {
      const current = Number(cart[existingIndex].quantity || 0);
      const next = Math.min(maxQty, current + quantity); // ✅ กันรวมเกิน stock
      cart[existingIndex].quantity = next;
      if (next === maxQty) {
        alert('เพิ่มลงตะกร้าแล้ว (ถึงจำนวนสูงสุดตามสต๊อกแล้ว)');
      } else {
        alert('เพิ่มลงตะกร้าแล้ว');
      }
    } else {
      const next = Math.min(maxQty, quantity);
      cart.push({
        Pid: product.Pid,
        Pname: product.Pname,
        Pprice: Number(product.Pprice),
        Ppicture: String(product.Ppicture || '').split(',')[0].trim(),
        quantity: next,
        stock: maxQty, // ✅ เผื่อใช้หน้าตะกร้า
      });
      if (next === maxQty && quantity > maxQty) {
        alert('เพิ่มลงตะกร้าแล้ว (ปรับจำนวนตามสต๊อก)');
      } else {
        alert('เพิ่มลงตะกร้าแล้ว');
      }
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cart-updated'));
  };

  const handleBuyNow = () => {
    if (!product) return;

    if (product.Pnumproduct <= 0) {
      alert('สินค้าหมดแล้วค่ะ');
      return;
    }

    const maxQty = Math.max(1, product.Pnumproduct || 1);
    const safeQty = clampInt(quantity, 1, maxQty);

    localStorage.setItem('buynow', JSON.stringify({ pid: product.Pid, qty: safeQty }));
    window.location.href = '/checkout?type=buynow';
  };

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-emerald-50/40 text-slate-900">
        <div className="max-w-6xl mx-auto px-4 pt-28">
          <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_20px_60px_-45px_rgba(2,6,23,0.55)]">
            กำลังโหลดข้อมูลสินค้า...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-emerald-50/40 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 pt-24 pb-16">
        {/* Top */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: images */}
          <div className="lg:col-span-7">
            <div className="rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_60px_-45px_rgba(2,6,23,0.55)] overflow-hidden">
              <div className="relative">
                {/* favorite */}
                <button
                  onClick={toggleFavorite}
                  className={`absolute top-4 right-4 z-10 h-12 w-12 grid place-items-center rounded-full border transition-all
                    ${
                      isFavorite
                        ? 'bg-rose-600 border-rose-600 text-white shadow-lg scale-[1.02]'
                        : 'bg-white/80 border-slate-200 text-rose-600 hover:bg-rose-50'
                    }`}
                  aria-label="favorite"
                  type="button"
                >
                  {isFavorite ? (
                    <FaHeart className="text-xl" />
                  ) : (
                    <FaRegHeart className="text-xl" />
                  )}
                </button>

                <div className="aspect-[1/1] bg-slate-50">
                  <img
                    src={toImgUrl(mainImage)}
                    alt={product.Pname}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* thumbs */}
              {pictures.length > 1 && (
                <div className="p-4 border-t border-slate-100">
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {pictures.map((pic, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setMainImage(pic)}
                        className={`relative w-20 h-20 flex-shrink-0 rounded-2xl overflow-hidden border transition
                          ${
                            mainImage === pic
                              ? 'border-emerald-400 ring-4 ring-emerald-100'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        title="เปลี่ยนรูป"
                      >
                        <img
                          src={toImgUrl(pic)}
                          alt={`รูปแบบ ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {mainImage === pic && (
                          <div className="absolute inset-0 bg-black/25 grid place-items-center">
                            <FaCheck className="text-white text-2xl" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: info */}
          <div className="lg:col-span-5">
            <div className="rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_60px_-45px_rgba(2,6,23,0.55)] overflow-hidden">
              {/* Header */}
              <div className="px-7 pt-7 pb-6 border-b border-slate-100">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3.5 py-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-[11px] font-extrabold tracking-wide text-emerald-800">
                    PRODUCT
                  </span>
                </div>

                <div className="mt-4">
                  <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
                    {product.Pname}
                  </h1>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                    {product.Pdetail}
                  </p>
                </div>

                <div className="mt-5 flex items-end justify-between gap-4">
                  <div className="text-3xl font-extrabold tracking-tight text-slate-900">
                    {fmtMoney(Number(product.Pprice))} บาท
                  </div>

                  <div
                    className={`shrink-0 rounded-full border px-3 py-1 text-xs font-extrabold
                      ${
                        isOut
                          ? 'border-rose-200 bg-rose-50 text-rose-700'
                          : lowStock
                          ? 'border-amber-200 bg-amber-50 text-amber-800'
                          : 'border-slate-200 bg-slate-50 text-slate-700'
                      }`}
                  >
                    {isOut ? 'สินค้าหมด' : lowStock ? `เหลือน้อย • ${stock} ชิ้น` : `คงเหลือ ${stock} ชิ้น`}
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="px-7 py-6 space-y-5">
                {/* Qty */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/40 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-extrabold text-slate-900">จำนวน</div>
                      <div className="mt-1 text-xs text-slate-600">
                        {isOut ? 'ไม่สามารถสั่งซื้อได้' : 'ปรับจำนวนได้ตามสต๊อก'}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={decreaseQuantity}
                        className="h-11 w-11 rounded-2xl border border-slate-200 bg-white text-slate-900 font-extrabold hover:bg-slate-50 transition disabled:opacity-40"
                        disabled={quantity <= 1 || isOut}
                        type="button"
                        aria-label="ลดจำนวน"
                      >
                        <FaMinus className="mx-auto" />
                      </button>

                      <input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={Math.max(1, stock)}
                        value={quantity}
                        disabled={isOut}
                        onChange={(e) => onQtyInput(e.target.value)}
                        className="h-11 w-20 rounded-2xl border border-slate-200 bg-white text-center font-extrabold text-slate-900 outline-none
                          focus:ring-4 focus:ring-emerald-100 focus:border-emerald-300 transition disabled:opacity-60"
                      />

                      <button
  onClick={decreaseQuantity}
  className={iconBtn}
  disabled={quantity <= 1 || isOut}
  type="button"
>
  <FaMinus className="mx-auto" />
</button>

<button
  onClick={increaseQuantity}
  className={iconBtn}
  disabled={isOut || quantity >= Math.max(1, stock)}
  type="button"
>
  <FaPlus className="mx-auto" />
</button>

                    </div>
                  </div>

                  {!isOut && (
                    <div className="mt-3 text-xs text-slate-600">
                      สูงสุดที่สั่งได้ตอนนี้:{' '}
                      <span className="font-extrabold text-slate-900">{stock}</span> ชิ้น
                      {lowStock && (
                        <span className="ml-2 inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 font-extrabold text-amber-800">
                          เหลือน้อย
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
  <button
    onClick={addToCart}
    disabled={isOut}
    className={btnSecondary}
    type="button"
  >
    <span className="inline-flex items-center justify-center gap-2">
      <FaShoppingCart />
      เพิ่มใส่ตะกร้า
    </span>
  </button>

  <button
    onClick={handleBuyNow}
    disabled={isOut}
    className={btnPrimary}
    type="button"
  >
    <span className="inline-flex items-center justify-center gap-2">
      <IoFlashSharp />
      สั่งซื้อเลย
    </span>
  </button>
</div>


                <div className="text-[11px] text-slate-500 leading-relaxed">
                  * จำนวนที่พิมพ์เกินสต๊อก ระบบจะปรับให้อัตโนมัติ
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div className="mt-12">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
                  รีวิวสินค้า
                </h2>
                <div className="mt-1 text-sm text-slate-600">
                  แสดงรีวิวจากคำสั่งซื้อที่มีสินค้านี้จริง (รีวิว 1 ครั้งต่อออเดอร์)
                </div>
              </div>

              <span className="hidden sm:inline-flex text-xs px-3 py-1 rounded-full bg-slate-50 text-slate-700 border border-slate-200">
                Order-based Reviews
              </span>
            </div>

            {/* summary */}
            <div className="rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_60px_-45px_rgba(2,6,23,0.55)] p-6 mb-6">
              {reviewLoading ? (
                <p className="text-slate-600">กำลังโหลดสรุปรีวิว...</p>
              ) : (
                <div className="flex items-center gap-5">
                  <div className="text-5xl font-extrabold text-amber-500">
                    {(reviewSummary?.avg_stars ?? 0).toFixed(1)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-amber-500 text-sm">
                      {'★'.repeat(Math.round(reviewSummary?.avg_stars ?? 0))}
                      {'☆'.repeat(5 - Math.round(reviewSummary?.avg_stars ?? 0))}
                    </div>
                    <div className="mt-1 text-sm text-slate-600">
                      จากทั้งหมด{' '}
                      <span className="font-extrabold text-slate-900">
                        {reviewSummary?.total ?? 0}
                      </span>{' '}
                      รีวิว
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* list */}
            {reviewLoading ? (
              <p className="text-slate-600">กำลังโหลดรีวิว...</p>
            ) : reviews.length === 0 ? (
              <div className="rounded-[28px] border border-slate-200 bg-white p-10 text-center text-slate-600">
                ยังไม่มีรีวิวสำหรับสินค้านี้
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((r) => {
                  const s = clampStars(r.stars);

                  return (
                    <div
                      key={r.id}
                      className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-1 rounded-full bg-slate-50 text-slate-700 border border-slate-200">
                            ออเดอร์ #{r.order_id}
                          </span>
                          <span className="text-xs text-slate-400">
                            {r.created_at
                              ? new Date(r.created_at).toLocaleString('th-TH')
                              : ''}
                          </span>
                        </div>

                        <span className="text-amber-500 text-sm">
                          {'★'.repeat(s)}
                          {'☆'.repeat(5 - s)}
                        </span>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-sm text-slate-700 leading-relaxed">
                        “{r.text}”
                      </div>

                      {!!(r.images && r.images.length) && (
                        <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
                          {r.images.filter(Boolean).map((img, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setOpenImg(img)}
                              className="relative w-24 h-24 rounded-2xl border border-slate-200 overflow-hidden bg-white hover:border-slate-300 transition"
                              title="กดดูรูป"
                            >
                              <img
                                src={toImgUrl(img)}
                                alt="review"
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      )}

                      {r.admin_reply ? (
                        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-sm font-extrabold text-emerald-800">
                              แอดมินตอบกลับ
                            </span>
                            {r.replied_at ? (
                              <span className="text-xs text-emerald-800/70">
                                {new Date(r.replied_at).toLocaleString('th-TH')}
                              </span>
                            ) : null}
                          </div>
                          <div className="text-sm text-emerald-900 leading-relaxed">
                            “{r.admin_reply}”
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* modal image */}
        {openImg && (
          <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={() => setOpenImg(null)}
          >
            <div
              className="max-w-3xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="rounded-[28px] bg-white p-4 shadow-2xl">
                <img
                  src={toImgUrl(openImg)}
                  alt="full"
                  className="w-full max-h-[78vh] object-contain rounded-2xl bg-slate-50"
                />

                <button
                  className="mt-3 w-full h-12 rounded-2xl bg-slate-900 text-white font-extrabold hover:bg-slate-800 transition"
                  type="button"
                  onClick={() => setOpenImg(null)}
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
