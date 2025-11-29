// About.tsx
'use client';
import { useState, useEffect } from 'react';
import { FaStar, FaRegStar, FaPaperPlane, FaQuoteLeft, FaUserCircle } from 'react-icons/fa';

export default function About() {
  const [review, setReview] = useState("");
  const [rating, setRating] = useState(0);
  const [reviews, setReviews] = useState<{ id: number; text: string; stars: number }[]>([]);
  const [hoverRating, setHoverRating] = useState(0);

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

  const StarRating = ({ count, interactive = false }: { count: number; interactive?: boolean }) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={interactive ? () => setRating(star) : undefined}
            onMouseEnter={interactive ? () => setHoverRating(star) : undefined}
            onMouseLeave={interactive ? () => setHoverRating(0) : undefined}
            className={`text-3xl focus:outline-none transition-all duration-200 ${interactive ? 'hover:scale-110 cursor-pointer' : 'cursor-default'
              }`}
            disabled={!interactive}
          >
            {star <= (interactive ? (hoverRating || rating) : count) ? (
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
            <label className="block text-gray-700 text-lg font-semibold mb-3">
              ความคิดเห็น
            </label>
            <div className="relative">
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                className="w-full h-40 p-4 text-base text-gray-800 bg-white border-2 border-gray-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all"
                placeholder="แบ่งปันประสบการณ์ของคุณกับเรา..."
              />
              <FaQuoteLeft className="absolute top-3 right-3 text-green-200 text-2xl" />
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-gray-700 text-lg font-semibold mb-3">
              ให้คะแนน
            </label>
            <StarRating count={rating} interactive={true} />
            {rating > 0 && (
              <p className="mt-2 text-green-600 font-medium">
                คุณให้ {rating} ดาว
              </p>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={review.trim() === "" || rating < 1}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            <FaPaperPlane />
            ส่งรีวิว
          </button>
        </div>

        {/* Reviews Section */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-800">
              รีวิวจากลูกค้า
            </h2>
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
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                        <FaUserCircle className="text-white text-2xl" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex space-x-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <FaStar
                              key={star}
                              className={`text-xl ${star <= r.stars ? 'text-yellow-400' : 'text-gray-200'
                                }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-400 font-medium">
                          {r.stars}/5
                        </span>
                      </div>
                      <p className="text-gray-700 text-base leading-relaxed">
                        "{r.text}"
                      </p>
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
                <div className="text-4xl font-bold mb-2">
                  {reviews.length}
                </div>
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
                  {Math.round((reviews.filter(r => r.stars >= 4).length / reviews.length) * 100)}%
                </div>
                <div className="text-green-100">ความพึงพอใจ</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
