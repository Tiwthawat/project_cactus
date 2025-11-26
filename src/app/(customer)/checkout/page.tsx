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
    <div className="max-w-4xl mx-auto pt-36 p-6 bg-white text-black">
      <h1 className="text-3xl font-bold mb-6">ยืนยันคำสั่งซื้อ</h1>

      {/* Address */}
      <div className="space-y-3 mb-6 p-4 rounded-lg shadow-md bg-white">
        <input
          defaultValue={user?.Cname || ''}
          placeholder="ชื่อผู้รับ"
          className="w-full p-2 border rounded bg-gray-100"
        />
        <input
          defaultValue={user?.Cphone || ''}
          placeholder="เบอร์โทรศัพท์"
          className="w-full p-2 border rounded bg-gray-100"
        />
        <textarea
          defaultValue={
            user
              ? `${user.Caddress}, ${user.Csubdistrict}, ${user.Cdistrict}, ${user.Cprovince} ${user.Czipcode}`
              : ''
          }
          placeholder="ที่อยู่จัดส่ง"
          className="w-full p-2 border rounded bg-gray-100"
        />
      </div>

      {/* Payment */}
      <h2 className="text-lg font-semibold mb-2">เลือกวิธีชำระเงิน</h2>
      <div className="space-y-3 mb-6 p-4 rounded-lg shadow-md bg-white">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="payment"
            value="transfer"
            checked={payment === 'transfer'}
            onChange={() => setPayment('transfer')}
          />
          <span>โอนเงินผ่านบัญชีธนาคาร</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="payment"
            value="cod"
            checked={payment === 'cod'}
            onChange={() => setPayment('cod')}
          />
          <span>ชำระเงินปลายทาง (COD)</span>
        </label>
      </div>

      {/* Items */}
      <div className="space-y-4 mb-6">
        {cartItems.map(item => (
          <div
            key={item.Pid}
            className="flex items-center gap-4 p-4 rounded-lg shadow-md bg-white"
          >
            <img
              src={`http://localhost:3000${item.Ppicture}`}
              className="w-20 h-20 object-cover rounded"
            />

            <div className="flex-grow">
              <p className="font-semibold">{item.Pname}</p>
              <p className="text-sm text-gray-600">
                ราคา {item.Pprice} บาท
              </p>

              {/* qty controls */}
             <div className="flex items-center gap-2 mt-2">
  {/* decrease */}
  <button
    onClick={() => decreaseQty(item.Pid)}
    className="w-8 h-8 flex items-center justify-center border rounded hover:bg-gray-100"
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
    className="w-14 bg-white text-center border rounded p-1"
  />

  {/* increase */}
  <button
    onClick={() => increaseQty(item.Pid)}
    className="w-8 h-8 flex items-center justify-center border rounded hover:bg-gray-100"
  >
    +
  </button>

  {/* delete */}
  <button
    onClick={() => deleteItem(item.Pid)}
    className="ml-4 text-red-600 hover:underline"
  >
    ลบ
  </button>
</div>

            </div>

            <div className="text-right font-semibold">
              {item.Pprice * item.quantity} บาท
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="text-right p-4 rounded-lg shadow-md bg-white space-y-2 mb-6">
        <p>ยอดสินค้า: {totalPrice.toFixed(2)} บาท</p>
        <p>ค่าจัดส่ง: {shippingFee === 0 ? 'ส่งฟรี' : `${shippingFee} บาท`}</p>
        <p className="text-xl font-bold text-red-600">
          รวมทั้งหมด: {grandTotal.toFixed(2)} บาท
        </p>
      </div>

      <button
        onClick={handleOrder}
        disabled={loading}
        className="w-full bg-green-600 text-white py-3 rounded-lg text-lg hover:bg-green-700 shadow-lg"
      >
        {loading ? 'กำลังสั่งซื้อ...' : 'ยืนยันคำสั่งซื้อ'}
      </button>
    </div>
  );
}
