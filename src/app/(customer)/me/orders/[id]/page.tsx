'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

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
  Oslip: string;
  Opayment: string;
  items: Item[];
}
interface Review {
  stars: number;
  text: string;
}





export default function OrderDetailPage() {
  const params = useParams();
  const id = params?.id?.toString();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [review, setReview] = useState<Review | null>(null);

  const fetchReviewAgain = async () => {
    if (!id) return;
    const res = await fetch(`http://localhost:3000/orders/${id}/review`);
    const data = await res.json();
    setReview(data);
  };

  useEffect(() => {
    if (!id) return;
    fetch(`http://localhost:3000/orders/${id}`)
      .then(res => res.json())
      .then(data => setOrder(data))
      .catch(err => console.error('โหลดคำสั่งซื้อผิดพลาด:', err))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;

    fetch(`http://localhost:3000/orders/${id}`)
      .then(res => res.json())
      .then(data => setOrder(data))
      .catch(err => console.error('โหลดคำสั่งซื้อผิดพลาด:', err))
      .finally(() => setLoading(false));

    fetch(`http://localhost:3000/orders/${id}/review`)
      .then(res => res.json())
      .then(data => {
        if (data) setReview(data);
      });
  }, [id]);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file && file.size > 3 * 1024 * 1024) {
      alert('ไฟล์ใหญ่เกิน 3MB');
      return;
    }
    setSlipFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    if (!slipFile) {
      alert('กรุณาเลือกไฟล์ก่อน');
      return;
    } const formData = new FormData();
    formData.append('file', slipFile);
  };

  const handleSlipUpload = async () => {
    if (!slipFile || !id) return alert('กรุณาเลือกสลิปก่อนอัปโหลด');

    const formData = new FormData();
    formData.append('file', slipFile);

    const res = await fetch('http://localhost:3000/upload', {
      method: 'POST',
      body: formData,
    });

    const { url } = await res.json();

    await fetch(`http://localhost:3000/orders/${id}/slip`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slipUrl: url }),
    });

    const updated = await fetch(`http://localhost:3000/orders/${id}`).then(res => res.json());
    setOrder(updated);
    setSlipFile(null);
    setPreview(null);
    alert('อัปโหลดสลิปเรียบร้อย');
  };
  const handleConfirmReceived = async () => {
    const confirm = window.confirm('ยืนยันว่าคุณได้รับสินค้าแล้ว?');
    if (!confirm) return;

    await fetch(`http://localhost:3000/orders/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'delivered' }),
    });

    const updated = await fetch(`http://localhost:3000/orders/${id}`).then(res => res.json());
    setOrder(updated);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    await fetch(`http://localhost:3000/orders/${id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stars: rating, text: comment }),
    });

    alert('ส่งรีวิวสำเร็จ!');
    await fetchReviewAgain();
  };
  const handleDeleteReview = async () => {
  const confirmDelete = confirm('ต้องการลบรีวิวนี้หรือไม่?');
  if (!confirmDelete) return;

  try {
    const res = await fetch(`http://localhost:3000/review/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!res.ok) throw new Error('ลบรีวิวไม่สำเร็จ');
    setReview(null); // ล้างรีวิวจาก state เพื่อให้แสดงแบบฟอร์มใหม่
  } catch (err) {
    alert('เกิดข้อผิดพลาดในการลบรีวิว');
  }
};






  if (loading) return <p className="p-6 text-center">กำลังโหลดข้อมูล...</p>;
  if (!order) return <p className="p-6 text-center text-red-600">ไม่พบคำสั่งซื้อ</p>;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white text-black">
      <h1 className="text-2xl font-bold mb-4">รายละเอียดคำสั่งซื้อ</h1>
      <p>เลขคำสั่งซื้อ: #{order.Oid}</p>
      <p>วันที่สั่งซื้อ: {new Date(order.Odate).toLocaleDateString()}</p>
      <p>สถานะ: <span className="text-gray-700">{order.Ostatus}</span></p>
      <p>ชำระแบบ: <span className="text-gray-700">{order.Opayment}</span></p>
      <p className="mb-4">ยอดรวม: {(+order.Oprice || 0).toFixed(2)} บาท</p>

      {/* ปุ่มยืนยันรับของ */}
      {order.Ostatus === 'shipped' && (
        <button onClick={handleConfirmReceived} className="bg-blue-600 text-white px-4 py-2 rounded mt-6">
          ✅ ยืนยันรับสินค้า
        </button>
      )}

      {/* แบบฟอร์มรีวิว */}
      {order.Ostatus === 'delivered' && !review && (
        <form onSubmit={handleReviewSubmit} className="mt-6 space-y-4">
          <h3 className="text-lg font-semibold">ให้คะแนนสินค้า</h3>

          <label>
            คะแนน:
            <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="ml-2 border p-1 rounded">
              <option value={5}>⭐️⭐️⭐️⭐️⭐️</option>
              <option value={4}>⭐️⭐️⭐️⭐️</option>
              <option value={3}>⭐️⭐️⭐️</option>
              <option value={2}>⭐️⭐️</option>
              <option value={1}>⭐️</option>
            </select>
          </label>

          <textarea
            placeholder="เขียนรีวิวเพิ่มเติม..."
            className="w-full border rounded p-2"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />

          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
            ส่งรีวิว
          </button>
        </form>
      )}

      {/* แสดงรีวิวถ้ามีแล้ว */}
      {review && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold">รีวิวของคุณ</h3>
          <p className="font-semibold">คะแนน:<div>
            {Array(review.stars).fill('⭐')}
          </div>ดาว</p>
          <p className="text-gray-700">{review.text}</p>

          {/* ปุ่มลบรีวิว */}
    <button
      onClick={handleDeleteReview}
      className="mt-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
    >
      ลบรีวิว
    </button>
        </div>
      )}

      <h2 className="text-lg font-semibold mt-8 mb-2">รายการสินค้า</h2>
      <ul className="space-y-4">
        {order.items?.map(item => (
          <li key={item.Pid} className="flex gap-4 items-center border-b pb-2">
            <img
              src={`http://localhost:3000${item.Ppicture.split(',')[0]}`}
              alt={item.Pname}
              className="w-16 h-16 object-cover rounded"
            />
            <div>
              <p className="font-semibold">{item.Pname}</p>
              <p>จำนวน: {item.Oquantity}</p>
              <p>ราคาต่อชิ้น: {Number(item.Oprice).toFixed(2)} บาท</p>
              <p>รวม: {(Number(item.Oprice) * item.Oquantity).toFixed(2)} บาท</p>
            </div>
          </li>
        ))}
      </ul>

      <hr className="my-6" />

      {/* อัปโหลดสลิป */}
      {order.Opayment !== 'cod' ? (
        <>
          <h2 className="text-lg font-semibold mb-2">แนบสลิปโอนเงิน</h2>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="mb-4"
          />
          {preview && (
            <img
              src={preview}
              alt="preview"
              className="w-full h-auto rounded shadow mb-4"
            />
          )}
          <button
            onClick={handleSlipUpload}
            disabled={!slipFile}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            อัปโหลดสลิป
          </button>
        </>
      ) : (
        <p className="text-green-700 mt-4 font-semibold">
          คำสั่งซื้อแบบชำระปลายทาง
        </p>
      )}

      {/* แสดงสลิปที่แนบแล้ว */}
      {order.Oslip && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">สลิปที่แนบไว้</h2>
          <img
            src={`http://localhost:3000${order.Oslip}`}
            alt="slip"
            className="w-full h-auto rounded border"
          />
        </div>
      )}
    </div>
  );
}