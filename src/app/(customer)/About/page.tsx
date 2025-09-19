// About.tsx
'use client';
import React, { useState, useEffect } from "react";

export default function About() {
  const [review, setReview] = useState("");
  const [rating, setRating] = useState(0);
  const [reviews, setReviews] = useState<{ id: number; text: string; stars: number }[]>([]);

  useEffect(() => {
    fetch("http://localhost:3000/reviews")
      .then((res) => res.json())
      .then((data) => setReviews(data))
      .catch((err) => console.error("โหลดรีวิวผิด:", err));
  }, []);

  const handleSubmit = async () => {
    if (review.trim() === "" || rating < 1 || rating > 5) return;

    await fetch("http://localhost:3000/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: review, stars: rating }),
    });

    setReview("");
    setRating(0);

    // reload review
    const res = await fetch("http://localhost:3000/reviews");
    const data = await res.json();
    setReviews(data);
  };

  return (
    <main className="flex pt-36  flex-col items-center min-h-screen bg-slate-100 px-4 py-10">
      <div className="w-full max-w-2xl text-center">
        <h1 className="text-3xl sm:text-4xl font-bold mb-6 text-black">รีวิวเกี่ยวกับเรา</h1>
        <p className="text-lg text-gray-700 mb-8">
          เรามุ่งมั่นที่จะให้บริการที่ดีที่สุดแก่ลูกค้าของเรา โปรดส่งความคิดเห็นของคุณเพื่อช่วยให้เราพัฒนา
        </p>

        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          className="w-full h-40 p-4 text-base text-gray-800 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-green-400"
          placeholder="เขียนรีวิวของคุณที่นี่..."
        />

        <div className="mt-6 text-left">
          <label className="block text-gray-700 text-lg mb-2">ให้คะแนน:</label>
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="text-3xl focus:outline-none"
              >
                {star <= rating ? "⭐" : "☆"}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className="mt-6 bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition"
        >
          ส่งรีวิว
        </button>
      </div>

      {/* 🔻 Reviews Section */}
      <div className="w-full max-w-2xl mt-10 space-y-4">
        {reviews.length === 0 ? (
          <p className="text-gray-500 text-center">ยังไม่มีรีวิว</p>
        ) : (
          reviews.map((r) => (
            <div
              key={r.id}
              className="border border-gray-300 rounded-lg p-4 shadow-sm bg-white"
            >
              <p className="text-gray-800 mb-2">{r.text}</p>
              <p className="text-yellow-500 text-lg">
                {"⭐".repeat(r.stars)}{"☆".repeat(5 - r.stars)}
              </p>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
