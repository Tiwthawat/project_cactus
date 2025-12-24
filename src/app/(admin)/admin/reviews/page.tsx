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
                <div className="mb-8">
                    <div className="inline-block bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2 rounded-full text-sm font-semibold mb-4">
                        จัดการรีวิว
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        ⭐ รายการรีวิวจากลูกค้า
                    </h1>
                </div>

                {reviews.length === 0 ? (
                    <div className="flex justify-center items-center min-h-[400px]">
                        <div className="bg-white rounded-3xl shadow-2xl px-12 py-20 text-center border-2 border-gray-200 w-full max-w-xl">
                            <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-6 text-5xl">
                                ⭐
                            </div>
                            <p className="text-gray-800 text-2xl md:text-3xl font-bold mb-3">ยังไม่มีรีวิว</p>
                            <p className="text-gray-500 text-base md:text-lg">รอลูกค้ามาให้คะแนนสินค้าของเรากันค่ะ</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {reviews.map((r) => (
                            <div key={r.id} className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200 hover:border-green-300 transition-all duration-300">
                                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-700 border-2 border-blue-300">
                                                คำสั่งซื้อ #{r.order_id}
                                            </span>
                                            <div className="flex items-center gap-1">
                                                {Array(r.stars).fill('⭐').map((star, i) => (
                                                    <span key={i} className="text-xl">{star}</span>
                                                ))}
                                                <span className="ml-2 font-semibold text-gray-700">({r.stars} ดาว)</span>
                                            </div>
                                        </div>
                                        <p className="text-gray-700 bg-gray-50 p-4 rounded-xl mb-3">"{r.text}"</p>
                                        <p className="text-sm text-gray-500">
                                            📅 รีวิวเมื่อ: {new Date(r.created_at).toLocaleString('th-TH')}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(r.id)}
                                        className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg whitespace-nowrap"
                                    >
                                        🗑️ ลบรีวิว
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
