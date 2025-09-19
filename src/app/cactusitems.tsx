'use client';

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaHeart, FaRegHeart } from "react-icons/fa";

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
  };

  return (
    <div className="flex flex-wrap gap-4 justify-start w-full">
      {products.map((product) => (
        <div key={product.Pid} className="w-[calc(20%-0.8rem)] relative">
          <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition">
            <Link href={`/product/${product.Pid}`}>
              <img
                src={`http://localhost:3000${product.Ppicture.split(",")[0].trim()}`}
                alt={product.Pname}
                className="w-full h-[180px] object-cover rounded"
              />
              <h3 className="mt-2 text-sm font-semibold text-black truncate">
                {product.Pname}
              </h3>
            </Link>

            <p className="text-red-600 text-lg font-bold">{product.Pprice} ฿</p>

            <button
              onClick={() => handleBuyNow(product)}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded w-full"
            >
              สั่งซื้อเลย
            </button>

            <button
              onClick={() => addToCart(product)}
              className="mt-2 w-full bg-orange-400 text-white py-1 text-sm rounded hover:bg-orange-500"
            >
              🛒 เพิ่มใส่ตะกร้า
            </button>
          </div>

          <button
            onClick={() => toggleFavorite(product.Pid)}
            className="absolute top-2 right-2 text-red-500 text-xl"
            title={favorites.includes(product.Pid) ? "ลบจากรายการโปรด" : "เพิ่มในรายการโปรด"}
          >
            {favorites.includes(product.Pid) ? <FaHeart /> : <FaRegHeart />}
          </button>
        </div>
      ))}
    </div>
  );
};

export default CactusItems;
