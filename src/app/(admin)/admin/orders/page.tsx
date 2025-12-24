'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Order {
  Oid: number;
  Oprice: number;
  Ostatus: string;
  Odate: string;
  Cname: string;
  Opayment: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPay, setFilterPay] = useState<string>('all');

  useEffect(() => {
    fetch('http://localhost:3000/orders/all')
      .then((res) => res.json())
      .then((data) => setOrders(data))
      .catch((err) => {
        console.error('❌ โหลด orders fail:', err);
      });
  }, []);

  const updateStatus = async (Oid: number, newStatus: string) => {
    await fetch(`http://localhost:3000/orders/${Oid}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50">
      <div className="p-6 pt-8">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-block bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2 rounded-full text-sm font-semibold mb-4">
            จัดการออเดอร์
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            📦 รายการคำสั่งซื้อ
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">กรองตามสถานะ:</label>
              <select
                className="w-full p-3 border-2 border-gray-200 rounded-xl bg-gray-50 focus:border-green-400 focus:outline-none transition-colors text-lg font-semibold"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">📦 ทั้งหมด</option>
                <option value="pending_payment">💰 รอชำระเงิน</option>
                <option value="payment_review">⌛ ตรวจสอบสลิป</option>
                <option value="paid">✅ ชำระเงินแล้ว</option>
                <option value="shipping">🚚 กำลังจัดส่ง</option>
                <option value="delivered">📬 จัดส่งสำเร็จ</option>
                <option value="cancelled">❌ ยกเลิก</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2">ชำระโดย:</label>
              <select
                className="w-full p-3 border-2 border-gray-200 rounded-xl bg-gray-50 focus:border-green-400 focus:outline-none transition-colors text-lg font-semibold"
                value={filterPay}
                onChange={(e) => setFilterPay(e.target.value)}
              >
                <option value="all">💳 ทั้งหมด</option>
                <option value="transfer">🏦 โอนเงิน</option>
                <option value="cod">💵 COD</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders Table Card */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                  <th className="p-4 text-left">รหัส</th>
                  <th className="p-4 text-left">ลูกค้า</th>
                  <th className="p-4 text-right">ยอดรวม</th>
                  <th className="p-4 text-center">ชำระโดย</th>
                  <th className="p-4 text-center">วันที่</th>
                  <th className="p-4 text-center">สถานะ</th>
                  <th className="p-4 text-center">เปลี่ยนสถานะ</th>
                  <th className="p-4 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((o: Order) => {
                  const oid = o.Oid;
                  const code = makeCode('ord', oid);

                  return (
                    <tr key={oid} className="border-b border-gray-200 hover:bg-green-50 transition-colors">
                      <td className="p-4 font-mono text-sm bg-gray-50">{code}</td>
                      <td className="p-4 font-semibold text-gray-800">{o.Cname}</td>
                      <td className="p-4 text-right font-semibold text-green-600">{o.Oprice} บาท</td>
                      <td className="p-4 text-center">
                        {o.Opayment === 'transfer' ? (
                          <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-700 border-2 border-blue-300">
                            🏦 โอนเงิน
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-sm font-semibold bg-orange-100 text-orange-700 border-2 border-orange-300">
                            💵 COD
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center text-gray-600">
                        {new Date(o.Odate).toLocaleDateString('th-TH')}
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${o.Ostatus === 'pending_payment'
                            ? 'bg-gray-100 text-gray-700 border-2 border-gray-300'
                            : o.Ostatus === 'payment_review'
                              ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-300'
                              : o.Ostatus === 'paid'
                                ? 'bg-green-100 text-green-700 border-2 border-green-300'
                                : o.Ostatus === 'shipping'
                                  ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                                  : o.Ostatus === 'delivered'
                                    ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-300'
                                    : 'bg-red-100 text-red-700 border-2 border-red-300'
                            }`}
                        >
                          {o.Ostatus}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <select
                          className="p-2 rounded-lg border-2 border-gray-200 text-sm bg-white focus:border-green-400 focus:outline-none transition-colors"
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
                      <td className="p-4 text-center">
                        <Link href={`/admin/orders/${oid}`}>
                          <button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300 shadow-md hover:shadow-lg">
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
      </div>
    </div>
  );
}
