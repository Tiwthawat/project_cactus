'use client';
import { apiFetch } from '@/app/lib/apiFetch';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Order {
  Oid: number;
  Oprice: number;
  Ostatus: string;
  Odate: string;
  Cname: string;
  Opayment: string; // ⭐ เพิ่มสำหรับโอน / cod
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPay, setFilterPay] = useState<string>('all');


 useEffect(() => {
  const load = async () => {
    try {
      const res = await apiFetch('http://localhost:3000/orders/all');
      if (!res.ok) {
        setOrders([]);
        return;
      }
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('❌ โหลด orders fail:', err);
      setOrders([]);
    }
  };
  load();
}, []);


  const updateStatus = async (Oid: number, newStatus: string) => {
    await apiFetch(`http://localhost:3000/orders/${Oid}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus }),
    });

    setOrders((prev) =>
      prev.map((order) =>
        order.Oid === Oid ? { ...order, Ostatus: newStatus } : order
      )
    );
  };



  const makeCode = (prefix: string, id: number) =>
    `${prefix}:${String(id).padStart(4, '0')}`;

  const filteredOrders = orders.filter((o) => {
  const matchStatus = filterStatus === 'all' ? true : o.Ostatus === filterStatus;
  const matchPay = filterPay === 'all' ? true : o.Opayment === filterPay;
  return matchStatus && matchPay;
});


  return (
    <div className="p-6 text-black">
      <h2 className="text-2xl font-bold mb-4">รายการคำสั่งซื้อ</h2>

      {/* ฟิลเตอร์สถานะ */}
      <div className="mb-4">
        <label className="mr-2 font-medium">กรองตามสถานะ:</label>
        <select
          className="border bg-white px-2 py-1 rounded"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">ทั้งหมด</option>
          <option value="pending_payment">รอชำระเงิน</option>
          <option value="payment_review">ตรวจสอบสลิป</option>
          <option value="paid">ชำระเงินแล้ว</option>
          <option value="shipping">กำลังจัดส่ง</option>
          <option value="delivered">จัดส่งสำเร็จ</option>
          <option value="cancelled">ยกเลิก</option>
        </select>

        
      </div><div>
          <label className="mr-2 font-medium">ชำระโดย:</label>
          <select
            className="border bg-white px-2 py-1 rounded"
            value={filterPay}
            onChange={(e) => setFilterPay(e.target.value)}
          >
            <option value="all">ทั้งหมด</option>
            <option value="transfer">โอนเงิน</option>
            <option value="cod">COD</option>
          </select>
        </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">รหัส</th>
              <th className="p-2 border">ลูกค้า</th>
              <th className="p-2 border">ยอดรวม</th>
              <th className="p-2 border">ชำระโดย</th>
              <th className="p-2 border">วันที่</th>
              <th className="p-2 border">สถานะ</th>
              <th className="p-2 border">เปลี่ยนสถานะ</th>
              <th className="p-2 border">ดูรายละเอียด</th>
            </tr>
          </thead>

          <tbody>
            {filteredOrders.map((o: Order) => {
              const oid = o.Oid;
              const code = makeCode('ord', oid);

              return (
                <tr key={oid}>
                  {/* รหัส */}
                  <td className="p-2 border text-center font-mono text-sm">
                    {code}
                  </td>

                  {/* ลูกค้า */}
                  <td className="p-2 border">{o.Cname}</td>

                  {/* ยอดรวม */}
                  <td className="p-2 border text-right">{o.Oprice} บาท</td>

                  {/* ⭐ วิธีชำระ */}
                  <td className="p-2 border text-center font-medium">
                    {o.Opayment === 'transfer' ? (
                      <span className="text-blue-700">โอนเงิน</span>
                    ) : (
                      <span className="text-orange-700">COD</span>
                    )}
                  </td>

                  {/* วันที่ */}
                  <td className="p-2 border text-center text-sm text-gray-600">
                    {new Date(o.Odate).toLocaleDateString('th-TH')}
                  </td>

                  {/* สถานะ */}
                  <td className="p-2 border text-center">
                    <span
                      className={`px-2 py-1 rounded text-sm font-medium ${o.Ostatus === 'pending_payment'
                          ? 'bg-gray-200 text-gray-800'
                          : o.Ostatus === 'payment_review'
                            ? 'bg-yellow-100 text-yellow-800'
                            : o.Ostatus === 'paid'
                              ? 'bg-green-100 text-green-800'
                              : o.Ostatus === 'shipping'
                                ? 'bg-blue-100 text-blue-800'
                                : o.Ostatus === 'delivered'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-red-100 text-red-800'
                        }`}
                    >
                      {o.Ostatus}
                    </span>
                  </td>

                  {/* เปลี่ยนสถานะ */}
                  <td className="p-2 border text-center">
                    <select
                      className="px-2 py-1 rounded border text-sm bg-white"
                      value={o.Ostatus}
                      onChange={(e) => updateStatus(oid, e.target.value)}
                    >
                      <option value="pending_payment">รอชำระเงิน</option>
                      <option value="payment_review">ตรวจสอบสลิป</option>
                      <option value="paid">ชำระเงินแล้ว</option>
                      <option value="shipping">กำลังจัดส่ง</option>
                      <option value="delivered">จัดส่งสำเร็จ</option>
                      <option value="cancelled">ยกเลิก</option>
                    </select>
                  </td>

                  {/* ปุ่มดูรายละเอียด */}
                  <td className="p-2 border text-center">
                    <Link href={`/admin/orders/${oid}`}>
                      <button className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">
                        ดูรายละเอียด
                      </button>
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>

        </table>
      </div>
    </div>
  );
}
