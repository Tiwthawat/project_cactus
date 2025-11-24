'use client';

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaHeart, FaRegHeart, FaShoppingCart } from "react-icons/fa";
import { IoFlashSharp } from "react-icons/io5";

interface Product {
  Pid: number;
  Pname: string;
  Pprice: number;
  Ppicture: string;
}
interface Props {
  type?: "latest";
  typeid?: number;
}
interface FavoriteProduct {
  product_id: number;
}

const CactusItems = ({ type, typeid }: Props) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [hoveredProduct, setHoveredProduct] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchProducts = async () => {
      const url = type === "latest"
        ? "http://localhost:3000/product/latest"
        : typeid
          ? `http://localhost:3000/Product?typeid=${typeid}`
          : "http://localhost:3000/Product";

      try {
        const res = await fetch(url);
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        console.error("โหลดสินค้าไม่สำเร็จ:", err);
      }
    };

    const fetchFavorites = async (cid: number) => {
      try {
        const res = await fetch(`http://localhost:3000/favorites/${cid}`);
        const data: FavoriteProduct[] = await res.json();
        setFavorites(data.map((item) => item.product_id));
      } catch (err) {
        console.error("โหลดรายการโปรดล้มเหลว:", err);
      }
    };

    fetchProducts();

    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed?.Cid) {
          setCustomerId(parsed.Cid);
          fetchFavorites(parsed.Cid);
        }
      } catch (err) {
        console.error("อ่าน user ไม่ได้:", err);
      }
    }
  }, [type, typeid]);

  const toggleFavorite = async (productId: number) => {
    if (!customerId) return;
    const res = await fetch("http://localhost:3000/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customer_id: customerId, product_id: productId }),
    });

    if (res.ok) {
      setFavorites((prev) =>
        prev.includes(productId)
          ? prev.filter((id) => id !== productId)
          : [...prev, productId]
      );
    }
  };

  const handleBuyNow = (product: Product) => {
    localStorage.setItem("buynow", JSON.stringify({ pid: product.Pid, qty: 1 }));
    router.push("/checkout?type=buynow");
  };

  const addToCart = (product: Product) => {
    const cart: {
      Pid: number;
      Pname: string;
      Pprice: number;
      Ppicture: string;
      quantity: number;
    }[] = JSON.parse(localStorage.getItem("cart") || "[]");

    const existingIndex = cart.findIndex((item) => item.Pid === product.Pid);
    if (existingIndex !== -1) {
      cart[existingIndex].quantity += 1;
    } else {
      cart.push({
        Pid: product.Pid,
        Pname: product.Pname,
        Pprice: Number(product.Pprice),
        Ppicture: product.Ppicture.split(",")[0],
        quantity: 1,
      });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    alert("เพิ่มลงตะกร้าแล้ว");
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 w-full">
      {products.map((product) => (
        <div
          key={product.Pid}
          className="group relative bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:-translate-y-2"
          onMouseEnter={() => setHoveredProduct(product.Pid)}
          onMouseLeave={() => setHoveredProduct(null)}
        >
          <button
            onClick={() => toggleFavorite(product.Pid)}
            className={`absolute top-3 right-3 z-10 p-2 rounded-full backdrop-blur-sm transition-all duration-300 ${favorites.includes(product.Pid)
                ? 'bg-red-500 text-white scale-110'
                : 'bg-white/80 text-red-500 hover:bg-red-50'
              }`}
            title={favorites.includes(product.Pid) ? "ลบจากรายการโปรด" : "เพิ่มในรายการโปรด"}
          >
            {favorites.includes(product.Pid) ? (
              <FaHeart className="text-lg" />
            ) : (
              <FaRegHeart className="text-lg" />
            )}
          </button>

          {type === "latest" && (
            <div className="absolute top-3 left-3 z-10 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
              ✨ ใหม่
            </div>
          )}

          <Link href={`/product/${product.Pid}`} className="block">
            <div className="relative overflow-hidden bg-gray-100 aspect-square">
              <img
                src={`http://localhost:3000${product.Ppicture.split(",")[0].trim()}`}
                alt={product.Pname}
                className={`w-full h-full object-cover transition-transform duration-500 ${hoveredProduct === product.Pid ? 'scale-110' : 'scale-100'
                  }`}
              />

              <div className={`absolute inset-0 bg-black/20 transition-opacity duration-300 ${hoveredProduct === product.Pid ? 'opacity-100' : 'opacity-0'
                }`}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="bg-white text-gray-800 px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                    ดูรายละเอียด →
                  </span>
                </div>
              </div>
            </div>
          </Link>

          <div className="p-4 space-y-3">
            <Link href={`/product/${product.Pid}`}>
              <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 hover:text-green-600 transition-colors min-h-[2.5rem]">
                {product.Pname}
              </h3>
            </Link>

            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-green-600">
                {product.Pprice}
              </span>
              <span className="text-sm text-gray-500">฿</span>
            </div>

            <div className="space-y-2 mt-4">
              <button
                onClick={() => handleBuyNow(product)}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-all duration-300 shadow-md hover:shadow-xl flex items-center justify-center gap-2 transform hover:scale-105"
              >
                <IoFlashSharp className="text-lg" />
                <span>สั่งซื้อเลย</span>
              </button>
              <button
                onClick={() => addToCart(product)}
                className="w-full bg-white border-2 border-green-500 text-green-600 hover:bg-green-50 font-semibold py-2 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
              >
                <FaShoppingCart className="text-sm" />
                <span className="text-sm">เพิ่มใส่ตะกร้า</span>
              </button>
            </div>
          </div>

          <div className={`absolute inset-0 rounded-2xl border-2 border-transparent transition-all duration-300 pointer-events-none ${hoveredProduct === product.Pid ? 'border-green-400' : ''
            }`}></div>
        </div>
      ))}
    </div>
  );
};

export default CactusItems;