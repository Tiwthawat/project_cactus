'use client';

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaHeart, FaRegHeart, FaShoppingCart } from "react-icons/fa";
import { IoFlashSharp } from "react-icons/io5";
import { useCart } from "../context/CartContext";
const API = process.env.NEXT_PUBLIC_API_BASE;

interface Product {
  Pid: number;
  Pname: string;
  Pprice: number;
  Ppicture: string;
  Pnumproduct?: number;

}
interface Props {
  type?: "latest";
  typeid?: number;
  subtypeid?: number;
  search?: string;
  filterFavorites?: number[];

}
interface FavoriteProduct {
  product_id: number;
}

const CactusItems = ({ type, typeid, subtypeid, search, filterFavorites }: Props) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [hoveredProduct, setHoveredProduct] = useState<number | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
useEffect(() => {
  setToken(localStorage.getItem("token"));
}, []);
  const { addToCart: contextAddToCart } = useCart();
  

  // โหลดข้อมูลสินค้า
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        let url = `${API}/product`;

        if (type === "latest") {
          url = `${API}/product/latest`;
        } else {
          const params = new URLSearchParams();
          if (typeid) params.append("typeid", String(typeid));
          if (subtypeid) params.append("subtypeid", String(subtypeid));
          if (search && search.trim()) params.append("search", search.trim());
          if (params.toString()) url += "?" + params.toString();
        }


        const res = await fetch(url);
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        console.error("โหลดสินค้าไม่สำเร็จ:", err);
      }
    };




    const fetchFavorites = async () => {
      const res = await fetch(`${API}/favorites`, {
        headers: {
          "Authorization": `Bearer ${token}`,   
        },
        credentials: "include",
      });

      const data = await res.json();

      if (Array.isArray(data)) {
        setFavorites(data.map((item) => item.product_id));
      } else {
        setFavorites([]); // กัน error
      }
    };



    fetchProducts();

    const storedUser = localStorage.getItem("user");
if (storedUser) {
  try {
    const parsed = JSON.parse(storedUser);
    if (parsed?.Cid && token) {
      fetchFavorites(); // ⭐ ดึงรายการโปรด เฉพาะตอนมี token จริง ๆ
    }
  } catch (err) {
    console.error("อ่าน user ไม่ได้:", err);
  }
}


  }, [type, typeid, subtypeid, search, token]);
  




  // สลับรายการโปรด
  const toggleFavorite = async (productId: number) => {
    const res = await fetch(`${API}/favorites`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,     // ⭐ เพิ่มบรรทัดนี้
      },

      credentials: "include", // ⭐ สำคัญ
      body: JSON.stringify({ product_id: productId }),
    });

    const data = await res.json();

    if (res.ok) {
      setFavorites((prev) =>
        data.is_favorite
          ? [...prev, productId]
          : prev.filter((id) => id !== productId)
      );
    }
  };


  const handleBuyNow = (product: Product) => {
    localStorage.setItem("buynow", JSON.stringify({ pid: product.Pid, qty: 1 }));
    router.push("/checkout?type=buynow");
  };

 const addToCart = (product: Product) => {
  contextAddToCart(
    {
      ...product,
      Pnumproduct: Number(product.Pnumproduct ?? 0), // ส่ง stock เข้าไปให้ context เก็บ
    },
    1
  );

  setShowAlert(true);
  setTimeout(() => setShowAlert(false), 3000);
};


  // ⭐ ถ้ามี filterFavorites → กรองสินค้าเฉพาะที่ถูกใจ
  const visibleProducts = filterFavorites?.length
    ? products.filter((p) => filterFavorites.includes(p.Pid))
    : products;





  return (
    <div className="relative w-full">
      {showAlert && (
        <div
          role="alert"
          className="fixed top-5 right-5 z-[9999] p-4 rounded-lg bg-green-100 text-green-800 shadow-md"
        >
          <span>เพิ่มลงตะกร้าแล้ว!</span>
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 w-full">
        {visibleProducts.map((product) => {
          const isOut = product.Pnumproduct !== undefined && product.Pnumproduct <= 0;

          return (
            <div
              key={product.Pid}
              className={`group relative bg-white rounded-2xl shadow-md transition-all duration-300 overflow-hidden 
              ${isOut ? "opacity-50" : "hover:shadow-2xl hover:-translate-y-2"}
            `}
              onMouseEnter={() => !isOut && setHoveredProduct(product.Pid)}
              onMouseLeave={() => setHoveredProduct(null)}
            >

              {/* ปุ่มรายการโปรด */}
              <button
                onClick={(e) => {
                  e.stopPropagation();  // ป้องกันทะลุไป Link
                  toggleFavorite(product.Pid);
                }}
                className={`absolute top-3 right-3 z-10 p-2 rounded-full backdrop-blur-sm transition-all duration-300 
                ${favorites.includes(product.Pid)
                    ? "bg-red-500 text-white scale-110"
                    : "bg-white/80 text-red-500 hover:bg-red-50"}
              `}
                disabled={isOut}
              >
                {favorites.includes(product.Pid) ? <FaHeart /> : <FaRegHeart />}
              </button>

              {/* ป้ายสินค้าใหม่ */}
              {type === "latest" && (
                <div className="absolute top-3 left-3 z-10 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                  ✨ ใหม่
                </div>
              )}

              {/* ลิงก์สินค้า */}
              <Link href={!isOut ? `/product/${product.Pid}` : "#"} className="block">
                <div className="relative overflow-hidden bg-gray-100 aspect-square">
                  {/* POPUP: หยิบใส่ตะกร้าเร็ว! */}
                  {product.Pnumproduct !== undefined && product.Pnumproduct > 0 && (
                    <div
                      className={`absolute inset-0 bg-black/20 transition-opacity duration-300 pointer-events-none
                       ${hoveredProduct === product.Pid ? "opacity-100" : "opacity-0"}
                       `}
                    >


                      <span className="bg-green-600 text-white px-4 py-2 rounded-full shadow-lg text-sm font-bold">
                        🛒ดูรายละเอียด
                      </span>
                    </div>
                  )}




                  <img
                    src={`${API}${product.Ppicture.split(",")[0].trim()}`}
                    alt={product.Pname}
                    className={`w-full h-full object-cover transition-transform duration-500 
                    ${hoveredProduct === product.Pid ? "scale-110" : "scale-100"}
                  `}
                  />

                  {/* Overlay Hover */}
                  {!isOut && (
                    <div className={`absolute inset-0 bg-black/20 transition-opacity duration-300 pointer-events-none
    ${hoveredProduct === product.Pid ? "opacity-100" : "opacity-0"}
  `}>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="bg-white text-gray-800 px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                          ดูรายละเอียด →
                        </span>
                      </div>
                    </div>
                  )}


                  {/* ป้ายสินค้าหมด */}
                  {isOut && (
                    <div className="absolute inset-0 bg-black/40 z-20 flex items-center justify-center">
                      <span className="bg-red-600 text-white text-sm md:text-base px-4 py-2 rounded-full font-bold shadow-lg">
                        สินค้าหมด
                      </span>
                    </div>
                  )}
                </div>
              </Link>

              {/* รายละเอียดสินค้า */}
              <div className="p-4 space-y-3">
                <Link href={!isOut ? `/product/${product.Pid}` : "#"}>
                  <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 min-h-[2.5rem]">
                    {product.Pname}
                  </h3>
                </Link>

                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-green-600">
                    {product.Pprice}
                  </span>
                  <span className="text-sm text-gray-500">฿</span>
                </div>{product.Pnumproduct !== undefined && (
                  <p className="text-xs text-gray-500">
                    {product.Pnumproduct > 0
                      ? `เหลือ ${product.Pnumproduct} ชิ้น`
                      : "หมดแล้ว"}
                  </p>
                )}


                {/* ปุ่ม */}
                <div className="space-y-2 mt-4">
                  <button
                    onClick={() => !isOut && handleBuyNow(product)}
                    disabled={isOut}
                    className={`w-full py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all
                    ${isOut
                        ? "bg-gray-300 cursor-not-allowed"
                        : "bg-gradient-to-r from-green-500 to-green-600 text-white hover:scale-105"}
                  `}
                  >
                    <IoFlashSharp className="text-lg" />
                    <span>สั่งซื้อเลย</span>
                  </button>

                  <button
                    onClick={() => !isOut && addToCart(product)}
                    disabled={isOut}
                    className={`w-full border-2 rounded-xl py-2 px-4 flex items-center justify-center gap-2 font-semibold
                    ${isOut
                        ? "border-gray-300 text-gray-400 cursor-not-allowed"
                        : "border-green-500 text-green-600 hover:bg-green-50"}
                  `}
                  >
                    <FaShoppingCart className="text-sm" />
                    <span className="text-sm">เพิ่มใส่ตะกร้า</span>
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CactusItems;
