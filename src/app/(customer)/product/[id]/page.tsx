'use client';
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { FaShoppingCart, FaHeart, FaRegHeart, FaMinus, FaPlus, FaCheck } from "react-icons/fa";
import { IoFlashSharp } from "react-icons/io5";

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
}

interface ReviewSummary {
  avg_stars: number;
  total: number;
}


export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [mainImage, setMainImage] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);

  const [isFavorite, setIsFavorite] = useState<boolean>(false);

  const [reviewSummary, setReviewSummary] = useState<ReviewSummary | null>(null);
const [reviews, setReviews] = useState<ProductOrderReview[]>([]);
const [reviewLoading, setReviewLoading] = useState(true);


  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

const fetchReviews = async () => {
  if (!id) return;

  try {
    setReviewLoading(true);

    const headers: HeadersInit = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const [sumRes, listRes] = await Promise.all([
      fetch(`http://localhost:3000/products/${id}/reviews/summary`, { headers }),
      fetch(`http://localhost:3000/products/${id}/reviews`, { headers }),
    ]);

    // ถ้า backend ส่ง error message กลับมา (เช่น ไม่มี token) จะไม่ใช่ array → กันไว้
    const sumJson: any = sumRes.ok ? await sumRes.json() : null;
    const listJson: any = listRes.ok ? await listRes.json() : null;

    // ถ้าโดน 401/403 ให้โชว์ 0 รีวิวแบบเนียนๆ (หรือจะให้ขึ้นข้อความก็ได้)
    if (sumRes.status === 401 || sumRes.status === 403 || listRes.status === 401 || listRes.status === 403) {
      setReviewSummary({ avg_stars: 0, total: 0 });
      setReviews([]);
      return;
    }

    setReviewSummary({
      avg_stars: Number(sumJson?.avg_stars ?? 0),
      total: Number(sumJson?.total ?? 0),
    });

    setReviews(Array.isArray(listJson) ? listJson : []);
  } catch {
    setReviewSummary({ avg_stars: 0, total: 0 });
    setReviews([]);
  } finally {
    setReviewLoading(false);
  }
};



  // 👉 โหลดสินค้าพร้อมสถานะ favorite
  useEffect(() => {
    const fetchProduct = async () => {
      const res = await fetch(`http://localhost:3000/product/${id}`);
      const data = await res.json();
      setProduct(data);
      setMainImage(data.Ppicture.split(",")[0].trim());
    };

    const fetchFavoriteStatus = async () => {
      if (!token) return;

      const res = await fetch("http://localhost:3000/favorites", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (Array.isArray(data)) {
        const found = data.some((f) => f.product_id === Number(id));
        setIsFavorite(found);
      }
    };

    fetchProduct();
    fetchFavoriteStatus();
      fetchReviews();
  }, [id, token]);


  // 👉 สลับรายการโปรด
  const toggleFavorite = async () => {
    if (!token) {
      alert("กรุณาเข้าสู่ระบบก่อนค่ะ 🌵");
      return;
    }

    const res = await fetch("http://localhost:3000/favorites", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ product_id: Number(id) }),
    });

    const data = await res.json();

    if (res.ok) {
      setIsFavorite(data.is_favorite);
    }
  };


  const pictures = product
    ? product.Ppicture.split(",").map((pic) => pic.trim()).filter((pic) => pic)
    : [];

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
        Ppicture: product.Ppicture.split(",")[0].trim(),
        quantity: quantity,
      });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    alert("เพิ่มลงตะกร้าแล้ว");
  };

  const handleBuyNow = () => {
    if (!product) return;

    localStorage.setItem(
      "buynow",
      JSON.stringify({ pid: product.Pid, qty: quantity })
    );

    window.location.href = "/checkout?type=buynow";
  };


  const increaseQuantity = () => {
    if (product && quantity < product.Pnumproduct) {
      setQuantity((prev) => prev + 1);
    }
  };

  const decreaseQuantity = () => {
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
  };

  if (!product) return <p className="text-center mt-10">กำลังโหลดข้อมูลสินค้า...</p>;

  return (
    <div className="p-4 pt-14 max-w-7xl mx-auto bg-white text-gray-900 min-h-screen">
      <div className="bg-white md:p-10">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">

          <div className="w-full lg:w-1/2">

            <div className="w-full aspect-[1/1] rounded-lg overflow-hidden shadow-xl border border-gray-200 relative">

              {/* ⭐ ปุ่มหัวใจ */}
              <button
                onClick={toggleFavorite}
                className={`absolute top-4 right-4 z-10 p-3 rounded-full backdrop-blur-sm transition-all duration-300 ${
                  isFavorite
                    ? "bg-red-500 text-white scale-110"
                    : "bg-white/80 text-red-500 hover:bg-red-50"
                }`}
              >
                {isFavorite ? (
                  <FaHeart className="text-xl" />
                ) : (
                  <FaRegHeart className="text-xl" />
                )}
              </button>

              <img
                src={`http://localhost:3000${mainImage}`}
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
                      src={`http://localhost:3000${pic}`}
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

          {/* 📌 ด้านขวา */}
          <div className="w-full lg:w-1/2 flex flex-col gap-4">

            <h1 className="text-xl font-bold text-gray-800 pb-2 border-b">{product.Pname}</h1>
            <p className="text-sm text-gray-500">{product.Pdetail}</p>

            <span className="text-xl font-extrabold">{product.Pprice} บาท</span>

            {/* จำนวนสินค้า */}
            <div className="border-t pt-4 mt-4 space-y-4">
              <div className="flex items-center gap-4">
                <p className="text-base font-semibold text-gray-700">จำนวน:</p>
                <div className="flex items-center border border-gray-300 rounded-md">
                  <button
                    onClick={decreaseQuantity}
                    className="p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                    disabled={quantity <= 1}
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
                  >
                    <FaPlus className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-sm text-gray-500">เหลือสินค้า {product.Pnumproduct} ชิ้น</span>
              </div>

              {/* ปุ่มซื้อ */}
              <div className="flex gap-4 pt-2">
                <button
                  onClick={addToCart}
                  className="flex items-center justify-center gap-2 w-1/2 bg-white border-2 border-green-500 text-green-600 font-semibold px-6 py-3 rounded-xl hover:bg-green-50 transition-all duration-300 shadow-md hover:shadow-xl"
                >
                  <FaShoppingCart className="text-lg" />
                  เพิ่มใส่ตะกร้า
                </button>

                <button
                  onClick={handleBuyNow}
                  className="flex items-center justify-center gap-2 w-1/2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-300 shadow-md hover:shadow-xl hover:scale-105"
                >
                  <IoFlashSharp className="text-lg" />
                  สั่งซื้อเลย
                </button>
              </div>

            </div>
          </div>
          

        </div>{/* ================= รีวิวสินค้า ================= */}
{/* ================= รีวิวสินค้า (ดึงจากรีวิวออเดอร์) ================= */}
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
        {reviews.map((r) => (
          <div key={r.id} className="bg-white border rounded-xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  ออเดอร์ #{r.order_id}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(r.created_at).toLocaleString("th-TH")}
                </span>
              </div>

              <span className="text-yellow-500 text-sm">
                {"★".repeat(r.stars)}{"☆".repeat(5 - r.stars)}
              </span>
            </div>

            <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-xl">
              “{r.text}”
            </p>

            {!!r.images?.length && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                {r.images.map((img, i) => (
                  <img
                    key={i}
                    src={`http://localhost:3000${img}`}
                    alt="review"
                    className="w-24 h-24 object-cover rounded-lg border"
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    )}
  </div>
</div>


      </div>
    </div>
  );
}
