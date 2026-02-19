'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/app/lib/apiFetch';
import { FaStar } from 'react-icons/fa';

import StatusBadge from '@/app/component/StatusBadge';
import { getOrderBadge, statusLabel } from '@/app/lib/status';

const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';

function norm(v: unknown) {
  return String(v ?? '').trim().toLowerCase();
}

function isCodPay(p: unknown) {
  const x = norm(p);
  return x === 'cod' || x === 'cash_on_delivery' || x === 'cashondelivery';
}

// ✅ โอนเท่านั้น: สถานะที่ "อนุญาตแนบสลิป"
function isSlipAllowedStatus(s: unknown) {
  const v = String(s ?? '').trim();
  return v === 'pending_payment' || v === 'waiting';
}

// ✅ สถานะที่ "ไม่ควรทำอะไรแล้ว" (final/blocked)
function isFinalBlockedStatus(s: unknown) {
  const v = String(s ?? '').trim();
  return ['cancelled', 'failed', 'refunded'].includes(v);
}

interface Item {
  Pid: number;
  Pname: string;
  Ppicture: string; // อาจเป็น "a.jpg,b.jpg"
  Oquantity: number;
  Oprice: number;
}

interface Order {
  Oid: number;
  Odate: string;
  Oprice: number;
  Ostatus: string;
  Oslip: string | null;
  Opayment: string;
  items: Item[];
}

interface Review {
  stars: number;
  text: string;
  images?: string[];
}

function toImgUrl(path: string) {
  if (!path) return '/no-image.png';
  const clean = String(path).trim();
  if (clean.startsWith('http')) return clean;
  if (clean.startsWith('/')) return `${API}${clean}`;
  return `${API}/${clean}`;
}

function fmtBaht(n: number) {
  return Number(n || 0).toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id?.toString();

  const [order, setOrder] = useState<Order | null>(null);
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);

  // slip
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // review
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const [reviewFiles, setReviewFiles] = useState<File[]>([]);
  const [reviewPreviews, setReviewPreviews] = useState<string[]>([]);

  // -----------------------------
  // Load order + review
  // -----------------------------
  useEffect(() => {
    if (!id) return;

    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);

        const res = await apiFetch(`${API}/orders/${id}`);
        const data = await res.json();
        if (!mounted) return;
        setOrder(data);

        const reviewRes = await apiFetch(`${API}/orders/${id}/review`);
        const reviewData = await reviewRes.json().catch(() => null);
        if (!mounted) return;
        setReview(reviewData || null);
      } catch (err) {
        console.error('โหลดคำสั่งซื้อผิดพลาด:', err);
        if (mounted) setOrder(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
      // cleanup previews
      setReviewPreviews((prev) => {
        prev.forEach((u) => URL.revokeObjectURL(u));
        return [];
      });
    };
  }, [id]);

  // -----------------------------
  // Slip file change
  // -----------------------------
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      alert('ไฟล์ใหญ่เกิน 3MB');
      return;
    }

    setSlipFile(file);

    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    e.target.value = '';
  };

  // -----------------------------
  // Upload slip
  // -----------------------------
  const handleSlipUpload = async () => {
    if (!order || !id) return;

    const isCod = isCodPay(order.Opayment);

    // COD = ห้ามแนบสลิป
    if (isCod) {
      alert('ออเดอร์ปลายทางไม่ต้องแนบสลิป');
      return;
    }

    // สถานะ final/blocked = ห้ามแนบสลิป
    if (isFinalBlockedStatus(order.Ostatus)) {
      alert('สถานะออเดอร์นี้ไม่สามารถแนบสลิปได้');
      return;
    }

    // delivered = ไม่ควรแนบสลิปแล้ว
    if (String(order.Ostatus || '').trim() === 'delivered') {
      alert('ออเดอร์นี้ปิดงานแล้ว');
      return;
    }

    // เคยแนบแล้ว
    if (order.Oslip) {
      alert('คุณส่งสลิปไปแล้ว');
      return;
    }

    // แนบได้เฉพาะ pending_payment / waiting
    if (!isSlipAllowedStatus(order.Ostatus)) {
      alert('แนบสลิปได้เฉพาะออเดอร์ที่รอชำระเงินเท่านั้น');
      return;
    }

    if (!slipFile) {
      alert('กรุณาเลือกสลิปก่อน');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', slipFile);

      const uploadRes = await apiFetch(`${API}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({}));
        alert(err?.message || 'อัปโหลดไฟล์ไม่สำเร็จ');
        return;
      }

      const { url } = await uploadRes.json();

      const patchRes = await apiFetch(`${API}/orders/${id}/slip`, {
        method: 'PATCH',
        body: JSON.stringify({ slipUrl: url }),
      });

      if (!patchRes.ok) {
        const err = await patchRes.json().catch(() => ({}));
        alert(err?.message || 'บันทึกสลิปไม่สำเร็จ');
        return;
      }

      const updated = await apiFetch(`${API}/orders/${id}`).then((res) => res.json());
      setOrder(updated);
      setSlipFile(null);
      setPreview(null);

      alert('อัปโหลดสลิปเรียบร้อย');
    } catch (err) {
      alert('อัปโหลดสลิปล้มเหลว');
      console.error(err);
    }
  };

  // -----------------------------
  // Confirm received
  // -----------------------------
  const handleConfirmReceived = async () => {
    const ok = window.confirm('ยืนยันว่าคุณได้รับสินค้าแล้ว?');
    if (!ok || !id) return;

    try {
      const res = await apiFetch(`${API}/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'delivered' }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err?.message || 'อัปเดตสถานะไม่สำเร็จ');
        return;
      }

      const updated = await apiFetch(`${API}/orders/${id}`).then((r) => r.json());
      setOrder(updated);
    } catch (e) {
      console.error(e);
      alert('อัปเดตสถานะไม่สำเร็จ');
    }
  };

  // -----------------------------
  // Review images
  // -----------------------------
  const handleReviewFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const remain = 5 - reviewFiles.length;
    const selected = files.slice(0, remain);

    setReviewFiles((prev) => [...prev, ...selected]);
    setReviewPreviews((prev) => [...prev, ...selected.map((f) => URL.createObjectURL(f))]);

    e.target.value = '';
  };

  const removeReviewImage = (index: number) => {
    setReviewFiles((prev) => prev.filter((_, i) => i !== index));
    setReviewPreviews((prev) => {
      const target = prev[index];
      if (target) URL.revokeObjectURL(target);
      return prev.filter((_, i) => i !== index);
    });
  };

  const clearReviewImages = () => {
    reviewPreviews.forEach((url) => URL.revokeObjectURL(url));
    setReviewFiles([]);
    setReviewPreviews([]);
  };

  // -----------------------------
  // Review submit
  // -----------------------------
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    if (!comment.trim()) {
      alert('กรุณาเขียนความคิดเห็นก่อน');
      return;
    }

    try {
      const fd = new FormData();
      fd.append('stars', String(rating));
      fd.append('text', comment.trim());
      reviewFiles.forEach((f) => fd.append('images', f));

      const res = await apiFetch(`${API}/orders/${id}/review`, {
        method: 'POST',
        body: fd,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err?.message || 'ส่งรีวิวไม่สำเร็จ');
        return;
      }

      const reviewRes = await apiFetch(`${API}/orders/${id}/review`);
      setReview(await reviewRes.json().catch(() => null));

      clearReviewImages();
      setComment('');
      setRating(5);

      alert('ส่งรีวิวสำเร็จ');
    } catch (err) {
      console.error(err);
      alert('ส่งรีวิวไม่สำเร็จ');
    }
  };

  // -----------------------------
  // Delete review
  // -----------------------------
  const handleDeleteReview = async () => {
    const ok = window.confirm('ต้องการลบรีวิวนี้หรือไม่?');
    if (!ok || !id) return;

    try {
      const res = await apiFetch(`${API}/orders/${id}/review`, { method: 'DELETE' });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err?.message || 'ลบรีวิวไม่สำเร็จ');
        return;
      }

      setReview(null);
      clearReviewImages();
      alert('ลบรีวิวสำเร็จ');
    } catch {
      alert('ลบรีวิวไม่สำเร็จ');
    }
  };

  const handleBuyAgain = () => {
    if (!order) return;

    const newCart = order.items.map((item) => ({
      Pid: item.Pid,
      Pname: item.Pname,
      Ppicture: item.Ppicture,
      Pprice: item.Oprice,
      quantity: item.Oquantity,
    }));

    localStorage.setItem('cart', JSON.stringify(newCart));
    router.push('/cart');
  };

  // -----------------------------
  // UI states
  // -----------------------------
  if (loading) return <p className="p-6 text-center">กำลังโหลดข้อมูล...</p>;
  if (!order) return <p className="p-6 text-center text-red-600">ไม่พบคำสั่งซื้อ</p>;

  const isCod = isCodPay(order.Opayment);

  // ✅ status label สำหรับ “ลูกค้า”
  const orderMeta = getOrderBadge(order.Ostatus, order.Opayment, 'customer');

  // รวมยอดแบบจาก items (ไว้แสดง breakdown)
  const itemsSubtotal =
    order.items?.reduce((sum, it) => sum + Number(it.Oprice) * Number(it.Oquantity), 0) ?? 0;

  // NOTE: ถ้าระบบจริงค่าส่งมาจาก backend ให้เปลี่ยนไปใช้ field นั้นแทน
  const shippingFee = itemsSubtotal >= 1000 ? 0 : 50;
  const grandTotal = itemsSubtotal + shippingFee;

  // ✅ กันแนบสลิป: โอนเท่านั้น + ยังไม่เคยแนบ + ยังไม่ final + อยู่ในสถานะที่อนุญาต
  const canUploadSlip =
    !isCod &&
    !order.Oslip &&
    !isFinalBlockedStatus(order.Ostatus) &&
    String(order.Ostatus || '').trim() !== 'delivered' &&
    isSlipAllowedStatus(order.Ostatus);

  // ✅ ปุ่มยืนยันรับ: ควรขึ้นตอน "shipping" เท่านั้น (ลูกค้าเห็นเป็น "รอรับสินค้า")
  const canConfirmReceived = String(order.Ostatus || '').trim() === 'shipping';

const cover = toImgUrl(
  String(order.items?.[0]?.Ppicture || '').split(',')[0] || ''
);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 text-black">
      <div className="max-w-5xl mx-auto pt-28 md:pt-32 p-4 md:p-6">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl md:text-4xl font-extrabold text-gray-900">
                รายละเอียดคำสั่งซื้อ
              </h1>
              <p className="text-gray-500 mt-1">
                เลขที่คำสั่งซื้อ <span className="font-semibold">#{order.Oid}</span>
              </p>
            </div>

            <div className="shrink-0">
              <StatusBadge
                label={orderMeta.label}
                tone={orderMeta.tone}
                className="px-4 py-2 rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* Top summary card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
          <div className="grid md:grid-cols-[240px,1fr]">
            <div className="bg-gray-50 p-4 md:p-5 border-b md:border-b-0 md:border-r border-gray-200">
              <div className="aspect-[4/3] rounded-xl overflow-hidden bg-white border border-gray-200">
                <img src={cover} alt="cover" className="w-full h-full object-cover" />
              </div>
              <div className="mt-3 text-sm text-gray-600">
                <div className="flex items-center justify-between">
                  <span>วันที่สั่งซื้อ</span>
                  <span className="font-semibold text-gray-800">
                    {new Date(order.Odate).toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <span>ชำระแบบ</span>
                  <span className="font-semibold text-gray-800">
                    {isCod ? 'ชำระปลายทาง (COD)' : 'โอนเงิน'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 md:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-gray-900">สรุปยอด</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    ตรวจสอบรายการสินค้าและยอดรวมของคำสั่งซื้อนี้
                  </p>
                </div>

                {canConfirmReceived && (
                  <button
                    onClick={handleConfirmReceived}
                    className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold transition"
                  >
                    ยืนยันรับสินค้า
                  </button>
                )}
              </div>

              <div className="mt-4 grid sm:grid-cols-3 gap-3">
                <div className="rounded-xl border border-gray-200 p-4 bg-white">
                  <div className="text-xs text-gray-500">ยอดรวมสินค้า</div>
                  <div className="text-lg font-extrabold text-gray-900 mt-1">
                    {fmtBaht(itemsSubtotal)} บาท
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 p-4 bg-white">
                  <div className="text-xs text-gray-500">ค่าส่ง</div>
                  <div className="text-lg font-extrabold text-gray-900 mt-1">
                    {shippingFee === 0 ? 'ฟรี' : `${fmtBaht(shippingFee)} บาท`}
                  </div>
                </div>

                <div className="rounded-xl border border-emerald-200 p-4 bg-emerald-50">
                  <div className="text-xs text-emerald-700">ยอดสุทธิ</div>
                  <div className="text-xl font-extrabold text-emerald-800 mt-1">
                    {fmtBaht(grandTotal)} บาท
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Items list */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 md:p-6 mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg md:text-xl font-bold text-gray-900">รายการสินค้า</h2>
            <span className="text-sm text-gray-500">
              {order.items?.length || 0} รายการ
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {order.items?.map((item) => {
              const itemTotal = Number(item.Oprice) * Number(item.Oquantity);
              const pic = (item.Ppicture || '').split(',')[0] || '';
              const img = toImgUrl(pic);

              return (
                <div
                  key={item.Pid}
                  className="flex gap-4 items-center p-4 rounded-xl border border-gray-200 bg-white"
                >
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                    <img src={img} alt={item.Pname} className="w-full h-full object-cover" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 truncate">{item.Pname}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      จำนวน <span className="font-semibold text-gray-800">{item.Oquantity}</span>
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-gray-500">ราคาต่อชิ้น</p>
                    <p className="font-bold text-gray-900">{fmtBaht(Number(item.Oprice))}</p>
                    <p className="text-sm text-gray-500 mt-1">รวม</p>
                    <p className="font-extrabold text-emerald-700">{fmtBaht(itemTotal)}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 pt-4 border-t border-gray-200 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <button
              onClick={() => router.push('/me/orders')}
              className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold transition"
            >
              กลับไปหน้ารายการ
            </button>

            {String(order.Ostatus || '').trim() === 'delivered' && (
              <button
                onClick={handleBuyAgain}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition"
              >
                สั่งซื้ออีกครั้ง
              </button>
            )}
          </div>
        </div>

        {/* Payment / Slip section (โอนเท่านั้น) */}
        {!isCod && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 md:p-6 mb-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg md:text-xl font-bold text-gray-900">การชำระเงิน</h2>
                <p className="text-sm text-gray-500 mt-1">
                  แนบสลิปได้เฉพาะสถานะ “รอชำระเงิน”
                </p>
              </div>

              {order.Oslip && (
                <div className="shrink-0">
                  <StatusBadge label="ส่งสลิปแล้ว" tone="green" className="px-4 py-2 rounded-xl" />
                </div>
              )}
            </div>

            {order.Oslip ? (
              <div className="mt-4">
                <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                  <img src={toImgUrl(order.Oslip)} alt="slip" className="w-full h-auto block" />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  สถานะ: <span className="font-semibold">{statusLabel(order.Ostatus)}</span>
                </p>
              </div>
            ) : isFinalBlockedStatus(order.Ostatus) || String(order.Ostatus || '').trim() === 'delivered' ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-red-700 font-semibold">
                  ไม่สามารถแนบสลิปได้ในสถานะนี้ ({statusLabel(order.Ostatus)})
                </p>
              </div>
            ) : (
              <div className="mt-4">
                <div className="grid md:grid-cols-[1fr,320px] gap-4 items-start">
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="block w-full border border-gray-300 p-3 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition"
                      disabled={!canUploadSlip}
                    />

                    {!canUploadSlip && (
                      <p className="mt-2 text-xs text-gray-500">
                        ตอนนี้ยังแนบสลิปไม่ได้ (ต้องเป็น “รอชำระเงิน” และยังไม่เคยแนบ)
                      </p>
                    )}

                    <button
                      onClick={handleSlipUpload}
                      disabled={!slipFile || !canUploadSlip}
                      className="mt-3 w-full md:w-auto px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold disabled:opacity-50 transition"
                    >
                      อัปโหลดสลิป
                    </button>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-gray-50 overflow-hidden">
                    {preview ? (
                      <img src={preview} alt="preview" className="w-full h-auto block" />
                    ) : (
                      <div className="p-6 text-center text-sm text-gray-500">
                        ยังไม่ได้เลือกรูปสลิป
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* COD notice */}
        {isCod && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 md:p-6 mb-6">
            <h2 className="text-lg md:text-xl font-bold text-gray-900">การชำระเงิน</h2>
            <p className="text-sm text-gray-500 mt-1">
              คำสั่งซื้อนี้เป็นแบบชำระปลายทาง (COD) ไม่ต้องแนบสลิป
            </p>
          </div>
        )}

        {/* Review */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-bold text-gray-900">รีวิวสินค้า</h2>
          <p className="text-sm text-gray-500 mt-1">
            รีวิวได้เมื่อคำสั่งซื้ออยู่สถานะ “ได้รับแล้ว”
          </p>

          {/* form */}
          {String(order.Ostatus || '').trim() === 'delivered' && !review && (
            <form onSubmit={handleReviewSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  คะแนน
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="focus:outline-none"
                      aria-label={`ให้คะแนน ${star}`}
                    >
                      <FaStar
                        className={`text-2xl transition-colors ${
                          star <= rating ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-sm text-gray-500 ml-2">{rating}/5</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  ความคิดเห็น
                </label>
                <textarea
                  placeholder="แชร์ประสบการณ์การสั่งซื้อของคุณ"
                  className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 focus:border-emerald-400 focus:outline-none transition min-h-[110px]"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  แนบรูป (สูงสุด 5 รูป)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleReviewFiles}
                  className="block w-full border border-gray-300 p-3 rounded-xl cursor-pointer bg-gray-50"
                  disabled={reviewFiles.length >= 5}
                />

                <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                  <span>{reviewFiles.length}/5 รูป</span>
                  {reviewFiles.length > 0 && (
                    <button
                      type="button"
                      onClick={clearReviewImages}
                      className="text-red-600 hover:underline font-semibold"
                    >
                      ล้างรูปทั้งหมด
                    </button>
                  )}
                </div>

                {reviewPreviews.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-3">
                    {reviewPreviews.map((src, i) => (
                      <div
                        key={i}
                        className="relative aspect-square rounded-xl border border-gray-200 bg-gray-50 overflow-hidden"
                      >
                        <img src={src} alt={`preview-${i}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeReviewImage(i)}
                          className="absolute top-1 right-1 bg-black/60 text-white w-7 h-7 rounded-full flex items-center justify-center hover:bg-black/80"
                          title="ลบรูป"
                          aria-label="ลบรูป"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition"
              >
                ส่งรีวิว
              </button>
            </form>
          )}

          {/* display review */}
          {review && (
            <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <FaStar
                      key={star}
                      className={`text-lg ${star <= review.stars ? 'text-yellow-400' : 'text-gray-300'}`}
                    />
                  ))}
                  <span className="text-sm text-gray-600">{review.stars}/5</span>
                </div>

                <button
                  onClick={handleDeleteReview}
                  className="px-4 py-2 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 font-semibold transition"
                >
                  ลบรีวิว
                </button>
              </div>

              <p className="text-gray-800 mt-3 whitespace-pre-wrap">
                {review.text || '—'}
              </p>

              {review.images?.length ? (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-4">
                  {review.images.map((img, i) => (
                    <div
                      key={i}
                      className="aspect-square rounded-xl border border-gray-200 bg-white overflow-hidden"
                    >
                      <img src={toImgUrl(img)} alt={`review-img-${i}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          )}

          {/* if not delivered */}
          {String(order.Ostatus || '').trim() !== 'delivered' && !review && (
            <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
              ยังรีวิวไม่ได้จนกว่าจะอยู่สถานะ “ได้รับแล้ว”
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
