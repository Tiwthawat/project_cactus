'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from "@/app/lib/apiFetch";

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
  Opayment: string;
}
const API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000";
export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}') as User;
    setUser(storedUser);

    if (!storedUser?.Cid) {
  setLoading(false);
  return;
}


    const fetchOrders = async () => {
      try {
        const res = await apiFetch(`${API}/orders?Cid=${storedUser.Cid}`);
const data = await res.json();


        const sorted = [...data].sort((a: Order, b: Order) => b.Oid - a.Oid);

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
      const res = await apiFetch(`${API}/orders/${orderId}/cancel`, { method: "PATCH" })
      ;

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 text-black">
      <div className="max-w-5xl mx-auto pt-32 p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2 rounded-full text-sm font-semibold mb-4">
            ประวัติการสั่งซื้อ
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4">
            รายการสั่งซื้อของฉัน
          </h1>
        </div>

        {/* Filter Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-2 border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl shadow-md">
              🔍
            </div>
            <h2 className="text-2xl font-bold text-gray-800">กรองรายการ</h2>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full p-3 border-2 border-gray-200 rounded-xl bg-gray-50 focus:border-green-400 focus:outline-none transition-colors text-lg font-semibold"
          >
            <option value="all">📦 ทั้งหมด</option>
            <option value="pending_payment">💰 รอชำระเงิน</option>
            <option value="payment_review">⌛ รอตรวจสอบ</option>
            <option value="paid">✅ ชำระแล้ว</option>
            <option value="shipped">📮 จัดส่งแล้ว</option>
            <option value="delivered">📬 ได้รับแล้ว</option>
            <option value="cancelled">❌ ยกเลิก</option>
          </select>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="bg-white rounded-3xl shadow-2xl px-12 py-20 text-center border-2 border-gray-200 w-full max-w-xl">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-6 text-5xl">
                📦
              </div>
              <p className="text-gray-800 text-3xl font-bold mb-3">ไม่มีรายการสั่งซื้อ</p>
              <p className="text-gray-500 text-lg">ไปเลือกแคคตัสน่ารัก ๆ มาสั่งซื้อกันเถอะ! 🌵💚</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map(order => (
              <div key={order.Oid} className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200 hover:border-green-300 transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Link href={`/me/orders/${order.Oid}`}>
                        <h3 className="text-2xl font-bold text-green-600 hover:text-green-700 cursor-pointer">
                          คำสั่งซื้อ #{order.Oid}
                        </h3>
                      </Link>
                    </div>
                    <div className="space-y-1 text-gray-600">
                      <p className="flex items-center gap-2">
                        <span className="text-lg">📅</span>
                        <span>วันที่สั่งซื้อ: {new Date(order.Odate).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="text-lg">💰</span>
                        <span>ยอดรวม: <span className="font-bold text-green-600">{Number(order.Oprice).toFixed(2)} บาท</span></span>
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="text-lg">💳</span>
                        <span>ชำระแบบ: <span className="font-semibold">{order.Opayment === 'cod' ? 'ชำระปลายทาง (COD)' : 'โอนเงิน'}</span></span>
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className={`px-4 py-2 rounded-xl font-semibold text-sm ${order.Ostatus === 'paid' ? 'bg-green-100 text-green-700 border-2 border-green-300' :
                    order.Ostatus === 'payment_review' ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-300' :
                      order.Ostatus === 'shipped' ? 'bg-blue-100 text-blue-700 border-2 border-blue-300' :
                        order.Ostatus === 'delivered' ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-300' :
                          order.Ostatus === 'cancelled' ? 'bg-red-100 text-red-700 border-2 border-red-300' :
                            'bg-gray-100 text-gray-700 border-2 border-gray-300'
                    }`}>
                    {order.Ostatus === 'shipped' ? '📮 กำลังจัดส่ง' :
                      order.Ostatus === 'paid' ? '✅ ชำระแล้ว' :
                        order.Ostatus === 'payment_review' ? '⌛ รอตรวจสอบ' :
                          order.Ostatus === 'delivered' ? '📬 ได้รับแล้ว' :
                            order.Ostatus === 'cancelled' ? '❌ ยกเลิก' :
                              order.Ostatus === 'pending_payment' ? '💰 รอชำระเงิน' :
                                order.Ostatus}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t-2 border-gray-100">
                  <Link href={`/me/orders/${order.Oid}`} className="flex-1 min-w-[200px]">
                    <button className="w-full bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg">
                      📄 ดูรายละเอียด
                    </button>
                  </Link>

                  {/* Bank Transfer - Pending Payment */}
                  {order.Opayment !== 'cod' && order.Ostatus === 'pending_payment' && (
                    <>
                      <Link href={`/payment/${order.Oid}`} className="flex-1 min-w-[200px]">
                        <button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg">
                          💳 แจ้งชำระเงิน
                        </button>
                      </Link>
                      <button
                        onClick={() => handleCancel(order.Oid)}
                        className="flex-1 min-w-[200px] bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-md hover:shadow-lg"
                      >
                        ❌ ยกเลิกคำสั่งซื้อ
                      </button>
                    </>
                  )}

                  {/* COD - Pending */}
                  {order.Opayment === 'cod' && order.Ostatus === 'pending_payment' && (
                    <div className="flex-1 min-w-[200px] bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-3 text-center">
                      <p className="text-green-700 font-semibold">💵 รอการจัดส่ง (ชำระปลายทาง)</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
