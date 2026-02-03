'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from "@/app/lib/apiFetch";
import { useRouter } from 'next/navigation';




const API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000";



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
}

export default function OrderDetailPage() {
    const router = useRouter();
  const params = useParams();
  const id = params?.id?.toString();

  const [order, setOrder] = useState<Order | null>(null);
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);

  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

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
  };

  // -----------------------------
  // Upload slip
  // -----------------------------
  const handleSlipUpload = async () => {
    if (!slipFile || !id) {
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

      const { url } = await uploadRes.json();

      await apiFetch(`${API}/orders/${id}/slip`, {
        method: 'PATCH',
        body: JSON.stringify({ slipUrl: url }),
      });

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
  // Review submit
  // -----------------------------
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    await apiFetch(`${API}/orders/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ stars: rating, text: comment }),
    });

    alert('ส่งรีวิวสำเร็จ!');
    const reviewRes = await apiFetch(`${API}/orders/${id}/review`);
    setReview(await reviewRes.json());
  };

  const handleDeleteReview = async () => {
    const ok = window.confirm('ต้องการลบรีวิวนี้หรือไม่?');
    if (!ok || !id) return;

    try {
      const res = await apiFetch(`${API}/review/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error();
      setReview(null);
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
              <span className="font-semibold text-blue-600">{order.Ostatus}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">ชำระแบบ:</span>
              <span className="font-semibold">{order.Opayment === 'cod' ? 'ชำระปลายทาง' : 'โอนเงิน'}</span>
            </div>
            <div className="flex justify-between items-center border-t-2 border-gray-200 pt-2 mt-2">
              <span className="text-lg font-bold text-gray-800">ยอดรวม:</span>
              <span className="text-2xl font-bold text-green-600">{(+order.Oprice || 0).toFixed(2)} บาท</span>
            </div>
          </div>

          {/* ปุ่มยืนยันรับของ */}
          {order.Ostatus === 'shipped' && (
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
            {order.items?.map(item => (
              <div key={item.Pid} className="flex gap-4 items-center p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200">
                <img
                  src={`http://localhost:3000${item.Ppicture.split(',')[0]}`}
                  alt={item.Pname}
                  className="w-20 h-20 object-cover rounded-xl shadow-sm"
                />
                <div className="flex-1">
                  <p className="font-bold text-gray-800 text-lg">{item.Pname}</p>
                  <p className="text-gray-600">จำนวน: {item.Oquantity} ชิ้น</p>
                  <p className="text-green-600 font-semibold">ราคาต่อชิ้น: {Number(item.Oprice).toFixed(2)} บาท</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">ยอดรวม</p>
                  <p className="text-xl font-bold text-green-600">{(Number(item.Oprice) * item.Oquantity).toFixed(2)} บาท</p>
                </div>
              </div>
            ))}
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
                <select
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl bg-gray-50 focus:border-green-400 focus:outline-none transition-colors"
                >
                  <option value={5}>⭐️⭐️⭐️⭐️⭐️</option>
                  <option value={4}>⭐️⭐️⭐️⭐️</option>
                  <option value={3}>⭐️⭐️⭐️</option>
                  <option value={2}>⭐️⭐️</option>
                  <option value={1}>⭐️</option>
                </select>
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
            <div className="mb-3">
              <p className="text-gray-600 mb-1">คะแนน:</p>
              <div className="flex gap-1">
                {Array(review.stars).fill('⭐').map((star, i) => (
                  <span key={i} className="text-2xl">{star}</span>
                ))}
              </div>
            </div>
            <p className="text-gray-700 bg-gray-50 p-4 rounded-xl">"{review.text}"</p>
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


        {/* Upload Slip */}
        {order.Opayment !== 'cod' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-2 border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white text-xl shadow-md">
                📎
              </div>
              <h2 className="text-2xl font-bold text-gray-800">แนบสลิปโอนเงิน</h2>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full border-2 border-gray-200 p-3 rounded-xl cursor-pointer bg-gray-50 hover:border-green-300 transition-colors mb-4 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-green-500 file:text-white file:font-semibold hover:file:bg-green-600"
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
              disabled={!slipFile}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              อัปโหลดสลิป
            </button>
          </div>
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
