'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useCart } from '../../context/CartContext';

interface CartItem {
  Pid: number;
  Pname: string;
  Ppicture: string;
  Pprice: number;
  quantity: number;
}

// ด้านบนไฟล์ CartPage.tsx
interface AuctionOrderLite {
  orderId: number;             // ไอดีออเดอร์
  auctionId: number;           // รอบประมูล
  productId: number;
  productName: string;
  productPicture: string;      // path รูปแรก
  finalPrice: number;          // = ราคาปิด
  paymentStatus: 'pending' | 'paid';
  createdAt: string;
}

const API = process.env.NEXT_PUBLIC_API_BASE as string;


export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const router = useRouter();
  const { refreshCart } = useCart();
  // ใน component CartPage
  const [auctionOrders, setAuctionOrders] = useState<AuctionOrderLite[]>([]);
  const [loadingAuctions, setLoadingAuctions] = useState<boolean>(true);

  useEffect(() => {
    // โหลดออเดอร์ประมูลที่ยังไม่ชำระของผู้ใช้ที่ล็อกอิน
    const loadAuctionOrders = async () => {
      try {
        setLoadingAuctions(true);
        const res = await fetch(`${API}/my/auction-orders?status=pending`, { cache: 'no-store', credentials: 'include' });
        if (!res.ok) throw new Error('load auction orders failed');
        const rows: AuctionOrderLite[] = await res.json();
        setAuctionOrders(Array.isArray(rows) ? rows : []);
      } catch {
        setAuctionOrders([]);
      } finally {
        setLoadingAuctions(false);
      }
    };
    loadAuctionOrders();
  }, []);


  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem("cart") || "[]");
    setCartItems(storedCart);
  }, []);

  const removeItem = (Pid: number) => {
    const newCart = cartItems.filter(item => item.Pid !== Pid);
    setCartItems(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
    refreshCart();
  };

  const updateQuantity = (Pid: number, delta: number) => {
    const newCart = cartItems.map(item =>
      item.Pid === Pid
        ? { ...item, quantity: Math.max(1, item.quantity + delta) }
        : item
    );
    setCartItems(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
    refreshCart();
  };

  const totalPrice = cartItems.reduce((sum, item) => sum + item.Pprice * item.quantity, 0);

  const handleCheckout = () => {
    router.push('/checkout');
  };
  // เพิ่มก่อน return
  const shippingFee = totalPrice >= 1000 ? 0 : 50;
  const grandTotal = totalPrice + shippingFee;


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 text-black">
      <div className="p-6 pt-32 max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2 rounded-full text-sm font-semibold mb-4">
            รายการสินค้าของคุณ
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4">
            ตะกร้าสินค้า
          </h1>
        </div>

        {/* Shipping Info Card */}
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-2xl p-6 mb-8 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center text-2xl shadow-md">
              🚚
            </div>
            <div className="flex-1">
              <p className="text-gray-800 font-semibold mb-1">🟡 ค่าจัดส่งเหมาจ่าย 50 บาท</p>
              <p className="text-gray-700">💚 สั่งซื้อครบ <span className="font-bold text-green-600">1,000 บาท</span> ขึ้นไป <span className="font-bold text-green-700">ส่งฟรี!</span></p>
            </div>
          </div>
        </div>{/* กล่อง: คุณมีรายการประมูลที่ค้างชำระ */}
        {/* Auction Orders Section */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-indigo-200 p-6 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-2xl shadow-md">
              🔔
            </div>
            <h2 className="text-xl font-bold text-gray-800">
              รายการประมูลที่ยังไม่ได้ชำระ
            </h2>
          </div>

          {loadingAuctions ? (
            <p className="text-sm text-gray-600">กำลังโหลด...</p>
          ) : auctionOrders.length === 0 ? (
            <p className="text-sm text-gray-600">ไม่มีรายการค้างชำระจากประมูล</p>
          ) : (
            <div className="space-y-4">
              {auctionOrders.map(o => (
                <div key={o.orderId} className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-xl p-4 hover:border-indigo-300 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <img
                      src={`${API}${o.productPicture?.startsWith('/') ? '' : '/'}${o.productPicture}`}
                      alt={o.productName}
                      className="w-16 h-16 object-cover rounded-lg shadow-sm"
                    />
                    <div>
                      <div className="font-medium">{o.productName}</div>
                      <div className="text-sm text-gray-600">
                        ราคาปิด: {o.finalPrice.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท
                      </div>
                      <div className="text-xs text-gray-500">
                        เลขออเดอร์ #{o.orderId} • รอบ #{o.auctionId}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 rounded bg-amber-100 text-amber-700 border border-amber-200">
                      รอชำระเงิน
                    </span>
                    <button
                      onClick={() => {
                        // ไปหน้า payment/checkout เดิม พร้อมระบุ order
                        // เลือกใช้ตามระบบที่มีอยู่: /payment?order= หรือ /orders/[id]
                        // ตัวอย่าง:
                        router.push(`/payment?order=${o.orderId}`);
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-3 py-1.5 rounded"
                    >
                      ไปชำระเงิน
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* หมายเหตุเล็ก ๆ เพื่อความชัดเจนว่าไม่รวมกับตะกร้า */}
          <p className="text-sm text-gray-600 mt-4 bg-gray-50 p-3 rounded-lg">
            💡 ยอดจากประมูลจะแยกชำระต่างหาก และไม่รวมกับยอดในตะกร้าสินค้าทั่วไป
          </p>
        </div>





        {cartItems.length === 0 ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="bg-white rounded-3xl shadow-2xl px-12 py-20 text-center border-2 border-gray-200 w-full max-w-xl">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-6 text-5xl">
                🛒
              </div>
              <p className="text-gray-800 text-3xl font-bold mb-3">ไม่มีสินค้าในตะกร้า</p>
              <p className="text-gray-500 text-lg">ไปเลือกแคคตัสน่ารัก ๆ มาใส่ตะกร้าดีกว่า 🌵💚</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Cart Items */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">รายการสินค้า</h2>
              <div className="space-y-4">

                {cartItems.map(item => (
                  <div key={item.Pid} className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-xl p-4 hover:border-green-300 hover:shadow-md transition-all duration-300">
                    {/* ภาพ + ชื่อ */}
                    <div className="flex items-center gap-4 flex-1">
                      <img
                        src={`http://localhost:3000${item.Ppicture}`}
                        className="w-24 h-24 object-cover rounded-xl shadow-sm"
                        alt={item.Pname}
                      />
                      <div>
                        <p className="font-bold text-gray-800 text-lg">{item.Pname}</p>
                        <p className="text-green-600 font-semibold">{item.Pprice} บาท</p>
                      </div>
                    </div>

                    {/* จำนวน */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center border-2 border-gray-300 rounded-lg">
                        <button onClick={() => updateQuantity(item.Pid, -1)} className="px-3 py-2 hover:bg-gray-100 transition-colors">-</button>
                        <span className="px-4 font-semibold border-x-2 border-gray-300">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.Pid, 1)} className="px-3 py-2 hover:bg-gray-100 transition-colors">+</button>
                      </div>
                    </div>

                    {/* ยอดรวม + ลบ */}
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm text-gray-500">ยอดรวม</p>
                        <p className="text-xl font-bold text-green-600">{(item.quantity * item.Pprice).toFixed(2)} บาท</p>
                      </div>
                      <button onClick={() => removeItem(item.Pid)} className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg font-semibold transition-colors">
                        ลบ
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>






            {/* Summary */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">สรุปยอดรวม</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-lg">
                  <span className="text-gray-600">ยอดสินค้า:</span>
                  <span className="font-semibold">{totalPrice.toFixed(2)} บาท</span>
                </div>
                <div className="flex justify-between text-lg">
                  <span className="text-gray-600">ค่าจัดส่ง:</span>
                  <span className="font-semibold">{shippingFee === 0 ? 'ส่งฟรี 🎉' : `${shippingFee} บาท`}</span>
                </div>
                <div className="border-t-2 border-gray-200 pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-gray-800">รวมทั้งหมด:</span>
                    <span className="text-2xl font-bold text-green-600">{grandTotal.toFixed(2)} บาท</span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleCheckout}
                className="w-full mt-6 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl"
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
