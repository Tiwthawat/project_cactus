'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useCart } from '../../context/CartContext';
import { apiFetch } from "@/app/lib/apiFetch";

interface CartItem {
  Pid: number;
  Pname: string;
  Ppicture: string;
  Pprice: number;
  Pnumproduct: number;
  Prenume: number;
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

  // ใน component CartPage (ของเก่าอยู่ครบ ถึงแม้ UI จะตัดไปแล้ว)
  const [auctionOrders, setAuctionOrders] = useState<AuctionOrderLite[]>([]);
  const [loadingAuctions, setLoadingAuctions] = useState<boolean>(true);

  const getFirstPic = (pic?: string) => {
  const first = (pic ?? "").split(",")[0]?.trim() ?? "";
  if (!first) return ""; // หรือใส่รูป placeholder ก็ได้

  // ถ้าเป็นลิงก์เต็มอยู่แล้ว
  if (/^https?:\/\//i.test(first)) return first;

  // ถ้าเป็น path ในระบบ -> เติม API + บังคับให้มี /
  return `${API}${first.startsWith("/") ? "" : "/"}${first}`;
};


  useEffect(() => {
    // โหลดออเดอร์ประมูลที่ยังไม่ชำระของผู้ใช้ที่ล็อกอิน (ของเก่าอยู่ครบ)
    const loadAuctionOrders = async () => {
      try {
        setLoadingAuctions(true);
        const res = await apiFetch(`${API}/my/auction-orders?status=pending`, { cache: 'no-store', credentials: 'include' });
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
    const syncStockFromDB = async () => {
      if (cartItems.length === 0) return;

      try {
        const results = await Promise.all(
          cartItems.map(async (it) => {
            const res = await fetch(`${API}/product/${it.Pid}`, { cache: "no-store" });
            if (!res.ok) return { Pid: it.Pid, stock: it.Pnumproduct };
            const data = await res.json();
            return { Pid: it.Pid, stock: Number(data?.Pnumproduct) };
          })
        );

        const stockMap = new Map(results.map(r => [r.Pid, r.stock]));

        setCartItems(prev => {
          const next = prev.map(it => {
            const stock = stockMap.get(it.Pid);
            if (!Number.isFinite(stock)) return it;

            // ✅ ทับ stock ให้ตรง DB + clamp จำนวนในตะกร้าไม่ให้เกิน
            return {
              ...it,
              Pnumproduct: stock as number,
              quantity: Math.min(it.quantity, stock as number),
            };
          });

          localStorage.setItem("cart", JSON.stringify(next));
          refreshCart();
          return next;
        });
      } catch {
        // เงียบไว้ได้
      }
    };

    syncStockFromDB();
    // ให้รันเมื่อ Pid ในตะกร้าเปลี่ยน (กัน loop)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartItems.map(x => x.Pid).join(","), refreshCart]);

  useEffect(() => {
    let raw: unknown = [];
    try {
      raw = JSON.parse(localStorage.getItem("cart") || "[]");
    } catch {
      raw = [];
    }

    const arr = Array.isArray(raw) ? raw : [];

    const normalized: CartItem[] = arr.map((it: any) => {
      const qty = Number(it.quantity);
      const price = Number(it.Pprice);
      const stock = Number(it.Pnumproduct);

      return {
        Pid: Number(it.Pid),
        Pname: String(it.Pname ?? ""),
        Ppicture: String(it.Ppicture ?? ""),
        Pprice: Number.isFinite(price) ? price : 0,
        // ✅ ถ้าไม่มี stock ให้ตั้งเพดานอย่างน้อย = qty (กัน clamp เป็น NaN)
        Pnumproduct: Number.isFinite(stock) ? stock : (Number.isFinite(qty) && qty > 0 ? qty : 1),
        Prenume: Number(it.Prenume) || 0,
        quantity: Number.isFinite(qty) && qty > 0 ? qty : 1,
      };
    });

    setCartItems(normalized);
    localStorage.setItem("cart", JSON.stringify(normalized));
    refreshCart();
  }, [refreshCart]);

  const removeItem = (Pid: number) => {
    const newCart = cartItems.filter(item => item.Pid !== Pid);
    setCartItems(newCart);
    localStorage.setItem('cart', JSON.stringify(newCart));
    refreshCart();
  };

  // ✅ ของเดิม: +/- clamp ตาม stock
  const updateQuantity = (Pid: number, delta: number) => {
    setCartItems(prev => {
      const next = prev.map(item => {
        if (item.Pid !== Pid) return item;

        const max = item.Pnumproduct; // ✅ stock
        const nextQty = item.quantity + delta;

        return {
          ...item,
          quantity: Math.max(1, Math.min(nextQty, max)),
        };
      });

      localStorage.setItem("cart", JSON.stringify(next));
      refreshCart();
      return next;
    });
  };

  // ✅ เพิ่มใหม่: กรอกจำนวนเอง (clamp 1..stock)
  const setQuantityDirect = (Pid: number, value: number) => {
    setCartItems(prev => {
      const next = prev.map(item => {
        if (item.Pid !== Pid) return item;

        const max = item.Pnumproduct;
        const v = Number.isFinite(value) ? value : 1;

        return {
          ...item,
          quantity: Math.max(1, Math.min(v, max)),
        };
      });

      localStorage.setItem("cart", JSON.stringify(next));
      refreshCart();
      return next;
    });
  };

  const totalPrice = cartItems.reduce((sum, item) => sum + item.Pprice * item.quantity, 0);

  const handleCheckout = () => {
    router.push('/checkout');
  };

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
  src={getFirstPic(item.Ppicture)}
  className="w-24 h-24 object-cover rounded-xl shadow-sm"
  alt={item.Pname}
/>

                      <div>
                        <p className="font-bold text-gray-800 text-lg">{item.Pname}</p>
                        <p className="text-green-600 font-semibold">{item.Pprice} บาท</p>
                      </div>
                      <span className="text-sm text-gray-500">
                        เหลือสินค้า {item.Pnumproduct} ชิ้น
                      </span>
                    </div>

                    {/* จำนวน */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center border-2 border-gray-300 rounded-lg">
                        <button
                          onClick={() => updateQuantity(item.Pid, -1)}
                          disabled={item.quantity <= 1}
                          className="px-3 py-2 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          -
                        </button>

                        {/* ✅ เพิ่มใหม่: input แก้จำนวนเองได้ */}
                        <input
                          type="number"
                          min={1}
                          max={item.Pnumproduct}
                          value={item.quantity}
                          onChange={(e) => {
                            let v = parseInt(e.target.value, 10);
                            if (Number.isNaN(v)) v = 1;
                            setQuantityDirect(item.Pid, v);
                          }}
                          className="w-16 bg-white text-center font-semibold border-x-2 border-gray-300 outline-none"
                        />

                        <button
                          onClick={() => updateQuantity(item.Pid, 1)}
                          disabled={item.quantity >= item.Pnumproduct}
                          className="px-3 py-2 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          +
                        </button>

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
