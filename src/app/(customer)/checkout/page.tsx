'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface CartItem {
  Pid: number;
  Pname: string;
  Ppicture: string;
  Pprice: number;
  quantity: number;
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
  const type = searchParams.get('type');

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [Cid, setCid] = useState<number | null>(null);
  const [payment, setPayment] = useState<'transfer' | 'cod'>('transfer');
  const [loading, setLoading] = useState(false);

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.Pprice * item.quantity,
    0
  );
  const shippingFee = totalPrice >= 1000 ? 0 : 50;
  const grandTotal = totalPrice + shippingFee;

  // -------------------------------
  // Load user + cart/buynow
  // -------------------------------
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (storedUser?.Cid) {
      setUser(storedUser);
      setCid(storedUser.Cid);
    }

    if (type === 'buynow') {
      const data = JSON.parse(localStorage.getItem('buynow') || '{}');
      if (data?.pid) {
        fetch(`http://localhost:3000/product/${data.pid}`)
          .then(res => res.json())
          .then(product => {
            setCartItems([
              {
                Pid: product.Pid,
                Pname: product.Pname,
                Ppicture: product.Ppicture.split(',')[0],
                Pprice: product.Pprice,
                quantity: data.qty || 1
              }
            ]);
          });
      }
    } else {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      setCartItems(cart);
    }
  }, [type]);

  // -------------------------------
  // Update LocalStorage
  // -------------------------------
  const updateCartLS = (items: CartItem[]) => {
    setCartItems(items);
    if (type === 'cart') {
      localStorage.setItem('cart', JSON.stringify(items));
    }
    if (type === null) {
      localStorage.setItem('cart', JSON.stringify(items));
    }
  };

  // -------------------------------
  // Increase
  // -------------------------------
  const increaseQty = (pid: number) => {
    const updated = cartItems.map(item =>
      item.Pid === pid
        ? { ...item, quantity: item.quantity + 1 }
        : item
    );
    updateCartLS(updated);
  };

  // -------------------------------
  // Decrease
  // -------------------------------
  const decreaseQty = (pid: number) => {
    const updated = cartItems
      .map(item =>
        item.Pid === pid
          ? { ...item, quantity: Math.max(1, item.quantity - 1) }
          : item
      );
    updateCartLS(updated);
  };

  // -------------------------------
  // Delete
  // -------------------------------
  const deleteItem = (pid: number) => {
    const updated = cartItems.filter(item => item.Pid !== pid);
    updateCartLS(updated);

    if (updated.length === 0) {
      router.push('/cart');
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
      const res = await fetch('http://localhost:3000/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Cid,
          payment,
          totalPrice: grandTotal,
          items: cartItems.map(item => ({
            Pid: item.Pid,
            price: item.Pprice,
            quantity: item.quantity
          }))
        })
      });

      const data = await res.json();

      if (res.ok) {
        alert('สั่งซื้อสำเร็จ!');
        localStorage.removeItem('cart');
        localStorage.removeItem('buynow');

        if (payment === 'cod') router.push('/me/orders');
        else router.push(`/payment/${data.orderId}`);
      } else {
        alert(data.message || 'เกิดข้อผิดพลาด');
      }
    } catch {
      alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์');
    }

    setLoading(false);
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
              defaultValue={user?.Cname || ''}
              placeholder="ชื่อผู้รับ"
              className="w-full p-3 border-2 border-gray-200 rounded-xl bg-gray-50 focus:border-green-400 focus:outline-none transition-colors"
            />
            <input
              defaultValue={user?.Cphone || ''}
              placeholder="เบอร์โทรศัพท์"
              className="w-full p-3 border-2 border-gray-200 rounded-xl bg-gray-50 focus:border-green-400 focus:outline-none transition-colors"
            />
            <textarea
              defaultValue={
                user
                  ? `${user.Caddress}, ${user.Csubdistrict}, ${user.Cdistrict}, ${user.Cprovince} ${user.Czipcode}`
                  : ''
              }
              placeholder="ที่อยู่จัดส่ง"
              className="w-full p-3 border-2 border-gray-200 rounded-xl bg-gray-50 focus:border-green-400 focus:outline-none transition-colors min-h-[100px]"
            />
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
            {cartItems.map(item => (
              <div
                key={item.Pid}
                className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 hover:border-green-300 transition-all"
              >
                <img
                  src={`http://localhost:3000${item.Ppicture}`}
                  className="w-24 h-24 object-cover rounded-xl shadow-sm"
                  alt={item.Pname}
                />

                <div className="flex-grow">
                  <p className="font-bold text-gray-800 text-lg">{item.Pname}</p>
                  <p className="text-green-600 font-semibold">
                    ราคา {item.Pprice} บาท
                  </p>

                  {/* qty controls */}
                  <div className="flex items-center gap-3 mt-2">
                    {/* decrease */}
                    <button
                      onClick={() => decreaseQty(item.Pid)}
                      className="w-8 h-8 flex items-center justify-center border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      -
                    </button>

                    {/* input – allow typing */}
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => {
                        let val = parseInt(e.target.value);

                        if (isNaN(val) || val < 1) val = 1;

                        const updated = cartItems.map(x =>
                          x.Pid === item.Pid ? { ...x, quantity: val } : x
                        );
                        updateCartLS(updated);
                      }}
                      className="w-16 bg-white text-center border-2 border-gray-300 rounded-lg p-1 font-semibold"
                    />

                    {/* increase */}
                    <button
                      onClick={() => increaseQty(item.Pid)}
                      className="w-8 h-8 flex items-center justify-center border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      +
                    </button>

                    {/* delete */}
                    <button
                      onClick={() => deleteItem(item.Pid)}
                      className="ml-4 bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1 rounded-lg font-semibold transition-colors"
                    >
                      ลบ
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm text-gray-500">ยอดรวม</p>
                  <p className="text-xl font-bold text-green-600">{item.Pprice * item.quantity} บาท</p>
                </div>
              </div>
            ))}
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
          disabled={loading}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-4 rounded-xl text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50"
        >
          {loading ? 'กำลังสั่งซื้อ...' : 'ยืนยันคำสั่งซื้อ'}
        </button>
      </div>
    </div>
  );
}
