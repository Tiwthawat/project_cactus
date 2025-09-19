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
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [Cid, setCid] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [payment, setPayment] = useState<'transfer' | 'cod'>('transfer');
  const searchParams = useSearchParams();
  const type = searchParams.get('type');

  const totalPrice = cartItems.reduce((sum, item) => sum + item.Pprice * item.quantity, 0);
  const shippingFee = totalPrice >= 1000 ? 0 : 50;
  const grandTotal = totalPrice + shippingFee;

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (storedUser && storedUser.Cid) {
      setUser(storedUser as User);
      setCid(storedUser.Cid);
    }

    if (type === 'buynow') {
      const data = JSON.parse(localStorage.getItem('buynow') || '{}');
      if (data?.pid) {
        fetch(`http://localhost:3000/product/${data.pid}`)
          .then(res => res.json())
          .then(product => {
            setCartItems([{
              Pid: product.Pid,
              Pname: product.Pname,
              Ppicture: product.Ppicture.split(',')[0],
              Pprice: product.Pprice,
              quantity: data.qty || 1
            }]);
          });
      }
    } else {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]') as CartItem[];
      setCartItems(cart);
    }
  }, []);

  const handleOrder = async () => {
    if (!Cid || cartItems.length === 0) {
      alert('ไม่มีข้อมูลลูกค้าหรือสินค้า');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('http://localhost:3000/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Cid,
          payment,
          shippingFee,
          totalPrice: grandTotal, // ✅ ส่งรวมสินค้า + ค่าจัดส่ง
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

        if (payment === 'cod') {
          router.push('/me/orders');
        } else {
          router.push(`/payment/${data.orderId}`);
        }

      } else {
        alert(data.message || 'เกิดข้อผิดพลาด');
      }

    } catch (err) {
      alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl pt-36 mx-auto p-6 bg-white text-black">
      <h1 className="text-3xl font-bold mb-6">ยืนยันคำสั่งซื้อ</h1>

      <div className="space-y-3 mb-6">
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

      <h2 className="text-lg font-semibold mb-2">เลือกวิธีชำระเงิน</h2>
      <div className="space-y-2 mb-6">
        <label className="flex items-center space-x-2">
          <input
            type="radio"
            name="payment"
            value="transfer"
            checked={payment === 'transfer'}
            onChange={() => setPayment('transfer')}
          />
          <span>โอนเงินผ่านบัญชีธนาคาร</span>
        </label>
        <label className="flex items-center space-x-2">
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

      <div className="space-y-4 mb-6">
        {cartItems.map((item) => (
          <div key={item.Pid} className="flex items-center gap-4 border-b pb-4">
            <img
              src={`http://localhost:3000${item.Ppicture}`}
              className="w-24 h-24 object-cover rounded"
              alt={item.Pname}
            />
            <div className="flex-grow">
              <p className="font-semibold">{item.Pname}</p>
              <p className="text-sm text-gray-600">
                {item.quantity} x {item.Pprice} = {item.quantity * item.Pprice} บาท
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="text-right space-y-4">
        <div className="text-right space-y-2">
          <p>ยอดสินค้า: {totalPrice.toFixed(2)} บาท</p>
          <p>ค่าจัดส่ง: {shippingFee === 0 ? 'ส่งฟรี' : `${shippingFee} บาท`}</p>
          <p className="text-xl font-bold text-red-600">
            รวมทั้งหมด: {grandTotal.toFixed(2)} บาท
          </p>
        </div>

        <button
          onClick={handleOrder}
          disabled={loading}
          className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
        >
          {loading ? 'กำลังสั่งซื้อ...' : 'ยืนยันคำสั่งซื้อ'}
        </button>
      </div>
    </div>
  );
}
