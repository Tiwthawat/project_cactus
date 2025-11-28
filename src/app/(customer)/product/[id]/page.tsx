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

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [mainImage, setMainImage] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);

  const [isFavorite, setIsFavorite] = useState<boolean>(false);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

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

        </div>
      </div>
    </div>
  );
}
