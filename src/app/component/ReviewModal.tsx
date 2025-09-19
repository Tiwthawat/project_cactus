'use client';
import { useState } from 'react';

interface ReviewModalProps {
  orderId: number;
  onClose: () => void;
  onSubmitted: () => void;
}

export default function ReviewModal({ orderId, onClose, onSubmitted }: ReviewModalProps) {
  const [text, setText] = useState('');
  const [stars, setStars] = useState(5);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!text || stars < 1 || stars > 5) {
      alert('กรุณาให้คะแนน 1-5 ดาว และเขียนความเห็น');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/orders/${orderId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, stars }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.message || 'เกิดข้อผิดพลาด');
        return;
      }

      alert('รีวิวสำเร็จ!');
      onSubmitted();
      onClose();
    } catch (err) {
      alert('เชื่อมต่อ server ไม่ได้');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded shadow w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">ให้คะแนนสินค้า</h2>

        <div className="mb-3">
          <label className="block font-medium mb-1">จำนวนดาว (1-5)</label>
          <input
            type="number"
            min="1"
            max="5"
            value={stars}
            onChange={(e) => setStars(Number(e.target.value))}
            className="border px-3 py-1 rounded w-full"
          />
        </div>

        <div className="mb-4">
          <label className="block font-medium mb-1">ความคิดเห็น</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="border px-3 py-2 rounded w-full"
            rows={3}
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'กำลังส่ง...' : 'ส่งรีวิว'}
          </button>
        </div>
      </div>
    </div>
  );
}
