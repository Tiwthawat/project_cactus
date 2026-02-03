'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch } from '@/app/lib/apiFetch';

const API = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';

interface CartItem {
  Pid: number;
  Pname: string;
  Ppicture: string;
  Pprice: number;
  quantity: number;
  Pnumproduct: number;
}

interface User {
  Cid: number;
  Cname: string;
  Cphone: string;
  Caddress: string;
  Csubdistrict: string;
  Cdistrict: string;
  Cprovince: string;
  Czipcode: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get('type'); // "buynow" | null | "cart"(optional)
  const isBuyNow = type === 'buynow';

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [Cid, setCid] = useState<number | null>(null);
  const [payment, setPayment] = useState<'transfer' | 'cod'>('transfer');
  const [loading, setLoading] = useState(false);

  const totalPrice = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.Pprice * item.quantity, 0),
    [cartItems]
  );
  const shippingFee = totalPrice >= 1000 ? 0 : 50;
  const grandTotal = totalPrice + shippingFee;

  const fullAddress = useMemo(() => {
    if (!user) return '';
    return [user.Caddress, user.Csubdistrict, user.Cdistrict, user.Cprovince, user.Czipcode]
      .filter((x) => typeof x === 'string' && x.trim().length > 0)
      .join(', ');
  }, [user]);

  // -------------------------------
  // Load profile from DB (source of truth)
  // -------------------------------
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await apiFetch(`${API}/me`);
        if (!res.ok) return;

        const data = await res.json();
        const u: User | null = (data?.user ?? data) || null;

        if (u?.Cid) {
          setUser(u);
          setCid(u.Cid);
          // 
          localStorage.setItem('user', JSON.stringify(u));
        }
      } catch (err) {
        console.error('โหลดข้อมูลผู้ใช้ล้มเหลว:', err);
      }
    };

    loadProfile();
  }, []);

  // -------------------------------
  // Load cart / buynow items
  // -------------------------------
  useEffect(() => {
    const loadItems = async () => {
      try {
        if (isBuyNow) {
          const data = JSON.parse(localStorage.getItem('buynow') || '{}') as { pid?: number; qty?: number };
          if (!data?.pid) {
            setCartItems([]);
            return;
          }

          const res = await apiFetch(`${API}/product/${data.pid}`);
          if (!res.ok) {
            setCartItems([]);
            return;
          }

          const product = await res.json();

          const pic = typeof product?.Ppicture === 'string' ? product.Ppicture.split(',')[0] : '';
          setCartItems([
            {
              Pid: product.Pid,
              Pname: product.Pname,
              Ppicture: pic,
              Pprice: Number(product.Pprice) || 0,
              quantity: data.qty || 1,
              Pnumproduct: Number(product.Pnumproduct) || 0,

            },
          ]);
        } else {
          const cart = JSON.parse(localStorage.getItem('cart') || '[]') as CartItem[];
          setCartItems(Array.isArray(cart) ? cart : []);
        }
      } catch (err) {
        console.error('โหลดรายการสินค้าล้มเหลว:', err);
        setCartItems([]);
      }
    };

    loadItems();
  }, [isBuyNow]);

  useEffect(() => {
    const syncStockFromDB = async () => {
      if (cartItems.length === 0) return;

      try {
        const results = await Promise.all(
          cartItems.map(async (it) => {
            const res = await apiFetch(`${API}/product/${it.Pid}`, { cache: "no-store" });
            if (!res.ok) return { Pid: it.Pid, stock: it.Pnumproduct ?? 0 };
            const data = await res.json();
            return { Pid: it.Pid, stock: Number(data?.Pnumproduct) || 0 };
          })
        );

        const stockMap = new Map(results.map(r => [r.Pid, r.stock]));

        setCartItems(prev =>
          prev.map(it => {
            const stock = stockMap.get(it.Pid);
            if (!Number.isFinite(stock)) return it;

            return {
              ...it,
              Pnumproduct: stock as number,
              quantity: Math.min(it.quantity, stock as number) || 1,
            };
          })
        );
      } catch {
        // เงียบได้
      }
    };

    syncStockFromDB();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartItems.map(x => x.Pid).join(",")]);


  // -------------------------------
  // Update LocalStorage (cart only)
  // -------------------------------
  const updateCartLS = (items: CartItem[]) => {
    setCartItems(items);
    if (!isBuyNow) {
      localStorage.setItem('cart', JSON.stringify(items));
    }
  };

  // -------------------------------
  // Increase / Decrease / Delete
  // -------------------------------
  const increaseQty = (pid: number) => {
    const updated = cartItems.map((item) => {
      if (item.Pid !== pid) return item;
      const max = item.Pnumproduct ?? Infinity;
      return { ...item, quantity: Math.min(item.quantity + 1, max) };
    });
    updateCartLS(updated);
  };


  const decreaseQty = (pid: number) => {
    const updated = cartItems.map((item) =>
      item.Pid === pid ? { ...item, quantity: Math.max(1, item.quantity - 1) } : item
    );
    updateCartLS(updated);
  };

  const deleteItem = (pid: number) => {
    const updated = cartItems.filter((item) => item.Pid !== pid);
    updateCartLS(updated);

    if (updated.length === 0) {
      router.push('/');
    }
  };

  // -------------------------------
  // Submit order
  // -------------------------------
  const handleOrder = async () => {
    if (!Cid || cartItems.length === 0) {
      alert('ไม่มีข้อมูลลูกค้าหรือสินค้า');
      return;
    }

    setLoading(true);

    try {
      const res = await apiFetch(`${API}/orders`, {
        method: 'POST',
        body: JSON.stringify({
          Cid,
          payment,
          totalPrice: grandTotal,
          items: cartItems.map((item) => ({
            Pid: item.Pid,
            price: item.Pprice,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert('สั่งซื้อสำเร็จ!');
        localStorage.removeItem('cart');
        localStorage.removeItem('buynow');

        if (payment === 'cod') router.push('/me/orders');
        else router.push(`/payment/${data.orderId}`);
      } else {
        alert(data?.message || 'เกิดข้อผิดพลาด');
      }
    } catch (err) {
      console.error(err);
      alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------
  // UI
  // -------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 text-black">
      <div className="max-w-5xl mx-auto pt-32 p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2 rounded-full text-sm font-semibold mb-4">
            ขั้นตอนสุดท้าย
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4">
            ยืนยันคำสั่งซื้อ
          </h1>
        </div>

        {/* Address Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-2 border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xl shadow-md">
              📍
            </div>
            <h2 className="text-2xl font-bold text-gray-800">ข้อมูลการจัดส่ง</h2>
          </div>

          <div className="space-y-4">
            <input
              value={user?.Cname || ''}
              readOnly
              placeholder="ชื่อผู้รับ"
              className="w-full p-3 border-2 border-gray-200 rounded-xl bg-gray-50 focus:outline-none"
            />
            <input
              value={user?.Cphone || ''}
              readOnly
              placeholder="เบอร์โทรศัพท์"
              className="w-full p-3 border-2 border-gray-200 rounded-xl bg-gray-50 focus:outline-none"
            />
            <textarea
              value={fullAddress}
              readOnly
              placeholder="ที่อยู่จัดส่ง"
              className="w-full p-3 border-2 border-gray-200 rounded-xl bg-gray-50 focus:outline-none min-h-[100px]"
            />
            {!user && (
              <p className="text-sm text-gray-500">
                กำลังโหลดข้อมูลที่อยู่จากระบบ...
              </p>
            )}
          </div>
        </div>

        {/* Payment Method Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-2 border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl shadow-md">
              💳
            </div>
            <h2 className="text-2xl font-bold text-gray-800">เลือกวิธีชำระเงิน</h2>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl hover:border-green-300 cursor-pointer transition-all">
              <input
                type="radio"
                name="payment"
                value="transfer"
                checked={payment === 'transfer'}
                onChange={() => setPayment('transfer')}
                className="w-5 h-5 text-green-600"
              />
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏦</span>
                <span className="font-semibold text-gray-700">โอนเงินผ่านบัญชีธนาคาร</span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl hover:border-green-300 cursor-pointer transition-all">
              <input
                type="radio"
                name="payment"
                value="cod"
                checked={payment === 'cod'}
                onChange={() => setPayment('cod')}
                className="w-5 h-5 text-green-600"
              />
              <div className="flex items-center gap-3">
                <span className="text-2xl">💵</span>
                <span className="font-semibold text-gray-700">ชำระเงินปลายทาง (COD)</span>
              </div>
            </label>
          </div>
        </div>

        {/* Items Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-2 border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-xl shadow-md">
              🛍️
            </div>
            <h2 className="text-2xl font-bold text-gray-800">รายการสินค้า</h2>
          </div>

          <div className="space-y-4">
            {cartItems.map((item) => (
              <div
                key={item.Pid}
                className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 hover:border-green-300 transition-all"
              >
                <img
                  src={`${API}${item.Ppicture}`}
                  className="w-24 h-24 object-cover rounded-xl shadow-sm"
                  alt={item.Pname}
                />

                <div className="flex-grow">
                  <p className="font-bold text-gray-800 text-lg">{item.Pname}</p>
                  <p className="text-green-600 font-semibold">ราคา {item.Pprice} บาท</p>

                  <div className="flex items-center gap-3 mt-2">
                    <button
                      onClick={() => decreaseQty(item.Pid)}
                      className="w-8 h-8 flex items-center justify-center border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      -
                    </button>

                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => {
                        let val = parseInt(e.target.value, 10);
                        if (isNaN(val) || val < 1) val = 1;

                        const updated = cartItems.map((x) => (x.Pid === item.Pid ? { ...x, quantity: val } : x));
                        updateCartLS(updated);
                      }}
                      className="w-16 bg-white text-center border-2 border-gray-300 rounded-lg p-1 font-semibold"
                    />

                    <button
                      onClick={() => increaseQty(item.Pid)}
                      disabled={item.quantity >= item.Pnumproduct}
                      className="w-8 h-8 flex items-center justify-center border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      +
                    </button>


                    <button
                      onClick={() => deleteItem(item.Pid)}
                      className="ml-4 bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1 rounded-lg font-semibold transition-colors"
                    >
                      ลบ
                    </button><p className="text-sm text-gray-500 mt-1">
                      เหลือสินค้า {item.Pnumproduct} ชิ้น
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm text-gray-500">ยอดรวม</p>


                  <p className="text-xl font-bold text-green-600">{item.Pprice * item.quantity} บาท</p>
                </div>
              </div>
            ))}

            {!cartItems.length && <p className="text-gray-500">ไม่มีสินค้าในรายการ</p>}
          </div>
        </div>

        {/* Summary Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-2 border-gray-200">
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
        </div>

        <button
          onClick={handleOrder}
          disabled={loading || !user || cartItems.length === 0}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-4 rounded-xl text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50"
        >
          {loading ? 'กำลังสั่งซื้อ...' : 'ยืนยันคำสั่งซื้อ'}
        </button>
      </div>
    </div>
  );
}
