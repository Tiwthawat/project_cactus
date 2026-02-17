'use client';

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  FaShoppingCart,
  FaHeart,
  FaRegHeart,
  FaMinus,
  FaPlus,
  FaCheck,
} from "react-icons/fa";
import { IoFlashSharp } from "react-icons/io5";

const API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000";

interface Product {
  Pid: number;
  Pname: string;
  Pprice: number;
  Ppicture: string;
  Pstatus: string;
  Pnumproduct: number;
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
  if (!path) return "";
  const clean = String(path).trim();
  if (!clean) return "";
  if (clean.startsWith("http")) return clean;
  if (clean.startsWith("/")) return `${API}${clean}`;
  return `${API}/${clean}`;
}

function safeParseImages(raw: any): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter((x) => typeof x === "string");
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter((x) => typeof x === "string");
      return [];
    } catch {
      return raw.startsWith("/") ? [raw] : [];
    }
  }
  return [];
}

function clampStars(n: number) {
  const x = Number(n || 0);
  return Math.max(0, Math.min(5, x));
}

export default function ProductDetail() {
  const params = useParams();
  const idParam = (params as any)?.id;
  const id = Array.isArray(idParam) ? idParam[0] : idParam;

  const [product, setProduct] = useState<Product | null>(null);
  const [mainImage, setMainImage] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);

  const [isFavorite, setIsFavorite] = useState<boolean>(false);

  const [reviewSummary, setReviewSummary] = useState<ReviewSummary | null>(null);
  const [reviews, setReviews] = useState<ProductOrderReview[]>([]);
  const [reviewLoading, setReviewLoading] = useState(true);

  // modal ดูรูปรีวิว
  const [openImg, setOpenImg] = useState<string | null>(null);

  // token โหลดครั้งเดียว
  const token = useMemo(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token");
  }, []);

  const pictures = useMemo(() => {
    if (!product?.Ppicture) return [];
    return product.Ppicture
      .split(",")
      .map((pic) => pic.trim())
      .filter(Boolean);
  }, [product?.Ppicture]);

  const fetchProduct = async () => {
    if (!id) return;
    const res = await fetch(`${API}/product/${id}`);
    const data = await res.json().catch(() => null);

    if (!res.ok || !data) {
      setProduct(null);
      return;
    }

    setProduct(data);
    const first = String(data.Ppicture || "").split(",")[0]?.trim() || "";
    setMainImage(first);
    setQuantity(1);
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
      alert("กรุณาเข้าสู่ระบบก่อนค่ะ 🌵");
      return;
    }

    const res = await fetch(`${API}/favorites`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ product_id: Number(id) }),
    });

    const data = await res.json().catch(() => null);
    if (res.ok && data) {
      setIsFavorite(Boolean(data.is_favorite));
    }
  };

  const addToCart = () => {
    if (!product) return;

    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existingIndex = cart.findIndex((item: any) => item.Pid === product.Pid);

    if (existingIndex !== -1) {
      cart[existingIndex].quantity += quantity;
    } else {
      cart.push({
        Pid: product.Pid,
        Pname: product.Pname,
        Pprice: Number(product.Pprice),
        Ppicture: String(product.Ppicture || "").split(",")[0].trim(),
        quantity,
      });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    alert("เพิ่มลงตะกร้าแล้ว");
  };

  const handleBuyNow = () => {
    if (!product) return;
    localStorage.setItem("buynow", JSON.stringify({ pid: product.Pid, qty: quantity }));
    window.location.href = "/checkout?type=buynow";
  };

  const increaseQuantity = () => {
    if (product && quantity < product.Pnumproduct) setQuantity((prev) => prev + 1);
  };

  const decreaseQuantity = () => {
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
  };

  if (!product) {
    return <p className="text-center mt-10">กำลังโหลดข้อมูลสินค้า...</p>;
  }

  return (
    <div className="p-4 pt-14 max-w-7xl mx-auto bg-white text-gray-900 min-h-screen">
      <div className="bg-white md:p-10">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
          {/* Left */}
          <div className="w-full lg:w-1/2">
            <div className="w-full aspect-[1/1] rounded-lg overflow-hidden shadow-xl border border-gray-200 relative">
              {/* ❤️ Favorite */}
              <button
                onClick={toggleFavorite}
                className={`absolute top-4 right-4 z-10 p-3 rounded-full backdrop-blur-sm transition-all duration-300 ${
                  isFavorite
                    ? "bg-red-500 text-white scale-110"
                    : "bg-white/80 text-red-500 hover:bg-red-50"
                }`}
                aria-label="favorite"
                type="button"
              >
                {isFavorite ? <FaHeart className="text-xl" /> : <FaRegHeart className="text-xl" />}
              </button>

              <img
                src={toImgUrl(mainImage)}
                alt={product.Pname}
                className="w-full h-full object-cover"
              />
            </div>

            {pictures.length > 1 && (
              <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                {pictures.map((pic, i) => (
                  <div
                    key={i}
                    className={`w-20 h-20 flex-shrink-0 rounded-lg cursor-pointer relative transition-all duration-300 ${
                      mainImage === pic
                        ? "border-2 border-green-500 shadow-md"
                        : "border border-gray-300 hover:border-gray-400"
                    }`}
                    onClick={() => setMainImage(pic)}
                  >
                    <img
                      src={toImgUrl(pic)}
                      alt={`รูปแบบ ${i + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    {mainImage === pic && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
                        <FaCheck className="text-white text-2xl" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right */}
          <div className="w-full lg:w-1/2 flex flex-col gap-4">
            <h1 className="text-xl font-bold text-gray-800 pb-2 border-b">{product.Pname}</h1>
            <p className="text-sm text-gray-500">{product.Pdetail}</p>

            <span className="text-xl font-extrabold">
              {Number(product.Pprice).toLocaleString("th-TH")} บาท
            </span>

            {/* Quantity */}
            <div className="border-t pt-4 mt-4 space-y-4">
              <div className="flex items-center gap-4 flex-wrap">
                <p className="text-base font-semibold text-gray-700">จำนวน:</p>
                <div className="flex items-center border border-gray-300 rounded-md">
                  <button
                    onClick={decreaseQuantity}
                    className="p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                    disabled={quantity <= 1}
                    type="button"
                  >
                    <FaMinus className="w-4 h-4" />
                  </button>
                  <span className="px-4 font-semibold text-lg border-l border-r border-gray-300">
                    {quantity}
                  </span>
                  <button
                    onClick={increaseQuantity}
                    className="p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                    disabled={product.Pnumproduct <= quantity}
                    type="button"
                  >
                    <FaPlus className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-sm text-gray-500">เหลือสินค้า {product.Pnumproduct} ชิ้น</span>
              </div>

              {/* Buttons */}
              <div className="flex gap-4 pt-2">
                <button
                  onClick={addToCart}
                  className="flex items-center justify-center gap-2 w-1/2 bg-white border-2 border-green-500 text-green-600 font-semibold px-6 py-3 rounded-xl hover:bg-green-50 transition-all duration-300 shadow-md hover:shadow-xl"
                  type="button"
                >
                  <FaShoppingCart className="text-lg" />
                  เพิ่มใส่ตะกร้า
                </button>

                <button
                  onClick={handleBuyNow}
                  className="flex items-center justify-center gap-2 w-1/2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105"
                  type="button"
                >
                  <IoFlashSharp className="text-lg" />
                  สั่งซื้อเลย
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ================= รีวิวสินค้า ================= */}
        <div className="mt-16 border-t pt-10">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-start justify-between gap-3 mb-2">
              <h2 className="text-2xl font-bold text-gray-800">⭐ รีวิว</h2>
              <span className="text-xs px-3 py-1 rounded-full bg-yellow-50 text-yellow-800 border border-yellow-200">
                รีวิวการสั่งซื้อ (อาจมีหลายสินค้าในออเดอร์)
              </span>
            </div>

            <p className="text-sm text-gray-500 mb-6">
              * แสดงรีวิวจากคำสั่งซื้อที่มีสินค้านี้อยู่จริง (รีวิว 1 ครั้งต่อออเดอร์)
            </p>

            {/* Summary */}
            <div className="bg-gray-50 border rounded-2xl p-6 mb-8">
              {reviewLoading ? (
                <p className="text-gray-500">กำลังโหลดสรุปรีวิว...</p>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="text-5xl font-extrabold text-yellow-500">
                    {(reviewSummary?.avg_stars ?? 0).toFixed(1)}
                  </div>
                  <div>
                    <div className="text-yellow-500 text-sm">
                      {"★".repeat(Math.round(reviewSummary?.avg_stars ?? 0))}
                      {"☆".repeat(5 - Math.round(reviewSummary?.avg_stars ?? 0))}
                    </div>
                    <div className="text-sm text-gray-600">
                      จากทั้งหมด {reviewSummary?.total ?? 0} รีวิว
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* List */}
            {reviewLoading ? (
              <p className="text-gray-500">กำลังโหลดรีวิว...</p>
            ) : reviews.length === 0 ? (
              <div className="bg-white border rounded-2xl p-8 text-center text-gray-500">
                ยังไม่มีรีวิวสำหรับสินค้านี้
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((r) => {
                  const s = clampStars(r.stars);

                  return (
                    <div key={r.id} className="bg-white border rounded-xl p-5 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            ออเดอร์ #{r.order_id}
                          </span>
                          <span className="text-xs text-gray-400">
                            {r.created_at ? new Date(r.created_at).toLocaleString("th-TH") : ""}
                          </span>
                        </div>

                        <span className="text-yellow-500 text-sm">
                          {"★".repeat(s)}{"☆".repeat(5 - s)}
                        </span>
                      </div>

                      <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-xl">
                        “{r.text}”
                      </p>

                      {!!(r.images && r.images.length) && (
                        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                          {r.images.filter(Boolean).map((img, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setOpenImg(img)}
                              className="w-24 h-24 object-cover rounded-lg border overflow-hidden bg-white"
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

                      {/* ✅ admin reply (อยู่ใน card เดียวกัน) */}
                      {r.admin_reply ? (
                        <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-sm font-bold text-emerald-700">แอดมินตอบกลับ</span>
                            {r.replied_at ? (
                              <span className="text-xs text-emerald-700/70">
                                {new Date(r.replied_at).toLocaleString("th-TH")}
                              </span>
                            ) : null}
                          </div>
                          <p className="text-sm text-emerald-900">“{r.admin_reply}”</p>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        {/* ================= จบ รีวิวสินค้า ================= */}

        {/* modal ดูรูปใหญ่ */}
        {openImg && (
          <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={() => setOpenImg(null)}
          >
            <div className="max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
              <img
                src={toImgUrl(openImg)}
                alt="full"
                className="w-full max-h-[80vh] object-contain rounded-2xl bg-white"
              />
              <button
                className="mt-3 w-full bg-white rounded-xl py-2 font-semibold"
                type="button"
                onClick={() => setOpenImg(null)}
              >
                ปิด
              </button>
              
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
