'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaHeart } from 'react-icons/fa';

interface Product {
  Pid: number;
  Pname: string;
  Pprice: number;
  Ppicture: string;
}

export default function FavoritesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customerId, setCustomerId] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return;

    try {
      const parsed = JSON.parse(storedUser);
      const cid = parsed?.Cid;
      setCustomerId(cid);

      if (cid) {
        fetch(`http://localhost:3000/favorites/${cid}`)
          .then((res) => res.json())
          .then((data) => setProducts(data))
          .catch((err) => console.error('โหลดรายการโปรดล้มเหลว', err));
      }
    } catch (err) {
      console.error('แปลง user ผิด:', err);
    }
  }, []);

  const handleBuyNow = (product: Product) => {
    localStorage.setItem(
      'buynow',
      JSON.stringify({ pid: product.Pid, qty: 1 })
    );
    router.push('/checkout?type=buynow');
  };

  const addToCart = (product: Product) => {
    const cart: {
      Pid: number;
      Pname: string;
      Pprice: number;
      Ppicture: string;
      quantity: number;
    }[] = JSON.parse(localStorage.getItem('cart') || '[]');

    const existingIndex = cart.findIndex((item) => item.Pid === product.Pid);

    if (existingIndex !== -1) {
      cart[existingIndex].quantity += 1;
    } else {
      cart.push({
        Pid: product.Pid,
        Pname: product.Pname,
        Pprice: product.Pprice,
        Ppicture: product.Ppicture.split(',')[0],
        quantity: 1,
      });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
  };

  if (products.length === 0) {
    return <p className="p-6 text-center">ยังไม่มีสินค้าที่คุณถูกใจ ❤️</p>;
  }

  return (
    <div className="p-6 pt-36 bg-white min-h-screen">
      <h1 className="text-2xl text-black font-bold mb-4">รายการโปรดของคุณ</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((product) => (
          <div key={product.Pid} className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition relative">
            <Link href={`/product/${product.Pid}`}>
              <img
                src={`http://localhost:3000${product.Ppicture.split(',')[0]}`}
                alt={product.Pname}
                className="w-full h-40 object-cover rounded"
              />
              <p className="mt-2 font-semibold text-black truncate">
                {product.Pname}
              </p>
              <p className="text-red-600 font-bold">{product.Pprice} บาท</p>
            </Link>

            <button
              onClick={() => handleBuyNow(product)}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded w-full mt-2"
            >
              สั่งซื้อเลย
            </button>

            <button
              onClick={() => addToCart(product)}
              className="mt-2 w-full bg-orange-400 text-white py-1 text-sm rounded hover:bg-orange-500"
            >
              🛒 เพิ่มใส่ตะกร้า
            </button>

            <div className="absolute top-2 right-2 text-red-500 text-xl">
              <FaHeart />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
