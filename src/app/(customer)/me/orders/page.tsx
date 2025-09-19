'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

// ✅ กำหนด type สำหรับ User และ Order
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

interface Order {
  Oid: number;
  Odate: string;
  Oprice: number | string;
  Ostatus: string;
}

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}') as User;
    setUser(storedUser);

    if (!storedUser?.Cid) return;

    const fetchOrders = async () => {
      try {
        const res = await fetch(`http://localhost:3000/orders?Cid=${storedUser.Cid}`);
        const data = await res.json();

        const sorted = data.sort((a: Order, b: Order) => b.Oid - a.Oid); // ✅ เรียงใหม่ตรงนี้
        setOrders(sorted);
      } catch (err) {
        console.error('โหลดคำสั่งซื้อผิดพลาด:', err);
      } finally {
        setLoading(false);
      }
    };


    fetchOrders();
  }, []);

  const handleCancel = async (orderId: number) => {
    if (!confirm('ต้องการยกเลิกคำสั่งซื้อนี้ใช่หรือไม่?')) return;

    try {
      const res = await fetch(`http://localhost:3000/orders/${orderId}/cancel`, {
        method: 'PATCH',
      });

      if (!res.ok) throw new Error('ยกเลิกไม่สำเร็จ');

      // ลบออกจากหน้ารายการ หรืออัปเดตสถานะ
      setOrders(prev =>
        prev.map(order =>
          order.Oid === orderId ? { ...order, Ostatus: 'cancelled' } : order
        )
      );
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการยกเลิก');
      console.error(err);
    }
  };
  const [statusFilter, setStatusFilter] = useState('all');

const filteredOrders = statusFilter === 'all'
  ? orders
  : orders.filter(order => order.Ostatus === statusFilter);



  if (loading) return <p className="p-6 text-center">กำลังโหลดข้อมูล...</p>;
  if (!user) return <p className="p-6 text-center text-red-600">ไม่พบข้อมูลผู้ใช้</p>;
  if (orders.length === 0) return <p className="p-6 text-center">ยังไม่มีคำสั่งซื้อ</p>;

  return (
     <>
    <select
      value={statusFilter}
      onChange={(e) => setStatusFilter(e.target.value)}
      className="mb-4 p-2 border rounded"
    >
      <option value="all">📦 ทั้งหมด</option>
      <option value="pending">💰 รอชำระ</option>
      <option value="waiting">⌛ รอตรวจสอบ</option>
      <option value="paid">✅ ชำระแล้ว</option>
      <option value="shipped">📮 จัดส่งแล้ว</option>
      <option value="delivered">📬 ได้รับแล้ว</option>
      <option value="cancelled">❌ ยกเลิก</option>
    </select>
    <div className="max-w-4xl mx-auto p-6 bg-white text-black">
      <h1 className="text-2xl font-bold mb-4">รายการสั่งซื้อของฉัน</h1>

      {filteredOrders.map(order => (
        <div key={order.Oid} className="border-b py-4">
          <p>
            เลขคำสั่งซื้อ:
            <Link href={`/me/orders/${order.Oid}`}>
              <span className="text-blue-600 underline hover:text-blue-800 ml-1">
                #{order.Oid}
              </span>
            </Link>
          </p>



          <p>วันที่สั่งซื้อ: {new Date(order.Odate).toLocaleDateString()}</p>
          <p>ยอดรวม: {Number(order.Oprice).toFixed(2)} บาท</p>
          <p>
            สถานะ:{' '}
            <span
              className={
                order.Ostatus === 'paid'
                  ? 'text-green-600 font-semibold'
                  : order.Ostatus === 'waiting'
                    ? 'text-yellow-600'
                    : order.Ostatus === 'cancelled'
                      ? 'text-red-500 font-semibold'
                      : 'text-gray-600'
              }
            >
              {order.Ostatus}
            </span>
          </p>
          <Link href={`/me/orders/${order.Oid}`}>
            <button className="mt-2 bg-gray-800 text-white px-4 py-1 rounded hover:bg-gray-900">
              ดูรายละเอียด
            </button>
          </Link>
          {order.Ostatus === 'pending' && (
            <button
              onClick={() => handleCancel(order.Oid)}
              className="mt-2 bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600 ml-2"
            >
              ยกเลิกคำสั่งซื้อ
            </button>
          )}

          {order.Ostatus === 'pending' && (
            <Link href={`/payment/${order.Oid}`}>
              <button className="mt-2 bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700">
                แจ้งชำระเงิน
              </button>
            </Link>


          )}
        </div>
      ))}
    </div></>
  );
}
