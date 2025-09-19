'use client';
import { useEffect, useState } from 'react';

interface Review {
  id: number;
  text: string;
  stars: number;
  created_at: string;
  order_id: number;
}

export default function AdminReviewPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    const res = await fetch('http://localhost:3000/admin/reviews');
    const data = await res.json();
    setReviews(data);
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    const confirm = window.confirm('ยืนยันการลบรีวิวนี้?');
    if (!confirm) return;

    await fetch(`http://localhost:3000/admin/reviews/${id}`, {
      method: 'DELETE',
    });

    setReviews((prev) => prev.filter((r) => r.id !== id));
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  if (loading) return <p className="p-6 text-center">กำลังโหลดรีวิว...</p>;

  return (
    <div className="max-w-5xl pt-36 mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">รายการรีวิวจากลูกค้า</h1>

      {reviews.length === 0 ? (
        <p className="text-gray-500">ยังไม่มีรีวิว</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="p-4 border rounded shadow-sm bg-white">
              <p className="text-sm text-gray-500">คำสั่งซื้อ #{r.order_id}</p>
              <p className="font-semibold mt-1">⭐ {r.stars} ดาว</p>
              <p className="mt-1">{r.text}</p>
              <p className="text-sm text-gray-400 mt-1">
                รีวิวเมื่อ: {new Date(r.created_at).toLocaleString()}
              </p>
              <button
                onClick={() => handleDelete(r.id)}
                className="mt-2 text-red-600 hover:underline"
              >
                🗑️ ลบรีวิว
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
