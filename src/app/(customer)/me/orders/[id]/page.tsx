'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from "@/app/lib/apiFetch";
import { FaStar } from 'react-icons/fa';

const API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000";

// ✅ แก้ตรงนี้ให้ตรงกับระบบจริง (สถานะที่ "อนุญาตแนบสลิป")
const SLIP_ALLOWED_STATUS = 'pending'; // เช่น 'pending_payment'

interface Item {
  Pid: number;
  Pname: string;
  Ppicture: string;
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

    const load = async () => {
      try {
        const res = await apiFetch(`${API}/orders/${id}`);
        const data = await res.json();
        setOrder(data);

        const reviewRes = await apiFetch(`${API}/orders/${id}/review`);
        const reviewData = await reviewRes.json();
        if (reviewData) setReview(reviewData);
      } catch (err) {
        console.error('โหลดคำสั่งซื้อผิดพลาด:', err);
      } finally {
        setLoading(false);
      }
    };

    load();
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
  // Upload slip (✅ กันสถานะทุกเคส)
  // -----------------------------
  const handleSlipUpload = async () => {
    if (!order || !id) return;

    // ✅ กัน: ยกเลิก/ล้มเหลว/รับของแล้ว = ห้ามแนบสลิป
    if (['cancelled', 'failed', 'delivered'].includes(order.Ostatus)) {
      alert('สถานะออเดอร์นี้ไม่สามารถแนบสลิปได้');
      return;
    }

    // ✅ กัน: COD ห้ามแนบสลิป
    if (order.Opayment === 'cod') {
      alert('ออเดอร์ปลายทางไม่ต้องแนบสลิป');
      return;
    }

    // ✅ กัน: เคยแนบแล้ว
    if (order.Oslip) {
      alert('คุณส่งสลิปไปแล้ว');
      return;
    }

    // ✅ กัน: แนบได้เฉพาะสถานะที่กำหนด
    if (order.Ostatus !== SLIP_ALLOWED_STATUS) {
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

      const updated = await apiFetch(`${API}/orders/${id}`).then(res => res.json());
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

    await apiFetch(`${API}/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'delivered' }),
    });

    const updated = await apiFetch(`${API}/orders/${id}`).then(res => res.json());
    setOrder(updated);
  };

  // -----------------------------
  // Review images
  // -----------------------------
  const handleReviewFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const remain = 5 - reviewFiles.length;
    const selected = files.slice(0, remain);

    setReviewFiles(prev => [...prev, ...selected]);
    setReviewPreviews(prev => [
      ...prev,
      ...selected.map(f => URL.createObjectURL(f)),
    ]);

    e.target.value = '';
  };

  const removeReviewImage = (index: number) => {
    setReviewFiles(prev => prev.filter((_, i) => i !== index));
    setReviewPreviews(prev => {
      const target = prev[index];
      if (target) URL.revokeObjectURL(target);
      return prev.filter((_, i) => i !== index);
    });
  };

  const clearReviewImages = () => {
    reviewPreviews.forEach(url => URL.revokeObjectURL(url));
    setReviewFiles([]);
    setReviewPreviews([]);
  };

  // -----------------------------
  // Review submit (with images)
  // -----------------------------
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      const fd = new FormData();
      fd.append("stars", String(rating));
      fd.append("text", comment);
      reviewFiles.forEach((f) => fd.append("images", f));

      const res = await apiFetch(`${API}/orders/${id}/review`, {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err?.message || "ส่งรีวิวไม่สำเร็จ");
        return;
      }

      alert("ส่งรีวิวสำเร็จ!");
      const reviewRes = await apiFetch(`${API}/orders/${id}/review`);
      setReview(await reviewRes.json());

      clearReviewImages();
      setComment("");
      setRating(5);
    } catch (err) {
      console.error(err);
      alert("ส่งรีวิวไม่สำเร็จ");
    }
  };

  // -----------------------------
  // Delete review
  // -----------------------------
  const handleDeleteReview = async () => {
    const ok = window.confirm('ต้องการลบรีวิวนี้หรือไม่?');
    if (!ok || !id) return;

    try {
      const res = await apiFetch(`${API}/orders/${id}/review`, {
        method: 'DELETE',
      });

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

    const newCart = order.items.map(item => ({
      Pid: item.Pid,
      Pname: item.Pname,
      Ppicture: item.Ppicture,
      Pprice: item.Oprice,
      quantity: item.Oquantity,
    }));

    localStorage.setItem('cart', JSON.stringify(newCart));
    alert('เพิ่มสินค้าเข้าตะกร้าแล้ว');
    router.push('/cart');
  };

  // -----------------------------
  // UI states
  // -----------------------------
  if (loading) return <p className="p-6 text-center">กำลังโหลดข้อมูล...</p>;
  if (!order) return <p className="p-6 text-center text-red-600">ไม่พบคำสั่งซื้อ</p>;

  const itemsSubtotal =
    order.items?.reduce((sum, it) => sum + Number(it.Oprice) * Number(it.Oquantity), 0) ?? 0;

  const shippingFee = itemsSubtotal >= 1000 ? 0 : 50;
  const grandTotal = itemsSubtotal + shippingFee;

  const statusTH: Record<string, string> = {
    pending: "รอชำระเงิน",
    paid: "ชำระเงินแล้ว",
    processing: "กำลังเตรียมสินค้า",
    shipping: "จัดส่งแล้ว",
    delivered: "ได้รับสินค้าแล้ว",
    cancelled: "ยกเลิก",
    failed: "ล้มเหลว",
  };

  const paymentTH: Record<string, string> = {
    cod: "ชำระปลายทาง",
    bank: "โอนเงิน",
    transfer: "โอนเงิน",
  };

  // ✅ logic รวม: สถานะที่บล็อกการแนบสลิป
  const isFinalOrBlocked =
    ['cancelled', 'failed', 'delivered'].includes(order.Ostatus);

  // ✅ อนุญาตแนบสลิปไหม
  const canUploadSlip =
    order.Opayment !== 'cod' &&
    !order.Oslip &&
    !isFinalOrBlocked &&
    order.Ostatus === SLIP_ALLOWED_STATUS;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 text-black">
      <div className="max-w-4xl mx-auto pt-32 p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2 rounded-full text-sm font-semibold mb-4">
            รายละเอียดออเดอร์
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4">
            คำสั่งซื้อ #{order.Oid}
          </h1>
        </div>

        {/* Order Info Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-2 border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xl shadow-md">
              📋
            </div>
            <h2 className="text-2xl font-bold text-gray-800">ข้อมูลคำสั่งซื้อ</h2>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">วันที่สั่งซื้อ:</span>
              <span className="font-semibold">{new Date(order.Odate).toLocaleDateString('th-TH')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">สถานะ:</span>
              <span className="font-semibold text-blue-600">
                {statusTH[order.Ostatus] ?? order.Ostatus}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">ชำระแบบ:</span>
              <span className="font-semibold">
                {paymentTH[order.Opayment] ?? order.Opayment}
              </span>
            </div>
          </div>

          {order.Ostatus === 'shipping' && (
            <button
              onClick={handleConfirmReceived}
              className="w-full mt-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              ✅ ยืนยันรับสินค้า
            </button>
          )}
        </div>

        {/* Items Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-2 border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-xl shadow-md">
              🛍️
            </div>
            <h2 className="text-2xl font-bold text-gray-800">รายการสินค้า</h2>
          </div>

          <div className="space-y-4">
            {order.items?.map((item) => {
              const itemTotal = Number(item.Oprice) * Number(item.Oquantity);

              return (
                <div
                  key={item.Pid}
                  className="flex gap-4 items-center p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200"
                >
                  <img
                    src={`http://localhost:3000${item.Ppicture.split(',')[0]}`}
                    alt={item.Pname}
                    className="w-20 h-20 object-cover rounded-xl shadow-sm"
                  />

                  <div className="flex-1">
                    <p className="font-bold text-gray-800 text-lg">{item.Pname}</p>
                    <p className="text-gray-600">จำนวน: {item.Oquantity} ชิ้น</p>
                    <p className="text-green-600 font-semibold">
                      ราคาต่อชิ้น: {Number(item.Oprice).toFixed(2)} บาท
                    </p>
                    <p className="text-gray-800 font-bold mt-1">
                      รวม: {itemTotal.toFixed(2)} บาท
                    </p>
                  </div>
                </div>
              );
            })}

            <div className="border-t-2 border-gray-200 pt-4 mt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">ยอดรวมสินค้า:</span>
                <span className="font-semibold">{itemsSubtotal.toFixed(2)} บาท</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">ค่าส่ง:</span>
                <span className={`font-semibold ${shippingFee === 0 ? 'text-green-600' : ''}`}>
                  {shippingFee === 0 ? 'ฟรี' : `${shippingFee.toFixed(2)} บาท`}
                </span>
              </div>

              {shippingFee === 0 && (
                <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg p-2">
                  ✅ ส่งฟรีเมื่อยอดสินค้า 1,000 บาทขึ้นไป
                </p>
              )}

              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="text-lg font-bold text-gray-800">ยอดสุทธิ:</span>
                <span className="text-2xl font-bold text-green-600">
                  {grandTotal.toFixed(2)} บาท
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Review Form */}
        {order.Ostatus === 'delivered' && !review && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-2 border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center text-white text-xl shadow-md">
                ⭐
              </div>
              <h2 className="text-2xl font-bold text-gray-800">ให้คะแนนสินค้า</h2>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">คะแนน:</label>

                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="focus:outline-none"
                      >
                        <FaStar
                          className={`text-2xl transition-colors ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">ความคิดเห็น:</label>
                <textarea
                  placeholder="เขียนรีวิวเพิ่มเติม..."
                  className="w-full p-3 border-2 border-gray-200 rounded-xl bg-gray-50 focus:border-green-400 focus:outline-none transition-colors min-h-[100px]"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">แนบรูป (ได้สูงสุด 5 รูป):</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleReviewFiles}
                  className="block w-full border-2 border-gray-200 p-3 rounded-xl cursor-pointer bg-gray-50"
                  disabled={reviewFiles.length >= 5}
                />

                <div className="flex justify-between mt-2 text-sm">
                  <span className="text-gray-600">{reviewFiles.length}/5 รูป</span>
                  {reviewFiles.length > 0 && (
                    <button
                      type="button"
                      onClick={clearReviewImages}
                      className="text-red-600 hover:underline"
                    >
                      ล้างรูปทั้งหมด
                    </button>
                  )}
                </div>

                {reviewPreviews.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {reviewPreviews.map((src, i) => (
                      <div
                        key={i}
                        className="relative aspect-square rounded-lg border bg-gray-100 overflow-hidden flex items-center justify-center"
                      >
                        <img
                          src={src}
                          alt={`preview-${i}`}
                          className="w-full h-full object-contain block"
                        />
                        <button
                          type="button"
                          onClick={() => removeReviewImage(i)}
                          className="absolute top-1 right-1 bg-black/60 text-white w-7 h-7 rounded-full flex items-center justify-center hover:bg-black/80"
                          title="ลบรูป"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                ส่งรีวิว
              </button>
            </form>
          </div>
        )}

        {/* Display Review */}
        {review && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-2 border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full flex items-center justify-center text-white text-xl shadow-md">
                ⭐
              </div>
              <h2 className="text-2xl font-bold text-gray-800">รีวิวของคุณ</h2>
            </div>

            <div className="flex items-center justify-between mb-3">
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <FaStar
                    key={star}
                    className={`text-xl ${star <= review.stars ? 'text-yellow-400' : 'text-gray-200'}`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-400 font-medium">{review.stars}/5</span>
            </div>

            <p className="text-gray-700 bg-gray-50 p-4 rounded-xl">"{review.text}"</p>

            {review.images?.length ? (
              <div className="grid grid-cols-3 gap-2 mt-3">
                {review.images.map((img, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-lg border bg-gray-100 overflow-hidden flex items-center justify-center"
                  >
                    <img
                      src={`${API}${img}`}
                      alt={`review-img-${i}`}
                      className="w-full h-full object-contain block"
                    />
                  </div>
                ))}
              </div>
            ) : null}

            <button
              onClick={handleDeleteReview}
              className="mt-4 bg-red-50 hover:bg-red-100 text-red-600 px-6 py-2 rounded-xl font-semibold transition-colors"
            >
              ลบรีวิว
            </button>
          </div>
        )}

        {order.Ostatus === 'delivered' && (
          <button
            onClick={handleBuyAgain}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-semibold"
          >
            🔁 สั่งซื้ออีกครั้ง
          </button>
        )}

        {/* Upload Slip (✅ แสดงตามเงื่อนไขจริง) */}
        {order.Opayment !== 'cod' && (
          order.Oslip ? (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 mb-6">
              <p className="text-green-700 font-semibold">
                ✅ คุณได้ส่งสลิปแล้ว รอแอดมินตรวจสอบ
              </p>
            </div>
          ) : isFinalOrBlocked ? (
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 mb-6">
              <p className="text-red-700 font-semibold">
                ❌ ออเดอร์สถานะ "{statusTH[order.Ostatus] ?? order.Ostatus}" ไม่สามารถแนบสลิปได้
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-2 border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white text-xl shadow-md">
                  📎
                </div>
                <h2 className="text-2xl font-bold text-gray-800">แนบสลิปโอนเงิน</h2>
              </div>

              {/* ✅ เพิ่มข้อความกำกับว่าตอนไหนแนบได้ */}
              <p className="text-sm text-gray-500 mb-3">
                แนบสลิปได้เฉพาะสถานะ: <span className="font-semibold">{statusTH[SLIP_ALLOWED_STATUS] ?? SLIP_ALLOWED_STATUS}</span>
              </p>

              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full border-2 border-gray-200 p-3 rounded-xl cursor-pointer bg-gray-50 hover:border-green-300 transition-colors mb-4"
                disabled={!canUploadSlip}
              />

              {preview && (
                <img
                  src={preview}
                  alt="preview"
                  className="w-full h-auto rounded-xl shadow-lg border-2 border-gray-200 mb-4"
                />
              )}

              <button
                onClick={handleSlipUpload}
                disabled={!slipFile || !canUploadSlip}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold disabled:opacity-50"
              >
                อัปโหลดสลิป
              </button>

              {!canUploadSlip && (
                <p className="mt-3 text-xs text-red-600">
                  * ตอนนี้ยังแนบสลิปไม่ได้ (ตรวจสถานะออเดอร์ / วิธีชำระเงิน / เคยแนบแล้ว)
                </p>
              )}
            </div>
          )
        )}

        {order.Opayment === 'cod' && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-3">
              <span className="text-3xl">💵</span>
              <p className="text-green-700 font-semibold text-lg">คำสั่งซื้อแบบชำระปลายทาง</p>
            </div>
          </div>
        )}

        {/* Display Uploaded Slip */}
        {order.Oslip && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-xl shadow-md">
                ✅
              </div>
              <h2 className="text-2xl font-bold text-gray-800">สลิปที่แนบไว้</h2>
            </div>
            <img
              src={`http://localhost:3000${order.Oslip}`}
              alt="slip"
              className="w-full h-auto rounded-xl border-2 border-gray-200 shadow-lg"
            />
          </div>
        )}
      </div>
    </div>
  );
}
