'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Order {
  Oid: number;
  Oprice: number;
  Ostatus: string;
  Odate: string;
  Cname: string;
}


export default function orders() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    fetch('http://localhost:3000/orders/all')

      .then((res) => res.json())
      .then((data) => setOrders(data))
      .catch((err) => {
        console.error("❌ โหลด orders fail:", err);
      });

  }, []);

  const updateStatus = async (Oid: number, newStatus: string) => {
    await fetch(`http://localhost:3000/orders/${Oid}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ Ostatus: newStatus }),
    });


    setOrders((prev) =>
      prev.map((order) =>
        order.Oid === Oid ? { ...order, Ostatus: newStatus } : order
      )
    );
  };
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const filteredOrders = orders.filter((o) =>
    filterStatus === 'all' ? true : o.Ostatus === filterStatus
  );



  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4 text-black">รายการคำสั่งซื้อ</h2>
      <div className="overflow-x-auto"> <div className="mb-4">
        <label className="mr-2 text-black font-medium">กรองตามสถานะ:</label>
        <select
          className="border px-2 py-1 rounded"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">ทั้งหมด</option>
          <option value="pending">pending</option>
          <option value="waiting">waiting</option>
          <option value="paid">paid</option>
          <option value="shipped">shipped</option>
          <option value="delivered">delivered</option>
          <option value="cancelled">cancelled</option>
          <option value="refunded">refunded</option>
          <option value="failed">failed</option>
        </select>
      </div>
        <table className="min-w-full bg-white border border-gray-300">
          <thead>



            <tr className="bg-gray-100 text-black">

              <th className="p-2 border">รหัส</th>
              <th className="p-2 border">ลูกค้า</th>
              <th className="p-2 border">ยอดรวม</th>
              <th className="p-2 border">สถานะ</th>
              <th className="p-2 border">เปลี่ยนสถานะ</th>
              <th className="p-2 border">ดูรายละเอียด</th>
            </tr>
          </thead>

          <tbody>
            {filteredOrders.map((o) => (
              <tr key={o.Oid} className="text-black">
                <td className="p-2 border text-center">{o.Oid}</td>
                <td className="p-2 border">{o.Cname}</td>
                <td className="p-2 border text-right">{o.Oprice} บาท</td>
                <td className="p-2 border text-center">
                  <Link href={`/admin/orders/${o.Oid}`}>
                    <button className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">
                      ดูรายละเอียด
                    </button>
                  </Link>
                </td>

                <td className="p-2 border text-center">

                  <span
                    className={`px-2 py-1 rounded text-sm font-medium
    ${o.Ostatus === 'pending' ? 'bg-gray-200 text-gray-800' : ''}
    ${o.Ostatus === 'waiting' ? 'bg-yellow-100 text-yellow-800' : ''}
    ${o.Ostatus === 'paid' ? 'bg-green-100 text-green-800' : ''}
    ${o.Ostatus === 'shipped' ? 'bg-blue-100 text-blue-800' : ''}
    ${o.Ostatus === 'delivered' ? 'bg-emerald-100 text-emerald-800' : ''}
    ${o.Ostatus === 'cancelled' ? 'bg-red-100 text-red-800' : ''}
    ${o.Ostatus === 'refunded' ? 'bg-indigo-100 text-indigo-800' : ''}
    ${o.Ostatus === 'failed' ? 'bg-rose-100 text-rose-800' : ''}
  `}
                  >
                    {o.Ostatus}
                  </span>

                </td>
                <td className="p-2 border text-center">
                  <select
                    className={`
    px-2 py-1 rounded border text-sm font-medium
    ${o.Ostatus === 'pending' ? 'bg-gray-200 text-gray-800' : ''}
    ${o.Ostatus === 'waiting' ? 'bg-yellow-100 text-yellow-800' : ''}
    ${o.Ostatus === 'paid' ? 'bg-green-100 text-green-800' : ''}
    ${o.Ostatus === 'shipped' ? 'bg-blue-100 text-blue-800' : ''}
    ${o.Ostatus === 'delivered' ? 'bg-emerald-100 text-emerald-800' : ''}
    ${o.Ostatus === 'cancelled' ? 'bg-red-100 text-red-800' : ''}
    ${o.Ostatus === 'refunded' ? 'bg-indigo-100 text-indigo-800' : ''}
    ${o.Ostatus === 'failed' ? 'bg-rose-100 text-rose-800' : ''}
  `}
                    value={o.Ostatus}
                    onChange={(e) => updateStatus(o.Oid, e.target.value)}
                  >
                    <option value="pending">pending</option>
                    <option value="waiting">waiting</option>
                    <option value="paid">paid</option>
                    <option value="shipped">shipped</option>
                    <option value="delivered">delivered</option>
                    <option value="cancelled">cancelled</option>
                    <option value="refunded">refunded</option>
                    <option value="failed">failed</option>
                  </select>

                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
