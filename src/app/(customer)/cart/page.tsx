'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface CartItem {
  Pid: number;
  Pname: string;
  Ppicture: string;
  Pprice: number;
  quantity: number;
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const router = useRouter();

  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem("cart") || "[]");
    setCartItems(storedCart);
  }, []);

  const removeItem = (Pid: number) => {
    const newCart = cartItems.filter(item => item.Pid !== Pid);
    setCartItems(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  const updateQuantity = (Pid: number, delta: number) => {
    const newCart = cartItems.map(item =>
      item.Pid === Pid
        ? { ...item, quantity: Math.max(1, item.quantity + delta) }
        : item
    );
    setCartItems(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
  };

  const totalPrice = cartItems.reduce((sum, item) => sum + item.Pprice * item.quantity, 0);

  const handleCheckout = () => {
    router.push('/checkout');
  };
  // เพิ่มก่อน return
  const shippingFee = totalPrice >= 1000 ? 0 : 50;
  const grandTotal = totalPrice + shippingFee;


  return (
    <div className="min-h-screen bg-white text-black">
      <div className="p-10 pt-40 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">ตะกร้าสินค้า</h1>
        <div className="border-2 border-yellow-400 bg-yellow-100 rounded-xl p-4 mb-6 flex items-center gap-4">
  <span className="text-2xl">🚚</span>
  <div className="text-sm text-gray-800 leading-snug">
    <p>🟡 <b>ค่าจัดส่งเหมาจ่าย 50 บาท</b></p>
    <p>💚 สั่งซื้อครบ <b className="text-green-600">1,000 บาท</b> ขึ้นไป <span className="font-bold text-green-700">ส่งฟรี!</span></p>
  </div>
</div>


        {cartItems.length === 0 ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="bg-gray-100 border border-gray-300 rounded-xl px-10 py-16 text-center shadow-md w-full max-w-xl">
              <p className="text-gray-800 text-2xl font-semibold">ไม่มีสินค้าในตะกร้า</p>
              <p className="text-gray-500 text-base mt-4">ไปเลือกแคคตัสน่ารัก ๆ มาใส่ตะกร้าดีกว่า 🌵💚</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 🟢 Header ตาราง */}
            <div className="grid grid-cols-5 font-semibold border-b pb-2">
              <span className="col-span-2">สินค้า</span>
              <span className="text-center">จำนวน</span>
              <span className="text-right">ยอดรวม</span>
              <span className="text-right">ลบ</span>
            </div>

            {cartItems.map(item => (
              <div key={item.Pid} className="grid grid-cols-5 items-center border-b py-4 gap-4">
                {/* ภาพ + ชื่อ */}
                <div className="col-span-2 flex items-center gap-4">
                  <img
                    src={`http://localhost:3000${item.Ppicture}`}
                    className="w-20 h-20 object-cover rounded"
                    alt={item.Pname}
                  />
                  <div>
                    <p className="font-semibold">{item.Pname}</p>
                    <p className="text-sm text-red-600">{item.Pprice} บาท</p>
                  </div>
                </div>

                {/* จำนวน */}
                <div className="flex justify-center items-center gap-2">
                  <button onClick={() => updateQuantity(item.Pid, -1)} className="px-2 py-1 border">-</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.Pid, 1)} className="px-2 py-1 border">+</button>
                </div>

                {/* ยอดรวม */}
                <div className="text-right font-medium">
                  {(item.quantity * item.Pprice).toFixed(2)} บาท
                </div>

                {/* ลบ */}
                <div className="text-right">
                  <button onClick={() => removeItem(item.Pid)} className="text-red-500 text-sm">ลบ</button>
                </div>
              </div>
            ))}


           



            {/* 🟢 สรุปยอดรวม */}
            <div className="text-right space-y-2 mt-6">
              <p>ยอดสินค้า: {totalPrice.toFixed(2)} บาท</p>
              <p>ค่าจัดส่ง: {shippingFee === 0 ? 'ส่งฟรี' : `${shippingFee} บาท`}</p>
              <p className="text-xl font-bold text-red-600">
                รวมทั้งหมด: {grandTotal.toFixed(2)} บาท
              </p>
            </div>

            <div className="text-right mt-4">
              <button
                onClick={handleCheckout}
                className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
              >
                ดำเนินการสั่งซื้อ
              </button>
            </div>
          </div>
        )}
      </div>
    </div>

  );
}
